// xrpl
import { Invoke } from 'xahau'
import { HookFlags } from 'xahau/dist/npm/models/common/xahau'
import { AccountID, UInt64 } from 'xahau-binary-codec/dist/types'
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
  padHexString,
  StateUtility,
  // Utils
  hexNamespace,
} from '../../../../src'
import { flipHex } from '@transia/binary-models'

// StateBasic: ACCEPT: success

describe('stateBasic', () => {
  let testContext: XrplIntegrationTestContext

  beforeAll(async () => {
    testContext = await setupClient(serverUrl)
    const hook = createHookPayload({
      version: 0,
      createFile: 'state_basic',
      namespace: 'state_basic',
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

  it('state basic - success', async () => {
    // INVOKE OUT
    const hookWallet = testContext.hook1
    const hookAccHex = AccountID.from(hookWallet.classicAddress).toHex()
    const builtTx: Invoke = {
      TransactionType: 'Invoke',
      Account: hookWallet.classicAddress,
    }
    await Xrpld.submit(testContext.client, {
      wallet: hookWallet,
      tx: builtTx,
    })

    const hookState = await StateUtility.getHookState(
      testContext.client,
      testContext.hook1.classicAddress,
      padHexString(hookAccHex),
      hexNamespace('state_basic')
    )
    const stateCount = Number(
      UInt64.from(flipHex(hookState.HookStateData)).valueOf()
    )
    expect(stateCount).toBeGreaterThan(0)
  })
})
