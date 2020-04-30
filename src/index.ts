import InstanceSkel = require('../../../instance_skel')
import { CompanionActionEvent, CompanionConfigField, CompanionSystem } from '../../../instance_skel_types'
import { GetActionsList, HandleAction } from './actions'
import { X32Config, GetConfigFields } from './config'
import { FeedbackId, GetFeedbacksList } from './feedback'
import { GetPresetsList } from './presets'
import { InitVariables } from './variables'
import { X32State } from './state'
import * as osc from 'osc'

/**
 * Companion instance class for the Blackmagic ATEM Switchers.
 */
class X32Instance extends InstanceSkel<X32Config> {
  private osc: osc.UDPPort
  private x32State: X32State
  private initDone: boolean

  /**
   * Create an instance of an ATEM module.
   */
  constructor(system: CompanionSystem, id: string, config: X32Config) {
    super(system, id, config)

    this.osc = new osc.UDPPort({
      localAddress: '0.0.0.0',
      localPort: 12321,
      broadcast: true,
      metadata: true
    })

    this.x32State = new X32State()

    this.initDone = false
  }

  // Override base types to make types stricter
  public checkFeedbacks(feedbackId?: FeedbackId, ignoreInitDone?: boolean): void {
    if (ignoreInitDone || this.initDone) {
      super.checkFeedbacks(feedbackId)
    }
  }

  /**
   * Main initialization function called once the module
   * is OK to start doing things.
   */
  public init(): void {
    this.status(this.STATUS_OK) // Stateless connection here

    this.updateCompanionBits()
  }

  /**
   * Process an updated configuration array.
   */
  public updateConfig(config: X32Config): void {
    this.config = config

    this.x32State = new X32State()
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
    this.debug('destroy', this.id)
  }

  private updateCompanionBits(): void {
    InitVariables(this, this.x32State)
    this.setPresetDefinitions(GetPresetsList(this, this.x32State))
    this.setFeedbackDefinitions(GetFeedbacksList(this, this.x32State))
    this.setActions(GetActionsList(this, this.x32State))
    this.checkFeedbacks()
  }
}

export = X32Instance
