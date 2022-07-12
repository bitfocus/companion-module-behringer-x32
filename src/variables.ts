import { X32Config } from './config.js'
import { X32State } from './state.js'
import osc from 'osc'
import { GetTargetChoices } from './choices.js'
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
	]

	const targets = GetTargetChoices(state, { includeMain: true, defaultNames: true })
	for (const target of targets) {
		variables.push({
			name: `variableId: ${target.label}`,
			variableId: `name${sanitiseName(target.id as string)}`,
		})
		variables.push({
			name: `Fader: ${target.label}`,
			variableId: `fader${sanitiseName(target.id as string)}`,
		})
	}

	instance.setVariableDefinitions(variables)
	instance.setVariableValues({
		tape_time_hms: `--:--:--`,
		tape_time_ms: `--:--`,
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
		m_variableId: getStringArg(1),
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

export function updateNameVariables(instance: InstanceBaseExt<X32Config>, state: X32State): void {
	const variables: CompanionVariableValues = {}
	const targets = GetTargetChoices(state, { includeMain: true, defaultNames: true })
	for (const target of targets) {
		const nameVal = state.get(`${target.id}/config/name`)
		const nameStr = nameVal && nameVal[0]?.type === 's' ? nameVal[0].value : ''
		variables[`name${sanitiseName(target.id as string)}`] = nameStr || target.label

		const faderVal = state.get(`${MainPath(target.id as string)}/fader`)
		const faderNum = faderVal && faderVal[0]?.type === 'f' ? faderVal[0].value : NaN
		variables[`fader${sanitiseName(target.id as string)}`] = isNaN(faderNum) ? '-' : formatDb(floatToDB(faderNum))
	}
	instance.setVariableValues(variables)
}
