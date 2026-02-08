// eslint-disable-next-line n/no-unpublished-import
import { it, expect, describe } from 'vitest'
import { VariableDefinitions } from '../variables/main.js'

describe('Variables test', () => {
	it('InitVariables', () => {
		const newDefs = VariableDefinitions.map((def) => {
			return {
				name: def.name,
				variableId: def.variableId,
			}
		})

		expect(newDefs).toMatchSnapshot()
		// expect(mockVals.mock.calls[0]).toMatchSnapshot()
	})
})
