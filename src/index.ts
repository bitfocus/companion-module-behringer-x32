import InstanceSkel = require('../../../instance_skel')
import { CompanionActionEvent, CompanionConfigField, CompanionSystem } from '../../../instance_skel_types'
import { GetActionsList, HandleAction } from './actions'
import { X32Config, GetConfigFields } from './config'
import { FeedbackId, GetFeedbacksList, GetFeedbackPath } from './feedback'
import { GetPresetsList } from './presets'
import { InitVariables, updateDeviceInfoVariables } from './variables'
import { X32State } from './state'
import * as osc from 'osc'
import { ensureLoaded } from './util'
import { MutePath } from './paths'

/**
 * Companion instance class for the Blackmagic ATEM Switchers.
 */
class X32Instance extends InstanceSkel<X32Config> {
  private osc: osc.UDPPort
  private x32State: X32State
  private isActive: boolean

  private heartbeat: NodeJS.Timer | undefined

  /**
   * Create an instance of an ATEM module.
   */
  constructor(system: CompanionSystem, id: string, config: X32Config) {
    super(system, id, config)

    this.osc = new osc.UDPPort({})

    this.x32State = new X32State()

    this.isActive = false
  }

  // Override base types to make types stricter
  public checkFeedbacks(feedbackId?: FeedbackId): void {
    console.log('fb check', feedbackId)
    super.checkFeedbacks(feedbackId)
  }

  /**
   * Main initialization function called once the module
   * is OK to start doing things.
   */
  public init(): void {
    this.isActive = true
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
    this.isActive = false

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

    for (const fb of this.getAllFeedbacks()) {
      const path = GetFeedbackPath(fb)
      if (path) {
        ensureLoaded(this.osc, this.x32State, path)
      }
    }
  }

  private pulse(): void {
    console.log('pulse')
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
      if (this.heartbeat !== undefined) {
        clearInterval(this.heartbeat)
        this.heartbeat = undefined
      }
    })
    this.osc.on('ready', () => {
      this.pulse()
      this.heartbeat = setInterval(() => {
        this.pulse()
      }, 9500)

      // TODO get initial state
      this.osc.send({ address: '/xinfo', args: [] })
      this.osc.send({ address: '/-snap/name', args: [] })
      this.osc.send({ address: '/-snap/index', args: [] })

      this.status(this.STATUS_OK)
      this.isActive = true
    })

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    this.osc.on('close' as any, () => {
      if (this.heartbeat !== undefined) {
        clearInterval(this.heartbeat)
        this.heartbeat = undefined
      }
    })

    this.osc.on('message', (message): void => {
      console.log('Message', message)
      const args = message.args as osc.MetaArgument[]
      this.checkFeedbackChanges(message)

      switch (message.address) {
        case '/xinfo':
          updateDeviceInfoVariables(this, args)
          break
      }
    })

    this.osc.open()
  }

  private checkFeedbackChanges(msg: osc.OscMessage): void {
    const args = msg.args as osc.MetaArgument[]
    this.x32State.set(msg.address, args)

    if (msg.address.match(MutePath('^/([a-z]+)/([0-9]+)')) || msg.address.match(MutePath('^/dca/[0-9]+'))) {
      this.checkFeedbacks(FeedbackId.Mute)
    }

    // TODO
  }
}

export = X32Instance
