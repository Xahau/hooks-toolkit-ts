import { convertHexToString, convertStringToHex } from 'xahau'

export class iFunctionParamValue {
  type: string
  value: string
  isHex: boolean

  constructor(type: string, value: string, isHex?: boolean) {
    this.type = type
    this.value = value
    this.isHex = isHex ? isHex : false
  }

  static from(type: string, value: string): iFunctionParamValue {
    return new iFunctionParamValue(type, value)
  }

  static fromHex(type: string, hexValue: string): iFunctionParamValue {
    return new iFunctionParamValue(type, convertHexToString(hexValue))
  }

  toHex(): Record<string, string> {
    return {
      type: this.type,
      value: convertStringToHex(this.value),
    }
  }
}
