import { ActionId } from './actions.js'
import { X32Config } from './config.js'
import { FeedbackId } from './feedback.js'
import { X32State } from './state.js'
import { GetLevelsChoiceConfigs } from './choices.js'
import { SetRequired } from 'type-fest'
import { combineRgb, CompanionPresetFeedback, CompanionPresetPress, SomeCompanionPreset } from '@companion-module/base'
import { InstanceBaseExt } from './util.js'

interface CompanionPresetExt extends CompanionPresetPress {
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

export function GetPresetsList(_instance: InstanceBaseExt<X32Config>, state: X32State): SomeCompanionPreset[] {
	const presets: CompanionPresetExt[] = []

	const levelsChoices = GetLevelsChoiceConfigs(state)

	const sampleChannel = levelsChoices.channels[0]
	const sampleInput = levelsChoices.allSources[0]
	const sampleChannelSendTarget = levelsChoices.channelSendTargets[0]
	const sampleBusSendSource = levelsChoices.busSendSources[0]
	const sampleBusSendTarget = levelsChoices.busSendTargets[0]

	if (sampleChannel) {
		presets.push({
			label: 'Dip fader level',
			category: 'Dip level',
			bank: {
				text: 'Dip fader',
				style: 'press',
				size: 'auto',
				color: combineRgb(255, 255, 255),
				bgcolor: combineRgb(0, 0, 0),
			},
			action_sets: {
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
			feedbacks: [],
		})
	}

	if (sampleInput && sampleChannelSendTarget) {
		presets.push({
			label: 'Dip channel to bus send',
			category: 'Dip level',
			bank: {
				text: 'Dip channel send',
				style: 'press',
				size: 'auto',
				color: combineRgb(255, 255, 255),
				bgcolor: combineRgb(0, 0, 0),
			},
			action_sets: {
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
			feedbacks: [],
		})
	}

	if (sampleBusSendSource && sampleBusSendTarget) {
		presets.push({
			label: 'Dip bus to matrix send',
			category: 'Dip level',
			bank: {
				text: 'Dip bus send',
				style: 'press',
				size: 'auto',
				color: combineRgb(255, 255, 255),
				bgcolor: combineRgb(0, 0, 0),
			},
			action_sets: {
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
			feedbacks: [],
		})
	}

	return presets
}
