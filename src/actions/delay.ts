import type { CompanionActionDefinitions } from '@companion-module/base'
import type { ActionsProps } from './main.js'
import { actionSubscriptionWrapper, getResolveOnOffMute } from './util.js'
import { CHOICES_ON_OFF, convertChoices, GetTargetChoices, MUTE_TOGGLE } from '../choices.js'
import { parseRefToPaths } from '../paths.js'
import { delayToFloat, floatToDelay } from '../util.js'

export type DelayActionsSchema = {
	'delay-on': {
		options: {
			target: string
			on: number
		}
	}
	'delay-time': {
		options: {
			target: string
			time: number
		}
	}
	'delay-time-delta': {
		options: {
			target: string
			delta: number
		}
	}
}

export function getDelayActions(props: ActionsProps): CompanionActionDefinitions<DelayActionsSchema> {
	const parseOptions = { allowChannel: true }
	const channels = GetTargetChoices(props.state, parseOptions)
	const channelChoice = {
		type: 'dropdown' as const,
		label: 'Channel',
		id: 'target' as const,
		...convertChoices(channels),
		allowInvalidValues: true,
	}

	return {
		'delay-on': {
			name: 'Channel delay on/off',
			options: [
				channelChoice,
				{
					type: 'dropdown',
					label: 'On / Off',
					id: 'on',
					...convertChoices(CHOICES_ON_OFF),
					disableAutoExpression: true,
				},
			],
			...actionSubscriptionWrapper(props, {
				getPath: (options) => parseRefToPaths(options.target, parseOptions)?.delay?.onPath ?? null,
				execute: (action, cachedData) => ({
					type: 'i',
					value: getResolveOnOffMute(cachedData, true, action.options.on),
				}),
				shouldSubscribe: (options) => options.on === MUTE_TOGGLE,
				optionsToMonitorForSubscribe: ['target', 'on'],
			}),
		},
		'delay-time': {
			name: 'Set channel delay time',
			description: 'Set the channel delay time from 0.3 to 500 ms.',
			options: [
				channelChoice,
				{
					type: 'number',
					label: 'Delay time (ms)',
					id: 'time',
					range: true,
					default: 0.3,
					min: 0.3,
					max: 500,
					step: 0.1,
				},
			],
			callback: (action) => {
				const path = parseRefToPaths(action.options.target, parseOptions)?.delay?.timePath
				if (!path || !Number.isFinite(action.options.time)) return

				props.sendOsc(path, { type: 'f', value: delayToFloat(action.options.time) })
			},
		},
		'delay-time-delta': {
			name: 'Adjust channel delay time',
			description: 'Increase or decrease the delay in milliseconds, for example +1, -1, +10, or -10 ms.',
			options: [
				channelChoice,
				{
					type: 'number',
					label: 'Adjustment (ms)',
					id: 'delta',
					default: 1,
					min: -500,
					max: 500,
					step: 0.1,
				},
			],
			...actionSubscriptionWrapper(props, {
				getPath: (options) => parseRefToPaths(options.target, parseOptions)?.delay?.timePath ?? null,
				execute: (action, cachedData) => {
					const currentValue = cachedData?.[0]
					if (currentValue?.type !== 'f' || !Number.isFinite(currentValue.value)) return
					if (!Number.isFinite(action.options.delta)) return

					return { type: 'f', value: delayToFloat(floatToDelay(currentValue.value) + action.options.delta) }
				},
				shouldSubscribe: true,
				optionsToMonitorForSubscribe: ['target'],
			}),
		},
	}
}
