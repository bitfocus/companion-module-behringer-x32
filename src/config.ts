import InstanceSkel = require('../../../instance_skel')
import { SomeCompanionConfigField } from '../../../instance_skel_types'
import { X32DeviceDetectorInstance } from './device-detector'

export const fadeFpsDefault = 10

export interface X32Config {
	host?: string
	fadeFps?: number
}

export function GetConfigFields(self: InstanceSkel<X32Config>): SomeCompanionConfigField[] {
	return [
		{
			type: 'dropdown',
			id: 'host',
			label: 'Target IP',
			width: 6,
			choices: X32DeviceDetectorInstance.listKnown().map((d) => ({
				id: d.address,
				label: `${d.address} (${d.deviceName})`,
			})),
			default: '',
			allowCustom: true,
			regex: self.REGEX_IP,
		},
		{
			type: 'number',
			id: 'fadeFps',
			label: 'Framerate for fades',
			tooltip: 'Higher is smoother, but has higher impact on system performance',
			width: 6,
			min: 5,
			max: 60,
			step: 1,
			default: fadeFpsDefault,
		},
	]
}
