import { X32State } from './state.js'
import { trimToFloat, headampGainToFloat, floatToDB, InstanceBaseExt, padNumber, stringifyValueAlways } from './util.js'
import {
	CHOICES_TAPE_FUNC,
	MUTE_TOGGLE,
	GetMuteGroupChoices,
	CHOICES_MUTE_GROUP,
	convertChoices,
	CHOICES_ON_OFF,
	FaderLevelChoice,
	MuteChoice,
	HeadampGainChoice,
	GetHeadampChoices,
	GetOscillatorDestinations,
	FaderLevelDeltaChoice,
	FadeDurationChoice,
	PanningChoice,
	PanningDelta,
	GetLevelsChoiceConfigs,
	GetPanningChoiceConfigs,
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
	GetChannelSendParseOptions,
	TalkbackDestinationsParseOptions,
	CHOICES_COLOR,
	parseColorNameToValue,
	OscillatorDestinationsParseOptions,
	GetTargetChoicesNew,
} from './choices.js'
import { ParseRefOptions, UserRouteInPath, UserRouteOutPath, parseHeadampRef, parseRefToPaths } from './paths.js'
import { X32Transitions } from './transitions.js'
import { format as formatDate } from 'date-fns'
import {
	CompanionActionDefinition,
	CompanionActionEvent,
	CompanionActionInfo,
	CompanionActionDefinitions,
	OSCSomeArguments,
	CompanionOptionValues,
	OSCMetaArgument,
} from '@companion-module/base'
import { Easing } from './easings.js'

export enum ActionId {
	AddMarker = 'add_marker',
	Mute = 'mute',
	MuteGroup = 'mute_grp',
	MuteChannelSend = 'mute_channel_send',
	MuteBusSend = 'mute_bus_send',
	FaderLevel = 'fad',
	FaderLevelStore = 'fader_store',
	FaderLevelRestore = 'fader_restore',
	FaderLevelDelta = 'fader_delta',
	Panning = 'panning',
	PanningDelta = 'panning-delta',
	PanningStore = 'panning-store',
	PanningRestore = 'panning-restore',
	ChannelSendLevel = 'level_channel_send',
	ChannelSendLevelDelta = 'level_channel_send_delta',
	ChannelSendLevelStore = 'level_channel_store',
	ChannelSendLevelRestore = 'level_channel_restore',
	ChannelSendPanning = 'channel-send-panning',
	ChannelSendPanningDelta = 'channel-send-panning-delta',
	ChannelSendPanningStore = 'channel-send-panning-store',
	ChannelSendPanningRestore = 'channel-send-panning-restore',
	BusSendLevel = 'level_bus_send',
	BusSendLevelDelta = 'level_bus_send_delta',
	BusSendLevelStore = 'level_bus_store',
	BusSendLevelRestore = 'level_bus_restore',
	BusSendPanning = 'bus-send-panning',
	BusSendPanningDelta = 'bus-send-panning-delta',
	BusSendPanningStore = 'bus-send-panning-store',
	BusSendPanningRestore = 'bus-send-panning-restore',
	InputTrim = 'input_trim',
	// InputGain = 'input_gain',
	HeadampGain = 'headamp_gain',
	Label = 'label',
	Color = 'color',
	GoCue = 'go_cue',
	GoScene = 'go_scene',
	GoSnip = 'go_snip',
	Select = 'select',
	Solo = 'solo',
	ClearSolo = 'clear-solo',
	Tape = 'tape',
	TalkbackTalk = 'talkback_talk',
	TalkbackConfig = 'talkback_config',
	TalkbackConfigSingleSource = 'talkback_config_single_src',
	TalkbackConfigStore = 'talkback_config_store',
	TalkbackConfigRestore = 'talkback_restore',
	OscillatorEnable = 'oscillator-enable',
	OscillatorDestination = 'oscillator-destination',
	SyncClock = 'sync_clock',
	SoloMono = 'solo-mono',
	SoloDim = 'solo_dim',
	SoloDimAttenuation = 'solo_dim_attenuation',
	MonitorLevel = 'monitor-level',
	SendsOnFader = 'sends-on-fader',
	ChannelBank = 'channel-bank-full',
	GroupBank = 'group-bank-full',
	ChannelBankCompact = 'channel-bank-compact',
	GroupBankCompact = 'group-bank-compact',
	BusSendBank = 'bus-send-bank',
	UserBank = 'user-bank',
	Screens = 'screens',
	MuteGroupScreen = 'mute-group-screen',
	UtilityScreen = 'utility-screen',
	ChannelPage = 'channel-page',
	MeterPage = 'meter-page',
	RoutePage = 'route-page',
	SetupPage = 'setup-page',
	LibPage = 'library-page',
	FxPage = 'effects-page',
	MonPage = 'monitor-page',
	USBPage = 'usb-page',
	ScenePage = 'scene-page',
	AssignPage = 'assign-page',
	NextPrevPage = 'next-previous-page',
	StoreChannel = 'store_channel',
	Record = 'record',
	RouteUserIn = 'route-user-in',
	RouteUserOut = 'route-user-out',
	RouteInputBlockMode = 'route-input-block-mode',
	RouteInputBlocks = 'route-input-blocks',
	RouteAuxBlocks = 'route-aux-blocks',
	RouteAES50Blocks = 'route-aes50-blocks',
	RouteCardBlocks = 'route-card-blocks',
	RouteXLRLeftOutputs = 'route-xlr-left-outputs',
	RouteXLRRightOutputs = 'route-xlr-right-outputs',
	LockAndShutdown = 'lock-and-shutdown',
	SaveScene = 'save-scene',
	SelectActiveSDCard = 'select-active-sdcard',
	RecordedTracks = 'recorded-tracks',
	SelectPlaybackDevice = 'select-playback-device',
	FormatSDCard = 'format-sdcard',
	XLiveRouting = 'x-live-routing',
	XLivePosition = 'x-live-position',
	XLiveClearAlert = 'x-live-clear-alert',
	GoCommand = 'goCommmand',
	NextCommand = 'nextCommmand',
	PrevCommand = 'prevCommmand',
	InsertOn = 'insert-on',
	InsertPos = 'insert-pos',
	InsertSelect = 'insert-select',
	LoadChannelPreset = 'load-channel-preset',
	LoadFXPreset = 'load-fx-preset',
	// LoadRoutingPreset = 'load-route-preset',
	LoadAESPreset = 'load-aes-preset',
	DoUndo = 'do-undo',
	SetUndoCheckpoint = 'set-undo-checkpoint',
}

export type ActionsSchema = {
	[ActionId.Record]: {
		state: number
	}
	[ActionId.AddMarker]: Record<string, never>
	[ActionId.Mute]: {
		target: string
		mute: number // 0=off, 1=on, 2=toggle
	}
	[ActionId.MuteGroup]: {
		target: string
		mute: number // 0=off, 1=on, 2=toggle
	}
	[ActionId.MuteChannelSend]: {
		source: string
		target: string
		mute: number // 0=off, 1=on, 2=toggle
	}
	[ActionId.MuteBusSend]: {
		source: string
		target: string
		mute: number // 0=off, 1=on, 2=toggle
	}
	[ActionId.FaderLevel]: {
		target: string
		fad: number
		fadeDuration: number
		fadeAlgorithm: string
		fadeType: string
	}
	[ActionId.FaderLevelStore]: {
		target: string
	}
	[ActionId.FaderLevelRestore]: {
		target: string
		fadeDuration: number
		fadeAlgorithm: string
		fadeType: string
	}
	[ActionId.FaderLevelDelta]: {
		target: string
		useVariable: boolean
		delta: number
		varDelta: string
		fadeDuration: number
		fadeAlgorithm: string
		fadeType: string
	}
	[ActionId.Panning]: {
		target: string
		pan: number
		fadeDuration: number
		fadeAlgorithm: string
		fadeType: string
	}
	[ActionId.PanningDelta]: {
		target: string
		useVariable: boolean
		delta: number
		varDelta: string
		fadeDuration: number
		fadeAlgorithm: string
		fadeType: string
	}
	[ActionId.PanningStore]: {
		target: string
	}
	[ActionId.PanningRestore]: {
		target: string
		fadeDuration: number
		fadeAlgorithm: string
		fadeType: string
	}
	[ActionId.ChannelSendLevel]: {
		source: string
		target: string
		fad: number
		fadeDuration: number
		fadeAlgorithm: string
		fadeType: string
	}
	[ActionId.ChannelSendLevelDelta]: {
		source: string
		target: string
		useVariable: boolean
		delta: number
		varDelta: string
		fadeDuration: number
		fadeAlgorithm: string
		fadeType: string
	}
	[ActionId.ChannelSendLevelStore]: {
		source: string
		target: string
	}
	[ActionId.ChannelSendLevelRestore]: {
		source: string
		target: string
		fadeDuration: number
		fadeAlgorithm: string
		fadeType: string
	}
	[ActionId.ChannelSendPanning]: {
		source: string
		target: string
		pan: number
		fadeDuration: number
		fadeAlgorithm: string
		fadeType: string
	}
	[ActionId.ChannelSendPanningDelta]: {
		source: string
		target: string
		useVariable: boolean
		delta: number
		varDelta: string
		fadeDuration: number
		fadeAlgorithm: string
		fadeType: string
	}
	[ActionId.ChannelSendPanningStore]: {
		source: string
		target: string
	}
	[ActionId.ChannelSendPanningRestore]: {
		source: string
		target: string
		fadeDuration: number
		fadeAlgorithm: string
		fadeType: string
	}
	[ActionId.BusSendLevel]: {
		source: string
		target: string
		fad: number
		fadeDuration: number
		fadeAlgorithm: string
		fadeType: string
	}
	[ActionId.BusSendLevelDelta]: {
		source: string
		target: string
		useVariable: boolean
		delta: number
		varDelta: string
		fadeDuration: number
		fadeAlgorithm: string
		fadeType: string
	}
	[ActionId.BusSendLevelStore]: {
		source: string
		target: string
	}
	[ActionId.BusSendLevelRestore]: {
		source: string
		target: string
		fadeDuration: number
		fadeAlgorithm: string
		fadeType: string
	}
	[ActionId.BusSendPanning]: {
		source: string
		target: string
		pan: number
		fadeDuration: number
		fadeAlgorithm: string
		fadeType: string
	}
	[ActionId.BusSendPanningDelta]: {
		source: string
		target: string
		useVariable: boolean
		delta: number
		varDelta: string
		fadeDuration: number
		fadeAlgorithm: string
		fadeType: string
	}
	[ActionId.BusSendPanningStore]: {
		source: string
		target: string
	}
	[ActionId.BusSendPanningRestore]: {
		source: string
		target: string
		fadeDuration: number
		fadeAlgorithm: string
		fadeType: string
	}
	[ActionId.InputTrim]: {
		input: string
		trim: number
	}
	[ActionId.HeadampGain]: {
		headamp: string
		gain: number
	}
	[ActionId.Label]: {
		target: string
		lab: string
	}
	[ActionId.Color]: {
		target: string
		col: string
	}
	[ActionId.GoCue]: {
		cue: number
	}
	[ActionId.GoScene]: {
		scene: number
	}
	[ActionId.GoSnip]: {
		snip: number
	}
	[ActionId.Select]: {
		select: string
	}
	[ActionId.Solo]: {
		solo: string
		on: number
	}
	[ActionId.ClearSolo]: Record<string, never>
	[ActionId.Tape]: {
		tFunc: number
	}
	[ActionId.TalkbackTalk]: {
		channel: number
		on: number
	}
	[ActionId.TalkbackConfig]: {
		function: number
		dest: string
	}
	[ActionId.TalkbackConfigSingleSource]: {
		function: number
		dest: string
		on: number
	}
	[ActionId.TalkbackConfigStore]: {
		function: number
	}
	[ActionId.TalkbackConfigRestore]: {
		function: number
	}
	[ActionId.OscillatorEnable]: {
		on: number
	}
	[ActionId.OscillatorDestination]: {
		destination: string
	}
	[ActionId.SoloMono]: {
		on: number
	}
	[ActionId.SoloDim]: {
		on: number
	}
	[ActionId.SoloDimAttenuation]: {
		dimAtt: number
	}
	[ActionId.MonitorLevel]: {
		fad: number
		fadeDuration: number
		fadeAlgorithm: string
		fadeType: string
	}
	[ActionId.SyncClock]: Record<string, never>
	[ActionId.ChannelBank]: {
		bank: number
	}
	[ActionId.GroupBank]: {
		bank: number
	}
	[ActionId.ChannelBankCompact]: {
		bank: number
	}
	[ActionId.GroupBankCompact]: {
		bank: number
	}
	[ActionId.SendsOnFader]: {
		on: number
	}
	[ActionId.BusSendBank]: {
		bank: number
	}
	[ActionId.UserBank]: {
		bank: number
	}
	[ActionId.Screens]: {
		screen: number
	}
	[ActionId.MuteGroupScreen]: {
		on: number
	}
	[ActionId.UtilityScreen]: {
		on: number
	}
	[ActionId.ChannelPage]: {
		page: number
	}
	[ActionId.MeterPage]: {
		page: number
	}
	[ActionId.RoutePage]: {
		page: number
	}
	[ActionId.SetupPage]: {
		page: number
	}
	[ActionId.LibPage]: {
		page: number
	}
	[ActionId.FxPage]: {
		page: number
	}
	[ActionId.MonPage]: {
		page: number
	}
	[ActionId.USBPage]: {
		page: number
	}
	[ActionId.ScenePage]: {
		page: number
	}
	[ActionId.AssignPage]: {
		page: number
	}
	[ActionId.NextPrevPage]: {
		goto: number
	}
	[ActionId.RouteUserIn]: {
		source: number
		channel: number
	}
	[ActionId.RouteUserOut]: {
		source: number
		channel: number
	}
	[ActionId.StoreChannel]: {
		channel: number
	}
	[ActionId.RouteInputBlockMode]: {
		mode: number
	}
	[ActionId.RouteInputBlocks]: {
		mode: number
		block: number
		routing: number
	}
	[ActionId.RouteAuxBlocks]: {
		mode: number
		routing: number
	}
	[ActionId.RouteAES50Blocks]: {
		mode: number
		block: number
		routing: number
	}
	[ActionId.RouteCardBlocks]: {
		block: number
		routing: number
	}
	[ActionId.RouteXLRLeftOutputs]: {
		block: number
		routing: number
	}
	[ActionId.RouteXLRRightOutputs]: {
		block: number
		routing: number
	}
	[ActionId.LockAndShutdown]: {
		newState: number
	}
	[ActionId.SaveScene]: {
		sceneIndex: number
		sceneName: string
		sceneNote: string
	}
	[ActionId.SelectActiveSDCard]: {
		card: number
	}
	[ActionId.RecordedTracks]: {
		tracks: number
	}
	[ActionId.SelectPlaybackDevice]: {
		device: number
	}
	[ActionId.FormatSDCard]: {
		card: number
	}
	[ActionId.XLiveRouting]: {
		route: number
	}
	[ActionId.XLiveClearAlert]: {
		alert: number
	}
	[ActionId.XLivePosition]: {
		position: number
	}
	[ActionId.GoCommand]: Record<string, never>
	[ActionId.NextCommand]: Record<string, never>
	[ActionId.PrevCommand]: Record<string, never>
	[ActionId.InsertOn]: {
		src: string
		on: number
	}
	[ActionId.InsertPos]: {
		src: string
		pos: number
	}
	[ActionId.InsertSelect]: {
		src: string
		dest: number
	}
	[ActionId.LoadChannelPreset]: {
		preset: string
		channel: string
		ha: boolean
		config: boolean
		gate: boolean
		dyn: boolean
		eq: boolean
		sends: boolean
	}
	[ActionId.LoadFXPreset]: {
		preset: string
		channel: number
	}
	[ActionId.LoadAESPreset]: {
		preset: string
	}
	[ActionId.DoUndo]: Record<string, never>
	[ActionId.SetUndoCheckpoint]: Record<string, never>
}

export function GetActionsList(
	self: InstanceBaseExt,
	transitions: X32Transitions,
	state: X32State,
	ensureLoaded: (path: string | undefined) => void,
): CompanionActionDefinitions<ActionsSchema> {
	const levelsChoices = GetLevelsChoiceConfigs(state)
	const panningChoices = GetPanningChoiceConfigs(state)
	const muteGroups = GetMuteGroupChoices(state)
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

	const getOptNumber = (action: CompanionActionInfo, key: string, defVal?: number): number => {
		const rawVal = action.options[key]
		if (defVal !== undefined && rawVal === undefined) return defVal
		const val = Number(rawVal)
		if (isNaN(val)) {
			throw new Error(`Invalid option '${key}'`)
		}
		return val
	}

	const getDeltaNumber = async (action: CompanionActionInfo, defVal?: number): Promise<number> => {
		const useVariable = action.options.useVariable
		const rawVal = useVariable ? action.options.varDelta : action.options.delta
		if (defVal !== undefined && rawVal === undefined) return defVal
		const val = useVariable ? Number((rawVal as string).trim()) : Number(rawVal)
		if (isNaN(val) || val < -100 || val > 100) {
			return defVal ?? 0
		}
		return val
	}

	const getOptAlgorithm = (action: CompanionActionEvent, key: string): Easing.algorithm | undefined => {
		const rawVal = action.options[key]
		if (rawVal === undefined) {
			return rawVal
		}
		return rawVal as Easing.algorithm
	}

	const getOptCurve = (action: CompanionActionEvent, key: string): Easing.curve | undefined => {
		const rawVal = action.options[key]
		if (rawVal === undefined) {
			return rawVal
		}
		return rawVal as Easing.curve
	}

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
	const getResolveOnOffMute = (
		action: CompanionActionEvent,
		cmd: string,
		cmdIsCalledOn: boolean,
		prop: 'mute' | 'on' = 'mute',
	): number => {
		return getResolveOnOffMute2(action, state.get(cmd), cmdIsCalledOn, prop)
	}
	const getResolveOnOffMute2 = (
		action: CompanionActionEvent,
		cachedData: OSCMetaArgument[] | undefined,
		cmdIsCalledOn: boolean,
		prop: 'mute' | 'on' = 'mute',
	): number => {
		const onState = getOptNumber(action, prop)
		if (onState === MUTE_TOGGLE) {
			const currentVal = cachedData && cachedData[0]?.type === 'i' && cachedData[0]?.value
			if (typeof currentVal === 'number') {
				return currentVal === 0 ? 1 : 0
			} else {
				// default to off
				return cmdIsCalledOn ? 0 : 1
			}
		} else {
			return onState
		}
	}

	const actionSubscriptionWrapper = <TOptions extends CompanionOptionValues>(input: {
		getPath: (options: TOptions) => string | null
		execute: (
			evt: CompanionActionEvent<TOptions>,
			cachedData: OSCMetaArgument[] | undefined,
		) => OSCMetaArgument | OSCMetaArgument[] | undefined
		shouldSubscribe: ((options: TOptions) => boolean) | false
		optionsToMonitorForSubscribe: Extract<keyof TOptions, string>[]
	}): Pick<CompanionActionDefinition<TOptions>, 'callback' | 'subscribe' | 'optionsToMonitorForSubscribe'> => {
		return {
			callback: (evt: CompanionActionEvent<TOptions>) => {
				const path = input.getPath(evt.options)
				if (!path) return

				const cachedData = state.get(path)
				const values = input.execute(evt, cachedData)

				// Check if the action gave values
				if (!values) return

				sendOsc(path, values)
			},
			// Only define the subscribe method when it does something
			subscribe: input.shouldSubscribe
				? (evt: CompanionActionInfo<TOptions>) => {
						if (!input.shouldSubscribe) return

						const path = input.getPath(evt.options)
						if (path) ensureLoaded(path)
					}
				: undefined,
		}
	}

	const actions: CompanionActionDefinitions<ActionsSchema> = {
		[ActionId.Record]: {
			name: 'Set X-live State',
			options: [
				{
					type: 'dropdown',
					label: 'State',
					id: 'state',
					choices: [
						{ id: 3, label: 'Record' },
						{ id: 2, label: 'Play' },
						{ id: 1, label: 'Pause' },
						{ id: 0, label: 'Stop' },
					],
					default: 3,
					disableAutoExpression: true,
				},
			],
			...actionSubscriptionWrapper({
				getPath: () => `/-stat/urec/state`,
				execute: (action) => ({
					type: 'i',
					value: convertAnyToNumber(action.options.state),
				}),
				shouldSubscribe: false,
				optionsToMonitorForSubscribe: [],
			}),
		},
		[ActionId.AddMarker]: {
			name: 'Add marker in recording',
			options: [],
			...actionSubscriptionWrapper({
				getPath: () => `/-action/addmarker`,
				execute: () => ({
					type: 'i',
					value: 1,
				}),
				shouldSubscribe: false,
				optionsToMonitorForSubscribe: [],
			}),
		},
		[ActionId.Mute]: {
			name: 'Set mute',
			options: [
				{
					type: 'dropdown',
					label: 'Target',
					id: 'target',
					...convertChoices(levelsChoices.channels),
					allowInvalidValues: true,
				},
				MuteChoice,
			],
			...actionSubscriptionWrapper({
				getPath: (options) => {
					const refPaths = parseRefToPaths(options.target, levelsChoices.channelsParseOptions)
					return refPaths?.muteOrOn?.path || null
				},
				execute: (action) => {
					const refPaths = parseRefToPaths(action.options.target, levelsChoices.channelsParseOptions)
					if (!refPaths?.muteOrOn) return

					// TODO - how to avoid this lookup for isOn?

					return {
						type: 'i',
						value: getResolveOnOffMute(action, refPaths.muteOrOn.path, refPaths.muteOrOn.isOn),
					}
				},
				shouldSubscribe: (options) => options.mute === MUTE_TOGGLE,
				optionsToMonitorForSubscribe: ['target', 'mute'],
			}),
		},
		[ActionId.MuteGroup]: {
			name: 'Mute Group ON/OFF',
			options: [
				{
					type: 'dropdown',
					label: 'Mute Group',
					id: 'target',
					...convertChoices(muteGroups),
					allowInvalidValues: true,
				},
				{
					type: 'dropdown',
					label: 'Mute / Unmute',
					id: 'mute',
					...convertChoices(CHOICES_MUTE_GROUP),
					disableAutoExpression: true,
				},
			],
			...actionSubscriptionWrapper({
				getPath: (options) => {
					const muteGroupNumber = parseInt(options.target as string, 10)
					if (isNaN(muteGroupNumber)) return null

					return `/config/mute/${muteGroupNumber}`
				},
				execute: (action, cachedData) => ({
					type: 'i',
					value: getResolveOnOffMute2(action, cachedData, false),
				}),
				shouldSubscribe: (options) => options.mute === MUTE_TOGGLE,
				optionsToMonitorForSubscribe: ['target', 'mute'],
			}),
		},
		[ActionId.MuteChannelSend]: {
			name: 'Set mute for channel to bus send',
			options: [
				{
					type: 'dropdown',
					label: 'Source',
					id: 'source',
					...convertChoices(levelsChoices.allSources),
					allowInvalidValues: true,
				},
				{
					type: 'dropdown',
					label: 'Target',
					id: 'target',
					...convertChoices(GetTargetChoicesNew(state, GetChannelSendParseOptions)),
					allowInvalidValues: true,
				},
				MuteChoice,
			],
			callback: async (action): Promise<void> => {
				const sourceRef = parseRefToPaths(action.options.source, levelsChoices.allSourcesParseOptions)
				const targetRef = parseRefToPaths(action.options.target, GetChannelSendParseOptions)
				if (!sourceRef?.sendTo || !targetRef?.sendToSink?.on) return

				const cmd = `${sourceRef.sendTo.path}/${targetRef.sendToSink.on}`
				sendOsc(cmd, {
					type: 'i',
					value: getResolveOnOffMute(action, cmd, sourceRef.sendTo.isOn),
				})
			},
			subscribe: (evt): void => {
				if (evt.options.mute === MUTE_TOGGLE) {
					const sourceRef = parseRefToPaths(evt.options.source, levelsChoices.allSourcesParseOptions)
					const targetRef = parseRefToPaths(evt.options.target, GetChannelSendParseOptions)
					if (!sourceRef?.sendTo || !targetRef?.sendToSink?.on) return

					ensureLoaded(`${sourceRef.sendTo.path}/${targetRef.sendToSink.on}`)
				}
			},
		},
		[ActionId.MuteBusSend]: {
			name: 'Set mute for bus to matrix send',
			options: [
				{
					type: 'dropdown',
					label: 'Source',
					id: 'source',
					...convertChoices(levelsChoices.busSendSources),
					allowInvalidValues: true,
				},
				{
					type: 'dropdown',
					label: 'Target',
					id: 'target',
					...convertChoices(levelsChoices.busSendTargets),
					allowInvalidValues: true,
				},
				MuteChoice,
			],
			callback: async (action): Promise<void> => {
				const sourceRef = parseRefToPaths(action.options.source, levelsChoices.busSendSourcesParseOptions)
				const targetRef = parseRefToPaths(action.options.target, levelsChoices.busSendTargetsParseOptions)
				if (!sourceRef?.sendTo || !targetRef?.sendToSink?.on) return

				const cmd = `${sourceRef.sendTo.path}/${targetRef.sendToSink.on}`
				sendOsc(cmd, {
					type: 'i',
					value: getResolveOnOffMute(action, cmd, sourceRef.sendTo.isOn),
				})
			},
			subscribe: (evt): void => {
				if (evt.options.mute === MUTE_TOGGLE) {
					const sourceRef = parseRefToPaths(evt.options.source, levelsChoices.busSendSourcesParseOptions)
					const targetRef = parseRefToPaths(evt.options.target, levelsChoices.busSendTargetsParseOptions)
					if (!sourceRef?.sendTo || !targetRef?.sendToSink?.on) return

					ensureLoaded(`${sourceRef.sendTo.path}/${targetRef.sendToSink.on}`)
				}
			},
		},
		[ActionId.FaderLevel]: {
			name: 'Set fader level',
			options: [
				{
					type: 'dropdown',
					label: 'Target',
					id: 'target',
					...convertChoices(levelsChoices.channels),
					allowInvalidValues: true,
				},
				FaderLevelChoice,
				...FadeDurationChoice,
			],
			callback: async (action): Promise<void> => {
				const refPaths = parseRefToPaths(action.options.target, levelsChoices.channelsParseOptions)
				if (!refPaths?.level) return // Not a valid path

				const currentState = state.get(refPaths.level.path)
				const currentVal = currentState && currentState[0]?.type === 'f' ? floatToDB(currentState[0]?.value) : undefined
				transitions.runForDb(
					refPaths.level.path,
					currentVal,
					getOptNumber(action, 'fad'),
					getOptNumber(action, 'fadeDuration', 0),
					getOptAlgorithm(action, 'fadeAlgorithm'),
					getOptCurve(action, 'fadeType'),
				)
			},
			subscribe: (evt): void => {
				const refPaths = parseRefToPaths(evt.options.target, levelsChoices.channelsParseOptions)
				if (!refPaths?.level) return // Not a valid path

				// In case we have a fade time
				ensureLoaded(refPaths.level.path)
			},
		},
		[ActionId.FaderLevelStore]: {
			name: 'Store fader level',
			options: [
				{
					type: 'dropdown',
					label: 'Target',
					id: 'target',
					...convertChoices(levelsChoices.channels),
					allowInvalidValues: true,
				},
			],
			callback: async (action): Promise<void> => {
				const refPaths = parseRefToPaths(action.options.target, levelsChoices.channelsParseOptions)
				if (!refPaths?.level) return // Not a valid path

				const currentState = state.get(refPaths.level.path)
				const currentVal = currentState && currentState[0]?.type === 'f' ? floatToDB(currentState[0]?.value) : undefined
				if (currentVal !== undefined) {
					state.setPressValue(`${action.controlId}-${refPaths.level.path}`, currentVal)
				}
			},
			subscribe: (evt): void => {
				const refPaths = parseRefToPaths(evt.options.target, levelsChoices.channelsParseOptions)
				if (!refPaths?.level) return // Not a valid path

				ensureLoaded(refPaths.level.path)
			},
		},
		[ActionId.FaderLevelRestore]: {
			name: 'Restore fader level',
			options: [
				{
					type: 'dropdown',
					label: 'Target',
					id: 'target',
					...convertChoices(levelsChoices.channels),
					allowInvalidValues: true,
				},
				...FadeDurationChoice,
			],
			callback: async (action): Promise<void> => {
				const refPaths = parseRefToPaths(action.options.target, levelsChoices.channelsParseOptions)
				if (!refPaths?.level) return // Not a valid path

				const storedVal = state.popPressValue(`${action.controlId}-${refPaths.level.path}`)
				if (storedVal !== undefined) {
					const currentState = state.get(refPaths.level.path)
					const currentVal =
						currentState && currentState[0]?.type === 'f' ? floatToDB(currentState[0]?.value) : undefined
					if (currentVal !== undefined) {
						transitions.runForDb(refPaths.level.path, currentVal, storedVal, getOptNumber(action, 'fadeDuration', 0))
					}
				}
			},
		},
		[ActionId.FaderLevelDelta]: {
			name: 'Adjust fader level',
			options: [
				{
					type: 'dropdown',
					label: 'Target',
					id: 'target',
					...convertChoices(levelsChoices.channels),
					allowInvalidValues: true,
				},
				...FaderLevelDeltaChoice,
				...FadeDurationChoice,
			],
			callback: async (action): Promise<void> => {
				const refPaths = parseRefToPaths(action.options.target, levelsChoices.channelsParseOptions)
				if (!refPaths?.level) return // Not a valid path

				const currentState = state.get(refPaths.level.path)
				const currentVal = currentState && currentState[0]?.type === 'f' ? floatToDB(currentState[0]?.value) : undefined
				if (typeof currentVal === 'number') {
					transitions.runForDb(
						refPaths.level.path,
						currentVal,
						currentVal + (await getDeltaNumber(action, 0)),
						getOptNumber(action, 'fadeDuration', 0),
						getOptAlgorithm(action, 'fadeAlgorithm'),
						getOptCurve(action, 'fadeType'),
					)
				}
			},
			subscribe: (evt): void => {
				const refPaths = parseRefToPaths(evt.options.target, levelsChoices.channelsParseOptions)
				if (!refPaths?.level) return // Not a valid path

				ensureLoaded(refPaths.level.path)
			},
		},
		[ActionId.Panning]: {
			name: 'Set panning',
			options: [
				{
					type: 'dropdown',
					label: 'Target',
					id: 'target',
					...convertChoices(panningChoices.allSources),
					allowInvalidValues: true,
				},
				PanningChoice,
				...FadeDurationChoice,
			],
			callback: async (action): Promise<void> => {
				const refPaths = parseRefToPaths(action.options.target, panningChoices.allSourcesParseOptions)
				if (!refPaths?.pan) return // Not a valid path

				const currentState = state.get(refPaths.pan.path)
				const currentVal = currentState && currentState[0]?.type === 'f' ? currentState[0]?.value : undefined
				transitions.run(
					refPaths.pan.path,
					currentVal,
					getOptNumber(action, 'pan') / 100 + 0.5,
					getOptNumber(action, 'fadeDuration', 0),
					getOptAlgorithm(action, 'fadeAlgorithm'),
					getOptCurve(action, 'fadeType'),
				)
			},
			subscribe: (evt): void => {
				const refPaths = parseRefToPaths(evt.options.target, panningChoices.allSourcesParseOptions)
				if (!refPaths?.pan) return // Not a valid path

				ensureLoaded(refPaths.pan.path)
			},
		},
		[ActionId.PanningDelta]: {
			name: 'Adjust panning',
			options: [
				{
					type: 'dropdown',
					label: 'Target',
					id: 'target',
					...convertChoices(panningChoices.allSources),
					allowInvalidValues: true,
				},
				...PanningDelta,
				...FadeDurationChoice,
			],
			callback: async (action): Promise<void> => {
				const refPaths = parseRefToPaths(action.options.target, panningChoices.allSourcesParseOptions)
				if (!refPaths?.pan) return // Not a valid path

				const currentState = state.get(refPaths.pan.path)
				const currentVal = currentState && currentState[0]?.type === 'f' ? currentState[0]?.value : 0
				let newVal = currentVal + (await getDeltaNumber(action, 0)) / 100
				if (newVal < 0) {
					newVal = 0
				} else if (newVal > 1) {
					newVal = 1
				}
				transitions.run(
					refPaths.pan.path,
					currentVal,
					newVal,
					getOptNumber(action, 'fadeDuration', 0),
					getOptAlgorithm(action, 'fadeAlgorithm'),
					getOptCurve(action, 'fadeType'),
				)
			},
			subscribe: (evt): void => {
				const refPaths = parseRefToPaths(evt.options.target, panningChoices.allSourcesParseOptions)
				if (!refPaths?.pan) return // Not a valid path

				ensureLoaded(refPaths.pan.path)
			},
		},
		[ActionId.PanningStore]: {
			name: 'Store panning',
			options: [
				{
					type: 'dropdown',
					label: 'Target',
					id: 'target',
					...convertChoices(panningChoices.allSources),
					allowInvalidValues: true,
				},
			],
			callback: async (action): Promise<void> => {
				const refPaths = parseRefToPaths(action.options.target, panningChoices.allSourcesParseOptions)
				if (!refPaths?.pan) return // Not a valid path

				const currentState = state.get(refPaths.pan.path)
				const currentVal = currentState && currentState[0]?.type === 'f' ? currentState[0].value : undefined
				if (currentVal !== undefined) {
					state.setPressValue(`${action.controlId}-${refPaths.pan.path}`, currentVal)
				}
			},
			subscribe: (evt): void => {
				const refPaths = parseRefToPaths(evt.options.target, panningChoices.allSourcesParseOptions)
				if (!refPaths?.pan) return // Not a valid path

				ensureLoaded(refPaths.pan.path)
			},
		},
		[ActionId.PanningRestore]: {
			name: 'Restore panning',
			options: [
				{
					type: 'dropdown',
					label: 'Target',
					id: 'target',
					...convertChoices(panningChoices.allSources),
					allowInvalidValues: true,
				},
				...FadeDurationChoice,
			],
			callback: async (action): Promise<void> => {
				const refPaths = parseRefToPaths(action.options.target, panningChoices.allSourcesParseOptions)
				if (!refPaths?.pan) return // Not a valid path

				const storedVal = state.popPressValue(`${action.controlId}-${refPaths.pan.path}`)
				if (storedVal != undefined) {
					const currentState = state.get(refPaths.pan.path)
					const currentVal = currentState && currentState[0]?.type === 'f' ? currentState[0].value : undefined
					if (currentVal !== undefined) {
						transitions.run(
							refPaths.pan.path,
							currentVal,
							storedVal,
							getOptNumber(action, 'fadeDuration', 0),
							getOptAlgorithm(action, 'fadeAlgorithm'),
							getOptCurve(action, 'fadeType'),
						)
					}
				}
			},
			subscribe: (evt): void => {
				const refPaths = parseRefToPaths(evt.options.target, panningChoices.allSourcesParseOptions)
				if (!refPaths?.pan) return // Not a valid path

				ensureLoaded(refPaths.pan.path)
			},
		},
		[ActionId.ChannelSendLevel]: {
			name: 'Set level of channel to bus send',
			options: [
				{
					type: 'dropdown',
					label: 'Source',
					id: 'source',
					...convertChoices(levelsChoices.allSources),
					allowInvalidValues: true,
				},
				{
					type: 'dropdown',
					label: 'Target',
					id: 'target',
					...convertChoices(levelsChoices.channelSendTargets),
					allowInvalidValues: true,
				},
				FaderLevelChoice,
				...FadeDurationChoice,
			],
			callback: async (action): Promise<void> => {
				const sourceRef = parseRefToPaths(action.options.source, levelsChoices.allSourcesParseOptions)
				const targetRef = parseRefToPaths(action.options.target, levelsChoices.channelSendTargetsParseOptions)
				if (!sourceRef?.sendTo || !targetRef?.sendToSink?.level) return

				const cmd = `${sourceRef.sendTo.path}/${targetRef.sendToSink.level}`
				const currentState = state.get(cmd)
				const currentVal = currentState && currentState[0]?.type === 'f' ? floatToDB(currentState[0]?.value) : undefined
				transitions.runForDb(
					cmd,
					currentVal,
					getOptNumber(action, 'fad'),
					getOptNumber(action, 'fadeDuration', 0),
					getOptAlgorithm(action, 'fadeAlgorithm'),
					getOptCurve(action, 'fadeType'),
				)
			},
			subscribe: (evt): void => {
				const sourceRef = parseRefToPaths(evt.options.source, levelsChoices.allSourcesParseOptions)
				const targetRef = parseRefToPaths(evt.options.target, levelsChoices.channelSendTargetsParseOptions)
				if (!sourceRef?.sendTo || !targetRef?.sendToSink?.level) return

				// In case we have a fade time
				ensureLoaded(`${sourceRef.sendTo.path}/${targetRef.sendToSink.level}`)
			},
		},
		[ActionId.ChannelSendLevelDelta]: {
			name: 'Adjust level of channel to bus send',
			options: [
				{
					type: 'dropdown',
					label: 'Source',
					id: 'source',
					...convertChoices(levelsChoices.allSources),
					allowInvalidValues: true,
				},
				{
					type: 'dropdown',
					label: 'Target',
					id: 'target',
					...convertChoices(levelsChoices.channelSendTargets),
					allowInvalidValues: true,
				},
				...FaderLevelDeltaChoice,
				...FadeDurationChoice,
			],
			callback: async (action): Promise<void> => {
				const sourceRef = parseRefToPaths(action.options.source, levelsChoices.allSourcesParseOptions)
				const targetRef = parseRefToPaths(action.options.target, levelsChoices.channelSendTargetsParseOptions)
				if (!sourceRef?.sendTo || !targetRef?.sendToSink?.level) return

				const cmd = `${sourceRef.sendTo.path}/${targetRef.sendToSink.level}`
				const currentState = state.get(cmd)
				const currentVal = currentState && currentState[0]?.type === 'f' ? floatToDB(currentState[0]?.value) : undefined
				if (typeof currentVal === 'number') {
					transitions.runForDb(
						cmd,
						currentVal,
						currentVal + (await getDeltaNumber(action, 0)),
						getOptNumber(action, 'fadeDuration', 0),
					)
				}
			},
			subscribe: (evt): void => {
				const sourceRef = parseRefToPaths(evt.options.source, levelsChoices.allSourcesParseOptions)
				const targetRef = parseRefToPaths(evt.options.target, levelsChoices.channelSendTargetsParseOptions)
				if (!sourceRef?.sendTo || !targetRef?.sendToSink?.level) return

				// In case we have a fade time
				ensureLoaded(`${sourceRef.sendTo.path}/${targetRef.sendToSink.level}`)
			},
		},
		[ActionId.ChannelSendLevelStore]: {
			name: 'Store level of channel to bus send',
			options: [
				{
					type: 'dropdown',
					label: 'Source',
					id: 'source',
					...convertChoices(levelsChoices.allSources),
					allowInvalidValues: true,
				},
				{
					type: 'dropdown',
					label: 'Target',
					id: 'target',
					...convertChoices(levelsChoices.channelSendTargets),
					allowInvalidValues: true,
				},
			],
			callback: async (action): Promise<void> => {
				const sourceRef = parseRefToPaths(action.options.source, levelsChoices.allSourcesParseOptions)
				const targetRef = parseRefToPaths(action.options.target, levelsChoices.channelSendTargetsParseOptions)
				if (!sourceRef?.sendTo || !targetRef?.sendToSink?.level) return

				const cmd = `${sourceRef.sendTo.path}/${targetRef.sendToSink.level}`
				const currentState = state.get(cmd)
				const currentVal = currentState && currentState[0]?.type === 'f' ? floatToDB(currentState[0]?.value) : undefined
				if (currentVal !== undefined) {
					state.setPressValue(`${action.controlId}-${cmd}`, currentVal)
				}
			},
			subscribe: (evt): void => {
				const sourceRef = parseRefToPaths(evt.options.source, levelsChoices.allSourcesParseOptions)
				const targetRef = parseRefToPaths(evt.options.target, levelsChoices.channelSendTargetsParseOptions)
				if (!sourceRef?.sendTo || !targetRef?.sendToSink?.level) return

				// In case we have a fade time
				ensureLoaded(`${sourceRef.sendTo.path}/${targetRef.sendToSink.level}`)
			},
		},
		[ActionId.ChannelSendLevelRestore]: {
			name: 'Restore level of channel to bus send',
			options: [
				{
					type: 'dropdown',
					label: 'Source',
					id: 'source',
					...convertChoices(levelsChoices.allSources),
					allowInvalidValues: true,
				},
				{
					type: 'dropdown',
					label: 'Target',
					id: 'target',
					...convertChoices(levelsChoices.channelSendTargets),
					allowInvalidValues: true,
				},
				...FadeDurationChoice,
			],
			callback: async (action): Promise<void> => {
				const sourceRef = parseRefToPaths(action.options.source, levelsChoices.allSourcesParseOptions)
				const targetRef = parseRefToPaths(action.options.target, levelsChoices.channelSendTargetsParseOptions)
				if (!sourceRef?.sendTo || !targetRef?.sendToSink?.level) return

				const cmd = `${sourceRef.sendTo.path}/${targetRef.sendToSink.level}`
				const storedVal = state.popPressValue(`${action.controlId}-${cmd}`)
				if (storedVal !== undefined) {
					const currentState = state.get(cmd)
					const currentVal =
						currentState && currentState[0]?.type === 'f' ? floatToDB(currentState[0]?.value) : undefined
					if (currentVal !== undefined) {
						transitions.runForDb(
							cmd,
							currentVal,
							storedVal,
							getOptNumber(action, 'fadeDuration', 0),
							getOptAlgorithm(action, 'fadeAlgorithm'),
							getOptCurve(action, 'fadeType'),
						)
					}
				}
			},
		},
		[ActionId.ChannelSendPanning]: {
			name: 'Set panning on channel to bus send',
			options: [
				{
					type: 'dropdown',
					label: 'Source',
					id: 'source',
					...convertChoices(panningChoices.allSources),
					allowInvalidValues: true,
				},
				{
					type: 'dropdown',
					label: 'Target',
					id: 'target',
					...convertChoices(panningChoices.channelSendTargets),
					allowInvalidValues: true,
				},
				PanningChoice,
				...FadeDurationChoice,
			],
			callback: async (action): Promise<void> => {
				const sourceRef = parseRefToPaths(action.options.source, levelsChoices.allSourcesParseOptions)
				const targetRef = parseRefToPaths(action.options.target, levelsChoices.channelSendTargetsParseOptions)
				if (!sourceRef?.sendTo || !targetRef?.sendToSink?.pan) return

				const cmd = `${sourceRef.sendTo.path}/${targetRef.sendToSink.pan}`
				const currentState = state.get(cmd)
				const currentVal = currentState && currentState[0]?.type === 'f' ? currentState[0]?.value : undefined
				transitions.run(
					cmd,
					currentVal,
					getOptNumber(action, 'pan') / 100 + 0.5,
					getOptNumber(action, 'fadeDuration', 0),
					getOptAlgorithm(action, 'fadeAlgorithm'),
					getOptCurve(action, 'fadeType'),
				)
			},
			subscribe: (evt): void => {
				const sourceRef = parseRefToPaths(evt.options.source, levelsChoices.allSourcesParseOptions)
				const targetRef = parseRefToPaths(evt.options.target, levelsChoices.channelSendTargetsParseOptions)
				if (!sourceRef?.sendTo || !targetRef?.sendToSink?.pan) return

				ensureLoaded(`${sourceRef.sendTo.path}/${targetRef.sendToSink.pan}`)
			},
		},
		[ActionId.ChannelSendPanningDelta]: {
			name: 'Adjust panning on channel to bus send',
			options: [
				{
					type: 'dropdown',
					label: 'Source',
					id: 'source',
					...convertChoices(panningChoices.allSources),
					allowInvalidValues: true,
				},
				{
					type: 'dropdown',
					label: 'Target',
					id: 'target',
					...convertChoices(panningChoices.channelSendTargets),
					allowInvalidValues: true,
				},
				...PanningDelta,
				...FadeDurationChoice,
			],
			callback: async (action): Promise<void> => {
				const sourceRef = parseRefToPaths(action.options.source, levelsChoices.allSourcesParseOptions)
				const targetRef = parseRefToPaths(action.options.target, levelsChoices.channelSendTargetsParseOptions)
				if (!sourceRef?.sendTo || !targetRef?.sendToSink?.pan) return

				const cmd = `${sourceRef.sendTo.path}/${targetRef.sendToSink.pan}`
				const currentState = state.get(cmd)
				const currentVal = currentState && currentState[0]?.type === 'f' ? currentState[0]?.value : 0
				let newVal = currentVal + (await getDeltaNumber(action, 0)) / 100
				if (newVal < 0) {
					newVal = 0
				} else if (newVal > 1) {
					newVal = 1
				}
				transitions.run(
					cmd,
					currentVal,
					newVal,
					getOptNumber(action, 'fadeDuration', 0),
					getOptAlgorithm(action, 'fadeAlgorithm'),
					getOptCurve(action, 'fadeType'),
				)
			},
			subscribe: (evt): void => {
				const sourceRef = parseRefToPaths(evt.options.source, levelsChoices.allSourcesParseOptions)
				const targetRef = parseRefToPaths(evt.options.target, levelsChoices.channelSendTargetsParseOptions)
				if (!sourceRef?.sendTo || !targetRef?.sendToSink?.pan) return

				ensureLoaded(`${sourceRef.sendTo.path}/${targetRef.sendToSink.pan}`)
			},
		},
		[ActionId.ChannelSendPanningStore]: {
			name: 'Store panning on channel to bus send',
			options: [
				{
					type: 'dropdown',
					label: 'Source',
					id: 'source',
					...convertChoices(panningChoices.allSources),
					allowInvalidValues: true,
				},
				{
					type: 'dropdown',
					label: 'Target',
					id: 'target',
					...convertChoices(panningChoices.channelSendTargets),
					allowInvalidValues: true,
				},
			],
			callback: async (action): Promise<void> => {
				const sourceRef = parseRefToPaths(action.options.source, levelsChoices.allSourcesParseOptions)
				const targetRef = parseRefToPaths(action.options.target, levelsChoices.channelSendTargetsParseOptions)
				if (!sourceRef?.sendTo || !targetRef?.sendToSink?.pan) return

				const cmd = `${sourceRef.sendTo.path}/${targetRef.sendToSink.pan}`
				const currentState = state.get(cmd)
				const currentVal = currentState && currentState[0]?.type === 'f' ? currentState[0].value : undefined
				if (currentVal !== undefined) {
					state.setPressValue(`${action.controlId}-${cmd}`, currentVal)
				}
			},
			subscribe: (evt): void => {
				const sourceRef = parseRefToPaths(evt.options.source, levelsChoices.allSourcesParseOptions)
				const targetRef = parseRefToPaths(evt.options.target, levelsChoices.channelSendTargetsParseOptions)
				if (!sourceRef?.sendTo || !targetRef?.sendToSink?.pan) return

				ensureLoaded(`${sourceRef.sendTo.path}/${targetRef.sendToSink.pan}`)
			},
		},
		[ActionId.ChannelSendPanningRestore]: {
			name: 'Restore panning on channel to bus send',
			options: [
				{
					type: 'dropdown',
					label: 'Source',
					id: 'source',
					...convertChoices(panningChoices.allSources),
					allowInvalidValues: true,
				},
				{
					type: 'dropdown',
					label: 'Target',
					id: 'target',
					...convertChoices(panningChoices.channelSendTargets),
					allowInvalidValues: true,
				},
				...FadeDurationChoice,
			],
			callback: async (action): Promise<void> => {
				const sourceRef = parseRefToPaths(action.options.source, levelsChoices.allSourcesParseOptions)
				const targetRef = parseRefToPaths(action.options.target, levelsChoices.channelSendTargetsParseOptions)
				if (!sourceRef?.sendTo || !targetRef?.sendToSink?.pan) return

				const cmd = `${sourceRef.sendTo.path}/${targetRef.sendToSink.pan}`
				const storedVal = state.popPressValue(`${action.controlId}-${cmd}`)
				if (storedVal != undefined) {
					const currentState = state.get(cmd)
					const currentVal = currentState && currentState[0]?.type === 'f' ? currentState[0].value : undefined
					if (currentVal !== undefined) {
						transitions.run(
							cmd,
							currentVal,
							storedVal,
							getOptNumber(action, 'fadeDuration', 0),
							getOptAlgorithm(action, 'fadeAlgorithm'),
							getOptCurve(action, 'fadeType'),
						)
					}
				}
			},
			subscribe: (evt): void => {
				const sourceRef = parseRefToPaths(evt.options.source, levelsChoices.allSourcesParseOptions)
				const targetRef = parseRefToPaths(evt.options.target, levelsChoices.channelSendTargetsParseOptions)
				if (!sourceRef?.sendTo || !targetRef?.sendToSink?.pan) return

				ensureLoaded(`${sourceRef.sendTo.path}/${targetRef.sendToSink.pan}`)
			},
		},
		[ActionId.BusSendLevel]: {
			name: 'Set level of bus to matrix send',
			options: [
				{
					type: 'dropdown',
					label: 'Source',
					id: 'source',
					...convertChoices(levelsChoices.busSendSources),
					allowInvalidValues: true,
				},
				{
					type: 'dropdown',
					label: 'Target',
					id: 'target',
					...convertChoices(levelsChoices.busSendTargets),
					allowInvalidValues: true,
				},
				FaderLevelChoice,
				...FadeDurationChoice,
			],
			callback: async (action): Promise<void> => {
				const sourceRef = parseRefToPaths(action.options.source, levelsChoices.busSendSourcesParseOptions)
				const targetRef = parseRefToPaths(action.options.target, levelsChoices.busSendTargetsParseOptions)
				if (!sourceRef?.sendTo || !targetRef?.sendToSink?.level) return

				const cmd = `${sourceRef.sendTo.path}/${targetRef.sendToSink.level}`
				const currentState = state.get(cmd)
				const currentVal = currentState && currentState[0]?.type === 'f' ? floatToDB(currentState[0]?.value) : undefined
				transitions.runForDb(cmd, currentVal, getOptNumber(action, 'fad'), getOptNumber(action, 'fadeDuration', 0))
			},
			subscribe: (evt): void => {
				const sourceRef = parseRefToPaths(evt.options.source, levelsChoices.busSendSourcesParseOptions)
				const targetRef = parseRefToPaths(evt.options.target, levelsChoices.busSendTargetsParseOptions)
				if (!sourceRef?.sendTo || !targetRef?.sendToSink?.level) return

				// In case we have a fade time
				ensureLoaded(`${sourceRef.sendTo.path}/${targetRef.sendToSink.level}`)
			},
		},
		[ActionId.BusSendLevelDelta]: {
			name: 'Adjust level of bus to matrix send',
			options: [
				{
					type: 'dropdown',
					label: 'Source',
					id: 'source',
					...convertChoices(levelsChoices.busSendSources),
					allowInvalidValues: true,
				},
				{
					type: 'dropdown',
					label: 'Target',
					id: 'target',
					...convertChoices(levelsChoices.busSendTargets),
					allowInvalidValues: true,
				},
				...FaderLevelDeltaChoice,
				...FadeDurationChoice,
			],
			callback: async (action): Promise<void> => {
				const sourceRef = parseRefToPaths(action.options.source, levelsChoices.busSendSourcesParseOptions)
				const targetRef = parseRefToPaths(action.options.target, levelsChoices.busSendTargetsParseOptions)
				if (!sourceRef?.sendTo || !targetRef?.sendToSink?.level) return

				const cmd = `${sourceRef.sendTo.path}/${targetRef.sendToSink.level}`
				const currentState = state.get(cmd)
				const currentVal = currentState && currentState[0]?.type === 'f' ? floatToDB(currentState[0]?.value) : undefined
				if (typeof currentVal === 'number') {
					transitions.runForDb(
						cmd,
						currentVal,
						currentVal + (await getDeltaNumber(action, 0)),
						getOptNumber(action, 'fadeDuration', 0),
					)
				}
			},
			subscribe: (evt): void => {
				const sourceRef = parseRefToPaths(evt.options.source, levelsChoices.busSendSourcesParseOptions)
				const targetRef = parseRefToPaths(evt.options.target, levelsChoices.busSendTargetsParseOptions)
				if (!sourceRef?.sendTo || !targetRef?.sendToSink?.level) return

				// In case we have a fade time
				ensureLoaded(`${sourceRef.sendTo.path}/${targetRef.sendToSink.level}`)
			},
		},
		[ActionId.BusSendLevelStore]: {
			name: 'Store level of bus to matrix send',
			options: [
				{
					type: 'dropdown',
					label: 'Source',
					id: 'source',
					...convertChoices(levelsChoices.busSendSources),
					allowInvalidValues: true,
				},
				{
					type: 'dropdown',
					label: 'Target',
					id: 'target',
					...convertChoices(levelsChoices.busSendTargets),
					allowInvalidValues: true,
				},
			],
			callback: async (action): Promise<void> => {
				const sourceRef = parseRefToPaths(action.options.source, levelsChoices.busSendSourcesParseOptions)
				const targetRef = parseRefToPaths(action.options.target, levelsChoices.busSendTargetsParseOptions)
				if (!sourceRef?.sendTo || !targetRef?.sendToSink?.level) return

				const cmd = `${sourceRef.sendTo.path}/${targetRef.sendToSink.level}`
				const currentState = state.get(cmd)
				const currentVal = currentState && currentState[0]?.type === 'f' ? floatToDB(currentState[0]?.value) : undefined
				if (currentVal !== undefined) {
					state.setPressValue(`${action.controlId}-${cmd}`, currentVal)
				}
			},
			subscribe: (evt): void => {
				const sourceRef = parseRefToPaths(evt.options.source, levelsChoices.busSendSourcesParseOptions)
				const targetRef = parseRefToPaths(evt.options.target, levelsChoices.busSendTargetsParseOptions)
				if (!sourceRef?.sendTo || !targetRef?.sendToSink?.level) return

				// In case we have a fade time
				ensureLoaded(`${sourceRef.sendTo.path}/${targetRef.sendToSink.level}`)
			},
		},
		[ActionId.BusSendLevelRestore]: {
			name: 'Restore level of bus to matrix send',
			options: [
				{
					type: 'dropdown',
					label: 'Source',
					id: 'source',
					...convertChoices(levelsChoices.busSendSources),
					allowInvalidValues: true,
				},
				{
					type: 'dropdown',
					label: 'Target',
					id: 'target',
					...convertChoices(levelsChoices.busSendTargets),
					allowInvalidValues: true,
				},
				...FadeDurationChoice,
			],
			callback: async (action): Promise<void> => {
				const sourceRef = parseRefToPaths(action.options.source, levelsChoices.busSendSourcesParseOptions)
				const targetRef = parseRefToPaths(action.options.target, levelsChoices.busSendTargetsParseOptions)
				if (!sourceRef?.sendTo || !targetRef?.sendToSink?.level) return

				const cmd = `${sourceRef.sendTo.path}/${targetRef.sendToSink.level}`
				const storedVal = state.popPressValue(`${action.controlId}-${cmd}`)
				if (storedVal !== undefined) {
					const currentState = state.get(cmd)
					const currentVal =
						currentState && currentState[0]?.type === 'f' ? floatToDB(currentState[0]?.value) : undefined
					if (currentVal !== undefined) {
						transitions.runForDb(
							cmd,
							currentVal,
							storedVal,
							getOptNumber(action, 'fadeDuration', 0),
							getOptAlgorithm(action, 'fadeAlgorithm'),
							getOptCurve(action, 'fadeType'),
						)
					}
				}
			},
		},
		[ActionId.BusSendPanning]: {
			name: 'Set panning on bus to matrix send',
			options: [
				{
					type: 'dropdown',
					label: 'Source',
					id: 'source',
					...convertChoices(panningChoices.busSendSource),
					allowInvalidValues: true,
				},
				{
					type: 'dropdown',
					label: 'Target',
					id: 'target',
					...convertChoices(panningChoices.busSendTarget),
					allowInvalidValues: true,
				},
				PanningChoice,
				...FadeDurationChoice,
			],
			callback: async (action): Promise<void> => {
				const sourceRef = parseRefToPaths(action.options.source, panningChoices.busSendSourceParseOptions)
				const targetRef = parseRefToPaths(action.options.target, panningChoices.busSendTargetParseOptions)
				if (!sourceRef?.sendTo || !targetRef?.sendToSink?.pan) return

				const cmd = `${sourceRef.sendTo.path}/${targetRef.sendToSink.pan}`
				const currentState = state.get(cmd)
				const currentVal = currentState && currentState[0]?.type === 'f' ? currentState[0]?.value : undefined
				transitions.run(
					cmd,
					currentVal,
					getOptNumber(action, 'pan') / 100 + 0.5,
					getOptNumber(action, 'fadeDuration', 0),
					getOptAlgorithm(action, 'fadeAlgorithm'),
					getOptCurve(action, 'fadeType'),
				)
			},
			subscribe: (evt): void => {
				const sourceRef = parseRefToPaths(evt.options.source, panningChoices.busSendSourceParseOptions)
				const targetRef = parseRefToPaths(evt.options.target, panningChoices.busSendTargetParseOptions)
				if (!sourceRef?.sendTo || !targetRef?.sendToSink?.pan) return

				// In case we have a fade time
				ensureLoaded(`${sourceRef.sendTo.path}/${targetRef.sendToSink.pan}`)
			},
		},
		[ActionId.BusSendPanningDelta]: {
			name: 'Adjust panning on bus to matrix bus send',
			options: [
				{
					type: 'dropdown',
					label: 'Source',
					id: 'source',
					...convertChoices(panningChoices.busSendSource),
					allowInvalidValues: true,
				},
				{
					type: 'dropdown',
					label: 'Target',
					id: 'target',
					...convertChoices(panningChoices.busSendTarget),
					allowInvalidValues: true,
				},
				...PanningDelta,
				...FadeDurationChoice,
			],
			callback: async (action): Promise<void> => {
				const sourceRef = parseRefToPaths(action.options.source, panningChoices.busSendSourceParseOptions)
				const targetRef = parseRefToPaths(action.options.target, panningChoices.busSendTargetParseOptions)
				if (!sourceRef?.sendTo || !targetRef?.sendToSink?.pan) return

				const cmd = `${sourceRef.sendTo.path}/${targetRef.sendToSink.pan}`
				const currentState = state.get(cmd)
				const currentVal = currentState && currentState[0]?.type === 'f' ? currentState[0]?.value : 0
				let newVal = currentVal + (await getDeltaNumber(action, 0)) / 100
				if (newVal < 0) {
					newVal = 0
				} else if (newVal > 1) {
					newVal = 1
				}
				transitions.run(
					cmd,
					currentVal,
					newVal,
					getOptNumber(action, 'fadeDuration', 0),
					getOptAlgorithm(action, 'fadeAlgorithm'),
					getOptCurve(action, 'fadeType'),
				)
			},
			subscribe: (evt): void => {
				const sourceRef = parseRefToPaths(evt.options.source, panningChoices.busSendSourceParseOptions)
				const targetRef = parseRefToPaths(evt.options.target, panningChoices.busSendTargetParseOptions)
				if (!sourceRef?.sendTo || !targetRef?.sendToSink?.pan) return

				// In case we have a fade time
				ensureLoaded(`${sourceRef.sendTo.path}/${targetRef.sendToSink.pan}`)
			},
		},
		[ActionId.BusSendPanningStore]: {
			name: 'Store panning on bus to matrix send',
			options: [
				{
					type: 'dropdown',
					label: 'Source',
					id: 'source',
					...convertChoices(panningChoices.busSendSource),
					allowInvalidValues: true,
				},
				{
					type: 'dropdown',
					label: 'Target',
					id: 'target',
					...convertChoices(panningChoices.busSendTarget),
					allowInvalidValues: true,
				},
			],
			callback: async (action): Promise<void> => {
				const sourceRef = parseRefToPaths(action.options.source, panningChoices.busSendSourceParseOptions)
				const targetRef = parseRefToPaths(action.options.target, panningChoices.busSendTargetParseOptions)
				if (!sourceRef?.sendTo || !targetRef?.sendToSink?.pan) return

				const cmd = `${sourceRef.sendTo.path}/${targetRef.sendToSink.pan}`
				const currentState = state.get(cmd)
				const currentVal = currentState && currentState[0]?.type === 'f' ? currentState[0].value : undefined
				if (currentVal !== undefined) {
					state.setPressValue(`${action.controlId}-${cmd}`, currentVal)
				}
			},
			subscribe: (evt): void => {
				const sourceRef = parseRefToPaths(evt.options.source, panningChoices.busSendSourceParseOptions)
				const targetRef = parseRefToPaths(evt.options.target, panningChoices.busSendTargetParseOptions)
				if (!sourceRef?.sendTo || !targetRef?.sendToSink?.pan) return

				// In case we have a fade time
				ensureLoaded(`${sourceRef.sendTo.path}/${targetRef.sendToSink.pan}`)
			},
		},
		[ActionId.BusSendPanningRestore]: {
			name: 'Restore panning on bus to matrix send',
			options: [
				{
					type: 'dropdown',
					label: 'Source',
					id: 'source',
					...convertChoices(panningChoices.busSendSource),
					allowInvalidValues: true,
				},
				{
					type: 'dropdown',
					label: 'Target',
					id: 'target',
					...convertChoices(panningChoices.busSendTarget),
					allowInvalidValues: true,
				},
				...FadeDurationChoice,
			],
			callback: async (action): Promise<void> => {
				const sourceRef = parseRefToPaths(action.options.source, panningChoices.busSendSourceParseOptions)
				const targetRef = parseRefToPaths(action.options.target, panningChoices.busSendTargetParseOptions)
				if (!sourceRef?.sendTo || !targetRef?.sendToSink?.pan) return

				const cmd = `${sourceRef.sendTo.path}/${targetRef.sendToSink.pan}`
				const storedVal = state.popPressValue(`${action.controlId}-${cmd}`)
				if (storedVal != undefined) {
					const currentState = state.get(cmd)
					const currentVal = currentState && currentState[0]?.type === 'f' ? currentState[0].value : undefined
					if (currentVal !== undefined) {
						transitions.run(
							cmd,
							currentVal,
							storedVal,
							getOptNumber(action, 'fadeDuration', 0),
							getOptAlgorithm(action, 'fadeAlgorithm'),
							getOptCurve(action, 'fadeType'),
						)
					}
				}
			},
			subscribe: (evt): void => {
				const sourceRef = parseRefToPaths(evt.options.source, panningChoices.busSendSourceParseOptions)
				const targetRef = parseRefToPaths(evt.options.target, panningChoices.busSendTargetParseOptions)
				if (!sourceRef?.sendTo || !targetRef?.sendToSink?.pan) return

				// In case we have a fade time
				ensureLoaded(`${sourceRef.sendTo.path}/${targetRef.sendToSink.pan}`)
			},
		},
		[ActionId.InputTrim]: {
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
		[ActionId.HeadampGain]: {
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
		[ActionId.Label]: {
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

		[ActionId.Color]: {
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

		[ActionId.GoCue]: {
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
		[ActionId.GoScene]: {
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
		[ActionId.GoSnip]: {
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
		[ActionId.Select]: {
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
		[ActionId.Solo]: {
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
		[ActionId.ClearSolo]: {
			name: 'Clear Solo',
			options: [],
			callback: async (): Promise<void> => {
				sendOsc(`/-action/clearsolo`, {
					type: 'i',
					value: 1,
				})
			},
		},
		[ActionId.Tape]: {
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
		[ActionId.TalkbackTalk]: {
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
		[ActionId.TalkbackConfig]: {
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
		[ActionId.TalkbackConfigSingleSource]: {
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
		[ActionId.TalkbackConfigStore]: {
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
		[ActionId.TalkbackConfigRestore]: {
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

		[ActionId.OscillatorEnable]: {
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
		[ActionId.OscillatorDestination]: {
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
		[ActionId.SoloMono]: {
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
		[ActionId.SoloDim]: {
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
		[ActionId.SoloDimAttenuation]: {
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
		[ActionId.MonitorLevel]: {
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
		[ActionId.SyncClock]: {
			name: 'Sync console time',
			options: [],
			callback: async (): Promise<void> => {
				sendOsc(`/-action/setclock`, {
					type: 's',
					value: formatDate(new Date(), 'YYYYMMddHHmmss'),
				})
			},
		},
		[ActionId.ChannelBank]: {
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
		[ActionId.GroupBank]: {
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
		[ActionId.ChannelBankCompact]: {
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
		[ActionId.GroupBankCompact]: {
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
		[ActionId.SendsOnFader]: {
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
		[ActionId.BusSendBank]: {
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
		[ActionId.UserBank]: {
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
		[ActionId.Screens]: {
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
		[ActionId.MuteGroupScreen]: {
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
		[ActionId.UtilityScreen]: {
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
		[ActionId.ChannelPage]: {
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
		[ActionId.MeterPage]: {
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
		[ActionId.RoutePage]: {
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
		[ActionId.SetupPage]: {
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
		[ActionId.LibPage]: {
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
		[ActionId.FxPage]: {
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
		[ActionId.MonPage]: {
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
		[ActionId.USBPage]: {
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
		[ActionId.ScenePage]: {
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
		[ActionId.AssignPage]: {
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
		[ActionId.NextPrevPage]: {
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
		[ActionId.RouteUserIn]: {
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
				let channel = action.options.channel as number
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
		[ActionId.RouteUserOut]: {
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
				let channel = action.options.channel as number
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
		[ActionId.StoreChannel]: {
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
				state.setStoredChannel(action.options.channel as number)
			},
		},
		[ActionId.RouteInputBlockMode]: {
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
		[ActionId.RouteInputBlocks]: {
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
		[ActionId.RouteAuxBlocks]: {
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
		[ActionId.RouteAES50Blocks]: {
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
		[ActionId.RouteCardBlocks]: {
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
		[ActionId.RouteXLRLeftOutputs]: {
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
		[ActionId.RouteXLRRightOutputs]: {
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
		[ActionId.LockAndShutdown]: {
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
				let newState = action.options.newState ? (action.options.newState as number) : 0

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
		[ActionId.SaveScene]: {
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
				const index = action.options.sceneIndex as number
				const name = action.options.sceneName ? (action.options.sceneName as string) : ''
				const note = action.options.sceneNote ? (action.options.sceneNote as string) : ''
				sendOsc('/save', [
					{ type: 's', value: 'scene' },
					{ type: 'i', value: index },
					{ type: 's', value: name },
					{ type: 's', value: note },
				])
			},
		},
		[ActionId.SelectActiveSDCard]: {
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
		[ActionId.RecordedTracks]: {
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
		[ActionId.SelectPlaybackDevice]: {
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
		[ActionId.FormatSDCard]: {
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

		[ActionId.XLiveRouting]: {
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
		[ActionId.XLiveClearAlert]: {
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
		[ActionId.XLivePosition]: {
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
		[ActionId.GoCommand]: {
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
		[ActionId.NextCommand]: {
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
		[ActionId.PrevCommand]: {
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
		[ActionId.InsertOn]: {
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
		[ActionId.InsertPos]: {
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
		[ActionId.InsertSelect]: {
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
		[ActionId.LoadChannelPreset]: {
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
		[ActionId.LoadFXPreset]: {
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
		// [ActionId.LoadRoutingPreset]: {
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
		[ActionId.LoadAESPreset]: {
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
		[ActionId.DoUndo]: {
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
		[ActionId.SetUndoCheckpoint]: {
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
