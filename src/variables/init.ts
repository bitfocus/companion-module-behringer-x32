import type { CompanionVariableDefinitions } from '@companion-module/base'
import { VariableDefinitions } from './main.js'
import type { X32State } from '../state.js'
import { VariablesSchema } from './schema.js'

export function GetCompanionVariableDefinitions(): CompanionVariableDefinitions<VariablesSchema> {
	return VariableDefinitions
}

export function GetCompanionVariableValues(state: X32State, limitTo?: ReadonlySet<string>): Partial<VariablesSchema> {
	const values: Partial<VariablesSchema> = {}

	for (const [variableId, defs] of Object.entries(VariableDefinitions)) {
		if (limitTo && !limitTo.has(variableId)) continue

		const cachedArgs = defs.oscPath ? state.get(defs.oscPath) : undefined
		// Types are hard to get right here
		values[variableId as keyof VariablesSchema] = defs.getValue(cachedArgs, state) as any
	}

	return values
}
