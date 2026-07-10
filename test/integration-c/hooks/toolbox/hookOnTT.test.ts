// xrpl
import { Invoke, Payment, xahToDrops } from 'xahau'
import { HookFlags } from 'xahau/dist/npm/models/common/xahau'

// src
import {
  // Testing
  XrplIntegrationTestContext,
  setupClient,
  teardownClient,
  serverUrl,
  // Main
  Xrpld,
  createHookPayload,
  setHooks,
  clearAllHooks,
} from '../../../../src'

// HookOnTT: ACCEPT: success
// HookOnTT: ROLLBACK: invalid

describe('hookOnTT', () => {
  let testContext: XrplIntegrationTestContext

  beforeAll(async () => {
    testContext = await setupClient(serverUrl)
  })
  afterAll(async () => {
    await clearAllHooks({
      client: testContext.client,
      wallet: testContext.hook1,
    })
    await teardownClient(testContext)
  })

  it('invoke on tt - success', async () => {
    const hook = createHookPayload({
      version: 0,
      createFile: 'hook_on_tt',
      namespace: 'hook_on_tt',
      flags: HookFlags.hsfOverride,
      hookOnArray: ['Invoke'],
    })
    await setHooks({
      client: testContext.client,
      wallet: testContext.hook1,
      hooks: [{ Hook: hook }],
    })

    // INVOKE IN
    const hookWallet = testContext.hook1
    const bobWallet = testContext.bob
    const builtTx: Invoke = {
      TransactionType: 'Invoke',
      Account: bobWallet.classicAddress,
      Destination: hookWallet.classicAddress,
    }
    await Xrpld.submit(testContext.client, {
      wallet: bobWallet,
      tx: builtTx,
    })
  })

  it('invoke on tt - invalid', async () => {
    const hook = createHookPayload({
      version: 0,
      createFile: 'hook_on_tt',
      namespace: 'hook_on_tt',
      flags: HookFlags.hsfOverride,
      hookOnArray: ['Invoke', 'Payment'],
    })
    await setHooks({
      client: testContext.client,
      wallet: testContext.hook1,
      hooks: [{ Hook: hook }],
    })
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
      throw Error('invalid')
    } catch (error: unknown) {
      if (error instanceof Error) {
        expect(error.message).toEqual(
          'f: hook_on_tt: HookOn field is incorrectly set.'
        )
      }
    }
  })
})
