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
  iHookParamEntry,
  iHookParamName,
  iHookParamValue,
} from '../../../../src'
import { uint32ToHex, uint64ToHex, uint8ToHex } from '@transia/binary-models'

describe('numbers', () => {
  let testContext: XrplIntegrationTestContext

  beforeAll(async () => {
    testContext = await setupClient(serverUrl)
    const hook = createHookPayload({
      version: 0,
      createFile: 'numbers',
      namespace: 'numbers',
      flags: HookFlags.hsfOverride,
      hookOnArray: ['Invoke'],
    })
    await setHooks({
      client: testContext.client,
      wallet: testContext.alice,
      hooks: [{ Hook: hook }],
    })
  })
  afterAll(async () => {
    await clearAllHooks({
      client: testContext.client,
      wallet: testContext.alice,
    })
    await teardownClient(testContext)
  })

  it('basic hook', async () => {
    // INVOKE IN
    const aliceWallet = testContext.alice
    const bobWallet = testContext.bob

    const otxn1Param1 = new iHookParamEntry(
      new iHookParamName('I64'),
      new iHookParamValue(uint64ToHex(BigInt(123)), true)
    )
    const otxn1Param2 = new iHookParamEntry(
      new iHookParamName('I32'),
      new iHookParamValue(uint32ToHex(123), true)
    )
    const otxn1Param3 = new iHookParamEntry(
      new iHookParamName('I8'),
      new iHookParamValue(uint8ToHex(11), true)
    )
    const builtTx: Invoke = {
      TransactionType: 'Invoke',
      Account: bobWallet.classicAddress,
      Destination: aliceWallet.classicAddress,
      HookParameters: [
        otxn1Param1.toXrpl(),
        otxn1Param2.toXrpl(),
        otxn1Param3.toXrpl(),
      ],
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
      'numbers.c: Finished.'
    )
  })
})
