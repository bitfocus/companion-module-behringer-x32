import type { CompanionActionDefinitions } from '@companion-module/base'
import type { ActionsProps } from './main.js'
import { convertChoices } from '../choices.js'

export type XLiveActionsSchema = {
	record: {
		options: {
			state: number
		}
	}
	'select-active-sdcard': {
		options: {
			card: number
		}
	}
	'recorded-tracks': {
		options: {
			tracks: number
		}
	}
	'select-playback-device': {
		options: {
			device: number
		}
	}
	'format-sdcard': {
		options: {
			card: number
		}
	}
	'x-live-routing': {
		options: {
			route: number
		}
	}
	'x-live-clear-alert': {
		options: {
			alert: number
		}
	}
	'x-live-position': {
		options: {
			position: number
		}
	}
}

export function getXLiveActions(props: ActionsProps): CompanionActionDefinitions<XLiveActionsSchema> {
	return {
		record: {
			name: 'Set X-live State',
			options: [
				{
					type: 'dropdown',
					label: 'State',
					id: 'state',
					choices: [
						{ id: 3, label: 'Record' },
						{ id: 2, label: 'Play' },
						{ id: 1, label: 'Pause' },
						{ id: 0, label: 'Stop' },
					],
					default: 3,
					disableAutoExpression: true,
				},
			],
			callback: (action): void => {
				props.sendOsc(`/-stat/urec/state`, {
					type: 'i',
					value: action.options.state,
				})
			},
		},

		'select-active-sdcard': {
			name: 'Select Active SD Card',
			description: 'Select Active SD Card',
			options: [
				{
					type: 'dropdown',
					label: 'SD Card',
					id: 'card',
					...convertChoices([
						{ id: 0, label: 'SD1' },
						{ id: 1, label: 'SD2' },
					]),
					disableAutoExpression: true,
				},
			],
			callback: (action): void => {
				props.sendOsc(`/‐prefs/card/URECsdsel`, {
					type: 'i',
					value: action.options.card,
				})
			},
		},
		'recorded-tracks': {
			name: 'Select number of recorded tracks',
			description: 'Select number of recorded tracks',
			options: [
				{
					type: 'dropdown',
					label: 'Number of tracks',
					id: 'tracks',
					...convertChoices([
						{ id: 0, label: '32 tracks' },
						{ id: 1, label: '16 tracks' },
						{ id: 2, label: '8 tracks' },
					]),
					disableAutoExpression: true,
				},
			],
			callback: (action): void => {
				props.sendOsc(`/‐prefs/card/URECtracks`, {
					type: 'i',
					value: action.options.tracks,
				})
			},
		},
		'select-playback-device': {
			name: 'Select playback device',
			description: 'Select playback device',
			options: [
				{
					type: 'dropdown',
					label: 'device',
					id: 'device',
					...convertChoices([
						{ id: 0, label: 'SD' },
						{ id: 1, label: 'USB' },
					]),
					disableAutoExpression: true,
				},
			],
			callback: (action): void => {
				props.sendOsc(`/‐prefs/card/URECplayb`, {
					type: 'i',
					value: action.options.device,
				})
			},
		},
		'format-sdcard': {
			name: 'Format SD Card',
			description: 'Format SD Card',
			options: [
				{
					type: 'dropdown',
					label: 'device',
					id: 'card',
					...convertChoices([
						{ id: 0, label: 'SD1' },
						{ id: 1, label: 'SD2' },
					]),
					disableAutoExpression: true,
				},
			],
			callback: (action): void => {
				props.sendOsc(`/‐action/formatcard`, {
					type: 'i',
					value: action.options.card,
				})
			},
		},

		'x-live-routing': {
			name: 'X-Live routing',
			description: 'X-Live routing',
			options: [
				{
					type: 'dropdown',
					label: 'X-Live route',
					id: 'route',
					...convertChoices([
						{ id: 0, label: 'Rec' },
						{ id: 1, label: 'Play' },
						{ id: 2, label: 'Auto' },
					]),
					disableAutoExpression: true,
				},
			],
			callback: (action): void => {
				props.sendOsc(`/‐prefs/card/URECrout`, {
					type: 'i',
					value: action.options.route,
				})
			},
		},
		'x-live-clear-alert': {
			name: 'X-Live Clear Alert',
			description: 'X-Live Clear Alert',
			options: [
				{
					type: 'dropdown',
					label: 'X-Live Clear Alert',
					id: 'alert',
					...convertChoices([
						{ id: 0, label: 'No-op' },
						{ id: 1, label: 'Clear alert' },
					]),
					disableAutoExpression: true,
				},
			],
			callback: (action): void => {
				props.sendOsc(`/‐action/clearalert`, {
					type: 'i',
					value: action.options.alert,
				})
			},
		},
		'x-live-position': {
			name: 'X-Live Position',
			description: 'X-Live Position',
			options: [
				{
					type: 'number',
					label: 'X-Live Position on sdcard',
					id: 'position',
					min: 0,
					max: 86399999,
					default: 0,
				},
			],
			callback: (action): void => {
				props.sendOsc(`/‐action/setposition`, {
					type: 'i',
					value: action.options.position,
				})
			},
		},
	}
}
