import type { OSCMetaArgument, StringKeys } from '@companion-module/base'
import { getStringArg } from './util.js'
import type { X32State } from '../state.js'
import { getColorChoiceFromId, GetNameFromState, GetTargetPaths } from '../choices.js'
import { floatToDB } from '../util.js'
import { VariablesSchema } from './schema.js'

export type MyVariableDefinition<K extends keyof VariablesSchema> = {
	// variableId: K
	name: string
	oscPath: string | null
	additionalPaths?: string[]
	getValue: (args: OSCMetaArgument[] | undefined, state: X32State) => VariablesSchema[K] | undefined
}

/**
 * The definition of a variable
 */
export type MyVariableDefinitions = {
	[variableId in StringKeys<VariablesSchema>]: MyVariableDefinition<variableId>
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

export const VariableDefinitions: MyVariableDefinitions = {
	m_name: {
		name: 'Device name',
		oscPath: '/xinfo',
		getValue: (args) => getStringArg(args, 1),
	},
	m_model: {
		name: 'Device model',
		oscPath: '/xinfo',
		getValue: (args) => getStringArg(args, 2),
	},
	m_fw: {
		name: 'Device firmware',
		oscPath: '/xinfo',
		getValue: (args) => getStringArg(args, 3),
	},
	tape_time_ms: {
		name: 'Tape Timestamp mm:ss',
		oscPath: '/-stat/tape/etime',
		getValue: (args) => {
			const time = args && args[0]?.type === 'i' ? args[0].value : 0
			const mm = `${Math.floor(time / 60) % 60}`.padStart(2, '0')
			const ss = `${time % 60}`.padStart(2, '0')
			return `${mm}:${ss}`
		},
	},
	tape_time_hms: {
		name: 'Tape Timestamp hh:mm:ss',
		oscPath: '/-stat/tape/etime',
		getValue: (args) => {
			const time = args && args[0]?.type === 'i' ? args[0].value : 0
			const hh = `${Math.floor(time / 3600)}`.padStart(2, '0')
			const mm = `${Math.floor(time / 60) % 60}`.padStart(2, '0')
			const ss = `${time % 60}`.padStart(2, '0')
			return `${hh}:${mm}:${ss}`
		},
	},
	urec_etime_ms: {
		name: 'Urec Timestamp mm:ss',
		oscPath: '/-stat/urec/etime',
		getValue: (args) => {
			const time = args && args[0]?.type === 'i' ? args[0].value : 0
			const mm = `${Math.floor(time / 1000 / 60) % 60}`.padStart(2, '0')
			const ss = `${Math.floor(time / 1000) % 60}`.padStart(2, '0')
			return `${mm}:${ss}`
		},
	},
	urec_etime_hms: {
		name: 'Urec Timestamp hh:mm:ss',
		oscPath: '/-stat/urec/etime',
		getValue: (args) => {
			const time = args && args[0]?.type === 'i' ? args[0].value : 0
			const mm = `${Math.floor(time / 1000 / 60) % 60}`.padStart(2, '0')
			const ss = `${Math.floor(time / 1000) % 60}`.padStart(2, '0')
			const hh = `${Math.floor(time / 1000 / 60 / 60) % 60}`.padStart(2, '0')
			return `${hh}:${mm}:${ss}`
		},
	},
	urec_rtime_ms: {
		name: 'Urec remaining mm:ss',
		oscPath: '/-stat/urec/rtime',
		getValue: (args) => {
			const time = args && args[0]?.type === 'i' ? args[0].value : 0
			const mm = `${Math.floor(time / 1000 / 60) % 60}`.padStart(2, '0')
			const ss = `${Math.floor(time / 1000) % 60}`.padStart(2, '0')
			return `${mm}:${ss}`
		},
	},
	urec_rtime_hms: {
		name: 'Urec remaining hh:mm:ss',
		oscPath: '/-stat/urec/rtime',
		getValue: (args) => {
			const time = args && args[0]?.type === 'i' ? args[0].value : 0
			const mm = `${Math.floor(time / 1000 / 60) % 60}`.padStart(2, '0')
			const ss = `${Math.floor(time / 1000) % 60}`.padStart(2, '0')
			const hh = `${Math.floor(time / 1000 / 60 / 60) % 60}`.padStart(2, '0')
			return `${hh}:${mm}:${ss}`
		},
	},
	[STORED_CHANNEL_ID]: {
		name: 'Stored channel',
		oscPath: null,
		getValue: (_args, state) => state.getStoredChannel(),
	},
	selected_channel: {
		name: 'Selected channel number',
		oscPath: '/-stat/selidx',
		getValue: (args) => {
			const index = args && args[0]?.type === 'i' ? args[0].value : 0
			const selectedChannel = allSources.find((s) => s.selectNumber === index)

			return selectedChannel?.defaultRef ?? allSources[0].defaultRef
		},
	},
	selected_name: {
		name: 'Selected channel name',
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
	undo_time: {
		name: 'Undo Time',
		oscPath: '/-undo/time',
		getValue: (args) => {
			return args && args[0]?.type === 's' ? args[0].value : '--:--:--'
		},
	},
}

for (const target of allSources) {
	if (!target.variablesPrefix) continue

	if (target.config?.name) {
		VariableDefinitions[`name_${target.variablesPrefix}`] = {
			name: `variableId: ${target.defaultName}`,
			oscPath: target.config.name,
			getValue: (_args, state) => GetNameFromState(state, target) ?? target.defaultName,
		}
	}
	if (target.config?.color) {
		VariableDefinitions[`color_${target.variablesPrefix}`] = {
			name: `Color: ${target.defaultName}`,
			oscPath: target.config.color,
			getValue: (args) => {
				const colorStr = getColorChoiceFromId(args && args[0]?.type === 'i' ? args[0].value : '')?.label
				return colorStr || 'unknown'
			},
		}
	}
	if (target.level?.path) {
		VariableDefinitions[`fader_${target.variablesPrefix}`] = {
			name: `Fader: ${target.defaultName}`,
			oscPath: target.level.path,
			getValue: (args) => {
				const faderNum = args && args[0]?.type === 'f' ? args[0].value : NaN
				return isNaN(faderNum) ? undefined : floatToDB(faderNum)
			},
		}
	}
}

for (const source of sendToBusSources) {
	if (!source.variablesPrefix || !source.sendTo) continue
	for (const dest of busSources) {
		if (!dest.variablesPrefix || !dest.sendToSink) continue

		VariableDefinitions[`fader_${source.variablesPrefix}_to_${dest.variablesPrefix}`] = {
			name: `Fader: ${source.defaultName} to ${dest.defaultName}`,
			oscPath: `${source.sendTo.path}/${dest.sendToSink.on}`,
			getValue: (args) => {
				const faderNum = args && args[0]?.type === 'f' ? args[0].value : NaN
				return isNaN(faderNum) ? undefined : floatToDB(faderNum)
			},
		}
	}
}

for (const source of busSources) {
	if (!source.variablesPrefix || !source.sendTo) continue
	for (const dest of matrixSources) {
		if (!dest.variablesPrefix || !dest.sendToSink) continue

		const varName = `fader_${source.variablesPrefix}_to_${dest.variablesPrefix.replace('mtx', 'matrix')}` as const // HACK: backwards compatibility
		VariableDefinitions[varName] = {
			name: `Fader: ${source.defaultName} to ${dest.defaultName}`,
			oscPath: `${source.sendTo.path}/${dest.sendToSink.on}`,
			getValue: (args) => {
				const faderNum = args && args[0]?.type === 'f' ? args[0].value : NaN
				return isNaN(faderNum) ? undefined : floatToDB(faderNum)
			},
		}
	}
}
