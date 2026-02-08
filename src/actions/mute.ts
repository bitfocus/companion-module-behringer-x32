import type { CompanionActionDefinitions } from '@companion-module/base'
import type { ActionsProps } from './main.js'
import { actionSubscriptionWrapper, getResolveOnOffMute } from './util.js'
import {
	convertChoices,
	MuteChoice,
	MUTE_TOGGLE,
	CHOICES_MUTE_GROUP,
	GetTargetChoicesNew,
	GetChannelSendParseOptions,
	GetLevelsChoiceConfigs,
	GetMuteGroupChoices,
} from '../choices.js'
import { parseRefToPaths } from '../paths.js'

export type MuteActionsSchema = {
	mute: {
		options: {
			target: string
			mute: number // 0=off, 1=on, 2=toggle
		}
	}
	mute_grp: {
		options: {
			target: string
			mute: number // 0=off, 1=on, 2=toggle
		}
	}
	mute_channel_send: {
		options: {
			source: string
			target: string
			mute: number // 0=off, 1=on, 2=toggle
		}
	}
	mute_bus_send: {
		options: {
			source: string
			target: string
			mute: number // 0=off, 1=on, 2=toggle
		}
	}
}

export function getMuteActions(props: ActionsProps): CompanionActionDefinitions<MuteActionsSchema> {
	const levelsChoices = GetLevelsChoiceConfigs(props.state)
	const muteGroups = GetMuteGroupChoices(props.state)

	return {
		mute: {
			name: 'Set mute',
			options: [
				{
					type: 'dropdown',
					label: 'Target',
					id: 'target',
					...convertChoices(levelsChoices.channels),
					allowInvalidValues: true,
				},
				MuteChoice,
			],
			...actionSubscriptionWrapper(props, {
				getPath: (options) => {
					const refPaths = parseRefToPaths(options.target, levelsChoices.channelsParseOptions)
					return refPaths?.muteOrOn?.path || null
				},
				execute: (action, cachedData) => {
					const refPaths = parseRefToPaths(action.options.target, levelsChoices.channelsParseOptions)
					if (!refPaths?.muteOrOn) return

					// TODO - how to avoid this lookup for isOn?

					return {
						type: 'i',
						value: getResolveOnOffMute(cachedData, refPaths.muteOrOn.isOn, action.options.mute),
					}
				},
				shouldSubscribe: (options) => options.mute === MUTE_TOGGLE,
				optionsToMonitorForSubscribe: ['target', 'mute'],
			}),
		},
		mute_grp: {
			name: 'Mute Group ON/OFF',
			options: [
				{
					type: 'dropdown',
					label: 'Mute Group',
					id: 'target',
					...convertChoices(muteGroups),
					allowInvalidValues: true,
				},
				{
					type: 'dropdown',
					label: 'Mute / Unmute',
					id: 'mute',
					...convertChoices(CHOICES_MUTE_GROUP),
					disableAutoExpression: true,
				},
			],
			...actionSubscriptionWrapper(props, {
				getPath: (options) => {
					const muteGroupNumber = parseInt(options.target, 10)
					if (isNaN(muteGroupNumber)) return null

					return `/config/mute/${muteGroupNumber}`
				},
				execute: (action, cachedData) => ({
					type: 'i',
					value: getResolveOnOffMute(cachedData, false, action.options.mute),
				}),
				shouldSubscribe: (options) => options.mute === MUTE_TOGGLE,
				optionsToMonitorForSubscribe: ['target', 'mute'],
			}),
		},
		mute_channel_send: {
			name: 'Set mute for channel to bus send',
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
					...convertChoices(GetTargetChoicesNew(props.state, GetChannelSendParseOptions)),
					allowInvalidValues: true,
				},
				MuteChoice,
			],
			...actionSubscriptionWrapper(props, {
				getPath: (options) => {
					const sourceRef = parseRefToPaths(options.source, levelsChoices.allSourcesParseOptions)
					const targetRef = parseRefToPaths(options.target, GetChannelSendParseOptions)
					if (!sourceRef?.sendTo || !targetRef?.sendToSink?.on) return null

					return `${sourceRef.sendTo.path}/${targetRef.sendToSink.on}`
				},
				execute: (action, cachedData) => {
					const sourceRef = parseRefToPaths(action.options.source, levelsChoices.allSourcesParseOptions)
					if (!sourceRef?.sendTo) return

					// TODO - how to avoid this lookup for isOn?

					return {
						type: 'i',
						value: getResolveOnOffMute(cachedData, sourceRef.sendTo.isOn, action.options.mute),
					}
				},
				shouldSubscribe: (options) => options.mute === MUTE_TOGGLE,
				optionsToMonitorForSubscribe: ['source', 'target', 'mute'],
			}),
		},
		mute_bus_send: {
			name: 'Set mute for bus to matrix send',
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
				MuteChoice,
			],
			...actionSubscriptionWrapper(props, {
				getPath: (options) => {
					const sourceRef = parseRefToPaths(options.source, levelsChoices.busSendSourcesParseOptions)
					const targetRef = parseRefToPaths(options.target, levelsChoices.busSendTargetsParseOptions)
					if (!sourceRef?.sendTo || !targetRef?.sendToSink?.on) return null

					return `${sourceRef.sendTo.path}/${targetRef.sendToSink.on}`
				},
				execute: (action, cachedData) => {
					const sourceRef = parseRefToPaths(action.options.source, levelsChoices.busSendSourcesParseOptions)
					if (!sourceRef?.sendTo) return

					// TODO - how to avoid this lookup for isOn?

					return {
						type: 'i',
						value: getResolveOnOffMute(cachedData, sourceRef.sendTo.isOn, action.options.mute),
					}
				},
				shouldSubscribe: (options) => options.mute === MUTE_TOGGLE,
				optionsToMonitorForSubscribe: ['source', 'target', 'mute'],
			}),
		},
	}
}
