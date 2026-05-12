// xrpl
import { Invoke, SetHookFlags } from 'xahau'
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
  SetHookParams,
  createHookPayload,
  setHooksV3,
  clearAllHooksV3,
  padHexString,
  StateUtility,
  // Utils
  hexNamespace,
} from '../../../../dist/npm/src'
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
    await clearAllHooksV3({
      client: testContext.client,
      wallet: testContext.hook1,
    } as SetHookParams)
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
