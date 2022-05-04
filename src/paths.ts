import { InputValue } from '@companion-module/base'

export function MutePath(prefix: string): string {
	return `${MainPath(prefix)}/on`
}

export function MainPath(prefix: string): string {
	return prefix.indexOf('dca/') !== -1 ? `${prefix}` : `${prefix}/mix`
}

export function MainFaderPath(options: { [key: string]: InputValue | undefined }): string {
	return `${MainPath(options.target as string)}/fader`
}

export function SendChannelToBusPath(options: { [key: string]: InputValue | undefined }): string {
	return `${MainPath(options.source as string)}/${options.target}`
}

export function SendBusToMatrixPath(options: { [key: string]: InputValue | undefined }): string {
	return `${MainPath(options.source as string)}/${options.target}/level`
}

export function MainPanPath(options: { [key: string]: InputValue | undefined }): string {
	return `${MainPath(options.target as string)}/pan`
}

export function ChannelToBusPanPath(options: { [key: string]: InputValue | undefined }): string {
	return `${MainPath(options.source as string)}/${options.target}`
}

export function BusToMatrixPanPath(options: { [key: string]: InputValue | undefined }): string {
	return `${MainPath(options.source as string)}/${options.target}/pan`
}
