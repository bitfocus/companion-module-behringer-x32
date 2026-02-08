import type { CompanionActionDefinitions } from '@companion-module/base'
import type { ActionsProps } from './main.js'
import { actionSubscriptionWrapper } from './util.js'
import { convertChoices, FadeDurationChoice, GetPanningChoiceConfigs, PanningChoice, PanningDelta } from '../choices.js'
import { parseRefToPaths } from '../paths.js'
import type { FadeProps } from '../transitions.js'

export type BusSendPanningActionsSchema = {
	'bus-send-panning': {
		options: {
			source: string
			target: string
			pan: number
		} & FadeProps
	}
	'bus-send-panning-delta': {
		options: {
			source: string
			target: string
			delta: number
		} & FadeProps
	}
	'bus-send-panning-store': {
		options: {
			source: string
			target: string
		}
	}
	'bus-send-panning-restore': {
		options: {
			source: string
			target: string
		} & FadeProps
	}
}

export function getBusSendPanningActions(props: ActionsProps): CompanionActionDefinitions<BusSendPanningActionsSchema> {
	const panningChoices = GetPanningChoiceConfigs(props.state)

	return {
		'bus-send-panning': {
			name: 'Set panning on bus to matrix send',
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
				PanningChoice,
				...FadeDurationChoice,
			],
			...actionSubscriptionWrapper(props, {
				getPath: (options) => {
					const sourceRef = parseRefToPaths(options.source, panningChoices.busSendSourceParseOptions)
					const targetRef = parseRefToPaths(options.target, panningChoices.busSendTargetParseOptions)
					if (!sourceRef?.sendTo || !targetRef?.sendToSink?.pan) return null

					return `${sourceRef.sendTo.path}/${targetRef.sendToSink.pan}`
				},
				execute: (action, cachedData, path) => {
					const currentVal = cachedData && cachedData[0]?.type === 'f' ? cachedData[0]?.value : undefined
					props.transitions.run(path, currentVal, action.options.pan / 100 + 0.5, action.options)

					// Handled by the transitions!
					return undefined
				},
				shouldSubscribe: true,
				optionsToMonitorForSubscribe: ['source', 'target'],
			}),
		},
		'bus-send-panning-delta': {
			name: 'Adjust panning on bus to matrix bus send',
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
				PanningDelta,
				...FadeDurationChoice,
			],
			...actionSubscriptionWrapper(props, {
				getPath: (options) => {
					const sourceRef = parseRefToPaths(options.source, panningChoices.busSendSourceParseOptions)
					const targetRef = parseRefToPaths(options.target, panningChoices.busSendTargetParseOptions)
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
					props.transitions.run(path, currentVal, newVal, action.options)

					// Handled by the transitions!
					return undefined
				},
				shouldSubscribe: true,
				optionsToMonitorForSubscribe: ['source', 'target'],
			}),
		},
		'bus-send-panning-store': {
			name: 'Store panning on bus to matrix send',
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
			],
			...actionSubscriptionWrapper(props, {
				getPath: (options) => {
					const sourceRef = parseRefToPaths(options.source, panningChoices.busSendSourceParseOptions)
					const targetRef = parseRefToPaths(options.target, panningChoices.busSendTargetParseOptions)
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
		'bus-send-panning-restore': {
			name: 'Restore panning on bus to matrix send',
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
				...FadeDurationChoice,
			],
			...actionSubscriptionWrapper(props, {
				getPath: (options) => {
					const sourceRef = parseRefToPaths(options.source, panningChoices.busSendSourceParseOptions)
					const targetRef = parseRefToPaths(options.target, panningChoices.busSendTargetParseOptions)
					if (!sourceRef?.sendTo || !targetRef?.sendToSink?.pan) return null

					return `${sourceRef.sendTo.path}/${targetRef.sendToSink.pan}`
				},
				execute: (action, cachedData, path) => {
					const storedVal = props.state.popPressValue(`${action.controlId}-${path}`)
					if (storedVal != undefined) {
						const currentVal = cachedData && cachedData[0]?.type === 'f' ? cachedData[0].value : undefined
						if (currentVal !== undefined) {
							props.transitions.run(path, currentVal, storedVal, action.options)
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
