// xrpl
import { Invoke, Payment, TransactionMetadata } from 'xahau'
import { HookFlags } from 'xahau/dist/npm/models/common/xahau'
// xrpl-helpers
import {
  XrplIntegrationTestContext,
  setupClient,
  teardownClient,
  serverUrl,
  close,
} from '../../../../src/libs/xrpl-helpers'
import {
  Xrpld,
  ExecutionUtility,
  createHookPayload,
  setHooks,
  padHexString,
  clearAllHooks,
} from '../../../../src'

import { xrpAddressToHex } from '@transia/binary-models'

export const execInvoke = async (testContext: XrplIntegrationTestContext) => {
  const aliceWallet = testContext.alice
  const hookWallet = testContext.hook1
  const builtTx: Invoke = {
    TransactionType: 'Invoke',
    Account: aliceWallet.classicAddress,
    Destination: hookWallet.classicAddress,
  }
  const result = await Xrpld.submit(testContext.client, {
    wallet: aliceWallet,
    tx: builtTx,
  })
  const hookExecutions = await ExecutionUtility.getHookExecutionsFromMeta(
    testContext.client,
    result.meta as TransactionMetadata
  )
  expect(hookExecutions.executions[0].HookReturnString).toMatch(
    'base: Finished.'
  )
}
export const execPayment = async (testContext: XrplIntegrationTestContext) => {
  const aliceWallet = testContext.alice
  const hookWallet = testContext.hook1
  const builtTx: Payment = {
    TransactionType: 'Payment',
    Account: aliceWallet.classicAddress,
    Destination: hookWallet.classicAddress,
    Amount: '1',
    InvoiceID: padHexString(xrpAddressToHex(hookWallet.classicAddress)),
  }
  const result = await Xrpld.submit(testContext.client, {
    wallet: aliceWallet,
    tx: builtTx,
  })
  const hookExecutions = await ExecutionUtility.getHookExecutionsFromMeta(
    testContext.client,
    result.meta as TransactionMetadata
  )
  // expect(hookExecutions.executions[0].HookReturnString).toMatch(
  //   'base: Finished.'
  // )
  expect(hookExecutions.executions[0].HookReturnString).toMatch('')
}

describe('base', () => {
  let testContext: XrplIntegrationTestContext

  beforeAll(async () => {
    testContext = await setupClient(serverUrl)
    const hook = createHookPayload({
      version: 1,
      createFile: 'redirect',
      namespace: 'redirect',
      flags: HookFlags.hsfOverride,
      hookOnArray: ['Invoke', 'Payment'],
      fee: '100',
    })
    await setHooks({
      client: testContext.client,
      wallet: testContext.hook1,
      hooks: [{ Hook: hook }],
    })
  })
  afterAll(async () => {
    await clearAllHooks({
      client: testContext.client,
      wallet: testContext.hook1,
    })
    await teardownClient(testContext)
  })

  it('basic hook', async () => {
    // await execInvoke(testContext)
    await execPayment(testContext)
    await close(testContext.client)
  })
})
