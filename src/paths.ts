import type { JsonValue } from '@companion-module/base'
import { padNumber, stringifyValueAlways } from './util.js'

export function UserRouteInPath(channel: number): string {
	return `/config/userrout/in/${padNumber(channel)}`
}

export function UserRouteOutPath(channel: number): string {
	return `/config/userrout/out/${padNumber(channel)}`
}

export interface ParseRefOptions {
	allowStereo?: boolean
	allowMono?: boolean
	allowLR?: boolean
	allowChannel?: boolean
	allowAuxIn?: boolean
	allowFx?: boolean
	allowBus?: boolean
	allowMatrix?: boolean
	allowDca?: boolean
}

export interface SourcePaths {
	defaultRef: string
	defaultName: string
	namePath: string | null
	variablesPrefix: string | null

	/** If this can be stereo linked, and would be the right channel */
	isStereoRight?: boolean

	muteOrOn?: {
		path: string
		isOn: boolean
	}
	level?: {
		path: string
	}
	pan?: {
		path: string
	}
	trim?: {
		path: string
	}
	config?: {
		name: string
		color: string
	}
	sendTo?: {
		path: string
		isOn: boolean
	} | null
	insertSource?: {
		onPath: string
		posPath: string
		selPath: string
	}
	/** Something can be 'sendTo' this, with this as a path suffix */
	sendToSink?: {
		on: string
		level: string | null
		pan: string | null
	}
	selectNumber?: number
	soloNumber?: number
	talkbackDestMask?: number
	oscillatorDestValue?: number
}

/**
 * Parse a user provided reference string into the paths it refers to.
 * Note: This tries to be as loose as possible, with various abbreviations supported.
 * @param ref The reference string
 * @returns
 */
export function parseRefToPaths(ref: JsonValue | undefined, options: ParseRefOptions): SourcePaths | null {
	if (!ref) return null
	ref = stringifyValueAlways(ref).toLowerCase().trim()

	// sanitise to <ascii><number>
	ref = ref.replace(/[^a-z0-9]/g, '')

	// Special cases
	if (ref === 'stereo' || ref === 'st' || ref === 'mainlr') {
		if (!options.allowStereo) return null

		return MainStereoPaths
	} else if (ref === 'mono' || ref === 'mo' || ref === 'mon' || ref === 'mainmc') {
		if (!options.allowMono) return null

		return MainMonoPaths
	} else if (ref === 'left' || ref === 'l' || ref === 'mainl') {
		if (!options.allowLR) return null

		return MainLeftPaths
	} else if (ref === 'right' || ref === 'r' || ref === 'mainr') {
		if (!options.allowLR) return null

		return MainRightPaths
	}

	const match = ref.match(/^([a-z]+)([0-9]+)$/)
	if (!match) return null // Unknown format

	const refType = match[1]
	const refNumber = parseInt(match[2], 10)
	if (isNaN(refNumber)) return null

	switch (refType) {
		case 'in':
		case 'input':
		case 'c':
		case 'ch':
		case 'channel': {
			if (!options.allowChannel) return null
			return getChannelPaths(refNumber)
		}
		case 'a':
		case 'out':
		case 'aux': {
			if (!options.allowAuxIn) return null
			return getAuxPaths(refNumber)
		}
		case 'f':
		case 'fx': {
			if (!options.allowFx) return null
			return getFxPaths(refNumber)
		}
		case 'b':
		case 'bus':
		case 'mix': {
			if (!options.allowBus) return null
			return getBusPaths(refNumber)
		}
		case 'm':
		case 'mat':
		case 'matrix':
		case 'mtx': {
			if (!options.allowMatrix) return null
			return getMatrixPaths(refNumber)
		}
		case 'd':
		case 'dca': {
			if (!options.allowDca) return null
			return getDcaPaths(refNumber)
		}

		default:
			return null
	}
}

export const MainStereoPaths: SourcePaths = {
	defaultName: `Main Stereo`,
	defaultRef: `stereo`,
	namePath: `/main/st/config/name`,
	variablesPrefix: 'main_st',

	muteOrOn: {
		path: `/main/st/mix/on`,
		isOn: true,
	},
	level: {
		path: `/main/st/mix/fader`,
	},
	pan: {
		path: `/main/st/mix/pan`,
	},
	config: {
		name: `/main/st/config/name`,
		color: `/main/st/config/color`,
	},
	sendTo: {
		path: `/main/st`,
		isOn: true,
	},
	sendToSink: {
		on: `st`,
		level: null,
		pan: null,
	},
	insertSource: {
		onPath: `/main/st/insert/on`,
		posPath: `/main/st/insert/pos`,
		selPath: `/main/st/insert/sel`,
	},
	selectNumber: 70,
	soloNumber: 71,
	talkbackDestMask: 1 << 16,
	oscillatorDestValue: 18,
}
export const MainMonoPaths: SourcePaths = {
	defaultName: `Main Mono`,
	defaultRef: `mono`,
	namePath: `/main/m/config/name`,
	variablesPrefix: 'main_m',

	muteOrOn: {
		path: `/main/m/mix/on`,
		isOn: true,
	},
	level: {
		path: `/main/m/mix/fader`,
	},
	config: {
		name: `/main/m/config/name`,
		color: `/main/m/config/color`,
	},
	sendTo: {
		path: `/main/m`,
		isOn: true,
	},
	sendToSink: {
		on: `mono`,
		level: 'mlevel',
		pan: null, // No pan for mono
	},
	insertSource: {
		onPath: `/main/m/insert/on`,
		posPath: `/main/m/insert/pos`,
		selPath: `/main/m/insert/sel`,
	},
	selectNumber: 71,
	soloNumber: 72,
	talkbackDestMask: 1 << 17,
	oscillatorDestValue: 19,
}
export const MainLeftPaths: SourcePaths = {
	defaultName: `Main Left`,
	defaultRef: `left`,
	namePath: null,
	variablesPrefix: null,

	oscillatorDestValue: 16,
}
export const MainRightPaths: SourcePaths = {
	defaultName: `Main Right`,
	defaultRef: `right`,
	namePath: null,
	variablesPrefix: null,

	oscillatorDestValue: 17,
}

export function getChannelPaths(channelNumber: number): SourcePaths | null {
	if (channelNumber < 1 || channelNumber > 32) return null

	const basePath = `/ch/${String(channelNumber).padStart(2, '0')}`

	return {
		defaultName: `Channel ${channelNumber}`,
		defaultRef: `channel${channelNumber}`,
		namePath: `${basePath}/config/name`,
		variablesPrefix: `ch_${String(channelNumber).padStart(2, '0')}`,

		isStereoRight: channelNumber % 2 === 0,

		muteOrOn: {
			path: `${basePath}/mix/on`,
			isOn: true,
		},
		level: {
			path: `${basePath}/mix/fader`,
		},
		pan: {
			path: `${basePath}/mix/pan`,
		},
		trim: {
			path: `${basePath}/preamp/trim`,
		},
		config: {
			name: `${basePath}/config/name`,
			color: `${basePath}/config/color`,
		},
		sendTo: {
			path: `${basePath}/mix`,
			isOn: true,
		},
		insertSource: {
			onPath: `${basePath}/insert/on`,
			posPath: `${basePath}/insert/pos`,
			selPath: `${basePath}/insert/sel`,
		},
		selectNumber: channelNumber - 1,
		soloNumber: channelNumber,
	}
}

export function getAuxPaths(auxNumber: number): SourcePaths | null {
	if (auxNumber < 1 || auxNumber > 8) return null

	const basePath = `/auxin/${String(auxNumber).padStart(2, '0')}`

	return {
		defaultName: `Aux In ${auxNumber}`,
		defaultRef: `aux${auxNumber}`,
		namePath: `${basePath}/config/name`,
		variablesPrefix: `auxin_${String(auxNumber).padStart(2, '0')}`,

		isStereoRight: auxNumber % 2 === 0,

		muteOrOn: {
			path: `${basePath}/mix/on`,
			isOn: true,
		},
		level: {
			path: `${basePath}/mix/fader`,
		},
		pan: {
			path: `${basePath}/mix/pan`,
		},
		trim: {
			path: `${basePath}/preamp/trim`,
		},
		config: {
			name: `${basePath}/config/name`,
			color: `${basePath}/config/color`,
		},
		sendTo: {
			path: `${basePath}/mix`,
			isOn: true,
		},
		selectNumber: auxNumber - 1 + 32,
		soloNumber: auxNumber + 32,
	}
}

export function getFxPaths(fxNumber: number): SourcePaths | null {
	if (fxNumber < 1 || fxNumber > 8) return null

	const basePath = `/fxrtn/${String(fxNumber).padStart(2, '0')}`

	return {
		defaultName: `FX Return ${Math.floor((fxNumber + 1) / 2)} ${fxNumber % 2 === 1 ? 'L' : 'R'}`,
		defaultRef: `fx${fxNumber}`,
		namePath: `${basePath}/config/name`,
		variablesPrefix: `fxrtn_${String(fxNumber).padStart(2, '0')}`,

		isStereoRight: fxNumber % 2 === 0,

		muteOrOn: {
			path: `${basePath}/mix/on`,
			isOn: true,
		},
		level: {
			path: `${basePath}/mix/fader`,
		},
		pan: {
			path: `${basePath}/mix/pan`,
		},
		config: {
			name: `${basePath}/config/name`,
			color: `${basePath}/config/color`,
		},
		sendTo: {
			path: `${basePath}/mix`,
			isOn: true,
		},
		selectNumber: fxNumber - 1 + 40,
		soloNumber: fxNumber + 40,
	}
}

export function getBusPaths(busNumber: number): SourcePaths | null {
	if (busNumber < 1 || busNumber > 16) return null

	const basePath = `/bus/${String(busNumber).padStart(2, '0')}`

	return {
		defaultName: `MixBus ${busNumber}`,
		defaultRef: `bus${busNumber}`,
		namePath: `${basePath}/config/name`,
		variablesPrefix: `bus_${String(busNumber).padStart(2, '0')}`,

		isStereoRight: busNumber % 2 === 0,

		muteOrOn: {
			path: `${basePath}/mix/on`,
			isOn: true,
		},
		level: {
			path: `${basePath}/mix/fader`,
		},
		pan: {
			path: `${basePath}/mix/pan`,
		},
		config: {
			name: `${basePath}/config/name`,
			color: `${basePath}/config/color`,
		},
		sendTo: {
			path: `${basePath}/mix`,
			isOn: true,
		},
		sendToSink: {
			on: `${padNumber(busNumber)}/on`,
			level: `${padNumber(busNumber)}/level`,
			pan: busNumber % 2 == 1 ? `${padNumber(busNumber)}/pan` : null,
		},
		insertSource: {
			onPath: `${basePath}/insert/on`,
			posPath: `${basePath}/insert/pos`,
			selPath: `${basePath}/insert/sel`,
		},
		selectNumber: busNumber - 1 + 48,
		soloNumber: busNumber + 48,
		talkbackDestMask: 1 << (busNumber - 1),
		oscillatorDestValue: busNumber - 1,
	}
}

export function getMatrixPaths(matrixNumber: number): SourcePaths | null {
	if (matrixNumber < 1 || matrixNumber > 6) return null

	const basePath = `/mtx/${String(matrixNumber).padStart(2, '0')}`

	return {
		defaultName: `Matrix ${matrixNumber}`,
		defaultRef: `matrix${matrixNumber}`,
		namePath: `${basePath}/config/name`,
		variablesPrefix: `mtx_${String(matrixNumber).padStart(2, '0')}`,

		isStereoRight: matrixNumber % 2 === 0,

		muteOrOn: {
			path: `${basePath}/mix/on`,
			isOn: true,
		},
		level: {
			path: `${basePath}/mix/fader`,
		},
		config: {
			name: `${basePath}/config/name`,
			color: `${basePath}/config/color`,
		},
		sendToSink: {
			on: `${padNumber(matrixNumber)}/on`,
			level: `${padNumber(matrixNumber)}/level`,
			pan: matrixNumber % 2 == 1 ? `${padNumber(matrixNumber)}/pan` : null,
		},
		insertSource: {
			onPath: `${basePath}/insert/on`,
			posPath: `${basePath}/insert/pos`,
			selPath: `${basePath}/insert/sel`,
		},
		selectNumber: matrixNumber - 1 + 64,
		soloNumber: matrixNumber + 64,
		oscillatorDestValue: matrixNumber + 19,
	}
}

export function getDcaPaths(dcaNumber: number): SourcePaths | null {
	if (dcaNumber < 1 || dcaNumber > 8) return null

	const basePath = `/dca/${String(dcaNumber).padStart(2, '0')}`

	return {
		defaultName: `DCA ${dcaNumber}`,
		defaultRef: `dca${dcaNumber}`,
		namePath: `${basePath}/config/name`,
		variablesPrefix: `dca_${String(dcaNumber).padStart(2, '0')}`,

		isStereoRight: dcaNumber % 2 === 0,

		muteOrOn: {
			path: `${basePath}/on`,
			isOn: true,
		},
		config: {
			name: `${basePath}/config/name`,
			color: `${basePath}/config/color`,
		},
		level: {
			path: `${basePath}/fader`,
		},
		soloNumber: dcaNumber + 72,
	}
}

export function parseHeadampRef(ref: JsonValue | undefined): string | null {
	if (!ref) return null
	ref = stringifyValueAlways(ref).toLowerCase().trim()

	// sanitise to <ascii><number>
	ref = ref.replace(/[^a-z0-9]/g, '')

	const match = ref.match(/^([a-z]+)([0-9]+)$/)
	if (!match) return null // Unknown format

	const refType = match[1]
	const refNumber = parseInt(match[2], 10)
	if (isNaN(refNumber)) return null

	switch (refType) {
		case 'local':
		case 'l':
		case 'loc':
		case 'xlr':
		case 'x':
			if (refNumber < 1 || refNumber > 32) return null

			return `/headamp/${padNumber(refNumber - 1, 3)}`
		case 'a':
		case 'aesa':
			if (refNumber < 1 || refNumber > 32) return null

			return `/headamp/${padNumber(refNumber - 1 + 32, 3)}`
		case 'b':
		case 'aesb':
			if (refNumber < 1 || refNumber > 32) return null

			return `/headamp/${padNumber(refNumber - 1 + 64, 3)}`
		default:
			return null
	}
}
