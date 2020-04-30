import InstanceSkel = require('../../../instance_skel')
import { CompanionAction, CompanionActionEvent, CompanionActions } from '../../../instance_skel_types'
import { X32State } from './state'
import { X32Config } from './config'
import { assertUnreachable } from './util'

export enum ActionId {
  Dummy = ''
}

export function GetActionsList(_state: X32State): CompanionActions {
  const actions: { [id in ActionId]: Required<CompanionAction> | undefined } = {
    [ActionId.Dummy]: undefined
  }

  return actions
}

export function HandleAction(instance: InstanceSkel<X32Config>, _state: X32State, action: CompanionActionEvent): void {
  // const opt = action.options
  // const getOptNumber = (key: string): number => {
  //   const val = Number(opt[key])
  //   if (isNaN(val)) {
  //     throw new Error(`Invalid option '${key}'`)
  //   }
  //   return val
  // }
  // const getOptBool = (key: string): boolean => {
  //   return !!opt[key]
  // }
  const actionId = action.action as ActionId
  switch (actionId) {
    case ActionId.Dummy:
      break
    default:
      assertUnreachable(actionId)
      instance.debug('Unknown action: ' + action.action)
  }
}
