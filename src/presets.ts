import InstanceSkel = require('../../../instance_skel')
import { CompanionPreset } from '../../../instance_skel_types'
import { ActionId } from './actions'
import { X32Config } from './config'
import { FeedbackId } from './feedback'
import { X32State } from './state'

interface CompanionPresetExt extends CompanionPreset {
  feedbacks: Array<
    {
      type: FeedbackId
    } & CompanionPreset['feedbacks'][0]
  >
  actions: Array<
    {
      action: ActionId
    } & CompanionPreset['actions'][0]
  >
}

export function GetPresetsList(_instance: InstanceSkel<X32Config>, _state: X32State): CompanionPreset[] {
  const presets: CompanionPresetExt[] = []

  return presets
}
