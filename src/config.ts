import InstanceSkel = require('../../../instance_skel')
import { SomeCompanionConfigField } from '../../../instance_skel_types'

export interface X32Config {
  host?: string
  modelID?: string
  presets?: string
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
    }
  ]
}
