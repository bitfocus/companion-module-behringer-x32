// eslint-disable-next-line n/no-unpublished-import
import { defineConfig } from 'vitest/config'

export default defineConfig({
	test: {
		// ... Specify options here.
		include: ['src/__test__/**/*.test.ts'],
	},
})
