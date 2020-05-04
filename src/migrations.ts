import * as _ from 'underscore'
import {
  CompanionCoreInstanceconfig,
  CompanionMigrationAction,
  CompanionMigrationFeedback
} from '../../../instance_skel_types'
import { ActionId } from './actions'
import { X32Config } from './config'
import { padNumber } from './util'

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
    switch (action.action) {
      case ActionId.Mute:
      case ActionId.Color:
      case ActionId.FaderLevel:
      case ActionId.Label: {
        if (!action.options.target) {
          const type = action.options.type || '/ch/'
          delete action.options.type

          const num = padNumber(Number(action.options.num || 1))
          delete action.options.num

          action.options.target = `${type}${num}`

          changed = true
        }
        break
      }
      case ActionId.MuteGroup: {
        if (action.options.mute_grp) {
          action.options.target = `/config/mute/${action.options.mute_grp}`
          delete action.options.mute_grp

          changed = true
        }
        break
      }
      case 'mMute': {
        if (action.options.type) {
          action.options.target = action.options.type
          delete action.options.type

          action.action = ActionId.Mute
          action.label = `${action.instance}:${action.action}`

          changed = true
        }
        break
      }
      case 'mColor': {
        if (action.options.type) {
          action.options.target = action.options.type
          delete action.options.type

          action.action = ActionId.Color
          action.label = `${action.instance}:${action.action}`

          changed = true
        }
        break
      }
      case 'mLabel': {
        if (action.options.type) {
          action.options.target = action.options.type
          delete action.options.type

          action.action = ActionId.Label
          action.label = `${action.instance}:${action.action}`

          changed = true
        }
        break
      }
      case 'mFad': {
        if (action.options.type) {
          action.options.target = action.options.type
          delete action.options.type

          action.action = ActionId.FaderLevel
          action.label = `${action.instance}:${action.action}`

          changed = true
        }
        break
      }
    }
  })

  return changed
}
