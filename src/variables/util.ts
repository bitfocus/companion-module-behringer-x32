import type { OSCMetaArgument } from '@companion-module/base'

export function getStringArg(args: OSCMetaArgument[] | undefined, index: number): string {
	const raw = args?.[index]
	if (raw && raw.type === 's') {
		return raw.value
	} else {
		return ''
	}
}
