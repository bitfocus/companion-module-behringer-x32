import { CompanionFeedbacks, CompanionFeedbackEvent, CompanionFeedbackBoolean } from '../../../instance_skel_types'
import { X32State, X32Subscriptions } from './state'
import {
	GetMuteGroupChoices,
	GetTargetChoices,	
	GetChannelSendChoices,
	convertChoices,
	GetOscillatorDestinations,
	FaderLevelChoice,
	GetLevelsChoiceConfigs,
} from './choices'
import { compareNumber, floatToDB } from './util'
import { MutePath, MainPath, MainFaderPath, SendChannelToBusPath, SendBusToMatrixPath } from './paths'
// eslint-disable-next-line node/no-extraneous-import
import * as osc from 'osc'
import InstanceSkel = require('../../../instance_skel')
import { X32Config } from './config'
import { NumberComparitorPicker } from './input'
import { SetRequired } from 'type-fest'

type CompanionFeedbackWithCallback = SetRequired<CompanionFeedbackBoolean, 'callback' | 'subscribe' | 'unsubscribe'>

export enum FeedbackId {
	Mute = 'mute',
	MuteGroup = 'mute_grp',
	MuteChannelSend = 'mute_channel_send',
	MuteBusSend = 'mute_bus_send',
	FaderLevel = 'fader_level',
	ChannelSendLevel = 'level_channel_send',
	BusSendLevel = 'level_bus_send',
	TalkbackTalk = 'talkback_talk',
	OscillatorEnable = 'oscillator-enable',
	OscillatorDestination = 'oscillator-destination',
	Select = 'select',
	Solo = 'solo',
	ClearSolo = 'clear',
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
	self: InstanceSkel<X32Config>,
	state: X32State,
	subs: X32Subscriptions,
	ensureLoaded: (path: string) => void
): CompanionFeedbacks {
	const levelsChoices = GetLevelsChoiceConfigs(state)
	const muteGroups = GetMuteGroupChoices(state)
	const selectChoices = GetTargetChoices(state, { skipDca: true, includeMain: true, numericIndex: true })
	const soloChoices = GetTargetChoices(state, {includeMain: true, numericIndex: true })

	const feedbacks: { [id in FeedbackId]: CompanionFeedbackWithCallback | undefined } = {
		[FeedbackId.Mute]: {
			type: 'boolean',
			label: 'Change from mute state',
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
			style: {
				bgcolor: self.rgb(255, 0, 0),
				color: self.rgb(0, 0, 0),
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
			label: 'Change from mute group state',
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
			style: {
				bgcolor: self.rgb(255, 0, 0),
				color: self.rgb(0, 0, 0),
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
			label: 'Change from channel to bus send mute state',
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
			style: {
				bgcolor: self.rgb(255, 0, 0),
				color: self.rgb(0, 0, 0),
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
			label: 'Change from bus to matrix send mute state',
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
			style: {
				bgcolor: self.rgb(255, 0, 0),
				color: self.rgb(0, 0, 0),
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
			label: 'Change from fader level',
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
			style: {
				bgcolor: self.rgb(0, 255, 0),
				color: self.rgb(0, 0, 0),
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
			label: 'Change from level of channel to bus send',
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
			style: {
				bgcolor: self.rgb(0, 255, 0),
				color: self.rgb(0, 0, 0),
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
			label: 'Change from level of bus to matrix send',
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
			style: {
				bgcolor: self.rgb(0, 255, 0),
				color: self.rgb(0, 0, 0),
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
		[FeedbackId.TalkbackTalk]: {
			type: 'boolean',
			label: 'Change from talkback talk state',
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
			style: {
				bgcolor: self.rgb(255, 0, 0),
				color: self.rgb(0, 0, 0),
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
			label: 'Change from oscillator enabled state',
			description: 'If the oscillator is on, change style of the bank',
			options: [
				{
					id: 'state',
					type: 'checkbox',
					label: 'On',
					default: true,
				},
			],
			style: {
				bgcolor: self.rgb(255, 0, 0),
				color: self.rgb(0, 0, 0),
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
			label: 'Change from oscillator destination state',
			description: 'If the oscillator destination matches, change style of the bank',
			options: [
				{
					type: 'dropdown',
					label: 'destination',
					id: 'destination',
					...convertChoices(GetOscillatorDestinations(state)),
				},
			],
			style: {
				bgcolor: self.rgb(255, 0, 0),
				color: self.rgb(0, 0, 0),
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
			label: 'Change from solo enabled state',
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
			style: {
				bgcolor: self.rgb(255, 127, 0),
				color: self.rgb(0, 0, 0),
			},
			callback: (evt: CompanionFeedbackEvent): boolean => {
				const ch = `${getOptNumber(evt, 'solo')+1}`.padStart(2,"0")
				const path = `/-stat/solosw/${ch}`
				const data = path ? state.get(path) : undefined
				const isOn = getDataNumber(data, 0) !== 0
				return isOn === !!evt.options.state
			},
			subscribe: (evt: CompanionFeedbackEvent): void => {
				const ch = `${getOptNumber(evt, 'solo')+1}`.padStart(2,"0")
				const path = `/-stat/solosw/${ch}`
				subscribeFeedback(ensureLoaded, subs, path, evt)
			},
			unsubscribe: (evt: CompanionFeedbackEvent): void => {
				const ch = `${getOptNumber(evt, 'solo')+1}`.padStart(2,"0")
				const path = `/-stat/solosw/${ch}`
				unsubscribeFeedback(subs, path, evt)
			},
		},
		[FeedbackId.Select]: {
			type: 'boolean',
			label: 'Change from select state',
			description: 'If specified channel is selected, change style of the bank',
			options: [
				{
					type: 'dropdown',
					label: 'Target',
					id: 'select',
					...convertChoices(selectChoices),
				},
			],
			style: {
				bgcolor: self.rgb(0, 255, 127),
				color: self.rgb(0, 0, 0),
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
			label: 'Change from solo enabled state',
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
			style: {
				bgcolor: self.rgb(255, 127, 0),
				color: self.rgb(0, 0, 0),
			},
			callback: (evt: CompanionFeedbackEvent): boolean => {
				const ch = `${getOptNumber(evt, 'solo')+1}`.padStart(2,"0")
				const path = `/-stat/solosw/${ch}`
				const data = path ? state.get(path) : undefined
				const isOn = getDataNumber(data, 0) !== 0
				return isOn === !!evt.options.state
			},
			subscribe: (evt: CompanionFeedbackEvent): void => {
				const ch = `${getOptNumber(evt, 'solo')+1}`.padStart(2,"0")
				const path = `/-stat/solosw/${ch}`
				subscribeFeedback(ensureLoaded, subs, path, evt)
			},
			unsubscribe: (evt: CompanionFeedbackEvent): void => {
				const ch = `${getOptNumber(evt, 'solo')+1}`.padStart(2,"0")
				const path = `/-stat/solosw/${ch}`
				unsubscribeFeedback(subs, path, evt)
			},
		},
		[FeedbackId.ClearSolo]: {
			type: 'boolean',
			label: 'Change from clear solo state',
			description: 'If atleast one solo is selected the clear solo button is on and will change style of the bank',
			options:[],
			style: {
				bgcolor: self.rgb(255, 127, 0),
				color: self.rgb(0, 0, 0),
			},
			callback: (): boolean => {
				const path = `/-stat/solo`
				const data = path ? state.get(path) : undefined
				return getDataNumber(data, 0) !== 0
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
	}

	return feedbacks
}
