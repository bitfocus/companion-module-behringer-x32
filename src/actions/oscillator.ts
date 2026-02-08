import type { CompanionActionDefinitions } from '@companion-module/base'
import type { ActionsProps } from './main.js'
import { actionSubscriptionWrapper, getResolveOnOffMute } from './util.js'
import {
	CHOICES_ON_OFF,
	convertChoices,
	GetOscillatorDestinations,
	MUTE_TOGGLE,
	OscillatorDestinationsParseOptions,
} from '../choices.js'
import { parseRefToPaths } from '../paths.js'

export type OscillatorActionsSchema = {
	'oscillator-enable': {
		options: {
			on: number
		}
	}
	'oscillator-destination': {
		options: {
			destination: string
		}
	}
}

export function getOscillatorActions(props: ActionsProps): CompanionActionDefinitions<OscillatorActionsSchema> {
	return {
		'oscillator-enable': {
			name: 'Oscillator Enable',
			options: [
				{
					type: 'dropdown',
					label: 'On / Off',
					id: 'on',
					...convertChoices(CHOICES_ON_OFF),
					disableAutoExpression: true,
				},
			],
			...actionSubscriptionWrapper(props, {
				getPath: () => `/-stat/osc/on`,
				execute: (action, cachedData) => {
					const onState = getResolveOnOffMute(cachedData, true, action.options.on)

					return {
						type: 'i',
						value: onState,
					}
				},
				shouldSubscribe: (options) => options.on === MUTE_TOGGLE,
				optionsToMonitorForSubscribe: ['on'],
			}),
		},
		'oscillator-destination': {
			name: 'Oscillator Destination',
			options: [
				{
					type: 'dropdown',
					label: 'destination',
					id: 'destination',
					...convertChoices(GetOscillatorDestinations(props.state)),
					allowInvalidValues: true,
				},
			],
			...actionSubscriptionWrapper(props, {
				getPath: () => `/config/osc/dest`,
				execute: (action) => {
					const destRef = parseRefToPaths(action.options.destination, OscillatorDestinationsParseOptions)
					if (!destRef?.oscillatorDestValue) return

					return {
						type: 'i',
						value: destRef.oscillatorDestValue,
					}
				},
				shouldSubscribe: false,
				optionsToMonitorForSubscribe: [],
			}),
		},
	}
}
