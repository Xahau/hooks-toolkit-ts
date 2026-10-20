import type { iHookParamEntry } from './iHookParamEntry'

export class iHookParamEntries {
  parameters: iHookParamEntry[]

  constructor(parameters: iHookParamEntry[]) {
    this.parameters = parameters
  }
}
