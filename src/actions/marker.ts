import type { CompanionActionDefinitions } from '@companion-module/base'
import type { ActionsProps } from './main.js'
import { actionSubscriptionWrapper } from './util.js'

export type MarkerActionsSchema = {
	add_marker: { options: Record<string, never> }
}

export function getMarkerActions(props: ActionsProps): CompanionActionDefinitions<MarkerActionsSchema> {
	return {
		add_marker: {
			name: 'Add marker in recording',
			options: [],
			...actionSubscriptionWrapper(props, {
				getPath: () => `/-action/addmarker`,
				execute: () => ({
					type: 'i',
					value: 1,
				}),
				shouldSubscribe: false,
				optionsToMonitorForSubscribe: [],
			}),
		},
	}
}
