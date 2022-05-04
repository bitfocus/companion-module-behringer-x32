import { X32State, X32Subscriptions } from './state'
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
} from './choices'
import { compareNumber, floatToDB, InstanceBaseExt } from './util'
import {
	MutePath,
	MainPath,
	MainFaderPath,
	SendChannelToBusPath,
	SendBusToMatrixPath,
	MainPanPath,
	ChannelToBusPanPath,
	BusToMatrixPanPath,
} from './paths'
import * as osc from 'osc'
import { X32Config } from './config'
import { NumberComparitorPicker } from './input'
import { SetRequired } from 'type-fest'
import {
	combineRgb,
	CompanionFeedbackBoolean,
	CompanionFeedbackEvent,
	CompanionFeedbacks,
} from '@companion-module/base'

type CompanionFeedbackWithCallback = SetRequired<CompanionFeedbackBoolean, 'callback' | 'subscribe' | 'unsubscribe'>

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
}

function getDataNumber(data: osc.MetaArgument[] | undefined, index: number): number | undefined {
	const val = data ? data[index] : undefined
	return val?.type === 'i' || val?.type === 'f' ? val.value : undefined
}

const getOptNumber = (event: CompanionFeedbackEvent, key: string, defVal?: number): number => {
	const rawVal = event.options[key]
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
	evt: CompanionFeedbackEvent
): void {
	subs.subscribe(path, evt.id, evt.type as FeedbackId)
	ensureLoaded(path)
}
function unsubscribeFeedback(subs: X32Subscriptions, path: string, evt: CompanionFeedbackEvent): void {
	subs.unsubscribe(path, evt.id)
}

export function GetFeedbacksList(
	_self: InstanceBaseExt<X32Config>,
	state: X32State,
	subs: X32Subscriptions,
	ensureLoaded: (path: string) => void
): CompanionFeedbacks {
	const levelsChoices = GetLevelsChoiceConfigs(state)
	const panningChoices = GetPanningChoiceConfigs(state)
	const muteGroups = GetMuteGroupChoices(state)
	const selectChoices = GetTargetChoices(state, { skipDca: true, includeMain: true, numericIndex: true })
	const soloChoices = GetTargetChoices(state, { includeMain: true, numericIndex: true })

	const feedbacks: { [id in FeedbackId]: CompanionFeedbackWithCallback | undefined } = {
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
				},
				{
					id: 'state',
					type: 'checkbox',
					label: 'Muted',
					default: true,
				},
			],
			defaultStyle: {
				bgcolor: combineRgb(255, 0, 0),
				color: combineRgb(0, 0, 0),
			},
			callback: (evt: CompanionFeedbackEvent): boolean => {
				const data = state.get(MutePath(evt.options.target as string))
				const muted = getDataNumber(data, 0) === 0
				return muted === !!evt.options.state
			},
			subscribe: (evt: CompanionFeedbackEvent): void => {
				const path = MutePath(evt.options.target as string)
				subscribeFeedback(ensureLoaded, subs, path, evt)
			},
			unsubscribe: (evt: CompanionFeedbackEvent): void => {
				const path = MutePath(evt.options.target as string)
				unsubscribeFeedback(subs, path, evt)
			},
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
				},
				{
					id: 'state',
					type: 'checkbox',
					label: 'Muted',
					default: true,
				},
			],
			defaultStyle: {
				bgcolor: combineRgb(255, 0, 0),
				color: combineRgb(0, 0, 0),
			},
			callback: (evt: CompanionFeedbackEvent): boolean => {
				const data = state.get(evt.options.mute_grp as string)
				const muted = getDataNumber(data, 0) === 1
				return muted === !!evt.options.state
			},
			subscribe: (evt: CompanionFeedbackEvent): void => {
				const path = evt.options.mute_grp as string
				subscribeFeedback(ensureLoaded, subs, path, evt)
			},
			unsubscribe: (evt: CompanionFeedbackEvent): void => {
				const path = evt.options.mute_grp as string
				unsubscribeFeedback(subs, path, evt)
			},
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
				},
				{
					type: 'dropdown',
					label: 'Target',
					id: 'target',
					...convertChoices(GetChannelSendChoices(state, 'on')),
				},
				{
					id: 'state',
					type: 'checkbox',
					label: 'Muted',
					default: true,
				},
			],
			defaultStyle: {
				bgcolor: combineRgb(255, 0, 0),
				color: combineRgb(0, 0, 0),
			},
			callback: (evt: CompanionFeedbackEvent): boolean => {
				const path = `${MainPath(evt.options.source as string)}/${evt.options.target}`
				const data = path ? state.get(path) : undefined
				const muted = getDataNumber(data, 0) === 0
				return muted === !!evt.options.state
			},
			subscribe: (evt: CompanionFeedbackEvent): void => {
				const path = `${MainPath(evt.options.source as string)}/${evt.options.target}`
				subscribeFeedback(ensureLoaded, subs, path, evt)
			},
			unsubscribe: (evt: CompanionFeedbackEvent): void => {
				const path = `${MainPath(evt.options.source as string)}/${evt.options.target}`
				unsubscribeFeedback(subs, path, evt)
			},
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
				},
				{
					type: 'dropdown',
					label: 'Target',
					id: 'target',
					...convertChoices(levelsChoices.busSendTargets),
				},
				{
					id: 'state',
					type: 'checkbox',
					label: 'Muted',
					default: true,
				},
			],
			defaultStyle: {
				bgcolor: combineRgb(255, 0, 0),
				color: combineRgb(0, 0, 0),
			},
			callback: (evt: CompanionFeedbackEvent): boolean => {
				const path = `${MainPath(evt.options.source as string)}/${evt.options.target}/on`
				const data = path ? state.get(path) : undefined
				const muted = getDataNumber(data, 0) === 0
				return muted === !!evt.options.state
			},
			subscribe: (evt: CompanionFeedbackEvent): void => {
				const path = `${MainPath(evt.options.source as string)}/${evt.options.target}/on`
				subscribeFeedback(ensureLoaded, subs, path, evt)
			},
			unsubscribe: (evt: CompanionFeedbackEvent): void => {
				const path = `${MainPath(evt.options.source as string)}/${evt.options.target}/on`
				unsubscribeFeedback(subs, path, evt)
			},
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
				},
				NumberComparitorPicker(),
				FaderLevelChoice,
			],
			defaultStyle: {
				bgcolor: combineRgb(0, 255, 0),
				color: combineRgb(0, 0, 0),
			},
			callback: (evt: CompanionFeedbackEvent): boolean => {
				const currentState = state.get(MainFaderPath(evt.options))
				const currentVal = currentState && currentState[0]?.type === 'f' ? currentState[0]?.value : undefined
				return (
					typeof currentVal === 'number' &&
					compareNumber(evt.options.fad, evt.options.comparitor, floatToDB(currentVal))
				)
			},
			subscribe: (evt): void => {
				const path = MainFaderPath(evt.options)
				subscribeFeedback(ensureLoaded, subs, path, evt)
			},
			unsubscribe: (evt: CompanionFeedbackEvent): void => {
				const path = MainFaderPath(evt.options)
				unsubscribeFeedback(subs, path, evt)
			},
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
				},
				{
					type: 'dropdown',
					label: 'Target',
					id: 'target',
					...convertChoices(levelsChoices.channelSendTargets),
				},
				NumberComparitorPicker(),
				FaderLevelChoice,
			],
			defaultStyle: {
				bgcolor: combineRgb(0, 255, 0),
				color: combineRgb(0, 0, 0),
			},
			callback: (evt: CompanionFeedbackEvent): boolean => {
				const currentState = state.get(SendChannelToBusPath(evt.options))
				const currentVal = currentState && currentState[0]?.type === 'f' ? currentState[0]?.value : undefined
				return (
					typeof currentVal === 'number' &&
					compareNumber(evt.options.fad, evt.options.comparitor, floatToDB(currentVal))
				)
			},
			subscribe: (evt): void => {
				const path = SendChannelToBusPath(evt.options)
				subscribeFeedback(ensureLoaded, subs, path, evt)
			},
			unsubscribe: (evt: CompanionFeedbackEvent): void => {
				const path = SendChannelToBusPath(evt.options)
				unsubscribeFeedback(subs, path, evt)
			},
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
				},
				{
					type: 'dropdown',
					label: 'Target',
					id: 'target',
					...convertChoices(levelsChoices.busSendTargets),
				},
				NumberComparitorPicker(),
				FaderLevelChoice,
			],
			defaultStyle: {
				bgcolor: combineRgb(0, 255, 0),
				color: combineRgb(0, 0, 0),
			},
			callback: (evt: CompanionFeedbackEvent): boolean => {
				const currentState = state.get(SendBusToMatrixPath(evt.options))
				const currentVal = currentState && currentState[0]?.type === 'f' ? currentState[0]?.value : undefined
				return (
					typeof currentVal === 'number' &&
					compareNumber(evt.options.fad, evt.options.comparitor, floatToDB(currentVal))
				)
			},
			subscribe: (evt): void => {
				const path = SendBusToMatrixPath(evt.options)
				subscribeFeedback(ensureLoaded, subs, path, evt)
			},
			unsubscribe: (evt: CompanionFeedbackEvent): void => {
				const path = SendBusToMatrixPath(evt.options)
				unsubscribeFeedback(subs, path, evt)
			},
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
				},
				NumberComparitorPicker(),
				PanningChoice,
			],
			defaultStyle: {
				bgcolor: combineRgb(0, 255, 0),
				color: combineRgb(0, 0, 0),
			},
			callback: (evt: CompanionFeedbackEvent): boolean => {
				const currentState = state.get(MainPanPath(evt.options))
				const currentVal = currentState && currentState[0]?.type === 'f' ? currentState[0]?.value : undefined
				return (
					typeof currentVal === 'number' &&
					compareNumber(evt.options.pan, evt.options.comparitor, currentVal * 100 - 50)
				)
			},
			subscribe: (evt): void => {
				const path = MainPanPath(evt.options)
				subscribeFeedback(ensureLoaded, subs, path, evt)
			},
			unsubscribe: (evt: CompanionFeedbackEvent): void => {
				const path = MainPanPath(evt.options)
				unsubscribeFeedback(subs, path, evt)
			},
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
				},
				{
					type: 'dropdown',
					label: 'Target',
					id: 'target',
					...convertChoices(panningChoices.channelSendTargets),
				},
				NumberComparitorPicker(),
				PanningChoice,
			],
			defaultStyle: {
				bgcolor: combineRgb(0, 255, 0),
				color: combineRgb(0, 0, 0),
			},
			callback: (evt: CompanionFeedbackEvent): boolean => {
				const currentState = state.get(ChannelToBusPanPath(evt.options))
				const currentVal = currentState && currentState[0]?.type === 'f' ? currentState[0]?.value : undefined
				return (
					typeof currentVal === 'number' &&
					compareNumber(evt.options.pan, evt.options.comparitor, currentVal * 100 - 50)
				)
			},
			subscribe: (evt): void => {
				const path = ChannelToBusPanPath(evt.options)
				subscribeFeedback(ensureLoaded, subs, path, evt)
			},
			unsubscribe: (evt: CompanionFeedbackEvent): void => {
				const path = ChannelToBusPanPath(evt.options)
				unsubscribeFeedback(subs, path, evt)
			},
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
				},
				{
					type: 'dropdown',
					label: 'Target',
					id: 'target',
					...convertChoices(panningChoices.busSendTarget),
				},
				NumberComparitorPicker(),
				PanningChoice,
			],
			defaultStyle: {
				bgcolor: combineRgb(0, 255, 0),
				color: combineRgb(0, 0, 0),
			},
			callback: (evt: CompanionFeedbackEvent): boolean => {
				const currentState = state.get(BusToMatrixPanPath(evt.options))
				const currentVal = currentState && currentState[0]?.type === 'f' ? currentState[0]?.value : undefined
				return (
					typeof currentVal === 'number' &&
					compareNumber(evt.options.pan, evt.options.comparitor, currentVal * 100 - 50)
				)
			},
			subscribe: (evt): void => {
				const path = BusToMatrixPanPath(evt.options)
				subscribeFeedback(ensureLoaded, subs, path, evt)
			},
			unsubscribe: (evt: CompanionFeedbackEvent): void => {
				const path = BusToMatrixPanPath(evt.options)
				unsubscribeFeedback(subs, path, evt)
			},
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
				},
				{
					id: 'state',
					type: 'checkbox',
					label: 'On',
					default: true,
				},
			],
			defaultStyle: {
				bgcolor: combineRgb(255, 0, 0),
				color: combineRgb(0, 0, 0),
			},
			callback: (evt: CompanionFeedbackEvent): boolean => {
				const path = `/-stat/talk/${evt.options.channel}`
				const data = path ? state.get(path) : undefined
				const isOn = getDataNumber(data, 0) !== 0
				return isOn === !!evt.options.state
			},
			subscribe: (evt: CompanionFeedbackEvent): void => {
				const path = `/-stat/talk/${evt.options.channel}`
				subscribeFeedback(ensureLoaded, subs, path, evt)
			},
			unsubscribe: (evt: CompanionFeedbackEvent): void => {
				const path = `/-stat/talk/${evt.options.channel}`
				unsubscribeFeedback(subs, path, evt)
			},
		},
		[FeedbackId.OscillatorEnable]: {
			type: 'boolean',
			name: 'Change from oscillator enabled state',
			description: 'If the oscillator is on, change style of the bank',
			options: [
				{
					id: 'state',
					type: 'checkbox',
					label: 'On',
					default: true,
				},
			],
			defaultStyle: {
				bgcolor: combineRgb(255, 0, 0),
				color: combineRgb(0, 0, 0),
			},
			callback: (evt: CompanionFeedbackEvent): boolean => {
				const path = `/-stat/osc/on`
				const data = path ? state.get(path) : undefined
				const isOn = getDataNumber(data, 0) !== 0
				return isOn === !!evt.options.state
			},
			subscribe: (evt: CompanionFeedbackEvent): void => {
				const path = `/-stat/osc/on`
				subscribeFeedback(ensureLoaded, subs, path, evt)
			},
			unsubscribe: (evt: CompanionFeedbackEvent): void => {
				const path = `/-stat/osc/on`
				unsubscribeFeedback(subs, path, evt)
			},
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
					...convertChoices(GetOscillatorDestinations(state)),
				},
			],
			defaultStyle: {
				bgcolor: combineRgb(255, 0, 0),
				color: combineRgb(0, 0, 0),
			},
			callback: (evt: CompanionFeedbackEvent): boolean => {
				const path = `/config/osc/dest`
				const data = path ? state.get(path) : undefined
				const destination = getDataNumber(data, 0)
				return destination === Number(evt.options.destination)
			},
			subscribe: (evt: CompanionFeedbackEvent): void => {
				const path = `/config/osc/dest`
				subscribeFeedback(ensureLoaded, subs, path, evt)
			},
			unsubscribe: (evt: CompanionFeedbackEvent): void => {
				const path = `/config/osc/dest`
				unsubscribeFeedback(subs, path, evt)
			},
		},
		[FeedbackId.Select]: {
			type: 'boolean',
			name: 'Change from solo enabled state',
			description: 'If the solo is on for specified channel, change style of the bank',
			options: [
				{
					type: 'dropdown',
					label: 'Target',
					id: 'solo',
					...convertChoices(soloChoices),
				},
				{
					id: 'state',
					type: 'checkbox',
					label: 'On',
					default: true,
				},
			],
			defaultStyle: {
				bgcolor: combineRgb(255, 127, 0),
				color: combineRgb(0, 0, 0),
			},
			callback: (evt: CompanionFeedbackEvent): boolean => {
				const ch = `${getOptNumber(evt, 'solo') + 1}`.padStart(2, '0')
				const path = `/-stat/solosw/${ch}`
				const data = path ? state.get(path) : undefined
				const isOn = getDataNumber(data, 0) !== 0
				return isOn === !!evt.options.state
			},
			subscribe: (evt: CompanionFeedbackEvent): void => {
				const ch = `${getOptNumber(evt, 'solo') + 1}`.padStart(2, '0')
				const path = `/-stat/solosw/${ch}`
				subscribeFeedback(ensureLoaded, subs, path, evt)
			},
			unsubscribe: (evt: CompanionFeedbackEvent): void => {
				const ch = `${getOptNumber(evt, 'solo') + 1}`.padStart(2, '0')
				const path = `/-stat/solosw/${ch}`
				unsubscribeFeedback(subs, path, evt)
			},
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
				},
			],
			defaultStyle: {
				bgcolor: combineRgb(0, 255, 127),
				color: combineRgb(0, 0, 0),
			},
			callback: (evt: CompanionFeedbackEvent): boolean => {
				const path = `/-stat/selidx`
				const data = path ? state.get(path) : undefined
				const selectedChannel = getDataNumber(data, 0)
				return selectedChannel == evt.options.select
			},
			subscribe: (evt: CompanionFeedbackEvent): void => {
				const path = `/-stat/selidx`
				subscribeFeedback(ensureLoaded, subs, path, evt)
			},
			unsubscribe: (evt: CompanionFeedbackEvent): void => {
				const path = `/-stat/selidx`
				unsubscribeFeedback(subs, path, evt)
			},
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
				},
				{
					id: 'state',
					type: 'checkbox',
					label: 'On',
					default: true,
				},
			],
			defaultStyle: {
				bgcolor: combineRgb(255, 127, 0),
				color: combineRgb(0, 0, 0),
			},
			callback: (evt: CompanionFeedbackEvent): boolean => {
				const ch = `${getOptNumber(evt, 'solo') + 1}`.padStart(2, '0')
				const path = `/-stat/solosw/${ch}`
				const data = path ? state.get(path) : undefined
				const isOn = getDataNumber(data, 0) !== 0
				return isOn === !!evt.options.state
			},
			subscribe: (evt: CompanionFeedbackEvent): void => {
				const ch = `${getOptNumber(evt, 'solo') + 1}`.padStart(2, '0')
				const path = `/-stat/solosw/${ch}`
				subscribeFeedback(ensureLoaded, subs, path, evt)
			},
			unsubscribe: (evt: CompanionFeedbackEvent): void => {
				const ch = `${getOptNumber(evt, 'solo') + 1}`.padStart(2, '0')
				const path = `/-stat/solosw/${ch}`
				unsubscribeFeedback(subs, path, evt)
			},
		},
		[FeedbackId.ClearSolo]: {
			type: 'boolean',
			name: 'Change from clear solo state',
			description: 'If atleast one solo is selected the clear solo button is on and will change style of the bank',
			options: [
				{
					id: 'state',
					type: 'checkbox',
					label: 'On',
					default: true,
				},
			],
			defaultStyle: {
				bgcolor: combineRgb(255, 127, 0),
				color: combineRgb(0, 0, 0),
			},
			callback: (evt: CompanionFeedbackEvent): boolean => {
				const path = `/-stat/solo`
				const data = path ? state.get(path) : undefined
				const isOn = getDataNumber(data, 0) !== 0
				return isOn === !!evt.options.state
			},
			subscribe: (evt: CompanionFeedbackEvent): void => {
				const path = `/-stat/solo`
				subscribeFeedback(ensureLoaded, subs, path, evt)
			},
			unsubscribe: (evt: CompanionFeedbackEvent): void => {
				const path = `/-stat/solo`
				unsubscribeFeedback(subs, path, evt)
			},
		},
		[FeedbackId.SendsOnFader]: {
			type: 'boolean',
			name: 'Change from Sends on Fader/Fader Flip state',
			description: 'If the Sends on Fader/Fader Flip is on, change style of the bank',
			options: [
				{
					id: 'state',
					type: 'checkbox',
					label: 'On',
					default: true,
				},
			],
			defaultStyle: {
				bgcolor: combineRgb(255, 127, 0),
				color: combineRgb(0, 0, 0),
			},
			callback: (evt: CompanionFeedbackEvent): boolean => {
				const path = `/-stat/sendsonfader`
				const data = path ? state.get(path) : undefined
				const isOn = getDataNumber(data, 0) !== 0
				return isOn === !!evt.options.state
			},
			subscribe: (evt: CompanionFeedbackEvent): void => {
				const path = `/-stat/sendsonfader`
				subscribeFeedback(ensureLoaded, subs, path, evt)
			},
			unsubscribe: (evt: CompanionFeedbackEvent): void => {
				const path = `/-stat/sendsonfader`
				unsubscribeFeedback(subs, path, evt)
			},
		},
		[FeedbackId.SoloMono]: {
			type: 'boolean',
			name: 'Change from Solo Mono enabled state',
			description: 'If the Solo Mono is on, change style of the bank',
			options: [
				{
					id: 'state',
					type: 'checkbox',
					label: 'On',
					default: true,
				},
			],
			defaultStyle: {
				bgcolor: combineRgb(255, 127, 0),
				color: combineRgb(0, 0, 0),
			},
			callback: (evt: CompanionFeedbackEvent): boolean => {
				const path = `/config/solo/mono`
				const data = path ? state.get(path) : undefined
				const isOn = getDataNumber(data, 0) !== 0
				return isOn === !!evt.options.state
			},
			subscribe: (evt: CompanionFeedbackEvent): void => {
				const path = `/config/solo/mono`
				subscribeFeedback(ensureLoaded, subs, path, evt)
			},
			unsubscribe: (evt: CompanionFeedbackEvent): void => {
				const path = `/config/solo/mono`
				unsubscribeFeedback(subs, path, evt)
			},
		},
		[FeedbackId.SoloDim]: {
			type: 'boolean',
			name: 'Change from Solo Dim enabled state',
			description: 'If the Solo Dim is on, change style of the bank',
			options: [
				{
					id: 'state',
					type: 'checkbox',
					label: 'On',
					default: true,
				},
			],
			defaultStyle: {
				bgcolor: combineRgb(255, 127, 0),
				color: combineRgb(0, 0, 0),
			},
			callback: (evt: CompanionFeedbackEvent): boolean => {
				const path = `/config/solo/dim`
				const data = path ? state.get(path) : undefined
				const isOn = getDataNumber(data, 0) !== 0
				return isOn === !!evt.options.state
			},
			subscribe: (evt: CompanionFeedbackEvent): void => {
				const path = `/config/solo/dim`
				subscribeFeedback(ensureLoaded, subs, path, evt)
			},
			unsubscribe: (evt: CompanionFeedbackEvent): void => {
				const path = `/config/solo/dim`
				unsubscribeFeedback(subs, path, evt)
			},
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
				},
			],
			defaultStyle: {
				bgcolor: combineRgb(255, 0, 0),
				color: combineRgb(0, 0, 0),
			},
			callback: (evt: CompanionFeedbackEvent): boolean => {
				const path = `/-stat/tape/state`
				const data = path ? state.get(path) : undefined
				return getDataNumber(data, 0) == evt.options.tapeFunc
			},
			subscribe: (evt: CompanionFeedbackEvent): void => {
				const path = `/-stat/tape/state`
				subscribeFeedback(ensureLoaded, subs, path, evt)
			},
			unsubscribe: (evt: CompanionFeedbackEvent): void => {
				const path = `/-stat/tape/state`
				unsubscribeFeedback(subs, path, evt)
			},
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
				},
				{
					id: 'state',
					type: 'checkbox',
					label: 'On',
					default: true,
				},
			],
			defaultStyle: {
				bgcolor: combineRgb(0, 255, 127),
				color: combineRgb(0, 0, 0),
			},
			callback: (evt: CompanionFeedbackEvent): boolean => {
				const path = `/-stat/chfaderbank`
				const data = path ? state.get(path) : undefined
				const isOn = getDataNumber(data, 0) == evt.options.bank
				return isOn === !!evt.options.state
			},
			subscribe: (evt: CompanionFeedbackEvent): void => {
				const path = `/-stat/chfaderbank`
				subscribeFeedback(ensureLoaded, subs, path, evt)
			},
			unsubscribe: (evt: CompanionFeedbackEvent): void => {
				const path = `/-stat/chfaderbank`
				unsubscribeFeedback(subs, path, evt)
			},
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
				},
				{
					id: 'state',
					type: 'checkbox',
					label: 'On',
					default: true,
				},
			],
			defaultStyle: {
				bgcolor: combineRgb(0, 255, 127),
				color: combineRgb(0, 0, 0),
			},
			callback: (evt: CompanionFeedbackEvent): boolean => {
				const path = `/-stat/grpfaderbank`
				const data = path ? state.get(path) : undefined
				const isOn = getDataNumber(data, 0) == evt.options.bank
				return isOn === !!evt.options.state
			},
			subscribe: (evt: CompanionFeedbackEvent): void => {
				const path = `/-stat/grpfaderbank`
				subscribeFeedback(ensureLoaded, subs, path, evt)
			},
			unsubscribe: (evt: CompanionFeedbackEvent): void => {
				const path = `/-stat/grpfaderbank`
				unsubscribeFeedback(subs, path, evt)
			},
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
				},
				{
					id: 'state',
					type: 'checkbox',
					label: 'On',
					default: true,
				},
			],
			defaultStyle: {
				bgcolor: combineRgb(0, 255, 127),
				color: combineRgb(0, 0, 0),
			},
			callback: (evt: CompanionFeedbackEvent): boolean => {
				const path = `/-stat/chfaderbank`
				const data = path ? state.get(path) : undefined
				const isOn = getDataNumber(data, 0) == evt.options.bank
				return isOn === !!evt.options.state
			},
			subscribe: (evt: CompanionFeedbackEvent): void => {
				const path = `/-stat/chfaderbank`
				subscribeFeedback(ensureLoaded, subs, path, evt)
			},
			unsubscribe: (evt: CompanionFeedbackEvent): void => {
				const path = `/-stat/chfaderbank`
				unsubscribeFeedback(subs, path, evt)
			},
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
				},
				{
					id: 'state',
					type: 'checkbox',
					label: 'On',
					default: true,
				},
			],
			defaultStyle: {
				bgcolor: combineRgb(0, 255, 127),
				color: combineRgb(0, 0, 0),
			},
			callback: (evt: CompanionFeedbackEvent): boolean => {
				const path = `/-stat/grpfaderbank`
				const data = path ? state.get(path) : undefined
				const isOn = getDataNumber(data, 0) == evt.options.bank
				return isOn === !!evt.options.state
			},
			subscribe: (evt: CompanionFeedbackEvent): void => {
				const path = `/-stat/grpfaderbank`
				subscribeFeedback(ensureLoaded, subs, path, evt)
			},
			unsubscribe: (evt: CompanionFeedbackEvent): void => {
				const path = `/-stat/grpfaderbank`
				unsubscribeFeedback(subs, path, evt)
			},
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
				},
				{
					id: 'state',
					type: 'checkbox',
					label: 'On',
					default: true,
				},
			],
			defaultStyle: {
				bgcolor: combineRgb(255, 127, 0),
				color: combineRgb(0, 0, 0),
			},
			callback: (evt: CompanionFeedbackEvent): boolean => {
				const path = `/-stat/bussendbank`
				const data = path ? state.get(path) : undefined
				const isOn = getDataNumber(data, 0) == evt.options.bank
				return isOn === !!evt.options.state
			},
			subscribe: (evt: CompanionFeedbackEvent): void => {
				const path = `/-stat/bussendbank`
				subscribeFeedback(ensureLoaded, subs, path, evt)
			},
			unsubscribe: (evt: CompanionFeedbackEvent): void => {
				const path = `/-stat/bussendbank`
				unsubscribeFeedback(subs, path, evt)
			},
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
				},
				{
					id: 'state',
					type: 'checkbox',
					label: 'On',
					default: true,
				},
			],
			defaultStyle: {
				bgcolor: combineRgb(255, 127, 0),
				color: combineRgb(0, 0, 0),
			},
			callback: (evt: CompanionFeedbackEvent): boolean => {
				const path = `/-stat/userbank`
				const data = path ? state.get(path) : undefined
				const isOn = getDataNumber(data, 0) == evt.options.bank
				return isOn === !!evt.options.state
			},
			subscribe: (evt: CompanionFeedbackEvent): void => {
				const path = `/-stat/userbank`
				subscribeFeedback(ensureLoaded, subs, path, evt)
			},
			unsubscribe: (evt: CompanionFeedbackEvent): void => {
				const path = `/-stat/userbank`
				unsubscribeFeedback(subs, path, evt)
			},
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
				},
				{
					id: 'state',
					type: 'checkbox',
					label: 'On',
					default: true,
				},
			],
			defaultStyle: {
				bgcolor: combineRgb(0, 255, 127),
				color: combineRgb(0, 0, 0),
			},
			callback: (evt: CompanionFeedbackEvent): boolean => {
				const path = `/-stat/screen/screen`
				const data = path ? state.get(path) : undefined
				const isOn = getDataNumber(data, 0) == evt.options.screen
				return isOn === !!evt.options.state
			},
			subscribe: (evt: CompanionFeedbackEvent): void => {
				const path = `/-stat/screen/screen`
				subscribeFeedback(ensureLoaded, subs, path, evt)
			},
			unsubscribe: (evt: CompanionFeedbackEvent): void => {
				const path = `/-stat/screen/screen`
				unsubscribeFeedback(subs, path, evt)
			},
		},
		[FeedbackId.MuteGroupScreen]: {
			type: 'boolean',
			name: 'Change from mute groups screen enabled state',
			description: 'If mute groups screen is on, change style of the bank',
			options: [
				{
					id: 'state',
					type: 'checkbox',
					label: 'On',
					default: true,
				},
			],
			defaultStyle: {
				bgcolor: combineRgb(255, 0, 0),
				color: combineRgb(0, 0, 0),
			},
			callback: (evt: CompanionFeedbackEvent): boolean => {
				const path = `/-stat/screen/mutegrp`
				const data = path ? state.get(path) : undefined
				const isOn = getDataNumber(data, 0) !== 0
				return isOn === !!evt.options.state
			},
			subscribe: (evt: CompanionFeedbackEvent): void => {
				const path = `/-stat/screen/mutegrp`
				subscribeFeedback(ensureLoaded, subs, path, evt)
			},
			unsubscribe: (evt: CompanionFeedbackEvent): void => {
				const path = `/-stat/screen/mutegrp`
				unsubscribeFeedback(subs, path, evt)
			},
		},
		[FeedbackId.UtilityScreen]: {
			type: 'boolean',
			name: 'Change from Utility enabled state',
			description: 'If utility screen is on, change style of the bank',
			options: [
				{
					id: 'state',
					type: 'checkbox',
					label: 'On',
					default: true,
				},
			],
			defaultStyle: {
				bgcolor: combineRgb(0, 255, 127),
				color: combineRgb(0, 0, 0),
			},
			callback: (evt: CompanionFeedbackEvent): boolean => {
				const path = `/-stat/screen/utils`
				const data = path ? state.get(path) : undefined
				const isOn = getDataNumber(data, 0) !== 0
				return isOn === !!evt.options.state
			},
			subscribe: (evt: CompanionFeedbackEvent): void => {
				const path = `/-stat/screen/utils`
				subscribeFeedback(ensureLoaded, subs, path, evt)
			},
			unsubscribe: (evt: CompanionFeedbackEvent): void => {
				const path = `/-stat/screen/utils`
				unsubscribeFeedback(subs, path, evt)
			},
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
				},
				{
					id: 'state',
					type: 'checkbox',
					label: 'On',
					default: true,
				},
			],
			defaultStyle: {
				bgcolor: combineRgb(0, 255, 127),
				color: combineRgb(0, 0, 0),
			},
			callback: (evt: CompanionFeedbackEvent): boolean => {
				const screen = state.get('/-stat/screen/screen')
				const page = state.get('/-stat/screen/CHAN/page')
				const isOn = getDataNumber(screen, 0) === 0 && getDataNumber(page, 0) == evt.options.page
				return isOn === !!evt.options.state
			},
			subscribe: (evt: CompanionFeedbackEvent): void => {
				subscribeFeedback(ensureLoaded, subs, '/-stat/screen/screen', evt)
				subscribeFeedback(ensureLoaded, subs, '/-stat/screen/CHAN/page', evt)
			},
			unsubscribe: (evt: CompanionFeedbackEvent): void => {
				unsubscribeFeedback(subs, '/-stat/screen/screen', evt)
				unsubscribeFeedback(subs, '/-stat/screen/CHAN/page', evt)
			},
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
				},
				{
					id: 'state',
					type: 'checkbox',
					label: 'On',
					default: true,
				},
			],
			defaultStyle: {
				bgcolor: combineRgb(0, 255, 127),
				color: combineRgb(0, 0, 0),
			},
			callback: (evt: CompanionFeedbackEvent): boolean => {
				const screen = state.get('/-stat/screen/screen')
				const page = state.get('/-stat/screen/METER/page')
				const isOn = getDataNumber(screen, 0) === 1 && getDataNumber(page, 0) == evt.options.page
				return isOn === !!evt.options.state
			},
			subscribe: (evt: CompanionFeedbackEvent): void => {
				subscribeFeedback(ensureLoaded, subs, '/-stat/screen/screen', evt)
				subscribeFeedback(ensureLoaded, subs, '/-stat/screen/METER/page', evt)
			},
			unsubscribe: (evt: CompanionFeedbackEvent): void => {
				unsubscribeFeedback(subs, '/-stat/screen/screen', evt)
				unsubscribeFeedback(subs, '/-stat/screen/METER/page', evt)
			},
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
				},
				{
					id: 'state',
					type: 'checkbox',
					label: 'On',
					default: true,
				},
			],
			defaultStyle: {
				bgcolor: combineRgb(0, 255, 127),
				color: combineRgb(0, 0, 0),
			},
			callback: (evt: CompanionFeedbackEvent): boolean => {
				const screen = state.get('/-stat/screen/screen')
				const page = state.get('/-stat/screen/ROUTE/page')
				const isOn = getDataNumber(screen, 0) === 2 && getDataNumber(page, 0) == evt.options.page
				return isOn === !!evt.options.state
			},
			subscribe: (evt: CompanionFeedbackEvent): void => {
				subscribeFeedback(ensureLoaded, subs, '/-stat/screen/screen', evt)
				subscribeFeedback(ensureLoaded, subs, '/-stat/screen/ROUTE/page', evt)
			},
			unsubscribe: (evt: CompanionFeedbackEvent): void => {
				unsubscribeFeedback(subs, '/-stat/screen/screen', evt)
				unsubscribeFeedback(subs, '/-stat/screen/ROUTE/page', evt)
			},
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
				},
				{
					id: 'state',
					type: 'checkbox',
					label: 'On',
					default: true,
				},
			],
			defaultStyle: {
				bgcolor: combineRgb(0, 255, 127),
				color: combineRgb(0, 0, 0),
			},
			callback: (evt: CompanionFeedbackEvent): boolean => {
				const screen = state.get('/-stat/screen/screen')
				const page = state.get('/-stat/screen/SETUP/page')
				const isOn = getDataNumber(screen, 0) === 3 && getDataNumber(page, 0) == evt.options.page
				return isOn === !!evt.options.state
			},
			subscribe: (evt: CompanionFeedbackEvent): void => {
				subscribeFeedback(ensureLoaded, subs, '/-stat/screen/screen', evt)
				subscribeFeedback(ensureLoaded, subs, '/-stat/screen/SETUP/page', evt)
			},
			unsubscribe: (evt: CompanionFeedbackEvent): void => {
				unsubscribeFeedback(subs, '/-stat/screen/screen', evt)
				unsubscribeFeedback(subs, '/-stat/screen/SETUP/page', evt)
			},
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
				},
				{
					id: 'state',
					type: 'checkbox',
					label: 'On',
					default: true,
				},
			],
			defaultStyle: {
				bgcolor: combineRgb(0, 255, 127),
				color: combineRgb(0, 0, 0),
			},
			callback: (evt: CompanionFeedbackEvent): boolean => {
				const screen = state.get('/-stat/screen/screen')
				const page = state.get('/-stat/screen/LIB/page')
				const isOn = getDataNumber(screen, 0) === 4 && getDataNumber(page, 0) == evt.options.page
				return isOn === !!evt.options.state
			},
			subscribe: (evt: CompanionFeedbackEvent): void => {
				subscribeFeedback(ensureLoaded, subs, '/-stat/screen/screen', evt)
				subscribeFeedback(ensureLoaded, subs, '/-stat/screen/LIB/page', evt)
			},
			unsubscribe: (evt: CompanionFeedbackEvent): void => {
				unsubscribeFeedback(subs, '/-stat/screen/screen', evt)
				unsubscribeFeedback(subs, '/-stat/screen/LIB/page', evt)
			},
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
				},
				{
					id: 'state',
					type: 'checkbox',
					label: 'On',
					default: true,
				},
			],
			defaultStyle: {
				bgcolor: combineRgb(0, 255, 127),
				color: combineRgb(0, 0, 0),
			},
			callback: (evt: CompanionFeedbackEvent): boolean => {
				const screen = state.get('/-stat/screen/screen')
				const page = state.get('/-stat/screen/FX/page')
				const isOn = getDataNumber(screen, 0) === 5 && getDataNumber(page, 0) == evt.options.page
				return isOn === !!evt.options.state
			},
			subscribe: (evt: CompanionFeedbackEvent): void => {
				subscribeFeedback(ensureLoaded, subs, '/-stat/screen/screen', evt)
				subscribeFeedback(ensureLoaded, subs, '/-stat/screen/FX/page', evt)
			},
			unsubscribe: (evt: CompanionFeedbackEvent): void => {
				unsubscribeFeedback(subs, '/-stat/screen/screen', evt)
				unsubscribeFeedback(subs, '/-stat/screen/FX/page', evt)
			},
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
				},
				{
					id: 'state',
					type: 'checkbox',
					label: 'On',
					default: true,
				},
			],
			defaultStyle: {
				bgcolor: combineRgb(0, 255, 127),
				color: combineRgb(0, 0, 0),
			},
			callback: (evt: CompanionFeedbackEvent): boolean => {
				const screen = state.get('/-stat/screen/screen')
				const page = state.get('/-stat/screen/MON/page')
				const isOn = getDataNumber(screen, 0) === 6 && getDataNumber(page, 0) == evt.options.page
				return isOn === !!evt.options.state
			},
			subscribe: (evt: CompanionFeedbackEvent): void => {
				subscribeFeedback(ensureLoaded, subs, '/-stat/screen/screen', evt)
				subscribeFeedback(ensureLoaded, subs, '/-stat/screen/MON/page', evt)
			},
			unsubscribe: (evt: CompanionFeedbackEvent): void => {
				unsubscribeFeedback(subs, '/-stat/screen/screen', evt)
				unsubscribeFeedback(subs, '/-stat/screen/MON/page', evt)
			},
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
				},
				{
					id: 'state',
					type: 'checkbox',
					label: 'On',
					default: true,
				},
			],
			defaultStyle: {
				bgcolor: combineRgb(0, 255, 127),
				color: combineRgb(0, 0, 0),
			},
			callback: (evt: CompanionFeedbackEvent): boolean => {
				const screen = state.get('/-stat/screen/screen')
				const page = state.get('/-stat/screen/USB/page')
				const isOn = getDataNumber(screen, 0) === 7 && getDataNumber(page, 0) == evt.options.page
				return isOn === !!evt.options.state
			},
			subscribe: (evt: CompanionFeedbackEvent): void => {
				subscribeFeedback(ensureLoaded, subs, '/-stat/screen/screen', evt)
				subscribeFeedback(ensureLoaded, subs, '/-stat/screen/USB/page', evt)
			},
			unsubscribe: (evt: CompanionFeedbackEvent): void => {
				unsubscribeFeedback(subs, '/-stat/screen/screen', evt)
				unsubscribeFeedback(subs, '/-stat/screen/USB/page', evt)
			},
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
				},
				{
					id: 'state',
					type: 'checkbox',
					label: 'On',
					default: true,
				},
			],
			defaultStyle: {
				bgcolor: combineRgb(0, 255, 127),
				color: combineRgb(0, 0, 0),
			},
			callback: (evt: CompanionFeedbackEvent): boolean => {
				const screen = state.get('/-stat/screen/screen')
				const page = state.get('/-stat/screen/SCENE/page')
				const isOn = getDataNumber(screen, 0) === 8 && getDataNumber(page, 0) == evt.options.page
				return isOn === !!evt.options.state
			},
			subscribe: (evt: CompanionFeedbackEvent): void => {
				subscribeFeedback(ensureLoaded, subs, '/-stat/screen/screen', evt)
				subscribeFeedback(ensureLoaded, subs, '/-stat/screen/SCENE/page', evt)
			},
			unsubscribe: (evt: CompanionFeedbackEvent): void => {
				unsubscribeFeedback(subs, '/-stat/screen/screen', evt)
				unsubscribeFeedback(subs, '/-stat/screen/SCENE/page', evt)
			},
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
				},
				{
					id: 'state',
					type: 'checkbox',
					label: 'On',
					default: true,
				},
			],
			defaultStyle: {
				bgcolor: combineRgb(0, 255, 127),
				color: combineRgb(0, 0, 0),
			},
			callback: (evt: CompanionFeedbackEvent): boolean => {
				const screen = state.get('/-stat/screen/screen')
				const page = state.get('/-stat/screen/ASSIGN/page')
				const isOn = getDataNumber(screen, 0) === 9 && getDataNumber(page, 0) == evt.options.page
				return isOn === !!evt.options.state
			},
			subscribe: (evt: CompanionFeedbackEvent): void => {
				subscribeFeedback(ensureLoaded, subs, '/-stat/screen/screen', evt)
				subscribeFeedback(ensureLoaded, subs, '/-stat/screen/ASSIGN/page', evt)
			},
			unsubscribe: (evt: CompanionFeedbackEvent): void => {
				unsubscribeFeedback(subs, '/-stat/screen/screen', evt)
				unsubscribeFeedback(subs, '/-stat/screen/ASSIGN/page', evt)
			},
		},
	}

	return feedbacks
}
