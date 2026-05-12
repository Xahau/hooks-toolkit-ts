// xrpl
import { Payment, SetHookFlags, TransactionMetadata, xahToDrops } from 'xahau'
import { IssuedCurrencyAmount } from 'xahau/dist/npm/models/common'
// src
import {
  // Testing
  XrplIntegrationTestContext,
  setupClient,
  teardownClient,
  serverUrl,
  trust,
  // Main
  Xrpld,
  SetHookParams,
  ExecutionUtility,
  createHookPayload,
  setHooksV3,
  clearAllHooksV3,
} from '../../../../dist/npm/src'

// FilterOnToken: ACCEPT: success
// FilterOnToken: ROLLBACK: failure

describe('filterOnToken', () => {
  let testContext: XrplIntegrationTestContext

  beforeAll(async () => {
    testContext = await setupClient(serverUrl)

    await trust(
      testContext.client,
      testContext.ic.set(100000),
      ...[testContext.hook1]
    )
    const hook = createHookPayload({
      version: 0,
      createFile: 'filter_on_token',
      namespace: 'filter_on_token',
      flags: SetHookFlags.hsfOverride,
      hookOnArray: ['Payment'],
    })
    await setHooksV3({
      client: testContext.client,
      wallet: testContext.hook1,
      hooks: [{ Hook: hook }],
    } as SetHookParams)
  })
  afterAll(async () => {
    await clearAllHooksV3({
      client: testContext.client,
      wallet: testContext.hook1,
    } as SetHookParams)
    await teardownClient(testContext)
  })

  it('filter on token - success', async () => {
    // PAYMENT IN
    const amount: IssuedCurrencyAmount = {
      value: '1',
      currency: 'USD',
      issuer: testContext.gw.classicAddress,
    }
    const hookWallet = testContext.hook1
    const bobWallet = testContext.bob
    const builtTx: Payment = {
      TransactionType: 'Payment',
      Account: bobWallet.classicAddress,
      Destination: hookWallet.classicAddress,
      Amount: amount,
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
      'filter_on_token: Finished.'
    )
  })

  it('filter on token - failure', async () => {
    try {
      // PAYMENT IN
      const hookWallet = testContext.hook1
      const bobWallet = testContext.bob
      const builtTx: Payment = {
        TransactionType: 'Payment',
        Account: bobWallet.classicAddress,
        Destination: hookWallet.classicAddress,
        Amount: xahToDrops(1),
      }
      await Xrpld.submit(testContext.client, {
        wallet: bobWallet,
        tx: builtTx,
      })
    } catch (error: unknown) {
      if (error instanceof Error) {
        expect(error.message).toEqual(
          'filter_on_token: Ignoring XAH Transaction'
        )
      }
    }
  })
})
