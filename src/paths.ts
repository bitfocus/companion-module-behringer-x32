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
	allowMuteGroup?: boolean
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
			muteOrOn: undefined,
			sendToSink: {
				on: `st`,
				level: null,
				pan: null,
			},
		}
	} else if (ref === 'mono' || ref === 'mo' || ref === 'mon') {
		if (!options.allowMono) return null

		return {
			muteOrOn: undefined,
			sendToSink: {
				on: `mono`,
				level: 'mlevel',
				pan: null, //'mpan', // TODO - should this be enabled?
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
				sendToSink: {
					on: `${padNumber(refNumber)}/on`,
					level: `${padNumber(refNumber)}/level`,
					pan: `${padNumber(refNumber)}/pan`,
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
			}
		}
		case 'mute':
		case 'mg':
		case 'mutegroup':
		case 'mutegrp': {
			if (!options.allowMuteGroup) return null

			// TODO
			return {
				muteOrOn: {
					path: `/config/mute/${refNumber}`,
					isOn: false,
				},
			}
		}

		default:
			return null
	}
}
