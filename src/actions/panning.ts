import type { CompanionActionDefinitions } from '@companion-module/base'
import type { ActionsProps } from './main.js'
import { actionSubscriptionWrapper } from './util.js'
import { convertChoices, FadeDurationChoice, PanningChoice, GetPanningChoiceConfigs, PanningDelta } from '../choices.js'
import { parseRefToPaths } from '../paths.js'
import type { FadeProps } from '../transitions.js'

export type PanningActionsSchema = {
	panning: {
		options: {
			target: string
			pan: number
		} & FadeProps
	}
	'panning-delta': {
		options: {
			target: string
			delta: number
		} & FadeProps
	}
	'panning-store': {
		options: {
			target: string
		}
	}
	'panning-restore': {
		options: {
			target: string
		} & FadeProps
	}
}

export function getPanningActions(props: ActionsProps): CompanionActionDefinitions<PanningActionsSchema> {
	const panningChoices = GetPanningChoiceConfigs(props.state)

	return {
		panning: {
			name: 'Set panning',
			options: [
				{
					type: 'dropdown',
					label: 'Target',
					id: 'target',
					...convertChoices(panningChoices.allSources),
					allowInvalidValues: true,
				},
				PanningChoice,
				...FadeDurationChoice,
			],
			...actionSubscriptionWrapper(props, {
				getPath: (options) => {
					const refPaths = parseRefToPaths(options.target, panningChoices.allSourcesParseOptions)
					return refPaths?.pan?.path ?? null
				},
				execute: (action, cachedData, path) => {
					const currentVal = cachedData && cachedData[0]?.type === 'f' ? cachedData[0]?.value : undefined
					props.transitions.run(path, currentVal, action.options.pan / 100 + 0.5, action.options)

					// Handled by the transitions!
					return undefined
				},
				shouldSubscribe: true,
				optionsToMonitorForSubscribe: ['target'],
			}),
		},
		'panning-delta': {
			name: 'Adjust panning',
			options: [
				{
					type: 'dropdown',
					label: 'Target',
					id: 'target',
					...convertChoices(panningChoices.allSources),
					allowInvalidValues: true,
				},
				PanningDelta,
				...FadeDurationChoice,
			],
			...actionSubscriptionWrapper(props, {
				getPath: (options) => {
					const refPaths = parseRefToPaths(options.target, panningChoices.allSourcesParseOptions)
					return refPaths?.pan?.path ?? null
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
				optionsToMonitorForSubscribe: ['target'],
			}),
		},
		'panning-store': {
			name: 'Store panning',
			options: [
				{
					type: 'dropdown',
					label: 'Target',
					id: 'target',
					...convertChoices(panningChoices.allSources),
					allowInvalidValues: true,
				},
			],
			...actionSubscriptionWrapper(props, {
				getPath: (options) => {
					const refPaths = parseRefToPaths(options.target, panningChoices.allSourcesParseOptions)
					return refPaths?.pan?.path ?? null
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
				optionsToMonitorForSubscribe: ['target'],
			}),
		},
		'panning-restore': {
			name: 'Restore panning',
			options: [
				{
					type: 'dropdown',
					label: 'Target',
					id: 'target',
					...convertChoices(panningChoices.allSources),
					allowInvalidValues: true,
				},
				...FadeDurationChoice,
			],
			...actionSubscriptionWrapper(props, {
				getPath: (options) => {
					const refPaths = parseRefToPaths(options.target, panningChoices.allSourcesParseOptions)
					return refPaths?.pan?.path ?? null
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
				optionsToMonitorForSubscribe: ['target'],
			}),
		},
	}
}
