import {
  Hook,
  HookFunction,
  HookGrant,
  HookParameter,
} from 'xahau/dist/npm/models/common/xahau'
import { Client, SetHookFlagsInterface, Transaction, Wallet } from 'xahau'

export type iHook = {
  HookHash?: string
  CreateCode?: string
  Flags?: number
  HookOn?: string
  HookNamespace?: string
  HookApiVersion?: number
  HookParameters?: HookParameter[]
  HookGrants?: HookGrant[]
  HookFunctions?: HookFunction[]
  Fee?: string
}

export type SetHookParams = {
  client: Client
  wallet: Wallet
  hooks: Hook[]
  flags: number | SetHookFlagsInterface
}

export interface SmartContractParams {
  wallet: Wallet
  tx: Transaction
  debugStream?: boolean
}
