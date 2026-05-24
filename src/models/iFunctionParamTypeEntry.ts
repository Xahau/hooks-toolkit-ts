import { iFunctionParamName } from './iFunctionParamName'
import { iFunctionParamType } from './iFunctionParamType'
import { FunctionParameter } from 'xahau/dist/npm/models/common/xahau'

export class iFunctionParamTypeEntry {
  name: iFunctionParamName
  type: iFunctionParamType

  constructor(name: iFunctionParamName, type: iFunctionParamType) {
    this.name = name
    this.type = type
  }
  toXrpl(): FunctionParameter {
    return {
      FunctionParameter: {
        FunctionParameterName: !this.name.isHex
          ? this.name.toHex()
          : this.name.value,
        FunctionParameterType: { type: this.type.type },
      },
    } as FunctionParameter
  }
}
