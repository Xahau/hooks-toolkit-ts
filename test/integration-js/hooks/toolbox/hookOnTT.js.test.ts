// xrpl
import { Invoke, Payment, xahToDrops } from 'xahau'
import { HookFlags } from 'xahau/dist/npm/models/common/xahau'
// xrpl-helpers
import {
  XrplIntegrationTestContext,
  setupClient,
  teardownClient,
  serverUrl,
} from '../../../../src/libs/xrpl-helpers'
// src
import {
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
      version: 1,
      createFile: 'hookOnTT',
      namespace: 'hookOnTT',
      flags: HookFlags.hsfOverride,
      hookOnArray: ['Invoke'],
      fee: '1000000',
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
      version: 1,
      createFile: 'hookOnTT',
      namespace: 'hookOnTT',
      flags: HookFlags.hsfOverride,
      hookOnArray: ['Invoke', 'Payment'],
      fee: '1000000',
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
          '8000000000000025: hookOnTT.ts: HookOn field is incorrectly set.'
        )
      }
    }
  })
})
