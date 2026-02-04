import { X32Config } from './config.js'
import { X32State } from './state.js'
import osc from 'osc'
import { GetTargetChoices, GetTargetPaths, getColorChoiceFromId } from './choices.js'
import { MainPath } from './paths.js'
import { formatDb, floatToDB, InstanceBaseExt } from './util.js'
import { CompanionVariableDefinition, CompanionVariableValues } from '@companion-module/base'

function sanitiseName(name: string): string {
	return name.replace(/\//g, '_')
}

export function InitVariables(instance: InstanceBaseExt<X32Config>, state: X32State): void {
	const variables: CompanionVariableDefinition[] = [
		{
			name: 'Device name',
			variableId: 'm_name',
		},
		{
			name: 'Device model',
			variableId: 'm_model',
		},
		{
			name: 'Device firmware',
			variableId: 'm_fw',
		},
		{
			name: 'Tape Timestamp mm:ss',
			variableId: 'tape_time_ms',
		},
		{
			name: 'Tape Timestamp hh:mm:ss',
			variableId: 'tape_time_hms',
		},
		{
			name: 'Urec Timestamp mm:ss',
			variableId: 'urec_etime_ms',
		},
		{
			name: 'Urec Timestamp hh:mm:ss',
			variableId: 'urec_etime_hms',
		},
		{
			name: 'Urec remaining mm:ss',
			variableId: 'urec_rtime_ms',
		},
		{
			name: 'Urec remaining hh:mm:ss',
			variableId: 'urec_rtime_hms',
		},
		{
			name: 'Stored channel',
			variableId: 'stored_channel',
		},
		{
			name: 'Selected channel number',
			variableId: 'selected_channel',
		},
		{
			name: 'Selected channel name',
			variableId: 'selected_name',
		},
		{
			name: 'Stored channel',
			variableId: 'stored_channel',
		},
		{
			name: 'Undo Time',
			variableId: 'undo_time',
		},
	]

	const targets = GetTargetPaths({
		allowStereo: true,
		allowMono: true,
		allowChannel: true,
		allowAuxIn: true,
		allowFx: true,
		allowBus: true,
		allowMatrix: true,
		allowDca: true,
	})
	for (const target of targets) {
		if (!target.variablesPrefix) continue

		variables.push({
			name: `variableId: ${target.defaultName}`,
			variableId: `name_${target.variablesPrefix}`,
		})
		variables.push({
			name: `Color: ${target.defaultName}`,
			variableId: `color_${target.variablesPrefix}`,
		})
		variables.push({
			name: `Fader: ${target.defaultName}`,
			variableId: `fader_${target.variablesPrefix}`,
		})
	}

	const busSources = GetTargetPaths({ allowBus: true })
	const matrixSources = GetTargetPaths({ allowMatrix: true })

	const sendSources = GetTargetPaths({
		allowChannel: true,
		allowAuxIn: true,
		allowFx: true,
	})
	for (const source of sendSources) {
		if (!source.variablesPrefix || !source.sendTo) continue
		for (const dest of busSources) {
			if (!dest.variablesPrefix || !dest.sendToSink) continue

			variables.push({
				name: `Fader: ${source.defaultName} to ${dest.defaultName}`,
				variableId: `fader_${source.variablesPrefix}_to_${dest.variablesPrefix}`,
			})
		}
	}

	for (const source of busSources) {
		if (!source.variablesPrefix || !source.sendTo) continue
		for (const dest of matrixSources) {
			if (!dest.variablesPrefix || !dest.sendToSink) continue

			variables.push({
				name: `Fader: ${source.defaultName} to ${dest.defaultName}`,
				variableId: `fader_${source.variablesPrefix}_to_${dest.variablesPrefix.replace('mtx', 'matrix')}`, // HACK: backwards compatibility
			})
		}
	}

	instance.setVariableDefinitions(variables)
	instance.setVariableValues({
		tape_time_hms: `--:--:--`,
		tape_time_ms: `--:--`,
		urec_etime_hms: `--:--:--`,
		urec_etime_ms: `--:--`,
		urec_rtime_hms: `--:--:--`,
		urec_rtime_ms: `--:--`,
		undo_time: '--:--:--',
		stored_channel: `${state.getStoredChannel()}`,
	})
}

export function updateDeviceInfoVariables(instance: InstanceBaseExt<X32Config>, args: osc.MetaArgument[]): void {
	const getStringArg = (index: number): string => {
		const raw = args[index]
		if (raw && raw.type === 's') {
			return raw.value
		} else {
			return ''
		}
	}
	instance.setVariableValues({
		m_name: getStringArg(1),
		m_model: getStringArg(2),
		m_fw: getStringArg(3),
	})
}

export function updateTapeTime(instance: InstanceBaseExt<X32Config>, state: X32State): void {
	const etime = state.get('/-stat/tape/etime')
	const time = etime && etime[0]?.type === 'i' ? etime[0].value : 0
	const hh = `${Math.floor(time / 3600)}`.padStart(2, '0')
	const mm = `${Math.floor(time / 60) % 60}`.padStart(2, '0')
	const ss = `${time % 60}`.padStart(2, '0')
	instance.setVariableValues({
		tape_time_hms: `${hh}:${mm}:${ss}`,
		tape_time_ms: `${mm}:${ss}`,
	})
}

export function updateUReceTime(instance: InstanceBaseExt<X32Config>, state: X32State): void {
	const etime = state.get('/-stat/urec/etime')
	const time = etime && etime[0]?.type === 'i' ? etime[0].value : 0
	const mm = `${Math.floor(time / 1000 / 60) % 60}`.padStart(2, '0')
	const ss = `${Math.floor(time / 1000) % 60}`.padStart(2, '0')
	const hh = `${Math.floor(time / 1000 / 60 / 60) % 60}`.padStart(2, '0')
	instance.setVariableValues({
		urec_etime_hms: `${hh}:${mm}:${ss}`,
		urec_etime_ms: `${mm}:${ss}`,
	})
}

export function updateURecrTime(instance: InstanceBaseExt<X32Config>, state: X32State): void {
	const etime = state.get('/-stat/urec/rtime')
	const time = etime && etime[0]?.type === 'i' ? etime[0].value : 0
	const mm = `${Math.floor(time / 1000 / 60) % 60}`.padStart(2, '0')
	const ss = `${Math.floor(time / 1000) % 60}`.padStart(2, '0')
	const hh = `${Math.floor(time / 1000 / 60 / 60) % 60}`.padStart(2, '0')
	instance.setVariableValues({
		urec_rtime_hms: `${hh}:${mm}:${ss}`,
		urec_rtime_ms: `${mm}:${ss}`,
	})
}

export function updateNameVariables(instance: InstanceBaseExt<X32Config>, state: X32State): void {
	const variables: CompanionVariableValues = {}
	const targets = GetTargetChoices(state, { includeMain: true, defaultNames: true })
	for (const target of targets) {
		const nameVal = state.get(`${target.id}/config/name`)
		const nameStr = nameVal && nameVal[0]?.type === 's' ? nameVal[0].value : ''
		variables[`name${sanitiseName(target.id as string)}`] = nameStr || target.label

		const colorVal = state.get(`${target.id}/config/color`)
		const colorStr = getColorChoiceFromId(colorVal && colorVal[0]?.type === 'i' ? colorVal[0].value : '')?.label
		variables[`color${sanitiseName(target.id as string)}`] = colorStr || 'unknown'

		const faderVal = state.get(`${MainPath(target.id as string)}/fader`)
		const faderNum = faderVal && faderVal[0]?.type === 'f' ? faderVal[0].value : NaN
		variables[`fader${sanitiseName(target.id as string)}`] = isNaN(faderNum) ? '-' : formatDb(floatToDB(faderNum))
	}

	const sendSources = GetTargetChoices(state, { defaultNames: true, skipBus: true, skipDca: true, skipMatrix: true })
	for (const target of sendSources) {
		for (let b = 1; b <= 16; b++) {
			const padded = `${b}`.padStart(2, '0')
			const faderVal = state.get(`${target.id}/mix/${padded}/level`)
			const faderNum = faderVal && faderVal[0]?.type === 'f' ? faderVal[0].value : NaN
			variables[`fader${sanitiseName(target.id as string)}_to_bus_${padded}`] = isNaN(faderNum)
				? '-'
				: formatDb(floatToDB(faderNum))
		}
	}

	const busSources = GetTargetChoices(state, { defaultNames: true, skipInputs: true, skipDca: true, skipMatrix: true })
	for (const target of busSources) {
		for (let m = 1; m <= 6; m++) {
			const padded = `${m}`.padStart(2, '0')
			const faderVal = state.get(`${target.id}/mix/${padded}/level`)
			const faderNum = faderVal && faderVal[0]?.type === 'f' ? faderVal[0].value : NaN
			variables[`fader${sanitiseName(target.id as string)}_to_matrix_${padded}`] = isNaN(faderNum)
				? '-'
				: formatDb(floatToDB(faderNum))
		}
	}
	instance.setVariableValues(variables)
}

export function updateStoredChannelVariable(instance: InstanceBaseExt<X32Config>, state: X32State): void {
	instance.setVariableValues({
		stored_channel: `${state.getStoredChannel()}`,
	})
}

export function updateSelectedVariables(instance: InstanceBaseExt<X32Config>, state: X32State): void {
	const selidx = state.get('/-stat/selidx')
	const index = selidx && selidx[0]?.type === 'i' ? selidx[0].value : 0

	const targets = GetTargetChoices(state, { includeMain: true, defaultNames: true })
	const target = targets[index]

	const nameVal = state.get(`${target.id}/config/name`)
	const nameStr = nameVal && nameVal[0]?.type === 's' ? nameVal[0].value : ''
	const selectedChannel = (target.id ? (target.id as string).replace(/\//g, ' ').trim() : 'ch 1').toUpperCase()

	instance.setVariableValues({
		selected_channel: selectedChannel,
		selected_name: nameStr,
	})
}

export function updateUndoTime(instance: InstanceBaseExt<X32Config>, state: X32State): void {
	const undoTime = state.get('/-undo/time')
	const time = undoTime && undoTime[0]?.type === 's' ? undoTime[0].value : ''
	instance.setVariableValues({
		undo_time: time ? time : '--:--:--',
	})
}
