module.exports = {
	extends: './node_modules/@companion-module/tools/eslint/main.cjs',
	overrides: [
		{
			files: ['*.ts'],
			rules: {
				'n/no-missing-import': 'off',
				'node/no-unpublished-import': 'off',
			},
		},
	],
}
