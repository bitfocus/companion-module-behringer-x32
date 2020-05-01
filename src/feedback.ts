import {
  CompanionFeedback,
  CompanionInputFieldColor,
  CompanionFeedbacks,
  CompanionFeedbackEvent,
  CompanionFeedbackResult
} from '../../../instance_skel_types'
import { X32State } from './state'
import { GetTargetChoices } from './choices'
import { ensureLoaded, assertUnreachable } from './util'
import { MutePath } from './paths'
import * as osc from 'osc'
import InstanceSkel = require('../../../instance_skel')
import { X32Config } from './config'

type CompanionFeedbackWithCallback = CompanionFeedback & Required<Pick<CompanionFeedback, 'callback'>>

export enum FeedbackId {
  Mute = 'mute'
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

function getOptColors(evt: CompanionFeedbackEvent): CompanionFeedbackResult {
  return {
    color: Number(evt.options.fg),
    bgcolor: Number(evt.options.bg)
  }
}

function getDataNumber(data: osc.MetaArgument[] | undefined, index: number): number | undefined {
  const val = data ? data[index] : undefined
  return val?.type === 'i' || val?.type === 'f' ? val.value : undefined
}

export function GetFeedbacksList(
  self: InstanceSkel<X32Config>,
  oscSocket: osc.UDPPort,
  state: X32State
): CompanionFeedbacks {
  const mutableChannels = GetTargetChoices(state)
  const feedbacks: { [id in FeedbackId]: CompanionFeedbackWithCallback | undefined } = {
    [FeedbackId.Mute]: {
      label: 'Change colors from mute state',
      description: 'If the specified target is muted, change color of the bank',
      options: [
        BackgroundPicker(self.rgb(255, 0, 0)),
        ForegroundPicker(self.rgb(0, 0, 0)),
        {
          id: 'target',
          type: 'dropdown',
          label: 'Target',
          choices: mutableChannels,
          default: mutableChannels[0].id
        },
        {
          id: 'state',
          type: 'checkbox',
          label: 'Muted',
          default: true
        }
      ],
      callback: (evt: CompanionFeedbackEvent): CompanionFeedbackResult => {
        const data = state.get(MutePath(evt.options.target as string))
        console.log(data, MutePath(evt.options.target as string))
        const muted = getDataNumber(data, 0) === 0
        if (muted === !!evt.options.state) {
          return getOptColors(evt)
        }
        return {}
      },
      subscribe: (evt: CompanionFeedbackEvent): void => {
        ensureLoaded(oscSocket, state, MutePath(evt.options.target as string))
      }
    }
  }

  return feedbacks
}

export function GetFeedbackPath(evt: CompanionFeedbackEvent): string | null {
  const feedbackId = evt.type as FeedbackId
  switch (feedbackId) {
    case FeedbackId.Mute:
      return MutePath(evt.options.target as string)
    default:
      assertUnreachable(feedbackId)
      return null
  }
}
