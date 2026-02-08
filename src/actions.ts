import { X32State } from './state.js'
import { trimToFloat, headampGainToFloat, InstanceBaseExt } from './util.js'
import {
	CHOICES_TAPE_FUNC,
	MUTE_TOGGLE,
	convertChoices,
	CHOICES_ON_OFF,
	HeadampGainChoice,
	GetHeadampChoices,
	GetLevelsChoiceConfigs,
	GetUserOutTargets,
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
