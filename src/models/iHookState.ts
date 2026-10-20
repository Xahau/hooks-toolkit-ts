import type { HookState as LeHookState } from 'xahau/dist/npm/models/ledger'
import { iHookStateEntry } from './iHookStateEntry'

export class iHookState {
  entry: iHookStateEntry

  constructor(entry: LeHookState) {
    this.entry = new iHookStateEntry(entry)
  }
}
