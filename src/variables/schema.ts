export type VariablesSchema = {
	m_name: string
	m_model: string
	m_fw: string
	tape_time_ms: string
	tape_time_hms: string
	urec_etime_ms: string
	urec_etime_hms: string
	urec_rtime_ms: string
	urec_rtime_hms: string
	stored_channel: number
	selected_channel: string
	selected_name: string
	undo_time: string
	[key: `name_${string}`]: string
	[key: `color_${string}`]: string
	[key: `fader_${string}`]: number
}
