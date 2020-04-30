import InstanceSkel = require('../../../instance_skel')
import { CompanionAction, CompanionActionEvent, CompanionActions } from '../../../instance_skel_types'
import { X32State } from './state'
import { X32Config } from './config'
import { assertUnreachable } from './util'
import { CHOICES_TAPE_FUNC, CHOICES_COLOR, CHOICES_FADER_LEVEL } from './choices'
import * as osc from 'osc'

export enum ActionId {
  Mute = 'mute',
  MuteGroup = 'mute_grp',
  MainMute = 'mMute',
  FaderLevel = 'fad',
  MainFaderLevel = 'mFad',
  Label = 'label',
  MainLabel = 'mLabel',
  Color = 'color',
  MainColor = 'mColor',
  GoCue = 'go_cue',
  GoScene = 'go_scene',
  GoSnip = 'go_snip',
  Select = 'select',
  Tape = 'tape'
}

export function GetActionsList(self: InstanceSkel<X32Config>, _state: X32State): CompanionActions {
  const actions: { [id in ActionId]: Required<CompanionAction> | undefined } = {
    [ActionId.Mute]: {
      label: 'Set mute',
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
          type: 'textinput',
          label: 'Ch, AuxIn, FXrtn, Bus, Mtx or Dca Number',
          id: 'num',
          default: '1',
          regex: self.REGEX_NUMBER
        },
        {
          type: 'dropdown',
          label: 'Mute / Unmute',
          id: 'mute',
          default: '0',
          choices: [
            { id: '0', label: 'Mute' },
            { id: '1', label: 'Unmute' }
          ]
        }
      ]
    },
    [ActionId.MuteGroup]: {
      label: 'Mute Group ON/OFF',
      options: [
        {
          type: 'textinput',
          label: 'Mute Group Number (1-6)',
          id: 'mute_grp',
          default: '1',
          regex: self.REGEX_NUMBER
        },
        {
          type: 'dropdown',
          label: 'Mute / Unmute',
          id: 'mute',
          default: '1',
          choices: [
            { id: '1', label: 'Mute' },
            { id: '0', label: 'Unmute' }
          ]
        }
      ]
    },
    [ActionId.MainMute]: {
      label: 'Set Main mute',
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
          label: 'Mute / Unmute',
          id: 'mute',
          default: '0',
          choices: [
            { id: '0', label: 'Mute' },
            { id: '1', label: 'Unmute' }
          ]
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
          type: 'textinput',
          label: 'Ch, AuxIn, FXrtn, Bus, Mtx or Dca Number',
          id: 'num',
          default: '1',
          regex: self.REGEX_NUMBER
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
          type: 'textinput',
          label: 'Ch, AuxIn, FXrtn, Bus, Mtx Number',
          id: 'num',
          default: '1',
          regex: self.REGEX_NUMBER
        },
        {
          type: 'textinput',
          label: 'Label',
          id: 'lab',
          default: ''
        }
      ]
    },

    [ActionId.MainLabel]: {
      label: 'Set Main label',
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
          label: 'Type',
          id: 'type',
          choices: [
            { id: '/ch/', label: 'Channel 1-32' },
            { id: '/auxin/', label: 'Aux In 1-8' },
            { id: '/fxrtn/', label: 'FX Return 1-8' },
            { id: '/bus/', label: 'Bus 1-16' },
            { id: '/mtx/', label: 'Matrix 1-6' },
            { id: '/dca/', label: 'DCA 1-8' }
          ],
          default: '/ch/'
        },
        {
          type: 'textinput',
          label: 'Ch, AuxIn, FXrtn, Bus, Mtx or Dca Number',
          id: 'num',
          default: '1',
          regex: self.REGEX_NUMBER
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

    [ActionId.MainColor]: {
      label: 'Set Main color',
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
          type: 'textinput',
          label: 'Cue Nr 0-99',
          id: 'cue',
          default: '0',
          regex: self.REGEX_NUMBER
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
      label: 'Select ch 0-31, Aux-USB-FX 32-47, BUS 48-63, MTX 64-69, 70 L/R, 71 Mono/Center',
      options: [
        {
          type: 'number',
          label: 'select 0-71',
          id: 'select',
          default: 0,
          min: 0,
          max: 71
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
  oscSocket: osc.UDPPort,
  _state: X32State,
  action: CompanionActionEvent
): void {
  const sendOsc = (cmd: string, arg: osc.MetaArgument): void => {
    oscSocket.send({
      address: cmd,
      args: [arg]
    })
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
      sendOsc(`${channelCmdPrefix()}/on`, {
        type: 'i',
        value: getOptNumber('mute')
      })
      break
    }
    case ActionId.MuteGroup: {
      if (opt.lab) {
        sendOsc(`/config/mute/${getOptNumber('mute_grp')}`, {
          type: 'i',
          value: getOptNumber('mute')
        })
      }
      break
    }
    case ActionId.MainMute: {
      sendOsc(`${opt.type}/mix/on`, {
        type: 'i',
        value: getOptNumber('mute')
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
      if (opt.lab) {
        sendOsc(`${channelCmdPrefix(true)}/config/name`, {
          type: 's',
          value: `${opt.lab}`
        })
      }
      break
    }
    case ActionId.MainLabel: {
      if (opt.lab) {
        sendOsc(`${opt.type}/config/name`, {
          type: 's',
          value: `${opt.lab}`
        })
      }
      break
    }
    case ActionId.Color: {
      sendOsc(`${channelCmdPrefix(true)}/config/color`, {
        type: 'i',
        value: getOptNumber('col')
      })
      break
    }
    case ActionId.MainColor: {
      sendOsc(`${opt.type}/config/color`, {
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
