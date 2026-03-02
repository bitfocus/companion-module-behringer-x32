import type { CompanionActionDefinitions } from '@companion-module/base'
import type { ActionsProps } from './main.js'
import { CHOICES_COLOR, convertChoices, GetLevelsChoiceConfigs, parseColorNameToValue } from '../choices.js'
import { parseRefToPaths } from '../paths.js'
import { stringifyValueAlways } from '../util.js'

export type LabelsActionsSchema = {
	label: {
		options: {
			target: string
			lab: string
		}
	}
	color: {
		options: {
			target: string
			col: string
		}
	}
}

export function getLabelsActions(props: ActionsProps): CompanionActionDefinitions<LabelsActionsSchema> {
	const levelsChoices = GetLevelsChoiceConfigs(props.state)

	return {
		label: {
			name: 'Set label',
			options: [
				{
					type: 'dropdown',
					label: 'Target',
					id: 'target',
					...convertChoices(levelsChoices.channels),
					allowInvalidValues: true,
				},
				{
					type: 'textinput',
					label: 'Label',
					id: 'lab',
					default: '',
					useVariables: true,
				},
			],
			// Note: This technically needs a subscription, but its already loaded for variables
			callback: async (action): Promise<void> => {
				const targetRef = parseRefToPaths(action.options.target, levelsChoices.channelsParseOptions)
				if (!targetRef?.config) return

				props.sendOsc(targetRef.config.name, {
					type: 's',
					value: stringifyValueAlways(action.options.lab),
				})
			},
		},

		color: {
			name: 'Set color',
			options: [
				{
					type: 'dropdown',
					label: 'Target',
					id: 'target',
					...convertChoices(levelsChoices.channels),
					allowInvalidValues: true,
				},
				{
					type: 'dropdown',
					label: 'Color',
					id: 'col',
					...convertChoices(CHOICES_COLOR),
					allowInvalidValues: true,
				},
			],
			// Note: This technically needs a subscription, but its already loaded for variables
			callback: async (action): Promise<void> => {
				const targetRef = parseRefToPaths(action.options.target, levelsChoices.channelsParseOptions)
				if (!targetRef?.config) return

				const color = parseColorNameToValue(action.options.col)
				if (typeof color !== 'number') return

				props.sendOsc(targetRef.config.color, {
					type: 'i',
					value: color,
				})
			},
		},
	}
}
