import type { CompanionActionDefinitions } from '@companion-module/base'
import type { ActionsProps } from './main.js'
import { actionSubscriptionWrapper, getResolveOnOffMute } from './util.js'
import { CHOICES_ON_OFF, convertChoices, GetTargetChoicesNew, MUTE_TOGGLE } from '../choices.js'
import { ParseRefOptions, parseRefToPaths } from '../paths.js'
import { padNumber } from '../util.js'

export type SoloActionsSchema = {
	solo: {
		options: {
			solo: string
			on: number
		}
	}
	'clear-solo': { options: Record<string, never> }
	'solo-mono': {
		options: {
			on: number
		}
	}
	solo_dim: {
		options: {
			on: number
		}
	}
	solo_dim_attenuation: {
		options: {
			dimAtt: number
		}
	}
}

export function getSoloActions(props: ActionsProps): CompanionActionDefinitions<SoloActionsSchema> {
	const soloChoicesParseOptions: ParseRefOptions = {
		allowStereo: true,
		allowMono: true,
		allowChannel: true,
		allowAuxIn: true,
		allowFx: true,
		allowBus: true,
		allowMatrix: true,
		allowDca: true,
	}
	const soloChoices = GetTargetChoicesNew(props.state, soloChoicesParseOptions)

	return {
		solo: {
			name: 'Solo On/Off',
			options: [
				{
					type: 'dropdown',
					label: 'Target',
					id: 'solo',
					...convertChoices(soloChoices),
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
					const soloRef = parseRefToPaths(options.solo, soloChoicesParseOptions)
					if (soloRef?.soloNumber === undefined) return null

					return `/-stat/solosw/${padNumber(soloRef.soloNumber, 2)}`
				},
				execute: (action, cachedData) => {
					return {
						type: 'i',
						value: getResolveOnOffMute(cachedData, true, action.options.on),
					}
				},
				shouldSubscribe: (options) => options.on === MUTE_TOGGLE,
				optionsToMonitorForSubscribe: ['solo', 'on'],
			}),
		},
		'clear-solo': {
			name: 'Clear Solo',
			options: [],
			callback: async (): Promise<void> => {
				props.sendOsc(`/-action/clearsolo`, {
					type: 'i',
					value: 1,
				})
			},
		},

		'solo-mono': {
			name: 'Solo Mono',
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
				getPath: () => `/config/solo/mono`,
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
		solo_dim: {
			name: 'Solo Dim',
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
				getPath: () => `/config/solo/dim`,
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
		solo_dim_attenuation: {
			name: 'Set Dim Attenuation',
			options: [
				{
					type: 'number',
					label: 'Dim Attenuation',
					id: 'dimAtt',
					range: true,
					default: -10,
					step: 1,
					min: -40,
					max: 0,
				},
			],
			...actionSubscriptionWrapper(props, {
				getPath: () => `/config/solo/dimatt`,
				execute: (action) => {
					return {
						type: 'f',
						value: action.options.dimAtt / 40 + 1,
					}
				},
				shouldSubscribe: false,
				optionsToMonitorForSubscribe: [],
			}),
		},
	}
}
