import { ActionId } from './actions.js'
import { X32Config } from './config.js'
import { FeedbackId } from './feedback.js'
import { X32State } from './state.js'
import { GetLevelsChoiceConfigs } from './choices.js'
import { SetRequired } from 'type-fest'
import {
	combineRgb,
	CompanionPresetDefinitions,
	CompanionPresetFeedback,
	CompanionButtonPresetDefinition,
} from '@companion-module/base'
import { InstanceBaseExt } from './util.js'

interface CompanionPresetExt extends CompanionButtonPresetDefinition {
	feedbacks: Array<
		{
			feedbackId: FeedbackId
		} & SetRequired<CompanionPresetFeedback, 'style'>
	>
	// actions: Array<
	// 	{
	// 		action: ActionId
	// 	} & SomeCompanionPreset['actions'][0]
	// >
	// release_actions?: Array<
	// 	{
	// 		action: ActionId
	// 	} & NonNullable<CompanionPreset['release_actions']>[0]
	// >
}

export function GetPresetsList(_instance: InstanceBaseExt<X32Config>, state: X32State): CompanionPresetDefinitions {
	const presets: {
		[id: string]: CompanionPresetExt | undefined
	} = {}

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
			color: combineRgb(255, 255, 255),
			bgcolor: combineRgb(0, 0, 0),
		},
		options: {
			stepAutoProgress: true,
		},
		steps: [
			{
				down: [
					{
						actionId: ActionId.Record,
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
						actionId: ActionId.Record,
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
					color: combineRgb(255, 255, 255),
					bgcolor: combineRgb(255, 0, 0),
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
			color: combineRgb(255, 255, 255),
			bgcolor: combineRgb(0, 0, 0),
		},
		steps: [
			{
				down: [
					{
						actionId: ActionId.AddMarker,
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
			color: combineRgb(255, 255, 255),
			bgcolor: combineRgb(0, 0, 0),
		},
		steps: [
			{
				down: [
					{
						actionId: ActionId.TalkbackTalk,
						options: {
							channel: 'A',
							on: 1,
						},
					},
				],
				up: [
					{
						actionId: ActionId.TalkbackTalk,
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
					state: true,
				},
				style: {
					bgcolor: combineRgb(255, 127, 0),
					color: combineRgb(0, 0, 0),
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
			color: combineRgb(255, 255, 255),
			bgcolor: combineRgb(0, 0, 0),
		},
		steps: [
			{
				down: [
					{
						actionId: ActionId.TalkbackTalk,
						options: {
							channel: 'A',
							on: 2,
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
					state: true,
				},
				style: {
					bgcolor: combineRgb(255, 127, 0),
					color: combineRgb(0, 0, 0),
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
			color: combineRgb(255, 255, 255),
			bgcolor: combineRgb(0, 0, 0),
		},
		steps: [
			{
				down: [
					{
						actionId: ActionId.TalkbackTalk,
						options: {
							channel: 'B',
							on: 1,
						},
					},
				],
				up: [
					{
						actionId: ActionId.TalkbackTalk,
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
					state: true,
				},
				style: {
					bgcolor: combineRgb(255, 127, 0),
					color: combineRgb(0, 0, 0),
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
			color: combineRgb(255, 255, 255),
			bgcolor: combineRgb(0, 0, 0),
		},
		steps: [
			{
				down: [
					{
						actionId: ActionId.TalkbackTalk,
						options: {
							channel: 'B',
							on: 2,
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
					state: true,
				},
				style: {
					bgcolor: combineRgb(255, 127, 0),
					color: combineRgb(0, 0, 0),
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
				color: combineRgb(255, 255, 255),
				bgcolor: combineRgb(0, 0, 0),
			},
			steps: [
				{
					down: [
						{
							actionId: ActionId.FaderLevelStore,
							options: {
								target: sampleChannel.id,
							},
						},
						{
							actionId: ActionId.FaderLevelDelta,
							options: {
								target: sampleChannel.id,
								delta: -10,
								duration: 0,
							},
						},
					],
					up: [
						{
							actionId: ActionId.FaderLevelRestore,
							options: {
								target: sampleChannel.id,
								duration: 0,
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
				color: combineRgb(255, 255, 255),
				bgcolor: combineRgb(0, 0, 0),
			},
			steps: [
				{
					down: [
						{
							actionId: ActionId.ChannelSendLevelStore,
							options: {
								source: sampleInput.id,
								target: sampleChannelSendTarget.id,
							},
						},
						{
							actionId: ActionId.ChannelSendLevelDelta,
							options: {
								source: sampleInput.id,
								target: sampleChannelSendTarget.id,
								delta: -10,
								duration: 0,
							},
						},
					],
					up: [
						{
							actionId: ActionId.ChannelSendLevelRestore,
							options: {
								source: sampleInput.id,
								target: sampleChannelSendTarget.id,
								duration: 0,
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
				color: combineRgb(255, 255, 255),
				bgcolor: combineRgb(0, 0, 0),
			},
			steps: [
				{
					down: [
						{
							actionId: ActionId.BusSendLevelStore,
							options: {
								source: sampleBusSendSource.id,
								target: sampleBusSendTarget.id,
							},
						},
						{
							actionId: ActionId.BusSendLevelDelta,
							options: {
								source: sampleBusSendSource.id,
								target: sampleBusSendTarget.id,
								delta: -10,
								duration: 0,
							},
						},
					],
					up: [
						{
							actionId: ActionId.BusSendLevelRestore,
							options: {
								source: sampleBusSendSource.id,
								target: sampleBusSendTarget.id,
								duration: 0,
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
