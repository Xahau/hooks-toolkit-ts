import { convertHexToString, convertStringToHex } from 'xahau'

export class iFunctionParamName {
  value: string
  isHex: boolean

  constructor(value: string, isHex?: boolean) {
    this.value = value
    this.isHex = isHex ? isHex : false
  }

  static fromHex(hexValue: string): iFunctionParamName {
    return new iFunctionParamName(convertHexToString(hexValue))
  }

  toHex(): string {
    return convertStringToHex(this.value)
  }
}
