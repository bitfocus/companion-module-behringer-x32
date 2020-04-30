import { CompanionInputFieldDropdown } from '../../../instance_skel_types'

export function AtemFadeToBlackStatePicker(): CompanionInputFieldDropdown {
  return {
    type: 'dropdown',
    label: 'State',
    id: 'state',
    default: 'on',
    choices: [
      {
        id: 'on',
        label: 'On'
      },
      {
        id: 'off',
        label: 'Off'
      },
      {
        id: 'fading',
        label: 'Fading'
      }
    ]
  }
}
