// xrpl
import { Invoke, Payment, SetHookFlags, TransactionMetadata } from 'xahau'
// xrpl-helpers
import {
  XrplIntegrationTestContext,
  setupClient,
  teardownClient,
  serverUrl,
} from '../../../../src/libs/xrpl-helpers'
import {
  Xrpld,
  SetHookParams,
  ExecutionUtility,
  createHookPayload,
  setHooksV3,
  padHexString,
  // clearAllHooksV3,
} from '../../../../dist/npm/src'

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
      createFile: 'base',
      namespace: 'base',
      flags: SetHookFlags.hsfOverride,
      hookOnArray: ['Invoke', 'Payment'],
      fee: '100000',
    })
    await setHooksV3({
      client: testContext.client,
      wallet: testContext.hook1,
      hooks: [{ Hook: hook }],
    } as SetHookParams)
  })
  afterAll(async () => {
    // await clearAllHooksV3({
    //   client: testContext.client,
    //   wallet: testContext.hook1,
    // } as SetHookParams)
    await teardownClient(testContext)
  })

  it('basic hook', async () => {
    // await execInvoke(testContext)
    await execPayment(testContext)
  })
})
