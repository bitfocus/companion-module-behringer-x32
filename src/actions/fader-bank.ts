import type { CompanionActionDefinitions } from '@companion-module/base'
import type { ActionsProps } from './main.js'
import { CHOICES_ON_OFF, convertChoices, GetTargetChoices, MUTE_TOGGLE } from '../choices.js'
import { actionSubscriptionWrapper, getResolveOnOffMute } from './util.js'
import { ParseRefOptions, parseRefToPaths } from '../paths.js'

export type FaderBankActionsSchema = {
	select: {
		options: {
			select: string
		}
	}

	'channel-bank-full': {
		options: {
			bank: number
		}
	}
	'group-bank-full': {
		options: {
			bank: number
		}
	}
	'channel-bank-compact': {
		options: {
			bank: number
		}
	}
	'group-bank-compact': {
		options: {
			bank: number
		}
	}
	'sends-on-fader': {
		options: {
			on: number
		}
	}
	'bus-send-bank': {
		options: {
			bank: number
		}
	}
	'user-bank': {
		options: {
			bank: number
		}
	}
}

export function getFaderBankActions(props: ActionsProps): CompanionActionDefinitions<FaderBankActionsSchema> {
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
		select: {
			name: 'Select',
			options: [
				{
					type: 'dropdown',
					label: 'Target',
					id: 'select',
					...convertChoices(selectChoices),
					allowInvalidValues: true,
				},
			],
			callback: async (action): Promise<void> => {
				const selectRef = parseRefToPaths(action.options.select, selectChoicesParseOptions)
				if (selectRef?.selectNumber === undefined) return

				props.sendOsc(`/-stat/selidx`, {
					type: 'i',
					value: selectRef.selectNumber,
				})
			},
		},

		'channel-bank-full': {
			name: 'Select active channel bank (X32/M32)',
			description:
				'Select a channel bank for the left hand side of your console. Please note this action is for the X32 and M32. For X32 Compact/X32 Producer/M32R please use the X32 Compact/X32 Producer/M32R action',
			options: [
				{
					type: 'dropdown',
					label: 'Bank',
					id: 'bank',
					...convertChoices([
						{
							id: '0',
							label: 'CH 1 - 16',
						},
						{
							id: '1',
							label: 'CH 17 - 32',
						},
						{
							id: '2',
							label: 'AUX IN / USB / FX RTN',
						},
						{
							id: '3',
							label: 'BUS MASTERS',
						},
					]),
					disableAutoExpression: true,
				},
			],
			callback: async (action): Promise<void> => {
				props.sendOsc(`/-stat/chfaderbank`, {
					type: 'i',
					value: action.options.bank,
				})
			},
		},
		'group-bank-full': {
			name: 'Select active group bank (X32/M32)',
			description:
				'Select a group bank for the right hand side of your console. Please note this action is for the X32 and M32. For X32 Compact/X32 Producer/M32R please use the X32 Compact/X32 Producer/M32R action',
			options: [
				{
					type: 'dropdown',
					label: 'Bank',
					id: 'bank',
					...convertChoices([
						{
							id: '0',
							label: 'GROUP DCA 1 - 8',
						},
						{
							id: '1',
							label: 'BUS 1 - 8',
						},
						{
							id: '2',
							label: 'BUS 9 - 16',
						},
						{
							id: '3',
							label: 'MATRIX 1 - 6 / MAIN C',
						},
					]),
					disableAutoExpression: true,
				},
			],
			callback: async (action): Promise<void> => {
				props.sendOsc(`/-stat/grpfaderbank`, {
					type: 'i',
					value: action.options.bank,
				})
			},
		},
		'channel-bank-compact': {
			name: 'Select active channel bank (X32 Compact/X32 Producer/M32R)',
			description:
				'Select a channel bank for the left hand side of your console. Please note this action is for X32 Compact/X32 Producer/M32R. For X32 or M32 please use the X32/M32 action',
			options: [
				{
					type: 'dropdown',
					label: 'Bank',
					id: 'bank',
					...convertChoices([
						{
							id: '0',
							label: 'CH 1 - 8',
						},
						{
							id: '1',
							label: 'CH 9 - 16',
						},
						{
							id: '2',
							label: 'CH 17 - 24',
						},
						{
							id: '3',
							label: 'CH 25 - 32',
						},
						{
							id: '4',
							label: 'AUX IN / USB',
						},
						{
							id: '5',
							label: 'FX RTN',
						},
						{
							id: '6',
							label: 'BUS 1-8',
						},
						{
							id: '7',
							label: 'BUS 1-8',
						},
					]),
					disableAutoExpression: true,
				},
			],
			callback: async (action): Promise<void> => {
				props.sendOsc(`/-stat/chfaderbank`, {
					type: 'i',
					value: action.options.bank,
				})
			},
		},
		'group-bank-compact': {
			name: 'Select active group bank (X32 Compact/X32 Producer/M32R)',
			description:
				'Select a group bank for the right hand side of your console. Please note this actions is for X32 Compact/X32 Producer/M32R. For X32 or M32 please use the X32/M32 action',
			options: [
				{
					type: 'dropdown',
					label: 'Bank',
					id: 'bank',
					...convertChoices([
						{
							id: '0',
							label: 'GROUP DCA 1 - 8',
						},
						{
							id: '1',
							label: 'BUS 1 - 8',
						},
						{
							id: '2',
							label: 'BUS 9 - 16',
						},
						{
							id: '3',
							label: 'MATRIX 1 - 6 / MAIN C',
						},
						{
							id: '4',
							label: 'CH 1 - 8',
						},
						{
							id: '5',
							label: 'CH 9 - 16',
						},
						{
							id: '6',
							label: 'CH 17 - 24',
						},
						{
							id: '7',
							label: 'CH 25 - 32',
						},
						{
							id: '8',
							label: 'AUX IN / USB',
						},
						{
							id: '9',
							label: 'FX RTN',
						},
					]),
					disableAutoExpression: true,
				},
			],
			callback: async (action): Promise<void> => {
				props.sendOsc(`/-stat/grpfaderbank`, {
					type: 'i',
					value: action.options.bank,
				})
			},
		},
		'sends-on-fader': {
			name: 'Sends on Fader/Fader Flip',
			options: [
				{
					type: 'dropdown',
					label: 'On / Off',
					id: 'on',
					...convertChoices(CHOICES_ON_OFF),
					disableAutoExpression: true,
				},
			],
			...actionSubscriptionWrapper(props, {
				getPath: () => `/-stat/sendsonfader`,
				execute: (action, cachedData) => {
					const onState = getResolveOnOffMute(cachedData, true, action.options.on)

					return {
						type: 'i',
						value: onState,
					}
				},
				shouldSubscribe: (options) => options.on === MUTE_TOGGLE,
				optionsToMonitorForSubscribe: ['on'],
			}),
		},
		'bus-send-bank': {
			name: 'Bus send bank',
			options: [
				{
					type: 'dropdown',
					label: 'Send Bank',
					id: 'bank',
					...convertChoices([
						{
							id: '0',
							label: 'Bus 1-4',
						},
						{
							id: '1',
							label: 'Bus 5-8',
						},
						{
							id: '2',
							label: 'Bus 9-12',
						},
						{
							id: '3',
							label: 'Bus 13-16',
						},
					]),
					disableAutoExpression: true,
				},
			],
			callback: async (action): Promise<void> => {
				props.sendOsc(`/-stat/bussendbank`, {
					type: 'i',
					value: action.options.bank,
				})
			},
		},
		'user-bank': {
			name: 'User Assign Bank',
			options: [
				{
					type: 'dropdown',
					label: 'User Bank',
					id: 'bank',
					...convertChoices([
						{
							id: '0',
							label: 'Set A',
						},
						{
							id: '1',
							label: 'Set B',
						},
						{
							id: '2',
							label: 'Set C',
						},
					]),
					disableAutoExpression: true,
				},
			],
			callback: async (action): Promise<void> => {
				props.sendOsc(`/-stat/userbank`, {
					type: 'i',
					value: action.options.bank,
				})
			},
		},
	}
}
