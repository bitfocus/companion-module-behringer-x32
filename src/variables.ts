import InstanceSkel = require('../../../instance_skel')
import { CompanionVariable } from '../../../instance_skel_types'
import { X32Config } from './config'
import { X32State } from './state'

export function InitVariables(instance: InstanceSkel<X32Config>, _state: X32State): void {
  const variables: CompanionVariable[] = []

  instance.setVariableDefinitions(variables)
}
