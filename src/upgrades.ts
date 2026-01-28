/* eslint-disable @typescript-eslint/no-unsafe-enum-comparison */
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
