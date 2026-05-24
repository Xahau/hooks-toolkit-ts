import { convertHexToString, convertStringToHex } from 'xahau'

export class iHookFunctionName {
  value: string
  isHex: boolean

  constructor(value: string, isHex?: boolean) {
    this.value = value
    this.isHex = isHex ? isHex : false
  }

  static fromHex(hexValue: string): iHookFunctionName {
    return new iHookFunctionName(convertHexToString(hexValue))
  }

  toHex(): string {
    return convertStringToHex(this.value)
  }
}
