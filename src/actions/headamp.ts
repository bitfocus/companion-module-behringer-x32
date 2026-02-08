import type { CompanionActionDefinitions } from '@companion-module/base'
import type { ActionsProps } from './main.js'
import { convertChoices, GetHeadampChoices, GetLevelsChoiceConfigs, HeadampGainChoice } from '../choices.js'
import { parseHeadampRef, parseRefToPaths } from '../paths.js'
import { trimToFloat, headampGainToFloat } from '../util.js'

export type HeadAmpActionsSchema = {
	input_trim: {
		options: {
			input: string
			trim: number
		}
	}
	headamp_gain: {
		options: {
			headamp: string
			gain: number
		}
	}
}

export function getHeadAmpActions(props: ActionsProps): CompanionActionDefinitions<HeadAmpActionsSchema> {
	const levelsChoices = GetLevelsChoiceConfigs(props.state)

	return {
		input_trim: {
			name: 'Set input trim',
			options: [
				{
					type: 'dropdown',
					label: 'Input',
					id: 'input',
					...convertChoices(levelsChoices.allSources),
					allowInvalidValues: true,
				},
				{
					type: 'number',
					label: 'Trim',
					id: 'trim',
					range: true,
					default: 0,
					step: 0.1,
					min: -18,
					max: 18,
				},
			],
			callback: async (action): Promise<void> => {
				const inputRef = parseRefToPaths(action.options.input, levelsChoices.allSourcesParseOptions)
				if (!inputRef?.trim) return

				props.sendOsc(inputRef.trim.path, {
					type: 'f',
					value: trimToFloat(action.options.trim),
				})
			},
		},
		headamp_gain: {
			name: 'Set Headamp gain',
			options: [
				{
					type: 'dropdown',
					label: 'Headamp',
					id: 'headamp',
					...convertChoices(GetHeadampChoices()),
					expressionDescription: `eg 'local1', 'aes-a1', 'aes-b1'`,
				},
				HeadampGainChoice,
			],
			callback: async (action): Promise<void> => {
				const refPath = parseHeadampRef(action.options.headamp)
				if (!refPath) return

				props.sendOsc(`${refPath}/gain`, {
					type: 'f',
					value: headampGainToFloat(action.options.gain),
				})
			},
		},
	}
}
