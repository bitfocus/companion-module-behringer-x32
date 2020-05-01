import * as osc from 'osc'

export class X32State {
  private readonly data: Map<string, osc.MetaArgument[]>

  constructor() {
    this.data = new Map()
  }

  // TODO
  public get(path: string): osc.MetaArgument[] | undefined {
    return this.data.get(path)
  }
  public set(path: string, data: osc.MetaArgument[]): void {
    this.data.set(path, data)
  }
}

// export class X32Subscriptions {
//   private subscriptions: Map<string, string[]>

//   constructor() {
//     this.subscriptions = new Map()
//   }

//   public subscribe(id: string, path: string): void {
//     let subs = this.subscriptions.get(path)
//     if (!subs) {
//       subs = []
//       this.subscriptions.set(path, subs)
//     }

//     subs.push(id)
//   }

//   public unsubscribe(id: string, path: string): void {}
// }
