import InstanceSkel = require('../../../instance_skel')
import { CompanionFeedback, CompanionInputFieldColor, CompanionFeedbacks } from '../../../instance_skel_types'
import { X32Config } from './config'
import { X32State } from './state'

type CompanionFeedbackWithCallback = CompanionFeedback & Required<Pick<CompanionFeedback, 'callback'>>

export enum FeedbackId {
  Dummy = ''
}

export function ForegroundPicker(color: number): CompanionInputFieldColor {
  return {
    type: 'colorpicker',
    label: 'Foreground color',
    id: 'fg',
    default: color
  }
}
export function BackgroundPicker(color: number): CompanionInputFieldColor {
  return {
    type: 'colorpicker',
    label: 'Background color',
    id: 'bg',
    default: color
  }
}

// function getOptColors(evt: CompanionFeedbackEvent): CompanionFeedbackResult {
//   return {
//     color: Number(evt.options.fg),
//     bgcolor: Number(evt.options.bg)
//   }
// }

export function GetFeedbacksList(_instance: InstanceSkel<X32Config>, _state: X32State): CompanionFeedbacks {
  const feedbacks: { [id in FeedbackId]: CompanionFeedbackWithCallback | undefined } = {
    [FeedbackId.Dummy]: undefined
  }

  return feedbacks
}
