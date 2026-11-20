import assert from 'node:assert/strict'
import { test } from 'node:test'
import type {
	CompanionActionContext,
	CompanionActionEvent,
	CompanionFeedbackContext,
	CompanionFeedbackInfo,
	CompanionOptionValues,
	OSCMetaArgument,
} from '@companion-module/base'
import { GetActionsList, type ActionsProps } from './actions/main.js'
import { MUTE_TOGGLE } from './choices.js'
import { GetFeedbacksList } from './feedback.js'
import { X32State, X32Subscriptions } from './state.js'
import type { X32Transitions } from './transitions.js'
import { delayToFloat, floatToDB, floatToDelay, type InstanceBaseExt } from './util.js'
import { VariableDefinitions } from './variables/main.js'
import { GetCompanionVariableValues } from './variables/init.js'

const actionContext = {} as CompanionActionContext
const feedbackContext = {} as CompanionFeedbackContext

function actionEvent<T extends CompanionOptionValues>(actionId: string, options: T): CompanionActionEvent<T> {
	return { id: 'action', controlId: 'button', actionId, surfaceId: undefined, options }
}

function feedbackEvent<T extends CompanionOptionValues>(feedbackId: string, options: T): CompanionFeedbackInfo<T> {
	return { id: 'feedback', controlId: 'button', type: 'boolean', feedbackId, options, previousOptions: null }
}

function setup() {
	const state = new X32State()
	const subscriptions = new X32Subscriptions()
	const sent: { path: string; args: OSCMetaArgument | OSCMetaArgument[] }[] = []
	const loaded: string[] = []
	const ensureLoaded = (path: string | undefined) => {
		if (path) loaded.push(path)
	}
	const props: ActionsProps = {
		state,
		transitions: {} as X32Transitions,
		sendOsc: (path, args) => sent.push({ path, args }),
		ensureLoaded,
	}
	return {
		state,
		subscriptions,
		sent,
		loaded,
		actions: GetActionsList(props),
		feedbacks: GetFeedbacksList({} as InstanceBaseExt, state, subscriptions, ensureLoaded),
	}
}

for (const [id, suffix] of [
	['dyn-on', 'dyn/on'],
	['delay-on', 'delay/on'],
] as const) {
	void test(`${id} sends on/off and toggles the console's cached state`, async () => {
		const { state, sent, loaded, actions } = setup()
		const action = actions[id]
		assert.ok(action)
		const path = `/ch/01/${suffix}`
		for (const on of [1, 0]) {
			await action.callback(actionEvent(id, { target: 'channel1', on }), actionContext)
			assert.deepEqual(sent.pop(), { path, args: { type: 'i', value: on } })
		}
		const toggle = actionEvent(id, { target: 'ch01', on: MUTE_TOGGLE })
		await action.subscribe?.(toggle, actionContext)
		assert.deepEqual(loaded, [path])
		for (const current of [0, 1]) {
			state.set(path, [{ type: 'i', value: current }])
			await action.callback(toggle, actionContext)
			assert.deepEqual(sent.pop(), { path, args: { type: 'i', value: 1 - current } })
		}
		await action.callback(actionEvent(id, { target: 'channel32', on: 1 }), actionContext)
		assert.deepEqual(sent.pop(), { path: `/ch/32/${suffix}`, args: { type: 'i', value: 1 } })
		for (const target of ['channel0', 'channel33', 'bus1', 'aux1', 'fx1', 'dca1', 'stereo', 'invalid']) {
			await action.callback(actionEvent(id, { target, on: 1 }), actionContext)
		}
		assert.equal(sent.length, 0)
	})

	void test(`${id} feedback follows state and moves its subscription when the channel changes`, async () => {
		const { state, feedbacks, subscriptions, loaded } = setup()
		const feedback = feedbacks[id]
		assert.ok(feedback)
		const path = `/ch/01/${suffix}`
		const evt = feedbackEvent(id, { target: 'channel1' })
		assert.equal(await feedback.callback(evt, feedbackContext), false)
		assert.deepEqual(subscriptions.getFeedbacks(path), [id])
		assert.deepEqual(loaded, [path])
		for (const value of [1, 0]) {
			state.set(path, [{ type: 'i', value }])
			assert.equal(await feedback.callback(evt, feedbackContext), value === 1)
		}
		const changed = { ...evt, options: { target: 'channel32' }, previousOptions: evt.options }
		await feedback.callback(changed, feedbackContext)
		assert.deepEqual(subscriptions.getFeedbacks(path), [])
		assert.deepEqual(subscriptions.getFeedbacks(`/ch/32/${suffix}`), [id])
		await feedback.unsubscribe?.(changed, feedbackContext)
		assert.deepEqual(subscriptions.getFeedbacks(`/ch/32/${suffix}`), [])
		assert.equal(await feedback.callback(feedbackEvent(id, { target: 'bus1' }), feedbackContext), false)
	})
}

void test('channel delay converts milliseconds to normalized OSC values and clamps the range', async () => {
	const { actions, sent } = setup()
	const action = actions['delay-time']
	assert.ok(action)
	for (const [time, expected] of [
		[0.3, 0],
		[250.15, 0.5],
		[500, 1],
		[-10, 0],
		[1000, 1],
	]) {
		await action.callback(actionEvent('delay-time', { target: 'channel32', time }), actionContext)
		assert.deepEqual(sent.pop(), { path: '/ch/32/delay/time', args: { type: 'f', value: expected } })
	}
	for (const time of [NaN, Infinity, -Infinity]) {
		await action.callback(actionEvent('delay-time', { target: 'channel1', time }), actionContext)
	}
	for (const target of ['channel0', 'channel33', 'aux1', 'bus1', 'stereo', 'invalid']) {
		await action.callback(actionEvent('delay-time', { target, time: 10 }), actionContext)
	}
	assert.equal(sent.length, 0)
	for (const ms of [0.3, 0.4, 1, 10.1, 100, 499.9, 500]) {
		assert.equal(floatToDelay(Math.fround(delayToFloat(ms))), ms)
	}
})

void test('relative delay adjustments use the subscribed value and stay within the console range', async () => {
	const { actions, state, sent, loaded } = setup()
	const action = actions['delay-time-delta']
	assert.ok(action)
	const evt = actionEvent('delay-time-delta', { target: 'channel1', delta: 0.1 })
	await action.subscribe?.(evt, actionContext)
	assert.deepEqual(loaded, ['/ch/01/delay/time'])
	await action.callback(evt, actionContext)
	assert.equal(sent.length, 0)
	for (const [currentMs, delta, expectedMs] of [
		[10, 0.1, 10.1],
		[10, -0.1, 9.9],
		[10, 1, 11],
		[10, -1, 9],
		[25, 10, 35],
		[25, -10, 15],
		[499.9, 1, 500],
		[0.4, -1, 0.3],
	]) {
		state.set('/ch/01/delay/time', [{ type: 'f', value: Math.fround(delayToFloat(currentMs)) }])
		await action.callback({ ...evt, options: { ...evt.options, delta } }, actionContext)
		assert.deepEqual(sent.pop(), { path: '/ch/01/delay/time', args: { type: 'f', value: delayToFloat(expectedMs) } })
	}
	state.set('/ch/01/delay/time', [{ type: 'f', value: NaN }])
	await action.callback(evt, actionContext)
	assert.equal(sent.length, 0)
})

void test('delay variables expose each channel time in milliseconds and update from console state', () => {
	const state = new X32State()
	const variables = Object.keys(VariableDefinitions).filter((id) => id.startsWith('delay_'))
	assert.equal(variables.length, 32)
	for (let channel = 1; channel <= 32; channel++) {
		const channelNumber = String(channel).padStart(2, '0')
		const variableId = `delay_ch_${channelNumber}_ms` as const
		const definition = VariableDefinitions[variableId]
		assert.ok(definition)
		const path = `/ch/${channelNumber}/delay/time`
		assert.equal(definition.oscPath, path)
		const limitTo = new Set([variableId])
		assert.equal(GetCompanionVariableValues(state, limitTo)[variableId], undefined)
		for (const ms of [0.3, 1, 10.1, 35, 100, 499.9, 500]) {
			state.set(path, [{ type: 'f', value: Math.fround(delayToFloat(ms)) }])
			assert.equal(GetCompanionVariableValues(state, limitTo)[variableId], ms)
		}
	}
})

void test('delay variables stay undefined when no valid delay value has been received', () => {
	const state = new X32State()
	const definition = VariableDefinitions.delay_ch_01_ms
	for (const data of [
		undefined,
		[],
		[{ type: 'i', value: 1 }],
		[{ type: 's', value: '10' }],
		[{ type: 'f', value: NaN }],
		[{ type: 'f', value: Infinity }],
	] satisfies (OSCMetaArgument[] | undefined)[]) {
		assert.equal(definition.getValue(data, state), undefined)
	}
})

const faderValues = [
	[0, -90],
	[0.03125, -75],
	[0.0625, -60],
	[0.15625, -45],
	[0.25, -30],
	[0.375, -20],
	[0.5, -10],
	[0.675, -3],
	[0.7, -2],
	[0.725, -1],
	[0.7475, -0.1],
	[0.75, 0],
	[0.7525, 0.1],
	[0.8775, 5.1],
	[1, 10],
]

void test('fader conversion removes float32 artifacts across all four curve segments', () => {
	for (const [normalized, db] of faderValues) {
		assert.equal(floatToDB(Math.fround(normalized)), db)
	}
	assert.equal(floatToDB(-1), -Infinity)
	assert.equal(floatToDB(0.74999999), 0)
})

void test('all fader variables expose rounded numeric dB values, including sends and mains', () => {
	const state = new X32State()
	const faders = Object.entries(VariableDefinitions).filter(([id]) => id.startsWith('fader_'))
	assert.ok(faders.length > 0)
	for (const [id, definition] of faders) {
		assert.equal(definition.getValue(undefined, state), undefined, id)
		for (const [normalized, db] of faderValues) {
			assert.equal(definition.getValue([{ type: 'f', value: Math.fround(normalized) }], state), db, id)
		}
	}
})

void test('fader and send feedback comparisons match the rounded value', async () => {
	const { state, feedbacks } = setup()
	const cases = [
		['fader_level', '/ch/01/mix/fader', { target: 'channel1' }],
		['level_channel_send', '/ch/01/mix/01/level', { source: 'channel1', target: 'bus1' }],
		['level_bus_send', '/bus/01/mix/01/level', { source: 'bus1', target: 'matrix1' }],
	] as const
	for (const [id, path, options] of cases) {
		const feedback = feedbacks[id]
		assert.ok(feedback)
		state.set(path, [{ type: 'f', value: Math.fround(0.725) }])
		for (const [comparitor, expected] of [
			['eq', true],
			['ne', false],
			['lt', false],
			['lte', true],
			['gt', false],
			['gte', true],
		] as const) {
			const evt = feedbackEvent(id, { source: '', ...options, fad: -1, comparitor })
			assert.equal(await feedback.callback(evt, feedbackContext), expected, `${id}: ${comparitor}`)
		}
	}
})
