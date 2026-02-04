/* eslint-disable @typescript-eslint/no-unsafe-enum-comparison */
import type {
	CompanionStaticUpgradeResult,
	CompanionStaticUpgradeScript,
	ExpressionOptionsObject,
	JsonValue,
} from '@companion-module/base'
import { FeedbackId } from './feedback.js'
import { padNumber } from './util.js'
import { ActionId } from './actions.js'
import { exprVal } from './upgradeUtil.js'
import { getColorChoiceFromId } from './choices.js'

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

export const upgradeToBuiltinFeedbackInverted: CompanionStaticUpgradeScript<any> = (_ctx, props) => {
	const result: CompanionStaticUpgradeResult<any, undefined> = {
		updatedConfig: null,
		updatedSecrets: null,
		updatedActions: [],
		updatedFeedbacks: [],
	}

	const feedbackIdsToUpgrade = new Set<string>([
		FeedbackId.Mute,
		FeedbackId.MuteGroup,
		FeedbackId.MuteChannelSend,
		FeedbackId.MuteBusSend,
		FeedbackId.TalkbackTalk,
		FeedbackId.TalkbackConfigSingleSource,
		FeedbackId.OscillatorEnable,
		FeedbackId.Solo,
		FeedbackId.ClearSolo,
		FeedbackId.SendsOnFader,
		FeedbackId.SoloMono,
		FeedbackId.SoloDim,
		FeedbackId.ChannelBank,
		FeedbackId.GroupBank,
		FeedbackId.ChannelBankCompact,
		FeedbackId.GroupBankCompact,
		FeedbackId.BusSendBank,
		FeedbackId.UserBank,
		FeedbackId.Screens,
		FeedbackId.MuteGroupScreen,
		FeedbackId.UtilityScreen,
		FeedbackId.ChannelPage,
		FeedbackId.MeterPage,
		FeedbackId.RoutePage,
		FeedbackId.SetupPage,
		FeedbackId.LibPage,
		FeedbackId.FxPage,
		FeedbackId.MonPage,
		FeedbackId.USBPage,
		FeedbackId.ScenePage,
		FeedbackId.AssignPage,
		FeedbackId.RouteUserIn,
		FeedbackId.RouteUserOut,
		FeedbackId.StoredChannel,
		FeedbackId.RouteInputBlockMode,
		FeedbackId.RouteInputBlocks,
		FeedbackId.RouteAuxBlocks,
		FeedbackId.RouteAES50Blocks,
		FeedbackId.RouteCardBlocks,
		FeedbackId.RouteXLRLeftOutputs,
		FeedbackId.RouteXLRRightOutputs,
		FeedbackId.LockAndShutdown,
		FeedbackId.InsertOn,
		FeedbackId.UndoAvailable,
	])
	for (const feedback of props.feedbacks) {
		if (!feedbackIdsToUpgrade.has(feedback.feedbackId)) continue

		// Migrate to built-in inverted state
		feedback.isInverted = {
			isExpression: false, // The existing ones can never be true, as expressions were not supported until this script
			value: feedback.isInverted?.value ? !!feedback.options.state?.value : !feedback.options.state?.value,
		}
		delete feedback.options.state

		result.updatedFeedbacks.push(feedback)
	}

	return result
}

const pathReplacements: Record<string, string | number | undefined> = {
	'/main/st': 'stereo',
	'/main/mono': 'mono',
	st: 'stereo',
	mlevel: 'mono',
}
for (let i = 1; i <= 32; i++) pathReplacements[`/ch/${padNumber(i)}`] = `channel${i}`
for (let i = 1; i <= 8; i++) pathReplacements[`/auxin/${padNumber(i)}`] = `aux${i}`
for (let i = 1; i <= 8; i++) pathReplacements[`/fxrtn/${padNumber(i)}`] = `fx${i}`
for (let i = 1; i <= 16; i++) {
	pathReplacements[`/bus/${padNumber(i)}`] = `bus${i}`
	pathReplacements[`${padNumber(i)}/on`] = `bus${i}`
	pathReplacements[`${padNumber(i)}/level`] = `bus${i}`
	pathReplacements[`${padNumber(i)}/pan`] = `bus${i}`
}
for (let i = 1; i <= 6; i++) pathReplacements[`/mtx/${padNumber(i)}`] = `matrix${i}`
for (let i = 1; i <= 8; i++) pathReplacements[`/dca/${padNumber(i)}`] = `dca${i}`
for (let i = 1; i <= 6; i++) pathReplacements[`/config/mute/${i}`] = i
for (let i = 1; i <= 32; i++) pathReplacements[padNumber(i)] = i
for (let i = 1; i <= 32; i++) pathReplacements[`/headamp/${padNumber(i - 1, 3)}`] = `local${i}`
for (let i = 1; i <= 32; i++) pathReplacements[`/headamp/${padNumber(i - 1 + 32, 3)}`] = `aes-a${i}`
for (let i = 1; i <= 32; i++) pathReplacements[`/headamp/${padNumber(i - 1 + 64, 3)}`] = `aes-b${i}`

const actionsToUpgrade: Record<string, string[] | undefined> = {
	[ActionId.Mute]: ['target'],
	[ActionId.MuteGroup]: ['target'],
	[ActionId.MuteChannelSend]: ['source', 'target'],
	[ActionId.MuteBusSend]: ['source', 'target'],
	[ActionId.FaderLevel]: ['target'],
	[ActionId.FaderLevelStore]: ['target'],
	[ActionId.FaderLevelRestore]: ['target'],
	[ActionId.FaderLevelDelta]: ['target'],
	[ActionId.Panning]: ['target'],
	[ActionId.PanningDelta]: ['target'],
	[ActionId.PanningStore]: ['target'],
	[ActionId.PanningRestore]: ['target'],
	[ActionId.ChannelSendLevel]: ['source', 'target'],
	[ActionId.ChannelSendLevelDelta]: ['source', 'target'],
	[ActionId.ChannelSendLevelStore]: ['source', 'target'],
	[ActionId.ChannelSendLevelRestore]: ['source', 'target'],
	[ActionId.ChannelSendPanning]: ['source', 'target'],
	[ActionId.ChannelSendPanningDelta]: ['source', 'target'],
	[ActionId.ChannelSendPanningStore]: ['source', 'target'],
	[ActionId.ChannelSendPanningRestore]: ['source', 'target'],
	[ActionId.BusSendLevel]: ['source', 'target'],
	[ActionId.BusSendLevelDelta]: ['source', 'target'],
	[ActionId.BusSendLevelStore]: ['source', 'target'],
	[ActionId.BusSendLevelRestore]: ['source', 'target'],
	[ActionId.BusSendPanning]: ['source', 'target'],
	[ActionId.BusSendPanningDelta]: ['source', 'target'],
	[ActionId.BusSendPanningStore]: ['source', 'target'],
	[ActionId.BusSendPanningRestore]: ['source', 'target'],
	[ActionId.InputTrim]: ['input'],
	[ActionId.Label]: ['target'],
	[ActionId.Color]: ['target'],
	[ActionId.Select]: ['select'],
	[ActionId.HeadampGain]: ['headamp'],
	[ActionId.InsertOn]: ['src'],
	[ActionId.InsertPos]: ['src'],
	[ActionId.InsertSelect]: ['src'],
}
const feedbacksToUpgrade: Record<string, string[] | undefined> = {
	[FeedbackId.Mute]: ['target'],
	[FeedbackId.MuteGroup]: ['mute_grp'],
	[FeedbackId.MuteChannelSend]: ['source', 'target'],
	[FeedbackId.MuteBusSend]: ['source', 'target'],
	[FeedbackId.FaderLevel]: ['target'],
	[FeedbackId.ChannelSendLevel]: ['source', 'target'],
	[FeedbackId.BusSendLevel]: ['source', 'target'],
	[FeedbackId.ChannelPanning]: ['target'],
	[FeedbackId.ChannelSendPanning]: ['source', 'target'],
	[FeedbackId.BusSendPanning]: ['source', 'target'],
	[FeedbackId.OscillatorDestination]: ['destination'],
	[FeedbackId.InsertOn]: ['src'],
	[FeedbackId.InsertPos]: ['src'],
	[FeedbackId.InsertSelect]: ['src'],
}

export const upgradeChannelOrFaderValuesFromOscPaths: CompanionStaticUpgradeScript<any> = (_ctx, props) => {
	const result: CompanionStaticUpgradeResult<any, undefined> = {
		updatedConfig: null,
		updatedSecrets: null,
		updatedActions: [],
		updatedFeedbacks: [],
	}

	const upgradeProps = (options: ExpressionOptionsObject, propKeys: string[]) => {
		for (const propKey of propKeys) {
			if (!options[propKey]) {
				options[propKey] = exprVal('')
			} else if (options[propKey]?.isExpression) {
				continue // Skip expressions
			} else if (typeof options[propKey].value === 'string') {
				// Migrate value
				options[propKey].value = pathReplacements[options[propKey].value] ?? options[propKey].value
			}
		}
	}
	for (const action of props.actions) {
		// A couple of cases that need manual handling due to unclear & overlapping values
		if (action.actionId === ActionId.Solo) {
			if (action.options.solo) {
				action.options.solo.value =
					soloOrSelectChoicesLookup[Number(action.options.solo.value)] || action.options.solo.value
			}
		} else if (action.actionId === ActionId.Select) {
			if (action.options.select) {
				// This uses a few less than solo, but no harm in mapping the extra ones
				action.options.select.value =
					soloOrSelectChoicesLookup[Number(action.options.select.value)] || action.options.select.value
			}
		} else if (action.actionId === ActionId.TalkbackConfigSingleSource) {
			if (action.options.dest) {
				action.options.dest.value =
					talkbackTargetChoicesLookup[Number(action.options.dest.value)] || action.options.dest.value
			}
		} else if (action.actionId === ActionId.TalkbackConfig) {
			if (action.options.dest) {
				const destArr = Array.isArray(action.options.dest.value)
					? action.options.dest.value
					: [action.options.dest.value]
				action.options.dest.value = destArr.map((v) => talkbackTargetChoicesLookup[Number(v)] || v) as JsonValue
			}
		} else if (action.actionId === ActionId.Color) {
			// Merge the split color fields
			if (action.options.useVariable !== undefined) {
				action.options.col =
					action.options.useVariable.value && action.options.varCol
						? {
								isExpression: true,
								value: `parseVariables('${action.options.varCol.value}')`,
							}
						: {
								isExpression: false,
								value: getColorChoiceFromId(action.options.col?.value)?.id ?? action.options.col?.value,
							}
			}
		} else if (action.actionId === ActionId.OscillatorDestination) {
			if (action.options.destination) {
				action.options.destination.value =
					oscillatorDestinationChoicesLookup[Number(action.options.destination.value)] ||
					action.options.destination.value
			}
		}

		const propsToUpgrade = actionsToUpgrade[action.actionId]
		if (!propsToUpgrade) continue

		upgradeProps(action.options, propsToUpgrade)
		result.updatedActions.push(action)
	}
	for (const feedback of props.feedbacks) {
		if (feedback.feedbackId === FeedbackId.Solo) {
			if (feedback.options.solo) {
				feedback.options.solo.value =
					soloOrSelectChoicesLookup[Number(feedback.options.solo.value)] || feedback.options.solo.value
			}
		} else if (feedback.feedbackId === FeedbackId.Select) {
			if (feedback.options.select) {
				// This uses a few less than solo, but no harm in mapping the extra ones
				feedback.options.select.value =
					soloOrSelectChoicesLookup[Number(feedback.options.select.value)] || feedback.options.select.value
			}
		}

		const propsToUpgrade = feedbacksToUpgrade[feedback.feedbackId]
		if (!propsToUpgrade) continue

		upgradeProps(feedback.options, propsToUpgrade)
		result.updatedFeedbacks.push(feedback)
	}

	return result
}

const soloOrSelectChoicesLookup = [
	'channel1',
	'channel2',
	'channel3',
	'channel4',
	'channel5',
	'channel6',
	'channel7',
	'channel8',
	'channel9',
	'channel10',
	'channel11',
	'channel12',
	'channel13',
	'channel14',
	'channel15',
	'channel16',
	'channel17',
	'channel18',
	'channel19',
	'channel20',
	'channel21',
	'channel22',
	'channel23',
	'channel24',
	'channel25',
	'channel26',
	'channel27',
	'channel28',
	'channel29',
	'channel30',
	'channel31',
	'channel32',
	'aux1',
	'aux2',
	'aux3',
	'aux4',
	'aux5',
	'aux6',
	'aux7',
	'aux8',
	'fx1',
	'fx2',
	'fx3',
	'fx4',
	'fx5',
	'fx6',
	'fx7',
	'fx8',
	'bus1',
	'bus2',
	'bus3',
	'bus4',
	'bus5',
	'bus6',
	'bus7',
	'bus8',
	'bus9',
	'bus10',
	'bus11',
	'bus12',
	'bus13',
	'bus14',
	'bus15',
	'bus16',
	'matrix1',
	'matrix2',
	'matrix3',
	'matrix4',
	'matrix5',
	'matrix6',
	'stereo',
	'mono',
	'dca1',
	'dca2',
	'dca3',
	'dca4',
	'dca5',
	'dca6',
	'dca7',
	'dca8',
]

const talkbackTargetChoicesLookup = [
	'bus1',
	'bus2',
	'bus3',
	'bus4',
	'bus5',
	'bus6',
	'bus7',
	'bus8',
	'bus9',
	'bus10',
	'bus11',
	'bus12',
	'bus13',
	'bus14',
	'bus15',
	'bus16',
	'stereo',
	'mono',
]

const oscillatorDestinationChoicesLookup = [
	'bus1',
	'bus2',
	'bus3',
	'bus4',
	'bus5',
	'bus6',
	'bus7',
	'bus8',
	'bus9',
	'bus10',
	'bus11',
	'bus12',
	'bus13',
	'bus14',
	'bus15',
	'bus16',
	'left',
	'right',
	'stereo',
	'mono',
	'matrix1',
	'matrix2',
	'matrix3',
	'matrix4',
	'matrix5',
	'matrix6',
]
