// xrpl
import { Payment, TransactionMetadata, xahToDrops } from 'xahau'
import { HookFlags } from 'xahau/dist/npm/models/common/xahau'
// src
import {
  // Testing
  XrplIntegrationTestContext,
  setupClient,
  teardownClient,
  serverUrl,
  Xrpld,
  // Main
  ExecutionUtility,
  createHookPayload,
  setHooks,
  clearAllHooks,
  iHookParamEntry,
  iHookParamName,
  iHookParamValue,
} from '../../../../src'
import { floatToLEXfl } from '@transia/binary-models'

// HookOnTT: ACCEPT: success

describe('paramBasic', () => {
  let testContext: XrplIntegrationTestContext

  beforeAll(async () => {
    testContext = await setupClient(serverUrl)
    const hook = createHookPayload({
      version: 0,
      createFile: 'param_basic',
      namespace: 'param_basic',
      flags: HookFlags.hsfOverride,
      hookOnArray: ['Payment'],
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

  it('tx param basic - success', async () => {
    // PAYMENT IN
    const param1 = new iHookParamEntry(
      new iHookParamName('TEST'),
      new iHookParamValue(floatToLEXfl('10'), true)
    )
    const hookWallet = testContext.hook1
    const bobWallet = testContext.bob
    const builtTx: Payment = {
      TransactionType: 'Payment',
      Account: bobWallet.classicAddress,
      Destination: hookWallet.classicAddress,
      Amount: xahToDrops(10),
      HookParameters: [param1.toXrpl()],
    }
    const result = await Xrpld.submit(testContext.client, {
      wallet: bobWallet,
      tx: builtTx,
    })

    const hookExecutions = await ExecutionUtility.getHookExecutionsFromMeta(
      testContext.client,
      result.meta as TransactionMetadata
    )
    expect(hookExecutions.executions[0].HookReturnString).toEqual('')
  })
})
