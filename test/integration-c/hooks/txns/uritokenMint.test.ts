// xrpl
import {
  Invoke,
  SetHookFlags,
  TransactionMetadata,
  convertStringToHex,
} from 'xahau'
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
  SetHookParams,
  ExecutionUtility,
  createHookPayload,
  setHooksV3,
  iHookParamEntry,
  iHookParamName,
  iHookParamValue,
} from '../../../../dist/npm/src'
import { uint32ToHex } from '@transia/binary-models'

describe('uriTokenMint', () => {
  let testContext: XrplIntegrationTestContext

  beforeAll(async () => {
    testContext = await setupClient(serverUrl)
    const hook = createHookPayload({
      version: 0,
      createFile: 'txn_uritoken_mint',
      namespace: 'txn_uritoken_mint',
      flags: SetHookFlags.hsfOverride,
      hookOnArray: ['Invoke'],
    })
    await setHooksV3({
      client: testContext.client,
      wallet: testContext.hook1,
      hooks: [{ Hook: hook }],
    } as SetHookParams)
  })
  afterAll(async () => {
    await teardownClient(testContext)
  })

  it('txn uritoken mint', async () => {
    const hookWallet = testContext.hook1

    // INVOKE IN
    const uriHex = convertStringToHex('ipfs://2')
    const tx1param1 = new iHookParamEntry(
      new iHookParamName('URI'),
      new iHookParamValue(uriHex, true)
    )
    const tx1param2 = new iHookParamEntry(
      new iHookParamName('URIL'),
      new iHookParamValue(uint32ToHex(uriHex.length / 2, true), true)
    )
    const builtTx1: Invoke = {
      TransactionType: 'Invoke',
      Account: hookWallet.classicAddress,
      HookParameters: [tx1param1.toXrpl(), tx1param2.toXrpl()],
    }
    console.log(JSON.stringify(builtTx1))

    const result1 = await Xrpld.submit(testContext.client, {
      wallet: hookWallet,
      tx: builtTx1,
    })
    console.log(result1)

    const hookExecutions = await ExecutionUtility.getHookExecutionsFromMeta(
      testContext.client,
      result1.meta as TransactionMetadata
    )
    expect(hookExecutions.executions[0].HookReturnString).toMatch(
      'txn_uritoken_mint.c: Tx emitted success.'
    )
    await close(testContext.client)
  })
})
