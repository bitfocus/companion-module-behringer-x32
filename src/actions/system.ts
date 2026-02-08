import type { CompanionActionDefinitions } from '@companion-module/base'
import type { ActionsProps } from './main.js'
import { convertChoices } from '../choices.js'
import { format as formatDate } from 'date-fns'

export type SystemActionsSchema = {
	sync_clock: {
		options: Record<string, never>
	}

	'lock-and-shutdown': {
		options: {
			newState: number
		}
	}
}

export function getSystemActions(props: ActionsProps): CompanionActionDefinitions<SystemActionsSchema> {
	return {
		sync_clock: {
			name: 'Sync console time',
			options: [],
			callback: async (): Promise<void> => {
				props.sendOsc(`/-action/setclock`, {
					type: 's',
					value: formatDate(new Date(), 'YYYYMMddHHmmss'),
				})
			},
		},

		'lock-and-shutdown': {
			name: 'Lock/Shutdown',
			description: 'Lock the X32 or shut it down',
			options: [
				{
					type: 'dropdown',
					label: 'Lock/Shutdown state',
					id: 'newState',
					...convertChoices([
						{ id: 0, label: 'Unlock' },
						{ id: 1, label: 'Lock' },
						{ id: 3, label: 'Toggle Lock' },
						{ id: 2, label: 'Shutdown' },
					]),
					disableAutoExpression: true,
				},
			],
			callback: (action): void => {
				const path = `/-stat/lock`
				const lockState = props.state.get(path)
				const lockValue = lockState && lockState[0].type === 'i' ? lockState[0].value : 0
				let newState = action.options.newState ? action.options.newState : 0

				if (lockValue == newState) {
					return
				}

				// set to unlocked first to avoid nondeterministic state on X32
				props.sendOsc(path, { type: 'i', value: 0 })
				if (newState == 3) {
					newState = lockValue > 0 ? 0 : 1
				}

				// wait 100ms if locking or shutting down to ensure not going from lock to shutdown or vice versa
				if (newState > 0) {
					setTimeout(() => {
						props.sendOsc(path, { type: 'i', value: newState })
					}, 100)
				}
			},
			subscribe: (): void => {
				props.ensureLoaded(`/-stat/lock`)
			},
		},
	}
}
