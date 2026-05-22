import {
  calculateHookOn,
  hexHookParameters,
  SetHook,
  SetHookFlags,
} from 'xahau'
import { SetHookParams, iHook } from './types'
import { HookGrant, HookParameter } from 'xahau/dist/npm/models/common/xahau'
import { readHookBinaryHexFromNS, hexNamespace } from './utils'
import { appTransaction } from './libs/xrpl-helpers/transaction'
import { appLogger } from './libs/logger'

export interface SetHookPayload {
  version?: number | null
  hookHash?: string | null
  createFile?: string | null
  namespace?: string | null
  flags?: number | 0
  hookOnArray?: string[] | null
  hookParams?: HookParameter[] | null
  hookGrants?: HookGrant[] | null
  fee?: string | null
}

export function createHookPayload(payload: SetHookPayload): iHook {
  const hook = {} as iHook
  if (typeof payload.version === 'number') {
    hook.HookApiVersion = payload.version
  }
  if (payload.hookHash && typeof payload.hookHash === 'string') {
    hook.HookHash = payload.hookHash
  }
  if (payload.createFile && typeof payload.createFile === 'string') {
    switch (payload.version) {
      case 0:
        hook.CreateCode = readHookBinaryHexFromNS(payload.createFile, 'wasm')
        break
      case 1:
        hook.CreateCode = readHookBinaryHexFromNS(payload.createFile, 'bc')
        break

      default:
        hook.CreateCode = readHookBinaryHexFromNS(payload.createFile, 'wasm')
        break
    }
  }
  if (payload.namespace) {
    hook.HookNamespace = hexNamespace(payload.namespace)
  }
  if (payload.flags) {
    hook.Flags = payload.flags
  }
  if (payload.fee) {
    hook.Fee = payload.fee
  }
  if (payload.hookOnArray) {
    hook.HookOn = calculateHookOn(payload.hookOnArray)
  }
  if (payload.hookParams) {
    hook.HookParameters = hexHookParameters(payload.hookParams)
  }
  if (payload.hookGrants) {
    hook.HookGrants = payload.hookGrants
  }
  // DA: validate
  return hook
}

export async function setHooksV3({ client, wallet, hooks }: SetHookParams) {
  const tx: SetHook = {
    TransactionType: `SetHook`,
    Account: wallet.address,
    Hooks: hooks,
  }

  appLogger.debug(`1. Transaction to submit (before autofill):`)
  appLogger.debug(JSON.stringify(tx, null, 2))
  appLogger.debug(`\n2. Submitting transaction...`)

  await appTransaction(client, tx, wallet, {
    hardFail: true,
    count: 2,
    delayMs: 1000,
  })

  appLogger.debug(`\n3. SetHook Success...`)
}

export async function clearAllHooksV3({ client, wallet }: SetHookParams) {
  const hook = {
    CreateCode: '',
    Flags: SetHookFlags.hsfOverride | SetHookFlags.hsfNSDelete,
  } as iHook
  const tx: SetHook = {
    TransactionType: `SetHook`,
    Account: wallet.classicAddress,
    Hooks: [
      { Hook: hook },
      { Hook: hook },
      { Hook: hook },
      { Hook: hook },
      { Hook: hook },
      { Hook: hook },
      { Hook: hook },
      { Hook: hook },
      { Hook: hook },
      { Hook: hook },
    ],
  }

  appLogger.debug(`1. Transaction to submit (before autofill):`)
  appLogger.debug(JSON.stringify(tx, null, 2))
  appLogger.debug(`\n2. Submitting transaction...`)

  await appTransaction(client, tx, wallet, {
    hardFail: true,
    count: 2,
    delayMs: 1000,
  })

  appLogger.debug(`\n3. SetHook Success...`)
}

export async function clearHookStateV3({
  client,
  wallet,
  hooks,
}: SetHookParams) {
  const tx: SetHook = {
    TransactionType: `SetHook`,
    Account: wallet.classicAddress,
    Hooks: hooks,
  }

  appLogger.debug(`1. Transaction to submit (before autofill):`)
  appLogger.debug(JSON.stringify(tx, null, 2))
  appLogger.debug(`\n2. Submitting transaction...`)

  await appTransaction(client, tx, wallet, {
    hardFail: true,
    count: 2,
    delayMs: 1000,
  })

  appLogger.debug(`\n3. SetHook Success...`)
}
