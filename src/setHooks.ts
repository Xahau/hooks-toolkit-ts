import {
  calculateHookOn,
  convertStringToHex,
  hexHookParameters,
  SetHook,
} from 'xahau'
import { ClearHookParams, SetHookParams, iHook } from './types'
import {
  HookFlags,
  HookGrant,
  HookParameter,
} from 'xahau/dist/npm/models/common/xahau'
import { readHookBinaryHexFromNS, hexNamespace } from './utils'
import { appTransaction } from './libs/xrpl-helpers/transaction'
import { appLogger } from './libs/logger'

export interface SetHookPayloadBase {
  version?: number | null
  hookHash?: string | null
  createFile?: string | null
  namespace?: string | null
  flags?: number | 0
  hookCanEmitArray?: string[] | null
  hookParams?: HookParameter[] | null
  hookGrants?: HookGrant[] | null
  hookName?: string | null
  fee?: string | null
}

interface SetHookPayloadWithHookOn extends SetHookPayloadBase {
  hookOnArray: string[]
  hookOnIncomingArray?: never
  hookOnOutgoingArray?: never
}

interface SetHookPayloadWithIncomingOutgoing extends SetHookPayloadBase {
  hookOnArray?: never
  hookOnIncomingArray: string[]
  hookOnOutgoingArray: string[]
}

interface SetHookPayloadWithoutHookOn extends SetHookPayloadBase {
  hookOnArray?: null
  hookOnIncomingArray?: null
  hookOnOutgoingArray?: null
}

export type SetHookPayload =
  | SetHookPayloadWithHookOn
  | SetHookPayloadWithIncomingOutgoing
  | SetHookPayloadWithoutHookOn

export function createHookPayload(payload: SetHookPayload): iHook {
  const hook: iHook = {}
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
  if (payload.hookOnIncomingArray) {
    hook.HookOnIncoming = calculateHookOn(
      (payload as SetHookPayloadWithIncomingOutgoing).hookOnIncomingArray
    )
  }
  if (payload.hookOnOutgoingArray) {
    hook.HookOnOutgoing = calculateHookOn(
      (payload as SetHookPayloadWithIncomingOutgoing).hookOnOutgoingArray
    )
  }
  if (payload.hookCanEmitArray) {
    hook.HookCanEmit = calculateHookOn(payload.hookCanEmitArray)
  }
  if (payload.hookParams) {
    hook.HookParameters = hexHookParameters(payload.hookParams)
  }
  if (payload.hookGrants) {
    hook.HookGrants = payload.hookGrants
  }
  if (payload.hookName) {
    hook.HookName = convertStringToHex(payload.hookName)
  }
  // DA: validate
  return hook
}

/** @deprecated Use setHooks instead */
export const setHooksV3 = setHooks

export async function setHooks({ client, wallet, hooks }: SetHookParams) {
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

/** @deprecated Use clearAllHooks instead */
export const clearAllHooksV3 = clearAllHooks

export async function clearAllHooks({ client, wallet }: ClearHookParams) {
  const hook = {
    CreateCode: '',
    Flags: HookFlags.hsfOverride | HookFlags.hsfNSDelete,
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

/** @deprecated Use clearHookState instead */
export const clearHookStateV3 = clearHookState

export async function clearHookState({ client, wallet, hooks }: SetHookParams) {
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
