import {
  Hook,
  HookGrant,
  HookParameter,
} from 'xahau/dist/npm/models/common/xahau'
import { Client, Transaction, Wallet } from 'xahau'

interface iHookBase {
  HookHash?: string
  CreateCode?: string
  Flags?: number
  HookCanEmit?: string
  HookNamespace?: string
  HookApiVersion?: number
  HookParameters?: HookParameter[]
  HookGrants?: HookGrant[]
  HookName?: string
  Fee?: string
}

interface iHookWithHookOn extends iHookBase {
  HookOn?: string
  HookOnIncoming?: never
  HookOnOutgoing?: never
}

interface iHookWithIncomingOutgoing extends iHookBase {
  HookOn?: never
  HookOnIncoming?: string
  HookOnOutgoing?: string
}

interface iHookWithoutHookOn extends iHookBase {
  HookOn?: undefined
  HookOnIncoming?: undefined
  HookOnOutgoing?: undefined
}

export type iHook =
  | iHookWithHookOn
  | iHookWithIncomingOutgoing
  | iHookWithoutHookOn

export type SetHookParams = {
  client: Client
  wallet: Wallet
  hooks: Hook[]
}

export type ClearHookParams = {
  client: Client
  wallet: Wallet
}

export interface SmartContractParams {
  wallet: Wallet
  tx: Transaction
  debugStream?: boolean
}
