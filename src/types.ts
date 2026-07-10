import {
  Hook,
  HookGrant,
  HookParameter,
} from 'xahau/dist/npm/models/common/xahau'
import { Client, Transaction, Wallet } from 'xahau'

export type iHook = {
  HookHash?: string
  CreateCode?: string
  Flags?: number
  HookOn?: string
  HookNamespace?: string
  HookApiVersion?: number
  HookParameters?: HookParameter[]
  HookGrants?: HookGrant[]
  HookName?: string
  Fee?: string
}

export type SetHookParams = {
  client: Client
  wallet: Wallet
  hooks: Hook[]
}

export interface SmartContractParams {
  wallet: Wallet
  tx: Transaction
  debugStream?: boolean
}
