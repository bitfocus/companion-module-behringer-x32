import * as osc from 'osc'
import { X32State } from './state'

export const MEDIA_PLAYER_SOURCE_CLIP_OFFSET = 1000

export function assertUnreachable(_never: never): void {
  // throw new Error('Unreachable')
}

export function literal<T>(val: T): T {
  return val
}

export type Required<T> = T extends object ? { [P in keyof T]-?: NonNullable<T[P]> } : T

export function ensureLoaded(oscSocket: osc.UDPPort, state: X32State, path: string): void {
  console.log(`Ensure: ${path}`)
  if (!state.get(path)) {
    oscSocket.send({
      address: path,
      args: []
    })
  }
}
