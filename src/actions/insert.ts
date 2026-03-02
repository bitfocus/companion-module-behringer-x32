import type { CompanionActionDefinitions } from '@companion-module/base'
import type { ActionsProps } from './main.js'
import { actionSubscriptionWrapper, getResolveOnOffMute } from './util.js'
import {
	CHOICES_ON_OFF,
	convertChoices,
	MUTE_TOGGLE,
	GetInsertDestinationChoices,
	GetTargetChoices,
} from '../choices.js'
import { ParseRefOptions, parseRefToPaths } from '../paths.js'

export type InsertActionsSchema = {
	'insert-on': {
		options: {
			src: string
			on: number
		}
	}
	'insert-pos': {
		options: {
			src: string
			pos: number
		}
	}
	'insert-select': {
		options: {
			src: string
			dest: number
		}
	}
}

export function getInsertActions(props: ActionsProps): CompanionActionDefinitions<InsertActionsSchema> {
	const insertSourceParseOptions: ParseRefOptions = {
		allowStereo: true,
		allowMono: true,
		allowChannel: true,
		allowBus: true,
		allowMatrix: true,
	}
	const insertSourceChoices = GetTargetChoices(props.state, insertSourceParseOptions)

	return {
		'insert-on': {
			name: 'Insert Status',
			description: 'Switch Insert no or off for a specific source',
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
					label: 'On / Off',
					id: 'on',
					...convertChoices(CHOICES_ON_OFF),
					disableAutoExpression: true,
				},
			],
			...actionSubscriptionWrapper(props, {
				getPath: (options) => {
					const srcRef = parseRefToPaths(options.src, insertSourceParseOptions)
					return srcRef?.insertSource?.onPath ?? null
				},
				execute: (action, cachedData) => {
					const onState = getResolveOnOffMute(cachedData, true, action.options.on)
					return {
						type: 'i',
						value: onState,
					}
				},
				shouldSubscribe: (options) => options.on === MUTE_TOGGLE,
				optionsToMonitorForSubscribe: ['src', 'on'],
			}),
		},
		'insert-pos': {
			name: 'Insert Position',
			description: 'Set whether insert is PRE or POST for specific source',
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
			callback: (action): void => {
				const srcRef = parseRefToPaths(action.options.src, insertSourceParseOptions)
				if (!srcRef?.insertSource) return

				props.sendOsc(srcRef.insertSource.posPath, {
					type: 'i',
					value: action.options.pos,
				})
			},
		},
		'insert-select': {
			name: 'Insert Destination',
			description: 'Set the destination of the insert for a specific source',
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
			callback: (action): void => {
				const srcRef = parseRefToPaths(action.options.src, insertSourceParseOptions)
				if (!srcRef?.insertSource) return

				props.sendOsc(srcRef.insertSource.selPath, {
					type: 'i',
					value: action.options.dest,
				})
			},
		},
	}
}
