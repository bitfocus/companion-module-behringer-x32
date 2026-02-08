import {
	CompanionInputFieldDropdown,
	CompanionInputFieldNumber,
	DropdownChoice,
	JsonValue,
	SomeCompanionActionInputField,
} from '@companion-module/base'
import { X32State } from './state.js'
import { padNumber, stringifyValueAlways } from './util.js'
import {
	getAuxPaths,
	getBusPaths,
	getChannelPaths,
	getDcaPaths,
	getFxPaths,
	getMatrixPaths,
	MainLeftPaths,
	MainMonoPaths,
	MainRightPaths,
	MainStereoPaths,
	ParseRefOptions,
	SourcePaths,
} from './paths.js'

export const MUTE_TOGGLE = 2
export const CHOICES_MUTE: DropdownChoice<number>[] = [
	{ id: MUTE_TOGGLE, label: 'Toggle' },
	{ id: 0, label: 'Mute' },
	{ id: 1, label: 'Unmute' },
]
export const CHOICES_MUTE_GROUP: DropdownChoice<number>[] = [
	{ id: MUTE_TOGGLE, label: 'Toggle' },
	{ id: 1, label: 'Mute' },
	{ id: 0, label: 'Unmute' },
]
export const CHOICES_ON_OFF: DropdownChoice<number>[] = [
	{ id: MUTE_TOGGLE, label: 'Toggle' },
	{ id: 1, label: 'On' },
	{ id: 0, label: 'Off' },
]

export const CHOICES_COLOR: DropdownChoice<string>[] = [
	{ label: 'Off', id: 'off' },
	{ label: 'Red', id: 'red' },
	{ label: 'Green', id: 'green' },
	{ label: 'Yellow', id: 'yellow' },
	{ label: 'Blue', id: 'blue' },
	{ label: 'Magenta', id: 'magenta' },
	{ label: 'Cyan', id: 'cyan' },
	{ label: 'White', id: 'white' },
	{ label: 'Off Inverted', id: 'offinverted' },
	{ label: 'Red Inverted', id: 'redinverted' },
	{ label: 'Green Inverted', id: 'greeninverted' },
	{ label: 'Yellow Inverted', id: 'yellowinverted' },
	{ label: 'Blue Inverted', id: 'blueinverted' },
	{ label: 'Magenta Inverted', id: 'magentainverted' },
	{ label: 'Cyan Inverted', id: 'cyaninverted' },
	{ label: 'White Inverted', id: 'whiteinverted' },
]

export function parseColorNameToValue(ref: JsonValue | undefined): number | null {
	if (!ref) return null
	ref = stringifyValueAlways(ref).toLowerCase().trim()

	// sanitise to <ascii>
	ref = ref.replace(/[^a-z]/g, '')

	switch (ref) {
		case 'off':
			return 0
		case 'red':
			return 1
		case 'green':
			return 2
		case 'yellow':
			return 3
		case 'blue':
			return 4
		case 'magenta':
			return 5
		case 'cyan':
			return 6
		case 'white':
			return 7
		case 'offinverted':
			return 8
		case 'redinverted':
			return 9
		case 'greeninverted':
			return 10
		case 'yellowinverted':
			return 11
		case 'blueinverted':
			return 12
		case 'magentainverted':
			return 13
		case 'cyaninverted':
			return 14
		case 'whiteinverted':
			return 15
		default:
			return null
	}
}

export function getColorChoiceFromId(id: JsonValue | undefined): DropdownChoice<string> | undefined {
	id = Number(id)

	// This is not efficient, but is easy
	for (const choice of CHOICES_COLOR) {
		const number = parseColorNameToValue(choice.id)
		if (number === id) return choice
	}
	return undefined
}

export const CHOICES_TAPE_FUNC: DropdownChoice<string>[] = [
	{ label: 'STOP', id: '0' },
	{ label: 'PLAY PAUSE', id: '1' },
	{ label: 'PLAY', id: '2' },
	{ label: 'RECORD PAUSE', id: '3' },
	{ label: 'RECORD', id: '4' },
	{ label: 'FAST FORWARD', id: '5' },
	{ label: 'REWIND', id: '6' },
]

export interface ChannelChoicesOptions {
	defaultNames?: boolean
	numericIndex?: boolean
	includeMain?: boolean
	includeST?: boolean
	skipDca?: boolean
	skipBus?: boolean
	skipMatrix?: boolean
	skipInputs?: boolean
	skipAuxIn?: boolean
	skipFxRtn?: boolean
	// TODO - more skipXXX
}

export const FaderLevelChoice: CompanionInputFieldNumber<'fad'> = {
	type: 'number',
	label: 'Fader Level (-90 = -inf)',
	id: 'fad',
	range: true,
	default: 0,
	step: 0.1,
	min: -90,
	max: 10,
}

export const FaderLevelDeltaChoice: CompanionInputFieldNumber<'delta'> = {
	type: 'number',
	label: 'Delta',
	id: 'delta',
	default: 1,
	max: 100,
	min: -100,
}

export const PanningChoice: CompanionInputFieldNumber<'pan'> = {
	type: 'number',
	label: 'Panning (-50 = hard left, 0 = center, 50 = hard right)',
	id: 'pan',
	range: true,
	default: 0,
	step: 1,
	min: -50,
	max: 50,
}

export const PanningDelta: CompanionInputFieldNumber<'delta'> = {
	type: 'number',
	label: 'Delta (-50 = hard left, 0 = center, 50 = hard right)',
	id: 'delta',
	range: true,
	default: 0,
	step: 1,
	min: -100,
	max: 100,
}

export const HeadampGainChoice: CompanionInputFieldNumber<'gain'> = {
	type: 'number',
	label: 'Gain',
	id: 'gain',
	range: true,
	default: 0,
	step: 0.1,
	min: -12,
	max: 60,
}
export const MuteChoice: CompanionInputFieldDropdown<'mute'> = {
	type: 'dropdown',
	label: 'Mute / Unmute',
	id: 'mute',
	...convertChoices(CHOICES_MUTE),
	disableAutoExpression: true, // Not sure if this should support expressions
}
export const FadeDurationChoice: SomeCompanionActionInputField<'fadeDuration' | 'fadeAlgorithm' | 'fadeType'>[] = [
	{
		type: 'number',
		label: 'Fade Duration (ms)',
		id: 'fadeDuration',
		default: 0,
		min: 0,
		step: 10,
		max: 60000,
	},
	{
		type: 'dropdown',
		label: 'Fade Curve',
		id: 'fadeAlgorithm',
		default: 'linear',
		choices: [
			{ id: 'linear', label: 'Linear' },
			{ id: 'quadratic', label: 'Quadratic' },
			{ id: 'cubic', label: 'Cubic' },
			{ id: 'quartic', label: 'Quartic' },
			{ id: 'quintic', label: 'Quintic' },
			{ id: 'sinusoidal', label: 'Sinusoidal' },
			{ id: 'exponential', label: 'Exponential' },
			{ id: 'circular', label: 'Circular' },
			{ id: 'elastic', label: 'Elastic' },
			{ id: 'back', label: 'Back' },
			{ id: 'bounce', label: 'Bounce' },
		],
		disableAutoExpression: true, // This will be tedious for users, and not beneficial
	},
	{
		type: 'dropdown',
		label: 'Fade type',
		id: 'fadeType',
		default: 'ease-in',
		choices: [
			{ id: 'ease-in', label: 'Ease-in' },
			{ id: 'ease-out', label: 'Ease-out' },
			{ id: 'ease-in-out', label: 'Ease-in-out' },
		],
		isVisibleExpression: `$(options:fadeAlgorithm) != 'linear'`,
		disableAutoExpression: true, // This will be tedious for users, and not beneficial
	},
]

export function convertChoices<TId extends JsonValue>(
	choices: DropdownChoice<TId>[],
): { choices: DropdownChoice<TId>[]; default: TId } {
	return {
		choices,
		default: choices[0]?.id,
	}
}

export function GetLevelsChoiceConfigs(state: X32State): {
	channels: DropdownChoice<string>[]
	channelsParseOptions: ParseRefOptions
	allSources: DropdownChoice<string>[]
	allSourcesParseOptions: ParseRefOptions
	channelSendTargets: DropdownChoice<string>[]
	channelSendTargetsParseOptions: ParseRefOptions
	busSendSources: DropdownChoice<string>[]
	busSendSourcesParseOptions: ParseRefOptions
	busSendTargets: DropdownChoice<string>[]
	busSendTargetsParseOptions: ParseRefOptions
} {
	const channelsParseOptions: ParseRefOptions = {
		allowStereo: true,
		allowMono: true,
		allowChannel: true,
		allowAuxIn: true,
		allowFx: true,
		allowBus: true,
		allowMatrix: true,
		allowDca: true,
	}
	const allSourcesParseOptions: ParseRefOptions = {
		allowChannel: true,
		allowAuxIn: true,
		allowFx: true,
	}
	const channelSendTargetsParseOptions: ParseRefOptions = {
		allowBus: true,
		allowMono: true,
	}
	const busSendSourcesParseOptions: ParseRefOptions = {
		allowStereo: true,
		allowMono: true,
		allowBus: true,
	}
	const busSendTargetsParseOptions: ParseRefOptions = {
		allowMatrix: true,
	}

	return {
		channels: GetTargetChoicesNew(state, channelsParseOptions),
		channelsParseOptions,
		allSources: GetTargetChoicesNew(state, allSourcesParseOptions),
		allSourcesParseOptions,
		channelSendTargets: GetTargetChoicesNew(state, channelSendTargetsParseOptions),
		channelSendTargetsParseOptions,
		busSendSources: GetTargetChoicesNew(state, busSendSourcesParseOptions),
		busSendSourcesParseOptions,
		busSendTargets: GetTargetChoicesNew(state, busSendTargetsParseOptions),
		busSendTargetsParseOptions,
	}
}

export function GetPanningChoiceConfigs(state: X32State): {
	allSources: DropdownChoice<string>[]
	allSourcesParseOptions: ParseRefOptions
	channelSendTargets: DropdownChoice<string>[]
	channelSendTargetsParseOptions: ParseRefOptions
	busSendSource: DropdownChoice<string>[]
	busSendSourceParseOptions: ParseRefOptions
	busSendTarget: DropdownChoice<string>[]
	busSendTargetParseOptions: ParseRefOptions
} {
	const allSourcesParseOptions: ParseRefOptions = {
		allowStereo: true,
		allowChannel: true,
		allowAuxIn: true,
		allowFx: true,
		allowBus: true,
	}
	const channelSendTargetsParseOptions: ParseRefOptions = {
		allowBus: true,
	}
	const busSendSourceParseOptions: ParseRefOptions = {
		allowStereo: true,
		allowBus: true,
	}
	const busSendTargetParseOptions: ParseRefOptions = {
		allowMatrix: true,
	}

	const leftOnly = (statePath: SourcePaths) => !statePath.isStereoRight

	return {
		allSources: GetTargetChoicesNew(state, allSourcesParseOptions),
		allSourcesParseOptions,
		channelSendTargets: GetTargetChoicesNew(state, channelSendTargetsParseOptions, {
			filter: leftOnly,
		}),
		channelSendTargetsParseOptions,
		busSendSource: GetTargetChoicesNew(state, busSendSourceParseOptions),
		busSendSourceParseOptions,
		busSendTarget: GetTargetChoicesNew(state, busSendTargetParseOptions, {
			filter: leftOnly,
		}),
		busSendTargetParseOptions,
	}
}

export function GetTargetPaths(
	options: ParseRefOptions,
	extraOpts?: {
		defaultNames?: boolean
		filter?: (sourcePaths: SourcePaths) => boolean
	},
): SourcePaths[] {
	const res: SourcePaths[] = []

	const repeatSource = (count: number, getPaths: (i: number) => SourcePaths | null) => {
		for (let i = 1; i <= count; i++) {
			const paths = getPaths(i)
			if (!paths) continue

			// Allow external filter
			if (extraOpts?.filter && !extraOpts.filter(paths)) continue

			res.push(paths)
		}
	}

	if (options.allowChannel) repeatSource(32, getChannelPaths)
	if (options.allowAuxIn) repeatSource(8, getAuxPaths)
	if (options.allowAuxIn) repeatSource(8, getFxPaths)
	if (options.allowBus) repeatSource(16, getBusPaths)
	if (options.allowMatrix) repeatSource(6, getMatrixPaths)

	if (options.allowStereo) res.push(MainStereoPaths)
	if (options.allowMono) res.push(MainMonoPaths)
	if (options.allowLR) {
		res.push(MainLeftPaths)
		res.push(MainRightPaths)
	}

	if (options.allowDca) repeatSource(8, getDcaPaths)

	return res
}

export function GetNameFromState(state: X32State, paths: SourcePaths): string | undefined {
	if (!paths.namePath) return undefined

	const val = state.get(paths.namePath)
	return val && val[0]?.type === 's' ? val[0].value : undefined
}

export function GetTargetChoicesNew(
	state: X32State,
	options: ParseRefOptions,
	extraOpts?: {
		defaultNames?: boolean
		filter?: (sourcePaths: SourcePaths) => boolean
	},
): DropdownChoice<string>[] {
	return GetTargetPaths(options, extraOpts).map((paths) => {
		const realname = extraOpts?.defaultNames ? undefined : GetNameFromState(state, paths)
		return {
			id: paths.defaultRef,
			label: realname && realname !== paths.defaultName ? `${realname} (${paths.defaultName})` : paths.defaultName,
		}
	})
}

export const GetChannelSendParseOptions: ParseRefOptions = {
	allowBus: true,
	allowMono: true,
	allowStereo: true,
}

export function GetMuteGroupChoices(_state: X32State): DropdownChoice<number>[] {
	const res: DropdownChoice<number>[] = []

	for (let i = 1; i <= 6; i++) {
		res.push({
			id: i,
			label: `Mute group ${i}`,
		})
	}

	return res
}

export function GetHeadampChoices(): DropdownChoice<string>[] {
	const res: DropdownChoice<string>[] = []

	for (let i = 1; i <= 32; i++) {
		res.push({
			id: `local${i}`,
			label: `Local XLR ${i}`,
		})
	}

	for (let i = 1; i <= 32; i++) {
		res.push({
			id: `aes-a${i}`,
			label: `AES50-A ${i}`,
		})
	}

	for (let i = 1; i <= 32; i++) {
		res.push({
			id: `aes-b${i}`,
			label: `AES50-B ${i}`,
		})
	}

	return res
}

export function GetOscillatorDestinations(state: X32State): DropdownChoice[] {
	return GetTargetChoicesNew(state, OscillatorDestinationsParseOptions)
}
export const OscillatorDestinationsParseOptions: ParseRefOptions = {
	allowStereo: true,
	allowMono: true,
	allowLR: true,
	allowBus: true,
	allowMatrix: true,
}

export function GetUserInTargets(): DropdownChoice<number>[] {
	return [...Array(32).keys()].map((x) => ({ id: x + 1, label: `CH ${x + 1}` }))
}

export function GetUserOutTargets(showInLabels = false): DropdownChoice<number>[] {
	if (showInLabels) {
		return [...Array(48).keys()].map((x) => ({ id: x + 1, label: `${x < 32 ? 'IN/OUT' : 'OUT'} ${x + 1}` }))
	} else {
		return [...Array(48).keys()].map((x) => ({ id: x + 1, label: `OUT ${x + 1}` }))
	}
}

export function GetUserInSources(): DropdownChoice<number>[] {
	const localIn = [...Array(32).keys()].map((x) => ({ label: `Local In ${x + 1}` }))
	const aes50A = [...Array(48).keys()].map((x) => ({ label: `AES50-A ${x + 1}` }))
	const aes50B = [...Array(48).keys()].map((x) => ({ label: `AES50-B ${x + 1}` }))
	const cardIn = [...Array(32).keys()].map((x) => ({ label: `Card In ${x + 1}` }))
	const auxIn = [...Array(6).keys()].map((x) => ({ label: `Aux In ${x + 1}` }))

	return [
		{ label: 'OFF' },
		...localIn,
		...aes50A,
		...aes50B,
		...cardIn,
		...auxIn,
		{ label: 'Talkback Internal' },
		{ label: 'Talkback External' },
	].map((src, i) => ({ id: i, label: src.label }))
}

export function GetUserOutSources(): DropdownChoice<number>[] {
	const localIn = [...Array(32).keys()].map((x) => ({ label: `Local In ${x + 1}` }))
	const aes50A = [...Array(48).keys()].map((x) => ({ label: `AES50-A ${x + 1}` }))
	const aes50B = [...Array(48).keys()].map((x) => ({ label: `AES50-B ${x + 1}` }))
	const cardIn = [...Array(32).keys()].map((x) => ({ label: `Card In ${x + 1}` }))
	const auxIn = [...Array(6).keys()].map((x) => ({ label: `Aux In ${x + 1}` }))
	const output = [...Array(16).keys()].map((x) => ({ label: `Out ${x + 1}` }))
	const p16 = [...Array(16).keys()].map((x) => ({ label: `Ultranet ${x + 1}` }))
	const auxOut = [...Array(6).keys()].map((x) => ({ label: `Aux Out ${x + 1}` }))

	return [
		{ label: 'OFF' },
		...localIn,
		...aes50A,
		...aes50B,
		...cardIn,
		...auxIn,
		{ label: 'Talkback Internal' },
		{ label: 'Talkback External' },
		...output,
		...p16,
		...auxOut,
		{ label: 'Monitor L' },
		{ label: 'Monitor R' },
	].map((src, i) => ({ id: i, label: src.label }))
}

export function GetInputBlocks(): DropdownChoice<string>[] {
	return ['1-8', '9-16', '17-24', '25-32'].map((src) => ({ id: src, label: src }))
}

export function GetInputBlockRoutes(): DropdownChoice<number>[] {
	return [
		'Local 1-8',
		'Local 9-16',
		'Local 17-24',
		'Local 25-32',
		'A 1-8',
		'A 9-16',
		'A 17-24',
		'A 25-32',
		'A 33-40',
		'A 41-48',
		'B 1-8',
		'B 9-16',
		'B 17-24',
		'B 25-32',
		'B 33-40',
		'B 41-48',
		'Card 1-8',
		'Card 9-16',
		'Card 17-24',
		'Card 25-32',
		'User In 1-8',
		'User In 9-16',
		'User In 17-24',
		'User In 25-32',
	].map((src, i) => ({ id: i, label: src }))
}

export function GetAuxBlockRoutes(): DropdownChoice<number>[] {
	return [
		'AUX1-6',
		'Local 1-2',
		'Local 1-4',
		'Local 1-6',
		'A 1-2',
		'A 1-4',
		'A 1-6',
		'B 1-2',
		'B 1-4',
		'B 1-6',
		'Card 1-2',
		'Card 1-4',
		'Card 1-6',
		'User In 1-2',
		'User In 1-4',
		'User In 1-6',
	].map((src, i) => ({ id: i, label: src }))
}

export function GetAesBlocks(): DropdownChoice<string>[] {
	return ['1-8', '9-16', '17-24', '25-32', '33-40', '41-48'].map((src) => ({ id: src, label: src }))
}

export function GetAesCardRouteBlocks(): DropdownChoice<number>[] {
	return [
		'Local 1-8',
		'Local 9-16',
		'Local 17-24',
		'Local 25-32',
		'A 1-8',
		'A 9-16',
		'A 17-24',
		'A 25-32',
		'A 33-40',
		'A 41-48',
		'B 1-8',
		'B 9-16',
		'B 17-24',
		'B 25-32',
		'B 33-40',
		'B 41-48',
		'Card 1-8',
		'Card 9-16',
		'Card 17-24',
		'Card 25-32',
		'Out 1-8',
		'Out 9-16',
		'Ultranet 1-8',
		'Ultranet 9-16',
		'Aux Out 1-6/Mon',
		'Aux In 1-6/TB',
		'User Out 1-8',
		'User Out 9-16',
		'User Out 17-24',
		'User Out 25-32',
		'User Out 33-40',
		'User Out 41-48',
		'User In 1-8',
		'User In 9-16',
		'User In 17-24',
		'User In 25-32',
	].map((src, i) => ({ id: i, label: src }))
}

export function GetLeftOutputBlockRoutes(): DropdownChoice<number>[] {
	return [
		'Local 1-4',
		'Local 9-12',
		'Local 17-20',
		'Local 25-28',
		'A 1-4',
		'A 9-12',
		'A 17-20',
		'A 25-28',
		'A 33-36',
		'A 41-44',
		'B 1-4',
		'B 9-12',
		'B 17-20',
		'B 25-28',
		'B 33-36',
		'B 41-44',
		'Card 1-4',
		'Card 9-12',
		'Card 17-20',
		'Card 25-28',
		'Out 1-4',
		'Out 9-12',
		'Ultranet 1-4',
		'Ultranet 9-12',
		'Aux Out/CR',
		'Aux In/TB',
		'User Out 1-4',
		'User Out 9-12',
		'User Out 17-20',
		'User Out 25-28',
		'User Out 33-36',
		'User Out 41-44',
		'User In 1-4',
		'User In 9-12',
		'User In 17-20',
		'User In 25-28',
	].map((src, i) => ({ id: i, label: src }))
}

export function GetRightOutputBlockRoutes(): DropdownChoice<number>[] {
	return [
		'Local 5-8',
		'Local 13-16',
		'Local 21-24',
		'Local 29-32',
		'A 5-8',
		'A 13-16',
		'A 21-24',
		'A 29-32',
		'A 37-40',
		'A 45-48',
		'B 5-8',
		'B 13-16',
		'B 21-24',
		'B 29-32',
		'B 37-40',
		'B 45-48',
		'Card 5-8',
		'Card 13-16',
		'Card 21-24',
		'Card 29-32',
		'Out  5-8',
		'Out  13-16',
		'Ultranet 5-8',
		'Ultranet 13-16',
		'Aux Out/CR',
		'Aux In/TB',
		'User Out 5-8',
		'User Out 13-16',
		'User Out 21-24',
		'User Out 29-32',
		'User Out 37-40',
		'User Out 45-48',
		'User In 5-8',
		'User In 13-16',
		'User In 21-24',
		'User In 29-32',
	].map((src, i) => ({ id: i, label: src }))
}

export function GetTalkbackDestinations(state: X32State): DropdownChoice<string>[] {
	return GetTargetChoicesNew(state, TalkbackDestinationsParseOptions)
}
export const TalkbackDestinationsParseOptions: ParseRefOptions = {
	allowStereo: true,
	allowMono: true,
	allowBus: true,
}

export function GetInsertDestinationChoices(): DropdownChoice<number>[] {
	return [
		'OFF',
		'FX1L',
		'FX1R',
		'FX2L',
		'FX2R',
		'FX3L',
		'FX3R',
		'FX4L',
		'FX4R',
		'FX5L',
		'FX5R',
		'FX6L',
		'FX6R',
		'FX7L',
		'FX7R',
		'FX8L',
		'FX8R',
		'AUX1',
		'AUX2',
		'AUX3',
		'AUX4',
		'AUX5',
		'AUX6',
	].map((src, i) => ({ id: i, label: src }))
}

export function GetPresetsChoices(lib: 'ch' | 'fx' | 'r' | 'mon', state: X32State): DropdownChoice<number>[] {
	const options = [...Array(100).keys()]
	return options.map((i) => {
		const option = i + 1

		const hasDataState = state.get(`/-libs/${lib}/${option}/hasdata`)
		const hasDataValue = hasDataState && hasDataState[0]?.type === 'i' && hasDataState[0].value === 1
		if (hasDataValue) {
			const nameState = state.get(`/-libs/${lib}/${option}/name`)
			const nameValue = nameState && nameState[0]?.type === 's' ? nameState[0].value : undefined
			return {
				id: option,
				label:
					nameValue && nameValue.trim().length > 0
						? `${padNumber(option, 3)} (${nameValue})`
						: `${padNumber(option, 3)}`,
			}
		} else {
			return {
				id: option,
				label: `${padNumber(option, 3)} (No data)`,
			}
		}
	})
}
