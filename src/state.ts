import * as osc from 'osc'
import { FeedbackId } from './feedback'

export class X32State {
  private readonly data: Map<string, osc.MetaArgument[]>

  constructor() {
    this.data = new Map()
  }

  // TODO better typings
  public get(path: string): osc.MetaArgument[] | undefined {
    return this.data.get(path)
  }
  public set(path: string, data: osc.MetaArgument[]): void {
    this.data.set(path, data)
  }
}

export class X32Subscriptions {
  private readonly data: Map<string, Map<string, FeedbackId>>

  constructor() {
    this.data = new Map()
  }

  public getFeedbacks(path: string): FeedbackId[] {
    const entries = this.data.get(path)
    if (entries) {
      return Array.from(new Set(entries.values()))
    } else {
      return []
    }
  }
  public subscribe(path: string, feedbackId: string, type: FeedbackId): void {
    let entries = this.data.get(path)
    if (!entries) {
      entries = new Map()
      this.data.set(path, entries)
    }
    entries.set(feedbackId, type)
  }
  public unsubscribe(path: string, feedbackId: string): void {
    const entries = this.data.get(path)
    if (entries) {
      entries.delete(feedbackId)
    }
  }
}
