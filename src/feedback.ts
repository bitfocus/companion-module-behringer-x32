import { X32State, X32Subscriptions } from './state.js'
import {
	GetMuteGroupChoices,
	GetTargetChoices,
	GetChannelSendChoices,
	convertChoices,
	GetOscillatorDestinations,
	FaderLevelChoice,
	PanningChoice,
	GetLevelsChoiceConfigs,
	GetPanningChoiceConfigs,
	CHOICES_TAPE_FUNC,
	GetAesBlocks,
	GetAesCardRouteBlocks,
	GetAuxBlockRoutes,
	GetInputBlockRoutes,
	GetInputBlocks,
	GetLeftOutputBlockRoutes,
	GetRightOutputBlockRoutes,
	GetUserInSources,
	GetUserInTargets,
	GetUserOutSources,
	GetUserOutTargets,
	GetInsertDestinationChoices,
	GetTalkbackDestinations,
	GetChannelSendParseOptions,
	OscillatorDestinationsParseOptions,
} from './choices.js'
import { compareNumber, floatToDB, InstanceBaseExt, padNumber } from './util.js'
import { UserRouteInPath, UserRouteOutPath, parseRefToPaths, ParseRefOptions } from './paths.js'
import osc from 'osc'
import { X32Config } from './config.js'
import { NumberComparitorPicker } from './input.js'
import type { SetRequired } from 'type-fest'
import {
	CompanionBooleanFeedbackDefinition,
	CompanionFeedbackDefinitions,
	CompanionFeedbackInfo,
	CompanionOptionValues,
} from '@companion-module/base'

type CompanionFeedbackWithCallback = SetRequired<CompanionBooleanFeedbackDefinition, 'callback' | 'unsubscribe'>

export enum FeedbackId {
	Mute = 'mute',
	MuteGroup = 'mute_grp',
	MuteChannelSend = 'mute_channel_send',
	MuteBusSend = 'mute_bus_send',
	FaderLevel = 'fader_level',
	ChannelSendLevel = 'level_channel_send',
	BusSendLevel = 'level_bus_send',
	ChannelPanning = 'channel_panning',
	ChannelSendPanning = 'channel_send_panning',
	BusSendPanning = 'bus_send_panning',
	TalkbackTalk = 'talkback_talk',
	TalkbackConfigSingleSource = 'talkback_config_single_source',
	OscillatorEnable = 'oscillator-enable',
	OscillatorDestination = 'oscillator-destination',
	SoloMono = 'solo-mono',
	SoloDim = 'solo-dim',
	Select = 'select',
	Solo = 'solo',
	ClearSolo = 'clear',
	SendsOnFader = 'sends-on-fader',
	Tape = 'tape',
	ChannelBank = 'channel-bank',
	GroupBank = 'group-bank',
	ChannelBankCompact = 'channel-bank-compact',
	GroupBankCompact = 'group-bank-compact',
	BusSendBank = 'bus-send-bank',
	UserBank = 'user-bank',
	Screens = 'screens',
	MuteGroupScreen = 'mute-group-screen',
	UtilityScreen = 'utility-screen',
	ChannelPage = 'channel-page',
	MeterPage = 'meter-page',
	RoutePage = 'route-page',
	SetupPage = 'setup-page',
	LibPage = 'library-page',
	FxPage = 'effects-page',
	MonPage = 'monitor-page',
	USBPage = 'usb-page',
	ScenePage = 'scene-page',
	AssignPage = 'assign-page',
	RouteUserIn = 'route-user-in',
	RouteUserOut = 'route-user-out',
	StoredChannel = 'stored-channel',
	Record = 'record',
	RouteInputBlockMode = 'route-input-block-mode',
	RouteInputBlocks = 'route-input-blocks',
	RouteAuxBlocks = 'route-aux-blocks',
	RouteAES50Blocks = 'route-aes50-blocks',
	RouteCardBlocks = 'route-card-blocks',
	RouteXLRLeftOutputs = 'route-xlr-left-outputs',
	RouteXLRRightOutputs = 'route-xlr-right-outputs',
	LockAndShutdown = 'lock-and-shutdown',
	InsertOn = 'insert-on',
	InsertPos = 'insert-pos',
	InsertSelect = 'insert-select',
	UndoAvailable = 'undo-available',
}

function getDataNumber(data: osc.MetaArgument[] | undefined, index: number): number | undefined {
	const val = data ? data[index] : undefined
	return val?.type === 'i' || val?.type === 'f' ? val.value : undefined
}

const getOptNumber = (options: CompanionOptionValues, key: string, defVal?: number): number => {
	const rawVal = options[key]
	if (defVal !== undefined && rawVal === undefined) return defVal
	const val = Number(rawVal)
	if (isNaN(val)) {
		throw new Error(`Invalid option '${key}'`)
	}
	return val
}

function subscribeFeedback(
	ensureLoaded: (path: string) => void,
	subs: X32Subscriptions,
	path: string,
	evt: CompanionFeedbackInfo,
): void {
	subs.subscribe(path, evt.id, evt.feedbackId as FeedbackId)
	ensureLoaded(path)
}

export function GetFeedbacksList(
	_self: InstanceBaseExt<X32Config>,
	state: X32State,
	subs: X32Subscriptions,
	ensureLoaded: (path: string) => void,
): CompanionFeedbackDefinitions {
	const levelsChoices = GetLevelsChoiceConfigs(state)
	const panningChoices = GetPanningChoiceConfigs(state)
	const muteGroups = GetMuteGroupChoices(state)
	const selectChoices = GetTargetChoices(state, { skipDca: true, includeMain: true, numericIndex: true }, true)
	const selectChoicesParseOptions: ParseRefOptions = {
		allowStereo: true,
		allowMono: true,
		allowChannel: true,
		allowAuxIn: true,
		allowFx: true,
		allowBus: true,
		allowMatrix: true,
	}
	const soloChoices = GetTargetChoices(state, { includeMain: true, numericIndex: true }, true)
	const soloChoicesParseOptions: ParseRefOptions = {
		allowStereo: true,
		allowMono: true,
		allowChannel: true,
		allowAuxIn: true,
		allowFx: true,
		allowBus: true,
		allowMatrix: true,
		allowDca: true,
	}
	const insertSourceChoices = GetTargetChoices(
		state,
		{
			includeMain: true,
			skipAuxIn: true,
			skipFxRtn: true,
			skipDca: true,
		},
		true,
	)
	const insertSourceParseOptions: ParseRefOptions = {
		allowStereo: true,
		allowMono: true,
		allowChannel: true,
		allowBus: true,
		allowMatrix: true,
	}

	const feedbackSubscriptionWrapper = (input: {
		getPath: (options: CompanionOptionValues) => string | null
		getValue: (evt: CompanionFeedbackInfo, data: osc.MetaArgument[] | undefined) => boolean
	}): Pick<CompanionFeedbackWithCallback, 'callback' | 'unsubscribe'> => {
		return {
			callback: (evt: CompanionFeedbackInfo) => {
				const path = input.getPath(evt.options)
				const oldPath = evt.previousOptions ? input.getPath(evt.previousOptions) : null

				if (oldPath !== path) {
					// Unsubscribe old path
					if (oldPath) subs.unsubscribe(oldPath, evt.id)

					// Subscribe new path
					if (path) subscribeFeedback(ensureLoaded, subs, path, evt)
				}

				// Execute the feedback
				const data = path ? state.get(path) : undefined
				return input.getValue(evt, data)
			},
			unsubscribe: (evt: CompanionFeedbackInfo) => {
				const path = input.getPath(evt.options)
				if (path) subs.unsubscribe(path, evt.id)
			},
		}
	}

	const screenSelectionSubscriptionWrapper = (input: {
		contentPath: string
		getValue: (
			evt: CompanionFeedbackInfo,
			screenData: osc.MetaArgument[] | undefined,
			contentData: osc.MetaArgument[] | undefined,
		) => boolean
	}): Pick<CompanionFeedbackWithCallback, 'callback' | 'unsubscribe'> => {
		const screenPath = '/-stat/screen/screen'

		return {
			callback: (evt: CompanionFeedbackInfo) => {
				subscribeFeedback(ensureLoaded, subs, screenPath, evt)
				subscribeFeedback(ensureLoaded, subs, input.contentPath, evt)

				// Execute the feedback
				return input.getValue(evt, state.get(screenPath), state.get(input.contentPath))
			},
			unsubscribe: (evt: CompanionFeedbackInfo) => {
				subs.unsubscribe(screenPath, evt.id)
				subs.unsubscribe(input.contentPath, evt.id)
			},
		}
	}

	const feedbacks: { [id in FeedbackId]: CompanionFeedbackWithCallback | undefined } = {
		[FeedbackId.Record]: {
			type: 'boolean',
			name: 'Change from X-Live state',
			description: 'If the X-Live state has changed, change style of the bank',
			options: [
				{
					type: 'dropdown',
					label: 'State',
					id: 'state',
					choices: [
						{ id: 3, label: 'Record' },
						{ id: 2, label: 'Play' },
						{ id: 1, label: 'Pause' },
						{ id: 0, label: 'Stop' },
					],
					default: 3,
					disableAutoExpression: true,
				},
			],
			defaultStyle: {
				bgcolor: 0xff0000,
				color: 0x000000,
			},
			...feedbackSubscriptionWrapper({
				getPath: () => `/-stat/urec/state`,
				getValue: (evt, data) => {
					const record = getDataNumber(data, 0) === 3
					return record === evt.options.state
				},
			}),
		},
		[FeedbackId.Mute]: {
			type: 'boolean',
			name: 'Change from mute state',
			description: 'If the specified target is muted, change style of the bank',
			options: [
				{
					id: 'target',
					type: 'dropdown',
					label: 'Target',
					...convertChoices(levelsChoices.channels),
					allowInvalidValues: true,
				},
			],
			defaultStyle: {
				bgcolor: 0xff0000,
				color: 0x000000,
			},
			...feedbackSubscriptionWrapper({
				getPath: (options) => {
					const refPaths = parseRefToPaths(options.target, levelsChoices.channelsParseOptions)
					if (!refPaths?.muteOrOn) return null // Not a valid path

					return refPaths.muteOrOn.path
				},
				getValue: (_evt, data) => getDataNumber(data, 0) === 0,
			}),
		},
		[FeedbackId.MuteGroup]: {
			type: 'boolean',
			name: 'Change from mute group state',
			description: 'If the specified mute group is muted, change style of the bank',
			options: [
				{
					id: 'mute_grp',
					type: 'dropdown',
					label: 'Target',
					...convertChoices(muteGroups),
					allowInvalidValues: true,
				},
			],
			defaultStyle: {
				bgcolor: 0xff0000,
				color: 0x000000,
			},
			...feedbackSubscriptionWrapper({
				getPath: (options) => {
					const muteGroupNumber = parseInt(options.mute_grp as string, 10)
					if (isNaN(muteGroupNumber)) return null

					return `/config/mute/${muteGroupNumber}`
				},
				getValue: (_evt, data) => getDataNumber(data, 0) === 1,
			}),
		},
		[FeedbackId.MuteChannelSend]: {
			type: 'boolean',
			name: 'Change from channel to bus send mute state',
			description: 'If the specified channel send is muted, change style of the bank',
			options: [
				{
					type: 'dropdown',
					label: 'Source',
					id: 'source',
					...convertChoices(levelsChoices.allSources),
					allowInvalidValues: true,
				},
				{
					type: 'dropdown',
					label: 'Target',
					id: 'target',
					...convertChoices(GetChannelSendChoices(state, 'on', true)),
					allowInvalidValues: true,
				},
			],
			defaultStyle: {
				bgcolor: 0xff0000,
				color: 0x000000,
			},
			...feedbackSubscriptionWrapper({
				getPath: (options) => {
					const sourceRef = parseRefToPaths(options.source, levelsChoices.allSourcesParseOptions)
					const targetRef = parseRefToPaths(options.target, GetChannelSendParseOptions)
					if (!sourceRef?.sendTo || !targetRef?.sendToSink?.on) return null

					return `${sourceRef.sendTo.path}/${targetRef.sendToSink.on}`
				},
				getValue: (_evt, data) => getDataNumber(data, 0) === 0,
			}),
		},
		[FeedbackId.MuteBusSend]: {
			type: 'boolean',
			name: 'Change from bus to matrix send mute state',
			description: 'If the specified bus send is muted, change style of the bank',
			options: [
				{
					type: 'dropdown',
					label: 'Source',
					id: 'source',
					...convertChoices(levelsChoices.busSendSources),
					allowInvalidValues: true,
				},
				{
					type: 'dropdown',
					label: 'Target',
					id: 'target',
					...convertChoices(levelsChoices.busSendTargets),
					allowInvalidValues: true,
				},
			],
			defaultStyle: {
				bgcolor: 0xff0000,
				color: 0x000000,
			},
			...feedbackSubscriptionWrapper({
				getPath: (options) => {
					const sourceRef = parseRefToPaths(options.source, levelsChoices.busSendSourcesParseOptions)
					const targetRef = parseRefToPaths(options.target, levelsChoices.busSendTargetsParseOptions)
					if (!sourceRef?.sendTo || !targetRef?.sendToSink?.on) return null

					return `${sourceRef.sendTo.path}/${targetRef.sendToSink.on}`
				},
				getValue: (_evt, data) => getDataNumber(data, 0) === 0,
			}),
		},
		[FeedbackId.FaderLevel]: {
			type: 'boolean',
			name: 'Change from fader level',
			description: 'If the fader level has the specified gain, change style of the bank',
			options: [
				{
					type: 'dropdown',
					label: 'Target',
					id: 'target',
					...convertChoices(levelsChoices.channels),
					allowInvalidValues: true,
				},
				NumberComparitorPicker(),
				FaderLevelChoice,
			],
			defaultStyle: {
				bgcolor: 0x00ff00,
				color: 0x000000,
			},
			...feedbackSubscriptionWrapper({
				getPath: (options) => {
					const refPaths = parseRefToPaths(options.target, levelsChoices.channelsParseOptions)
					if (!refPaths?.level) return null // Not a valid path

					return refPaths.level.path
				},
				getValue: (evt, data) => {
					const currentVal = data && data[0]?.type === 'f' ? data[0]?.value : undefined
					return (
						typeof currentVal === 'number' &&
						compareNumber(evt.options.fad, evt.options.comparitor, floatToDB(currentVal))
					)
				},
			}),
		},
		[FeedbackId.ChannelSendLevel]: {
			type: 'boolean',
			name: 'Change from level of channel to bus send',
			description: 'If the channel to bus send level has the specified gain, change style of the bank',
			options: [
				{
					type: 'dropdown',
					label: 'Source',
					id: 'source',
					...convertChoices(levelsChoices.allSources),
					allowInvalidValues: true,
				},
				{
					type: 'dropdown',
					label: 'Target',
					id: 'target',
					...convertChoices(levelsChoices.channelSendTargets),
					allowInvalidValues: true,
				},
				NumberComparitorPicker(),
				FaderLevelChoice,
			],
			defaultStyle: {
				bgcolor: 0x00ff00,
				color: 0x000000,
			},
			...feedbackSubscriptionWrapper({
				getPath: (options) => {
					const sourceRef = parseRefToPaths(options.source, levelsChoices.allSourcesParseOptions)
					const targetRef = parseRefToPaths(options.target, levelsChoices.channelSendTargetsParseOptions)
					if (!sourceRef?.sendTo || !targetRef?.sendToSink?.level) return null

					return `${sourceRef.sendTo.path}/${targetRef.sendToSink.level}`
				},
				getValue: (evt, data) => {
					const currentVal = data && data[0]?.type === 'f' ? data[0]?.value : undefined
					return (
						typeof currentVal === 'number' &&
						compareNumber(evt.options.fad, evt.options.comparitor, floatToDB(currentVal))
					)
				},
			}),
		},
		[FeedbackId.BusSendLevel]: {
			type: 'boolean',
			name: 'Change from level of bus to matrix send',
			description: 'If the bus to matrix send level has the specified gain, change style of the bank',
			options: [
				{
					type: 'dropdown',
					label: 'Source',
					id: 'source',
					...convertChoices(levelsChoices.busSendSources),
					allowInvalidValues: true,
				},
				{
					type: 'dropdown',
					label: 'Target',
					id: 'target',
					...convertChoices(levelsChoices.busSendTargets),
					allowInvalidValues: true,
				},
				NumberComparitorPicker(),
				FaderLevelChoice,
			],
			defaultStyle: {
				bgcolor: 0x00ff00,
				color: 0x000000,
			},
			...feedbackSubscriptionWrapper({
				getPath: (options) => {
					const sourceRef = parseRefToPaths(options.source, levelsChoices.busSendSourcesParseOptions)
					const targetRef = parseRefToPaths(options.target, levelsChoices.busSendTargetsParseOptions)
					if (!sourceRef?.sendTo || !targetRef?.sendToSink?.level) return null

					return `${sourceRef.sendTo.path}/${targetRef.sendToSink.level}`
				},
				getValue: (evt, data) => {
					const currentVal = data && data[0]?.type === 'f' ? data[0]?.value : undefined
					return (
						typeof currentVal === 'number' &&
						compareNumber(evt.options.fad, evt.options.comparitor, floatToDB(currentVal))
					)
				},
			}),
		},

		[FeedbackId.ChannelPanning]: {
			type: 'boolean',
			name: 'Change from channel panning',
			description: 'If the channel panning has the specified value, change style of the bank',
			options: [
				{
					type: 'dropdown',
					label: 'Target',
					id: 'target',
					...convertChoices(panningChoices.allSources),
					allowInvalidValues: true,
				},
				NumberComparitorPicker(),
				PanningChoice,
			],
			defaultStyle: {
				bgcolor: 0x00ff00,
				color: 0x000000,
			},
			...feedbackSubscriptionWrapper({
				getPath: (options) => {
					const refPaths = parseRefToPaths(options.target, panningChoices.allSourcesParseOptions)
					if (!refPaths?.pan) return null // Not a valid path

					return refPaths.pan.path
				},
				getValue: (evt, data) => {
					const currentVal = data && data[0]?.type === 'f' ? data[0]?.value : undefined
					return (
						typeof currentVal === 'number' &&
						compareNumber(evt.options.pan, evt.options.comparitor, currentVal * 100 - 50)
					)
				},
			}),
		},
		[FeedbackId.ChannelSendPanning]: {
			type: 'boolean',
			name: 'Change from channel send panning',
			description: 'If the channel send panning has the specified value, change style of the bank',
			options: [
				{
					type: 'dropdown',
					label: 'Source',
					id: 'source',
					...convertChoices(panningChoices.allSources),
					allowInvalidValues: true,
				},
				{
					type: 'dropdown',
					label: 'Target',
					id: 'target',
					...convertChoices(panningChoices.channelSendTargets),
					allowInvalidValues: true,
				},
				NumberComparitorPicker(),
				PanningChoice,
			],
			defaultStyle: {
				bgcolor: 0x00ff00,
				color: 0x000000,
			},
			...feedbackSubscriptionWrapper({
				getPath: (options) => {
					const sourceRef = parseRefToPaths(options.source, levelsChoices.allSourcesParseOptions)
					const targetRef = parseRefToPaths(options.target, levelsChoices.channelSendTargetsParseOptions)
					if (!sourceRef?.sendTo || !targetRef?.sendToSink?.pan) return null

					return `${sourceRef.sendTo.path}/${targetRef.sendToSink.pan}`
				},
				getValue: (evt, data) => {
					const currentVal = data && data[0]?.type === 'f' ? data[0]?.value : undefined
					return (
						typeof currentVal === 'number' &&
						compareNumber(evt.options.pan, evt.options.comparitor, currentVal * 100 - 50)
					)
				},
			}),
		},
		[FeedbackId.BusSendPanning]: {
			type: 'boolean',
			name: 'Change from bus send panning',
			description: 'If the bus send has the specified value, change style of the bank',
			options: [
				{
					type: 'dropdown',
					label: 'Source',
					id: 'source',
					...convertChoices(panningChoices.busSendSource),
					allowInvalidValues: true,
				},
				{
					type: 'dropdown',
					label: 'Target',
					id: 'target',
					...convertChoices(panningChoices.busSendTarget),
					allowInvalidValues: true,
				},
				NumberComparitorPicker(),
				PanningChoice,
			],
			defaultStyle: {
				bgcolor: 0x00ff00,
				color: 0x000000,
			},
			...feedbackSubscriptionWrapper({
				getPath: (options) => {
					const sourceRef = parseRefToPaths(options.source, panningChoices.busSendSourceParseOptions)
					const targetRef = parseRefToPaths(options.target, panningChoices.busSendTargetParseOptions)
					if (!sourceRef?.sendTo || !targetRef?.sendToSink?.pan) return null

					return `${sourceRef.sendTo.path}/${targetRef.sendToSink.pan}`
				},
				getValue: (evt, data) => {
					const currentVal = data && data[0]?.type === 'f' ? data[0]?.value : undefined
					return (
						typeof currentVal === 'number' &&
						compareNumber(evt.options.pan, evt.options.comparitor, currentVal * 100 - 50)
					)
				},
			}),
		},
		[FeedbackId.TalkbackTalk]: {
			type: 'boolean',
			name: 'Change from talkback talk state',
			description: 'If the specified talkback is on, change style of the bank',
			options: [
				{
					type: 'dropdown',
					label: 'Function',
					id: 'channel',
					...convertChoices([
						{
							id: 'A',
							label: 'A',
						},
						{
							id: 'B',
							label: 'B',
						},
					]),
					disableAutoExpression: true,
				},
			],
			defaultStyle: {
				bgcolor: 0xff7f00,
				color: 0x000000,
			},
			...feedbackSubscriptionWrapper({
				getPath: (options) => `/-stat/talk/${options.channel}`,
				getValue: (_evt, data) => getDataNumber(data, 0) === 1,
			}),
		},
		[FeedbackId.TalkbackConfigSingleSource]: {
			type: 'boolean',
			name: 'Change from talkback config of single source',
			description: 'If the source is mapped to a talkback destination, change style of the bank',
			options: [
				{
					type: 'dropdown',
					label: 'Function',
					id: 'channel',
					...convertChoices([
						{
							id: 'A',
							label: 'A',
						},
						{
							id: 'B',
							label: 'B',
						},
					]),
					disableAutoExpression: true,
				},
				{
					type: 'dropdown',
					label: 'Destinations',
					id: 'dest',
					default: 0,
					choices: GetTalkbackDestinations(state),
				},
			],
			defaultStyle: {
				bgcolor: 0xff7f00,
				color: 0x000000,
			},
			...feedbackSubscriptionWrapper({
				getPath: (options) => `/config/talk/${options.channel}/destmap`,
				getValue: (evt, data) => {
					const bitmap = getDataNumber(data, 0) ?? 0
					const mask = Math.pow(2, evt.options.dest as number)
					return (bitmap & mask) > 0
				},
			}),
		},
		[FeedbackId.OscillatorEnable]: {
			type: 'boolean',
			name: 'Change from oscillator enabled state',
			description: 'If the oscillator is on, change style of the bank',
			options: [],
			defaultStyle: {
				bgcolor: 0xff0000,
				color: 0x000000,
			},
			...feedbackSubscriptionWrapper({
				getPath: () => `/-stat/osc/on`,
				getValue: (_evt, data) => getDataNumber(data, 0) !== 0,
			}),
		},
		[FeedbackId.OscillatorDestination]: {
			type: 'boolean',
			name: 'Change from oscillator destination state',
			description: 'If the oscillator destination matches, change style of the bank',
			options: [
				{
					type: 'dropdown',
					label: 'destination',
					id: 'destination',
					...convertChoices(GetOscillatorDestinations(state, true)),
					allowInvalidValues: true,
				},
			],
			defaultStyle: {
				bgcolor: 0xff0000,
				color: 0x000000,
			},
			...feedbackSubscriptionWrapper({
				getPath: () => `/config/osc/dest`,
				getValue: (evt, data) => {
					const destRef = parseRefToPaths(evt.options.destination, OscillatorDestinationsParseOptions)
					if (!destRef?.oscillatorDestValue) return false

					const destination = getDataNumber(data, 0)
					return destination === destRef.oscillatorDestValue
				},
			}),
		},
		[FeedbackId.Select]: {
			type: 'boolean',
			name: 'Change from select state',
			description: 'If specified channel is selected, change style of the bank',
			options: [
				{
					type: 'dropdown',
					label: 'Target',
					id: 'select',
					...convertChoices(selectChoices),
					allowInvalidValues: true,
				},
			],
			defaultStyle: {
				bgcolor: 0x00ff7f,
				color: 0x000000,
			},
			...feedbackSubscriptionWrapper({
				getPath: () => `/-stat/selidx`,
				getValue: (evt, data) => {
					const selectRef = parseRefToPaths(evt.options.select, selectChoicesParseOptions)
					if (selectRef?.selectNumber === undefined) return false

					const selectedChannel = getDataNumber(data, 0)
					return selectedChannel == selectRef.selectNumber
				},
			}),
		},
		[FeedbackId.Solo]: {
			type: 'boolean',
			name: 'Change from solo enabled state',
			description: 'If the solo is on for specified channel, change style of the bank',
			options: [
				{
					type: 'dropdown',
					label: 'Target',
					id: 'solo',
					...convertChoices(soloChoices),
					allowInvalidValues: true,
				},
			],
			defaultStyle: {
				bgcolor: 0xff7f00,
				color: 0x000000,
			},
			...feedbackSubscriptionWrapper({
				getPath: (options) => {
					const soloRef = parseRefToPaths(options.solo, soloChoicesParseOptions)
					if (soloRef?.soloNumber === undefined) return null
					return `/-stat/solosw/${padNumber(soloRef.soloNumber)}`
				},
				getValue: (_evt, data) => getDataNumber(data, 0) !== 0,
			}),
		},
		[FeedbackId.ClearSolo]: {
			type: 'boolean',
			name: 'Change from clear solo state',
			description: 'If atleast one solo is selected the clear solo button is on and will change style of the bank',
			options: [],
			defaultStyle: {
				bgcolor: 0xff7f00,
				color: 0x000000,
			},
			...feedbackSubscriptionWrapper({
				getPath: () => `/-stat/solo`,
				getValue: (_evt, data) => getDataNumber(data, 0) !== 0,
			}),
		},
		[FeedbackId.SendsOnFader]: {
			type: 'boolean',
			name: 'Change from Sends on Fader/Fader Flip state',
			description: 'If the Sends on Fader/Fader Flip is on, change style of the bank',
			options: [],
			defaultStyle: {
				bgcolor: 0xff7f00,
				color: 0x000000,
			},
			...feedbackSubscriptionWrapper({
				getPath: () => `/-stat/sendsonfader`,
				getValue: (_evt, data) => getDataNumber(data, 0) !== 0,
			}),
		},
		[FeedbackId.SoloMono]: {
			type: 'boolean',
			name: 'Change from Solo Mono enabled state',
			description: 'If the Solo Mono is on, change style of the bank',
			options: [],
			defaultStyle: {
				bgcolor: 0xff7f00,
				color: 0x000000,
			},
			...feedbackSubscriptionWrapper({
				getPath: () => `/config/solo/mono`,
				getValue: (_evt, data) => getDataNumber(data, 0) !== 0,
			}),
		},
		[FeedbackId.SoloDim]: {
			type: 'boolean',
			name: 'Change from Solo Dim enabled state',
			description: 'If the Solo Dim is on, change style of the bank',
			options: [],
			defaultStyle: {
				bgcolor: 0xff7f00,
				color: 0x000000,
			},
			...feedbackSubscriptionWrapper({
				getPath: () => `/config/solo/dim`,
				getValue: (_evt, data) => getDataNumber(data, 0) !== 0,
			}),
		},
		[FeedbackId.Tape]: {
			type: 'boolean',
			name: 'Change from tape operation state',
			description: 'If the tape state matches, change style of the bank',
			options: [
				{
					type: 'dropdown',
					label: 'Function',
					id: 'tapeFunc',
					...convertChoices(CHOICES_TAPE_FUNC),
					disableAutoExpression: true,
				},
			],
			defaultStyle: {
				bgcolor: 0xff0000,
				color: 0x000000,
			},
			...feedbackSubscriptionWrapper({
				getPath: () => `/-stat/tape/state`,
				getValue: (evt, data) => getDataNumber(data, 0) == evt.options.tapeFunc,
			}),
		},
		[FeedbackId.ChannelBank]: {
			type: 'boolean',
			name: 'Change from selected channel bank (X32/M32)',
			description:
				'If the channel bank matches the selected channel bank, change style of the bank. Please note these will be incorrect if used connected to an X32 Compact/X32 Producer/M32R use the X32 Compact/X32 Producer/M32R feedback instead.',
			options: [
				{
					type: 'dropdown',
					label: 'Bank',
					id: 'bank',
					...convertChoices([
						{
							id: '0',
							label: 'CH 1 - 16',
						},
						{
							id: '1',
							label: 'CH 17 - 32',
						},
						{
							id: '2',
							label: 'AUX IN / USB / FX RTN',
						},
						{
							id: '3',
							label: 'BUS MASTERS',
						},
					]),
					disableAutoExpression: true,
				},
			],
			defaultStyle: {
				bgcolor: 0x00ff7f,
				color: 0x000000,
			},
			...feedbackSubscriptionWrapper({
				getPath: () => `/-stat/chfaderbank`,
				getValue: (evt, data) => getDataNumber(data, 0) == evt.options.bank,
			}),
		},
		[FeedbackId.GroupBank]: {
			type: 'boolean',
			name: 'Change from selected group bank (X32/M32)',
			description:
				'If the group bank matches the selected group bank, change style of the bank. Please note these will be incorrect if used connected to an X32 Compact/X32 Producer/M32R use the X32 Compact/X32 Producer/M32R feedback instead.',
			options: [
				{
					type: 'dropdown',
					label: 'Bank',
					id: 'bank',
					...convertChoices([
						{
							id: '0',
							label: 'GROUP DCA 1 - 8',
						},
						{
							id: '1',
							label: 'BUS 1 - 8',
						},
						{
							id: '2',
							label: 'BUS 9 - 16',
						},
						{
							id: '3',
							label: 'MATRIX 1 - 6 / MAIN C',
						},
					]),
					disableAutoExpression: true,
				},
			],
			defaultStyle: {
				bgcolor: 0x00ff7f,
				color: 0x000000,
			},
			...feedbackSubscriptionWrapper({
				getPath: () => `/-stat/grpfaderbank`,
				getValue: (evt, data) => getDataNumber(data, 0) == evt.options.bank,
			}),
		},
		[FeedbackId.ChannelBankCompact]: {
			type: 'boolean',
			name: 'Change from selected channel bank (X32 Compact/X32 Producer/M32R)',
			description:
				'If the channel bank matches the selected channel bank, change style of the bank. Please note these will be incorrect if used connected to an X32/M32 use the X32/M32 feedback instead.',
			options: [
				{
					type: 'dropdown',
					label: 'Bank',
					id: 'bank',
					...convertChoices([
						{
							id: '0',
							label: 'CH 1 - 8',
						},
						{
							id: '1',
							label: 'CH 9 - 16',
						},
						{
							id: '2',
							label: 'CH 17 - 24',
						},
						{
							id: '3',
							label: 'CH 25 - 32',
						},
						{
							id: '4',
							label: 'AUX IN / USB',
						},
						{
							id: '5',
							label: 'FX RTN',
						},
						{
							id: '6',
							label: 'BUS 1-8',
						},
						{
							id: '7',
							label: 'BUS 1-8',
						},
					]),
					disableAutoExpression: true,
				},
			],
			defaultStyle: {
				bgcolor: 0x00ff7f,
				color: 0x000000,
			},
			...feedbackSubscriptionWrapper({
				getPath: () => `/-stat/chfaderbank`,
				getValue: (evt, data) => getDataNumber(data, 0) == evt.options.bank,
			}),
		},
		[FeedbackId.GroupBankCompact]: {
			type: 'boolean',
			name: 'Change from selected group bank (X32 Compact/X32 Producer/M32R)',
			description:
				'If the group bank matches the selected group bank, change style of the bank. Please note these will be incorrect if used connected to an X32/M32 use the X32/M32 feedback instead.',
			options: [
				{
					type: 'dropdown',
					label: 'Bank',
					id: 'bank',
					...convertChoices([
						{
							id: '0',
							label: 'GROUP DCA 1 - 8',
						},
						{
							id: '1',
							label: 'BUS 1 - 8',
						},
						{
							id: '2',
							label: 'BUS 9 - 16',
						},
						{
							id: '3',
							label: 'MATRIX 1 - 6 / MAIN C',
						},
						{
							id: '4',
							label: 'CH 1 - 8',
						},
						{
							id: '5',
							label: 'CH 9 - 16',
						},
						{
							id: '6',
							label: 'CH 17 - 24',
						},
						{
							id: '7',
							label: 'CH 25 - 32',
						},
						{
							id: '8',
							label: 'AUX IN / USB',
						},
						{
							id: '9',
							label: 'FX RTN',
						},
					]),
					disableAutoExpression: true,
				},
			],
			defaultStyle: {
				bgcolor: 0x00ff7f,
				color: 0x000000,
			},
			...feedbackSubscriptionWrapper({
				getPath: () => `/-stat/grpfaderbank`,
				getValue: (evt, data) => getDataNumber(data, 0) == evt.options.bank,
			}),
		},
		[FeedbackId.BusSendBank]: {
			type: 'boolean',
			name: 'Change from selected Bus Send',
			description: 'If the selected bus send bank is active,, change style of the bank',
			options: [
				{
					type: 'dropdown',
					label: 'Send Bank',
					id: 'bank',
					...convertChoices([
						{
							id: '0',
							label: 'Bus 1-4',
						},
						{
							id: '1',
							label: 'Bus 5-8',
						},
						{
							id: '2',
							label: 'Bus 9-12',
						},
						{
							id: '3',
							label: 'Bus 13-16',
						},
					]),
					disableAutoExpression: true,
				},
			],
			defaultStyle: {
				bgcolor: 0xff7f00,
				color: 0x000000,
			},
			...feedbackSubscriptionWrapper({
				getPath: () => `/-stat/bussendbank`,
				getValue: (evt, data) => getDataNumber(data, 0) == evt.options.bank,
			}),
		},
		[FeedbackId.UserBank]: {
			type: 'boolean',
			name: 'Change from selected User Assign Bank',
			description: 'If the selected assign bank is active, change style of the bank',
			options: [
				{
					type: 'dropdown',
					label: 'User Bank',
					id: 'bank',
					...convertChoices([
						{
							id: '0',
							label: 'Set A',
						},
						{
							id: '1',
							label: 'Set B',
						},
						{
							id: '2',
							label: 'Set C',
						},
					]),
					disableAutoExpression: true,
				},
			],
			defaultStyle: {
				bgcolor: 0xff7f00,
				color: 0x000000,
			},
			...feedbackSubscriptionWrapper({
				getPath: () => `/-stat/userbank`,
				getValue: (evt, data) => getDataNumber(data, 0) == evt.options.bank,
			}),
		},
		[FeedbackId.Screens]: {
			type: 'boolean',
			name: 'Change from screen state',
			description: 'If the select screen is being shown, change style of the bank',
			options: [
				{
					type: 'dropdown',
					label: 'Screen',
					id: 'screen',
					...convertChoices([
						{
							id: '0',
							label: 'HOME',
						},
						{
							id: '1',
							label: 'METERS',
						},
						{
							id: '2',
							label: 'ROUTING',
						},
						{
							id: '3',
							label: 'SETUP',
						},
						{
							id: '4',
							label: 'LIBRARY',
						},
						{
							id: '5',
							label: 'EFFECTS',
						},
						{
							id: '6',
							label: 'MONITOR',
						},
						{
							id: '7',
							label: 'USB RECORDER',
						},
						{
							id: '8',
							label: 'SCENES',
						},
						{
							id: '9',
							label: 'ASSIGN',
						},
					]),
					disableAutoExpression: true,
				},
			],
			defaultStyle: {
				bgcolor: 0x00ff7f,
				color: 0x000000,
			},
			...feedbackSubscriptionWrapper({
				getPath: () => `/-stat/screen/screen`,
				getValue: (evt, data) => getDataNumber(data, 0) == evt.options.screen,
			}),
		},
		[FeedbackId.MuteGroupScreen]: {
			type: 'boolean',
			name: 'Change from mute groups screen enabled state',
			description: 'If mute groups screen is on, change style of the bank',
			options: [],
			defaultStyle: {
				bgcolor: 0xff0000,
				color: 0x000000,
			},
			...feedbackSubscriptionWrapper({
				getPath: () => `/-stat/screen/mutegrp`,
				getValue: (_evt, data) => getDataNumber(data, 0) !== 0,
			}),
		},
		[FeedbackId.UtilityScreen]: {
			type: 'boolean',
			name: 'Change from Utility enabled state',
			description: 'If utility screen is on, change style of the bank',
			options: [],
			defaultStyle: {
				bgcolor: 0x00ff7f,
				color: 0x000000,
			},
			...feedbackSubscriptionWrapper({
				getPath: () => `/-stat/screen/utils`,
				getValue: (_evt, data) => getDataNumber(data, 0) !== 0,
			}),
		},
		[FeedbackId.ChannelPage]: {
			type: 'boolean',
			name: 'Change from channel page selected state',
			description: 'If channel screen is on and selected page is active, change style of the bank',
			options: [
				{
					type: 'dropdown',
					label: 'page',
					id: 'page',
					...convertChoices([
						{
							id: '0',
							label: 'HOME',
						},
						{
							id: '1',
							label: 'CONFIG',
						},
						{
							id: '2',
							label: 'GATE',
						},
						{
							id: '3',
							label: 'DYNAMICS',
						},
						{
							id: '4',
							label: 'EQ',
						},
						{
							id: '5',
							label: 'SENDS',
						},
						{
							id: '6',
							label: 'MAIN',
						},
					]),
					disableAutoExpression: true,
				},
			],
			defaultStyle: {
				bgcolor: 0x00ff7f,
				color: 0x000000,
			},
			...screenSelectionSubscriptionWrapper({
				contentPath: '/-stat/screen/CHAN/page',
				getValue: (evt, screen, page) => getDataNumber(screen, 0) === 0 && getDataNumber(page, 0) == evt.options.page,
			}),
		},
		[FeedbackId.MeterPage]: {
			type: 'boolean',
			name: 'Change from meter page selected state',
			description: 'If meter screen is on and selected page is active, change style of the bank',
			options: [
				{
					type: 'dropdown',
					label: 'page',
					id: 'page',
					...convertChoices([
						{
							id: '0',
							label: 'CHANNEL',
						},
						{
							id: '1',
							label: 'MIX BUS',
						},
						{
							id: '2',
							label: 'AUX/FX',
						},
						{
							id: '3',
							label: 'IN/OUT',
						},
						{
							id: '4',
							label: 'RTA',
						},
						{
							id: '5',
							label: 'AUTOMIX',
						},
					]),
					disableAutoExpression: true,
				},
			],
			defaultStyle: {
				bgcolor: 0x00ff7f,
				color: 0x000000,
			},
			...screenSelectionSubscriptionWrapper({
				contentPath: '/-stat/screen/METER/page',
				getValue: (evt, screen, page) => getDataNumber(screen, 0) === 1 && getDataNumber(page, 0) == evt.options.page,
			}),
		},
		[FeedbackId.RoutePage]: {
			type: 'boolean',
			name: 'Change from route page selected state',
			description: 'If route screen is on and selected page is active, change style of the bank',
			options: [
				{
					type: 'dropdown',
					label: 'page',
					id: 'page',
					...convertChoices([
						{
							id: '0',
							label: 'INPUT',
						},
						{
							id: '1',
							label: 'AES-A',
						},
						{
							id: '2',
							label: 'AES-B',
						},
						{
							id: '3',
							label: 'CARD',
						},
						{
							id: '4',
							label: 'XLR',
						},
						{
							id: '5',
							label: 'PATCH OUT',
						},
						{
							id: '6',
							label: 'PATCH AUX',
						},
						{
							id: '7',
							label: 'PATCH P16',
						},
						{
							id: '8',
							label: 'PATCH USER',
						},
					]),
					disableAutoExpression: true,
				},
			],
			defaultStyle: {
				bgcolor: 0x00ff7f,
				color: 0x000000,
			},
			...screenSelectionSubscriptionWrapper({
				contentPath: '/-stat/screen/ROUTE/page',
				getValue: (evt, screen, page) => getDataNumber(screen, 0) === 2 && getDataNumber(page, 0) == evt.options.page,
			}),
		},
		[FeedbackId.SetupPage]: {
			type: 'boolean',
			name: 'Change from setup page selected state',
			description: 'If setup screen is on and selected page is active, change style of the bank',
			options: [
				{
					type: 'dropdown',
					label: 'page',
					id: 'page',
					...convertChoices([
						{
							id: '0',
							label: 'GLOBAL',
						},
						{
							id: '1',
							label: 'CONFIG',
						},
						{
							id: '2',
							label: 'REMOTE',
						},
						{
							id: '3',
							label: 'NETWORK',
						},
						{
							id: '4',
							label: 'SCRIBBLE STRIPS',
						},
						{
							id: '5',
							label: 'PREAMPS',
						},
						{
							id: '6',
							label: 'CARD',
						},
					]),
					disableAutoExpression: true,
				},
			],
			defaultStyle: {
				bgcolor: 0x00ff7f,
				color: 0x000000,
			},
			...screenSelectionSubscriptionWrapper({
				contentPath: '/-stat/screen/SETUP/page',
				getValue: (evt, screen, page) => getDataNumber(screen, 0) === 3 && getDataNumber(page, 0) == evt.options.page,
			}),
		},
		[FeedbackId.LibPage]: {
			type: 'boolean',
			name: 'Change from library page selected state',
			description: 'If library screen is on and selected page is active, change style of the bank',
			options: [
				{
					type: 'dropdown',
					label: 'page',
					id: 'page',
					...convertChoices([
						{
							id: '0',
							label: 'CHANNEL',
						},
						{
							id: '1',
							label: 'EFFECTS',
						},
						{
							id: '2',
							label: 'ROUTING',
						},
						{
							id: '3',
							label: 'MONITOR',
						},
					]),
					disableAutoExpression: true,
				},
			],
			defaultStyle: {
				bgcolor: 0x00ff7f,
				color: 0x000000,
			},
			...screenSelectionSubscriptionWrapper({
				contentPath: '/-stat/screen/LIB/page',
				getValue: (evt, screen, page) => getDataNumber(screen, 0) === 4 && getDataNumber(page, 0) == evt.options.page,
			}),
		},
		[FeedbackId.FxPage]: {
			type: 'boolean',
			name: 'Change from effects page selected state',
			description: 'If effects screen is on and selected page is active, change style of the bank',
			options: [
				{
					type: 'dropdown',
					label: 'page',
					id: 'page',
					...convertChoices([
						{
							id: '0',
							label: 'HOME',
						},
						{
							id: '1',
							label: 'FX1',
						},
						{
							id: '2',
							label: 'FX2',
						},
						{
							id: '3',
							label: 'FX3',
						},
						{
							id: '4',
							label: 'FX4',
						},
						{
							id: '5',
							label: 'FX5',
						},
						{
							id: '6',
							label: 'FX6',
						},
						{
							id: '7',
							label: 'FX7',
						},
						{
							id: '8',
							label: 'FX8',
						},
					]),
					disableAutoExpression: true,
				},
			],
			defaultStyle: {
				bgcolor: 0x00ff7f,
				color: 0x000000,
			},
			...screenSelectionSubscriptionWrapper({
				contentPath: '/-stat/screen/FX/page',
				getValue: (evt, screen, page) => getDataNumber(screen, 0) === 5 && getDataNumber(page, 0) == evt.options.page,
			}),
		},
		[FeedbackId.MonPage]: {
			type: 'boolean',
			name: 'Change from monitor page selected state',
			description: 'If monitor screen is on and selected page is active, change style of the bank',
			options: [
				{
					type: 'dropdown',
					label: 'page',
					id: 'page',
					...convertChoices([
						{
							id: '0',
							label: 'MONITOR',
						},
						{
							id: '1',
							label: 'TALK A',
						},
						{
							id: '2',
							label: 'TALK B',
						},
						{
							id: '3',
							label: 'OSCILLATOR',
						},
					]),
					disableAutoExpression: true,
				},
			],
			defaultStyle: {
				bgcolor: 0x00ff7f,
				color: 0x000000,
			},
			...screenSelectionSubscriptionWrapper({
				contentPath: '/-stat/screen/MON/page',
				getValue: (evt, screen, page) => getDataNumber(screen, 0) === 6 && getDataNumber(page, 0) == evt.options.page,
			}),
		},
		[FeedbackId.USBPage]: {
			type: 'boolean',
			name: 'Change from USB page selected state',
			description: 'If USB screen is on and selected page is active, change style of the bank',
			options: [
				{
					type: 'dropdown',
					label: 'page',
					id: 'page',
					...convertChoices([
						{
							id: '0',
							label: 'HOME',
						},
						{
							id: '1',
							label: 'CONFIG',
						},
					]),
					disableAutoExpression: true,
				},
			],
			defaultStyle: {
				bgcolor: 0x00ff7f,
				color: 0x000000,
			},
			...screenSelectionSubscriptionWrapper({
				contentPath: '/-stat/screen/USB/page',
				getValue: (evt, screen, page) => getDataNumber(screen, 0) === 7 && getDataNumber(page, 0) == evt.options.page,
			}),
		},
		[FeedbackId.ScenePage]: {
			type: 'boolean',
			name: 'Change from scene page selected state',
			description: 'If scene screen is on and selected page is active, change style of the bank',
			options: [
				{
					type: 'dropdown',
					label: 'page',
					id: 'page',
					...convertChoices([
						{
							id: '0',
							label: 'CUES',
						},
						{
							id: '1',
							label: 'SCENES',
						},
						{
							id: '2',
							label: 'SNIPPETS',
						},
						{
							id: '3',
							label: 'PARAMETER SAFE',
						},
						{
							id: '4',
							label: 'CHANNEL SAFE',
						},
						{
							id: '5',
							label: 'MIDI',
						},
					]),
					disableAutoExpression: true,
				},
			],
			defaultStyle: {
				bgcolor: 0x00ff7f,
				color: 0x000000,
			},
			...screenSelectionSubscriptionWrapper({
				contentPath: '/-stat/screen/SCENE/page',
				getValue: (evt, screen, page) => getDataNumber(screen, 0) === 8 && getDataNumber(page, 0) == evt.options.page,
			}),
		},
		[FeedbackId.AssignPage]: {
			type: 'boolean',
			name: 'Change from assign page selected state',
			description: 'If assign screen is on and selected page is active, change style of the bank',
			options: [
				{
					type: 'dropdown',
					label: 'page',
					id: 'page',
					...convertChoices([
						{
							id: '0',
							label: 'Home',
						},
						{
							id: '1',
							label: 'SET A',
						},
						{
							id: '2',
							label: 'SET B',
						},
						{
							id: '3',
							label: 'SET C',
						},
					]),
					disableAutoExpression: true,
				},
			],
			defaultStyle: {
				bgcolor: 0x00ff7f,
				color: 0x000000,
			},
			...screenSelectionSubscriptionWrapper({
				contentPath: '/-stat/screen/ASSIGN/page',
				getValue: (evt, screen, page) => getDataNumber(screen, 0) === 9 && getDataNumber(page, 0) == evt.options.page,
			}),
		},

		[FeedbackId.RouteUserIn]: {
			type: 'boolean',
			name: 'Change from user in routing state',
			description:
				'If the specified source is routed to the specified destination, change style of the bank. Protip: You can use `Store channel` with and then select `FROM STORAGE` to chain screens ',
			options: [
				{
					type: 'dropdown',
					label: 'source',
					id: 'source',
					...convertChoices([...GetUserInSources()]),
					allowInvalidValues: true,
				},
				{
					type: 'dropdown',
					label: 'destination channel',
					id: 'channel',
					default: 1,
					choices: [
						{
							id: -1,
							label: 'STORED CHANNEL',
						},
						...GetUserInTargets(),
					],
					allowInvalidValues: true,
				},
			],
			defaultStyle: {
				bgcolor: 0xff0000,
				color: 0x000000,
			},
			callback: (evt: CompanionFeedbackInfo): boolean => {
				// Unsubscribe previous
				if (evt.previousOptions && evt.options.channel === evt.previousOptions.channel) {
					const channel = evt.options.channel as number
					if (channel < 0) {
						for (let i = 1; i <= 32; i++) {
							const path = UserRouteInPath(i)
							subs.unsubscribe(path, evt.id)
						}
					} else {
						const path = UserRouteInPath(channel)
						subs.unsubscribe(path, evt.id)
					}
				}

				{
					// Subscribe new
					const channel = evt.options.channel as number
					if (channel < 0) {
						for (let i = 1; i <= 32; i++) {
							const path = UserRouteInPath(i)
							subscribeFeedback(ensureLoaded, subs, path, evt)
						}
					} else {
						const path = UserRouteInPath(channel)
						subscribeFeedback(ensureLoaded, subs, path, evt)
					}
				}

				const source = evt.options.source as number
				let channel = evt.options.channel as number
				if (channel == -1) {
					channel = state.getStoredChannel()
					if (channel == undefined || channel > 31) return false
				}
				const data = state.get(UserRouteInPath(channel))
				return getDataNumber(data, 0) === source
			},
			unsubscribe: (evt: CompanionFeedbackInfo): void => {
				const channel = evt.options.channel as number
				if (channel < 0) {
					for (let i = 1; i <= 32; i++) {
						const path = UserRouteInPath(i)
						subs.unsubscribe(path, evt.id)
					}
				} else {
					const path = UserRouteInPath(channel)
					subs.unsubscribe(path, evt.id)
				}
			},
		},
		[FeedbackId.RouteUserOut]: {
			type: 'boolean',
			name: 'Change from user out routing state',
			description:
				'If the specified source is routed to the specified destination, change style of the bank. Protip: You can use `Store channel` with and then select `FROM STORAGE` to chain screens ',
			options: [
				{
					type: 'dropdown',
					label: 'source',
					id: 'source',
					...convertChoices([...GetUserOutSources()]),
					allowInvalidValues: true,
				},
				{
					type: 'dropdown',
					label: 'destination output',
					id: 'channel',
					default: 1,
					choices: [
						{
							id: -1,
							label: 'STORED CHANNEL',
						},
						...GetUserOutTargets(),
					],
					allowInvalidValues: true,
				},
			],
			defaultStyle: {
				bgcolor: 0xff0000,
				color: 0x000000,
			},
			callback: (evt: CompanionFeedbackInfo): boolean => {
				// Unsubscribe previous
				if (evt.previousOptions && evt.options.channel === evt.previousOptions.channel) {
					const channel = evt.previousOptions.channel as number
					if (channel < 0) {
						for (let i = 1; i <= 64; i++) {
							const path = UserRouteOutPath(i)
							subs.unsubscribe(path, evt.id)
						}
					} else {
						const path = UserRouteOutPath(channel)
						subs.unsubscribe(path, evt.id)
					}
				}

				{
					// Subscribe new
					const channel = evt.options.channel as number
					if (channel < 0) {
						for (let i = 1; i <= 64; i++) {
							const path = UserRouteOutPath(i)
							subscribeFeedback(ensureLoaded, subs, path, evt)
						}
					} else {
						const path = UserRouteOutPath(channel)
						subscribeFeedback(ensureLoaded, subs, path, evt)
					}
				}

				const source = evt.options.source as number
				let channel = evt.options.channel as number
				if (channel == -1) {
					channel = state.getStoredChannel()
					if (channel == undefined || channel > 31) return false
				}
				const data = state.get(UserRouteOutPath(channel))
				return getDataNumber(data, 0) === source
			},
			unsubscribe: (evt: CompanionFeedbackInfo): void => {
				const channel = evt.options.channel as number
				if (channel < 0) {
					for (let i = 1; i <= 64; i++) {
						const path = UserRouteOutPath(i)
						subs.unsubscribe(path, evt.id)
					}
				} else {
					const path = UserRouteOutPath(channel)
					subs.unsubscribe(path, evt.id)
				}
			},
		},
		[FeedbackId.StoredChannel]: {
			type: 'boolean',
			name: 'Change based on Stored Channel',
			description: 'If the specified channl is stored, change style of the bank.',
			options: [
				{
					type: 'dropdown',
					label: 'destination output',
					id: 'channel',
					...convertChoices([...GetUserOutTargets(true)]),
					allowInvalidValues: true,
				},
			],
			defaultStyle: {
				bgcolor: 0x00ff7f,
				color: 0x000000,
			},
			callback: (evt: CompanionFeedbackInfo): boolean => {
				const storedChannel = state.getStoredChannel()
				return getOptNumber(evt.options, 'channel', 0) === storedChannel
			},
			unsubscribe: (): void => undefined,
		},
		[FeedbackId.RouteInputBlockMode]: {
			type: 'boolean',
			name: 'Input block routing mode',
			description: 'If the specified mode is active, change style of the bank.',
			options: [
				{
					type: 'dropdown',
					label: 'Input mode',
					id: 'mode',
					...convertChoices([
						{ label: 'RECORD', id: 0 },
						{ label: 'PLAY', id: 1 },
					]),
					disableAutoExpression: true,
				},
			],
			defaultStyle: {
				bgcolor: 0x007fff,
				color: 0x000000,
			},
			...feedbackSubscriptionWrapper({
				getPath: () => `/config/routing/routswitch`,
				getValue: (evt, data) => {
					const mode = getOptNumber(evt.options, 'mode', 0)
					return getDataNumber(data, 0) === mode
				},
			}),
		},
		[FeedbackId.RouteInputBlocks]: {
			type: 'boolean',
			name: 'Input block routing state',
			description: 'If the specified block is routed to the specified destination, change style of the bank.',
			options: [
				{
					type: 'dropdown',
					label: 'Input mode',
					id: 'mode',
					...convertChoices([
						{ label: 'RECORD', id: 'IN' },
						{ label: 'PLAY', id: 'PLAY' },
					]),
					disableAutoExpression: true,
				},
				{
					type: 'dropdown',
					label: 'Input block',
					id: 'block',
					...convertChoices([...GetInputBlocks()]),
					allowInvalidValues: true,
				},
				{
					type: 'dropdown',
					label: 'Routing source block',
					id: 'routing',
					...convertChoices([...GetInputBlockRoutes()]),
					allowInvalidValues: true,
				},
			],
			defaultStyle: {
				bgcolor: 0xff0000,
				color: 0x000000,
			},
			...feedbackSubscriptionWrapper({
				getPath: (options) => `/config/routing/${options.mode}/${options.block}`,
				getValue: (evt, data) => {
					const routing = evt.options.routing as number
					return getDataNumber(data, 0) === routing
				},
			}),
		},
		[FeedbackId.RouteAuxBlocks]: {
			type: 'boolean',
			name: 'Aux block routing state',
			description: 'If the specified block is routed to the specified destination, change style of the bank.',
			options: [
				{
					type: 'dropdown',
					label: 'Input mode',
					id: 'mode',
					...convertChoices([
						{ label: 'RECORD', id: 'IN' },
						{ label: 'PLAY', id: 'PLAY' },
					]),
					disableAutoExpression: true,
				},
				{
					type: 'dropdown',
					label: 'Routing source block',
					id: 'routing',
					...convertChoices([...GetAuxBlockRoutes()]),
					allowInvalidValues: true,
				},
			],
			defaultStyle: {
				bgcolor: 0xff0000,
				color: 0x000000,
			},
			...feedbackSubscriptionWrapper({
				getPath: (options) => `/config/routing/${options.mode}/AUX`,
				getValue: (evt, data) => {
					const routing = evt.options.routing as number
					return getDataNumber(data, 0) === routing
				},
			}),
		},
		[FeedbackId.RouteAES50Blocks]: {
			type: 'boolean',
			name: 'AES50 block routing state',
			description: 'If the specified block is routed to the specified destination, change style of the bank.',
			options: [
				{
					type: 'dropdown',
					label: 'Input mode',
					id: 'mode',
					...convertChoices([
						{ label: 'AES50 A', id: 'A' },
						{ label: 'AES50 B', id: 'B' },
					]),
					disableAutoExpression: true,
				},
				{
					type: 'dropdown',
					label: 'AES50 block',
					id: 'block',
					...convertChoices([...GetAesBlocks()]),
					disableAutoExpression: true,
				},
				{
					type: 'dropdown',
					label: 'Routing source block',
					id: 'routing',
					...convertChoices([...GetAesCardRouteBlocks()]),
					disableAutoExpression: true,
				},
			],
			defaultStyle: {
				bgcolor: 0xff0000,
				color: 0x000000,
			},
			...feedbackSubscriptionWrapper({
				getPath: (options) => `/config/routing/AES${options.mode}/${options.block}`,
				getValue: (evt, data) => {
					const routing = evt.options.routing as number
					return getDataNumber(data, 0) === routing
				},
			}),
		},
		[FeedbackId.RouteCardBlocks]: {
			type: 'boolean',
			name: 'Card block routing state',
			description: 'If the specified block is routed to the specified destination, change style of the bank.',
			options: [
				{
					type: 'dropdown',
					label: 'Card block',
					id: 'block',
					...convertChoices([...GetInputBlocks()]),
					disableAutoExpression: true,
				},
				{
					type: 'dropdown',
					label: 'Routing source block',
					id: 'routing',
					...convertChoices([...GetAesCardRouteBlocks()]),
					disableAutoExpression: true,
				},
			],
			defaultStyle: {
				bgcolor: 0xff0000,
				color: 0x000000,
			},
			...feedbackSubscriptionWrapper({
				getPath: (options) => `/config/routing/CARD/${options.block}`,
				getValue: (evt, data) => {
					const routing = evt.options.routing as number
					return getDataNumber(data, 0) === routing
				},
			}),
		},
		[FeedbackId.RouteXLRLeftOutputs]: {
			type: 'boolean',
			name: 'XRL left block routing state',
			description: 'If the specified block is routed to the specified destination, change style of the bank.',
			options: [
				{
					type: 'dropdown',
					label: 'Output block',
					id: 'block',
					...convertChoices([
						{ id: '1-4', label: '1-4' },
						{ id: '9-12', label: '9-12' },
					]),
					disableAutoExpression: true,
				},
				{
					type: 'dropdown',
					label: 'Routing source block',
					id: 'routing',
					...convertChoices([...GetLeftOutputBlockRoutes()]),
					disableAutoExpression: true,
				},
			],
			defaultStyle: {
				bgcolor: 0xff0000,
				color: 0x000000,
			},
			...feedbackSubscriptionWrapper({
				getPath: (options) => `/config/routing/OUT/${options.block}`,
				getValue: (evt, data) => {
					const routing = evt.options.routing as number
					return getDataNumber(data, 0) === routing
				},
			}),
		},
		[FeedbackId.RouteXLRRightOutputs]: {
			type: 'boolean',
			name: 'XRL right block routing state',
			description: 'If the specified block is routed to the specified destination, change style of the bank.',
			options: [
				{
					type: 'dropdown',
					label: 'Output block',
					id: 'block',
					...convertChoices([
						{ id: '5-8', label: '5-8' },
						{ id: '13-16', label: '13-16' },
					]),
					disableAutoExpression: true,
				},
				{
					type: 'dropdown',
					label: 'Routing source block',
					id: 'routing',
					...convertChoices([...GetRightOutputBlockRoutes()]),
					disableAutoExpression: true,
				},
			],
			defaultStyle: {
				bgcolor: 0xff0000,
				color: 0x000000,
			},
			...feedbackSubscriptionWrapper({
				getPath: (options) => `/config/routing/OUT/${options.block}`,
				getValue: (evt, data) => {
					const routing = evt.options.routing as number
					return getDataNumber(data, 0) === routing
				},
			}),
		},

		[FeedbackId.LockAndShutdown]: {
			type: 'boolean',
			name: 'Lock/Shutdown',
			description: 'If the specified state is active, change style of the bank.',
			options: [
				{
					type: 'dropdown',
					label: 'Lock/Shutdown state',
					id: 'lockState',
					...convertChoices([
						{ id: 0, label: 'Unlock' },
						{ id: 1, label: 'Lock' },
						{ id: 2, label: 'Shutdown' },
					]),
					disableAutoExpression: true,
				},
			],
			defaultStyle: {
				bgcolor: 0xff0000,
				color: 0x000000,
			},
			...feedbackSubscriptionWrapper({
				getPath: () => `/-stat/lock`,
				getValue: (evt, data) => getDataNumber(data, 0) === (evt.options.lockState as number),
			}),
		},

		[FeedbackId.InsertOn]: {
			type: 'boolean',
			name: 'Insert Status',
			description: 'If the insert status of specified source matches the specified state, change style of the bank.',
			options: [
				{
					type: 'dropdown',
					label: 'Source',
					id: 'src',
					...convertChoices(insertSourceChoices),
					allowInvalidValues: true,
				},
			],
			defaultStyle: {
				bgcolor: 0xff7f00,
				color: 0x000000,
			},
			...feedbackSubscriptionWrapper({
				getPath: (options) => {
					const srcRef = parseRefToPaths(options.src, insertSourceParseOptions)
					return srcRef?.insertSource?.onPath ?? null
				},
				getValue: (_evt, data) => getDataNumber(data, 0) === 1,
			}),
		},
		[FeedbackId.InsertPos]: {
			type: 'boolean',
			name: 'Insert Position',
			description: 'If the insert position of specified source matches the specified state, change style of the bank.',
			options: [
				{
					type: 'dropdown',
					label: 'Source',
					id: 'src',
					...convertChoices(insertSourceChoices),
					allowInvalidValues: true,
				},
				{
					type: 'dropdown',
					label: 'PRE / POST',
					id: 'pos',
					...convertChoices([
						{ id: 0, label: 'PRE' },
						{ id: 1, label: 'POST' },
					]),
					disableAutoExpression: true,
				},
			],
			defaultStyle: {
				bgcolor: 0xff7f00,
				color: 0x000000,
			},
			...feedbackSubscriptionWrapper({
				getPath: (options) => {
					const srcRef = parseRefToPaths(options.src, insertSourceParseOptions)
					return srcRef?.insertSource?.posPath ?? null
				},
				getValue: (evt, data) => getDataNumber(data, 0) === evt.options.pos,
			}),
		},
		[FeedbackId.InsertSelect]: {
			type: 'boolean',
			name: 'Insert Destination',
			description:
				'If the insert destination of specified source matches the specified destination, change style of the bank.',
			options: [
				{
					type: 'dropdown',
					label: 'Source',
					id: 'src',
					...convertChoices(insertSourceChoices),
					allowInvalidValues: true,
				},
				{
					type: 'dropdown',
					label: 'Destination',
					id: 'dest',
					...convertChoices(GetInsertDestinationChoices()),
					disableAutoExpression: true,
				},
			],
			defaultStyle: {
				bgcolor: 0xff7f00,
				color: 0x000000,
			},
			...feedbackSubscriptionWrapper({
				getPath: (options) => {
					const srcRef = parseRefToPaths(options.src, insertSourceParseOptions)
					return srcRef?.insertSource?.selPath ?? null
				},
				getValue: (evt, data) => getDataNumber(data, 0) === evt.options.dest,
			}),
		},
		[FeedbackId.UndoAvailable]: {
			type: 'boolean',
			name: 'Undo available',
			description: 'If undo is available, change the style of the bank',
			options: [],
			defaultStyle: {
				bgcolor: 0xff7f00,
				color: 0x000000,
			},
			...feedbackSubscriptionWrapper({
				getPath: () => '/-undo/time',
				getValue: (_evt, data) => {
					const time = data && data[0]?.type === 's' ? data[0].value : ''
					return !!time
				},
			}),
		},
	}

	return feedbacks
}
