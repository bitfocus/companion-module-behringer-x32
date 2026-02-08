import { FeedbackId } from './feedback.js'
import { X32State } from './state.js'
import { CompanionPresetDefinitions } from '@companion-module/base'
import { InstanceBaseExt, X32Types } from './util.js'
import { GetLevelsChoiceConfigs, MUTE_TOGGLE } from './choices.js'

export function GetPresetsList(_instance: InstanceBaseExt, state: X32State): CompanionPresetDefinitions<X32Types> {
	const presets: CompanionPresetDefinitions<X32Types> = {}

	const levelsChoices = GetLevelsChoiceConfigs(state)

	const sampleChannel = levelsChoices.channels[0]
	const sampleInput = levelsChoices.allSources[0]
	const sampleChannelSendTarget = levelsChoices.channelSendTargets[0]
	const sampleBusSendSource = levelsChoices.busSendSources[0]
	const sampleBusSendTarget = levelsChoices.busSendTargets[0]

	presets['xlive-record'] = {
		name: 'X-Live Record',
		category: 'X-Live',
		type: 'button',
		style: {
			text: 'X-Live\\nRecord',
			size: 'auto',
			color: 0xffffff,
			bgcolor: 0x000000,
		},
		options: {
			stepAutoProgress: true,
		},
		steps: [
			{
				down: [
					{
						actionId: 'record',
						options: {
							state: 3,
						},
					},
				],
				up: [],
			},
			{
				down: [
					{
						actionId: 'record',
						options: {
							state: 0,
						},
					},
				],
				up: [],
			},
		],
		feedbacks: [
			{
				feedbackId: FeedbackId.Record,
				options: {
					state: 3,
				},
				style: {
					color: 0xffffff,
					bgcolor: 0xff0000,
				},
			},
		],
	}
	presets['xlive-add-marker'] = {
		name: 'Add marker',
		category: 'X-Live',
		type: 'button',
		style: {
			text: 'Add marker',
			size: 'auto',
			color: 0xffffff,
			bgcolor: 0x000000,
		},
		steps: [
			{
				down: [
					{
						actionId: 'add_marker',
						options: {},
					},
				],
				up: [],
			},
		],
		feedbacks: [],
	}

	presets['talkback-push-a'] = {
		name: 'Push to talk A',
		category: 'Talkback - Non-latching',
		type: 'button',
		style: {
			text: 'TALK A',
			size: 'auto',
			color: 0xffffff,
			bgcolor: 0x000000,
		},
		steps: [
			{
				down: [
					{
						actionId: 'talkback_talk',
						options: {
							channel: 'A',
							on: 1,
						},
					},
				],
				up: [
					{
						actionId: 'talkback_talk',
						options: {
							channel: 'A',
							on: 0,
						},
					},
				],
			},
		],
		feedbacks: [
			{
				feedbackId: FeedbackId.TalkbackTalk,
				options: {
					channel: 'A',
				},
				style: {
					bgcolor: 0xff7f00,
					color: 0x000000,
				},
			},
		],
	}

	presets['talkback-latch-a'] = {
		name: 'Latch talk A',
		category: 'Talkback - Latching',
		type: 'button',
		style: {
			text: 'TALK A',
			size: 'auto',
			color: 0xffffff,
			bgcolor: 0x000000,
		},
		steps: [
			{
				down: [
					{
						actionId: 'talkback_talk',
						options: {
							channel: 'A',
							on: MUTE_TOGGLE,
						},
					},
				],
				up: [],
			},
		],
		feedbacks: [
			{
				feedbackId: FeedbackId.TalkbackTalk,
				options: {
					channel: 'A',
				},
				style: {
					bgcolor: 0xff7f00,
					color: 0x000000,
				},
			},
		],
	}

	presets['talkback-push-b'] = {
		name: 'Push to talk B',
		category: 'Talkback - Non-latching',
		type: 'button',
		style: {
			text: 'TALK B',
			size: 'auto',
			color: 0xffffff,
			bgcolor: 0x000000,
		},
		steps: [
			{
				down: [
					{
						actionId: 'talkback_talk',
						options: {
							channel: 'B',
							on: 1,
						},
					},
				],
				up: [
					{
						actionId: 'talkback_talk',
						options: {
							channel: 'B',
							on: 0,
						},
					},
				],
			},
		],
		feedbacks: [
			{
				feedbackId: FeedbackId.TalkbackTalk,
				options: {
					channel: 'B',
				},
				style: {
					bgcolor: 0xff7f00,
					color: 0x000000,
				},
			},
		],
	}

	presets['talkback-latch-b'] = {
		name: 'Latch talk B',
		category: 'Talkback - Latching',
		type: 'button',
		style: {
			text: 'TALK B',
			size: 'auto',
			color: 0xffffff,
			bgcolor: 0x000000,
		},
		steps: [
			{
				down: [
					{
						actionId: 'talkback_talk',
						options: {
							channel: 'B',
							on: MUTE_TOGGLE,
						},
					},
				],
				up: [],
			},
		],
		feedbacks: [
			{
				feedbackId: FeedbackId.TalkbackTalk,
				options: {
					channel: 'B',
				},
				style: {
					bgcolor: 0xff7f00,
					color: 0x000000,
				},
			},
		],
	}

	if (sampleChannel) {
		presets['dip-fader-level'] = {
			name: 'Dip fader level',
			category: 'Dip level',
			type: 'button',
			style: {
				text: 'Dip fader',
				size: 'auto',
				color: 0xffffff,
				bgcolor: 0x000000,
			},
			steps: [
				{
					down: [
						{
							actionId: 'fader_store',
							options: {
								target: sampleChannel.id,
							},
						},
						{
							actionId: 'fader_delta',
							options: {
								target: sampleChannel.id,
								delta: -10,
								fadeDuration: 0,
								fadeAlgorithm: 'linear',
								fadeType: 'ease-in',
							},
						},
					],
					up: [
						{
							actionId: 'fader_restore',
							options: {
								target: sampleChannel.id,
								fadeDuration: 0,
								fadeAlgorithm: 'linear',
								fadeType: 'ease-in',
							},
						},
					],
				},
			],
			feedbacks: [],
		}
	}

	if (sampleInput && sampleChannelSendTarget) {
		presets['dip-channel-to-bus-send'] = {
			name: 'Dip channel to bus send',
			category: 'Dip level',
			type: 'button',
			style: {
				text: 'Dip channel send',
				size: 'auto',
				color: 0xffffff,
				bgcolor: 0x000000,
			},
			steps: [
				{
					down: [
						{
							actionId: 'level_channel_store',
							options: {
								source: sampleInput.id,
								target: sampleChannelSendTarget.id,
							},
						},
						{
							actionId: 'level_channel_send_delta',
							options: {
								source: sampleInput.id,
								target: sampleChannelSendTarget.id,
								delta: -10,
								fadeDuration: 0,
								fadeAlgorithm: 'linear',
								fadeType: 'ease-in',
							},
						},
					],
					up: [
						{
							actionId: 'level_channel_restore',
							options: {
								source: sampleInput.id,
								target: sampleChannelSendTarget.id,
								fadeDuration: 0,
								fadeAlgorithm: 'linear',
								fadeType: 'ease-in',
							},
						},
					],
				},
			],
			feedbacks: [],
		}
	}

	if (sampleBusSendSource && sampleBusSendTarget) {
		presets['dip-bus-to-matrix-send'] = {
			name: 'Dip bus to matrix send',
			category: 'Dip level',
			type: 'button',
			style: {
				text: 'Dip bus send',
				size: 'auto',
				color: 0xffffff,
				bgcolor: 0x000000,
			},
			steps: [
				{
					down: [
						{
							actionId: 'level_bus_store',
							options: {
								source: sampleBusSendSource.id,
								target: sampleBusSendTarget.id,
							},
						},
						{
							actionId: 'level_bus_send_delta',
							options: {
								source: sampleBusSendSource.id,
								target: sampleBusSendTarget.id,
								delta: -10,
								fadeDuration: 0,
								fadeAlgorithm: 'linear',
								fadeType: 'ease-in',
							},
						},
					],
					up: [
						{
							actionId: 'level_bus_restore',
							options: {
								source: sampleBusSendSource.id,
								target: sampleBusSendTarget.id,
								fadeDuration: 0,
								fadeAlgorithm: 'linear',
								fadeType: 'ease-in',
							},
						},
					],
				},
			],
			feedbacks: [],
		}
	}

	return presets
}
