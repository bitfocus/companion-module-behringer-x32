import InstanceSkel = require('../../../instance_skel')
import { CompanionAction, CompanionActionEvent, CompanionActions } from '../../../instance_skel_types'
import { X32State } from './state'
import { X32Config } from './config'
import { dbToFloat, ensureLoaded, trimToFloat, headampGainToFloat } from './util'
import {
  CHOICES_TAPE_FUNC,
  CHOICES_COLOR,
  GetTargetChoices,
  MUTE_TOGGLE,
  GetMuteGroupChoices,
  CHOICES_MUTE_GROUP,
  GetChannelSendChoices,
  convertChoices,
  CHOICES_ON_OFF,
  GetBusSendChoices,
  FaderLevelChoice,
  MuteChoice,
  HeadampGainChoice,
  GetHeadampChoices,
  GetOscillatorDestinations
} from './choices'
import * as osc from 'osc'
import { MutePath, MainPath } from './paths'

export enum ActionId {
  Mute = 'mute',
  MuteGroup = 'mute_grp',
  MuteChannelSend = 'mute_channel_send',
  MuteBusSend = 'mute_bus_send',
  FaderLevel = 'fad',
  ChannelSendLevel = 'level_channel_send',
  BusSendLevel = 'level_bus_send',
  InputTrim = 'input_trim',
  // InputGain = 'input_gain',
  HeadampGain = 'headamp_gain',
  Label = 'label',
  Color = 'color',
  GoCue = 'go_cue',
  GoScene = 'go_scene',
  GoSnip = 'go_snip',
  Select = 'select',
  Tape = 'tape',
  TalkbackTalk = 'talkback_talk',
  OscillatorEnable = 'oscillator-enable',
  OscillatorDestination = 'oscillator-destination'
}

type CompanionActionWithCallback = CompanionAction & Required<Pick<CompanionAction, 'callback'>>

export function GetActionsList(
  self: InstanceSkel<X32Config>,
  oscSocket: osc.UDPPort,
  state: X32State
): CompanionActions {
  const allTargets = GetTargetChoices(state, { includeMain: true })
  const allInputs = GetTargetChoices(state, {
    includeMain: false,
    skipDca: true,
    skipBus: true,
    skipMatrix: true
  })
  const muteGroups = GetMuteGroupChoices(state)
  const selectChoices = GetTargetChoices(state, { skipDca: true, includeMain: true, numericIndex: true })
  const busSendSources = GetTargetChoices(state, {
    skipInputs: true,
    includeMain: true,
    skipDca: true,
    skipBus: false,
    skipMatrix: true
  })

  const sendOsc = (cmd: string, arg: osc.MetaArgument): void => {
    try {
      // HACK: We send commands on a different port than we run /xremote on, so that we get change events for what we send.
      // Otherwise we can have no confirmation that a command was accepted
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ;(self as any).system.emit('osc_send', self.config.host, 10023, cmd, [arg])
    } catch (e) {
      self.log('error', `Command send failed: ${e}`)
    }
  }
  const getOptNumber = (action: CompanionActionEvent, key: string): number => {
    const val = Number(action.options[key])
    if (isNaN(val)) {
      throw new Error(`Invalid option '${key}'`)
    }
    return val
  }
  // const getOptBool = (key: string): boolean => {
  //   return !!opt[key]
  // }
  const getResolveOnOffMute = (
    action: CompanionActionEvent,
    cmd: string,
    cmdIsCalledOn: boolean,
    prop: 'mute' | 'on' = 'mute'
  ): number => {
    const onState = getOptNumber(action, prop)
    if (onState === MUTE_TOGGLE) {
      const currentState = state.get(cmd)
      const currentVal = currentState && currentState[0]?.type === 'i' && currentState[0]?.value
      if (typeof currentVal === 'number') {
        return currentVal === 0 ? 1 : 0
      } else {
        // default to off
        return cmdIsCalledOn ? 0 : 1
      }
    } else {
      return onState
    }
  }

  const actions: { [id in ActionId]: CompanionActionWithCallback | undefined } = {
    [ActionId.Mute]: {
      label: 'Set mute',
      options: [
        {
          type: 'dropdown',
          label: 'Target',
          id: 'target',
          ...convertChoices(allTargets)
        },
        MuteChoice
      ],
      callback: (action): void => {
        const cmd = MutePath(action.options.target as string)
        sendOsc(cmd, {
          type: 'i',
          value: getResolveOnOffMute(action, cmd, true)
        })
      },
      subscribe: (evt): void => {
        if (evt.options.mute === MUTE_TOGGLE) {
          ensureLoaded(oscSocket, state, MutePath(evt.options.target as string))
        }
      }
    },
    [ActionId.MuteGroup]: {
      label: 'Mute Group ON/OFF',
      options: [
        {
          type: 'dropdown',
          label: 'Mute Group',
          id: 'target',
          ...convertChoices(muteGroups)
        },
        {
          type: 'dropdown',
          label: 'Mute / Unmute',
          id: 'mute',
          ...convertChoices(CHOICES_MUTE_GROUP)
        }
      ],
      callback: (action): void => {
        const cmd = action.options.target as string
        sendOsc(cmd, {
          type: 'i',
          value: getResolveOnOffMute(action, cmd, false)
        })
      },
      subscribe: (evt): void => {
        if (evt.options.mute === MUTE_TOGGLE) {
          ensureLoaded(oscSocket, state, evt.options.target as string)
        }
      }
    },
    [ActionId.MuteChannelSend]: {
      label: 'Set mute for channel to bus send',
      options: [
        {
          type: 'dropdown',
          label: 'Source',
          id: 'source',
          ...convertChoices(allInputs)
        },
        {
          type: 'dropdown',
          label: 'Target',
          id: 'target',
          ...convertChoices(GetChannelSendChoices(state, 'on'))
        },
        MuteChoice
      ],
      callback: (action): void => {
        const cmd = `${MainPath(action.options.source as string)}/${action.options.target}`
        sendOsc(cmd, {
          type: 'i',
          value: getResolveOnOffMute(action, cmd, true)
        })
      },
      subscribe: (evt): void => {
        if (evt.options.mute === MUTE_TOGGLE) {
          ensureLoaded(oscSocket, state, `${MainPath(evt.options.source as string)}/${evt.options.target}`)
        }
      }
    },
    [ActionId.MuteBusSend]: {
      label: 'Set mute for bus to matrix send',
      options: [
        {
          type: 'dropdown',
          label: 'Source',
          id: 'source',
          ...convertChoices(busSendSources)
        },
        {
          type: 'dropdown',
          label: 'Target',
          id: 'target',
          ...convertChoices(GetBusSendChoices(state))
        },
        MuteChoice
      ],
      callback: (action): void => {
        const cmd = `${MainPath(action.options.source as string)}/${action.options.target}/on`
        sendOsc(cmd, {
          type: 'i',
          value: getResolveOnOffMute(action, cmd, true)
        })
      },
      subscribe: (evt): void => {
        if (evt.options.mute === MUTE_TOGGLE) {
          ensureLoaded(oscSocket, state, `${MainPath(evt.options.source as string)}/${evt.options.target}/on`)
        }
      }
    },
    [ActionId.FaderLevel]: {
      label: 'Set fader level',
      options: [
        {
          type: 'dropdown',
          label: 'Target',
          id: 'target',
          ...convertChoices(allTargets)
        },
        FaderLevelChoice
      ],
      callback: (action): void => {
        sendOsc(`${MainPath(action.options.target as string)}/fader`, {
          type: 'f',
          value: dbToFloat(getOptNumber(action, 'fad'))
        })
      }
    },
    [ActionId.ChannelSendLevel]: {
      label: 'Set level of channel to bus send',
      options: [
        {
          type: 'dropdown',
          label: 'Source',
          id: 'source',
          ...convertChoices(allInputs)
        },
        {
          type: 'dropdown',
          label: 'Target',
          id: 'target',
          ...convertChoices(GetChannelSendChoices(state, 'level'))
        },
        FaderLevelChoice
      ],
      callback: (action): void => {
        sendOsc(`${MainPath(action.options.source as string)}/${action.options.target}`, {
          type: 'f',
          value: dbToFloat(getOptNumber(action, 'fad'))
        })
      }
    },
    [ActionId.BusSendLevel]: {
      label: 'Set level of bus to matrix send',
      options: [
        {
          type: 'dropdown',
          label: 'Source',
          id: 'source',
          ...convertChoices(busSendSources)
        },
        {
          type: 'dropdown',
          label: 'Target',
          id: 'target',
          ...convertChoices(GetBusSendChoices(state))
        },
        FaderLevelChoice
      ],
      callback: (action): void => {
        sendOsc(`${MainPath(action.options.source as string)}/${action.options.target}/level`, {
          type: 'f',
          value: dbToFloat(getOptNumber(action, 'fad'))
        })
      }
    },
    [ActionId.InputTrim]: {
      label: 'Set input trim',
      options: [
        {
          type: 'dropdown',
          label: 'Input',
          id: 'input',
          ...convertChoices(allInputs)
        },
        {
          type: 'number',
          label: 'Trim',
          id: 'trim',
          range: true,
          required: true,
          default: 0,
          step: 0.1,
          min: -18,
          max: 18
        }
      ],
      callback: (action): void => {
        sendOsc(`${action.options.input}/preamp/trim`, {
          type: 'f',
          value: trimToFloat(getOptNumber(action, 'trim'))
        })
      }
    },
    [ActionId.HeadampGain]: {
      label: 'Set Headamp gain',
      options: [
        {
          type: 'dropdown',
          label: 'Headamp',
          id: 'headamp',
          ...convertChoices(GetHeadampChoices())
        },
        HeadampGainChoice
      ],
      callback: (action): void => {
        sendOsc(`${action.options.headamp}/gain`, {
          type: 'f',
          value: headampGainToFloat(getOptNumber(action, 'gain'))
        })
      }
    },
    [ActionId.Label]: {
      label: 'Set label',
      options: [
        {
          type: 'dropdown',
          label: 'Target',
          id: 'target',
          ...convertChoices(allTargets)
        },
        {
          type: 'textinput',
          label: 'Label',
          id: 'lab',
          default: ''
        }
      ],
      callback: (action): void => {
        sendOsc(`${action.options.target}/config/name`, {
          type: 's',
          value: `${action.options.lab}`
        })
      }
    },

    [ActionId.Color]: {
      label: 'Set color',
      options: [
        {
          type: 'dropdown',
          label: 'Target',
          id: 'target',
          ...convertChoices(allTargets)
        },
        {
          type: 'dropdown',
          label: 'color',
          id: 'col',
          ...convertChoices(CHOICES_COLOR)
        }
      ],
      callback: (action): void => {
        sendOsc(`${action.options.target}/config/color`, {
          type: 'i',
          value: getOptNumber(action, 'col')
        })
      }
    },

    [ActionId.GoCue]: {
      label: 'Load Console Cue',
      options: [
        {
          type: 'number',
          label: 'Cue Nr 0-99',
          id: 'cue',
          default: 0,
          min: 0,
          max: 99
        }
      ],
      callback: (action): void => {
        sendOsc(`/-action/gocue`, {
          type: 'i',
          value: getOptNumber(action, 'cue')
        })
      }
    },
    [ActionId.GoScene]: {
      label: 'Load Console Scene',
      options: [
        {
          type: 'number',
          label: 'scene Nr 0-99',
          id: 'scene',
          default: 0,
          min: 0,
          max: 99
        }
      ],
      callback: (action): void => {
        sendOsc(`/-action/goscene`, {
          type: 'i',
          value: getOptNumber(action, 'scene')
        })
      }
    },
    [ActionId.GoSnip]: {
      label: 'Load Console snippet',
      options: [
        {
          type: 'number',
          label: 'Snippet Nr 0-99',
          id: 'snip',
          default: 0,
          min: 0,
          max: 99
        }
      ],
      callback: (action): void => {
        sendOsc(`/-action/gosnippet`, {
          type: 'i',
          value: getOptNumber(action, 'snip')
        })
      }
    },
    [ActionId.Select]: {
      label: 'Select',
      options: [
        {
          type: 'dropdown',
          label: 'Target',
          id: 'select',
          ...convertChoices(selectChoices)
        }
      ],
      callback: (action): void => {
        sendOsc(`/-stat/selidx`, {
          type: 'i',
          value: getOptNumber(action, 'select')
        })
      }
    },
    [ActionId.Tape]: {
      label: 'Tape Operation',
      options: [
        {
          type: 'dropdown',
          label: 'Function',
          id: 'tFunc',
          ...convertChoices(CHOICES_TAPE_FUNC)
        }
      ],
      callback: (action): void => {
        sendOsc(`/-stat/tape/state`, {
          type: 'i',
          value: getOptNumber(action, 'tFunc')
        })
      }
    },
    [ActionId.TalkbackTalk]: {
      label: 'Talkback Talk',
      options: [
        {
          type: 'dropdown',
          label: 'Function',
          id: 'channel',
          ...convertChoices([
            {
              id: 'A',
              label: 'A'
            },
            {
              id: 'B',
              label: 'B'
            }
          ])
        },
        {
          type: 'dropdown',
          label: 'On / Off',
          id: 'on',
          ...convertChoices(CHOICES_ON_OFF)
        }
      ],
      callback: (action): void => {
        const cmd = `/-stat/talk/${action.options.channel}`
        const onState = getResolveOnOffMute(action, cmd, true, 'on')

        sendOsc(cmd, {
          type: 'i',
          value: onState
        })
      },
      subscribe: (evt): void => {
        if (evt.options.on === MUTE_TOGGLE) {
          ensureLoaded(oscSocket, state, `/-stat/talk/${evt.options.channel}`)
        }
      }
    },
    [ActionId.OscillatorEnable]: {
      label: 'Oscillator Enable',
      options: [
        {
          type: 'dropdown',
          label: 'On / Off',
          id: 'on',
          ...convertChoices(CHOICES_ON_OFF)
        }
      ],
      callback: (action): void => {
        const cmd = `/-stat/osc/on`
        const onState = getResolveOnOffMute(action, cmd, true, 'on')

        sendOsc(cmd, {
          type: 'i',
          value: onState
        })
      },
      subscribe: (evt): void => {
        if (evt.options.on === MUTE_TOGGLE) {
          ensureLoaded(oscSocket, state, `/-stat/osc/on`)
        }
      }
    },
    [ActionId.OscillatorDestination]: {
      label: 'Oscillator Destination',
      options: [
        {
          type: 'dropdown',
          label: 'destination',
          id: 'destination',
          ...convertChoices(GetOscillatorDestinations(state))
        }
      ],
      callback: (action): void => {
        sendOsc(`/config/osc/dest`, {
          type: 'i',
          value: getOptNumber(action, 'destination')
        })
      }
    }
  }

  return actions
}
