import type { Transaction } from 'xahau'

export class iHookEmittedTxs {
  txs: Transaction[]

  constructor(results: Transaction[]) {
    this.txs = results.map((emtx) => emtx)
  }
}
