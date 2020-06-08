import InstanceSkel = require('../../../instance_skel')
import { CompanionAction, CompanionActionEvent, CompanionActions } from '../../../instance_skel_types'
import { X32State } from './state'
import { X32Config } from './config'
import { dbToFloat, ensureLoaded } from './util'
import {
  CHOICES_TAPE_FUNC,
  CHOICES_COLOR,
  GetTargetChoices,
  CHOICES_MUTE,
  MUTE_TOGGLE,
  GetMuteGroupChoices,
  CHOICES_MUTE_GROUP,
  GetChannelSendChoices,
  convertChoices,
  CHOICES_ON_OFF,
  GetBusSendChoices
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
  Label = 'label',
  Color = 'color',
  GoCue = 'go_cue',
  GoScene = 'go_scene',
  GoSnip = 'go_snip',
  Select = 'select',
  Tape = 'tape',
  TalkbackTalk = 'talkback_talk'
}

type CompanionActionWithCallback = CompanionAction & Required<Pick<CompanionAction, 'callback'>>

export function GetActionsList(
  self: InstanceSkel<X32Config>,
  oscSocket: osc.UDPPort,
  state: X32State
): CompanionActions {
  const allTargets = GetTargetChoices(state, { includeMain: true })
  const channelSendSources = GetTargetChoices(state, {
    includeMain: false,
    skipDca: true,
    skipBus: true,
    skipMatrix: true
  })
  const muteGroups = GetMuteGroupChoices(state)
  const selectChoices = GetTargetChoices(state, { skipDca: true, numericIndex: true })
  const busSendSources = GetTargetChoices(state, {
    skipInputs: true,
    includeMain: true,
    skipDca: true,
    skipBus: false,
    skipMatrix: true
  })

  const sendOsc = (cmd: string, arg: osc.MetaArgument): void => {
    console.log(cmd, arg)
    // HACK: We send commands on a different port than we run /xremote on, so that we get change events for what we send.
    // Otherwise we can have no confirmation that a command was accepted
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ;(self as any).system.emit('osc_send', self.config.host, 10023, cmd, [arg])
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
        {
          type: 'dropdown',
          label: 'Mute / Unmute',
          id: 'mute',
          ...convertChoices(CHOICES_MUTE)
        }
      ],
      callback: (action): void => {
        const cmd = MutePath(action.options.target as string)
        const onState = getResolveOnOffMute(action, cmd, true)

        sendOsc(cmd, {
          type: 'i',
          value: onState
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
        const onState = getResolveOnOffMute(action, cmd, false)

        sendOsc(cmd, {
          type: 'i',
          value: onState
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
          ...convertChoices(channelSendSources)
        },
        {
          type: 'dropdown',
          label: 'Target',
          id: 'target',
          ...convertChoices(GetChannelSendChoices(state, 'on'))
        },
        {
          type: 'dropdown',
          label: 'Mute / Unmute',
          id: 'mute',
          ...convertChoices(CHOICES_MUTE)
        }
      ],
      callback: (action): void => {
        const cmd = `${MainPath(action.options.source as string)}/${action.options.target}`
        const onState = getResolveOnOffMute(action, cmd, true)

        sendOsc(cmd, {
          type: 'i',
          value: onState
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
        {
          type: 'dropdown',
          label: 'Mute / Unmute',
          id: 'mute',
          ...convertChoices(CHOICES_MUTE)
        }
      ],
      callback: (action): void => {
        const cmd = `${MainPath(action.options.source as string)}/${action.options.target}/on`
        const onState = getResolveOnOffMute(action, cmd, true)

        sendOsc(cmd, {
          type: 'i',
          value: onState
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
        {
          type: 'number',
          label: 'Fader Level (-90 = -inf)',
          id: 'fad',
          range: true,
          required: true,
          default: 0,
          step: 0.1,
          min: -90,
          max: 10
        }
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
          ...convertChoices(channelSendSources)
        },
        {
          type: 'dropdown',
          label: 'Target',
          id: 'target',
          ...convertChoices(GetChannelSendChoices(state, 'level'))
        },
        {
          type: 'number',
          label: 'Fader Level (-90 = -inf)',
          id: 'fad',
          range: true,
          required: true,
          default: 0,
          step: 0.1,
          min: -90,
          max: 10
        }
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
        {
          type: 'number',
          label: 'Fader Level (-90 = -inf)',
          id: 'fad',
          range: true,
          required: true,
          default: 0,
          step: 0.1,
          min: -90,
          max: 10
        }
      ],
      callback: (action): void => {
        sendOsc(`${MainPath(action.options.source as string)}/${action.options.target}/level`, {
          type: 'f',
          value: dbToFloat(getOptNumber(action, 'fad'))
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
    }
  }

  return actions
}
