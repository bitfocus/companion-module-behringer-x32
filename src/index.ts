import { GetActionsList } from './actions.js'
import { X32Config, GetConfigFields } from './config.js'
import { FeedbackId, GetFeedbacksList } from './feedback.js'
import { GetPresetsList } from './presets.js'
import {
	InitVariables,
	updateDeviceInfoVariables,
	updateNameVariables,
	updateSelectedVariables,
	updateStoredChannelVariable,
	updateTapeTime,
	updateUReceTime,
	updateURecrTime,
	updateUndoTime,
} from './variables.js'
import { IStoredChannelObserver, X32State, X32Subscriptions } from './state.js'
import osc from 'osc'
import { MainPath } from './paths.js'
import { BooleanFeedbackUpgradeMap, upgradeV2x0x0 } from './upgrades.js'
import { GetTargetChoices } from './choices.js'
import debounceFn from 'debounce-fn'
import PQueue from 'p-queue'
import { X32Transitions } from './transitions.js'
import { X32DeviceDetectorInstance } from './device-detector.js'
import {
	CompanionStaticUpgradeScript,
	InstanceBase,
	SomeCompanionConfigField,
	runEntrypoint,
	CreateConvertToBooleanFeedbackUpgradeScript,
	EmptyUpgradeScript,
	InstanceStatus,
} from '@companion-module/base'
import { InstanceBaseExt } from './util.js'

const UpgradeScripts: CompanionStaticUpgradeScript<X32Config>[] = [
	EmptyUpgradeScript, // Previous version had a script
	upgradeV2x0x0,
	CreateConvertToBooleanFeedbackUpgradeScript(BooleanFeedbackUpgradeMap),
]

/**
 * Companion instance class for the Behringer X32 Mixers.
 */
class X32Instance extends InstanceBase<X32Config> implements InstanceBaseExt<X32Config>, IStoredChannelObserver {
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
	constructor(internal: unknown) {
		super(internal)

		this.osc = new osc.UDPPort({})
		this.x32State = new X32State()
		this.x32Subscriptions = new X32Subscriptions()
		this.transitions = new X32Transitions(this)
		this.x32State.attach(this)

		this.debounceUpdateCompanionBits = debounceFn(this.updateCompanionBits.bind(this), {
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

	// IStoredChannelObserver
	storedChannelChanged(): void {
		updateStoredChannelVariable(this, this.x32State)
		const list = [FeedbackId.StoredChannel, FeedbackId.RouteUserIn, FeedbackId.RouteUserOut]
		list.forEach((f) => this.messageFeedbacks.add(f))
		this.debounceMessageFeedbacks()
	}

	// Override base types to make types stricter
	public checkFeedbacks(...feedbackTypes: FeedbackId[]): void {
		return super.checkFeedbacks(...feedbackTypes)
	}

	/**
	 * Main initialization function called once the module
	 * is OK to start doing things.
	 */
	public async init(config: X32Config): Promise<void> {
		this.config = config

		this.updateStatus(InstanceStatus.Connecting)
		this.setupOscSocket()

		X32DeviceDetectorInstance.subscribe(this.id)

		this.updateCompanionBits()
	}

	/**
	 * Process an updated configuration array.
	 */
	public async configUpdated(config: X32Config): Promise<void> {
		this.config = config
		this.x32State.detach(this)
		this.x32State = new X32State()
		this.x32State.attach(this)

		this.x32Subscriptions = new X32Subscriptions()

		this.transitions.stopAll()
		this.transitions = new X32Transitions(this)

		if (this.config.host !== undefined) {
			this.updateStatus(InstanceStatus.Connecting)
			this.setupOscSocket()
			this.updateCompanionBits()
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
	public async destroy(): Promise<void> {
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
		this.x32State.detach(this)

		if (this.osc) {
			try {
				this.osc.close()
			} catch (e) {
				// Ignore
			}
			// delete this.osc
		}

		this.log('debug', 'destroy')
	}

	private updateCompanionBits(): void {
		InitVariables(this, this.x32State)
		this.setPresetDefinitions(GetPresetsList(this, this.x32State))
		this.setFeedbackDefinitions(GetFeedbacksList(this, this.x32State, this.x32Subscriptions, this.queueEnsureLoaded))
		this.setActionDefinitions(GetActionsList(this, this.transitions, this.x32State, this.queueEnsureLoaded))
		this.checkFeedbacks()
		updateNameVariables(this, this.x32State)
		updateSelectedVariables(this, this.x32State)
		updateUndoTime(this, this.x32State)

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
		this.updateStatus(InstanceStatus.Connecting)

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
			this.updateStatus(InstanceStatus.ConnectionFailure, err.message)
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

			this.updateStatus(InstanceStatus.Connecting, 'Syncing')
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
					this.updateStatus(InstanceStatus.Ok)

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
						this.loadPresetData()
					}
					break
				case '/-stat/tape/etime':
					updateTapeTime(this, this.x32State)
					break

				case '/-stat/urec/etime':
					updateUReceTime(this, this.x32State)
					break

				case '/-stat/urec/rtime':
					updateURecrTime(this, this.x32State)
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
			this.queueEnsureLoaded(`${target.id}/config/color`)
			this.queueEnsureLoaded(`${MainPath(target.id as string)}/fader`)
		}

		const sendSources = GetTargetChoices(this.x32State, {
			defaultNames: true,
			skipBus: true,
			skipDca: true,
			skipMatrix: true,
		})
		for (const target of sendSources) {
			for (let b = 1; b <= 16; b++) {
				const padded = `${b}`.padStart(2, '0')
				this.queueEnsureLoaded(`${target.id}/mix/${padded}/level`)
			}
		}

		const busSources = GetTargetChoices(this.x32State, {
			defaultNames: true,
			skipInputs: true,
			skipDca: true,
			skipMatrix: true,
		})
		for (const target of busSources) {
			for (let m = 1; m <= 6; m++) {
				const padded = `${m}`.padStart(2, '0')
				this.queueEnsureLoaded(`${target.id}/mix/${padded}/level`)
			}
		}

		this.queueEnsureLoaded('/-stat/selidx')
		this.queueEnsureLoaded('/-undo/time')
	}

	private loadPresetData(): void {
		const options = [...Array(100).keys()].map((x) => `${x + 1}`.padStart(3, '0'))
		options.forEach((option) => {
			;['ch', 'fx', 'r', 'mon'].forEach((lib) => {
				this.queueEnsureLoaded(`/-libs/${lib}/${option}/hasdata`)
				this.queueEnsureLoaded(`/-libs/${lib}/${option}/name`)
			})
		})
	}

	private queueEnsureLoaded = (path: string): void => {
		this.requestQueue
			.add(async () => {
				if (this.inFlightRequests[path]) {
					this.log('debug', `Ignoring request "${path}" as one in flight`)
					return
				}

				if (this.x32State.get(path)) {
					this.log('debug', `Ignoring request "${path}" as data is already loaded`)
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
		if (
			msg.address.match('/config/name$') ||
			msg.address.match('/config/color$') ||
			msg.address.match('/fader$') ||
			msg.address.match('/-stat/selidx') ||
			msg.address.match('/-libs/') ||
			msg.address.match('/-undo/time') ||
			msg.address.match('/mix/../level')
		) {
			this.debounceUpdateCompanionBits()
		}
	}
}

runEntrypoint(X32Instance, UpgradeScripts)
