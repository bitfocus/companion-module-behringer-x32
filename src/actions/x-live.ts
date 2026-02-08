import type { CompanionActionDefinitions } from '@companion-module/base'
import type { ActionsProps } from './main.js'
import { actionSubscriptionWrapper } from './util.js'

export type XLiveActionsSchema = {
	record: {
		options: {
			state: number
		}
	}
}

export function getXLiveActions(props: ActionsProps): CompanionActionDefinitions<XLiveActionsSchema> {
	return {
		record: {
			name: 'Set X-live State',
			options: [
				{
					type: 'dropdown',
					label: 'State',
					id: 'state',
					choices: [
						{ id: 3, label: 'Record' },
						{ id: 2, label: 'Play' },
						{ id: 1, label: 'Pause' },
						{ id: 0, label: 'Stop' },
					],
					default: 3,
					disableAutoExpression: true,
				},
			],
			...actionSubscriptionWrapper(props, {
				getPath: () => `/-stat/urec/state`,
				execute: (action) => ({
					type: 'i',
					value: action.options.state,
				}),
				shouldSubscribe: false,
				optionsToMonitorForSubscribe: [],
			}),
		},
	}
}
