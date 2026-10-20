import type { iHookGrantEntry } from './iHookGrantEntry'

export class iHookGrantEntries {
  grants: iHookGrantEntry[]

  constructor(grants: iHookGrantEntry[]) {
    this.grants = grants
  }
}
