import { GetActionsList } from './actions.js'
import { X32Config, GetConfigFields } from './config.js'
import { FeedbackId, GetFeedbacksList } from './feedback.js'
import { GetPresetsList } from './presets.js'
import { InitVariables, updateDeviceInfoVariables, updateNameVariables, updateTapeTime } from './variables.js'
import { X32State, X32Subscriptions } from './state.js'
import osc from 'osc'
import { MainPath } from './paths.js'
import { upgradeV2x0x0 } from './upgrades.js'
import { GetTargetChoices } from './choices.js'
import debounceFn from 'debounce-fn'
import PQueue from 'p-queue'
import { X32Transitions } from './transitions.js'
import { X32DeviceDetectorInstance } from './device-detector.js'
import {
	CompanionStaticUpgradeScript,
	InstanceBase,
	InstanceStatus,
	SomeCompanionConfigField,
	runEntrypoint,
} from '@companion-module/base'
import { InstanceBaseExt } from './util.js'

/**
 * Companion instance class for the Behringer X32 Mixers.
 */
export default class X32Instance extends InstanceBase<X32Config> implements InstanceBaseExt<X32Config> {
	private osc: osc.UDPPort
	private x32State: X32State
	private x32Subscriptions: X32Subscriptions
	private transitions: X32Transitions
	public config: X32Config = {}

	/** Ping the x32 at a regular interval to tell it to keep sending us info, and for us to check it is still there */
	private heartbeat: NodeJS.Timer | undefined
	/** Delay a reconnect a few seconds after an error, or monitor the ping for lack of response */
	private reconnectTimer: NodeJS.Timer | undefined
	/** Once we have an osc socket ready, we send /xinfo on repeat until we get a response */
	private syncInterval: NodeJS.Timer | undefined
	/** subscribe interval, we need to resubscribe atleast every 10 seconds to keep the subscription going
	 * we are using 5 seconds to be safe */
	private subscribeInterval: NodeJS.Timer | undefined

	private readonly debounceUpdateCompanionBits: () => void
	private readonly requestQueue: PQueue = new PQueue({
		concurrency: 20,
		timeout: 500,
		throwOnTimeout: true,
	})
	private inFlightRequests: { [path: string]: () => void } = {}

	private readonly messageFeedbacks = new Set<FeedbackId>()
	private readonly debounceMessageFeedbacks: () => void

	/**
	 * Create an instance of an X32 module.
	 */
	constructor(internal: unknown, id: string) {
		super(internal, id)

		// HACK: for testing upgrade script
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		// ;(config as any)._configIdx = -1

		this.osc = new osc.UDPPort({})

		this.x32State = new X32State()
		this.x32Subscriptions = new X32Subscriptions()
		this.transitions = new X32Transitions(this)

		this.debounceUpdateCompanionBits = debounceFn(this.updateCompanionBits, {
			wait: 100,
			maxWait: 500,
			before: false,
			after: true,
		})

		this.debounceMessageFeedbacks = debounceFn(
			() => {
				console.log('fire feedbacks')
				const feedbacks = Array.from(this.messageFeedbacks)
				this.messageFeedbacks.clear()
				this.checkFeedbacks(...feedbacks).catch((_e) => {
					// TODO
				})
			},
			{
				wait: 100,
				maxWait: 500,
				before: true,
				after: true,
			}
		)
	}

	public static GetUpgradeScripts(): CompanionStaticUpgradeScript[] {
		return [
			() => false, // Previous version had a script
			upgradeV2x0x0,
			() => false, // HACK X32Instance.CreateConvertToBooleanFeedbackUpgradeScript(BooleanFeedbackUpgradeMap),
		]
	}

	// Override base types to make types stricter
	public async checkFeedbacks(...feedbackTypes: FeedbackId[]): Promise<void> {
		return super.checkFeedbacks(...feedbackTypes)
	}

	/**
	 * Main initialization function called once the module
	 * is OK to start doing things.
	 */
	public async init(config: X32Config): Promise<void> {
		this.config = config

		console.log(config)

		this.updateStatus(null)
		this.setupOscSocket()

		X32DeviceDetectorInstance.subscribe(this.id)

		await this.updateCompanionBits()
	}

	/**
	 * Process an updated configuration array.
	 */
	public async configUpdated(config: X32Config): Promise<void> {
		this.config = config

		this.x32State = new X32State()
		this.x32Subscriptions = new X32Subscriptions()

		this.transitions.stopAll()
		this.transitions = new X32Transitions(this)

		if (this.config.host !== undefined) {
			this.updateStatus(InstanceStatus.WARNING, 'Connecting')
			this.setupOscSocket()
			await this.updateCompanionBits()
		}
	}

	/**
	 * Creates the configuration fields for web config.
	 */
	public getConfigFields(): SomeCompanionConfigField[] {
		return GetConfigFields()
	}

	/**
	 * Clean up the instance before it is destroyed.
	 */
	public destroy(): void {
		if (this.reconnectTimer) {
			clearTimeout(this.reconnectTimer)
			this.reconnectTimer = undefined
		}
		if (this.syncInterval) {
			clearInterval(this.syncInterval)
			this.syncInterval = undefined
		}

		if (this.heartbeat) {
			clearInterval(this.heartbeat)
			this.heartbeat = undefined
		}

		if (this.subscribeInterval) {
			clearInterval(this.subscribeInterval)
			this.subscribeInterval = undefined
		}
		X32DeviceDetectorInstance.unsubscribe(this.id)

		this.transitions.stopAll()

		if (this.osc) {
			try {
				this.osc.close()
			} catch (e) {
				// Ignore
			}
			// delete this.osc
		}

		this.userLog('debug', 'destroy')
	}

	private async updateCompanionBits(): Promise<void> {
		await Promise.all([
			InitVariables(this, this.x32State),
			this.setPresetDefinitions(GetPresetsList(this, this.x32State)),
			this.setFeedbackDefinitions(GetFeedbacksList(this, this.x32State, this.x32Subscriptions, this.queueEnsureLoaded)),
			this.setActionDefinitions(GetActionsList(this, this.transitions, this.x32State, this.queueEnsureLoaded)),
		])

		await this.checkFeedbacks()
		await updateNameVariables(this, this.x32State)

		// Ensure all feedbacks & actions have an initial value, if we are connected
		if (this.heartbeat) {
			this.subscribeFeedbacks()
			this.subscribeActions()
		}
	}

	private pulse(): void {
		try {
			this.osc.send({
				address: '/xremote',
				args: [],
			})

			if (!this.syncInterval) {
				// Once handshaked, poll something with a response
				this.osc.send({ address: '/xinfo', args: [] })
				if (!this.reconnectTimer) {
					this.reconnectTimer = setTimeout(() => {
						// Timed out
						this.reconnectTimer = undefined
						this.setupOscSocket()
					}, 5000)
				}
			}
		} catch (e) {
			// Ignore
		}
	}

	private setupOscSocket(): void {
		this.updateStatus(InstanceStatus.WARNING, 'Connecting')

		if (this.reconnectTimer) {
			clearTimeout(this.reconnectTimer)
			this.reconnectTimer = undefined
		}
		if (this.syncInterval) {
			clearInterval(this.syncInterval)
			this.syncInterval = undefined
		}

		if (this.osc) {
			try {
				this.osc.close()
			} catch (e) {
				// Ignore
			}
		}

		this.osc = new osc.UDPPort({
			localAddress: '0.0.0.0',
			localPort: 0,
			broadcast: true,
			metadata: true,
			remoteAddress: this.config.host,
			remotePort: 10023,
		})

		this.osc.on('error', (err: Error): void => {
			this.userLog('error', `Error: ${err.message}`)
			this.updateStatus(InstanceStatus.ERROR, err.message)
			this.requestQueue.clear()
			this.inFlightRequests = {}

			if (this.heartbeat) {
				clearInterval(this.heartbeat)
				this.heartbeat = undefined
			}

			if (this.subscribeInterval) {
				clearInterval(this.subscribeInterval)
				this.subscribeInterval = undefined
			}

			if (!this.reconnectTimer) {
				this.reconnectTimer = setTimeout(() => {
					if (this.syncInterval) {
						clearInterval(this.syncInterval)
						this.syncInterval = undefined
					}

					this.reconnectTimer = undefined
					this.setupOscSocket()
				}, 2000)
			}
		})
		this.osc.on('ready', () => {
			this.pulse()
			this.heartbeat = setInterval(() => {
				this.pulse()
			}, 1500)

			this.subscribeForUpdates()
			this.subscribeInterval = setInterval(() => {
				this.subscribeForUpdates()
			}, 5000)

			this.requestQueue.clear()
			this.inFlightRequests = {}

			const doSync = (): void => {
				if (this.osc) {
					try {
						this.osc.send({ address: '/xinfo', args: [] })
						this.osc.send({ address: '/-snap/name', args: [] })
						this.osc.send({ address: '/-snap/index', args: [] })
					} catch (e) {
						// Ignore
					}
				}
			}
			if (!this.syncInterval) {
				this.syncInterval = setInterval(doSync, 2000)
			}
			doSync()

			this.updateStatus(InstanceStatus.WARNING, 'Syncing')
		})

		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		this.osc.on('close' as any, () => {
			if (this.heartbeat !== undefined) {
				clearInterval(this.heartbeat)
				this.heartbeat = undefined
			}

			if (this.subscribeInterval) {
				clearInterval(this.subscribeInterval)
				this.subscribeInterval = undefined
			}
		})

		this.osc.on('message', (message): void => {
			// console.log('Message', message)
			const args = message.args as osc.MetaArgument[]
			this.x32State.set(message.address, args)

			if (this.inFlightRequests[message.address]) {
				this.inFlightRequests[message.address]()
				delete this.inFlightRequests[message.address]
			}

			// setImmediate(() => {
			this.checkFeedbackChanges(message)
			// })

			switch (message.address) {
				case '/xinfo':
					this.updateStatus(InstanceStatus.OK)

					if (this.reconnectTimer) {
						// Clear the timer, as it is alive
						clearTimeout(this.reconnectTimer)
						this.reconnectTimer = undefined
					}

					if (this.syncInterval) {
						// Sync success, stop the interval
						clearInterval(this.syncInterval)
						this.syncInterval = undefined

						// Load the initial data
						this.loadVariablesData()
						updateDeviceInfoVariables(this, args)
					}
					break
				case '/-stat/tape/etime':
					updateTapeTime(this, this.x32State)
					break
			}
		})

		this.osc.open()
	}

	// called every 5 seconds while there is an osc connection to keep subscriptions open
	private subscribeForUpdates(): void {
		if (this.osc) {
			try {
				this.osc.send({
					address: '/subscribe',
					args: [
						{ type: 's', value: '/-stat/tape/etime' },
						{ type: 'i', value: 20 },
					],
				})
			} catch (e) {
				// Ignore
			}
		}
	}

	private loadVariablesData(): void {
		const targets = GetTargetChoices(this.x32State, { includeMain: true, defaultNames: true })
		for (const target of targets) {
			this.queueEnsureLoaded(`${target.id}/config/name`)
			this.queueEnsureLoaded(`${MainPath(target.id as string)}/fader`)
		}
	}

	private queueEnsureLoaded = (path: string): void => {
		this.requestQueue
			.add(async () => {
				if (this.inFlightRequests[path]) {
					this.userLog('debug', `Ignoring request "${path}" as one in flight`)
					return
				}

				if (this.x32State.get(path)) {
					this.userLog('debug', `Ignoring request "${path}" as data is already loaded`)
					return
				}

				// console.log('starting request', path)

				const p = new Promise<void>((resolve) => {
					this.inFlightRequests[path] = resolve
				})

				this.osc.send({
					address: path,
					args: [],
				})

				await p
			})
			.catch((e: unknown) => {
				delete this.inFlightRequests[path]
				this.userLog('error', `Request failed for "${path}": (${e})`)

				// TODO If a timeout, can/should we retry it?
			})
	}

	private checkFeedbackChanges(msg: osc.OscMessage): void {
		const toUpdate = this.x32Subscriptions.getFeedbacks(msg.address)
		if (toUpdate.length > 0) {
			toUpdate.forEach((f) => this.messageFeedbacks.add(f))
			this.debounceMessageFeedbacks()
		}

		if (msg.address.match('/config/name$') || msg.address.match('/fader$')) {
			this.debounceUpdateCompanionBits()
		}
	}
}

runEntrypoint(X32Instance)
