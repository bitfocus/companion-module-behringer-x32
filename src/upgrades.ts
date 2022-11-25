import {
	CompanionStaticUpgradeProps,
	CompanionStaticUpgradeResult,
	CompanionStaticUpgradeScript,
	CompanionUpgradeContext,
} from '@companion-module/base'
import { ActionId } from './actions.js'
import { X32Config } from './config.js'
import { FeedbackId } from './feedback.js'
import { padNumber, floatToDB } from './util.js'

export const upgradeV2x0x0: CompanionStaticUpgradeScript<X32Config> = (
	_context: CompanionUpgradeContext,
	props: CompanionStaticUpgradeProps<X32Config>
): CompanionStaticUpgradeResult<X32Config> => {
	const updatedActions: CompanionStaticUpgradeResult<X32Config>['updatedActions'] = []

	for (const action of props.actions) {
		switch (action.actionId) {
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

					if (action.actionId === ActionId.Mute && action.options.mute === null) {
						action.options.mute = 0
					} else if (action.actionId === ActionId.Color && action.options.col === null) {
						action.options.col = '0'
					} else if (action.actionId === ActionId.FaderLevel) {
						action.options.fad = floatToDB((action.options.fad ?? 0) as number)
					}

					updatedActions.push(action)
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

					updatedActions.push(action)
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

					action.actionId = ActionId.Mute

					updatedActions.push(action)
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

					action.actionId = ActionId.Color

					updatedActions.push(action)
				}
				break
			}
			case 'mLabel': {
				if (action.options.type) {
					action.options.target = action.options.type
					delete action.options.type

					action.actionId = ActionId.Label

					updatedActions.push(action)
				}
				break
			}
			case 'mFad': {
				if (action.options.type) {
					action.options.target = action.options.type
					delete action.options.type

					action.options.fad = floatToDB((action.options.fad ?? 0) as number)

					action.actionId = ActionId.FaderLevel

					updatedActions.push(action)
				}
				break
			}
		}
	}

	return {
		updatedConfig: null,
		updatedFeedbacks: [],
		updatedActions,
	}
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
