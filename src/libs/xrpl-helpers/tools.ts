import {
  type Client,
  Wallet,
  type Payment,
  type TrustSet,
  type AccountSet,
  type AccountSetAsfFlags,
  xahToDrops,
  type LedgerEntryRequest,
  type AccountInfoRequest,
  convertStringToHex,
  type OfferCreate,
  OfferCreateFlags,
  type RandomRequest,
  type SubmittableTransaction,
  ECDSA,
} from 'xahau'
import type { IssuedCurrencyAmount } from 'xahau/dist/npm/models/common'
import type { RippleState } from 'xahau/dist/npm/models/ledger'
import { appTransaction } from './transaction'
import { appLogger } from '../logger'
import {
  ALICE_WALLET,
  BOB_WALLET,
  CAROL_WALLET,
  DAVE_WALLET,
  ELSA_WALLET,
  FRANK_WALLET,
  GRACE_WALLET,
  GW_WALLET,
  HEIDI_WALLET,
  HOOK1_WALLET,
  HOOK2_WALLET,
  HOOK3_WALLET,
  HOOK4_WALLET,
  HOOK5_WALLET,
  IVAN_WALLET,
  JUDY_WALLET,
  NOT_ACTIVE_WALLET,
} from './constants'

const LEDGER_ACCEPT_REQUEST = {
  command: 'ledger_accept',
} as unknown as RandomRequest

export class Account {
  name: string
  account: string | undefined
  wallet: Wallet

  constructor(name?: string, seed?: string) {
    if (seed) {
      this.wallet = Wallet.fromSeed(seed, { algorithm: ECDSA.secp256k1 })
    }

    this.name = name as string
    if (name === 'gw') {
      this.wallet = GW_WALLET
    }
    if (name === 'notactivated') {
      this.wallet = NOT_ACTIVE_WALLET
    }
    if (name === 'alice') {
      this.wallet = ALICE_WALLET
    }
    if (name === 'bob') {
      this.wallet = BOB_WALLET
    }
    if (name === 'carol') {
      this.wallet = CAROL_WALLET
    }
    if (name === 'dave') {
      this.wallet = DAVE_WALLET
    }
    if (name === 'elsa') {
      this.wallet = ELSA_WALLET
    }
    if (name === 'frank') {
      this.wallet = FRANK_WALLET
    }
    if (name === 'grace') {
      this.wallet = GRACE_WALLET
    }
    if (name === 'heidi') {
      this.wallet = HEIDI_WALLET
    }
    if (name === 'ivan') {
      this.wallet = IVAN_WALLET
    }
    if (name === 'judy') {
      this.wallet = JUDY_WALLET
    }
    if (name === 'hook1') {
      this.wallet = HOOK1_WALLET
    }
    if (name === 'hook2') {
      this.wallet = HOOK2_WALLET
    }
    if (name === 'hook3') {
      this.wallet = HOOK3_WALLET
    }
    if (name === 'hook4') {
      this.wallet = HOOK4_WALLET
    }
    if (name === 'hook5') {
      this.wallet = HOOK5_WALLET
    }

    if (!this.wallet) {
      this.wallet = Wallet.generate()
    }

    this.account = this.wallet.classicAddress
  }
}

export class ICXAH {
  issuer: string | undefined
  currency = 'XAH'
  value: number
  amount: string

  constructor(value: number) {
    this.value = value
    this.amount = xahToDrops(value)
  }
}

export class IC {
  issuer: string | undefined
  currency: string | undefined
  value: number | undefined
  amount: Record<string, string | number> | undefined

  static gw(name: string, gw: string): IC {
    // TODO: symbolToHex(name);
    return new IC(gw, name, 0)
  }

  constructor(issuer: string, currency: string, value: number) {
    this.issuer = issuer
    this.currency = currency
    this.value = value
    this.amount = {
      issuer: this.issuer,
      currency: this.currency,
      value: String(this.value),
    }
  }

  set(value: number): IC {
    this.value = value
    this.amount = {
      issuer: this.issuer as string,
      currency: this.currency as string,
      value: String(this.value),
    }
    return this
  }
}

export async function accountSeq(
  ctx: Client,
  account: string
): Promise<number> {
  const request: AccountInfoRequest = {
    command: 'account_info',
    account: account as string,
  }
  try {
    const response = await ctx.request(request)
    return response.result.account_data.Sequence
  } catch (_error: any) {
    // appLogger.debug(error.message)
    return 0
  }
}

export async function xrpBalance(
  ctx: Client,
  account: string
): Promise<number> {
  const request: AccountInfoRequest = {
    command: 'account_info',
    account: account as string,
  }
  const response = await ctx.request(request)
  if ('error' in response.result && response.result.error === 'actNotFound') {
    return 0
  }
  return parseFloat(response.result.account_data.Balance)
}

export async function icBalance(
  ctx: Client,
  account: string,
  ic: IC
): Promise<number> {
  const request: LedgerEntryRequest = {
    command: 'ledger_entry',
    ripple_state: {
      currency: ic.currency as string,
      accounts: [account as string, ic.issuer as string],
    },
  }
  const response = await ctx.request(request)
  if ('error' in response.result) {
    return 0
  }
  const node = response.result.node as RippleState
  return Math.abs(parseFloat(node.Balance.value))
}

export async function balance(
  ctx: Client,
  account: string,
  ic?: IC
): Promise<number> {
  try {
    if (!ic) {
      return await xrpBalance(ctx, account)
    }
    return await icBalance(ctx, account, ic)
  } catch (error: unknown) {
    if (error instanceof Error) {
      // appLogger.debug(error.message)
      return 0
    }
    return 0
  }
}

export async function limit(
  ctx: Client,
  account: string,
  ic: IC
): Promise<number> {
  try {
    const request: LedgerEntryRequest = {
      command: 'ledger_entry',
      ripple_state: {
        currency: ic.currency as string,
        accounts: [account as string, ic.issuer as string],
      },
    }
    // const isHighLimit =
    //   decodeAccountID(ic.issuer as string) <
    //   decodeAccountID(account.classicAddress as string)
    const response = await ctx.request(request)
    if ('error' in response.result) {
      return 0
    }
    const node = response.result.node as RippleState
    if (node.HighLimit.issuer === (ic.issuer as string)) {
      return parseFloat(node.LowLimit.value)
    } else {
      return parseFloat(node.HighLimit.value)
    }
  } catch (error: unknown) {
    if (error instanceof Error) {
      // appLogger.debug(error.message)
      return 0
    }
    return 0
  }
}

export async function fund(
  ctx: Client,
  wallet: Wallet,
  uicx: IC | ICXAH,
  ...accts: string[]
): Promise<void> {
  for (const acct of accts) {
    try {
      const builtTx: Payment = {
        TransactionType: 'Payment',
        Account: wallet.classicAddress,
        Destination: acct as string,
        Amount: uicx.amount as unknown as IssuedCurrencyAmount,
      }

      const response = await appTransaction(ctx, builtTx, wallet, {
        hardFail: true,
        count: 1,
        delayMs: 1000,
      })
      appLogger.debug(JSON.stringify(response))
    } catch (error: any) {
      appLogger.debug(error)
      appLogger.debug(error.data?.decoded)
      appLogger.debug(error.data?.tx)
    }
  }
}

export async function pay(
  ctx: Client,
  uicx: IC | ICXAH,
  signer: Wallet,
  ...accts: string[]
): Promise<void> {
  for (const acct of accts) {
    try {
      const builtTx: Payment = {
        TransactionType: 'Payment',
        Account: signer.classicAddress,
        Destination: acct as string,
        Amount: uicx.amount as unknown as IssuedCurrencyAmount,
      }
      const response = await appTransaction(ctx, builtTx, signer, {
        hardFail: true,
        count: 1,
        delayMs: 1000,
      })
      appLogger.debug(JSON.stringify(response))
    } catch (error: any) {
      appLogger.debug(error)
      appLogger.debug(error.data?.decoded)
      appLogger.debug(error.data?.tx)
      throw error
    }
  }
}

export async function sell(
  ctx: Client,
  uicx: IC | ICXAH,
  signer: Wallet,
  rate: number
): Promise<void> {
  try {
    // 1, 2 = 1 *, 1 /
    const takerGets: IssuedCurrencyAmount = {
      value: String(uicx.value),
      currency: uicx.currency,
      issuer: uicx.issuer,
    }
    const builtTx: OfferCreate = {
      TransactionType: 'OfferCreate',
      Account: signer.classicAddress,
      TakerGets: takerGets,
      TakerPays: xahToDrops(String(rate * uicx.value)),
      Flags: OfferCreateFlags.tfSell,
      NetworkID: ctx.networkID,
    }
    const response = await appTransaction(ctx, builtTx, signer, {
      hardFail: true,
      count: 1,
      delayMs: 1000,
    })
    appLogger.debug(JSON.stringify(response))
  } catch (error: any) {
    appLogger.debug(error)
    appLogger.debug(error.data?.decoded)
    appLogger.debug(error.data?.tx)
    throw error
  }
}

export async function buy(
  ctx: Client,
  uicx: IC | ICXAH,
  signer: Wallet,
  rate: number
): Promise<void> {
  try {
    // 1, 2 = 1 *, 1 /
    const takerPays: IssuedCurrencyAmount = {
      value: String(uicx.value),
      currency: uicx.currency,
      issuer: uicx.issuer,
    }
    const builtTx: OfferCreate = {
      TransactionType: 'OfferCreate',
      Account: signer.classicAddress,
      TakerGets: xahToDrops(String(rate * uicx.value)),
      TakerPays: takerPays,
      NetworkID: ctx.networkID,
    }
    const response = await appTransaction(ctx, builtTx, signer, {
      hardFail: true,
      count: 1,
      delayMs: 1000,
    })
    appLogger.debug(JSON.stringify(response))
  } catch (error: any) {
    appLogger.debug(error)
    appLogger.debug(error.data?.decoded)
    appLogger.debug(error.data?.tx)
    throw error
  }
}

export async function trust(
  ctx: Client,
  uicx: IC | ICXAH,
  ...accts: Wallet[]
): Promise<void> {
  for (const acct of accts) {
    try {
      const builtTx: TrustSet = {
        TransactionType: 'TrustSet',
        Account: acct.classicAddress as string,
        LimitAmount: uicx.amount as unknown as IssuedCurrencyAmount,
        NetworkID: ctx.networkID,
      }
      const response = await appTransaction(ctx, builtTx, acct, {
        hardFail: true,
        count: 1,
        delayMs: 1000,
      })
      appLogger.debug(JSON.stringify(response))
    } catch (error: any) {
      appLogger.debug(error.data?.decoded)
      appLogger.debug(error.data?.tx)
      throw error
    }
  }
}

export async function burn(
  ctx: Client,
  account: Wallet,
  amount: number
): Promise<void> {
  const builtTx: AccountSet = {
    TransactionType: 'AccountSet',
    Account: account.classicAddress as string,
    Fee: xahToDrops(String(amount)),
    NetworkID: ctx.networkID,
  }
  const response = await appTransaction(ctx, builtTx, account, {
    hardFail: true,
    count: 1,
    delayMs: 1000,
  })
  appLogger.debug(JSON.stringify(response))
}

export async function accountSet(
  ctx: Client,
  account: Wallet,
  flag: AccountSetAsfFlags
): Promise<void> {
  const builtTx: AccountSet = {
    TransactionType: 'AccountSet',
    Account: account.classicAddress as string,
    TransferRate: 0,
    Domain: convertStringToHex('https://usd.transia.io'),
    SetFlag: flag,
    NetworkID: ctx.networkID,
  }
  const response = await appTransaction(ctx, builtTx, account, {
    hardFail: true,
    count: 1,
    delayMs: 1000,
  })
  appLogger.debug(JSON.stringify(response))
}

export async function accountClear(
  ctx: Client,
  account: Wallet,
  flag: AccountSetAsfFlags
): Promise<void> {
  const builtTx: AccountSet = {
    TransactionType: 'AccountSet',
    Account: account.classicAddress as string,
    TransferRate: 0,
    Domain: convertStringToHex('https://usd.transia.io'),
    ClearFlag: flag,
    NetworkID: ctx.networkID,
  }
  await appTransaction(ctx, builtTx, account, {
    hardFail: true,
    count: 1,
    delayMs: 1000,
  })
}

export async function rpcTx(
  ctx: Client,
  account: Wallet,
  json: Record<string, unknown>
): Promise<void> {
  await appTransaction(
    ctx,
    json as unknown as SubmittableTransaction,
    account,
    {
      hardFail: true,
      count: 1,
      delayMs: 1000,
    }
  )
}

export async function rpc(
  ctx: Client,
  json: Record<string, unknown>
): Promise<void> {
  ctx.request(json as RandomRequest)
}

export async function close(ctx: Client): Promise<void> {
  await ctx.request(LEDGER_ACCEPT_REQUEST)
}
