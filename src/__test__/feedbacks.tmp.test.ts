// eslint-disable-next-line n/no-unpublished-import
import { describe, it, expect } from 'vitest'
import { GetFeedbacksList } from '../feedback.js'
import { X32State } from '../state.js'

describe('Feedbacks test', () => {
	const feedbacks = GetFeedbacksList(null as any, new X32State(), null as any, () => null)

	for (const [id, action] of Object.entries(feedbacks)) {
		if (!action) continue

		it(`Check ${action.name} (${id})`, () => {
			expect(action).toMatchSnapshot()
		})
	}
})
