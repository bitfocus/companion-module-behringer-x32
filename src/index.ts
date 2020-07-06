import InstanceSkel = require('../../../instance_skel')
import { CompanionConfigField, CompanionSystem } from '../../../instance_skel_types'
import { GetActionsList } from './actions'
import { X32Config, GetConfigFields } from './config'
import { FeedbackId, GetFeedbacksList } from './feedback'
import { GetPresetsList } from './presets'
import { InitVariables, updateDeviceInfoVariables, updateNameVariables } from './variables'
import { X32State, X32Subscriptions } from './state'
import * as osc from 'osc'
import { MainPath } from './paths'
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
  private x32Subscriptions: X32Subscriptions

  /** Ping the x32 at a regular interval to tell it to keep sending us info, and for us to check it is still there */
  private heartbeat: NodeJS.Timer | undefined
  /** Delay a reconnect a few seconds after an error, or monitor the ping for lack of response */
  private reconnectTimer: NodeJS.Timer | undefined
  /** Once we have an osc socket ready, we send /xinfo on repeat until we get a response */
  private syncInterval: NodeJS.Timer | undefined

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
    this.x32Subscriptions = new X32Subscriptions()

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
    this.x32Subscriptions = new X32Subscriptions()

    if (this.config.host !== undefined) {
      try {
        this.osc.close()
      } catch (e) {
        // Ignore
      }

      this.status(this.STATUS_WARNING, 'Connecting')
      this.setupOscSocket()
    }
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
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer)
      this.reconnectTimer = undefined
    }
    if (this.syncInterval) {
      clearInterval(this.syncInterval)
      this.syncInterval = undefined
    }

    if (this.heartbeat) {
      clearInterval(this.heartbeat)
      this.heartbeat = undefined
    }

    if (this.osc) {
      try {
        this.osc.close()
      } catch (e) {
        // Ignore
      }
      delete this.osc
    }

    this.debug('destroy', this.id)
  }

  private updateCompanionBits(): void {
    InitVariables(this, this.x32State)
    this.setPresetDefinitions(GetPresetsList(this, this.x32State))
    this.setFeedbackDefinitions(GetFeedbacksList(this, this.osc, this.x32State, this.x32Subscriptions))
    this.setActions(GetActionsList(this, this.osc, this.x32State))
    this.checkFeedbacks()

    updateNameVariables(this, this.x32State)

    // Ensure all feedbacks & actions have an initial value
    this.subscribeFeedbacks()
    this.subscribeActions()
  }

  private pulse(): void {
    try {
      this.osc.send({
        address: '/xremote',
        args: []
      })

      if (!this.syncInterval) {
        // Once handshaked, poll something with a response
        this.osc.send({ address: '/xinfo', args: [] })
        if (!this.reconnectTimer) {
          this.reconnectTimer = setTimeout(() => {
            // Timed out
            this.reconnectTimer = undefined
            this.setupOscSocket()
          }, 5000)
        }
      }
    } catch (e) {
      // Ignore
    }
  }

  private setupOscSocket(): void {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if (!(this.config as any).enabled) {
      // This is disabled, so don't try and setup a socket
      return
    }

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

      if (this.heartbeat) {
        clearInterval(this.heartbeat)
        this.heartbeat = undefined
      }

      if (!this.reconnectTimer) {
        this.reconnectTimer = setTimeout(() => {
          if (this.syncInterval) {
            clearInterval(this.syncInterval)
            this.syncInterval = undefined
          }

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

      const doSync = (): void => {
        if (this.osc) {
          try {
            this.osc.send({ address: '/xinfo', args: [] })
            this.osc.send({ address: '/-snap/name', args: [] })
            this.osc.send({ address: '/-snap/index', args: [] })
          } catch (e) {
            // Ignore
          }
        }
      }
      if (!this.syncInterval) {
        this.syncInterval = setInterval(doSync, 2000)
      }
      doSync()

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

          if (this.reconnectTimer) {
            // Clear the timer, as it is alive
            clearTimeout(this.reconnectTimer)
            this.reconnectTimer = undefined
          }

          if (this.syncInterval) {
            // Sync success, stop the interval
            clearInterval(this.syncInterval)
            this.syncInterval = undefined

            // Load the initial data
            this.loadVariablesData()
            updateDeviceInfoVariables(this, args)
          }
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

        // console.log('starting request', path)

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

    for (const fb of this.x32Subscriptions.getFeedbacks(msg.address)) {
      this.checkFeedbacks(fb)
    }

    if (msg.address.match('/config/name$') || msg.address.match('/fader$')) {
      this.debounceUpdateCompanionBits()
    }
  }
}

export = X32Instance
