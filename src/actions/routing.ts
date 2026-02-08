import type { CompanionActionDefinitions } from '@companion-module/base'
import type { ActionsProps } from './main.js'
import { actionSubscriptionWrapper } from './util.js'
import {
	convertChoices,
	GetUserInSources,
	GetUserInTargets,
	GetUserOutSources,
	GetUserOutTargets,
	GetInputBlocks,
	GetInputBlockRoutes,
	GetAuxBlockRoutes,
	GetAesBlocks,
	GetAesCardRouteBlocks,
	GetLeftOutputBlockRoutes,
	GetRightOutputBlockRoutes,
} from '../choices.js'
import { UserRouteInPath, UserRouteOutPath } from '../paths.js'

export type RoutingActionsSchema = {
	'route-user-in': {
		options: {
			source: number
			channel: number
		}
	}
	'route-user-out': {
		options: {
			source: number
			channel: number
		}
	}
	'route-input-block-mode': {
		options: {
			mode: number
		}
	}
	'route-input-blocks': {
		options: {
			mode: string
			block: number
			routing: number
		}
	}
	'route-aux-blocks': {
		options: {
			mode: string
			routing: number
		}
	}
	'route-aes50-blocks': {
		options: {
			mode: string
			block: number
			routing: number
		}
	}
	'route-card-blocks': {
		options: {
			block: string
			routing: number
		}
	}
	'route-xlr-left-outputs': {
		options: {
			block: number
			routing: number
		}
	}
	'route-xlr-right-outputs': {
		options: {
			block: number
			routing: number
		}
	}
}

export function getRoutingActions(props: ActionsProps): CompanionActionDefinitions<RoutingActionsSchema> {
	return {
		'route-user-in': {
			name: 'Route User Input',
			description:
				"Use at own risk. (Maybe don't accidently press during a show?) Please make sure your settings are correct when setting up. Protip: You can use `Store channel for routing` with and then select `STORED CHNANNEL` to chain screens",
			options: [
				{
					type: 'dropdown',
					label: 'source',
					id: 'source',
					...convertChoices(GetUserInSources()),
					disableAutoExpression: true,
				},
				{
					type: 'dropdown',
					label: 'destination channel',
					id: 'channel',
					default: 1,
					choices: [
						{
							id: -1,
							label: 'STORED CHANNEL',
						},
						...GetUserInTargets(),
					],
					disableAutoExpression: true,
				},
			],
			callback: (action): void => {
				let channel = action.options.channel
				if (channel == -1) {
					channel = props.state.getStoredChannel()
					if (channel == undefined || channel > 31) return
				}
				props.sendOsc(UserRouteInPath(channel), {
					type: 'i',
					value: action.options.source,
				})
			},
		},
		'route-user-out': {
			name: 'Route User Output ',
			description:
				"Use at own risk. (Maybe don't accidently press during a show?) Please make sure your settings are correct when setting up. Protip: You can use `Store channel for routing` with and then select `STORED CHANNEL` to chain screens",
			options: [
				{
					type: 'dropdown',
					label: 'source',
					id: 'source',
					...convertChoices(GetUserOutSources()),
					disableAutoExpression: true,
				},
				{
					type: 'dropdown',
					label: 'destination output',
					id: 'channel',
					default: 1,
					choices: [
						{
							id: -1,
							label: 'STORED CHANNEL',
						},
						...GetUserOutTargets(),
					],
					disableAutoExpression: true,
				},
			],
			callback: (action): void => {
				let channel = action.options.channel
				if (channel == -1) {
					channel = props.state.getStoredChannel()
					if (channel == undefined) return
				}
				props.sendOsc(UserRouteOutPath(channel), {
					type: 'i',
					value: action.options.source,
				})
			},
		},

		'route-input-block-mode': {
			name: 'Route Input Block Mode',
			description:
				"Setup which routing block set to use. Use at own risk. (Maybe don't accidently press during a show?)",
			options: [
				{
					type: 'dropdown',
					label: 'Input mode',
					id: 'mode',
					default: 2,
					choices: [
						{ label: 'TOGGLE', id: 2 },
						{ label: 'RECORD', id: 0 },
						{ label: 'PLAY', id: 1 },
					],
					disableAutoExpression: true,
				},
			],
			...actionSubscriptionWrapper(props, {
				getPath: () => `/-config/routing/routswitch`,
				execute: (action, cachedData) => {
					const mode = action.options.mode
					if (mode === 2) {
						const currentVal = cachedData && cachedData[0]?.type === 'i' ? cachedData[0]?.value : 1
						return { type: 'i', value: currentVal === 0 ? 1 : 0 }
					} else {
						return { type: 'i', value: mode }
					}
				},
				shouldSubscribe: true,
				optionsToMonitorForSubscribe: [],
			}),
		},
		'route-input-blocks': {
			name: 'Route Input Blocks',
			description:
				"Setup input routing blocks. Use at own risk. (Maybe don't accidently press during a show?) Please make sure your settings are correct when setting up.",
			options: [
				{
					type: 'dropdown',
					label: 'Input mode',
					id: 'mode',
					...convertChoices([
						{ label: 'RECORD', id: 'IN' },
						{ label: 'PLAY', id: 'PLAY' },
					]),
					disableAutoExpression: true,
				},
				{
					type: 'dropdown',
					label: 'Input blocks',
					id: 'block',
					...convertChoices(GetInputBlocks()),
					disableAutoExpression: true,
				},
				{
					type: 'dropdown',
					label: 'Routing source block',
					id: 'routing',
					default: 0,
					choices: GetInputBlockRoutes(),
					disableAutoExpression: true,
				},
			],
			callback: (action): void => {
				const mode = action.options.mode
				const block = action.options.block
				const routing = action.options.routing
				const cmd = `/config/routing/${mode}/${block}`
				props.sendOsc(cmd, { type: 'i', value: routing })
			},
		},
		'route-aux-blocks': {
			name: 'Route Aux Blocks',
			description:
				"Setup aux input routing blocks. Use at own risk. (Maybe don't accidently press during a show?) Please make sure your settings are correct when setting up.",
			options: [
				{
					type: 'dropdown',
					label: 'Input mode',
					id: 'mode',
					...convertChoices([
						{ label: 'RECORD', id: 'IN' },
						{ label: 'PLAY', id: 'PLAY' },
					]),
					disableAutoExpression: true,
				},
				{
					type: 'dropdown',
					label: 'Routing source block',
					id: 'routing',
					...convertChoices(GetAuxBlockRoutes()),
					disableAutoExpression: true,
				},
			],
			callback: (action): void => {
				const mode = action.options.mode
				const routing = action.options.routing
				const cmd = `/config/routing/${mode}/AUX`
				props.sendOsc(cmd, { type: 'i', value: routing })
			},
		},
		'route-aes50-blocks': {
			name: 'Route AES50 Blocks',
			description:
				"Setup aes50 routing blocks. Use at own risk. (Maybe don't accidently press during a show?) Please make sure your settings are correct when setting up.",
			options: [
				{
					type: 'dropdown',
					label: 'AES50 A or B',
					id: 'mode',
					default: 'A',
					choices: [
						{ label: 'AES50 A', id: 'A' },
						{ label: 'AES50 B', id: 'B' },
					],
					disableAutoExpression: true,
				},
				{
					type: 'dropdown',
					label: 'Input blocks',
					id: 'block',
					...convertChoices(GetAesBlocks()),
					disableAutoExpression: true,
				},
				{
					type: 'dropdown',
					label: 'Routing source block',
					id: 'routing',
					...convertChoices(GetAesCardRouteBlocks()),
					disableAutoExpression: true,
				},
			],
			callback: (action): void => {
				const mode = action.options.mode
				const block = action.options.block
				const routing = action.options.routing
				const cmd = `/config/routing/AES50${mode}/${block}`
				props.sendOsc(cmd, { type: 'i', value: routing })
			},
		},
		'route-card-blocks': {
			name: 'Route Card Blocks',
			description:
				"Setup card routing blocks. Use at own risk. (Maybe don't accidently press during a show?) Please make sure your settings are correct when setting up.",
			options: [
				{
					type: 'dropdown',
					label: 'Input blocks',
					id: 'block',
					...convertChoices(GetInputBlocks()),
					disableAutoExpression: true,
				},
				{
					type: 'dropdown',
					label: 'Routing source block',
					id: 'routing',
					...convertChoices(GetAesCardRouteBlocks()),
					disableAutoExpression: true,
				},
			],
			callback: (action): void => {
				const block = action.options.block
				const routing = action.options.routing
				const cmd = `/config/routing/CARD/${block}`
				props.sendOsc(cmd, { type: 'i', value: routing })
			},
		},
		'route-xlr-left-outputs': {
			name: 'Route Left XLR Output Blocks',
			description:
				"Setup left (1-4 and 9-12) XLR Out routing blocks. (for 5-8 and 13-16 use `Route Right XLR Output Blocks`) Use at own risk. (Maybe don't accidently press during a show?) Please make sure your settings are correct when setting up.",
			options: [
				{
					type: 'dropdown',
					label: 'Input blocks',
					id: 'block',
					...convertChoices([
						{ id: '1-4', label: '1-4' },
						{ id: '9-12', label: '9-12' },
					]),
					disableAutoExpression: true,
				},
				{
					type: 'dropdown',
					label: 'Routing source block',
					id: 'routing',
					...convertChoices(GetLeftOutputBlockRoutes()),
					disableAutoExpression: true,
				},
			],
			callback: (action): void => {
				const block = action.options.block
				const routing = action.options.routing
				const cmd = `/config/routing/OUT/${block}`
				props.sendOsc(cmd, { type: 'i', value: routing })
			},
		},
		'route-xlr-right-outputs': {
			name: 'Route Right XLR Output Blocks',
			description:
				"Setup right (5-8 and 13-16) XLR Out routing blocks. (for 1-4 and 9-12 use `Route Left XLR Output Blocks`) Use at own risk. (Maybe don't accidently press during a show?) Please make sure your settings are correct when setting up.",
			options: [
				{
					type: 'dropdown',
					label: 'Input blocks',
					id: 'block',
					...convertChoices([
						{ id: '5-8', label: '5-8' },
						{ id: '13-16', label: '13-16' },
					]),
					disableAutoExpression: true,
				},
				{
					type: 'dropdown',
					label: 'Routing source block',
					id: 'routing',
					...convertChoices(GetRightOutputBlockRoutes()),
					disableAutoExpression: true,
				},
			],
			callback: (action): void => {
				const block = action.options.block
				const routing = action.options.routing
				const cmd = `/config/routing/OUT/${block}`
				props.sendOsc(cmd, { type: 'i', value: routing })
			},
		},
	}
}
