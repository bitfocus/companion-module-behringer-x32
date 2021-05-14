import {
	CompanionCoreInstanceconfig,
	CompanionMigrationAction,
	CompanionMigrationFeedback,
} from '../../../instance_skel_types'
import { ActionId } from './actions'
import { X32Config } from './config'
import { FeedbackId } from './feedback'
import { padNumber, floatToDB } from './util'

export function upgradeV2x0x0(
	_config: CompanionCoreInstanceconfig & X32Config,
	actions: CompanionMigrationAction[],
	releaseActions: CompanionMigrationAction[],
	_feedbacks: CompanionMigrationFeedback[]
): boolean {
	let changed = false

	const allActions = [...actions, ...releaseActions]
	for (const action of allActions) {
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

					if (action.action === ActionId.Mute && action.options.mute === null) {
						action.options.mute = 0
					} else if (action.action === ActionId.Color && action.options.col === null) {
						action.options.col = '0'
					} else if (action.action === ActionId.FaderLevel) {
						action.options.fad = floatToDB((action.options.fad ?? 0) as number)
					}

					changed = true
				}
				break
			}
			case ActionId.MuteGroup: {
				if (action.options.mute_grp) {
					action.options.target = `/config/mute/${action.options.mute_grp}`
					delete action.options.mute_grp

					if (action.options.mute === null) {
						action.options.mute = 0
					}

					changed = true
				}
				break
			}
			case 'mMute': {
				if (action.options.type) {
					action.options.target = action.options.type
					delete action.options.type

					if (action.options.mute === null) {
						action.options.mute = 0
					}

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

					if (action.options.col === null) {
						action.options.col = '0'
					}

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

					action.options.fad = floatToDB((action.options.fad ?? 0) as number)

					action.action = ActionId.FaderLevel
					action.label = `${action.instance}:${action.action}`

					changed = true
				}
				break
			}
		}
	}

	return changed
}

export const BooleanFeedbackUpgradeMap: {
	[id in FeedbackId]?: true
} = {
	[FeedbackId.Mute]: true,
	[FeedbackId.MuteGroup]: true,
	[FeedbackId.MuteChannelSend]: true,
	[FeedbackId.MuteBusSend]: true,
	[FeedbackId.FaderLevel]: true,
	[FeedbackId.ChannelSendLevel]: true,
	[FeedbackId.BusSendLevel]: true,
	[FeedbackId.TalkbackTalk]: true,
	[FeedbackId.OscillatorEnable]: true,
	[FeedbackId.OscillatorDestination]: true,
}
