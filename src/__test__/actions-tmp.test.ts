// eslint-disable-next-line n/no-unpublished-import
import { describe, it, expect } from 'vitest'
import { GetActionsList } from '../actions/main.js'
import { X32State } from '../state.js'

describe('Actions test', () => {
	const actions = GetActionsList({
		transitions: {} as any,
		state: new X32State(),
		sendOsc: () => {},
		ensureLoaded: () => {},
	})

	for (const [id, action] of Object.entries(actions)) {
		if (!action) continue

		it(`Check ${action.name} (${id})`, () => {
			expect(action).toMatchSnapshot()
		})
	}
})
