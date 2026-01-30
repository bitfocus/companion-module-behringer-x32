import type { JsonValue } from '@companion-module/base'
import { padNumber } from './util.js'

/** @deprecated */
export function MutePath(prefix: string): string {
	return `${MainPath(prefix)}/on`
}

export function MainPath(prefix: string): string {
	return prefix.indexOf('dca/') !== -1 ? `${prefix}` : `${prefix}/mix`
}

export function MainFaderPath(options: { [key: string]: JsonValue | undefined }): string {
	return `${MainPath(options.target as string)}/fader`
}

export function SendChannelToBusPath(options: { [key: string]: JsonValue | undefined }): string {
	return `${MainPath(options.source as string)}/${options.target}`
}

export function SendBusToMatrixPath(options: { [key: string]: JsonValue | undefined }): string {
	return `${MainPath(options.source as string)}/${options.target}/level`
}

export function MainPanPath(options: { [key: string]: JsonValue | undefined }): string {
	return `${MainPath(options.target as string)}/pan`
}

export function ChannelToBusPanPath(options: { [key: string]: JsonValue | undefined }): string {
	return `${MainPath(options.source as string)}/${options.target}`
}

export function BusToMatrixPanPath(options: { [key: string]: JsonValue | undefined }): string {
	return `${MainPath(options.source as string)}/${options.target}/pan`
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
	config: {
		name: string
		color: string
	}
	sendTo?: {
		path: string
		isOn: boolean
	} | null // TODO
	/** Something can be 'sendTo' this, with this as a path suffix */
	sendToSink?: {
		on: string
		level: string | null
		pan: string | null
	}
} | null {
	if (!ref) return null
	ref = String(ref).toLowerCase().trim()

	// sanitise to <ascii><number>
	ref = ref.replace(/[^a-z0-9]/g, '')

	// Special cases
	if (ref === 'stereo' || ref === 'st') {
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
		}
	} else if (ref === 'mono' || ref === 'mo' || ref === 'mon') {
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

			// TODO
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
			}
		}
		case 'a':
		case 'out':
		case 'aux': {
			if (!options.allowAuxIn) return null

			// TODO
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
			}
		}
		case 'f':
		case 'fx': {
			if (!options.allowFx) return null

			// TODO
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
			}
		}
		case 'b':
		case 'bus':
		case 'mix': {
			if (!options.allowBus) return null

			// TODO
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
			}
		}
		case 'm':
		case 'mat':
		case 'matrix':
		case 'mtx': {
			if (!options.allowMatrix) return null

			// TODO
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
			}
		}
		case 'd':
		case 'dca': {
			if (!options.allowDca) return null

			// TODO
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
			}
		}
		// case 'mute':
		// case 'mg':
		// case 'mutegroup':
		// case 'mutegrp': {
		// 	if (!options.allowMuteGroup) return null

		// 	// TODO
		// 	return {
		// 		muteOrOn: {
		// 			path: `/config/mute/${refNumber}`,
		// 			isOn: false,
		// 		},
		// 	}
		// }

		default:
			return null
	}
}
