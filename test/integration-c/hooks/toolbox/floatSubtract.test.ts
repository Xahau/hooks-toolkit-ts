// xrpl
import { Invoke, TransactionMetadata } from 'xahau'
import { HookFlags } from 'xahau/dist/npm/models/common/xahau'

import {
  // Testing
  XrplIntegrationTestContext,
  setupClient,
  teardownClient,
  serverUrl,
  // Main
  Xrpld,
  ExecutionUtility,
  createHookPayload,
  setHooks,
  clearAllHooks,
} from '../../../../src'

describe('floatSubtract', () => {
  let testContext: XrplIntegrationTestContext

  beforeAll(async () => {
    testContext = await setupClient(serverUrl)
    const hook = createHookPayload({
      version: 0,
      createFile: 'float_subtract',
      namespace: 'float_subtract',
      flags: HookFlags.hsfOverride,
      hookOnArray: ['Invoke'],
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
    // INVOKE IN
    const hookWallet = testContext.hook1
    const bobWallet = testContext.bob
    const builtTx: Invoke = {
      TransactionType: 'Invoke',
      Account: bobWallet.classicAddress,
      Destination: hookWallet.classicAddress,
    }
    const result = await Xrpld.submit(testContext.client, {
      wallet: bobWallet,
      tx: builtTx,
    })
    const hookExecutions = await ExecutionUtility.getHookExecutionsFromMeta(
      testContext.client,
      result.meta as TransactionMetadata
    )
    expect(hookExecutions.executions[0].HookReturnString).toMatch(
      'float_subtract.c: Finished.'
    )
  })
})
