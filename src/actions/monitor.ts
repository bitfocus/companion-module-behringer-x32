import type { CompanionActionDefinitions } from '@companion-module/base'
import type { ActionsProps } from './main.js'
import { actionSubscriptionWrapper } from './util.js'
import { FadeDurationChoice, FaderLevelChoice } from '../choices.js'
import { floatToDB } from '../util.js'
import { Easing } from '../easings.js'

export type MonitorActionsSchema = {
	'monitor-level': {
		options: {
			fad: number
			fadeDuration: number
			fadeAlgorithm: Easing.algorithm
			fadeType: Easing.curve
		}
	}
}

export function getMonitorActions(props: ActionsProps): CompanionActionDefinitions<MonitorActionsSchema> {
	return {
		'monitor-level': {
			name: 'Set monitor level',
			options: [FaderLevelChoice, ...FadeDurationChoice],
			...actionSubscriptionWrapper(props, {
				getPath: () => `/config/solo/level`,
				execute: (action, cachedData, path) => {
					const currentVal = cachedData && cachedData[0]?.type === 'f' ? floatToDB(cachedData[0]?.value) : undefined
					props.transitions.runForDb(path, currentVal, action.options.fad, action.options)

					// Handled by the transition!
					return undefined
				},
				shouldSubscribe: true,
				optionsToMonitorForSubscribe: [],
			}),
		},
	}
}
