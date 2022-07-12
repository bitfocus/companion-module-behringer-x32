import {
	CompanionInputFieldDropdown,
	CompanionInputFieldNumber,
	DropdownChoice,
	DropdownChoiceId,
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
	{ label: 'Red: ', id: '1' },
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

export const FaderLevelDeltaChoice: CompanionInputFieldNumber = {
	type: 'number',
	label: 'Delta',
	id: 'delta',
	default: 1,
	max: 100,
	min: -100,
}

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

export const PanningDelta: CompanionInputFieldNumber = {
	type: 'number',
	label: 'Delta',
	id: 'delta',
	range: true,
	required: true,
	default: 0,
	step: 1,
	min: -100,
	max: 100,
}

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
export const FadeDurationChoice: CompanionInputFieldNumber = {
	type: 'number',
	label: 'Fade Duration (ms)',
	id: 'fadeDuration',
	default: 0,
	min: 0,
	step: 10,
	max: 60000,
}

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

		for (let i = 1; i <= 8; i++) {
			appendTarget(`/auxin/${padNumber(i)}`, `Aux In ${i}`)
		}

		for (let i = 1; i <= 4; i++) {
			const o = (i - 1) * 2 + 1
			appendTarget(`/fxrtn/${padNumber(o)}`, `FX Return ${i} L`)
			appendTarget(`/fxrtn/${padNumber(o + 1)}`, `FX Return ${i} R`)
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
	if (type !== 'pan') {
		appendTarget(`/main/m`, `m${type == 'on' ? '' : type}`, `Main Mono`)
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
