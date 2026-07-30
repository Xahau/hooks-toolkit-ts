// xrpl
import { Invoke, TransactionMetadata } from 'xahau'
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
  iHookParamEntry,
  iHookParamName,
  iHookParamValue,
  generateHash,
} from '../../../../src'
import { uint64ToHex } from '@transia/binary-models'
import { HookFlags } from 'xahau/dist/npm/models/common/xahau'

describe('compareCondition', () => {
  let testContext: XrplIntegrationTestContext

  beforeAll(async () => {
    testContext = await setupClient(serverUrl)
    const hook = createHookPayload({
      version: 0,
      createFile: 'compare_condition',
      namespace: 'compare_condition',
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
    const aliceWallet = testContext.alice

    const preimage = 'test12345'
    const condition = generateHash(Buffer.from(preimage))
    const otxn1Param1 = new iHookParamEntry(
      new iHookParamName('C'),
      new iHookParamValue(condition, true)
    )
    const builtTx1: Invoke = {
      TransactionType: 'Invoke',
      Account: aliceWallet.classicAddress,
      Destination: hookWallet.classicAddress,
      HookParameters: [otxn1Param1.toXrpl()],
    }
    const result1 = await Xrpld.submit(testContext.client, {
      wallet: aliceWallet,
      tx: builtTx1,
    })
    const hookExecutions1 = await ExecutionUtility.getHookExecutionsFromMeta(
      testContext.client,
      result1.meta as TransactionMetadata
    )
    expect(hookExecutions1.executions[0].HookReturnString).toMatch(
      'compare_condition.c: Condition Added.'
    )

    const fulfillment = Buffer.from(preimage).toString('hex')
    const otxn2Param1 = new iHookParamEntry(
      new iHookParamName('F'),
      new iHookParamValue(fulfillment, true)
    )

    const otxn2Param2 = new iHookParamEntry(
      new iHookParamName('FL'),
      new iHookParamValue(uint64ToHex(BigInt(fulfillment.length / 2)), true)
    )
    const builtTx2: Invoke = {
      TransactionType: 'Invoke',
      Account: aliceWallet.classicAddress,
      Destination: hookWallet.classicAddress,
      HookParameters: [otxn2Param1.toXrpl(), otxn2Param2.toXrpl()],
    }

    const result2 = await Xrpld.submit(testContext.client, {
      wallet: aliceWallet,
      tx: builtTx2,
    })
    const hookExecutions2 = await ExecutionUtility.getHookExecutionsFromMeta(
      testContext.client,
      result2.meta as TransactionMetadata
    )
    expect(hookExecutions2.executions[0].HookReturnString).toMatch(
      'compare_condition.c: Verification Success.'
    )
  })
})
