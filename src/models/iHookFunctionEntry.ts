import { iFunctionParamTypeEntries } from './iFunctionParamTypeEntries'
import { iFunctionParamValueEntries } from './iFunctionParamValueEntries'
import { iHookFunctionName } from './iHookFunctionName'
import { HookFunction } from './tmp'

export interface iHookFunction {
  FunctionName: string
  FunctionParameters: string
  Flags: number
  Fee: number
}

export class iHookFunctionEntry {
  name: iHookFunctionName
  parameters?: iFunctionParamTypeEntries | iFunctionParamValueEntries

  constructor(
    name: iHookFunctionName,
    parameters?: iFunctionParamTypeEntries | iFunctionParamValueEntries
  ) {
    this.name = name
    this.parameters = parameters
  }

  fromHex(name: string) {
    this.name = new iHookFunctionName(name)
  }

  toXrpl(): HookFunction {
    const hookFunction: HookFunction = {
      HookFunction: {
        FunctionName: !this.name.isHex ? this.name.toHex() : this.name.value,
      },
    }
    if (this.parameters && this.parameters.parameters.length > 0) {
      // console.log(
      //   this.parameters.parameters.map((param: any) => {
      //     return param.toXrpl()
      //   })
      // )

      hookFunction.HookFunction.FunctionParameters =
        this.parameters.parameters.map((param: any) => param.toXrpl())
    }
    console.log(hookFunction)

    return hookFunction
  }
}
