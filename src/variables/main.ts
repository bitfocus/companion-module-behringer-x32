/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
import type { CompanionVariableDefinition, JsonValue, OSCMetaArgument } from '@companion-module/base'
import { getStringArg } from './util.js'
import type { X32State } from '../state.js'
import { getColorChoiceFromId, GetNameFromState, GetTargetPaths } from '../choices.js'
import { floatToDB } from '../util.js'

export interface MyVariableDefinition extends CompanionVariableDefinition {
	oscPath: string | null
	additionalPaths?: string[]
	getValue: (args: OSCMetaArgument[] | undefined, state: X32State) => JsonValue | undefined
}

const allSources = GetTargetPaths({
	allowStereo: true,
	allowMono: true,
	allowChannel: true,
	allowAuxIn: true,
	allowFx: true,
	allowBus: true,
	allowMatrix: true,
	allowDca: true,
})
const busSources = GetTargetPaths({ allowBus: true })
const matrixSources = GetTargetPaths({ allowMatrix: true })

const sendToBusSources = GetTargetPaths({
	allowChannel: true,
	allowAuxIn: true,
	allowFx: true,
})

export const STORED_CHANNEL_ID = 'stored_channel'

export const VariableDefinitions: MyVariableDefinition[] = [
	{
		name: 'Device name',
		variableId: 'm_name',
		oscPath: '/xinfo',
		getValue: (args) => getStringArg(args, 1),
	},
	{
		name: 'Device model',
		variableId: 'm_model',
		oscPath: '/xinfo',
		getValue: (args) => getStringArg(args, 2),
	},
	{
		name: 'Device firmware',
		variableId: 'm_fw',
		oscPath: '/xinfo',
		getValue: (args) => getStringArg(args, 3),
	},
	{
		name: 'Tape Timestamp mm:ss',
		variableId: 'tape_time_ms',
		oscPath: '/-stat/tape/etime',
		getValue: (args) => {
			const time = args && args[0]?.type === 'i' ? args[0].value : 0
			const mm = `${Math.floor(time / 60) % 60}`.padStart(2, '0')
			const ss = `${time % 60}`.padStart(2, '0')
			return `${mm}:${ss}`
		},
	},
	{
		name: 'Tape Timestamp hh:mm:ss',
		variableId: 'tape_time_hms',
		oscPath: '/-stat/tape/etime',
		getValue: (args) => {
			const time = args && args[0]?.type === 'i' ? args[0].value : 0
			const hh = `${Math.floor(time / 3600)}`.padStart(2, '0')
			const mm = `${Math.floor(time / 60) % 60}`.padStart(2, '0')
			const ss = `${time % 60}`.padStart(2, '0')
			return `${hh}:${mm}:${ss}`
		},
	},
	{
		name: 'Urec Timestamp mm:ss',
		variableId: 'urec_etime_ms',
		oscPath: '/-stat/urec/etime',
		getValue: (args) => {
			const time = args && args[0]?.type === 'i' ? args[0].value : 0
			const mm = `${Math.floor(time / 1000 / 60) % 60}`.padStart(2, '0')
			const ss = `${Math.floor(time / 1000) % 60}`.padStart(2, '0')
			return `${mm}:${ss}`
		},
	},
	{
		name: 'Urec Timestamp hh:mm:ss',
		variableId: 'urec_etime_hms',
		oscPath: '/-stat/urec/etime',
		getValue: (args) => {
			const time = args && args[0]?.type === 'i' ? args[0].value : 0
			const mm = `${Math.floor(time / 1000 / 60) % 60}`.padStart(2, '0')
			const ss = `${Math.floor(time / 1000) % 60}`.padStart(2, '0')
			const hh = `${Math.floor(time / 1000 / 60 / 60) % 60}`.padStart(2, '0')
			return `${hh}:${mm}:${ss}`
		},
	},
	{
		name: 'Urec remaining mm:ss',
		variableId: 'urec_rtime_ms',
		oscPath: '/-stat/urec/rtime',
		getValue: (args) => {
			const time = args && args[0]?.type === 'i' ? args[0].value : 0
			const mm = `${Math.floor(time / 1000 / 60) % 60}`.padStart(2, '0')
			const ss = `${Math.floor(time / 1000) % 60}`.padStart(2, '0')
			return `${mm}:${ss}`
		},
	},
	{
		name: 'Urec remaining hh:mm:ss',
		variableId: 'urec_rtime_hms',
		oscPath: '/-stat/urec/rtime',
		getValue: (args) => {
			const time = args && args[0]?.type === 'i' ? args[0].value : 0
			const mm = `${Math.floor(time / 1000 / 60) % 60}`.padStart(2, '0')
			const ss = `${Math.floor(time / 1000) % 60}`.padStart(2, '0')
			const hh = `${Math.floor(time / 1000 / 60 / 60) % 60}`.padStart(2, '0')
			return `${hh}:${mm}:${ss}`
		},
	},
	{
		name: 'Stored channel',
		variableId: STORED_CHANNEL_ID,
		oscPath: null,
		getValue: (_args, state) => state.getStoredChannel(),
	},
	{
		name: 'Selected channel number',
		variableId: 'selected_channel',
		oscPath: '/-stat/selidx',
		getValue: (args) => {
			const index = args && args[0]?.type === 'i' ? args[0].value : 0
			const selectedChannel = allSources.find((s) => s.selectNumber === index)

			return selectedChannel?.defaultRef ?? allSources[0].defaultRef
		},
	},
	{
		name: 'Selected channel name',
		variableId: 'selected_name',
		oscPath: '/-stat/selidx',
		// This can be affected by any channel's name, so we listen to them all. It's a bit inefficient but it works well enough
		additionalPaths: allSources.map((s) => s.config?.name).filter((n): n is string => !!n),
		getValue: (args, state) => {
			const index = args && args[0]?.type === 'i' ? args[0].value : 0
			const selectedChannel = allSources.find((s) => s.selectNumber === index)
			if (!selectedChannel) return allSources[0].defaultName

			return GetNameFromState(state, selectedChannel) ?? selectedChannel.defaultName
		},
	},
	{
		name: 'Undo Time',
		variableId: 'undo_time',
		oscPath: '/-undo/time',
		getValue: (args) => {
			return args && args[0]?.type === 's' ? args[0].value : '--:--:--'
		},
	},
]

for (const target of allSources) {
	if (!target.variablesPrefix) continue

	if (target.config?.name) {
		VariableDefinitions.push({
			name: `variableId: ${target.defaultName}`,
			variableId: `name_${target.variablesPrefix}`,
			oscPath: target.config.name,
			getValue: (_args, state) => GetNameFromState(state, target) ?? target.defaultName,
		})
	}
	if (target.config?.color) {
		VariableDefinitions.push({
			name: `Color: ${target.defaultName}`,
			variableId: `color_${target.variablesPrefix}`,
			oscPath: target.config.color,
			getValue: (args) => {
				const colorStr = getColorChoiceFromId(args && args[0]?.type === 'i' ? args[0].value : '')?.label
				return colorStr || 'unknown'
			},
		})
	}
	if (target.level?.path) {
		VariableDefinitions.push({
			name: `Fader: ${target.defaultName}`,
			variableId: `fader_${target.variablesPrefix}`,
			oscPath: target.level.path,
			getValue: (args) => {
				const faderNum = args && args[0]?.type === 'f' ? args[0].value : NaN
				return isNaN(faderNum) ? undefined : floatToDB(faderNum)
			},
		})
	}
}

for (const source of sendToBusSources) {
	if (!source.variablesPrefix || !source.sendTo) continue
	for (const dest of busSources) {
		if (!dest.variablesPrefix || !dest.sendToSink) continue

		VariableDefinitions.push({
			name: `Fader: ${source.defaultName} to ${dest.defaultName}`,
			variableId: `fader_${source.variablesPrefix}_to_${dest.variablesPrefix}`,
			oscPath: `${source.sendTo.path}/${dest.sendToSink.on}`,
			getValue: (args) => {
				const faderNum = args && args[0]?.type === 'f' ? args[0].value : NaN
				return isNaN(faderNum) ? undefined : floatToDB(faderNum)
			},
		})
	}
}

for (const source of busSources) {
	if (!source.variablesPrefix || !source.sendTo) continue
	for (const dest of matrixSources) {
		if (!dest.variablesPrefix || !dest.sendToSink) continue

		VariableDefinitions.push({
			name: `Fader: ${source.defaultName} to ${dest.defaultName}`,
			variableId: `fader_${source.variablesPrefix}_to_${dest.variablesPrefix.replace('mtx', 'matrix')}`, // HACK: backwards compatibility
			oscPath: `${source.sendTo.path}/${dest.sendToSink.on}`,
			getValue: (args) => {
				const faderNum = args && args[0]?.type === 'f' ? args[0].value : NaN
				return isNaN(faderNum) ? undefined : floatToDB(faderNum)
			},
		})
	}
}
