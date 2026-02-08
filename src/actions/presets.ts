import type { CompanionActionDefinitions } from '@companion-module/base'
import type { ActionsProps } from './main.js'
import { convertChoices, GetPresetsChoices, GetTargetChoices } from '../choices.js'
import { ParseRefOptions, parseRefToPaths } from '../paths.js'
import { padNumber } from '../util.js'

export type PresetsActionsSchema = {
	'load-channel-preset': {
		options: {
			preset: number
			channel: string
			ha: boolean
			config: boolean
			gate: boolean
			dyn: boolean
			eq: boolean
			sends: boolean
		}
	}
	'load-fx-preset': {
		options: {
			preset: number
			channel: number
		}
	}
	'load-aes-preset': {
		options: {
			preset: number
		}
	}
}

export function getPresetsActions(props: ActionsProps): CompanionActionDefinitions<PresetsActionsSchema> {
	const selectChoicesParseOptions: ParseRefOptions = {
		allowStereo: true,
		allowMono: true,
		allowChannel: true,
		allowAuxIn: true,
		allowFx: true,
		allowBus: true,
		allowMatrix: true,
	}
	const selectChoices = GetTargetChoices(props.state, selectChoicesParseOptions)

	return {
		'load-channel-preset': {
			name: 'Load channel preset',
			description:
				"Load channel preset either into specified channel or into selected channel. Use at own risk. (Maybe don't accidently press during a show?)",
			options: [
				{
					type: 'dropdown',
					label: 'Preset to load',
					id: 'preset',
					...convertChoices(GetPresetsChoices('ch', props.state)),
					allowInvalidValues: true,
				},
				{
					type: 'dropdown',
					label: 'Target channel',
					id: 'channel',
					...convertChoices([
						{
							id: 'selected',
							label: '- Selected Channel -',
						},
						...selectChoices,
					]),
					allowInvalidValues: true,
				},
				{
					id: 'ha',
					type: 'checkbox',
					label: 'Load headamp data',
					default: true,
				},
				{
					id: 'config',
					type: 'checkbox',
					label: 'Load configuration data',
					default: true,
				},
				{
					id: 'gate',
					type: 'checkbox',
					label: 'Load gate data',
					default: true,
				},
				{
					id: 'dyn',
					type: 'checkbox',
					label: 'Load compressor data',
					default: true,
				},
				{
					id: 'eq',
					type: 'checkbox',
					label: 'Load equalizer data',
					default: true,
				},
				{
					id: 'sends',
					type: 'checkbox',
					label: 'Load sends data',
					default: true,
				},
			],
			callback: (action): void => {
				let selectedChannel = -1
				if (action.options.channel !== 'selected') {
					const channelRef = parseRefToPaths(action.options.channel, selectChoicesParseOptions)
					if (channelRef?.selectNumber === undefined) return

					selectedChannel = channelRef.selectNumber
				} else {
					const selected = props.state.get('/-stat/selidx')
					selectedChannel = selected && selected[0].type === 'i' ? selected[0]?.value : 0
				}

				const preset = action.options.preset
				const hasDataState = props.state.get(`/-libs/ch/${padNumber(preset, 3)}/hasdata`)
				const hasDataValue = hasDataState && hasDataState[0]?.type === 'i' && hasDataState[0].value === 1
				if (!hasDataValue) {
					return
				}

				const scopeBits = [
					!!action.options.sends,
					!!action.options.eq,
					!!action.options.dyn,
					!!action.options.gate,
					!!action.options.config,
					!!action.options.ha,
				].reduce<number>((acc, cur) => (acc << 1) | (cur ? 1 : 0), 0)

				props.sendOsc('/load', [
					{ type: 's', value: 'libchan' },
					{ type: 'i', value: preset - 1 },
					{ type: 'i', value: selectedChannel },
					{ type: 'i', value: scopeBits },
				])
			},
			subscribe: (evt) => {
				props.ensureLoaded(`/-libs/ch/${padNumber(evt.options.preset, 3)}/hasdata`)
				props.ensureLoaded('/-stat/selidx')
			},
		},
		'load-fx-preset': {
			name: 'Load effects preset',
			description:
				"Load effects preset either into specified channel. Use at own risk. (Maybe don't accidently press during a show?)",
			options: [
				{
					type: 'dropdown',
					label: 'Preset to load',
					id: 'preset',
					...convertChoices(GetPresetsChoices('fx', props.state)),
					allowInvalidValues: true,
				},
				{
					type: 'dropdown',
					label: 'Target channel',
					id: 'channel',
					default: 0,
					// TODO - rework this to be tidier
					choices: [...[...Array(8).keys()].map((x) => ({ label: `${x + 1}`, id: x }))],
				},
			],
			callback: (action): void => {
				const preset = action.options.preset
				const hasDataState = props.state.get(`/-libs/fx/${padNumber(preset, 3)}/hasdata`)
				const hasDataValue = hasDataState && hasDataState[0]?.type === 'i' && hasDataState[0].value === 1
				if (!hasDataValue) {
					return
				}

				let channel = action.options.channel
				if (channel == -1) {
					const selected = props.state.get('/-stat/selidx')
					channel = selected && selected[0].type === 'i' ? selected[0]?.value : 0
				}
				props.sendOsc('/load', [
					{ type: 's', value: 'libfx' },
					{ type: 'i', value: preset - 1 },
					{ type: 'i', value: channel },
				])
			},
			subscribe: (evt) => {
				props.ensureLoaded(`/-libs/fx/${padNumber(evt.options.preset, 3)}/hasdata`)
				props.ensureLoaded('/-stat/selidx')
			},
		},
		// Not currently working...
		// Looks like Behringer changes things when they introduced User Routing and didnt update the OSC Command
		// We assume that when they added scopes to the routing they didnt update the OSC command so it just defaults to 0 and doesn't
		// read what we send as a parameter. Both `load ,si librout 5` and `load ,sii librout 5 255` respond with `load ,si librout 1`
		// which should indicate "success" but nothing happens on the X32 which leads us tyo believe that its "successfully" loading nothing.
		// I contacted Patrick‐Gilles Maillot, and he has tried to contact Behringer and they say is going to be a while before a dev can look
		// into it. Sadness =(. It seems X32 isn't getting as much love from Behringer as the Wing now days.
		// I also tried to see how X32edit loads presets and it doesn't even use the load command, instead it uses eight separate
		//`/config/routing` commands to set each config (for interest loading a channel preset kicks of 24 commands and sets
		// each property of the channel manually) so that exercise didn't help. This feature is missing on Mixing Station too
		// 'load-route-preset': {
		// 	name: 'Load routing preset',
		// 	description: "Load routing preset. Use at own risk. (Maybe don't accidently press during a show?)",
		// 	options: [
		// 		{
		// 			type: 'dropdown',
		// 			label: 'Preset to load',
		// 			id: 'preset',
		// 			...convertChoices(GetPresetsChoices('r', state)),
		// 		},
		// 		{
		// 			id: 'ch',
		// 			type: 'checkbox',
		// 			label: 'Load Channel In Routing',
		// 			default: true,
		// 		},
		// 		{
		// 			id: 'aes',
		// 			type: 'checkbox',
		// 			label: 'Load AES50 Out Routing',
		// 			default: true,
		// 		},
		// 		{
		// 			id: 'card',
		// 			type: 'checkbox',
		// 			label: 'Load Card Out Routing',
		// 			default: true,
		// 		},
		// 		{
		// 			id: 'xlr',
		// 			type: 'checkbox',
		// 			label: 'Load XLR Out Routing',
		// 			default: true,
		// 		},
		// 		{
		// 			id: 'out',
		// 			type: 'checkbox',
		// 			label: 'Load Out Patch',
		// 			default: true,
		// 		},
		// 		{
		// 			id: 'aux',
		// 			type: 'checkbox',
		// 			label: 'Load Aux Patch ',
		// 			default: true,
		// 		},
		// 		{
		// 			id: 'p16',
		// 			type: 'checkbox',
		// 			label: 'Load P16 Patch',
		// 			default: true,
		// 		},
		// 		{
		// 			id: 'user',
		// 			type: 'checkbox',
		// 			label: 'Load User Slots ',
		// 			default: true,
		// 		},
		// 	],
		// 	callback: (action): void => {
		// 		const preset = getOptNumber(action, 'preset', 0)
		// 		const paddedPreset = `${preset}`.padStart(3, '0')
		// 		const hasDataState = state.get(`/-libs/r/${paddedPreset}/hasdata`)
		// 		const hasDataValue = hasDataState && hasDataState[0]?.type === 'i' && hasDataState[0].value === 1
		// 		if (!hasDataValue) {
		// 			return
		// 		}

		// 		const scopeBits = [
		// 			!!action.options.ch,
		// 			!!action.options.aes,
		// 			!!action.options.card,
		// 			!!action.options.xlr,
		// 			!!action.options.out,
		// 			!!action.options.aux,
		// 			!!action.options.p16,
		// 			!!action.options.user,
		// 		].reduce<number>((acc, cur) => (acc << 1) | (cur ? 1 : 0), 0)

		// 		sendOsc('/load', [
		// 			{ type: 's', value: 'librout' },
		// 			{ type: 'i', value: preset - 1 },
		// 			{ type: 'i', value: scopeBits },
		// 		])
		// 	},
		// },
		'load-aes-preset': {
			name: 'Load AES/DP48 preset',
			description: "Load AES/DP48 preset. Use at own risk. (Maybe don't accidently press during a show?)",
			options: [
				{
					type: 'dropdown',
					label: 'Preset to load',
					id: 'preset',
					...convertChoices(GetPresetsChoices('mon', props.state)),
					allowInvalidValues: true,
				},
			],
			callback: (action): void => {
				const preset = action.options.preset
				const paddedPreset = `${preset}`.padStart(3, '0')
				const hasDataState = props.state.get(`/-libs/mon/${paddedPreset}/hasdata`)
				const hasDataValue = hasDataState && hasDataState[0]?.type === 'i' && hasDataState[0].value === 1
				if (!hasDataValue) {
					return
				}

				props.sendOsc('/load', [
					{ type: 's', value: 'libmon' },
					{ type: 'i', value: preset - 1 },
				])
			},
			subscribe: (evt) => {
				props.ensureLoaded(`/-libs/mon/${padNumber(evt.options.preset, 3)}/hasdata`)
			},
		},
	}
}
