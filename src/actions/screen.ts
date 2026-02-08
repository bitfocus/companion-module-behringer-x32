import type { CompanionActionDefinitions } from '@companion-module/base'
import type { ActionsProps } from './main.js'
import { actionSubscriptionWrapper, getResolveOnOffMute } from './util.js'
import { CHOICES_ON_OFF, convertChoices } from '../choices.js'

export type ScreenActionsSchema = {
	screens: {
		options: {
			screen: string
		}
	}
	'mute-group-screen': {
		options: {
			on: number
		}
	}
	'utility-screen': {
		options: {
			on: number
		}
	}
	'channel-page': {
		options: {
			page: string
		}
	}
	'meter-page': {
		options: {
			page: string
		}
	}
	'route-page': {
		options: {
			page: string
		}
	}
	'setup-page': {
		options: {
			page: string
		}
	}
	'library-page': {
		options: {
			page: string
		}
	}
	'effects-page': {
		options: {
			page: string
		}
	}
	'monitor-page': {
		options: {
			page: string
		}
	}
	'usb-page': {
		options: {
			page: string
		}
	}
	'scene-page': {
		options: {
			page: string
		}
	}
	'assign-page': {
		options: {
			page: string
		}
	}
	'next-previous-page': {
		options: {
			goto: string
		}
	}
}

export function getScreenActions(props: ActionsProps): CompanionActionDefinitions<ScreenActionsSchema> {
	return {
		screens: {
			name: 'Select active screen on console',
			options: [
				{
					type: 'dropdown',
					label: 'Screen',
					id: 'screen',
					...convertChoices([
						{
							id: '0',
							label: 'HOME',
						},
						{
							id: '1',
							label: 'METERS',
						},
						{
							id: '2',
							label: 'ROUTING',
						},
						{
							id: '3',
							label: 'SETUP',
						},
						{
							id: '4',
							label: 'LIBRARY',
						},
						{
							id: '5',
							label: 'EFFECTS',
						},
						{
							id: '6',
							label: 'MONITOR',
						},
						{
							id: '7',
							label: 'USB RECORDER',
						},
						{
							id: '8',
							label: 'SCENES',
						},
						{
							id: '9',
							label: 'ASSIGN',
						},
					]),
					disableAutoExpression: true,
				},
			],
			callback: async (action): Promise<void> => {
				props.sendOsc(`/-stat/screen/screen`, {
					type: 'i',
					value: Number(action.options.screen),
				})
			},
		},
		'mute-group-screen': {
			name: 'Mute Group Screen',
			options: [
				{
					type: 'dropdown',
					label: 'On / Off',
					id: 'on',
					...convertChoices(CHOICES_ON_OFF),
					disableAutoExpression: true,
				},
			],
			...actionSubscriptionWrapper(props, {
				getPath: () => `/-stat/screen/mutegrp`,
				execute: (action, cachedData) => {
					const onState = getResolveOnOffMute(cachedData, true, action.options.on)

					return {
						type: 'i',
						value: onState,
					}
				},
				shouldSubscribe: true,
				optionsToMonitorForSubscribe: [],
			}),
		},
		'utility-screen': {
			name: 'Utilities Screen',
			options: [
				{
					type: 'dropdown',
					label: 'On / Off',
					id: 'on',
					...convertChoices(CHOICES_ON_OFF),
					disableAutoExpression: true,
				},
			],
			...actionSubscriptionWrapper(props, {
				getPath: () => `/-stat/screen/utils`,
				execute: (action, cachedData) => {
					const onState = getResolveOnOffMute(cachedData, true, action.options.on)

					return {
						type: 'i',
						value: onState,
					}
				},
				shouldSubscribe: true,
				optionsToMonitorForSubscribe: [],
			}),
		},
		'channel-page': {
			name: 'Navigate to page on channel screen',
			options: [
				{
					type: 'dropdown',
					label: 'page',
					id: 'page',
					...convertChoices([
						{
							id: '0',
							label: 'HOME',
						},
						{
							id: '1',
							label: 'CONFIG',
						},
						{
							id: '2',
							label: 'GATE',
						},
						{
							id: '3',
							label: 'DYNAMICS',
						},
						{
							id: '4',
							label: 'EQ',
						},
						{
							id: '5',
							label: 'SENDS',
						},
						{
							id: '6',
							label: 'MAIN',
						},
					]),
					disableAutoExpression: true,
				},
			],
			callback: async (action): Promise<void> => {
				props.sendOsc(`/-stat/screen/CHAN/page`, {
					type: 'i',
					value: Number(action.options.page),
				})
				props.sendOsc('/-stat/screen/screen', { type: 'i', value: 0 })
			},
		},
		'meter-page': {
			name: 'Navigate to page on meters screen',
			options: [
				{
					type: 'dropdown',
					label: 'page',
					id: 'page',
					...convertChoices([
						{
							id: '0',
							label: 'CHANNEL',
						},
						{
							id: '1',
							label: 'MIX BUS',
						},
						{
							id: '2',
							label: 'AUX/FX',
						},
						{
							id: '3',
							label: 'IN/OUT',
						},
						{
							id: '4',
							label: 'RTA',
						},
						{
							id: '5',
							label: 'AUTOMIX',
						},
					]),
					disableAutoExpression: true,
				},
			],
			callback: async (action): Promise<void> => {
				props.sendOsc(`/-stat/screen/METER/page`, {
					type: 'i',
					value: Number(action.options.page),
				})
				props.sendOsc('/-stat/screen/screen', { type: 'i', value: 1 })
			},
		},
		'route-page': {
			name: 'Navigate to page on route screen',
			options: [
				{
					type: 'dropdown',
					label: 'page',
					id: 'page',
					...convertChoices([
						{
							id: '0',
							label: 'INPUT',
						},
						{
							id: '1',
							label: 'AES-A',
						},
						{
							id: '2',
							label: 'AES-B',
						},
						{
							id: '3',
							label: 'CARD',
						},
						{
							id: '4',
							label: 'XLR',
						},
						{
							id: '5',
							label: 'PATCH OUT',
						},
						{
							id: '6',
							label: 'PATCH AUX',
						},
						{
							id: '7',
							label: 'PATCH P16',
						},
						{
							id: '8',
							label: 'PATCH USER',
						},
					]),
					disableAutoExpression: true,
				},
			],
			callback: async (action): Promise<void> => {
				props.sendOsc(`/-stat/screen/ROUTE/page`, {
					type: 'i',
					value: Number(action.options.page),
				})
				props.sendOsc('/-stat/screen/screen', { type: 'i', value: 2 })
			},
		},
		'setup-page': {
			name: 'Navigate to page on setup screen',
			options: [
				{
					type: 'dropdown',
					label: 'page',
					id: 'page',
					...convertChoices([
						{
							id: '0',
							label: 'GLOBAL',
						},
						{
							id: '1',
							label: 'CONFIG',
						},
						{
							id: '2',
							label: 'REMOTE',
						},
						{
							id: '3',
							label: 'NETWORK',
						},
						{
							id: '4',
							label: 'SCRIBBLE STRIPS',
						},
						{
							id: '5',
							label: 'PREAMPS',
						},
						{
							id: '6',
							label: 'CARD',
						},
					]),
					disableAutoExpression: true,
				},
			],
			callback: async (action): Promise<void> => {
				props.sendOsc(`/-stat/screen/SETUP/page`, {
					type: 'i',
					value: Number(action.options.page),
				})
				props.sendOsc('/-stat/screen/screen', { type: 'i', value: 3 })
			},
		},
		'library-page': {
			name: 'Navigate to page on library screen',
			options: [
				{
					type: 'dropdown',
					label: 'page',
					id: 'page',
					...convertChoices([
						{
							id: '0',
							label: 'CHANNEL',
						},
						{
							id: '1',
							label: 'EFFECTS',
						},
						{
							id: '2',
							label: 'ROUTING',
						},
						{
							id: '3',
							label: 'MONITOR',
						},
					]),
					disableAutoExpression: true,
				},
			],
			callback: async (action): Promise<void> => {
				props.sendOsc(`/-stat/screen/LIB/page`, {
					type: 'i',
					value: Number(action.options.page),
				})
				props.sendOsc('/-stat/screen/screen', { type: 'i', value: 4 })
			},
		},
		'effects-page': {
			name: 'Navigate to page on effects screen',
			options: [
				{
					type: 'dropdown',
					label: 'page',
					id: 'page',
					...convertChoices([
						{
							id: '0',
							label: 'HOME',
						},
						{
							id: '1',
							label: 'FX1',
						},
						{
							id: '2',
							label: 'FX2',
						},
						{
							id: '3',
							label: 'FX3',
						},
						{
							id: '4',
							label: 'FX4',
						},
						{
							id: '5',
							label: 'FX5',
						},
						{
							id: '6',
							label: 'FX6',
						},
						{
							id: '7',
							label: 'FX7',
						},
						{
							id: '8',
							label: 'FX8',
						},
					]),
					disableAutoExpression: true,
				},
			],
			callback: async (action): Promise<void> => {
				props.sendOsc(`/-stat/screen/FX/page`, {
					type: 'i',
					value: Number(action.options.page),
				})
				props.sendOsc('/-stat/screen/screen', { type: 'i', value: 5 })
			},
		},
		'monitor-page': {
			name: 'Navigate to page on monitor screen',
			options: [
				{
					type: 'dropdown',
					label: 'page',
					id: 'page',
					...convertChoices([
						{
							id: '0',
							label: 'MONITOR',
						},
						{
							id: '1',
							label: 'TALK A',
						},
						{
							id: '2',
							label: 'TALK B',
						},
						{
							id: '3',
							label: 'OSCILLATOR',
						},
					]),
					disableAutoExpression: true,
				},
			],
			callback: async (action): Promise<void> => {
				props.sendOsc(`/-stat/screen/MON/page`, {
					type: 'i',
					value: Number(action.options.page),
				})
				props.sendOsc('/-stat/screen/screen', { type: 'i', value: 6 })
			},
		},
		'usb-page': {
			name: 'Navigate to page on USB screen',
			options: [
				{
					type: 'dropdown',
					label: 'page',
					id: 'page',
					...convertChoices([
						{
							id: '0',
							label: 'HOME',
						},
						{
							id: '1',
							label: 'CONFIG',
						},
					]),
					disableAutoExpression: true,
				},
			],
			callback: async (action): Promise<void> => {
				props.sendOsc(`/-stat/screen/USB/page`, {
					type: 'i',
					value: Number(action.options.page),
				})
				props.sendOsc('/-stat/screen/screen', { type: 'i', value: 7 })
			},
		},
		'scene-page': {
			name: 'Navigate to page on scene screen',
			options: [
				{
					type: 'dropdown',
					label: 'page',
					id: 'page',
					...convertChoices([
						{
							id: '0',
							label: 'CUES',
						},
						{
							id: '1',
							label: 'SCENES',
						},
						{
							id: '2',
							label: 'SNIPPETS',
						},
						{
							id: '3',
							label: 'PARAMETER SAFE',
						},
						{
							id: '4',
							label: 'CHANNEL SAFE',
						},
						{
							id: '5',
							label: 'MIDI',
						},
					]),
					disableAutoExpression: true,
				},
			],
			callback: async (action): Promise<void> => {
				props.sendOsc(`/-stat/screen/SCENE/page`, {
					type: 'i',
					value: Number(action.options.page),
				})
				props.sendOsc('/-stat/screen/screen', { type: 'i', value: 8 })
			},
		},
		'assign-page': {
			name: 'Navigate to page on assign screen',
			options: [
				{
					type: 'dropdown',
					label: 'page',
					id: 'page',
					...convertChoices([
						{
							id: '0',
							label: 'Home',
						},
						{
							id: '1',
							label: 'Set A',
						},
						{
							id: '2',
							label: 'Set B',
						},
						{
							id: '3',
							label: 'Set C',
						},
					]),
					disableAutoExpression: true,
				},
			],
			callback: async (action): Promise<void> => {
				const cmd = `/-stat/screen/ASSIGN/page`
				props.sendOsc(cmd, {
					type: 'i',
					value: Number(action.options.page),
				})
				props.sendOsc('/-stat/screen/screen', { type: 'i', value: 9 })
			},
		},
		'next-previous-page': {
			name: 'Navigate to the next or previous page',
			options: [
				{
					type: 'dropdown',
					label: 'Next/Prev',
					id: 'goto',
					...convertChoices([
						{
							id: '1',
							label: 'Next',
						},
						{
							id: '-1',
							label: 'Prev',
						},
					]),
					disableAutoExpression: true,
				},
			],
			callback: async (action): Promise<void> => {
				const currentScreen = props.state.get('/-stat/screen/screen')
				const currentScreenIndex = currentScreen && currentScreen[0]?.type === 'i' ? Number(currentScreen[0]?.value) : 0
				let screen = undefined
				let pages = 0
				switch (currentScreenIndex) {
					case 1:
						screen = 'METER'
						pages = 6
						break
					case 2:
						screen = 'ROUTE'
						pages = 9
						break
					case 3:
						screen = 'SETUP'
						pages = 7
						break
					case 4:
						screen = 'LIB'
						pages = 4
						break
					case 5:
						screen = 'FX'
						pages = 9
						break
					case 6:
						screen = 'MON'
						pages = 4
						break
					case 7:
						screen = 'USB'
						pages = 2
						break
					case 8:
						screen = 'SCENE'
						pages = 6
						break
					case 9:
						screen = 'ASSIGN'
						pages = 5
						break
					case 0:
					default:
						screen = 'CHAN'
						pages = 7
						break
				}

				const cmd = `/-stat/screen/${screen}/page`
				const currentPage = props.state.get(cmd)
				const currentPageIndex = currentPage && currentPage[0]?.type === 'i' ? Number(currentPage[0]?.value) : 0
				let gotoPageIndex = currentPageIndex + Number(action.options.goto)
				if (gotoPageIndex < 0) gotoPageIndex = 0
				else if (gotoPageIndex >= pages) gotoPageIndex = pages - 1

				props.sendOsc(cmd, {
					type: 'i',
					value: gotoPageIndex,
				})
			},
			subscribe: (): void => {
				props.ensureLoaded('/-stat/screen/screen')
				props.ensureLoaded('/-stat/screen/CHAN/page')
				props.ensureLoaded('/-stat/screen/METER/page')
				props.ensureLoaded('/-stat/screen/SETUP/page')
				props.ensureLoaded('/-stat/screen/LIB/page')
				props.ensureLoaded('/-stat/screen/FX/page')
				props.ensureLoaded('/-stat/screen/MON/page')
				props.ensureLoaded('/-stat/screen/USB/page')
				props.ensureLoaded('/-stat/screen/SCENE/page')
				props.ensureLoaded('/-stat/screen/ASSIGN/page')
			},
		},
	}
}
