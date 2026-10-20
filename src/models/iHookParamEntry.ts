import { iHookParamName } from './iHookParamName'
import { iHookParamValue } from './iHookParamValue'
import type { HookParameter } from 'xahau/dist/npm/models/common/xahau'

export interface iHookParameter {
  HookParameterName: string
  HookParameterValue: string
}

export class iHookParamEntry {
  name: iHookParamName
  value: iHookParamValue

  constructor(name: iHookParamName, value: iHookParamValue) {
    this.name = name
    this.value = value
  }

  fromHex(name: string, value: string) {
    this.name = new iHookParamName(name)
    this.value = new iHookParamValue(value)
  }

  toXrpl(): HookParameter {
    return {
      HookParameter: {
        HookParameterName: !this.name.isHex
          ? this.name.toHex()
          : this.name.value,
        HookParameterValue: !this.value.isHex
          ? this.value.toHex()
          : this.value.value,
      },
    } as HookParameter
  }
}
