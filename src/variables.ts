import InstanceSkel = require('../../../instance_skel')
import { CompanionVariable } from '../../../instance_skel_types'
import { X32Config } from './config'
import { X32State } from './state'
import * as osc from 'osc'
import { GetTargetChoices } from './choices'

function sanitiseName(name: string): string {
  return name.replace(/\//g, '_')
}

export function InitVariables(instance: InstanceSkel<X32Config>, state: X32State): void {
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

  const targets = GetTargetChoices(state)
  for (const target of targets) {
    variables.push({
      label: `Name: ${target.label}`,
      name: `name${sanitiseName(target.id as string)}`
    })
  }

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

export function updateNameVariables(instance: InstanceSkel<X32Config>, state: X32State): void {
  const targets = GetTargetChoices(state)
  for (const target of targets) {
    const val = state.get(`${target.id}/config/name`)
    const valStr = val && val[0]?.type === 's' ? val[0].value : ''
    instance.setVariable(`name${sanitiseName(target.id as string)}`, valStr || target.label)
  }
}
