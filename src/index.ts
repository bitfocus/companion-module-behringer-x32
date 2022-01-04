import InstanceSkel = require('../../../instance_skel')
import { CompanionConfigField, CompanionStaticUpgradeScript, CompanionSystem } from '../../../instance_skel_types'
import { GetActionsList } from './actions'
import { X32Config, GetConfigFields } from './config'
import { FeedbackId, GetFeedbacksList } from './feedback'
import { GetPresetsList } from './presets'
import { InitVariables, updateDeviceInfoVariables, updateNameVariables } from './variables'
import { X32State, X32Subscriptions } from './state'
// eslint-disable-next-line node/no-extraneous-import
import * as osc from 'osc'
import { MainPath } from './paths'
import { BooleanFeedbackUpgradeMap, upgradeV2x0x0 } from './upgrades'
import { GetTargetChoices } from './choices'
import * as debounceFn from 'debounce-fn'
import PQueue from 'p-queue'
import { X32Transitions } from './transitions'
import { X32DeviceDetectorInstance } from './device-detector'

/**
 * Companion instance class for the Behringer X32 Mixers.
 */
class X32Instance extends InstanceSkel<X32Config> {
	private osc: osc.UDPPort
	private x32State: X32State
	private x32Subscriptions: X32Subscriptions
	private transitions: X32Transitions

	/** Ping the x32 at a regular interval to tell it to keep sending us info, and for us to check it is still there */
	private heartbeat: NodeJS.Timer | undefined
	/** Delay a reconnect a few seconds after an error, or monitor the ping for lack of response */
	private reconnectTimer: NodeJS.Timer | undefined
	/** Once we have an osc socket ready, we send /xinfo on repeat until we get a response */
	private syncInterval: NodeJS.Timer | undefined

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
	constructor(system: CompanionSystem, id: string, config: X32Config) {
		super(system, id, config)

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
				this.checkFeedbacks(...feedbacks)
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
			X32Instance.CreateConvertToBooleanFeedbackUpgradeScript(BooleanFeedbackUpgradeMap),
		]
	}

	// Override base types to make types stricter
	public checkFeedbacks(...feedbackTypes: FeedbackId[]): void {
		super.checkFeedbacks(...feedbackTypes)
	}

	/**
	 * Main initialization function called once the module
	 * is OK to start doing things.
	 */
	public init(): void {
		this.status(this.STATUS_UNKNOWN)
		this.setupOscSocket()

		X32DeviceDetectorInstance.subscribe(this.id)

		this.updateCompanionBits()
	}

	/**
	 * Process an updated configuration array.
	 */
	public updateConfig(config: X32Config): void {
		this.config = config

		this.x32State = new X32State()
		this.x32Subscriptions = new X32Subscriptions()

		this.transitions.stopAll()
		this.transitions = new X32Transitions(this)

		if (this.config.host !== undefined) {
			this.status(this.STATUS_WARNING, 'Connecting')
			this.setupOscSocket()
			this.updateCompanionBits()
		}
	}

	/**
	 * Creates the configuration fields for web config.
	 */
	public config_fields(): CompanionConfigField[] {
		return GetConfigFields(this)
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

		this.debug('destroy', this.id)
	}

	private updateCompanionBits(): void {
		InitVariables(this, this.x32State)
		this.setPresetDefinitions(GetPresetsList(this, this.x32State))
		this.setFeedbackDefinitions(GetFeedbacksList(this, this.x32State, this.x32Subscriptions, this.queueEnsureLoaded))
		this.setActions(GetActionsList(this, this.transitions, this.x32State, this.queueEnsureLoaded))
		this.checkFeedbacks()

		updateNameVariables(this, this.x32State)

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
		this.status(this.STATUS_WARNING, 'Connecting')

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
			this.log('error', `Error: ${err.message}`)
			this.status(this.STATUS_ERROR, err.message)
			this.requestQueue.clear()
			this.inFlightRequests = {}

			if (this.heartbeat) {
				clearInterval(this.heartbeat)
				this.heartbeat = undefined
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

			this.status(this.STATUS_WARNING, 'Syncing')
		})

		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		this.osc.on('close' as any, () => {
			if (this.heartbeat !== undefined) {
				clearInterval(this.heartbeat)
				this.heartbeat = undefined
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
					this.status(this.STATUS_OK)

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
			}
		})

		this.osc.open()
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
					this.debug(`Ignoring request "${path}" as one in flight`)
					return
				}

				if (this.x32State.get(path)) {
					this.debug(`Ignoring request "${path}" as data is already loaded`)
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
				this.log('error', `Request failed for "${path}": (${e})`)

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

export = X32Instance
