// xrpl
import { Invoke, TransactionMetadata, convertStringToHex } from 'xahau'
import { HookFlags } from 'xahau/dist/npm/models/common/xahau'
import {
  // Testing
  XrplIntegrationTestContext,
  setupClient,
  teardownClient,
  serverUrl,
  close,
  // Main
  Xrpld,
  SetHookParams,
  ExecutionUtility,
  createHookPayload,
  setHooks,
  // clearAllHooks,
  iHookParamEntry,
  iHookParamName,
  iHookParamValue,
} from '../../../../src'
import { uint64ToHex } from '@transia/binary-models'

describe('accountSet', () => {
  let testContext: XrplIntegrationTestContext

  beforeAll(async () => {
    testContext = await setupClient(serverUrl)
    const hook = createHookPayload({
      version: 0,
      createFile: 'txn_account_set',
      namespace: 'txn_account_set',
      flags: HookFlags.hsfOverride,
      hookOnArray: ['Invoke'],
    })
    await setHooks({
      client: testContext.client,
      wallet: testContext.hook1,
      hooks: [{ Hook: hook }],
    } as SetHookParams)
  })
  afterAll(async () => {
    // await clearAllHooks({
    //   client: testContext.client,
    //   wallet: testContext.alice,
    // } as SetHookParams)
    await teardownClient(testContext)
  })

  it('txn trust hook', async () => {
    const aliceWallet = testContext.alice
    const hookWallet = testContext.hook1

    const domain = 'https://example.com/test?name=blob'
    const hexDomain = convertStringToHex(domain)
    const domainLenBytes = hexDomain.length / 2

    const tx1param1 = new iHookParamEntry(
      new iHookParamName('DL'),
      new iHookParamValue(uint64ToHex(BigInt(domainLenBytes)), true)
    )
    const tx1param2 = new iHookParamEntry(
      new iHookParamName('D'),
      new iHookParamValue(hexDomain, true)
    )
    // INVOKE IN
    const builtTx: Invoke = {
      TransactionType: 'Invoke',
      Account: aliceWallet.classicAddress,
      Destination: hookWallet.classicAddress,
      HookParameters: [tx1param1.toXrpl(), tx1param2.toXrpl()],
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
      'txn_account_set.c: Tx emitted success.'
    )
    await close(testContext.client)
  })
})
