import { iFunctionParamName } from './iFunctionParamName'
import { iFunctionParamValue } from './iFunctionParamValue'
import { FunctionParameter } from 'xahau/dist/npm/models/common/xahau'

export class iFunctionParamValueEntry {
  name: iFunctionParamName
  value?: iFunctionParamValue

  constructor(name: iFunctionParamName, value?: iFunctionParamValue) {
    this.name = name
    this.value = value
  }

  fromHex(name: string, type: string, value: string) {
    this.name = new iFunctionParamName(name)
    this.value = new iFunctionParamValue(type, value)
  }

  toXrpl(): FunctionParameter {
    return {
      FunctionParameter: {
        FunctionParameterName: !this.name.isHex
          ? this.name.toHex()
          : this.name.value,
        FunctionParameterValue: !this.value.isHex
          ? this.value.toHex()
          : { type: this.value.type, value: this.value.value },
      },
    } as FunctionParameter
  }
}
