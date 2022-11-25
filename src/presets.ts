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
			type: FeedbackId
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

	presets.push({
		label: 'X-Live Record',
		category: 'X-Live',
		bank: {
			text: 'X-Live\\nRecord',
			style: 'text',
			size: 'auto',
			latch: true,
			color: instance.rgb(255, 255, 255),
			bgcolor: instance.rgb(0, 0, 0),
		},
		actions: [
			{
				action: ActionId.Record,
				options: {
					state: 3,
				},
			},
		],
		release_actions: [
			{
				action: ActionId.Record,
				options: {
					state: 0,
				},
			},
		],
		feedbacks: [
			{
				type: FeedbackId.Record,
				options: {
					state: 3,
				},
				style: {
					color: instance.rgb(255, 255, 255),
					bgcolor: instance.rgb(255, 0, 0),
				},
			},
		],
	})
	presets.push({
		label: 'Add marker',
		category: 'X-Live',
		bank: {
			text: 'Add marker',
			style: 'text',
			size: 'auto',
			color: instance.rgb(255, 255, 255),
			bgcolor: instance.rgb(0, 0, 0),
		},
		actions: [
			{
				action: ActionId.AddMarker,
				options: {},
			},
		],
		feedbacks: [],
	})

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
