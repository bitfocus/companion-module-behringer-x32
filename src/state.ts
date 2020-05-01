import * as osc from 'osc'

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
