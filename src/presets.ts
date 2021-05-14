import InstanceSkel = require('../../../instance_skel')
import { CompanionPreset } from '../../../instance_skel_types'
import { ActionId } from './actions'
import { X32Config } from './config'
import { FeedbackId } from './feedback'
import { X32State } from './state'
import { GetLevelsChoiceConfigs } from './choices'

interface CompanionPresetExt extends CompanionPreset {
	feedbacks: Array<
		{
			type: FeedbackId
		} & CompanionPreset['feedbacks'][0]
	>
	actions: Array<
		{
			action: ActionId
		} & CompanionPreset['actions'][0]
	>
	release_actions?: Array<
		{
			action: ActionId
		} & NonNullable<CompanionPreset['release_actions']>[0]
	>
}

export function GetPresetsList(instance: InstanceSkel<X32Config>, state: X32State): CompanionPreset[] {
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
				style: 'text',
				size: 'auto',
				color: instance.rgb(255, 255, 255),
				bgcolor: instance.rgb(0, 0, 0),
			},
			actions: [
				{
					action: ActionId.FaderLevelStore,
					options: {
						target: sampleChannel.id,
					},
				},
				{
					action: ActionId.FaderLevelDelta,
					options: {
						target: sampleChannel.id,
						delta: -10,
						duration: 0,
					},
				},
			],
			release_actions: [
				{
					action: ActionId.FaderLevelRestore,
					options: {
						target: sampleChannel.id,
						duration: 0,
					},
				},
			],
			feedbacks: [],
		})
	}

	if (sampleInput && sampleChannelSendTarget) {
		presets.push({
			label: 'Dip channel to bus send',
			category: 'Dip level',
			bank: {
				text: 'Dip channel send',
				style: 'text',
				size: 'auto',
				color: instance.rgb(255, 255, 255),
				bgcolor: instance.rgb(0, 0, 0),
			},
			actions: [
				{
					action: ActionId.ChannelSendLevelStore,
					options: {
						source: sampleInput.id,
						target: sampleChannelSendTarget.id,
					},
				},
				{
					action: ActionId.ChannelSendLevelDelta,
					options: {
						source: sampleInput.id,
						target: sampleChannelSendTarget.id,
						delta: -10,
						duration: 0,
					},
				},
			],
			release_actions: [
				{
					action: ActionId.ChannelSendLevelRestore,
					options: {
						source: sampleInput.id,
						target: sampleChannelSendTarget.id,
						duration: 0,
					},
				},
			],
			feedbacks: [],
		})
	}

	if (sampleBusSendSource && sampleBusSendTarget) {
		presets.push({
			label: 'Dip bus to matrix send',
			category: 'Dip level',
			bank: {
				text: 'Dip bus send',
				style: 'text',
				size: 'auto',
				color: instance.rgb(255, 255, 255),
				bgcolor: instance.rgb(0, 0, 0),
			},
			actions: [
				{
					action: ActionId.BusSendLevelStore,
					options: {
						source: sampleBusSendSource.id,
						target: sampleBusSendTarget.id,
					},
				},
				{
					action: ActionId.BusSendLevelDelta,
					options: {
						source: sampleBusSendSource.id,
						target: sampleBusSendTarget.id,
						delta: -10,
						duration: 0,
					},
				},
			],
			release_actions: [
				{
					action: ActionId.BusSendLevelRestore,
					options: {
						source: sampleBusSendSource.id,
						target: sampleBusSendTarget.id,
						duration: 0,
					},
				},
			],
			feedbacks: [],
		})
	}

	return presets
}
