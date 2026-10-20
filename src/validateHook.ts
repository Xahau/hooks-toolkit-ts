import type { Client, HookValidateRequest, HookValidateResponse } from 'xahau'
import { readHookBinaryHexFromNS } from './utils'
import { appLogger } from './libs/logger'

export interface ValidateHookParams {
  client: Client
  createFile?: string // filename in /build
  code?: string // hook wasm as uppercase hex
}

export type HookValidateResult = HookValidateResponse['result']

export async function validateHook({
  client,
  createFile,
  code,
}: ValidateHookParams): Promise<HookValidateResult> {
  if (code === undefined && createFile === undefined) {
    throw new Error('validateHook: createFile or code is required')
  }
  const hex = code ?? readHookBinaryHexFromNS(createFile as string, 'wasm')
  const request: HookValidateRequest = { command: 'hook_validate', code: hex }
  const { result } = await client.request(request)

  appLogger.info(`hook_validate: ${result.valid ? 'valid' : 'invalid'}`)
  if (result.instruction_count_hook !== undefined) {
    appLogger.info(`instruction_count_hook: ${result.instruction_count_hook}`)
  }
  if (result.instruction_count_cbak !== undefined) {
    appLogger.info(`instruction_count_cbak: ${result.instruction_count_cbak}`)
  }
  if (result.vm_error !== undefined) {
    appLogger.error(`vm_error: ${result.vm_error}`)
  }
  for (const line of result.log) {
    appLogger.info(line)
  }
  return result
}
