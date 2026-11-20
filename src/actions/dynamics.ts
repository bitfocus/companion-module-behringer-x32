import type { CompanionActionDefinitions } from '@companion-module/base'
import type { ActionsProps } from './main.js'
import { actionSubscriptionWrapper, getResolveOnOffMute } from './util.js'
import { CHOICES_ON_OFF, convertChoices, GetTargetChoices, MUTE_TOGGLE } from '../choices.js'
import { parseRefToPaths } from '../paths.js'

export type DynamicsActionsSchema = {
	'dyn-on': {
		options: {
			target: string
			on: number
		}
	}
}

export function getDynamicsActions(props: ActionsProps): CompanionActionDefinitions<DynamicsActionsSchema> {
	const parseOptions = { allowChannel: true }
	const channels = GetTargetChoices(props.state, parseOptions)

	return {
		'dyn-on': {
			name: 'Channel dynamics (compressor) on/off',
			options: [
				{
					type: 'dropdown',
					label: 'Channel',
					id: 'target',
					...convertChoices(channels),
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
				getPath: (options) => parseRefToPaths(options.target, parseOptions)?.dynamics?.onPath ?? null,
				execute: (action, cachedData) => ({
					type: 'i',
					value: getResolveOnOffMute(cachedData, true, action.options.on),
				}),
				shouldSubscribe: (options) => options.on === MUTE_TOGGLE,
				optionsToMonitorForSubscribe: ['target', 'on'],
			}),
		},
	}
}
