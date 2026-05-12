import { AccountSetAsfFlags, Client, Invoke, Wallet } from 'xahau'
import {
  Account,
  ICXAH,
  IC,
  fund,
  trust,
  pay,
  balance,
  limit,
  accountSet,
  sell,
} from '../xrpl-helpers'
import { appLogger } from '../logger'
import { Xrpld } from '../../Xrpld'
import { setHooksV3 } from '../../setHooks'
import { SetHookParams } from '../../types'
import { StateUtility } from '../../keylet-utils'
import { padHexString } from '../../utils'

/**
 * This function will fund a new wallet on the Hooks Local Ledger.
 *
 * @returns {Wallet}
 */
export async function fundSystem(
  client: Client,
  wallet: Wallet,
  ic: IC
): Promise<void> {
  const userAccounts = [
    'gw',
    'alice',
    'bob',
    'carol',
    'dave',
    'elsa',
    'frank',
    'grace',
    'heidi',
    'ivan',
    'judy',
  ]
  const userWallets = userAccounts.map((account) => new Account(account))

  const hookAccounts = ['hook1', 'hook2', 'hook3', 'hook4', 'hook5']
  const hookWallets = hookAccounts.map((account) => new Account(account))

  const USD = ic as IC

  // FUND GW
  const gw = userWallets[0]
  const gwNativeBalance = await balance(client, gw.wallet.classicAddress)
  if (gwNativeBalance == 0) {
    appLogger.debug(`SETUP GW: ${gwNativeBalance}`)
    await fund(client, wallet, new ICXAH(10000000), gw.wallet.classicAddress)
    await accountSet(client, gw.wallet, AccountSetAsfFlags.asfDefaultRipple)
    await sell(client, USD.set(20000), gw.wallet, 0.8)
  }

  const needsFunding = []
  const needsLines = []
  const needsIC = []

  for (let i = 1; i < userWallets.length; i++) {
    const wallet = userWallets[i]
    const address = wallet.wallet.classicAddress

    const nativeBalance = await balance(client, address)
    if (nativeBalance < 10000000000) {
      appLogger.debug(`${address} NEEDS FUNDING: ${nativeBalance}`)
      needsFunding.push(address)
    }

    const usdLimit = await limit(client, address, USD)
    if (usdLimit < 100000) {
      appLogger.debug(`${address} NEEDS TRUST: ${usdLimit}`)
      needsLines.push(wallet.wallet)
    }

    const usdBalance = await balance(client, address, USD)
    if (usdBalance < 10000) {
      appLogger.debug(`${address} NEEDS IC: ${usdBalance}`)
      needsIC.push(address)
    }
  }

  for (let i = 0; i < hookWallets.length; i++) {
    const wallet = hookWallets[i]
    const address = wallet.wallet.classicAddress
    const nativeBalance = await balance(client, address)
    if (nativeBalance < 10000000000) {
      appLogger.debug(`${address} NEEDS FUNDING: ${nativeBalance}`)
      needsFunding.push(address)
    }
  }

  appLogger.debug(`FUNDING: ${needsFunding.length}`)
  appLogger.debug(`TRUSTING: ${needsLines.length}`)
  appLogger.debug(`PAYING: ${needsIC.length}`)

  await fund(client, wallet, new ICXAH(20000), ...needsFunding)
  await trust(client, USD.set(100000), ...needsLines)
  await pay(client, USD.set(50000), gw.wallet, ...needsIC)
}

/**
 * This function will fund a new wallet on the Hooks Local Ledger.
 *
 * @returns {boolean}
 */
export async function hasGovernance(
  client: Client,
  master: string
): Promise<boolean> {
  try {
    await StateUtility.getHookState(
      client,
      master,
      padHexString('4D43'),
      '0000000000000000000000000000000000000000000000000000000000000000'
    )
    return true
  } catch (error: any) {
    appLogger.error(error)
    return false
  }
}

/**
 * This function will fund a new wallet on the Hooks Local Ledger.
 *
 * @returns {void}
 */
export async function initGovernTable(
  client: Client,
  invoker: Wallet,
  invokee: Wallet
): Promise<void> {
  const tx: Invoke = {
    TransactionType: 'Invoke',
    Account: invoker.classicAddress,
    Destination: invokee.classicAddress,
  }
  await Xrpld.submit(client, { tx: tx, wallet: invoker })
}

/**
 * This function will fund a new wallet on the Hooks Local Ledger.
 *
 * @returns {void}
 */
export async function setGovernTable(
  client: Client,
  invoker: Wallet,
  table: Wallet
): Promise<void> {
  const hook = {
    HookHash:
      '78CA3F5BD3D4F7B32A6BEBB3844380A9345C9BA496EFEB30314BDDF405D7B4B3',
    HookParameters: [
      {
        HookParameter: {
          HookParameterName: '495300',
          HookParameterValue: '8DB64742BEBDE0FA4408D18D1ACB771A9F395D14',
        },
      },
      {
        HookParameter: {
          HookParameterName: '495301',
          HookParameterValue: 'C73F13BE66550A30BB069D5BBEFDEB6DEE22B2C2',
        },
      },
      {
        HookParameter: {
          HookParameterName: '494D43',
          HookParameterValue: '02',
        },
      },
    ],
  }
  await setHooksV3({
    client: client,
    wallet: table,
    hooks: [{ Hook: hook }],
  } as SetHookParams)
  const tx: Invoke = {
    TransactionType: 'Invoke',
    Account: invoker.classicAddress,
    Destination: table.classicAddress,
  }
  await Xrpld.submit(client, { tx: tx, wallet: invoker })
}
