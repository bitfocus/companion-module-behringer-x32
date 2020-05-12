import InstanceSkel = require('../../../instance_skel')
import { CompanionActionEvent, CompanionConfigField, CompanionSystem } from '../../../instance_skel_types'
import { GetActionsList, HandleAction } from './actions'
import { X32Config, GetConfigFields } from './config'
import { FeedbackId, GetFeedbacksList } from './feedback'
import { GetPresetsList } from './presets'
import { InitVariables, updateDeviceInfoVariables, updateNameVariables } from './variables'
import { X32State } from './state'
import * as osc from 'osc'
import { MutePath, MainPath } from './paths'
import { upgradeV2x0x0 } from './migrations'
import { GetTargetChoices } from './choices'
import * as debounceFn from 'debounce-fn'
import PQueue from 'p-queue'

/**
 * Companion instance class for the Behringer X32 Mixers.
 */
class X32Instance extends InstanceSkel<X32Config> {
  private osc: osc.UDPPort
  private x32State: X32State

  private heartbeat: NodeJS.Timer | undefined
  private reconnectTimer: NodeJS.Timer | undefined

  private readonly debounceUpdateCompanionBits: () => void
  private readonly requestQueue: PQueue = new PQueue({
    concurrency: 20,
    timeout: 500,
    throwOnTimeout: true
  })
  private inFlightRequests: { [path: string]: () => void } = {}

  /**
   * Create an instance of an X32 module.
   */
  constructor(system: CompanionSystem, id: string, config: X32Config) {
    super(system, id, config)

    // HACK: for testing upgrade script
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    // ;(config as any)._configIdx = -1

    this.osc = new osc.UDPPort({})

    this.x32State = new X32State()

    this.addUpgradeScript(() => false) // Previous version had a script
    this.addUpgradeScript(upgradeV2x0x0)

    this.debounceUpdateCompanionBits = debounceFn(this.updateCompanionBits, {
      wait: 100,
      immediate: false
    })
  }

  // Override base types to make types stricter
  public checkFeedbacks(feedbackId?: FeedbackId): void {
    super.checkFeedbacks(feedbackId)
  }

  /**
   * Main initialization function called once the module
   * is OK to start doing things.
   */
  public init(): void {
    this.status(this.STATUS_UNKNOWN)
    this.setupOscSocket()

    this.updateCompanionBits()
  }

  /**
   * Process an updated configuration array.
   */
  public updateConfig(config: X32Config): void {
    this.config = config

    this.x32State = new X32State()

    if (this.config.host !== undefined) {
      this.osc.close()

      this.status(this.STATUS_WARNING, 'Connecting')
      this.setupOscSocket()
    }
  }

  /**
   * Executes the provided action.
   */
  public action(action: CompanionActionEvent): void {
    HandleAction(this, this.osc, this.x32State, action)
  }

  /**
   * Creates the configuration fields for web config.
   */
  // eslint-disable-next-line @typescript-eslint/camelcase
  public config_fields(): CompanionConfigField[] {
    return GetConfigFields(this)
  }

  /**
   * Clean up the instance before it is destroyed.
   */
  public destroy(): void {
    if (this.osc) {
      this.osc.close()
      delete this.osc
    }

    this.debug('destroy', this.id)
  }

  private updateCompanionBits(): void {
    InitVariables(this, this.x32State)
    this.setPresetDefinitions(GetPresetsList(this, this.x32State))
    this.setFeedbackDefinitions(GetFeedbacksList(this, this.osc, this.x32State))
    this.setActions(GetActionsList(this, this.x32State))
    this.checkFeedbacks()

    updateNameVariables(this, this.x32State)

    // Ensure all feedbacks have an initial value
    this.subscribeFeedbacks()
  }

  private pulse(): void {
    this.osc.send({
      address: '/xremote',
      args: []
    })
  }

  private setupOscSocket(): void {
    this.status(this.STATUS_WARNING, 'Connecting')

    this.osc = new osc.UDPPort({
      localAddress: '0.0.0.0',
      localPort: 0,
      broadcast: true,
      metadata: true,
      remoteAddress: this.config.host,
      remotePort: 10023
    })

    this.osc.on('error', (err: Error): void => {
      this.log('error', `Error: ${err.message}`)
      this.status(this.STATUS_ERROR, err.message)
      this.requestQueue.clear()
      this.inFlightRequests = {}

      if (this.heartbeat !== undefined) {
        clearInterval(this.heartbeat)
        this.heartbeat = undefined
      }

      if (!this.reconnectTimer) {
        this.reconnectTimer = setTimeout(() => {
          this.reconnectTimer = undefined
          this.setupOscSocket()
        }, 2000)
      }
    })
    this.osc.on('ready', () => {
      this.pulse()
      this.heartbeat = setInterval(() => {
        this.pulse()
      }, 1500)

      this.requestQueue.clear()
      this.inFlightRequests = {}

      this.osc.send({ address: '/xinfo', args: [] })
      this.osc.send({ address: '/-snap/name', args: [] })
      this.osc.send({ address: '/-snap/index', args: [] })

      this.status(this.STATUS_WARNING, 'Syncing')
    })

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    this.osc.on('close' as any, () => {
      if (this.heartbeat !== undefined) {
        clearInterval(this.heartbeat)
        this.heartbeat = undefined
      }
    })

    this.osc.on('message', (message): void => {
      // console.log('Message', message)
      const args = message.args as osc.MetaArgument[]
      this.checkFeedbackChanges(message)

      if (this.inFlightRequests[message.address]) {
        this.inFlightRequests[message.address]()
        delete this.inFlightRequests[message.address]
      }

      switch (message.address) {
        case '/xinfo':
          this.status(this.STATUS_OK)
          this.loadVariablesData()
          updateDeviceInfoVariables(this, args)
          break
      }
    })

    this.osc.open()
  }

  private loadVariablesData(): void {
    const targets = GetTargetChoices(this.x32State, { includeMain: true, defaultNames: true })
    for (const target of targets) {
      this.queueOscRequest(`${target.id}/config/name`)
      this.queueOscRequest(`${MainPath(target.id as string)}/fader`)
    }
  }

  private queueOscRequest(path: string): void {
    this.requestQueue
      .add(async () => {
        if (this.inFlightRequests[path]) {
          this.debug(`Ignoring request "${path}" as one in flight`)
          return
        }

        console.log('starting request', path)

        const p = new Promise(resolve => {
          this.inFlightRequests[path] = resolve
        })

        this.osc.send({
          address: path,
          args: []
        })

        await p
      })
      .catch(() => {
        delete this.inFlightRequests[path]
        this.log('error', `Request failed for "${path}"`)
      })
  }

  private checkFeedbackChanges(msg: osc.OscMessage): void {
    const args = msg.args as osc.MetaArgument[]
    this.x32State.set(msg.address, args)

    if (
      msg.address.match(MutePath('^/([a-z]+)/([0-9]+)')) ||
      msg.address.match(MutePath('^/dca/([0-9]+)')) ||
      msg.address.match(MutePath('^/main/([a-z]+)'))
    ) {
      this.checkFeedbacks(FeedbackId.Mute)
    }
    if (
      msg.address.match('^/([a-z]+)/([0-9]+)/mix/([0-9]+)/on') ||
      msg.address.match('^/([a-z]+)/([0-9]+)/mix/(st|mono)')
    ) {
      this.checkFeedbacks(FeedbackId.MuteChannelSend)
    }

    if (msg.address.match('^/config/mute/([0-9]+)')) {
      this.checkFeedbacks(FeedbackId.MuteGroup)
    }

    if (msg.address.match('/config/name$') || msg.address.match('/fader$')) {
      this.debounceUpdateCompanionBits()
    }
  }
}

export = X32Instance
