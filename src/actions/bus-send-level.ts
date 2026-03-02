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
import type { FadeProps } from '../transitions.js'

export type BusSendLevelActionsSchema = {
	level_bus_send: {
		options: {
			source: string
			target: string
			fad: number
		} & FadeProps
	}
	level_bus_send_delta: {
		options: {
			source: string
			target: string
			delta: number
		} & FadeProps
	}
	level_bus_store: {
		options: {
			source: string
			target: string
		}
	}
	level_bus_restore: {
		options: {
			source: string
			target: string
		} & FadeProps
	}
}

export function getBusSendLevelActions(props: ActionsProps): CompanionActionDefinitions<BusSendLevelActionsSchema> {
	const levelsChoices = GetLevelsChoiceConfigs(props.state)

	return {
		level_bus_send: {
			name: 'Set level of bus to matrix send',
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
				FaderLevelChoice,
				...FadeDurationChoice,
			],
			...actionSubscriptionWrapper(props, {
				getPath: (options) => {
					const sourceRef = parseRefToPaths(options.source, levelsChoices.busSendSourcesParseOptions)
					const targetRef = parseRefToPaths(options.target, levelsChoices.busSendTargetsParseOptions)
					if (!sourceRef?.sendTo || !targetRef?.sendToSink?.level) return null

					// In case we have a fade time
					return `${sourceRef.sendTo.path}/${targetRef.sendToSink.level}`
				},
				execute: (action, cachedData, path) => {
					const currentVal = cachedData && cachedData[0]?.type === 'f' ? floatToDB(cachedData[0]?.value) : undefined
					props.transitions.runForDb(path, currentVal, action.options.fad, action.options)

					// Handled by the transitions!
					return undefined
				},
				shouldSubscribe: true,
				optionsToMonitorForSubscribe: ['source', 'target'],
			}),
		},
		level_bus_send_delta: {
			name: 'Adjust level of bus to matrix send',
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
				FaderLevelDeltaChoice,
				...FadeDurationChoice,
			],

			...actionSubscriptionWrapper(props, {
				getPath: (options) => {
					const sourceRef = parseRefToPaths(options.source, levelsChoices.busSendSourcesParseOptions)
					const targetRef = parseRefToPaths(options.target, levelsChoices.busSendTargetsParseOptions)
					if (!sourceRef?.sendTo || !targetRef?.sendToSink?.level) return null

					// In case we have a fade time
					return `${sourceRef.sendTo.path}/${targetRef.sendToSink.level}`
				},
				execute: (action, cachedData, path) => {
					const currentVal = cachedData && cachedData[0]?.type === 'f' ? floatToDB(cachedData[0]?.value) : undefined
					if (typeof currentVal === 'number') {
						props.transitions.runForDb(path, currentVal, currentVal + action.options.delta, action.options)
					}

					// Handled by the transitions!
					return undefined
				},
				shouldSubscribe: true,
				optionsToMonitorForSubscribe: ['source', 'target'],
			}),
		},
		level_bus_store: {
			name: 'Store level of bus to matrix send',
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
			...actionSubscriptionWrapper(props, {
				getPath: (options) => {
					const sourceRef = parseRefToPaths(options.source, levelsChoices.busSendSourcesParseOptions)
					const targetRef = parseRefToPaths(options.target, levelsChoices.busSendTargetsParseOptions)
					if (!sourceRef?.sendTo || !targetRef?.sendToSink?.level) return null

					// In case we have a fade time
					return `${sourceRef.sendTo.path}/${targetRef.sendToSink.level}`
				},
				execute: (action, cachedData, path) => {
					const currentVal = cachedData && cachedData[0]?.type === 'f' ? floatToDB(cachedData[0]?.value) : undefined
					if (currentVal !== undefined) {
						props.state.setPressValue(`${action.controlId}-${path}`, currentVal)
					}

					// Handled by the transitions!
					return undefined
				},
				shouldSubscribe: true,
				optionsToMonitorForSubscribe: ['source', 'target'],
			}),
		},
		level_bus_restore: {
			name: 'Restore level of bus to matrix send',
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
				...FadeDurationChoice,
			],
			...actionSubscriptionWrapper(props, {
				getPath: (options) => {
					const sourceRef = parseRefToPaths(options.source, levelsChoices.busSendSourcesParseOptions)
					const targetRef = parseRefToPaths(options.target, levelsChoices.busSendTargetsParseOptions)
					if (!sourceRef?.sendTo || !targetRef?.sendToSink?.level) return null

					// In case we have a fade time
					return `${sourceRef.sendTo.path}/${targetRef.sendToSink.level}`
				},
				execute: (action, cachedData, path) => {
					const storedVal = props.state.popPressValue(`${action.controlId}-${path}`)
					if (storedVal !== undefined) {
						const currentVal = cachedData && cachedData[0]?.type === 'f' ? floatToDB(cachedData[0]?.value) : undefined
						if (currentVal !== undefined) {
							props.transitions.runForDb(path, currentVal, storedVal, action.options)
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
