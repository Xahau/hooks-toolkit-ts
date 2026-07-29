/*
Contains the operations that can are performed by the application.
*/
import {
  Client,
  SubmittableTransaction,
  TransactionMetadata,
  TxResponse,
  validate,
} from 'xahau'
import { ExecutionUtility } from './keylet-utils'
import {
  appBatchTransaction,
  appTransaction,
} from './libs/xrpl-helpers/transaction'
import { SmartContractParams } from './types'
import { appLogger } from './libs/logger'
import { addListeners, ISelect, removeListeners } from './libs/debug'

export class Xrpld {
  // TX
  static async submit(
    client: Client,
    params: SmartContractParams
  ): Promise<TxResponse['result']> {
    if (!params.tx) {
      throw Error('Missing tx parameter')
    }
    const builtTx = params.tx as SubmittableTransaction
    appLogger.debug(JSON.stringify(builtTx))
    if (params.debugStream) {
      const selectedAccount: ISelect | null = {
        label: 'sfAccount',
        value: builtTx.Account,
      }
      addListeners(selectedAccount)
    }

    // @ts-expect-error - invoke is tx
    validate(builtTx)
    const txResponse = await appTransaction(client, builtTx, params.wallet, {
      hardFail: true,
      count: 1,
      delayMs: 1000,
    })
    if (params.debugStream) {
      removeListeners()
    }
    // @ts-expect-error - this is defined
    const txResult = txResponse?.result?.meta?.TransactionResult
    if (txResult === 'tecHOOK_REJECTED') {
      const hookExecutions = await ExecutionUtility.getHookExecutionsFromMeta(
        client,
        txResponse?.result?.meta as TransactionMetadata
      )
      if (hookExecutions.executions.length === 1) {
        let returnCode = BigInt(
          `0x${hookExecutions.executions[0].HookReturnCode}`
        )
        if (returnCode & 0x8000000000000000n)
          returnCode = -(returnCode & ~0x8000000000000000n)
        throw Error(
          `${returnCode}: ${hookExecutions.executions[0].HookReturnString}`
        )
      }
      throw Error(JSON.stringify(hookExecutions.executions))
    }
    return txResponse?.result
  }
  // TX
  static async submitBatch(
    client: Client,
    batches: SmartContractParams[]
  ): Promise<any> {
    if (!batches.length) {
      throw Error('Missing batch txns')
    }
    for (let i = 0; i < batches.length; i++) {
      const builtTx = batches[i].tx
      // @ts-expect-error - invoke is tx
      validate(builtTx)
    }
    return await appBatchTransaction(client, batches)
  }
}
