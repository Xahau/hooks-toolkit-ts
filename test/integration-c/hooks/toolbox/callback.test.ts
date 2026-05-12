// xrpl
import {
  AccountSetAsfFlags,
  Invoke,
  LedgerRequest,
  SetHookFlags,
  Transaction,
  TransactionMetadata,
} from 'xahau'
// src
import {
  // Testing
  XrplIntegrationTestContext,
  setupClient,
  teardownClient,
  serverUrl,
  close,
  accountSet,
  accountClear,
  // Main
  Xrpld,
  SetHookParams,
  createHookPayload,
  setHooksV3,
  clearAllHooksV3,
  ExecutionUtility,
} from '../../../../dist/npm/src'
import { LedgerResponseExpanded } from 'xahau/src/models/methods/ledger'

describe('callback', () => {
  let testContext: XrplIntegrationTestContext

  beforeAll(async () => {
    testContext = await setupClient(serverUrl)
  })
  afterAll(async () => {
    await teardownClient(testContext)
  })

  it('callback success', async () => {
    const hook = createHookPayload({
      version: 0,
      createFile: 'callback',
      namespace: 'callback',
      flags: SetHookFlags.hsfCollect + SetHookFlags.hsfOverride,
      hookOnArray: ['Invoke'],
    })
    await setHooksV3({
      client: testContext.client,
      wallet: testContext.hook1,
      hooks: [{ Hook: hook }],
    } as SetHookParams)

    const aliceWallet = testContext.alice
    const hookWallet = testContext.hook1
    // INVOKE IN
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
    expect(hookExecutions.executions[0].HookReturnString).toEqual(
      'callback.c: Tx emitted success.'
    )

    await close(testContext.client)

    await clearAllHooksV3({
      client: testContext.client,
      wallet: testContext.gw,
    } as SetHookParams)

    await clearAllHooksV3({
      client: testContext.client,
      wallet: testContext.alice,
    } as SetHookParams)
  })
  it('callback failure', async () => {
    const hook = createHookPayload({
      version: 0,
      createFile: 'callback',
      namespace: 'callback',
      flags: SetHookFlags.hsfCollect + SetHookFlags.hsfOverride,
      hookOnArray: ['Invoke'],
    })
    await setHooksV3({
      client: testContext.client,
      wallet: testContext.hook1,
      hooks: [{ Hook: hook }],
    } as SetHookParams)

    await accountSet(
      testContext.client,
      testContext.bob,
      AccountSetAsfFlags.asfRequireDest
    )

    const aliceWallet = testContext.alice
    const hookWallet = testContext.hook1
    // INVOKE IN
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
    expect(hookExecutions.executions[0].HookReturnString).toEqual(
      'callback.c: Tx emitted success.'
    )

    await close(testContext.client)

    const response = (await testContext.client.request({
      command: 'ledger',
      ledger_index: await testContext.client.getLedgerIndex(),
      expand: true,
      transactions: true,
    } as unknown as LedgerRequest)) as LedgerResponseExpanded
    const txns = response.result.ledger.transactions as Transaction[]
    // @ts-expect-error -- has value
    expect((txns[0].metaData as TransactionMetadata).TransactionResult).toEqual(
      'tecDST_TAG_NEEDED'
    )

    await clearAllHooksV3({
      client: testContext.client,
      wallet: testContext.gw,
    } as SetHookParams)

    await clearAllHooksV3({
      client: testContext.client,
      wallet: testContext.alice,
    } as SetHookParams)

    await accountClear(
      testContext.client,
      testContext.bob,
      AccountSetAsfFlags.asfRequireDest
    )
  })
})
