import type { JsonValue } from '@companion-module/base'
import { padNumber } from './util.js'

export function MainPath(prefix: string): string {
	return prefix.indexOf('dca/') !== -1 ? `${prefix}` : `${prefix}/mix`
}

export function UserRouteInPath(channel: JsonValue | undefined): string {
	const paddedChannel = `${channel}`.padStart(2, '0')
	return `/config/userrout/in/${paddedChannel}`
}

export function UserRouteOutPath(channel: JsonValue | undefined): string {
	const paddedChannel = `${channel}`.padStart(2, '0')
	return `/config/userrout/out/${paddedChannel}`
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
	// allowMuteGroup?: boolean
}

/**
 * Parse a user provided reference string into the paths it refers to.
 * Note: This tries to be as loose as possible, with various abbreviations supported.
 * @param ref The reference string
 * @returns
 */
export function parseRefToPaths(
	ref: JsonValue | undefined,
	options: ParseRefOptions,
): {
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
} | null {
	if (!ref) return null
	ref = String(ref).toLowerCase().trim()

	// sanitise to <ascii><number>
	ref = ref.replace(/[^a-z0-9]/g, '')

	// Special cases
	if (ref === 'stereo' || ref === 'st' || ref === 'mainlr') {
		if (!options.allowStereo) return null

		return {
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
	} else if (ref === 'mono' || ref === 'mo' || ref === 'mon' || ref === 'mainmc') {
		if (!options.allowMono) return null

		return {
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
	} else if (ref === 'left' || ref === 'l' || ref === 'mainl') {
		if (!options.allowLR) return null

		return {
			oscillatorDestValue: 16,
		}
	} else if (ref === 'right' || ref === 'r' || ref === 'mainr') {
		if (!options.allowLR) return null

		return {
			oscillatorDestValue: 17,
		}
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
			if (refNumber < 1 || refNumber > 32) return null

			return {
				muteOrOn: {
					path: `/ch/${String(refNumber).padStart(2, '0')}/mix/on`,
					isOn: true,
				},
				level: {
					path: `/ch/${String(refNumber).padStart(2, '0')}/mix/fader`,
				},
				pan: {
					path: `/ch/${String(refNumber).padStart(2, '0')}/mix/pan`,
				},
				trim: {
					path: `/ch/${String(refNumber).padStart(2, '0')}/preamp/trim`,
				},
				config: {
					name: `/ch/${String(refNumber).padStart(2, '0')}/config/name`,
					color: `/ch/${String(refNumber).padStart(2, '0')}/config/color`,
				},
				sendTo: {
					path: `/ch/${String(refNumber).padStart(2, '0')}/mix`,
					isOn: true,
				},
				insertSource: {
					onPath: `/ch/${String(refNumber).padStart(2, '0')}/insert/on`,
					posPath: `/ch/${String(refNumber).padStart(2, '0')}/insert/pos`,
					selPath: `/ch/${String(refNumber).padStart(2, '0')}/insert/sel`,
				},
				selectNumber: refNumber - 1,
				soloNumber: refNumber,
			}
		}
		case 'a':
		case 'out':
		case 'aux': {
			if (!options.allowAuxIn) return null
			if (refNumber < 1 || refNumber > 8) return null

			return {
				muteOrOn: {
					path: `/auxin/${String(refNumber).padStart(2, '0')}/mix/on`,
					isOn: true,
				},
				level: {
					path: `/auxin/${String(refNumber).padStart(2, '0')}/mix/fader`,
				},
				pan: {
					path: `/auxin/${String(refNumber).padStart(2, '0')}/mix/pan`,
				},
				trim: {
					path: `/auxin/${String(refNumber).padStart(2, '0')}/preamp/trim`,
				},
				config: {
					name: `/auxin/${String(refNumber).padStart(2, '0')}/config/name`,
					color: `/auxin/${String(refNumber).padStart(2, '0')}/config/color`,
				},
				sendTo: {
					path: `/auxin/${String(refNumber).padStart(2, '0')}/mix`,
					isOn: true,
				},
				selectNumber: refNumber - 1 + 32,
				soloNumber: refNumber + 32,
			}
		}
		case 'f':
		case 'fx': {
			if (!options.allowFx) return null
			if (refNumber < 1 || refNumber > 8) return null

			return {
				muteOrOn: {
					path: `/fxrtn/${String(refNumber).padStart(2, '0')}/mix/on`,
					isOn: true,
				},
				level: {
					path: `/fxrtn/${String(refNumber).padStart(2, '0')}/mix/fader`,
				},
				pan: {
					path: `/fxrtn/${String(refNumber).padStart(2, '0')}/mix/pan`,
				},
				config: {
					name: `/fxrtn/${String(refNumber).padStart(2, '0')}/config/name`,
					color: `/fxrtn/${String(refNumber).padStart(2, '0')}/config/color`,
				},
				sendTo: {
					path: `/fxrtn/${String(refNumber).padStart(2, '0')}/mix`,
					isOn: true,
				},
				selectNumber: refNumber - 1 + 40,
				soloNumber: refNumber + 40,
			}
		}
		case 'b':
		case 'bus':
		case 'mix': {
			if (!options.allowBus) return null
			if (refNumber < 1 || refNumber > 16) return null

			return {
				muteOrOn: {
					path: `/bus/${String(refNumber).padStart(2, '0')}/mix/on`,
					isOn: true,
				},
				level: {
					path: `/bus/${String(refNumber).padStart(2, '0')}/mix/fader`,
				},
				pan: {
					path: `/bus/${String(refNumber).padStart(2, '0')}/mix/pan`,
				},
				config: {
					name: `/bus/${String(refNumber).padStart(2, '0')}/config/name`,
					color: `/bus/${String(refNumber).padStart(2, '0')}/config/color`,
				},
				sendTo: {
					path: `/bus/${String(refNumber).padStart(2, '0')}/mix`,
					isOn: true,
				},
				sendToSink: {
					on: `${padNumber(refNumber)}/on`,
					level: `${padNumber(refNumber)}/level`,
					pan: refNumber % 2 == 1 ? `${padNumber(refNumber)}/pan` : null,
				},
				insertSource: {
					onPath: `/bus/${String(refNumber).padStart(2, '0')}/insert/on`,
					posPath: `/bus/${String(refNumber).padStart(2, '0')}/insert/pos`,
					selPath: `/bus/${String(refNumber).padStart(2, '0')}/insert/sel`,
				},
				selectNumber: refNumber - 1 + 48,
				soloNumber: refNumber + 48,
				talkbackDestMask: 1 << (refNumber - 1),
				oscillatorDestValue: refNumber - 1,
			}
		}
		case 'm':
		case 'mat':
		case 'matrix':
		case 'mtx': {
			if (!options.allowMatrix) return null
			if (refNumber < 1 || refNumber > 6) return null

			return {
				muteOrOn: {
					path: `/mtx/${String(refNumber).padStart(2, '0')}/mix/on`,
					isOn: true,
				},
				level: {
					path: `/mtx/${String(refNumber).padStart(2, '0')}/mix/fader`,
				},
				config: {
					name: `/mtx/${String(refNumber).padStart(2, '0')}/config/name`,
					color: `/mtx/${String(refNumber).padStart(2, '0')}/config/color`,
				},
				sendToSink: {
					on: `${padNumber(refNumber)}/on`,
					level: `${padNumber(refNumber)}/level`,
					pan: refNumber % 2 == 1 ? `${padNumber(refNumber)}/pan` : null,
				},
				insertSource: {
					onPath: `/mtx/${String(refNumber).padStart(2, '0')}/insert/on`,
					posPath: `/mtx/${String(refNumber).padStart(2, '0')}/insert/pos`,
					selPath: `/mtx/${String(refNumber).padStart(2, '0')}/insert/sel`,
				},
				selectNumber: refNumber - 1 + 64,
				soloNumber: refNumber + 64,
				oscillatorDestValue: refNumber + 19,
			}
		}
		case 'd':
		case 'dca': {
			if (!options.allowDca) return null
			if (refNumber < 1 || refNumber > 8) return null

			return {
				muteOrOn: {
					path: `/dca/${String(refNumber).padStart(2, '0')}/on`,
					isOn: true,
				},
				config: {
					name: `/dca/${String(refNumber).padStart(2, '0')}/config/name`,
					color: `/dca/${String(refNumber).padStart(2, '0')}/config/color`,
				},
				level: {
					path: `/dca/${String(refNumber).padStart(2, '0')}/fader`,
				},
				soloNumber: refNumber + 72,
			}
		}

		default:
			return null
	}
}

export function parseHeadampRef(ref: JsonValue | undefined): string | null {
	if (!ref) return null
	ref = String(ref).toLowerCase().trim()

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
