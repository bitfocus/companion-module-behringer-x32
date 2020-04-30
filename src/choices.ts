import { DropdownChoice } from '../../../instance_skel_types'

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

export const CHOICES_FADER_LEVEL: DropdownChoice[] = [
  { label: '- ∞', id: '0.0' },
  { label: '-50 dB: ', id: '0.1251' },
  { label: '-30 dB', id: '0.251' },
  { label: '-20 dB', id: '0.375' },
  { label: '-18 dB', id: '0.4' },
  { label: '-15 dB', id: '0.437' },
  { label: '-12 dB', id: '0.475' },
  { label: '-9 dB', id: '0.525' },
  { label: '-6 dB', id: '0.6' },
  { label: '-3 dB', id: '0.675' },
  { label: '-2 dB', id: '0.7' },
  { label: '-1 dB', id: '0.725' },
  { label: '0 dB', id: '0.75' },
  { label: '+1 dB', id: '0.775' },
  { label: '+2 dB', id: '0.8' },
  { label: '+3 dB', id: '0.825' },
  { label: '+4 dB', id: '0.85' },
  { label: '+5 dB', id: '0.875' },
  { label: '+6 dB', id: '0.9' },
  { label: '+9 dB', id: '0.975' },
  { label: '+10 dB', id: '1.0' }
]
