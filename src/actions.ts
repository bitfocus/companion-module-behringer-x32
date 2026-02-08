import { X32State } from './state.js'
import { trimToFloat, headampGainToFloat, floatToDB, InstanceBaseExt } from './util.js'
import {
	CHOICES_TAPE_FUNC,
	MUTE_TOGGLE,
	convertChoices,
	CHOICES_ON_OFF,
	FaderLevelChoice,
	HeadampGainChoice,
	GetHeadampChoices,
	FadeDurationChoice,
	GetLevelsChoiceConfigs,
	GetUserOutTargets,
	GetInsertDestinationChoices,
	GetTargetChoicesNew,
} from './choices.js'
import { ParseRefOptions, parseHeadampRef, parseRefToPaths } from './paths.js'
import { X32Transitions } from './transitions.js'
import { format as formatDate } from 'date-fns'
import { CompanionActionEvent, CompanionActionDefinitions, OSCSomeArguments } from '@companion-module/base'
import { getOptNumber, getResolveOnOffMute as getResolveOnOffMuteNew } from './actions/util.js'
import { GetActionsList as GetActionsListNew, ActionsSchema as ActionsSchemaNew } from './actions/main.js'

export type ActionsSchema = ActionsSchemaNew & {
	input_trim: {
		options: {
			input: string
			trim: number
		}
	}
	headamp_gain: {
		options: {
			headamp: string
			gain: number
		}
	}

	select: {
		options: {
			select: string
		}
	}

	tape: {
		options: {
			tFunc: number
		}
	}

	'monitor-level': {
		options: {
			fad: number
			fadeDuration: number
			fadeAlgorithm: string
			fadeType: string
		}
	}
	sync_clock: { options: Record<string, never> }
	'channel-bank-full': {
		options: {
			bank: number
		}
	}
	'group-bank-full': {
		options: {
			bank: number
		}
	}
	'channel-bank-compact': {
		options: {
			bank: number
		}
	}
	'group-bank-compact': {
		options: {
			bank: number
		}
	}
	'sends-on-fader': {
		options: {
			on: number
		}
	}
	'bus-send-bank': {
		options: {
			bank: number
		}
	}
	'user-bank': {
		options: {
			bank: number
		}
	}
	screens: {
		options: {
			screen: number
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
			page: number
		}
	}
	'meter-page': {
		options: {
			page: number
		}
	}
	'route-page': {
		options: {
			page: number
		}
	}
	'setup-page': {
		options: {
			page: number
		}
	}
	'library-page': {
		options: {
			page: number
		}
	}
	'effects-page': {
		options: {
			page: number
		}
	}
	'monitor-page': {
		options: {
			page: number
		}
	}
	'usb-page': {
		options: {
			page: number
		}
	}
	'scene-page': {
		options: {
			page: number
		}
	}
	'assign-page': {
		options: {
			page: number
		}
	}
	'next-previous-page': {
		options: {
			goto: number
		}
	}

	store_channel: {
		options: {
			channel: number
		}
	}

	'lock-and-shutdown': {
		options: {
			newState: number
		}
	}
	'save-scene': {
		options: {
			sceneIndex: number
			sceneName: string
			sceneNote: string
		}
	}
	'select-active-sdcard': {
		options: {
			card: number
		}
	}
	'recorded-tracks': {
		options: {
			tracks: number
		}
	}
	'select-playback-device': {
		options: {
			device: number
		}
	}
	'format-sdcard': {
		options: {
			card: number
		}
	}
	'x-live-routing': {
		options: {
			route: number
		}
	}
	'x-live-clear-alert': {
		options: {
			alert: number
		}
	}
	'x-live-position': {
		options: {
			position: number
		}
	}

	'insert-on': {
		options: {
			src: string
			on: number
		}
	}
	'insert-pos': {
		options: {
			src: string
			pos: number
		}
	}
	'insert-select': {
		options: {
			src: string
			dest: number
		}
	}

	'do-undo': { options: Record<string, never> }
	'set-undo-checkpoint': { options: Record<string, never> }
}

export function GetActionsList(
	self: InstanceBaseExt,
	transitions: X32Transitions,
	state: X32State,
	ensureLoaded: (path: string | undefined) => void,
): CompanionActionDefinitions<ActionsSchema> {
	const levelsChoices = GetLevelsChoiceConfigs(state)
	const selectChoicesParseOptions: ParseRefOptions = {
		allowStereo: true,
		allowMono: true,
		allowChannel: true,
		allowAuxIn: true,
		allowFx: true,
		allowBus: true,
		allowMatrix: true,
	}
	const selectChoices = GetTargetChoicesNew(state, selectChoicesParseOptions)

	const insertSourceParseOptions: ParseRefOptions = {
		allowStereo: true,
		allowMono: true,
		allowChannel: true,
		allowBus: true,
		allowMatrix: true,
	}
	const insertSourceChoices = GetTargetChoicesNew(state, insertSourceParseOptions)

	const sendOsc = (cmd: string, args: OSCSomeArguments): void => {
		// HACK: We send commands on a different port than we run /xremote on, so that we get change events for what we send.
		// Otherwise we can have no confirmation that a command was accepted
		// console.log(`osc command: ${cmd} ${JSON.stringify(args)}`)

		if (self.config.host) {
			self.oscSend(self.config.host, 10023, cmd, args)
		}
	}

	const getResolveOnOffMute = (
		action: CompanionActionEvent,
		cmd: string,
		cmdIsCalledOn: boolean,
		prop: 'mute' | 'on' = 'mute',
	): number => getResolveOnOffMuteNew(state.get(cmd), cmdIsCalledOn, getOptNumber(action, prop))

	// Easy dirty fix
	const convertAnyToNumber = (state: any): number => {
		return parseInt(state)
	}
	// const getOptBool = (key: string): boolean => {
	//   return !!opt[key]
	// }

	const actions: CompanionActionDefinitions<ActionsSchema> = {
		...GetActionsListNew({
			state,
			transitions,
			ensureLoaded,
			sendOsc,
		}),

		input_trim: {
			name: 'Set input trim',
			options: [
				{
					type: 'dropdown',
					label: 'Input',
					id: 'input',
					...convertChoices(levelsChoices.allSources),
					allowInvalidValues: true,
				},
				{
					type: 'number',
					label: 'Trim',
					id: 'trim',
					range: true,
					default: 0,
					step: 0.1,
					min: -18,
					max: 18,
				},
			],
			callback: async (action): Promise<void> => {
				const inputRef = parseRefToPaths(action.options.input, levelsChoices.allSourcesParseOptions)
				if (!inputRef?.trim) return

				sendOsc(inputRef.trim.path, {
					type: 'f',
					value: trimToFloat(getOptNumber(action, 'trim')),
				})
			},
		},
		headamp_gain: {
			name: 'Set Headamp gain',
			options: [
				{
					type: 'dropdown',
					label: 'Headamp',
					id: 'headamp',
					...convertChoices(GetHeadampChoices()),
					expressionDescription: `eg 'local1', 'aes-a1', 'aes-b1'`,
				},
				HeadampGainChoice,
			],
			callback: async (action): Promise<void> => {
				const refPath = parseHeadampRef(action.options.headamp)
				if (!refPath) return

				sendOsc(`${refPath}/gain`, {
					type: 'f',
					value: headampGainToFloat(getOptNumber(action, 'gain')),
				})
			},
		},

		select: {
			name: 'Select',
			options: [
				{
					type: 'dropdown',
					label: 'Target',
					id: 'select',
					...convertChoices(selectChoices),
					allowInvalidValues: true,
				},
			],
			callback: async (action): Promise<void> => {
				const selectRef = parseRefToPaths(action.options.select, selectChoicesParseOptions)
				if (selectRef?.selectNumber === undefined) return

				sendOsc(`/-stat/selidx`, {
					type: 'i',
					value: selectRef.selectNumber,
				})
			},
		},

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
				sendOsc(`/-stat/tape/state`, {
					type: 'i',
					value: getOptNumber(action, 'tFunc'),
				})
			},
		},

		'monitor-level': {
			name: 'Set monitor level',
			options: [FaderLevelChoice, ...FadeDurationChoice],
			callback: async (action): Promise<void> => {
				const cmd = `/config/solo/level`
				const currentState = state.get(cmd)
				const currentVal = currentState && currentState[0]?.type === 'f' ? floatToDB(currentState[0]?.value) : undefined
				transitions.runForDb(cmd, currentVal, getOptNumber(action, 'fad'), getOptNumber(action, 'fadeDuration', 0))
			},
			subscribe: (): void => {
				ensureLoaded(`/config/solo/level`)
			},
		},
		sync_clock: {
			name: 'Sync console time',
			options: [],
			callback: async (): Promise<void> => {
				sendOsc(`/-action/setclock`, {
					type: 's',
					value: formatDate(new Date(), 'YYYYMMddHHmmss'),
				})
			},
		},
		'channel-bank-full': {
			name: 'Select active channel bank (X32/M32)',
			description:
				'Select a channel bank for the left hand side of your console. Please note this action is for the X32 and M32. For X32 Compact/X32 Producer/M32R please use the X32 Compact/X32 Producer/M32R action',
			options: [
				{
					type: 'dropdown',
					label: 'Bank',
					id: 'bank',
					...convertChoices([
						{
							id: '0',
							label: 'CH 1 - 16',
						},
						{
							id: '1',
							label: 'CH 17 - 32',
						},
						{
							id: '2',
							label: 'AUX IN / USB / FX RTN',
						},
						{
							id: '3',
							label: 'BUS MASTERS',
						},
					]),
					disableAutoExpression: true,
				},
			],
			callback: async (action): Promise<void> => {
				sendOsc(`/-stat/chfaderbank`, {
					type: 'i',
					value: getOptNumber(action, 'bank'),
				})
			},
		},
		'group-bank-full': {
			name: 'Select active group bank (X32/M32)',
			description:
				'Select a group bank for the right hand side of your console. Please note this action is for the X32 and M32. For X32 Compact/X32 Producer/M32R please use the X32 Compact/X32 Producer/M32R action',
			options: [
				{
					type: 'dropdown',
					label: 'Bank',
					id: 'bank',
					...convertChoices([
						{
							id: '0',
							label: 'GROUP DCA 1 - 8',
						},
						{
							id: '1',
							label: 'BUS 1 - 8',
						},
						{
							id: '2',
							label: 'BUS 9 - 16',
						},
						{
							id: '3',
							label: 'MATRIX 1 - 6 / MAIN C',
						},
					]),
					disableAutoExpression: true,
				},
			],
			callback: async (action): Promise<void> => {
				sendOsc(`/-stat/grpfaderbank`, {
					type: 'i',
					value: getOptNumber(action, 'bank'),
				})
			},
		},
		'channel-bank-compact': {
			name: 'Select active channel bank (X32 Compact/X32 Producer/M32R)',
			description:
				'Select a channel bank for the left hand side of your console. Please note this action is for X32 Compact/X32 Producer/M32R. For X32 or M32 please use the X32/M32 action',
			options: [
				{
					type: 'dropdown',
					label: 'Bank',
					id: 'bank',
					...convertChoices([
						{
							id: '0',
							label: 'CH 1 - 8',
						},
						{
							id: '1',
							label: 'CH 9 - 16',
						},
						{
							id: '2',
							label: 'CH 17 - 24',
						},
						{
							id: '3',
							label: 'CH 25 - 32',
						},
						{
							id: '4',
							label: 'AUX IN / USB',
						},
						{
							id: '5',
							label: 'FX RTN',
						},
						{
							id: '6',
							label: 'BUS 1-8',
						},
						{
							id: '7',
							label: 'BUS 1-8',
						},
					]),
					disableAutoExpression: true,
				},
			],
			callback: async (action): Promise<void> => {
				sendOsc(`/-stat/chfaderbank`, {
					type: 'i',
					value: getOptNumber(action, 'bank'),
				})
			},
		},
		'group-bank-compact': {
			name: 'Select active group bank (X32 Compact/X32 Producer/M32R)',
			description:
				'Select a group bank for the right hand side of your console. Please note this actions is for X32 Compact/X32 Producer/M32R. For X32 or M32 please use the X32/M32 action',
			options: [
				{
					type: 'dropdown',
					label: 'Bank',
					id: 'bank',
					...convertChoices([
						{
							id: '0',
							label: 'GROUP DCA 1 - 8',
						},
						{
							id: '1',
							label: 'BUS 1 - 8',
						},
						{
							id: '2',
							label: 'BUS 9 - 16',
						},
						{
							id: '3',
							label: 'MATRIX 1 - 6 / MAIN C',
						},
						{
							id: '4',
							label: 'CH 1 - 8',
						},
						{
							id: '5',
							label: 'CH 9 - 16',
						},
						{
							id: '6',
							label: 'CH 17 - 24',
						},
						{
							id: '7',
							label: 'CH 25 - 32',
						},
						{
							id: '8',
							label: 'AUX IN / USB',
						},
						{
							id: '9',
							label: 'FX RTN',
						},
					]),
					disableAutoExpression: true,
				},
			],
			callback: async (action): Promise<void> => {
				sendOsc(`/-stat/grpfaderbank`, {
					type: 'i',
					value: getOptNumber(action, 'bank'),
				})
			},
		},
		'sends-on-fader': {
			name: 'Sends on Fader/Fader Flip',
			options: [
				{
					type: 'dropdown',
					label: 'On / Off',
					id: 'on',
					...convertChoices(CHOICES_ON_OFF),
					disableAutoExpression: true,
				},
			],
			callback: async (action): Promise<void> => {
				const cmd = `/-stat/sendsonfader`
				const onState = getResolveOnOffMute(action, cmd, true, 'on')

				sendOsc(cmd, {
					type: 'i',
					value: onState,
				})
			},
			subscribe: (evt): void => {
				if (evt.options.on === MUTE_TOGGLE) {
					ensureLoaded(`/-stat/sendsonfader`)
				}
			},
		},
		'bus-send-bank': {
			name: 'Bus send bank',
			options: [
				{
					type: 'dropdown',
					label: 'Send Bank',
					id: 'bank',
					...convertChoices([
						{
							id: '0',
							label: 'Bus 1-4',
						},
						{
							id: '1',
							label: 'Bus 5-8',
						},
						{
							id: '2',
							label: 'Bus 9-12',
						},
						{
							id: '3',
							label: 'Bus 13-16',
						},
					]),
					disableAutoExpression: true,
				},
			],
			callback: async (action): Promise<void> => {
				const cmd = `/-stat/bussendbank`
				sendOsc(cmd, {
					type: 'i',
					value: getOptNumber(action, 'bank', 0),
				})
			},
		},
		'user-bank': {
			name: 'User Assign Bank',
			options: [
				{
					type: 'dropdown',
					label: 'User Bank',
					id: 'bank',
					...convertChoices([
						{
							id: '0',
							label: 'Set A',
						},
						{
							id: '1',
							label: 'Set B',
						},
						{
							id: '2',
							label: 'Set C',
						},
					]),
					disableAutoExpression: true,
				},
			],
			callback: async (action): Promise<void> => {
				const cmd = `/-stat/userbank`
				sendOsc(cmd, {
					type: 'i',
					value: getOptNumber(action, 'bank', 0),
				})
			},
		},
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
				const cmd = `/-stat/screen/screen`
				sendOsc(cmd, {
					type: 'i',
					value: getOptNumber(action, 'screen', 0),
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
			callback: async (action): Promise<void> => {
				const cmd = `/-stat/screen/mutegrp`
				const onState = getResolveOnOffMute(action, cmd, true, 'on')

				sendOsc(cmd, {
					type: 'i',
					value: onState,
				})
			},
			subscribe: (evt): void => {
				if (evt.options.on === MUTE_TOGGLE) {
					ensureLoaded(`/-stat/screen/mutegrp`)
				}
			},
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
			callback: async (action): Promise<void> => {
				const cmd = `/-stat/screen/utils`
				const onState = getResolveOnOffMute(action, cmd, true, 'on')

				sendOsc(cmd, {
					type: 'i',
					value: onState,
				})
			},
			subscribe: (evt): void => {
				if (evt.options.on === MUTE_TOGGLE) {
					ensureLoaded(`/-stat/screen/utils`)
				}
			},
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
				const cmd = `/-stat/screen/CHAN/page`
				sendOsc(cmd, {
					type: 'i',
					value: getOptNumber(action, 'page', 0),
				})
				sendOsc('/-stat/screen/screen', { type: 'i', value: 0 })
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
				const cmd = `/-stat/screen/METER/page`
				sendOsc(cmd, {
					type: 'i',
					value: getOptNumber(action, 'page', 0),
				})
				sendOsc('/-stat/screen/screen', { type: 'i', value: 1 })
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
				const cmd = `/-stat/screen/ROUTE/page`
				sendOsc(cmd, {
					type: 'i',
					value: getOptNumber(action, 'page', 0),
				})
				sendOsc('/-stat/screen/screen', { type: 'i', value: 2 })
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
				const cmd = `/-stat/screen/SETUP/page`
				sendOsc(cmd, {
					type: 'i',
					value: getOptNumber(action, 'page', 0),
				})
				sendOsc('/-stat/screen/screen', { type: 'i', value: 3 })
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
				const cmd = `/-stat/screen/LIB/page`
				sendOsc(cmd, {
					type: 'i',
					value: getOptNumber(action, 'page', 0),
				})
				sendOsc('/-stat/screen/screen', { type: 'i', value: 4 })
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
				const cmd = `/-stat/screen/FX/page`
				sendOsc(cmd, {
					type: 'i',
					value: getOptNumber(action, 'page', 0),
				})
				sendOsc('/-stat/screen/screen', { type: 'i', value: 5 })
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
				const cmd = `/-stat/screen/MON/page`
				sendOsc(cmd, {
					type: 'i',
					value: getOptNumber(action, 'page', 0),
				})
				sendOsc('/-stat/screen/screen', { type: 'i', value: 6 })
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
				const cmd = `/-stat/screen/USB/page`
				sendOsc(cmd, {
					type: 'i',
					value: getOptNumber(action, 'page', 0),
				})
				sendOsc('/-stat/screen/screen', { type: 'i', value: 7 })
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
				const cmd = `/-stat/screen/SCENE/page`
				sendOsc(cmd, {
					type: 'i',
					value: getOptNumber(action, 'page', 0),
				})
				sendOsc('/-stat/screen/screen', { type: 'i', value: 8 })
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
				sendOsc(cmd, {
					type: 'i',
					value: getOptNumber(action, 'page', 0),
				})
				sendOsc('/-stat/screen/screen', { type: 'i', value: 9 })
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
				const currentScreen = state.get('/-stat/screen/screen')
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
				const currentPage = state.get(cmd)
				const currentPageIndex = currentPage && currentPage[0]?.type === 'i' ? Number(currentPage[0]?.value) : 0
				let gotoPageIndex = currentPageIndex + Number(action.options.goto)
				if (gotoPageIndex < 0) gotoPageIndex = 0
				else if (gotoPageIndex >= pages) gotoPageIndex = pages - 1

				sendOsc(cmd, {
					type: 'i',
					value: gotoPageIndex,
				})
			},
			subscribe: (): void => {
				ensureLoaded('/-stat/screen/screen')
				ensureLoaded('/-stat/screen/CHAN/page')
				ensureLoaded('/-stat/screen/METER/page')
				ensureLoaded('/-stat/screen/SETUP/page')
				ensureLoaded('/-stat/screen/LIB/page')
				ensureLoaded('/-stat/screen/FX/page')
				ensureLoaded('/-stat/screen/MON/page')
				ensureLoaded('/-stat/screen/USB/page')
				ensureLoaded('/-stat/screen/SCENE/page')
				ensureLoaded('/-stat/screen/ASSIGN/page')
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
				state.setStoredChannel(action.options.channel)
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
				const lockState = state.get(path)
				const lockValue = lockState && lockState[0].type === 'i' ? lockState[0].value : 0
				let newState = action.options.newState ? action.options.newState : 0

				if (lockValue == newState) {
					return
				}

				// set to unlocked first to avoid nondeterministic state on X32
				sendOsc(path, { type: 'i', value: 0 })
				if (newState == 3) {
					newState = lockValue > 0 ? 0 : 1
				}

				// wait 100ms if locking or shutting down to ensure not going from lock to shutdown or vice versa
				if (newState > 0) {
					setTimeout(() => {
						sendOsc(path, { type: 'i', value: newState })
					}, 100)
				}
			},
			subscribe: (): void => {
				ensureLoaded(`/-stat/lock`)
			},
		},
		'save-scene': {
			name: 'Save scene',
			description:
				'Use at own risk. This will over write whatever scene is saved in that index. Please make sure your settings are correct when setting up.',
			options: [
				{
					type: 'dropdown',
					label: 'scene number (0-99)',
					id: 'sceneIndex',
					...convertChoices([...Array(100).keys()].map((x) => ({ id: x, label: `${x}`.padStart(2, '0') }))),
				},
				{
					type: 'textinput',
					label: 'Scene name',
					id: 'sceneName',
				},
				{
					type: 'textinput',
					label: 'Scene note',
					id: 'sceneNote',
				},
			],
			callback: (action): void => {
				const index = action.options.sceneIndex
				const name = action.options.sceneName ? action.options.sceneName : ''
				const note = action.options.sceneNote ? action.options.sceneNote : ''
				sendOsc('/save', [
					{ type: 's', value: 'scene' },
					{ type: 'i', value: index },
					{ type: 's', value: name },
					{ type: 's', value: note },
				])
			},
		},
		'select-active-sdcard': {
			name: 'Select Active SD Card',
			description: 'Select Active SD Card',
			options: [
				{
					type: 'dropdown',
					label: 'SD Card',
					id: 'card',
					...convertChoices([
						{ id: 0, label: 'SD1' },
						{ id: 1, label: 'SD2' },
					]),
					disableAutoExpression: true,
				},
			],
			callback: (action): void => {
				const path = `/‐prefs/card/URECsdsel`
				sendOsc(path, { type: 'i', value: convertAnyToNumber(action.options.card) })
			},
		},
		'recorded-tracks': {
			name: 'Select number of recorded tracks',
			description: 'Select number of recorded tracks',
			options: [
				{
					type: 'dropdown',
					label: 'Number of tracks',
					id: 'tracks',
					...convertChoices([
						{ id: 0, label: '32 tracks' },
						{ id: 1, label: '16 tracks' },
						{ id: 2, label: '8 tracks' },
					]),
					disableAutoExpression: true,
				},
			],
			callback: (action): void => {
				const path = `/‐prefs/card/URECtracks`
				sendOsc(path, { type: 'i', value: convertAnyToNumber(action.options.tracks) })
			},
		},
		'select-playback-device': {
			name: 'Select playback device',
			description: 'Select playback device',
			options: [
				{
					type: 'dropdown',
					label: 'device',
					id: 'device',
					...convertChoices([
						{ id: 0, label: 'SD' },
						{ id: 1, label: 'USB' },
					]),
					disableAutoExpression: true,
				},
			],
			callback: (action): void => {
				const path = `/‐prefs/card/URECplayb`
				sendOsc(path, { type: 'i', value: convertAnyToNumber(action.options.device) })
			},
		},
		'format-sdcard': {
			name: 'Format SD Card',
			description: 'Format SD Card',
			options: [
				{
					type: 'dropdown',
					label: 'device',
					id: 'card',
					...convertChoices([
						{ id: 0, label: 'SD1' },
						{ id: 1, label: 'SD2' },
					]),
					disableAutoExpression: true,
				},
			],
			callback: (action): void => {
				const path = `/‐action/formatcard`
				sendOsc(path, { type: 'i', value: convertAnyToNumber(action.options.card) })
			},
		},

		'x-live-routing': {
			name: 'X-Live routing',
			description: 'X-Live routing',
			options: [
				{
					type: 'dropdown',
					label: 'X-Live route',
					id: 'route',
					...convertChoices([
						{ id: 0, label: 'Rec' },
						{ id: 1, label: 'Play' },
						{ id: 2, label: 'Auto' },
					]),
					disableAutoExpression: true,
				},
			],
			callback: (action): void => {
				const path = `/‐prefs/card/URECrout`
				sendOsc(path, { type: 'i', value: convertAnyToNumber(action.options.route) })
			},
		},
		'x-live-clear-alert': {
			name: 'X-Live Clear Alert',
			description: 'X-Live Clear Alert',
			options: [
				{
					type: 'dropdown',
					label: 'X-Live Clear Alert',
					id: 'alert',
					...convertChoices([
						{ id: 0, label: 'No-op' },
						{ id: 1, label: 'Clear alert' },
					]),
					disableAutoExpression: true,
				},
			],
			callback: (action): void => {
				const path = `/‐action/clearalert`
				sendOsc(path, { type: 'i', value: convertAnyToNumber(action.options.alert) })
			},
		},
		'x-live-position': {
			name: 'X-Live Position',
			description: 'X-Live Position',
			options: [
				{
					type: 'number',
					label: 'X-Live Position on sdcard',
					id: 'position',
					min: 0,
					max: 86399999,
					default: 0,
					disableAutoExpression: true,
				},
			],
			callback: (action): void => {
				const path = `/‐action/setposition`
				sendOsc(path, { type: 'i', value: convertAnyToNumber(action.options.position) })
			},
		},

		'insert-on': {
			name: 'Insert Status',
			description: 'Switch Insert no or off for a specific source',
			options: [
				{
					type: 'dropdown',
					label: 'Source',
					id: 'src',
					...convertChoices(insertSourceChoices),
					allowInvalidValues: true,
				},
				{
					type: 'dropdown',
					label: 'On / Off',
					id: 'on',
					...convertChoices(CHOICES_ON_OFF),
					disableAutoExpression: true,
				},
			],
			callback: (action): void => {
				const srcRef = parseRefToPaths(action.options.src, insertSourceParseOptions)
				if (!srcRef?.insertSource) return

				const onState = getResolveOnOffMute(action, srcRef.insertSource.onPath, true, 'on')
				sendOsc(srcRef.insertSource.onPath, { type: 'i', value: onState })
			},
			subscribe: (evt): void => {
				if (evt.options.on === MUTE_TOGGLE) {
					const srcRef = parseRefToPaths(evt.options.src, insertSourceParseOptions)
					if (!srcRef?.insertSource) return

					ensureLoaded(srcRef.insertSource.onPath)
				}
			},
		},
		'insert-pos': {
			name: 'Insert Position',
			description: 'Set whether insert is PRE or POST for specific source',
			options: [
				{
					type: 'dropdown',
					label: 'Source',
					id: 'src',
					...convertChoices(insertSourceChoices),
					allowInvalidValues: true,
				},
				{
					type: 'dropdown',
					label: 'PRE / POST',
					id: 'pos',
					...convertChoices([
						{ id: 0, label: 'PRE' },
						{ id: 1, label: 'POST' },
					]),
					disableAutoExpression: true,
				},
			],
			callback: (action): void => {
				const srcRef = parseRefToPaths(action.options.src, insertSourceParseOptions)
				if (!srcRef?.insertSource) return

				sendOsc(srcRef.insertSource.posPath, { type: 'i', value: convertAnyToNumber(action.options.pos) })
			},
		},
		'insert-select': {
			name: 'Insert Destination',
			description: 'Set the destination of the insert for a specific source',
			options: [
				{
					type: 'dropdown',
					label: 'Source',
					id: 'src',
					...convertChoices(insertSourceChoices),
					allowInvalidValues: true,
				},
				{
					type: 'dropdown',
					label: 'Destination',
					id: 'dest',
					...convertChoices(GetInsertDestinationChoices()),
					disableAutoExpression: true,
				},
			],
			callback: (action): void => {
				const srcRef = parseRefToPaths(action.options.src, insertSourceParseOptions)
				if (!srcRef?.insertSource) return

				sendOsc(srcRef.insertSource.selPath, { type: 'i', value: convertAnyToNumber(action.options.dest) })
			},
		},

		'do-undo': {
			name: 'Do Undo',
			description: 'If possible, undo to last checkpoint (NOTE: There is only one undo step in X32)',
			options: [],
			callback: (): void => {
				const undoTimeState = state.get(`/-undo/time`)
				const undoTime = undoTimeState && undoTimeState[0]?.type === 's' ? undoTimeState[0].value : ''

				if (!undoTime) {
					return
				}

				sendOsc('/-action/doundo', { type: 'i', value: 1 })
			},
		},
		'set-undo-checkpoint': {
			name: 'Set Undo Checkpoint',
			description:
				'Creates checkpoint to get back to upon issuing an undo command. The time will replace any value previously saved checkpoint',
			options: [],
			callback: (): void => {
				sendOsc('/-action/undopt', { type: 'i', value: 1 })
			},
		},
	}
	return actions
}
