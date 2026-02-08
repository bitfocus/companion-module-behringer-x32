import type { CompanionActionDefinitions } from '@companion-module/base'
import type { ActionsProps } from './main.js'
import { actionSubscriptionWrapper } from './util.js'
import { convertChoices, FadeDurationChoice, GetPanningChoiceConfigs, PanningChoice, PanningDelta } from '../choices.js'
import { parseRefToPaths } from '../paths.js'
import type { Easing } from '../easings.js'

export type ChannelSendPanningActionsSchema = {
	'channel-send-panning': {
		options: {
			source: string
			target: string
			pan: number
			fadeDuration: number
			fadeAlgorithm: string
			fadeType: string
		}
	}
	'channel-send-panning-delta': {
		options: {
			source: string
			target: string
			delta: number
			fadeDuration: number
			fadeAlgorithm: string
			fadeType: string
		}
	}
	'channel-send-panning-store': {
		options: {
			source: string
			target: string
		}
	}
	'channel-send-panning-restore': {
		options: {
			source: string
			target: string
			fadeDuration: number
			fadeAlgorithm: string
			fadeType: string
		}
	}
}

export function getChannelSendPanningActions(
	props: ActionsProps,
): CompanionActionDefinitions<ChannelSendPanningActionsSchema> {
	const panningChoices = GetPanningChoiceConfigs(props.state)

	return {
		'channel-send-panning': {
			name: 'Set panning on channel to bus send',
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
				PanningChoice,
				...FadeDurationChoice,
			],
			...actionSubscriptionWrapper(props, {
				getPath: (options) => {
					const sourceRef = parseRefToPaths(options.source, panningChoices.allSourcesParseOptions)
					const targetRef = parseRefToPaths(options.target, panningChoices.channelSendTargetsParseOptions)
					if (!sourceRef?.sendTo || !targetRef?.sendToSink?.pan) return null

					return `${sourceRef.sendTo.path}/${targetRef.sendToSink.pan}`
				},
				execute: (action, cachedData, path) => {
					const currentVal = cachedData && cachedData[0]?.type === 'f' ? cachedData[0]?.value : undefined
					props.transitions.run(
						path,
						currentVal,
						action.options.pan / 100 + 0.5,
						action.options.fadeDuration,
						action.options.fadeAlgorithm as Easing.algorithm,
						action.options.fadeType as Easing.curve,
					)

					// Handled by the transitions!
					return undefined
				},
				shouldSubscribe: true,
				optionsToMonitorForSubscribe: ['source', 'target'],
			}),
		},
		'channel-send-panning-delta': {
			name: 'Adjust panning on channel to bus send',
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
				PanningDelta,
				...FadeDurationChoice,
			],
			...actionSubscriptionWrapper(props, {
				getPath: (options) => {
					const sourceRef = parseRefToPaths(options.source, panningChoices.allSourcesParseOptions)
					const targetRef = parseRefToPaths(options.target, panningChoices.channelSendTargetsParseOptions)
					if (!sourceRef?.sendTo || !targetRef?.sendToSink?.pan) return null

					return `${sourceRef.sendTo.path}/${targetRef.sendToSink.pan}`
				},
				execute: (action, cachedData, path) => {
					const currentVal = cachedData && cachedData[0]?.type === 'f' ? cachedData[0]?.value : 0
					let newVal = currentVal + action.options.delta / 100
					if (newVal < 0) {
						newVal = 0
					} else if (newVal > 1) {
						newVal = 1
					}
					props.transitions.run(
						path,
						currentVal,
						newVal,
						action.options.fadeDuration,
						action.options.fadeAlgorithm as Easing.algorithm,
						action.options.fadeType as Easing.curve,
					)

					// Handled by the transitions!
					return undefined
				},
				shouldSubscribe: true,
				optionsToMonitorForSubscribe: ['source', 'target'],
			}),
		},
		'channel-send-panning-store': {
			name: 'Store panning on channel to bus send',
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
			],
			...actionSubscriptionWrapper(props, {
				getPath: (options) => {
					const sourceRef = parseRefToPaths(options.source, panningChoices.allSourcesParseOptions)
					const targetRef = parseRefToPaths(options.target, panningChoices.channelSendTargetsParseOptions)
					if (!sourceRef?.sendTo || !targetRef?.sendToSink?.pan) return null

					return `${sourceRef.sendTo.path}/${targetRef.sendToSink.pan}`
				},
				execute: (action, cachedData, path) => {
					const currentVal = cachedData && cachedData[0]?.type === 'f' ? cachedData[0].value : undefined
					if (currentVal !== undefined) {
						props.state.setPressValue(`${action.controlId}-${path}`, currentVal)
					}

					// Nothing to do
					return undefined
				},
				shouldSubscribe: true,
				optionsToMonitorForSubscribe: ['source', 'target'],
			}),
		},
		'channel-send-panning-restore': {
			name: 'Restore panning on channel to bus send',
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
				...FadeDurationChoice,
			],
			...actionSubscriptionWrapper(props, {
				getPath: (options) => {
					const sourceRef = parseRefToPaths(options.source, panningChoices.allSourcesParseOptions)
					const targetRef = parseRefToPaths(options.target, panningChoices.channelSendTargetsParseOptions)
					if (!sourceRef?.sendTo || !targetRef?.sendToSink?.pan) return null

					return `${sourceRef.sendTo.path}/${targetRef.sendToSink.pan}`
				},
				execute: (action, cachedData, path) => {
					const storedVal = props.state.popPressValue(`${action.controlId}-${path}`)
					if (storedVal != undefined) {
						const currentVal = cachedData && cachedData[0]?.type === 'f' ? cachedData[0].value : undefined
						if (currentVal !== undefined) {
							props.transitions.run(
								path,
								currentVal,
								storedVal,
								action.options.fadeDuration,
								action.options.fadeAlgorithm as Easing.algorithm,
								action.options.fadeType as Easing.curve,
							)
						}
					}

					// Handled by the transitions!
					return undefined
				},
				shouldSubscribe: true,
				optionsToMonitorForSubscribe: ['source', 'target'],
			}),
		},
	}
}
