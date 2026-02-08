// eslint-disable-next-line n/no-unpublished-import
import { vi, it, expect, describe } from 'vitest'
import { X32State } from '../state.js'
import { InstanceBaseExt } from '../util.js'
import * as variableFns from '../variables.js'

describe('Variables test', () => {
	for (const [name, fn] of Object.entries(variableFns)) {
		if (typeof fn !== 'function') continue
		if (name === 'updateDeviceInfoVariables') continue

		it(name, () => {
			const mockDefs = vi.fn()
			const mockVals = vi.fn()
			const mockInstance: Pick<InstanceBaseExt, 'setVariableDefinitions' | 'setVariableValues'> = {
				setVariableDefinitions: mockDefs,
				setVariableValues: mockVals,
			}

			fn(mockInstance as InstanceBaseExt, new X32State() as any)

			expect(mockDefs.mock.calls[0]).toMatchSnapshot()
			expect(mockVals.mock.calls[0]).toMatchSnapshot()
		})
	}
})
