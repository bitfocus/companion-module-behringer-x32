import InstanceSkel = require('../../../instance_skel')
import { SomeCompanionConfigField } from '../../../instance_skel_types'

export const fadeFpsDefault = 10

export interface X32Config {
  host?: string
  fadeFps?: number
}

export function GetConfigFields(self: InstanceSkel<X32Config>): SomeCompanionConfigField[] {
  return [
    {
      type: 'textinput',
      id: 'host',
      label: 'Target IP',
      tooltip: 'The IP of the M32 / X32 console',
      width: 6,
      regex: self.REGEX_IP
    },
    {
      type: 'number',
      id: 'fadeFps',
      label: 'Framerate for fades',
      tooltip: 'Higher is smoother, but has higher impact on system performance',
      width: 6,
      min: 5,
      max: 60,
      step: 1,
      default: fadeFpsDefault
    }
  ]
}
