// eslint-disable-next-line node/no-extraneous-import
import { MetaArgument } from 'osc'
import InstanceSkel = require('../../../instance_skel')
import { fadeFpsDefault, X32Config } from './config'
import { Easing } from './easings'
import { dbToFloat } from './util'

export interface TransitionInfo {
	steps: number[]
}

export class X32Transitions {
	private readonly transitions: Map<string, TransitionInfo>
	private readonly instance: InstanceSkel<X32Config>
	private readonly fps: number

	private tickInterval: NodeJS.Timer | undefined

	constructor(instance: InstanceSkel<X32Config>) {
		this.transitions = new Map()
		this.instance = instance
		this.fps = instance.config.fadeFps ?? fadeFpsDefault
	}

	private sendOsc(cmd: string, arg: MetaArgument): void {
		try {
			// HACK: We send commands on a different port than we run /xremote on, so that we get change events for what we send.
			// Otherwise we can have no confirmation that a command was accepted
			if (this.instance.config.host) {
				this.instance.oscSend(this.instance.config.host, 10023, cmd, [arg])
			}
		} catch (e) {
			this.instance.log('error', `Command send failed: ${e}`)
		}
	}

	public stopAll(): void {
		this.transitions.clear()

		if (this.tickInterval) {
			clearInterval(this.tickInterval)
			delete this.tickInterval
		}
	}

	private runTick(): void {
		const completedPaths: string[] = []
		for (const [path, info] of this.transitions.entries()) {
			const newValue = info.steps.shift()
			if (newValue !== undefined) {
				this.sendOsc(path, {
					type: 'f',
					value: newValue,
				})
			}
			if (info.steps.length === 0) {
				completedPaths.push(path)
			}
		}

		// Remove any completed transitions
		for (const path of completedPaths) {
			this.transitions.delete(path)
		}

		// If nothing is left, stop the timer
		if (this.transitions.size === 0) {
			this.stopAll()
		}
	}

	public runForDb(
		path: string,
		from: number | undefined,
		to: number,
		duration: number,
		algorithm?: Easing.algorithm,
		curve?: Easing.curve
	) {
		const floatTo = dbToFloat(to)
		const floatFrom = from ? dbToFloat(from) : undefined
		this.run(path, floatFrom, floatTo, duration, algorithm, curve)
	}

	public run(
		path: string,
		from: number | undefined,
		to: number,
		duration: number,
		algorithm?: Easing.algorithm,
		curve?: Easing.curve
	) {
		const interval = 1000 / this.fps
		const stepCount = Math.ceil(duration / interval)

		if (stepCount <= 1 || typeof from !== 'number') {
			this.transitions.delete(path)
			this.sendOsc(path, { type: 'f', value: to })
		} else {
			const diff = to - from
			const steps: number[] = []

			const easing = Easing.getEasing(algorithm, curve)
			for (let i = 1; i <= stepCount; i++) {
				const fraction = easing(i / stepCount)
				steps.push(from + diff * fraction)
			}

			this.transitions.set(path, { steps })

			if (!this.tickInterval) {
				// Start the tick if not already running
				this.tickInterval = setInterval(() => this.runTick(), 1000 / this.fps)
			}
		}
	}
}
