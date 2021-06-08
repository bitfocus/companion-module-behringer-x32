import InstanceSkel = require('../../../instance_skel')
import { CompanionVariable } from '../../../instance_skel_types'
import { X32Config } from './config'
import { X32State } from './state'
// eslint-disable-next-line node/no-extraneous-import
import * as osc from 'osc'
import { GetTargetChoices } from './choices'
import { MainPath } from './paths'
import { formatDb, floatToDB } from './util'

function sanitiseName(name: string): string {
	return name.replace(/\//g, '_')
}

export function InitVariables(instance: InstanceSkel<X32Config>, state: X32State): void {
	const variables: CompanionVariable[] = [
		{
			label: 'Device name',
			name: 'm_name',
		},
		{
			label: 'Device model',
			name: 'm_model',
		},
		{
			label: 'Device firmware',
			name: 'm_fw',
		},
	]

	const targets = GetTargetChoices(state, { includeMain: true, defaultNames: true })
	for (const target of targets) {
		variables.push({
			label: `Name: ${target.label}`,
			name: `name${sanitiseName(target.id as string)}`,
		})
		variables.push({
			label: `Fader: ${target.label}`,
			name: `fader${sanitiseName(target.id as string)}`,
		})
	}

	instance.setVariableDefinitions(variables)
}

export function updateDeviceInfoVariables(instance: InstanceSkel<X32Config>, args: osc.MetaArgument[]): void {
	const getStringArg = (index: number): string => {
		const raw = args[index]
		if (raw && raw.type === 's') {
			return raw.value
		} else {
			return ''
		}
	}
	instance.setVariables({
		m_name: getStringArg(1),
		m_model: getStringArg(2),
		m_fw: getStringArg(3),
	})
}

export function updateNameVariables(instance: InstanceSkel<X32Config>, state: X32State): void {
	const variables: { [variableId: string]: string | undefined } = {}
	const targets = GetTargetChoices(state, { includeMain: true, defaultNames: true })
	for (const target of targets) {
		const nameVal = state.get(`${target.id}/config/name`)
		const nameStr = nameVal && nameVal[0]?.type === 's' ? nameVal[0].value : ''
		variables[`name${sanitiseName(target.id as string)}`] = nameStr || target.label

		const faderVal = state.get(`${MainPath(target.id as string)}/fader`)
		const faderNum = faderVal && faderVal[0]?.type === 'f' ? faderVal[0].value : NaN
		variables[`fader${sanitiseName(target.id as string)}`] = isNaN(faderNum) ? '-' : formatDb(floatToDB(faderNum))
	}
	instance.setVariables(variables)
}
