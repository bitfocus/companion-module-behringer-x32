import { MetaArgument } from 'osc'
import { fadeFpsDefault, X32Config } from './config.js'
import { Easing } from './easings.js'
import { dbToFloat, InstanceBaseExt } from './util.js'

export interface TransitionInfo {
	steps: number[]
}

export class X32Transitions {
	private readonly transitions: Map<string, TransitionInfo>
	private readonly instance: InstanceBaseExt<X32Config>
	private readonly fps: number

	private tickInterval: NodeJS.Timer | undefined

	constructor(instance: InstanceBaseExt<X32Config>) {
		this.transitions = new Map()
		this.instance = instance
		this.fps = instance.config.fadeFps ?? fadeFpsDefault
	}

	private sendOsc(cmd: string, arg: MetaArgument): void {
		// HACK: We send commands on a different port than we run /xremote on, so that we get change events for what we send.
		// Otherwise we can have no confirmation that a command was accepted
		if (this.instance.config.host) {
			this.instance.oscSend(this.instance.config.host, 10023, cmd, [arg])
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

	public run(path: string, from: number | undefined, to: number, duration: number, isLinear?: boolean): void {
		const interval = 1000 / this.fps
		const stepCount = Math.ceil(duration / interval)

		// TODO - what if not sending db
		if (stepCount <= 1 || typeof from !== 'number') {
			this.transitions.delete(path)
			this.sendOsc(path, {
				type: 'f',
				value: isLinear ? to : dbToFloat(to),
			})
		} else {
			const diff = to - from
			const steps: number[] = []
			// eslint-disable-next-line @typescript-eslint/unbound-method
			const easing = Easing.Linear.None // TODO - dynamic
			for (let i = 1; i <= stepCount; i++) {
				const fraction = easing(i / stepCount)
				if (isLinear) {
					steps.push(from + diff * fraction)
				} else {
					steps.push(dbToFloat(from + diff * fraction))
				}
			}

			this.transitions.set(path, {
				steps,
			})

			if (!this.tickInterval) {
				// Start the tick if not already running
				this.tickInterval = setInterval(() => this.runTick(), 1000 / this.fps)
			}
		}
	}
}
