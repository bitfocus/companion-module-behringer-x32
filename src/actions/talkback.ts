import type { CompanionActionDefinitions } from '@companion-module/base'
import type { ActionsProps } from './main.js'
import { actionSubscriptionWrapper, getResolveOnOffMute } from './util.js'
import {
	CHOICES_ON_OFF,
	convertChoices,
	GetTalkbackDestinations,
	MUTE_TOGGLE,
	TalkbackDestinationsParseOptions,
} from '../choices.js'
import { parseRefToPaths } from '../paths.js'

export type TalkbackActionsSchema = {
	talkback_talk: {
		options: {
			channel: 'A' | 'B'
			on: number
		}
	}
	talkback_config: {
		options: {
			function: number
			dest: string
		}
	}
	talkback_config_single_src: {
		options: {
			function: number
			dest: string
			on: number
		}
	}
	talkback_config_store: {
		options: {
			function: number
		}
	}
	talkback_restore: {
		options: {
			function: number
		}
	}
}

export function getTalkbackActions(props: ActionsProps): CompanionActionDefinitions<TalkbackActionsSchema> {
	return {
		talkback_talk: {
			name: 'Talkback Talk',
			options: [
				{
					type: 'dropdown',
					label: 'Function',
					id: 'channel',
					...convertChoices([
						{
							id: 'A',
							label: 'A',
						},
						{
							id: 'B',
							label: 'B',
						},
					]),
					disableAutoExpression: true,
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
				getPath: (options) => `/-stat/talk/${options.channel}`,
				execute: (action, cachedData) => {
					const onState = getResolveOnOffMute(cachedData, true, action.options.on)

					return {
						type: 'i',
						value: onState,
					}
				},
				shouldSubscribe: (options) => options.on === MUTE_TOGGLE,
				optionsToMonitorForSubscribe: ['channel', 'on'],
			}),
		},
		talkback_config: {
			name: 'Talkback Config',
			options: [
				{
					type: 'dropdown',
					label: 'Function',
					id: 'function',
					...convertChoices([
						{
							id: 'A',
							label: 'A',
						},
						{
							id: 'B',
							label: 'B',
						},
					]),
					disableAutoExpression: true,
				},
				{
					type: 'multidropdown',
					label: 'Destinations',
					id: 'dest',
					default: [],
					choices: GetTalkbackDestinations(props.state),
					allowInvalidValues: true,
				},
			],
			...actionSubscriptionWrapper(props, {
				getPath: (options) => `/config/talk/${options.function}/destmap`,
				execute: (action) => {
					const talkbackDests = Array.isArray(action.options.dest) ? action.options.dest : [action.options.dest]
					const talkbackDestsRefs = talkbackDests
						.map((d) => parseRefToPaths(d, TalkbackDestinationsParseOptions))
						.filter((v) => !!v)

					let bitmap = 0
					for (const destRef of talkbackDestsRefs) {
						if (destRef?.talkbackDestMask !== undefined) {
							bitmap = bitmap | destRef.talkbackDestMask
						}
					}

					return {
						type: 'i',
						value: bitmap,
					}
				},
				shouldSubscribe: false,
				optionsToMonitorForSubscribe: [],
			}),
		},
		talkback_config_single_src: {
			name: 'Talkback Config - Single Source',
			description: 'Modify the config of a single source without changeing the other sources',
			options: [
				{
					type: 'dropdown',
					label: 'Function',
					id: 'function',
					...convertChoices([
						{
							id: 'A',
							label: 'A',
						},
						{
							id: 'B',
							label: 'B',
						},
					]),
					disableAutoExpression: true,
				},
				{
					type: 'dropdown',
					label: 'Destinations',
					id: 'dest',
					...convertChoices(GetTalkbackDestinations(props.state)),
					allowInvalidValues: true,
				},
				{
					type: 'dropdown',
					label: 'Active',
					id: 'on',
					...convertChoices(CHOICES_ON_OFF),
					disableAutoExpression: true,
				},
			],
			...actionSubscriptionWrapper(props, {
				getPath: (options) => `/config/talk/${options.function}/destmap`,
				execute: (action, cachedData) => {
					const destRef = parseRefToPaths(action.options.dest, TalkbackDestinationsParseOptions)
					if (!destRef?.talkbackDestMask) return

					// TODO - can this avoid the extra lookup?

					const currentVal = cachedData && cachedData[0]?.type === 'i' ? cachedData[0]?.value : 0
					let bitmap: number
					switch (action.options.on) {
						case 0:
							bitmap = currentVal & ~destRef.talkbackDestMask
							break
						case 1:
							bitmap = currentVal | destRef.talkbackDestMask
							break
						default:
							bitmap = currentVal ^ destRef.talkbackDestMask
					}

					return {
						type: 'i',
						value: bitmap,
					}
				},
				shouldSubscribe: true,
				optionsToMonitorForSubscribe: ['function'],
			}),
		},
		talkback_config_store: {
			name: 'Talkback Store Config',
			options: [
				{
					type: 'dropdown',
					label: 'Function',
					id: 'function',
					...convertChoices([
						{
							id: 'A',
							label: 'A',
						},
						{
							id: 'B',
							label: 'B',
						},
					]),
					disableAutoExpression: true,
				},
			],
			...actionSubscriptionWrapper(props, {
				getPath: (options) => `/config/talk/${options.function}/destmap`,
				execute: (action, cachedData, path) => {
					const currentVal = cachedData && cachedData[0]?.type === 'i' ? cachedData[0]?.value : undefined
					if (currentVal !== undefined) {
						props.state.setPressValue(`${action.controlId}-${path}`, currentVal)
					}

					return undefined
				},
				shouldSubscribe: true,
				optionsToMonitorForSubscribe: ['function'],
			}),
		},
		talkback_restore: {
			name: 'Talkback Restore Config',
			options: [
				{
					type: 'dropdown',
					label: 'Function',
					id: 'function',
					...convertChoices([
						{
							id: 'A',
							label: 'A',
						},
						{
							id: 'B',
							label: 'B',
						},
					]),
					disableAutoExpression: true,
				},
			],
			...actionSubscriptionWrapper(props, {
				getPath: (options) => `/config/talk/${options.function}/destmap`,
				execute: (action, _cachedData, path) => {
					const storedVal = props.state.popPressValue(`${action.controlId}-${path}`)
					if (storedVal !== undefined) {
						return {
							type: 'i',
							value: storedVal,
						}
					}

					// Nothing to send
					return undefined
				},
				shouldSubscribe: true,
				optionsToMonitorForSubscribe: ['function'],
			}),
		},
	}
}
