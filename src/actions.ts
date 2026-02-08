import { X32State } from './state.js'
import { trimToFloat, headampGainToFloat, floatToDB, InstanceBaseExt, padNumber, stringifyValueAlways } from './util.js'
import {
	CHOICES_TAPE_FUNC,
	MUTE_TOGGLE,
	convertChoices,
	CHOICES_ON_OFF,
	FaderLevelChoice,
	HeadampGainChoice,
	GetHeadampChoices,
	GetOscillatorDestinations,
	FadeDurationChoice,
	GetLevelsChoiceConfigs,
	GetAesBlocks,
	GetAesCardRouteBlocks,
	GetAuxBlockRoutes,
	GetInputBlockRoutes,
	GetInputBlocks,
	GetLeftOutputBlockRoutes,
	GetRightOutputBlockRoutes,
	GetUserInSources,
	GetUserInTargets,
	GetUserOutSources,
	GetUserOutTargets,
	GetInsertDestinationChoices,
	GetTalkbackDestinations,
	GetPresetsChoices,
	TalkbackDestinationsParseOptions,
	CHOICES_COLOR,
	parseColorNameToValue,
	OscillatorDestinationsParseOptions,
	GetTargetChoicesNew,
} from './choices.js'
import { ParseRefOptions, UserRouteInPath, UserRouteOutPath, parseHeadampRef, parseRefToPaths } from './paths.js'
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
	label: {
		options: {
			target: string
			lab: string
		}
	}
	color: {
		options: {
			target: string
			col: string
		}
	}
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
	select: {
		options: {
			select: string
		}
	}
	solo: {
		options: {
			solo: string
			on: number
		}
	}
	'clear-solo': { options: Record<string, never> }
	tape: {
		options: {
			tFunc: number
		}
	}
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
	'oscillator-enable': {
		options: {
			on: number
		}
	}
	'oscillator-destination': {
		options: {
			destination: string
		}
	}
	'solo-mono': {
		options: {
			on: number
		}
	}
	solo_dim: {
		options: {
			on: number
		}
	}
	solo_dim_attenuation: {
		options: {
			dimAtt: number
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
	store_channel: {
		options: {
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
			mode: number
			block: number
			routing: number
		}
	}
	'route-aux-blocks': {
		options: {
			mode: number
			routing: number
		}
	}
	'route-aes50-blocks': {
		options: {
			mode: number
			block: number
			routing: number
		}
	}
	'route-card-blocks': {
		options: {
			block: number
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
	goCommmand: { options: Record<string, never> }
	nextCommmand: { options: Record<string, never> }
	prevCommmand: { options: Record<string, never> }
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
	'load-channel-preset': {
		options: {
			preset: string
			channel: string
			ha: boolean
			config: boolean
			gate: boolean
			dyn: boolean
			eq: boolean
			sends: boolean
		}
	}
	'load-fx-preset': {
		options: {
			preset: string
			channel: number
		}
	}
	'load-aes-preset': {
		options: {
			preset: string
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
	const soloChoicesParseOptions: ParseRefOptions = {
		allowStereo: true,
		allowMono: true,
		allowChannel: true,
		allowAuxIn: true,
		allowFx: true,
		allowBus: true,
		allowMatrix: true,
		allowDca: true,
	}
	const soloChoices = GetTargetChoicesNew(state, soloChoicesParseOptions)
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
		label: {
			name: 'Set label',
			options: [
				{
					type: 'dropdown',
					label: 'Target',
					id: 'target',
					...convertChoices(levelsChoices.channels),
					allowInvalidValues: true,
				},
				{
					type: 'textinput',
					label: 'Label',
					id: 'lab',
					default: '',
					useVariables: true,
				},
			],
			callback: async (action): Promise<void> => {
				const targetRef = parseRefToPaths(action.options.target, levelsChoices.channelsParseOptions)
				if (!targetRef?.config) return

				sendOsc(targetRef.config.name, {
					type: 's',
					value: stringifyValueAlways(action.options.lab),
				})
			},
		},

		color: {
			name: 'Set color',
			options: [
				{
					type: 'dropdown',
					label: 'Target',
					id: 'target',
					...convertChoices(levelsChoices.channels),
					allowInvalidValues: true,
				},
				{
					type: 'dropdown',
					label: 'Color',
					id: 'col',
					...convertChoices(CHOICES_COLOR),
					allowInvalidValues: true,
				},
			],
			callback: async (action): Promise<void> => {
				const targetRef = parseRefToPaths(action.options.target, levelsChoices.channelsParseOptions)
				if (!targetRef?.config) return

				const color = parseColorNameToValue(action.options.col)
				if (typeof color !== 'number') return

				sendOsc(targetRef.config.color, {
					type: 'i',
					value: color,
				})
			},
		},

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
				sendOsc(`/-action/gocue`, {
					type: 'i',
					value: getOptNumber(action, 'cue'),
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
				sendOsc(`/-action/goscene`, {
					type: 'i',
					value: getOptNumber(action, 'scene'),
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
				sendOsc(`/-action/gosnippet`, {
					type: 'i',
					value: getOptNumber(action, 'snip'),
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
		solo: {
			name: 'Solo On/Off',
			options: [
				{
					type: 'dropdown',
					label: 'Target',
					id: 'solo',
					...convertChoices(soloChoices),
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
			callback: async (action): Promise<void> => {
				const soloRef = parseRefToPaths(action.options.solo, soloChoicesParseOptions)
				if (soloRef?.soloNumber === undefined) return

				const cmd = `/-stat/solosw/${padNumber(soloRef.soloNumber, 2)}`
				const onState = getResolveOnOffMute(action, cmd, true, 'on')

				sendOsc(cmd, {
					type: 'i',
					value: onState,
				})
			},
			subscribe: (evt): void => {
				if (evt.options.on === MUTE_TOGGLE) {
					const soloRef = parseRefToPaths(evt.options.solo, soloChoicesParseOptions)
					if (soloRef?.soloNumber === undefined) return

					ensureLoaded(`/-stat/solosw/${padNumber(soloRef.soloNumber, 2)}`)
				}
			},
		},
		'clear-solo': {
			name: 'Clear Solo',
			options: [],
			callback: async (): Promise<void> => {
				sendOsc(`/-action/clearsolo`, {
					type: 'i',
					value: 1,
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
			callback: async (action): Promise<void> => {
				const cmd = `/-stat/talk/${stringifyValueAlways(action.options.channel)}`
				const onState = getResolveOnOffMute(action, cmd, true, 'on')

				sendOsc(cmd, {
					type: 'i',
					value: onState,
				})
			},
			subscribe: (evt): void => {
				if (evt.options.on === MUTE_TOGGLE) {
					ensureLoaded(`/-stat/talk/${stringifyValueAlways(evt.options.channel)}`)
				}
			},
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
					choices: GetTalkbackDestinations(state),
					allowInvalidValues: true,
				},
			],
			callback: (action): void => {
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

				const cmd = `/config/talk/${stringifyValueAlways(action.options.function)}/destmap`
				sendOsc(cmd, {
					type: 'i',
					value: bitmap,
				})
			},
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
					...convertChoices(GetTalkbackDestinations(state)),
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
			callback: (action): void => {
				const destRef = parseRefToPaths(action.options.dest, TalkbackDestinationsParseOptions)
				if (!destRef?.talkbackDestMask) return

				const cmd = `/config/talk/${stringifyValueAlways(action.options.function)}/destmap`
				const currentState = state.get(cmd)
				const currentVal = currentState && currentState[0]?.type === 'i' ? currentState[0]?.value : 0
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
				sendOsc(cmd, {
					type: 'i',
					value: bitmap,
				})
			},
			subscribe: (evt): void => {
				ensureLoaded(`/config/talk/${stringifyValueAlways(evt.options.function)}/destmap`)
			},
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
			callback: (action): void => {
				const cmd = `/config/talk/${stringifyValueAlways(action.options.function)}/destmap`
				const currentState = state.get(cmd)
				const currentVal = currentState && currentState[0]?.type === 'i' ? currentState[0]?.value : undefined
				if (currentVal !== undefined) {
					state.setPressValue(`${action.controlId}-${cmd}`, currentVal)
				}
			},
			subscribe: (evt): void => {
				ensureLoaded(`/config/talk/${stringifyValueAlways(evt.options.function)}/destmap`)
			},
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
			callback: (action): void => {
				const cmd = `/config/talk/${stringifyValueAlways(action.options.function)}/destmap`
				const storedVal = state.popPressValue(`${action.controlId}-${cmd}`)
				if (storedVal !== undefined) {
					sendOsc(cmd, {
						type: 'i',
						value: storedVal,
					})
				}
			},
			subscribe: (evt): void => {
				ensureLoaded(`/config/talk/${stringifyValueAlways(evt.options.function)}/destmap`)
			},
		},

		'oscillator-enable': {
			name: 'Oscillator Enable',
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
				const cmd = `/-stat/osc/on`
				const onState = getResolveOnOffMute(action, cmd, true, 'on')

				sendOsc(cmd, {
					type: 'i',
					value: onState,
				})
			},
			subscribe: (evt): void => {
				if (evt.options.on === MUTE_TOGGLE) {
					ensureLoaded(`/-stat/osc/on`)
				}
			},
		},
		'oscillator-destination': {
			name: 'Oscillator Destination',
			options: [
				{
					type: 'dropdown',
					label: 'destination',
					id: 'destination',
					...convertChoices(GetOscillatorDestinations(state)),
					allowInvalidValues: true,
				},
			],
			callback: async (action): Promise<void> => {
				const destRef = parseRefToPaths(action.options.destination, OscillatorDestinationsParseOptions)
				if (!destRef?.oscillatorDestValue) return

				sendOsc(`/config/osc/dest`, {
					type: 'i',
					value: destRef.oscillatorDestValue,
				})
			},
		},
		'solo-mono': {
			name: 'Solo Mono',
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
				const cmd = `/config/solo/mono`
				const onState = getResolveOnOffMute(action, cmd, true, 'on')

				sendOsc(cmd, {
					type: 'i',
					value: onState,
				})
			},
			subscribe: (evt): void => {
				if (evt.options.on === MUTE_TOGGLE) {
					ensureLoaded(`/config/solo/mono`)
				}
			},
		},
		solo_dim: {
			name: 'Solo Dim',
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
				const cmd = `/config/solo/dim`
				const onState = getResolveOnOffMute(action, cmd, true, 'on')

				sendOsc(cmd, {
					type: 'i',
					value: onState,
				})
			},
			subscribe: (evt): void => {
				if (evt.options.on === MUTE_TOGGLE) {
					ensureLoaded(`/config/solo/dim`)
				}
			},
		},
		solo_dim_attenuation: {
			name: 'Set Dim Attenuation',
			options: [
				{
					type: 'number',
					label: 'Dim Attenuation',
					id: 'dimAtt',
					range: true,
					default: -10,
					step: 1,
					min: -40,
					max: 0,
				},
			],
			callback: async (action): Promise<void> => {
				sendOsc(`/config/solo/dimatt`, {
					type: 'f',
					value: getOptNumber(action, 'dimAtt') / 40 + 1,
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
					channel = state.getStoredChannel()
					if (channel == undefined || channel > 31) return
				}
				sendOsc(UserRouteInPath(channel), {
					type: 'i',
					value: getOptNumber(action, 'source'),
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
					channel = state.getStoredChannel()
					if (channel == undefined) return
				}
				sendOsc(UserRouteOutPath(channel), {
					type: 'i',
					value: getOptNumber(action, 'source'),
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
				state.setStoredChannel(action.options.channel)
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
			callback: (action): void => {
				const cmd = `/config/routing/routswitch`
				const mode = getOptNumber(action, 'mode', 2)
				if (mode === 2) {
					const currentState = state.get(cmd)
					const currentVal = currentState && currentState[0]?.type === 'i' ? currentState[0]?.value : 1
					sendOsc(cmd, { type: 'i', value: currentVal === 0 ? 1 : 0 })
				} else {
					sendOsc(cmd, { type: 'i', value: mode })
				}
			},
			subscribe: (): void => {
				ensureLoaded(`/config/routing/routswitch`)
			},
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
				const routing = getOptNumber(action, 'routing', 0)
				const cmd = `/config/routing/${stringifyValueAlways(mode)}/${stringifyValueAlways(block)}`
				sendOsc(cmd, { type: 'i', value: routing })
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
				const routing = getOptNumber(action, 'routing', 0)
				const cmd = `/config/routing/${stringifyValueAlways(mode)}/AUX`
				sendOsc(cmd, { type: 'i', value: routing })
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
				const routing = getOptNumber(action, 'routing', 0)
				const cmd = `/config/routing/AES50${stringifyValueAlways(mode)}/${stringifyValueAlways(block)}`
				sendOsc(cmd, { type: 'i', value: routing })
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
				const routing = getOptNumber(action, 'routing', 0)
				const cmd = `/config/routing/CARD/${stringifyValueAlways(block)}`
				sendOsc(cmd, { type: 'i', value: routing })
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
				const routing = getOptNumber(action, 'routing', 0)
				const cmd = `/config/routing/OUT/${stringifyValueAlways(block)}`
				sendOsc(cmd, { type: 'i', value: routing })
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
				const routing = getOptNumber(action, 'routing', 0)
				const cmd = `/config/routing/OUT/${stringifyValueAlways(block)}`
				sendOsc(cmd, { type: 'i', value: routing })
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
		goCommmand: {
			name: 'Go Command',
			description: 'Load the highlighted cue/scene/snipped (based on show control)',
			options: [],
			callback: (): void => {
				const showControlState = state.get('/-prefs/show_control')
				const showControlValue = showControlState && showControlState[0].type === 'i' ? showControlState[0].value : 0
				const showControl = getShowControlName(showControlValue)

				const highlightedState = state.get('/-show/prepos/current')
				const highlightedValue = highlightedState && highlightedState[0].type === 'i' ? highlightedState[0].value : 0

				sendOsc(`/-action/go${showControl}`, { type: 'i', value: highlightedValue })
			},
			subscribe: (): void => {
				ensureLoaded('/-prefs/show_control')
				ensureLoaded('/-show/prepos/current')
			},
		},
		nextCommmand: {
			name: 'Next Command',
			description:
				'Move the highlighted marker to the cue/scene/snipped (based on show control). Warning pressing this too many times could result in going to a cue/scene/snippet without data.',
			options: [],
			callback: (): void => {
				const highlightedState = state.get('/-show/prepos/current')
				const highlightedValue = highlightedState && highlightedState[0].type === 'i' ? highlightedState[0].value : 0
				const incrementedValue = highlightedValue + 1
				sendOsc('/-show/prepos/current', { type: 'i', value: incrementedValue })
			},
			subscribe: (): void => {
				ensureLoaded('/-show/prepos/current')
			},
		},
		prevCommmand: {
			name: 'Previous Command',
			description: 'Move the highlighted marker to the cue/scene/snipped (based on show control).',
			options: [],
			callback: (): void => {
				const highlightedState = state.get('/-show/prepos/current')
				const highlightedValue = highlightedState && highlightedState[0].type === 'i' ? highlightedState[0].value : 0
				if (highlightedValue <= 0) {
					return
				}
				const decrementedValue = highlightedValue - 1
				sendOsc('/-show/prepos/current', { type: 'i', value: decrementedValue })
			},
			subscribe: (): void => {
				ensureLoaded('/-show/prepos/current')
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
		'load-channel-preset': {
			name: 'Load channel preset',
			description:
				"Load channel preset either into specified channel or into selected channel. Use at own risk. (Maybe don't accidently press during a show?)",
			options: [
				{
					type: 'dropdown',
					label: 'Preset to load',
					id: 'preset',
					...convertChoices(GetPresetsChoices('ch', state)),
					allowInvalidValues: true,
				},
				{
					type: 'dropdown',
					label: 'Target channel',
					id: 'channel',
					...convertChoices([
						{
							id: 'selected',
							label: '- Selected Channel -',
						},
						...selectChoices,
					]),
					allowInvalidValues: true,
				},
				{
					id: 'ha',
					type: 'checkbox',
					label: 'Load headamp data',
					default: true,
				},
				{
					id: 'config',
					type: 'checkbox',
					label: 'Load configuration data',
					default: true,
				},
				{
					id: 'gate',
					type: 'checkbox',
					label: 'Load gate data',
					default: true,
				},
				{
					id: 'dyn',
					type: 'checkbox',
					label: 'Load compressor data',
					default: true,
				},
				{
					id: 'eq',
					type: 'checkbox',
					label: 'Load equalizer data',
					default: true,
				},
				{
					id: 'sends',
					type: 'checkbox',
					label: 'Load sends data',
					default: true,
				},
			],
			callback: (action): void => {
				let selectedChannel = -1
				if (action.options.channel !== 'selected') {
					const channelRef = parseRefToPaths(action.options.channel, selectChoicesParseOptions)
					if (channelRef?.selectNumber === undefined) return

					selectedChannel = channelRef.selectNumber
				} else {
					const selected = state.get('/-stat/selidx')
					selectedChannel = selected && selected[0].type === 'i' ? selected[0]?.value : 0
				}

				const preset = getOptNumber(action, 'preset', 0)
				const paddedPreset = `${preset}`.padStart(3, '0')
				const hasDataState = state.get(`/-libs/ch/${paddedPreset}/hasdata`)
				const hasDataValue = hasDataState && hasDataState[0]?.type === 'i' && hasDataState[0].value === 1
				if (!hasDataValue) {
					return
				}

				const scopeBits = [
					!!action.options.sends,
					!!action.options.eq,
					!!action.options.dyn,
					!!action.options.gate,
					!!action.options.config,
					!!action.options.ha,
				].reduce<number>((acc, cur) => (acc << 1) | (cur ? 1 : 0), 0)

				sendOsc('/load', [
					{ type: 's', value: 'libchan' },
					{ type: 'i', value: preset - 1 },
					{ type: 'i', value: selectedChannel },
					{ type: 'i', value: scopeBits },
				])
			},
		},
		'load-fx-preset': {
			name: 'Load effects preset',
			description:
				"Load effects preset either into specified channel. Use at own risk. (Maybe don't accidently press during a show?)",
			options: [
				{
					type: 'dropdown',
					label: 'Preset to load',
					id: 'preset',
					...convertChoices(GetPresetsChoices('fx', state)),
					allowInvalidValues: true,
				},
				{
					type: 'dropdown',
					label: 'Target channel',
					id: 'channel',
					default: 0,
					// TODO - rework this to be tidier
					choices: [...[...Array(8).keys()].map((x) => ({ label: `${x + 1}`, id: x }))],
				},
			],
			callback: (action): void => {
				const preset = getOptNumber(action, 'preset', 0)
				const paddedPreset = `${preset}`.padStart(3, '0')
				const hasDataState = state.get(`/-libs/fx/${paddedPreset}/hasdata`)
				const hasDataValue = hasDataState && hasDataState[0]?.type === 'i' && hasDataState[0].value === 1
				if (!hasDataValue) {
					return
				}

				let channel = getOptNumber(action, 'channel', 0)
				if (channel == -1) {
					const selected = state.get('/-stat/selidx')
					channel = selected && selected[0].type === 'i' ? selected[0]?.value : 0
				}
				sendOsc('/load', [
					{ type: 's', value: 'libfx' },
					{ type: 'i', value: preset - 1 },
					{ type: 'i', value: channel },
				])
			},
		},
		// Not currently working...
		// Looks like Behringer changes things when they introduced User Routing and didnt update the OSC Command
		// We assume that when they added scopes to the routing they didnt update the OSC command so it just defaults to 0 and doesn't
		// read what we send as a parameter. Both `load ,si librout 5` and `load ,sii librout 5 255` respond with `load ,si librout 1`
		// which should indicate "success" but nothing happens on the X32 which leads us tyo believe that its "successfully" loading nothing.
		// I contacted Patrick‐Gilles Maillot, and he has tried to contact Behringer and they say is going to be a while before a dev can look
		// into it. Sadness =(. It seems X32 isn't getting as much love from Behringer as the Wing now days.
		// I also tried to see how X32edit loads presets and it doesn't even use the load command, instead it uses eight separate
		//`/config/routing` commands to set each config (for interest loading a channel preset kicks of 24 commands and sets
		// each property of the channel manually) so that exercise didn't help. This feature is missing on Mixing Station too
		// 'load-route-preset': {
		// 	name: 'Load routing preset',
		// 	description: "Load routing preset. Use at own risk. (Maybe don't accidently press during a show?)",
		// 	options: [
		// 		{
		// 			type: 'dropdown',
		// 			label: 'Preset to load',
		// 			id: 'preset',
		// 			...convertChoices(GetPresetsChoices('r', state)),
		// 		},
		// 		{
		// 			id: 'ch',
		// 			type: 'checkbox',
		// 			label: 'Load Channel In Routing',
		// 			default: true,
		// 		},
		// 		{
		// 			id: 'aes',
		// 			type: 'checkbox',
		// 			label: 'Load AES50 Out Routing',
		// 			default: true,
		// 		},
		// 		{
		// 			id: 'card',
		// 			type: 'checkbox',
		// 			label: 'Load Card Out Routing',
		// 			default: true,
		// 		},
		// 		{
		// 			id: 'xlr',
		// 			type: 'checkbox',
		// 			label: 'Load XLR Out Routing',
		// 			default: true,
		// 		},
		// 		{
		// 			id: 'out',
		// 			type: 'checkbox',
		// 			label: 'Load Out Patch',
		// 			default: true,
		// 		},
		// 		{
		// 			id: 'aux',
		// 			type: 'checkbox',
		// 			label: 'Load Aux Patch ',
		// 			default: true,
		// 		},
		// 		{
		// 			id: 'p16',
		// 			type: 'checkbox',
		// 			label: 'Load P16 Patch',
		// 			default: true,
		// 		},
		// 		{
		// 			id: 'user',
		// 			type: 'checkbox',
		// 			label: 'Load User Slots ',
		// 			default: true,
		// 		},
		// 	],
		// 	callback: (action): void => {
		// 		const preset = getOptNumber(action, 'preset', 0)
		// 		const paddedPreset = `${preset}`.padStart(3, '0')
		// 		const hasDataState = state.get(`/-libs/r/${paddedPreset}/hasdata`)
		// 		const hasDataValue = hasDataState && hasDataState[0]?.type === 'i' && hasDataState[0].value === 1
		// 		if (!hasDataValue) {
		// 			return
		// 		}

		// 		const scopeBits = [
		// 			!!action.options.ch,
		// 			!!action.options.aes,
		// 			!!action.options.card,
		// 			!!action.options.xlr,
		// 			!!action.options.out,
		// 			!!action.options.aux,
		// 			!!action.options.p16,
		// 			!!action.options.user,
		// 		].reduce<number>((acc, cur) => (acc << 1) | (cur ? 1 : 0), 0)

		// 		sendOsc('/load', [
		// 			{ type: 's', value: 'librout' },
		// 			{ type: 'i', value: preset - 1 },
		// 			{ type: 'i', value: scopeBits },
		// 		])
		// 	},
		// },
		'load-aes-preset': {
			name: 'Load AES/DP48 preset',
			description: "Load AES/DP48 preset. Use at own risk. (Maybe don't accidently press during a show?)",
			options: [
				{
					type: 'dropdown',
					label: 'Preset to load',
					id: 'preset',
					...convertChoices(GetPresetsChoices('mon', state)),
					allowInvalidValues: true,
				},
			],
			callback: (action): void => {
				const preset = getOptNumber(action, 'preset', 0)
				const paddedPreset = `${preset}`.padStart(3, '0')
				const hasDataState = state.get(`/-libs/mon/${paddedPreset}/hasdata`)
				const hasDataValue = hasDataState && hasDataState[0]?.type === 'i' && hasDataState[0].value === 1
				if (!hasDataValue) {
					return
				}

				sendOsc('/load', [
					{ type: 's', value: 'libmon' },
					{ type: 'i', value: preset - 1 },
				])
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
