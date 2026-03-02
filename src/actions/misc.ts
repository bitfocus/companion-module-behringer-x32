import type { CompanionActionDefinitions } from '@companion-module/base'
import type { ActionsProps } from './main.js'
import { CHOICES_TAPE_FUNC, convertChoices, GetUserOutTargets } from '../choices.js'

export type MiscActionsSchema = {
	tape: {
		options: {
			tFunc: number
		}
	}

	store_channel: {
		options: {
			channel: number
		}
	}
}

export function getMiscActions(props: ActionsProps): CompanionActionDefinitions<MiscActionsSchema> {
	return {
		tape: {
			name: 'Tape Operation',
			options: [
				{
					type: 'dropdown',
					label: 'Function',
					id: 'tFunc',
					...convertChoices(CHOICES_TAPE_FUNC),
					disableAutoExpression: true,
				},
			],
			callback: async (action): Promise<void> => {
				props.sendOsc(`/-stat/tape/state`, {
					type: 'i',
					value: action.options.tFunc,
				})
			},
		},

		store_channel: {
			name: 'Store channel for routing',
			description:
				"Store channel for use with `User Input Routing`and `User Output Routing`. Use at own riskv. (Maybe don't accidently press during a show?) Please make sure your settings are correct when setting up.",
			options: [
				{
					type: 'dropdown',
					label: 'destination output',
					id: 'channel',
					default: 1,
					choices: GetUserOutTargets(true),
					disableAutoExpression: true,
				},
			],
			callback: (action): void => {
				props.state.setStoredChannel(action.options.channel)
			},
		},
	}
}
