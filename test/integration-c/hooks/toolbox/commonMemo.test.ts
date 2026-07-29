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

describe('commonMemo', () => {
  let testContext: XrplIntegrationTestContext

  beforeAll(async () => {
    testContext = await setupClient(serverUrl)
    const hook = createHookPayload({
      version: 0,
      createFile: 'common_memo',
      namespace: 'common_memo',
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

  it('common memo hook', async () => {
    // INVOKE IN
    const aliceWallet = testContext.alice
    const hookWallet = testContext.hook1
    const Memos = [
      {
        Memo: {
          MemoData: '746573746D656D6F',
          MemoFormat: '756E7369676E65642F7369676E6174757265',
        },
      },
    ]
    const builtTx: Invoke = {
      TransactionType: 'Invoke',
      Account: aliceWallet.classicAddress,
      Destination: hookWallet.classicAddress,
      Memos: Memos,
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
      'common_memo: Finished.'
    )
  })
})
