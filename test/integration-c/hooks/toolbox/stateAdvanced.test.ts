// xrpl
import { Invoke, SetHookFlags } from 'xahau'
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
  iHookParamEntry,
  iHookParamName,
  iHookParamValue,
  padHexString,
  StateUtility,
  // Utils
  hexNamespace,
} from '../../../../dist/npm/src'
import {
  BaseModel,
  decodeModel,
  Metadata,
  UInt64,
  VarString,
  xrpAddressToHex,
} from '@transia/binary-models'

// StateAdvanced: ACCEPT: success

export class TestModel extends BaseModel {
  updatedTime: UInt64
  updatedBy: VarString
  message: VarString

  constructor(updatedTime: UInt64, updatedBy: VarString, message: VarString) {
    super()
    this.updatedTime = updatedTime
    this.updatedBy = updatedBy
    this.message = message
  }

  getMetadata(): Metadata {
    return [
      { field: 'updatedTime', type: 'uint64' },
      { field: 'updatedBy', type: 'varString', maxStringLength: 31 },
      { field: 'message', type: 'varString', maxStringLength: 31 },
    ]
  }

  toJSON() {
    return {
      updatedTime: this.updatedTime,
      updatedBy: this.updatedBy,
      message: this.message,
    }
  }
}

describe('StateAdvanced', () => {
  let testContext: XrplIntegrationTestContext

  beforeAll(async () => {
    testContext = await setupClient(serverUrl)
    const hook = createHookPayload({
      version: 0,
      createFile: 'state_advanced',
      namespace: 'state_advanced',
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

  it('state advanced - success', async () => {
    // INVOKE OUT
    const hookWallet = testContext.hook1
    const testModel = new TestModel(BigInt(1685216402734), 'userId', 'hello')

    const param1 = new iHookParamEntry(
      new iHookParamName('TEST'),
      new iHookParamValue(testModel.encode(), true)
    )
    const builtTx: Invoke = {
      TransactionType: 'Invoke',
      Account: hookWallet.classicAddress,
      HookParameters: [param1.toXrpl()],
    }

    await Xrpld.submit(testContext.client, {
      wallet: hookWallet,
      tx: builtTx,
    })

    const hookState = await StateUtility.getHookState(
      testContext.client,
      testContext.hook1.classicAddress,
      padHexString(xrpAddressToHex(hookWallet.classicAddress)),
      hexNamespace('state_advanced')
    )

    const model = decodeModel(hookState.HookStateData, TestModel)
    expect(model.message).toBe('hello')
    expect(model.updatedBy).toBe('userId')
    expect(model.updatedTime).toBe(1685216402734n)
  })
})
