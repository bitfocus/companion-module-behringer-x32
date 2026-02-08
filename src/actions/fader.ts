import type { CompanionActionDefinitions } from '@companion-module/base'
import type { ActionsProps } from './main.js'
import { actionSubscriptionWrapper } from './util.js'
import {
	convertChoices,
	GetLevelsChoiceConfigs,
	FadeDurationChoice,
	FaderLevelChoice,
	FaderLevelDeltaChoice,
} from '../choices.js'
import { parseRefToPaths } from '../paths.js'
import { floatToDB } from '../util.js'
import type { Easing } from '../easings.js'

export type FaderActionsSchema = {
	fad: {
		options: {
			target: string
			fad: number
			fadeDuration: number
			fadeAlgorithm: string
			fadeType: string
		}
	}
	fader_store: {
		options: {
			target: string
		}
	}
	fader_restore: {
		options: {
			target: string
			fadeDuration: number
			fadeAlgorithm: string
			fadeType: string
		}
	}
	fader_delta: {
		options: {
			target: string
			delta: number
			fadeDuration: number
			fadeAlgorithm: string
			fadeType: string
		}
	}
}

export function getFaderActions(props: ActionsProps): CompanionActionDefinitions<FaderActionsSchema> {
	const levelsChoices = GetLevelsChoiceConfigs(props.state)

	return {
		fad: {
			name: 'Set fader level',
			options: [
				{
					type: 'dropdown',
					label: 'Target',
					id: 'target',
					...convertChoices(levelsChoices.channels),
					allowInvalidValues: true,
				},
				FaderLevelChoice,
				...FadeDurationChoice,
			],
			...actionSubscriptionWrapper(props, {
				getPath: (options) => {
					const refPaths = parseRefToPaths(options.target, levelsChoices.channelsParseOptions)
					return refPaths?.level?.path ?? null
				},
				execute: (action, cachedData, path) => {
					const currentVal = cachedData && cachedData[0]?.type === 'f' ? floatToDB(cachedData[0]?.value) : undefined
					props.transitions.runForDb(
						path,
						currentVal,
						action.options.fad,
						action.options.fadeDuration,
						action.options.fadeAlgorithm as Easing.algorithm,
						action.options.fadeType as Easing.curve,
					)

					// Handled by the transitions!
					return undefined
				},
				shouldSubscribe: true,
				optionsToMonitorForSubscribe: ['target'],
			}),
		},
		fader_store: {
			name: 'Store fader level',
			options: [
				{
					type: 'dropdown',
					label: 'Target',
					id: 'target',
					...convertChoices(levelsChoices.channels),
					allowInvalidValues: true,
				},
			],
			...actionSubscriptionWrapper(props, {
				getPath: (options) => {
					const refPaths = parseRefToPaths(options.target, levelsChoices.channelsParseOptions)
					return refPaths?.level?.path ?? null
				},
				execute: (action, cachedData, path) => {
					const currentVal = cachedData && cachedData[0]?.type === 'f' ? floatToDB(cachedData[0]?.value) : undefined
					if (currentVal !== undefined) {
						props.state.setPressValue(`${action.controlId}-${path}`, currentVal)
					}

					// Nothing to send right now
					return undefined
				},
				shouldSubscribe: true,
				optionsToMonitorForSubscribe: ['target'],
			}),
		},
		fader_restore: {
			name: 'Restore fader level',
			options: [
				{
					type: 'dropdown',
					label: 'Target',
					id: 'target',
					...convertChoices(levelsChoices.channels),
					allowInvalidValues: true,
				},
				...FadeDurationChoice,
			],
			...actionSubscriptionWrapper(props, {
				getPath: (options) => {
					const refPaths = parseRefToPaths(options.target, levelsChoices.channelsParseOptions)
					return refPaths?.level?.path ?? null
				},
				execute: (action, cachedData, path) => {
					const storedVal = props.state.popPressValue(`${action.controlId}-${path}`)
					if (storedVal !== undefined) {
						const currentVal = cachedData && cachedData[0]?.type === 'f' ? floatToDB(cachedData[0]?.value) : undefined
						if (currentVal !== undefined) {
							props.transitions.runForDb(path, currentVal, storedVal, action.options.fadeDuration)
						}
					}

					// Handled by the transitions!
					return undefined
				},
				shouldSubscribe: true,
				optionsToMonitorForSubscribe: ['target'],
			}),
		},
		fader_delta: {
			name: 'Adjust fader level',
			options: [
				{
					type: 'dropdown',
					label: 'Target',
					id: 'target',
					...convertChoices(levelsChoices.channels),
					allowInvalidValues: true,
				},
				FaderLevelDeltaChoice,
				...FadeDurationChoice,
			],
			...actionSubscriptionWrapper(props, {
				getPath: (options) => {
					const refPaths = parseRefToPaths(options.target, levelsChoices.channelsParseOptions)
					return refPaths?.level?.path ?? null
				},
				execute: (action, cachedData, path) => {
					const currentVal = cachedData && cachedData[0]?.type === 'f' ? floatToDB(cachedData[0]?.value) : undefined
					if (typeof currentVal === 'number') {
						props.transitions.runForDb(
							path,
							currentVal,
							currentVal + action.options.delta,
							action.options.fadeDuration,
							action.options.fadeAlgorithm as Easing.algorithm,
							action.options.fadeType as Easing.curve,
						)
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
