import {
	CompanionInputFieldDropdown,
	CompanionInputFieldNumber,
	CompanionOptionValues,
	DropdownChoice,
	DropdownChoiceId,
	SomeCompanionActionInputField,
} from '@companion-module/base'
import { X32State } from './state.js'
import { padNumber } from './util.js'

export const MUTE_TOGGLE = 2
export const CHOICES_MUTE: DropdownChoice[] = [
	{ id: MUTE_TOGGLE, label: 'Toggle' },
	{ id: 0, label: 'Mute' },
	{ id: 1, label: 'Unmute' },
]
export const CHOICES_MUTE_GROUP: DropdownChoice[] = [
	{ id: MUTE_TOGGLE, label: 'Toggle' },
	{ id: 1, label: 'Mute' },
	{ id: 0, label: 'Unmute' },
]
export const CHOICES_ON_OFF: DropdownChoice[] = [
	{ id: MUTE_TOGGLE, label: 'Toggle' },
	{ id: 1, label: 'On' },
	{ id: 0, label: 'Off' },
]

export const CHOICES_COLOR: DropdownChoice[] = [
	{ label: 'Off', id: '0' },
	{ label: 'Red', id: '1' },
	{ label: 'Green', id: '2' },
	{ label: 'Yellow', id: '3' },
	{ label: 'Blue', id: '4' },
	{ label: 'Magenta', id: '5' },
	{ label: 'Cyan', id: '6' },
	{ label: 'White', id: '7' },
	{ label: 'Off Inverted', id: '8' },
	{ label: 'Red Inverted', id: '9' },
	{ label: 'Green Inverted', id: '10' },
	{ label: 'Yellow Inverted', id: '11' },
	{ label: 'Blue Inverted', id: '12' },
	{ label: 'Magenta Inverted', id: '13' },
	{ label: 'Cyan Inverted', id: '14' },
	{ label: 'White Inverted', id: '15' },
]

export const ColorChoicesWithVariable: SomeCompanionActionInputField[] = [
	{
		type: 'checkbox',
		label: 'Use a variable for Delta',
		default: false,
		id: 'useVariable',
	},
	{
		type: 'dropdown',
		label: 'color',
		id: 'col',
		...convertChoices(CHOICES_COLOR),
		isVisible: (options: CompanionOptionValues): boolean => {
			return !options.useVariable
		},
	},
	{
		type: 'textinput',
		label: 'Variable Color (e.g. $(x32:color_ch_01), NOTE: unknown strings will be ignored)',
		id: 'varCol',
		useVariables: true,
		isVisible: (options: CompanionOptionValues): boolean => {
			return !!options.useVariable
		},
	},
]

export function getColorLabelFromId(id: DropdownChoiceId): string | undefined {
	const choice = CHOICES_COLOR.find((item) => item.id == id)
	return choice ? choice.label : undefined
}

export function getColorIdFromLabel(label: string): DropdownChoiceId | undefined {
	const choice = CHOICES_COLOR.find((item) => item.label === label)
	return choice ? choice.id : undefined
}

export const CHOICES_TAPE_FUNC: DropdownChoice[] = [
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

export const FaderLevelChoice: CompanionInputFieldNumber = {
	type: 'number',
	label: 'Fader Level (-90 = -inf)',
	id: 'fad',
	range: true,
	required: true,
	default: 0,
	step: 0.1,
	min: -90,
	max: 10,
}

export const FaderLevelDeltaChoice: SomeCompanionActionInputField[] = [
	{
		type: 'checkbox',
		label: 'Use a variable for Delta',
		default: false,
		id: 'useVariable',
	},
	{
		type: 'number',
		label: 'Delta',
		id: 'delta',
		default: 1,
		max: 100,
		min: -100,
		isVisible: (options: CompanionOptionValues): boolean => {
			return !options.useVariable
		},
	},
	{
		type: 'textinput',
		label: 'Variable Delta (e.g. $(internal:custom_my_delta), NOTE: strings and out of range numbers will be ignored)',
		id: 'varDelta',
		useVariables: true,
		isVisible: (options: CompanionOptionValues): boolean => {
			return !!options.useVariable
		},
	},
]

export const PanningChoice: CompanionInputFieldNumber = {
	type: 'number',
	label: 'Panning (-50 = hard left, 0 = center, 50 = hard right)',
	id: 'pan',
	range: true,
	required: true,
	default: 0,
	step: 1,
	min: -50,
	max: 50,
}

export const PanningDelta: SomeCompanionActionInputField[] = [
	{
		type: 'checkbox',
		label: 'Use a variable for Delta',
		default: false,
		id: 'useVariable',
	},
	{
		type: 'number',
		label: 'Delta (-50 = hard left, 0 = center, 50 = hard right)',
		id: 'delta',
		range: true,
		required: true,
		default: 0,
		step: 1,
		min: -100,
		max: 100,
		isVisible: (options: CompanionOptionValues): boolean => {
			return !options.useVariable
		},
	},
	{
		type: 'textinput',
		label: 'Variable Delta (e.g. $(internal:custom_my_delta), NOTE: strings and out of range numbers will be ignored)',
		id: 'varDelta',
		useVariables: true,
		isVisible: (options: CompanionOptionValues): boolean => {
			return !!options.useVariable
		},
	},
]

export const HeadampGainChoice: CompanionInputFieldNumber = {
	type: 'number',
	label: 'Gain',
	id: 'gain',
	range: true,
	required: true,
	default: 0,
	step: 0.1,
	min: -12,
	max: 60,
}
export const MuteChoice: CompanionInputFieldDropdown = {
	type: 'dropdown',
	label: 'Mute / Unmute',
	id: 'mute',
	...convertChoices(CHOICES_MUTE),
}
export const FadeDurationChoice: SomeCompanionActionInputField[] = [
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
		label: 'Algorithm',
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
		isVisible: (options: CompanionOptionValues): boolean => {
			return options.fadeDuration != null && (options.fadeDuration as number) > 0
		},
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
		isVisible: (options: CompanionOptionValues): boolean => {
			return (
				options.fadeDuration != null &&
				options.fadeAlgorithm != null &&
				(options.fadeDuration as number) > 0 &&
				(options.fadeAlgorithm as string) !== 'linear'
			)
		},
	},
]

export function convertChoices(choices: DropdownChoice[]): { choices: DropdownChoice[]; default: DropdownChoiceId } {
	return {
		choices,
		default: choices[0].id,
	}
}

export function GetLevelsChoiceConfigs(state: X32State): {
	channels: DropdownChoice[]
	allSources: DropdownChoice[]
	channelSendTargets: DropdownChoice[]
	busSendSources: DropdownChoice[]
	busSendTargets: DropdownChoice[]
} {
	return {
		channels: GetTargetChoices(state, { includeMain: true }),
		allSources: GetTargetChoices(state, {
			includeMain: false,
			skipDca: true,
			skipBus: true,
			skipMatrix: true,
		}),
		channelSendTargets: GetChannelSendChoices(state, 'level'),
		busSendSources: GetTargetChoices(state, {
			skipInputs: true,
			includeMain: true,
			skipDca: true,
			skipBus: false,
			skipMatrix: true,
		}),
		busSendTargets: GetBusSendChoices(state),
	}
}

export function GetPanningChoiceConfigs(state: X32State): {
	allSources: DropdownChoice[]
	channelSendTargets: DropdownChoice[]
	busSendSource: DropdownChoice[]
	busSendTarget: DropdownChoice[]
} {
	return {
		allSources: GetTargetChoices(state, { skipDca: true, skipMatrix: true, includeST: true }),
		channelSendTargets: GetChannelSendChoices(state, 'pan'),
		busSendSource: GetTargetChoices(state, { skipInputs: true, includeST: true, skipDca: true, skipMatrix: true }),
		busSendTarget: GetBusSendChoices(state, 'pan'),
	}
}

export function GetTargetChoices(state: X32State, options?: ChannelChoicesOptions): DropdownChoice[] {
	const res: DropdownChoice[] = []

	const getNameFromState = (id: string): string | undefined => {
		if (options?.defaultNames) {
			return undefined
		}
		const val = state.get(`${id}/config/name`)
		return val && val[0]?.type === 's' ? val[0].value : undefined
	}

	let o = 0
	const appendTarget = (id: string, defaultName: string): void => {
		const realname = getNameFromState(id)
		res.push({
			id: options?.numericIndex ? o++ : id,
			label: realname && realname !== defaultName ? `${realname} (${defaultName})` : defaultName,
		})
	}

	if (!options?.skipInputs) {
		for (let i = 1; i <= 32; i++) {
			appendTarget(`/ch/${padNumber(i)}`, `Channel ${i}`)
		}

		if (!options?.skipAuxIn) {
			for (let i = 1; i <= 8; i++) {
				appendTarget(`/auxin/${padNumber(i)}`, `Aux In ${i}`)
			}
		}

		if (!options?.skipAuxIn) {
			for (let i = 1; i <= 4; i++) {
				const o = (i - 1) * 2 + 1
				appendTarget(`/fxrtn/${padNumber(o)}`, `FX Return ${i} L`)
				appendTarget(`/fxrtn/${padNumber(o + 1)}`, `FX Return ${i} R`)
			}
		}
	}

	if (!options?.skipBus) {
		for (let i = 1; i <= 16; i++) {
			appendTarget(`/bus/${padNumber(i)}`, `MixBus ${i}`)
		}
	}

	if (!options?.skipMatrix) {
		for (let i = 1; i <= 6; i++) {
			appendTarget(`/mtx/${padNumber(i)}`, `Matrix ${i}`)
		}
	}

	if (options?.includeMain) {
		appendTarget(`/main/st`, `Main Stereo`)
		appendTarget(`/main/m`, `Main Mono`)
	}

	if (options?.includeST) {
		appendTarget(`/main/st`, `Main Stereo`)
	}

	if (!options?.skipDca) {
		for (let i = 1; i <= 8; i++) {
			appendTarget(`/dca/${i}`, `DCA ${i}`)
		}
	}

	return res
}

// export function GetMixBusChoices(state: X32State): DropdownChoice[] {
//   const res: DropdownChoice[] = []

//   const appendTarget = (id: string, defaultName: string): void => {
//     const val = state.get(`/bus/${id}/config/name`)
//     const realname = val && val[0]?.type === 's' ? val[0].value : undefined
//     res.push({
//       id: id,
//       label: realname && realname !== defaultName ? `${realname} (${defaultName})` : defaultName
//     })
//   }

//   for (let i = 1; i <= 16; i++) {
//     appendTarget(`${padNumber(i)}`, `MixBus ${i}`)
//   }

//   return res
// }

export function GetChannelSendChoices(state: X32State, type: 'on' | 'level' | 'pan'): DropdownChoice[] {
	const res: DropdownChoice[] = []

	const appendTarget = (statePath: string, mixId: string, defaultName: string): void => {
		const val = state.get(`${statePath}/config/name`)
		const realname = val && val[0]?.type === 's' ? val[0].value : undefined
		res.push({
			id: mixId,
			label: realname && realname !== defaultName ? `${realname} (${defaultName})` : defaultName,
		})
	}
	const increment = type == 'pan' ? 2 : 1
	for (let i = 1; i <= 16; i += increment) {
		appendTarget(`/bus/${padNumber(i)}`, `${padNumber(i)}/${type}`, `MixBus ${i}`)
	}

	if (type === 'on') {
		appendTarget(`/main/st`, 'st', `Main Stereo`)
	}

	switch (type) {
		case 'on':
			appendTarget(`/main/m`, `mono`, `Main Mono`)
			break
		case 'level':
			appendTarget(`/main/m`, `m${type}`, `Main Mono`)
			break
	}

	return res
}

export function GetBusSendChoices(state: X32State, type: 'pan' | 'other' = 'other'): DropdownChoice[] {
	const res: DropdownChoice[] = []

	const appendTarget = (statePath: string, mixId: string, defaultName: string): void => {
		const val = state.get(`${statePath}/config/name`)
		const realname = val && val[0]?.type === 's' ? val[0].value : undefined
		res.push({
			id: mixId,
			label: realname && realname !== defaultName ? `${realname} (${defaultName})` : defaultName,
		})
	}
	const increment = type == 'pan' ? 2 : 1
	for (let i = 1; i <= 6; i += increment) {
		appendTarget(`/mtx/${padNumber(i)}`, padNumber(i), `Matrix ${i}`)
	}
	return res
}

export function GetMuteGroupChoices(_state: X32State): DropdownChoice[] {
	const res: DropdownChoice[] = []

	for (let i = 1; i <= 6; i++) {
		res.push({
			id: `/config/mute/${i}`,
			label: `Mute group ${i}`,
		})
	}

	return res
}

export function GetHeadampChoices(): DropdownChoice[] {
	const res: DropdownChoice[] = []

	for (let i = 1; i <= 32; i++) {
		res.push({
			id: `/headamp/${padNumber(res.length, 3)}`,
			label: `Local XLR ${i}`,
		})
	}

	for (let i = 1; i <= 32; i++) {
		res.push({
			id: `/headamp/${padNumber(res.length, 3)}`,
			label: `AES50-A ${i}`,
		})
	}

	for (let i = 1; i <= 32; i++) {
		res.push({
			id: `/headamp/${padNumber(res.length, 3)}`,
			label: `AES50-B ${i}`,
		})
	}

	return res
}

export function GetOscillatorDestinations(state: X32State): DropdownChoice[] {
	return [
		...GetTargetChoices(state, { skipDca: true, skipInputs: true, skipMatrix: true }),
		{
			label: 'Main L',
		},
		{
			label: 'Main R',
		},
		{
			label: 'Main L+R',
		},
		{
			label: 'Main M/C',
		},
		...GetTargetChoices(state, { skipDca: true, skipInputs: true, skipBus: true }),
	].map((dst, i) => ({ id: i, label: dst.label }))
}

export function GetUserInTargets(): DropdownChoice[] {
	return [...Array(32).keys()].map((x) => ({ id: x + 1, label: `CH ${x + 1}` }))
}

export function GetUserOutTargets(showInLabels = false): DropdownChoice[] {
	if (showInLabels) {
		return [...Array(48).keys()].map((x) => ({ id: x + 1, label: `${x < 32 ? 'IN/OUT' : 'OUT'} ${x + 1}` }))
	} else {
		return [...Array(48).keys()].map((x) => ({ id: x + 1, label: `OUT ${x + 1}` }))
	}
}

export function GetUserInSources(): DropdownChoice[] {
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

export function GetUserOutSources(): DropdownChoice[] {
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

export function GetInputBlocks(): DropdownChoice[] {
	return ['1-8', '9-16', '17-24', '25-32'].map((src) => ({ id: src, label: src }))
}

export function GetInputBlockRoutes(): DropdownChoice[] {
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

export function GetAuxBlockRoutes(): DropdownChoice[] {
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

export function GetAesBlocks(): DropdownChoice[] {
	return ['1-8', '9-16', '17-24', '25-32', '33-40', '41-48'].map((src) => ({ id: src, label: src }))
}

export function GetAesCardRouteBlocks(): DropdownChoice[] {
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

export function GetLeftOutputBlockRoutes(): DropdownChoice[] {
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

export function GetRightOutputBlockRoutes(): DropdownChoice[] {
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

export function GetTalkbackDestinations(state: X32State): DropdownChoice[] {
	return GetTargetChoices(state, {
		numericIndex: true,
		includeMain: true,
		skipDca: true,
		skipMatrix: true,
		skipInputs: true,
		skipAuxIn: true,
		skipFxRtn: true,
	})
}

export function GetInsertDestinationChoices(): DropdownChoice[] {
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

export function GetPresetsChoices(lib: 'ch' | 'fx' | 'r' | 'mon', state: X32State): DropdownChoice[] {
	const options = [...Array(100).keys()].map((x) => `${x + 1}`.padStart(3, '0'))
	const choices: DropdownChoice[] = []
	options.forEach((option) => {
		const hasDataState = state.get(`/-libs/${lib}/${option}/hasdata`)
		const hasDataValue = hasDataState && hasDataState[0]?.type === 'i' && hasDataState[0].value === 1
		if (hasDataValue) {
			const nameState = state.get(`/-libs/${lib}/${option}/name`)
			const nameValue = nameState && nameState[0]?.type === 's' ? nameState[0].value : undefined
			choices.push({
				id: option,
				label: nameValue && nameValue.trim().length > 0 ? `${option} (${nameValue})` : `${option}`,
			})
		} else {
			choices.push({
				id: option,
				label: `${option} (No data)`,
			})
		}
	})
	return choices
}
