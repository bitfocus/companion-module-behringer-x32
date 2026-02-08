import type { X32Transitions } from '../transitions.js'
import type { X32State } from '../state.js'
import type { CompanionActionDefinitions, OSCMetaArgument } from '@companion-module/base'
import { getXLiveActions, type XLiveActionsSchema } from './x-live.js'
import { getMarkerActions, type MarkerActionsSchema } from './marker.js'
import { getMuteActions, type MuteActionsSchema } from './mute.js'
import { getFaderActions, type FaderActionsSchema } from './fader.js'
import { getPanningActions, PanningActionsSchema } from './panning.js'
import { ChannelSendLevelActionsSchema, getChannelSendLevelActions } from './channel-send-level.js'
import { ChannelSendPanningActionsSchema, getChannelSendPanningActions } from './channel-send-panning.js'
import { BusSendLevelActionsSchema, getBusSendLevelActions } from './bus-send-level.js'
import { BusSendPanningActionsSchema, getBusSendPanningActions } from './bus-send-panning.js'
import { getTalkbackActions, TalkbackActionsSchema } from './talkback.js'
import { getOscillatorActions, OscillatorActionsSchema } from './oscillator.js'
import { getSoloActions, SoloActionsSchema } from './solo.js'
import { getLabelsActions, LabelsActionsSchema } from './labels.js'
import { getPresetsActions, PresetsActionsSchema } from './presets.js'
import { getGoCommandActions, GoCommandActionsSchema } from './go-command.js'
import { getRoutingActions, RoutingActionsSchema } from './routing.js'

export type ActionsSchema = XLiveActionsSchema &
	MarkerActionsSchema &
	MuteActionsSchema &
	FaderActionsSchema &
	PanningActionsSchema &
	ChannelSendLevelActionsSchema &
	ChannelSendPanningActionsSchema &
	BusSendLevelActionsSchema &
	BusSendPanningActionsSchema &
	TalkbackActionsSchema &
	OscillatorActionsSchema &
	SoloActionsSchema &
	LabelsActionsSchema &
	PresetsActionsSchema &
	GoCommandActionsSchema &
	RoutingActionsSchema

export interface ActionsProps {
	readonly transitions: X32Transitions
	readonly state: X32State
	readonly sendOsc: (path: string, args: OSCMetaArgument | OSCMetaArgument[]) => void
	readonly ensureLoaded: (path: string | undefined) => void
}

export function GetActionsList(props: ActionsProps): CompanionActionDefinitions<ActionsSchema> {
	return {
		...getXLiveActions(props),
		...getMarkerActions(props),
		...getMuteActions(props),
		...getFaderActions(props),
		...getPanningActions(props),
		...getChannelSendLevelActions(props),
		...getChannelSendPanningActions(props),
		...getBusSendLevelActions(props),
		...getBusSendPanningActions(props),
		...getTalkbackActions(props),
		...getOscillatorActions(props),
		...getSoloActions(props),
		...getLabelsActions(props),
		...getPresetsActions(props),
		...getGoCommandActions(props),
		...getRoutingActions(props),
	}
}
