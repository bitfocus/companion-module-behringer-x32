/* eslint-disable @typescript-eslint/no-unsafe-enum-comparison */
import type { CompanionStaticUpgradeResult, CompanionStaticUpgradeScript } from '@companion-module/base'
import { FeedbackId } from './feedback.js'

export const BooleanFeedbackUpgradeMap: {
	[id in FeedbackId]?: true
} = {
	[FeedbackId.Mute]: true,
	[FeedbackId.MuteGroup]: true,
	[FeedbackId.MuteChannelSend]: true,
	[FeedbackId.MuteBusSend]: true,
	[FeedbackId.FaderLevel]: true,
	[FeedbackId.ChannelSendLevel]: true,
	[FeedbackId.BusSendLevel]: true,
	[FeedbackId.TalkbackTalk]: true,
	[FeedbackId.OscillatorEnable]: true,
	[FeedbackId.OscillatorDestination]: true,
}

export const upgradeToBuiltinFeedbackInverted: CompanionStaticUpgradeScript<any> = (_ctx, props) => {
	const result: CompanionStaticUpgradeResult<any, undefined> = {
		updatedConfig: null,
		updatedSecrets: null,
		updatedActions: [],
		updatedFeedbacks: [],
	}

	const feedbackIdsToUpgrade = new Set<string>([
		FeedbackId.Mute,
		FeedbackId.MuteGroup,
		FeedbackId.MuteChannelSend,
		FeedbackId.MuteBusSend,
		FeedbackId.TalkbackTalk,
		FeedbackId.TalkbackConfigSingleSource,
		FeedbackId.OscillatorEnable,
		FeedbackId.Solo,
		FeedbackId.ClearSolo,
		FeedbackId.SendsOnFader,
		FeedbackId.SoloMono,
		FeedbackId.SoloDim,
		FeedbackId.ChannelBank,
		FeedbackId.GroupBank,
		FeedbackId.ChannelBankCompact,
		FeedbackId.GroupBankCompact,
		FeedbackId.BusSendBank,
		FeedbackId.UserBank,
		FeedbackId.Screens,
		FeedbackId.MuteGroupScreen,
		FeedbackId.UtilityScreen,
		FeedbackId.ChannelPage,
		FeedbackId.MeterPage,
		FeedbackId.RoutePage,
		FeedbackId.SetupPage,
		FeedbackId.LibPage,
		FeedbackId.FxPage,
		FeedbackId.MonPage,
		FeedbackId.USBPage,
		FeedbackId.ScenePage,
		FeedbackId.AssignPage,
		FeedbackId.RouteUserIn,
		FeedbackId.RouteUserOut,
		FeedbackId.StoredChannel,
		FeedbackId.RouteInputBlockMode,
		FeedbackId.RouteInputBlocks,
		FeedbackId.RouteAuxBlocks,
		FeedbackId.RouteAES50Blocks,
		FeedbackId.RouteCardBlocks,
		FeedbackId.RouteXLRLeftOutputs,
		FeedbackId.RouteXLRRightOutputs,
		FeedbackId.LockAndShutdown,
		FeedbackId.InsertOn,
		FeedbackId.UndoAvailable,
	])
	for (const feedback of props.feedbacks) {
		if (!feedbackIdsToUpgrade.has(feedback.feedbackId)) continue

		// Migrate to built-in inverted state
		feedback.isInverted = {
			isExpression: false, // The existing ones can never be true, as expressions were not supported until this script
			value: feedback.isInverted?.value ? !!feedback.options.state?.value : !feedback.options.state?.value,
		}
		delete feedback.options.state

		result.updatedFeedbacks.push(feedback)
	}

	return result
}
