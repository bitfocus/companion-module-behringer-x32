import type { CompanionActionDefinitions } from '@companion-module/base'
import type { ActionsProps } from './main.js'
import { actionSubscriptionWrapper } from './util.js'

export type GoCommandActionsSchema = {
	go_cue: {
		options: {
			cue: number
		}
	}
	go_scene: {
		options: {
			scene: number
		}
	}
	go_snip: {
		options: {
			snip: number
		}
	}
	goCommmand: {
		options: Record<string, never>
	}
	nextCommmand: {
		options: Record<string, never>
	}
	prevCommmand: {
		options: Record<string, never>
	}
}

export function getGoCommandActions(props: ActionsProps): CompanionActionDefinitions<GoCommandActionsSchema> {
	const getShowControlName = (index: number): string => {
		switch (index) {
			case 1:
				return 'scene'
			case 2:
				return 'snippet'
			default:
				return 'cue'
		}
	}

	return {
		go_cue: {
			name: 'Load Console Cue',
			options: [
				{
					type: 'number',
					label: 'Cue Nr 0-99',
					id: 'cue',
					default: 0,
					min: 0,
					max: 99,
				},
			],
			callback: async (action): Promise<void> => {
				props.sendOsc(`/-action/gocue`, {
					type: 'i',
					value: action.options.cue,
				})
			},
		},
		go_scene: {
			name: 'Load Console Scene',
			options: [
				{
					type: 'number',
					label: 'scene Nr 0-99',
					id: 'scene',
					default: 0,
					min: 0,
					max: 99,
				},
			],
			callback: async (action): Promise<void> => {
				props.sendOsc(`/-action/goscene`, {
					type: 'i',
					value: action.options.scene,
				})
			},
		},
		go_snip: {
			name: 'Load Console snippet',
			options: [
				{
					type: 'number',
					label: 'Snippet Nr 0-99',
					id: 'snip',
					default: 0,
					min: 0,
					max: 99,
				},
			],
			callback: async (action): Promise<void> => {
				props.sendOsc(`/-action/gosnippet`, {
					type: 'i',
					value: action.options.snip,
				})
			},
		},

		goCommmand: {
			name: 'Go Command',
			description: 'Load the highlighted cue/scene/snipped (based on show control)',
			options: [],
			callback: (): void => {
				const showControlState = props.state.get('/-prefs/show_control')
				const showControlValue = showControlState && showControlState[0].type === 'i' ? showControlState[0].value : 0
				const showControl = getShowControlName(showControlValue)

				const highlightedState = props.state.get('/-show/prepos/current')
				const highlightedValue = highlightedState && highlightedState[0].type === 'i' ? highlightedState[0].value : 0

				props.sendOsc(`/-action/go${showControl}`, { type: 'i', value: highlightedValue })
			},
			subscribe: (): void => {
				props.ensureLoaded('/-prefs/show_control')
				props.ensureLoaded('/-show/prepos/current')
			},
		},
		nextCommmand: {
			name: 'Next Command',
			description:
				'Move the highlighted marker to the cue/scene/snipped (based on show control). Warning pressing this too many times could result in going to a cue/scene/snippet without data.',
			options: [],
			...actionSubscriptionWrapper(props, {
				getPath: () => '/-show/prepos/current',
				execute: (_action, cachedData) => {
					const highlightedValue = cachedData && cachedData[0].type === 'i' ? cachedData[0].value : 0
					if (highlightedValue <= 0) {
						return
					}

					return { type: 'i', value: highlightedValue + 1 }
				},
				shouldSubscribe: true,
				optionsToMonitorForSubscribe: [],
			}),
		},
		prevCommmand: {
			name: 'Previous Command',
			description: 'Move the highlighted marker to the cue/scene/snipped (based on show control).',
			options: [],
			...actionSubscriptionWrapper(props, {
				getPath: () => '/-show/prepos/current',
				execute: (_action, cachedData) => {
					const highlightedValue = cachedData && cachedData[0].type === 'i' ? cachedData[0].value : 0
					if (highlightedValue <= 0) {
						return
					}

					return { type: 'i', value: highlightedValue - 1 }
				},
				shouldSubscribe: true,
				optionsToMonitorForSubscribe: [],
			}),
		},
	}
}
