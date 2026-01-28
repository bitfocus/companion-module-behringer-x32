import type { JsonValue, InstanceBase, JsonObject } from '@companion-module/base'

export const MEDIA_PLAYER_SOURCE_CLIP_OFFSET = 1000

export function assertUnreachable(_never: never): void {
	// throw new Error('Unreachable')
}

export function padNumber(i: number, len = 2): string {
	return ('000000' + i).substr(-len)
}

export function floatToDB(f: number): number {
	if (f >= 0.5) {
		return f * 40 - 30 // max dB value: +10.
	} else if (f >= 0.25) {
		return f * 80 - 50
	} else if (f >= 0.0625) {
		return f * 160 - 70
	} else if (f >= 0.0) {
		return f * 480 - 90 // min dB value: -90 or -oo
	} else {
		return Number.NEGATIVE_INFINITY
	}
}

export function dbToFloat(d: number): number {
	let f: number
	if (d < -60) {
		f = (d + 90) / 480
	} else if (d < -30) {
		f = (d + 70) / 160
	} else if (d < -10) {
		f = (d + 50) / 80
	} else if (d <= 10) {
		f = (d + 30) / 40
	} else {
		f = 1
	}
	// Optionally round “f” to a X32 known value
	return f // Math.round((f * 1023.5) / 1023.0)
}

export function offsetFloatByDb(f: number, delta: number): number {
	return dbToFloat(floatToDB(f) + delta)
}

export function formatDb(d: number): string {
	// Round to 1dp
	d = Math.round(d * 10) / 10

	if (d <= -90) {
		return '-inf'
	} else if (d > 0) {
		return `+${d}dB`
	} else {
		return `${d}dB`
	}
}
export function trimToFloat(d: number): number {
	return clamp((d + 18) / 36)
}
export function floatToTrim(f: number): number {
	return clamp(f * 36 - 18, -18, 18)
}

export function floatToHeadampGain(f: number): number {
	return clamp(f * 72 - 12, -12, 60)
}

export function headampGainToFloat(d: number): number {
	return clamp((d + 12) / 72)
}

function clamp(val: number, min = 0, max = 1): number {
	return Math.min(Math.max(val, min), max)
}

export enum NumberComparitor {
	Equal = 'eq',
	NotEqual = 'ne',
	LessThan = 'lt',
	LessThanEqual = 'lte',
	GreaterThan = 'gt',
	GreaterThanEqual = 'gte',
}

export function compareNumber(
	target: JsonValue | undefined,
	comparitor: JsonValue | undefined,
	currentValue: number,
): boolean {
	const targetValue = Number(target)
	if (isNaN(targetValue)) {
		return false
	}

	switch (comparitor) {
		case NumberComparitor.GreaterThan:
			return currentValue > targetValue
		case NumberComparitor.GreaterThanEqual:
			return currentValue >= targetValue
		case NumberComparitor.LessThan:
			return currentValue < targetValue
		case NumberComparitor.LessThanEqual:
			return currentValue <= targetValue
		case NumberComparitor.NotEqual:
			return currentValue != targetValue
		default:
			return currentValue === targetValue
	}
}

export interface InstanceBaseExt<TConfig extends JsonObject> extends InstanceBase<TConfig> {
	config: TConfig
}
