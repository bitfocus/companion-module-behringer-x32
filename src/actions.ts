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
  convertChoices
} from './choices'
import * as osc from 'osc'
import { MutePath, MainPath } from './paths'

export enum ActionId {
  Mute = 'mute',
  MuteGroup = 'mute_grp',
  MuteChannelSend = 'mute_channel_send',
  FaderLevel = 'fad',
  ChannelSendLevel = 'level_channel_send',
  Label = 'label',
  Color = 'color',
  GoCue = 'go_cue',
  GoScene = 'go_scene',
  GoSnip = 'go_snip',
  Select = 'select',
  Tape = 'tape'
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
  const getResolveMute = (action: CompanionActionEvent, cmd: string, cmdIsCalledOn: boolean): number => {
    const onState = getOptNumber(action, 'mute')
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
          choices: allTargets,
          default: allTargets[0].id
        },
        {
          type: 'dropdown',
          label: 'Mute / Unmute',
          id: 'mute',
          default: CHOICES_MUTE[0].id,
          choices: CHOICES_MUTE
        }
      ],
      callback: (action): void => {
        const cmd = MutePath(action.options.target as string)
        const onState = getResolveMute(action, cmd, true)

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
          default: muteGroups[0].id,
          choices: muteGroups
        },
        {
          type: 'dropdown',
          label: 'Mute / Unmute',
          id: 'mute',
          default: CHOICES_MUTE_GROUP[0].id,
          choices: CHOICES_MUTE_GROUP
        }
      ],
      callback: (action): void => {
        const cmd = action.options.target as string
        const onState = getResolveMute(action, cmd, false)

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
      label: 'Set mute channel send',
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
          default: CHOICES_MUTE[0].id,
          choices: CHOICES_MUTE
        }
      ],
      callback: (action): void => {
        const cmd = `${MainPath(action.options.source as string)}/${action.options.target}`
        const onState = getResolveMute(action, cmd, true)

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
    [ActionId.FaderLevel]: {
      label: 'Set fader level',
      options: [
        {
          type: 'dropdown',
          label: 'Target',
          id: 'target',
          choices: allTargets,
          default: allTargets[0].id
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
      label: 'Set level of channel send',
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
        console.log(action)
        sendOsc(`${MainPath(action.options.source as string)}/${action.options.target}`, {
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
          choices: allTargets,
          default: allTargets[0].id
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
          choices: allTargets,
          default: allTargets[0].id
        },
        {
          type: 'dropdown',
          label: 'color',
          id: 'col',
          default: CHOICES_COLOR[0].id,
          choices: CHOICES_COLOR
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
          choices: selectChoices,
          default: selectChoices[0].id
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
          default: CHOICES_TAPE_FUNC[0].id,
          choices: CHOICES_TAPE_FUNC
        }
      ],
      callback: (action): void => {
        sendOsc(`/-stat/tape/state`, {
          type: 'i',
          value: getOptNumber(action, 'tFunc')
        })
      }
    }
  }

  return actions
}
