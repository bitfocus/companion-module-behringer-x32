import { DropdownChoice } from '../../../instance_skel_types'
import { X32State } from './state'
import { padNumber } from './util'

export const MUTE_TOGGLE = 2
export const CHOICES_MUTE: DropdownChoice[] = [
  { id: MUTE_TOGGLE, label: 'Toggle' },
  { id: 0, label: 'Mute' },
  { id: 1, label: 'Unmute' }
]
export const CHOICES_MUTE_GROUP: DropdownChoice[] = [
  { id: MUTE_TOGGLE, label: 'Toggle' },
  { id: 1, label: 'Mute' },
  { id: 0, label: 'Unmute' }
]

export const CHOICES_COLOR: DropdownChoice[] = [
  { label: 'Off', id: '0' },
  { label: 'Red: ', id: '1' },
  { label: 'Green', id: '2' },
  { label: 'Yellow', id: '3' },
  { label: 'Blue', id: '4' },
  { label: 'Magenta', id: '5' },
  { label: 'Cyan', id: '6' },
  { label: 'White', id: '7' },
  { label: 'Off Inverted', id: '8' },
  { label: 'Red Inverted', id: '9' },
  { label: 'Green Inverted', id: '10' },
  { label: 'Yellow Inverted', id: '11' },
  { label: 'Blue Inverted', id: '12' },
  { label: 'Magenta Inverted', id: '13' },
  { label: 'Cyan Inverted', id: '14' },
  { label: 'White Inverted', id: '15' }
]

export const CHOICES_TAPE_FUNC: DropdownChoice[] = [
  { label: 'STOP', id: '0' },
  { label: 'PLAY PAUSE', id: '1' },
  { label: 'PLAY', id: '2' },
  { label: 'RECORD PAUSE', id: '3' },
  { label: 'RECORD', id: '4' },
  { label: 'FAST FORWARD', id: '5' },
  { label: 'REWIND', id: '6' }
]

export interface ChannelChoicesOptions {
  defaultNames?: boolean
  numericIndex?: boolean
  includeMain?: boolean
  skipDca?: boolean
  // TODO - more skipXXX
}

export function GetTargetChoices(state: X32State, options?: ChannelChoicesOptions): DropdownChoice[] {
  const res: DropdownChoice[] = []

  const getNameFromState = (id: string): string | undefined => {
    if (options?.defaultNames) {
      return undefined
    }
    const val = state.get(`${id}/config/name`)
    return val && val[0]?.type === 's' ? val[0].value : undefined
  }

  let i = 0
  const appendTarget = (id: string, defaultName: string): void => {
    const realname = getNameFromState(id)
    res.push({
      id: options?.numericIndex ? i++ : id,
      label: realname ? `${realname} (${defaultName})` : defaultName
    })
  }

  for (let i = 1; i <= 32; i++) {
    appendTarget(`/ch/${padNumber(i)}`, `Channel ${i}`)
  }

  for (let i = 1; i <= 8; i++) {
    appendTarget(`/auxin/${padNumber(i)}`, `Aux In ${i}`)
  }

  for (let i = 1; i <= 4; i++) {
    const o = (i - 1) * 2 + 1
    appendTarget(`/fxrtn/${padNumber(o)}`, `FX Return ${i} L`)
    appendTarget(`/fxrtn/${padNumber(o + 1)}`, `FX Return ${i} R`)
  }

  for (let i = 1; i <= 16; i++) {
    appendTarget(`/bus/${padNumber(i)}`, `Bus ${i}`)
  }

  for (let i = 1; i <= 6; i++) {
    appendTarget(`/mtx/${padNumber(i)}`, `Matrix ${i}`)
  }

  if (!options?.skipDca) {
    for (let i = 1; i <= 8; i++) {
      appendTarget(`/dca/${i}`, `DCA ${i}`)
    }
  }

  if (options?.includeMain) {
    appendTarget(`/main/st`, `Main Stereo`)
    appendTarget(`/main/m`, `Main Mono`)
  }

  return res
}

export function GetMuteGroupChoices(_state: X32State): DropdownChoice[] {
  const res: DropdownChoice[] = []

  for (let i = 1; i <= 6; i++) {
    res.push({
      id: `/config/mute/${i}`,
      label: `Mute group ${i}`
    })
  }

  return res
}
