import type { CompanionActionDefinitions } from '@companion-module/base'
import type { ActionsProps } from './main.js'
import { actionSubscriptionWrapper } from './util.js'
import { convertChoices, GetLevelsChoiceConfigs } from '../choices.js'
import { parseRefToPaths } from '../paths.js'
import { dbToFloat, floatToDB } from '../util.js'

export type EncoderActionsSchema = {
	fader_encoder: {
		options: {
			target: string
			step: string
			direction: string
		}
	}
}

const ENCODER_STEP_CHOICES = [
	{ id: '5db', label: '5 dB – large jump, good for rough level setting' },
	{ id: '3db', label: '3 dB – standard increment, noticeable but musical' },
	{ id: '1db', label: '1 dB – fine control, good for subtle riding' },
	{ id: '0.5db', label: '0.5 dB – very fine, precise adjustments' },
	{ id: 'fine', label: 'Fine (0.01 fader unit) – slow, precise travel, ~0.5–1 dB near unity' },
	{ id: 'medium', label: 'Medium (0.025 fader unit) – balanced feel, ~1–2 dB near unity' },
	{ id: 'coarse', label: 'Coarse (0.05 fader unit) – fast travel, ~2–4 dB near unity' },
]

const ENCODER_DIRECTION_CHOICES = [
	{ id: 'up', label: 'Up (CW rotation)' },
	{ id: 'down', label: 'Down (CCW rotation)' },
]

/**
 * Apply one encoder detent to a fader float value (0.0–1.0).
 *
 * dB steps operate in dB space using the X32's piecewise-linear fader curve
 * (floatToDB / dbToFloat). Float steps move the raw position value directly,
 * producing consistent "physical travel" feel across the entire fader range
 * at the cost of varying dB increments (larger near the bottom, smaller near unity).
 */
function applyEncoderStep(currentFloat: number, step: string, direction: string): number {
	const sign = direction === 'up' ? 1 : -1

	if (step === 'fine') {
		return Math.max(0, Math.min(1, currentFloat + sign * 0.01))
	}

	if (step === 'medium') {
		return Math.max(0, Math.min(1, currentFloat + sign * 0.025))
	}

	if (step === 'coarse') {
		return Math.max(0, Math.min(1, currentFloat + sign * 0.05))
	}

	// dB-based step: work in dB space then convert back to float
	const dbDelta = sign * stepToDb(step)
	const currentDb = floatToDB(currentFloat)
	// Treat -∞ (fader at 0.0) as -90 dB so moving up from silence works correctly
	const fromDb = Number.isFinite(currentDb) ? currentDb : -90
	return Math.max(0, Math.min(1, dbToFloat(fromDb + dbDelta)))
}

function stepToDb(step: string): number {
	switch (step) {
		case '5db':
			return 5
		case '3db':
			return 3
		case '1db':
			return 1
		case '0.5db':
			return 0.5
		default:
			// A step choice was added to ENCODER_STEP_CHOICES without a matching case here.
			throw new Error(`Unknown dB step: ${step}`)
	}
}

export function getEncoderActions(props: ActionsProps): CompanionActionDefinitions<EncoderActionsSchema> {
	const levelsChoices = GetLevelsChoiceConfigs(props.state)

	return {
		fader_encoder: {
			name: 'Fader Control (Encoder)',
			description:
				'Adjust a fader by a fixed step per encoder detent. ' +
				'Assign two instances to one encoder: Direction = Up on CW, Direction = Down on CCW.',
			options: [
				{
					type: 'dropdown',
					label: 'Fader Target',
					id: 'target',
					...convertChoices(levelsChoices.channels),
					allowInvalidValues: true,
				},
				{
					type: 'dropdown',
					label: 'Step Size',
					id: 'step',
					choices: ENCODER_STEP_CHOICES,
					default: '1db',
					disableAutoExpression: true,
				},
				{
					type: 'dropdown',
					label: 'Direction',
					id: 'direction',
					choices: ENCODER_DIRECTION_CHOICES,
					default: 'up',
					disableAutoExpression: true,
				},
			],
			...actionSubscriptionWrapper(props, {
				getPath: (options) => {
					const refPaths = parseRefToPaths(options.target, levelsChoices.channelsParseOptions)
					return refPaths?.level?.path ?? null
				},
				execute: (action, cachedData, _path) => {
					// Fall back to unity (0 dB) if the fader value hasn't been received yet.
					// actionSubscriptionWrapper calls ensureLoaded on subscribe, so this only
					// affects the first press before the console has responded.
					const currentFloat = cachedData?.[0]?.type === 'f' ? cachedData[0].value : 0.75
					const newFloat = applyEncoderStep(currentFloat, String(action.options.step), String(action.options.direction))
					return [{ type: 'f' as const, value: newFloat }]
				},
				shouldSubscribe: true,
				// Only re-run subscribe/unsubscribe when the target changes, not on every
				// step/direction edit — those options don't affect which OSC path is cached.
				optionsToMonitorForSubscribe: ['target'],
			}),
		},
	}
}
