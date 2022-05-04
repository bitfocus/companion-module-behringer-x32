import { X32Config } from './config.js'
import { X32State } from './state.js'
import osc from 'osc'
import { GetTargetChoices } from './choices.js'
import { MainPath } from './paths.js'
import { formatDb, floatToDB, InstanceBaseExt } from './util.js'
import { CompanionVariable, CompanionVariableValue2 } from '@companion-module/base'

function sanitiseName(name: string): string {
	return name.replace(/\//g, '_')
}

export async function InitVariables(instance: InstanceBaseExt<X32Config>, state: X32State): Promise<void> {
	const variables: CompanionVariable[] = [
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

	await instance.setVariableDefinitions(variables)
	await instance.setVariableValues([
		{
			variableId: 'tape_time_hms',
			value: `--:--:--`,
		},
		{
			variableId: 'tape_time_ms',
			value: `--:--`,
		},
	])
}

export async function updateDeviceInfoVariables(
	instance: InstanceBaseExt<X32Config>,
	args: osc.MetaArgument[]
): Promise<void> {
	const getStringArg = (index: number): string => {
		const raw = args[index]
		if (raw && raw.type === 's') {
			return raw.value
		} else {
			return ''
		}
	}
	await instance.setVariableValues([
		{
			variableId: 'm_variableId',
			value: getStringArg(1),
		},
		{
			variableId: 'm_model',
			value: getStringArg(2),
		},
		{
			variableId: 'm_fw',
			value: getStringArg(3),
		},
	])
}

export async function updateTapeTime(instance: InstanceBaseExt<X32Config>, state: X32State): Promise<void> {
	const etime = state.get('/-stat/tape/etime')
	const time = etime && etime[0]?.type === 'i' ? etime[0].value : 0
	const hh = `${Math.floor(time / 3600)}`.padStart(2, '0')
	const mm = `${Math.floor(time / 60) % 60}`.padStart(2, '0')
	const ss = `${time % 60}`.padStart(2, '0')
	await instance.setVariableValues([
		{
			variableId: 'tape_time_hms',
			value: `${hh}:${mm}:${ss}`,
		},
		{
			variableId: 'tape_time_ms',
			value: `${mm}:${ss}`,
		},
	])
}

export async function updateNameVariables(instance: InstanceBaseExt<X32Config>, state: X32State): Promise<void> {
	const variables: CompanionVariableValue2[] = []
	const targets = GetTargetChoices(state, { includeMain: true, defaultNames: true })
	for (const target of targets) {
		const nameVal = state.get(`${target.id}/config/name`)
		const nameStr = nameVal && nameVal[0]?.type === 's' ? nameVal[0].value : ''
		variables.push({
			variableId: `name${sanitiseName(target.id as string)}`,
			value: nameStr || target.label,
		})

		const faderVal = state.get(`${MainPath(target.id as string)}/fader`)
		const faderNum = faderVal && faderVal[0]?.type === 'f' ? faderVal[0].value : NaN
		variables.push({
			variableId: `fader${sanitiseName(target.id as string)}`,
			value: isNaN(faderNum) ? '-' : formatDb(floatToDB(faderNum)),
		})
	}
	await instance.setVariableValues(variables)
}
