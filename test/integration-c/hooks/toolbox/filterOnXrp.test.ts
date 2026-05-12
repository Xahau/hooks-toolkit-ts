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
  // Main
  Xrpld,
  SetHookParams,
  ExecutionUtility,
  createHookPayload,
  setHooksV3,
  clearAllHooksV3,
} from '../../../../dist/npm/src'

// FilterOnXrp: ACCEPT: success
// FilterOnXrp: ROLLBACK: failure

describe('filterOnXrp', () => {
  let testContext: XrplIntegrationTestContext

  beforeAll(async () => {
    testContext = await setupClient(serverUrl)
    const hook = createHookPayload({
      version: 0,
      createFile: 'filter_on_xrp',
      namespace: 'filter_on_xrp',
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

  it('filter on xrp - success', async () => {
    // PAYMENT IN
    const hookWallet = testContext.hook1
    const bobWallet = testContext.bob
    const builtTx: Payment = {
      TransactionType: 'Payment',
      Account: bobWallet.classicAddress,
      Destination: hookWallet.classicAddress,
      Amount: xahToDrops(1),
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
      'filter_on_xrp: Finished'
    )
  })

  it('filter on xrp - failure', async () => {
    try {
      // PAYMENT IN
      const amount: IssuedCurrencyAmount = {
        value: '10',
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
      await Xrpld.submit(testContext.client, {
        wallet: bobWallet,
        tx: builtTx,
      })
      throw Error('invalidError')
    } catch (error: unknown) {
      if (error instanceof Error) {
        expect(error.message).toEqual(
          '14: filter_on_xrp: Ignoring non XAH Transaction'
        )
      }
    }
  })
})
