import { Client, Transaction, TransactionMetadata, TxRequest } from 'xahau'
import { iHookExecutions } from '../models/iHookExecutions'
import { iHookEmittedTxs } from '../models/iHookEmittedTxs'
import { CreatedNode, Node } from 'xahau/dist/npm/models/transactions/metadata'

function isCreatedNode(node: Node): node is CreatedNode {
  return Object.prototype.hasOwnProperty.call(node, `CreatedNode`)
}

export class ExecutionUtility {
  static async getHookExecutionsFromMeta(
    client: Client,
    meta: TransactionMetadata
  ): Promise<iHookExecutions> {
    if (!client.isConnected()) {
      throw new Error('xrpl Client is not connected')
    }

    const { HookExecutions } = meta
    if (!HookExecutions) {
      throw Error('No HookExecutions found')
    }
    const hookExecutions = new iHookExecutions(HookExecutions)
    return hookExecutions
  }

  static async getHookExecutionsFromTx(
    client: Client,
    hash: string
  ): Promise<iHookExecutions> {
    if (!client.isConnected()) {
      throw new Error('xrpl Client is not connected')
    }

    // Step 1. Get Emitted Tx
    const txRequest: TxRequest = {
      command: 'tx',
      transaction: hash,
    }
    const txResponse = await client.request(txRequest)

    // @ts-expect-error - this is defined
    const { HookExecutions } = txResponse.result.meta
    if (!HookExecutions) {
      throw Error('No HookExecutions found')
    }

    const hookExecutions = new iHookExecutions(HookExecutions)
    return hookExecutions
  }

  static async getHookEmittedTxsFromMeta(
    client: Client,
    meta: TransactionMetadata
  ): Promise<iHookEmittedTxs> {
    if (!client.isConnected()) {
      throw new Error('xrpl Client is not connected')
    }

    const { AffectedNodes } = meta
    if (!AffectedNodes || AffectedNodes.length === 0) {
      throw Error('No `AffectedNodes` found')
    }

    const emittedCreatedNodes = AffectedNodes.filter((n) => {
      if (isCreatedNode(n)) {
        return n.CreatedNode.LedgerEntryType === 'EmittedTxn'
      }
      return false
    }) as CreatedNode[]

    if (!emittedCreatedNodes || emittedCreatedNodes.length === 0) {
      // console.log('No `CreatedNodes` found')
      return new iHookEmittedTxs([])
    }
    const hookEmitted = new iHookEmittedTxs(
      emittedCreatedNodes.map(
        (node) => node.CreatedNode.NewFields.EmittedTxn as Transaction
      )
    )
    return hookEmitted
  }
}
