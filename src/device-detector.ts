import debug0 from 'debug'
import * as osc from 'osc'

const debug = debug0('behringer-x32/device-detector')

export interface DeviceInfo {
	deviceName: string
	address: string
	lastSeen: number
}

export interface X32DeviceDetector {
	subscribe(instanceId: string): void
	unsubscribe(instanceId: string): void
	listKnown(): DeviceInfo[]
}

class X32DeviceDetectorImpl implements X32DeviceDetector {
	private readonly subscribers = new Set<string>()
	private osc?: osc.UDPPort
	private knownDevices = new Map<string, DeviceInfo>()
	private queryTimer: NodeJS.Timer | undefined

	public subscribe(instanceId: string): void {
		const startListening = this.subscribers.size === 0

		this.subscribers.add(instanceId)

		if (startListening) {
			this.startListening()
		}
	}

	public unsubscribe(instanceId: string): void {
		if (this.subscribers.delete(instanceId) && this.subscribers.size === 0) {
			this.stopListening()
		}
	}

	public listKnown(): DeviceInfo[] {
		return Array.from(this.knownDevices.values()).sort((a, b) => a.deviceName.localeCompare(b.deviceName))
	}

	private startListening(): void {
		this.knownDevices.clear()

		if (this.subscribers.size === 0) {
			return
		}

		this.osc = new osc.UDPPort({
			localAddress: '0.0.0.0',
			localPort: 0,
			broadcast: true,
			metadata: true,
			remoteAddress: '255.255.255.255', // broadcast it
			remotePort: 10023,
		})

		this.osc.on('error', (err: Error): void => {
			debug(`osc error: ${err}`)

			// restart the listener
			this.stopListening()
			this.startListening()
		})
		this.osc.on('ready', () => {
			debug('osc ready')

			if (!this.queryTimer) {
				this.queryTimer = setInterval(() => this.sendQuery(), 30000)
			}

			this.sendQuery()
		})

		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		this.osc.on('close' as any, () => {
			debug('osc closed')

			// cleanup the listener
			this.stopListening()
		})

		this.osc.on('message', (message): void => {
			// console.log('Message', message)
			const args = message.args as osc.MetaArgument[]

			const getStringArg = (index: number): string => {
				const raw = args[index]
				if (raw && raw.type === 's') {
					return raw.value
				} else {
					return ''
				}
			}

			const info: DeviceInfo = {
				address: getStringArg(0),
				deviceName: getStringArg(1),
				lastSeen: Date.now(),
			}

			debug(`Heard from ${info.address} (${info.deviceName})`)
			this.knownDevices.set(info.address, info)

			// Prune out any not seen for over a minute
			for (const [id, data] of Array.from(this.knownDevices.entries())) {
				if (data.lastSeen < Date.now() - 60000) {
					this.knownDevices.delete(id)
					debug(`Lost ${data.address} (${data.deviceName})`)
				}
			}
		})

		this.osc.open()
	}

	private stopListening(): void {
		if (this.osc) {
			try {
				this.osc.close()
			} catch (e) {
				// Ignore
			}
			delete this.osc
		}

		this.knownDevices.clear()

		if (this.queryTimer) {
			clearInterval(this.queryTimer)
			delete this.queryTimer
		}
	}

	private sendQuery(): void {
		if (this.osc) {
			this.osc.send({ address: '/xinfo', args: [] })
		}
	}
}

export const X32DeviceDetectorInstance: X32DeviceDetector = new X32DeviceDetectorImpl()
