// eslint-disable-next-line n/no-unpublished-import
import { vi, it, expect } from 'vitest'
import { X32State } from '../state.js'
import { InstanceBaseExt } from '../util.js'
import { InitVariables } from '../variables.js'

it('Variables test', () => {
	const mockDefs = vi.fn()
	const mockVals = vi.fn()
	const mockInstance: Pick<InstanceBaseExt<any>, 'setVariableDefinitions' | 'setVariableValues'> = {
		setVariableDefinitions: mockDefs,
		setVariableValues: mockVals,
	}

	InitVariables(mockInstance as InstanceBaseExt<any>, new X32State())

	expect(mockDefs).toHaveBeenCalledOnce()
	expect(mockDefs.mock.calls[0]).toMatchSnapshot()
})
