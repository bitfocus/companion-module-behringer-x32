import InstanceSkel = require('../../../instance_skel')
import { CompanionAction, CompanionActionEvent, CompanionActions } from '../../../instance_skel_types'
import { X32State } from './state'
import { X32Config } from './config'
import { assertUnreachable } from './util'
import {
  CHOICES_TAPE_FUNC,
  CHOICES_COLOR,
  CHOICES_FADER_LEVEL,
  GetTargetChoices,
  CHOICES_MUTE,
  MUTE_TOGGLE,
  GetMuteGroupChoices,
  CHOICES_MUTE_GROUP
} from './choices'
import * as osc from 'osc'
import { MutePath } from './paths'

export enum ActionId {
  Mute = 'mute',
  MuteGroup = 'mute_grp',
  FaderLevel = 'fad',
  MainFaderLevel = 'mFad',
  Label = 'label',
  Color = 'color',
  GoCue = 'go_cue',
  GoScene = 'go_scene',
  GoSnip = 'go_snip',
  Select = 'select',
  Tape = 'tape'
}

export function GetActionsList(_self: InstanceSkel<X32Config>, state: X32State): CompanionActions {
  const allTargets = GetTargetChoices(state, { includeMain: true })
  const muteGroups = GetMuteGroupChoices(state)
  const selectChoices = GetTargetChoices(state, { skipDca: true, numericIndex: true })

  const actions: { [id in ActionId]: Required<CompanionAction> | undefined } = {
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
      ]
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
      ]
    },
    [ActionId.FaderLevel]: {
      label: 'Set fader level',
      options: [
        {
          type: 'dropdown',
          label: 'Type',
          id: 'type',
          choices: [
            { id: '/ch/', label: 'Channel 1-32' },
            { id: '/auxin/', label: 'Aux In 1-8' },
            { id: '/fxrtn/', label: 'FX Return 1-8' },
            { id: '/bus/', label: 'Bus 1-16' },
            { id: '/mtx/', label: 'Matrix 1-6' },
            { id: '/dca/', label: 'Dca 1-8' }
          ],
          default: '/ch/'
        },
        {
          type: 'number',
          label: 'Ch, AuxIn, FXrtn, Bus, Mtx or Dca Number',
          id: 'num',
          default: 1,
          min: 1,
          max: 32
        },
        {
          type: 'dropdown',
          label: 'Fader Level',
          id: 'fad',
          default: CHOICES_FADER_LEVEL[0].id,
          choices: CHOICES_FADER_LEVEL
        }
      ]
    },
    [ActionId.MainFaderLevel]: {
      label: 'Set Main fader level',
      options: [
        {
          type: 'dropdown',
          label: 'Type',
          id: 'type',
          choices: [
            { id: '/main/st', label: 'Stereo' },
            { id: '/main/m', label: 'Mono' }
          ],
          default: '/main/st'
        },
        {
          type: 'dropdown',
          label: 'Fader Level',
          id: 'fad',
          default: CHOICES_FADER_LEVEL[0].id,
          choices: CHOICES_FADER_LEVEL
        }
      ]
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
      ]
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
      ]
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
      ]
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
      ]
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
      ]
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
      ]
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
      ]
    }
  }

  return actions
}

export function HandleAction(
  instance: InstanceSkel<X32Config>,
  _oscSocket: osc.UDPPort,
  state: X32State,
  action: CompanionActionEvent
): void {
  const sendOsc = (cmd: string, arg: osc.MetaArgument): void => {
    console.log(cmd, arg)
    // HACK: We send commands on a different port than we run /xremote on, so that we get change events for what we send.
    // Otherwise we can have no confirmation that a command was accepted
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ;(instance as any).system.emit('osc_send', instance.config.host, 10023, cmd, [arg])
  }
  const opt = action.options
  const getOptNumber = (key: string): number => {
    const val = Number(opt[key])
    if (isNaN(val)) {
      throw new Error(`Invalid option '${key}'`)
    }
    return val
  }
  // const getOptBool = (key: string): boolean => {
  //   return !!opt[key]
  // }
  const channelCmdPrefix = (notMix?: boolean): string => {
    const num = getOptNumber('num')
    const numStr = ('0' + num).substr(-2)
    return opt.type == '/dca/' ? `${opt.type}${num}` : `${opt.type}${numStr}${notMix ? '' : '/mix'}`
  }

  const actionId = action.action as ActionId
  switch (actionId) {
    case ActionId.Mute: {
      let onState = getOptNumber('mute')
      const cmd = MutePath(opt.target as string)

      if (onState === MUTE_TOGGLE) {
        const currentState = state.get(cmd)
        onState = currentState && currentState[0]?.type === 'i' && currentState[0]?.value === 0 ? 1 : 0
      }
      sendOsc(cmd, {
        type: 'i',
        value: onState
      })
      break
    }
    case ActionId.MuteGroup: {
      let onState = getOptNumber('mute')
      const cmd = opt.target as string

      if (onState === MUTE_TOGGLE) {
        const currentState = state.get(cmd)
        onState = currentState && currentState[0]?.type === 'i' && currentState[0]?.value === 1 ? 0 : 1
      }
      sendOsc(cmd, {
        type: 'i',
        value: onState
      })
      break
    }
    case ActionId.FaderLevel: {
      sendOsc(`${channelCmdPrefix()}/fader`, {
        type: 'f',
        value: getOptNumber('fad')
      })
      break
    }
    case ActionId.MainFaderLevel: {
      sendOsc(`${opt.type}/mix/fader`, {
        type: 'f',
        value: getOptNumber('fad')
      })
      break
    }
    case ActionId.Label: {
      sendOsc(`${opt.target}/config/name`, {
        type: 's',
        value: `${opt.lab}`
      })
      break
    }
    case ActionId.Color: {
      sendOsc(`${opt.target}/config/color`, {
        type: 'i',
        value: getOptNumber('col')
      })
      break
    }
    case ActionId.GoCue: {
      sendOsc(`/-action/gocue`, {
        type: 'i',
        value: getOptNumber('cue')
      })
      break
    }
    case ActionId.GoScene: {
      sendOsc(`/-action/goscene`, {
        type: 'i',
        value: getOptNumber('scene')
      })
      break
    }
    case ActionId.GoSnip: {
      sendOsc(`/-action/gosnippet`, {
        type: 'i',
        value: getOptNumber('snip')
      })
      break
    }
    case ActionId.Select: {
      sendOsc(`/-stat/selidx`, {
        type: 'i',
        value: getOptNumber('select')
      })
      break
    }
    case ActionId.Tape: {
      sendOsc(`/-stat/tape/state`, {
        type: 'i',
        value: getOptNumber('tFunc')
      })
      break
    }
    default:
      assertUnreachable(actionId)
      instance.debug('Unknown action: ' + action.action)
  }
}
