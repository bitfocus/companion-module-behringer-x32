import InstanceSkel = require('../../../instance_skel')
import { CompanionVariable } from '../../../instance_skel_types'
import { X32Config } from './config'
import { X32State } from './state'
import * as osc from 'osc'

export function InitVariables(instance: InstanceSkel<X32Config>, _state: X32State): void {
  const variables: CompanionVariable[] = [
    {
      label: 'Device name',
      name: 'm_name'
    },
    {
      label: 'Device model',
      name: 'm_model'
    },
    {
      label: 'Device firmware',
      name: 'm_fw'
    }
  ]

  instance.setVariableDefinitions(variables)
}

export function updateDeviceInfoVariables(instance: InstanceSkel<X32Config>, args: osc.MetaArgument[]): void {
  const getStringArg = (index: number): string => {
    const raw = args[index]
    if (raw && raw.type === 's') {
      return raw.value
    } else {
      return ''
    }
  }
  instance.setVariable('m_name', getStringArg(1))
  instance.setVariable('m_model', getStringArg(2))
  instance.setVariable('m_fw', getStringArg(3))
}