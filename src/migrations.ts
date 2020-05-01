import * as _ from 'underscore'
import {
  CompanionCoreInstanceconfig,
  CompanionMigrationAction,
  CompanionMigrationFeedback
} from '../../../instance_skel_types'
import { ActionId } from './actions'
import { X32Config } from './config'

export function upgradeV2x0x0(
  _config: CompanionCoreInstanceconfig & X32Config,
  actions: CompanionMigrationAction[],
  releaseActions: CompanionMigrationAction[],
  _feedbacks: CompanionMigrationFeedback[]
): boolean {
  let changed = false

  console.log('Running x32 upgrade to v2.0.0')

  const allActions = [...actions, ...releaseActions]
  _.each(allActions, action => {
    if (action.action === ActionId.Mute && !action.options.target) {
      const type = action.options.type || '/ch/'
      delete action.options.type

      const num = action.options.num || '1'
      delete action.options.num

      action.options.target = `${type}${num}`

      changed = true
    } else if (action.action === ActionId.MuteGroup) {
      if (action.options.mute_grp) {
        action.options.target = `/config/mute/${action.options.mute_grp}`
        delete action.options.mute_grp

        changed = true
      }
    } else if (action.action === 'mMute') {
      if (action.options.type) {
        action.options.target = action.options.type
        delete action.options.type

        action.action = ActionId.Mute

        changed = true
      }
    }
  })

  return changed
}
