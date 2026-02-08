import type { CompanionActionDefinitions } from '@companion-module/base'
import type { ActionsProps } from './main.js'

export type UndoActionsSchema = {
	'do-undo': {
		options: Record<string, never>
	}
	'set-undo-checkpoint': {
		options: Record<string, never>
	}
}

export function getUndoActions(props: ActionsProps): CompanionActionDefinitions<UndoActionsSchema> {
	return {
		'do-undo': {
			name: 'Do Undo',
			description: 'If possible, undo to last checkpoint (NOTE: There is only one undo step in X32)',
			options: [],
			callback: (): void => {
				const undoTimeState = props.state.get(`/-undo/time`)
				const undoTime = undoTimeState && undoTimeState[0]?.type === 's' ? undoTimeState[0].value : ''

				if (!undoTime) {
					return
				}

				props.sendOsc('/-action/doundo', { type: 'i', value: 1 })
			},
		},
		'set-undo-checkpoint': {
			name: 'Set Undo Checkpoint',
			description:
				'Creates checkpoint to get back to upon issuing an undo command. The time will replace any value previously saved checkpoint',
			options: [],
			callback: (): void => {
				props.sendOsc('/-action/undopt', { type: 'i', value: 1 })
			},
		},
	}
}
