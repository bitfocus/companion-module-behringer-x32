import type {
	CompanionOptionValues,
	CompanionActionEvent,
	OSCMetaArgument,
	CompanionActionDefinition,
	CompanionActionInfo,
} from '@companion-module/base'
import type { ActionsProps } from './main.js'
import { MUTE_TOGGLE } from '../choices.js'

export function actionSubscriptionWrapper<TOptions extends CompanionOptionValues>(
	props: ActionsProps,
	input: {
		getPath: (options: TOptions) => string | null
		execute: (
			evt: CompanionActionEvent<TOptions>,
			cachedData: OSCMetaArgument[] | undefined,
			path: string,
		) => OSCMetaArgument | OSCMetaArgument[] | undefined
		shouldSubscribe: ((options: TOptions) => boolean) | boolean
		optionsToMonitorForSubscribe: Extract<keyof TOptions, string>[]
	},
): Pick<CompanionActionDefinition<TOptions>, 'callback' | 'subscribe' | 'optionsToMonitorForSubscribe'> {
	return {
		callback: (evt: CompanionActionEvent<TOptions>) => {
			const path = input.getPath(evt.options)
			if (!path) return

			const cachedData = props.state.get(path)
			const values = input.execute(evt, cachedData, path)

			// Check if the action gave values
			if (!values) return

			props.sendOsc(path, values)
		},
		// Only define the subscribe method when it does something
		subscribe: input.shouldSubscribe
			? (evt: CompanionActionInfo<TOptions>) => {
					if (!input.shouldSubscribe) return

					const path = input.getPath(evt.options)
					if (path) props.ensureLoaded(path)
				}
			: undefined,
	}
}

export function getResolveOnOffMute(
	cachedData: OSCMetaArgument[] | undefined,
	cmdIsCalledOn: boolean,
	value: number,
): number {
	if (value === MUTE_TOGGLE) {
		const currentVal = cachedData && cachedData[0]?.type === 'i' && cachedData[0]?.value
		if (typeof currentVal === 'number') {
			return currentVal === 0 ? 1 : 0
		} else {
			// default to off
			return cmdIsCalledOn ? 0 : 1
		}
	} else {
		return value
	}
}

/** @deprecated */
export const getOptNumber = (action: CompanionActionInfo, key: string, defVal?: number): number => {
	const rawVal = action.options[key]
	if (defVal !== undefined && rawVal === undefined) return defVal
	const val = Number(rawVal)
	if (isNaN(val)) {
		throw new Error(`Invalid option '${key}'`)
	}
	return val
}
