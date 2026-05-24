export class iFunctionParamType {
  type: string

  constructor(type: string) {
    this.type = type
  }

  static from(value: string): iFunctionParamType {
    return new iFunctionParamType(value)
  }
}
