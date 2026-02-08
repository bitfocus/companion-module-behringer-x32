import type { CompanionVariableDefinition, CompanionVariableValues, Complete } from '@companion-module/base'
import { VariableDefinitions } from './main.js'
import type { X32State } from '../state.js'

export function GetCompanionVariableDefinitions(): CompanionVariableDefinition[] {
	return VariableDefinitions.map(
		({ name, variableId }) => ({ name, variableId }) satisfies Complete<CompanionVariableDefinition>,
	)
}

export function GetCompanionVariableValues(state: X32State, limitTo?: ReadonlySet<string>): CompanionVariableValues {
	const values: CompanionVariableValues = {}

	for (const defs of VariableDefinitions) {
		if (limitTo && !limitTo.has(defs.variableId)) continue

		const cachedArgs = defs.oscPath ? state.get(defs.oscPath) : undefined
		values[defs.variableId] = defs.getValue(cachedArgs, state)
	}

	return values
}
