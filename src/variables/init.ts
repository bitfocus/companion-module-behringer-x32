import type { CompanionVariableDefinition, Complete } from '@companion-module/base'
import { VariableDefinitions } from './main.js'
import type { X32State } from '../state.js'
import { VariablesSchema } from './schema.js'

export function GetCompanionVariableDefinitions(): CompanionVariableDefinition[] {
	return VariableDefinitions.map(
		({ name, variableId }) => ({ name, variableId }) satisfies Complete<CompanionVariableDefinition>,
	)
}

export function GetCompanionVariableValues(state: X32State, limitTo?: ReadonlySet<string>): Partial<VariablesSchema> {
	const values: Partial<VariablesSchema> = {}

	for (const defs of VariableDefinitions) {
		if (limitTo && !limitTo.has(defs.variableId)) continue

		const cachedArgs = defs.oscPath ? state.get(defs.oscPath) : undefined
		// Types are hard to get right here
		values[defs.variableId] = defs.getValue(cachedArgs, state) as any
	}

	return values
}
