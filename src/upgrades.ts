/* eslint-disable @typescript-eslint/no-unsafe-enum-comparison */
import {
	FixupNumericOrVariablesValueToExpressions,
	type CompanionMigrationOptionValues,
	type CompanionStaticUpgradeResult,
	type CompanionStaticUpgradeScript,
	type ExpressionOptionsObject,
	type JsonValue,
} from '@companion-module/base'
import { FeedbackId } from './feedback.js'
import { padNumber, stringifyValueAlways } from './util.js'
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

const pathReplacements: Record<string | number, string | number | undefined> = {
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
	mute: ['target'],
	mute_grp: ['target'],
	mute_channel_send: ['source', 'target'],
	mute_bus_send: ['source', 'target'],
	fad: ['target'],
	fader_store: ['target'],
	fader_restore: ['target'],
	fader_delta: ['target'],
	panning: ['target'],
	'panning-delta': ['target'],
	'panning-store': ['target'],
	'panning-restore': ['target'],
	level_channel_send: ['source', 'target'],
	level_channel_send_delta: ['source', 'target'],
	level_channel_store: ['source', 'target'],
	level_channel_restore: ['source', 'target'],
	'channel-send-panning': ['source', 'target'],
	'channel-send-panning-delta': ['source', 'target'],
	'channel-send-panning-store': ['source', 'target'],
	'channel-send-panning-restore': ['source', 'target'],
	level_bus_send: ['source', 'target'],
	level_bus_send_delta: ['source', 'target'],
	level_bus_store: ['source', 'target'],
	level_bus_restore: ['source', 'target'],
	'bus-send-panning': ['source', 'target'],
	'bus-send-panning-delta': ['source', 'target'],
	'bus-send-panning-store': ['source', 'target'],
	'bus-send-panning-restore': ['source', 'target'],
	input_trim: ['input'],
	label: ['target'],
	color: ['target'],
	select: ['select'],
	headamp_gain: ['headamp'],
	'insert-on': ['src'],
	'insert-pos': ['src'],
	'insert-select': ['src'],
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
		if (action.actionId === 'solo') {
			fixupNumericOption(action.options, 'solo', soloOrSelectChoicesLookup)
		} else if (action.actionId === 'select') {
			// This uses a few less than solo, but no harm in mapping the extra ones
			fixupNumericOption(action.options, 'select', soloOrSelectChoicesLookup)
		} else if (action.actionId === 'talkback_config_single_src') {
			fixupNumericOption(action.options, 'dest', talkbackTargetChoicesLookup)
		} else if (action.actionId === 'talkback_config') {
			fixupNumericOption(action.options, 'dest', talkbackTargetChoicesLookup, { asArray: true })
		} else if (action.actionId === 'color') {
			// Merge the split color fields
			if (action.options.useVariable !== undefined) {
				action.options.col =
					action.options.useVariable.value && action.options.varCol
						? {
								isExpression: true,
								value: `parseVariables('${stringifyValueAlways(action.options.varCol.value)}')`,
							}
						: {
								isExpression: false,
								value: getColorChoiceFromId(action.options.col?.value)?.id ?? action.options.col?.value,
							}
			}
		} else if (action.actionId === 'oscillator-destination') {
			fixupNumericOption(action.options, 'destination', oscillatorDestinationChoicesLookup)
		} else if (action.actionId === 'load-channel-preset') {
			fixupNumericOption(action.options, 'channel', soloOrSelectChoicesLookup, { includeSelectedAsMinusOne: true })
		}

		const propsToUpgrade = actionsToUpgrade[action.actionId]
		if (!propsToUpgrade) continue

		upgradeProps(action.options, propsToUpgrade)
		result.updatedActions.push(action)
	}
	for (const feedback of props.feedbacks) {
		if (feedback.feedbackId === FeedbackId.Solo) {
			fixupNumericOption(feedback.options, 'solo', soloOrSelectChoicesLookup)
		} else if (feedback.feedbackId === FeedbackId.Select) {
			// This uses a few less than solo, but no harm in mapping the extra ones
			fixupNumericOption(feedback.options, 'select', soloOrSelectChoicesLookup)
		} else if (feedback.feedbackId === FeedbackId.OscillatorDestination) {
			fixupNumericOption(feedback.options, 'destination', oscillatorDestinationChoicesLookup)
		} else if (feedback.feedbackId === FeedbackId.TalkbackConfigSingleSource) {
			fixupNumericOption(feedback.options, 'dest', talkbackTargetChoicesLookup)
		}

		const propsToUpgrade = feedbacksToUpgrade[feedback.feedbackId]
		if (!propsToUpgrade) continue

		upgradeProps(feedback.options, propsToUpgrade)
		result.updatedFeedbacks.push(feedback)
	}

	return result
}

function fixupNumericOption(
	options: CompanionMigrationOptionValues,
	key: string,
	newValues: Array<string>,
	opts?: {
		asArray?: boolean
		includeSelectedAsMinusOne?: boolean
	},
): void {
	if (!options[key]) return

	const translateValue = (val: JsonValue | undefined): JsonValue | undefined => {
		if (opts?.includeSelectedAsMinusOne && val === -1) {
			return 'selected'
		}
		return newValues[Number(val)] || val
	}

	if (opts?.asArray) {
		const rawArr = Array.isArray(options[key].value) ? options[key].value : [options[key].value]
		options[key].value = rawArr.map((v) => translateValue(v)) as JsonValue
	} else {
		options[key].value = translateValue(options[key].value)
	}
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

export const upgradeToBuiltinVariableParsing: CompanionStaticUpgradeScript<any> = (_ctx, props) => {
	const result: CompanionStaticUpgradeResult<any, undefined> = {
		updatedConfig: null,
		updatedSecrets: null,
		updatedActions: [],
		updatedFeedbacks: [],
	}

	for (const action of props.actions) {
		if (
			action.actionId === 'panning-delta' ||
			action.actionId === 'bus-send-panning-delta' ||
			action.actionId === 'channel-send-panning-delta' ||
			action.actionId === 'fader_delta' ||
			action.actionId === 'level_channel_send_delta' ||
			action.actionId === 'level_bus_send_delta'
		) {
			const oldValue = action.options.useVariable?.value ? action.options.varDelta : action.options.delta
			delete action.options.useVariable
			delete action.options.varDelta

			action.options.delta = FixupNumericOrVariablesValueToExpressions(oldValue)
		}
	}

	return result
}
