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
  padHexString,
  StateUtility,
  iHookParamName,
  iHookParamValue,
  iHookParamEntry,
  // Utils
  hexNamespace,
} from '../../../../dist/npm/src'
import {
  BaseModel,
  Metadata,
  UInt8,
  UInt16,
  UInt32,
  UInt64,
  xrpAddressToHex,
  decodeModel,
} from '@transia/binary-models'

// StateNumbers: ACCEPT: success

class NumbersModel extends BaseModel {
  int8: UInt8
  int16: UInt16
  int32: UInt32
  int64: UInt64

  // 15 bytes
  constructor(
    int8: UInt8, // 1 bytes / 0
    int16: UInt16, // 2 byte / 1
    int32: UInt32, // 4 byte / 3
    int64: UInt64 // 8 byte / 7
  ) {
    super()
    this.int8 = int8
    this.int16 = int16
    this.int32 = int32
    this.int64 = int64
  }

  getMetadata(): Metadata {
    return [
      { field: 'int8', type: 'uint8' },
      { field: 'int16', type: 'uint16' },
      { field: 'int32', type: 'uint32' },
      { field: 'int64', type: 'uint64' },
    ]
  }
}

describe('stateNumbers', () => {
  let testContext: XrplIntegrationTestContext

  beforeAll(async () => {
    testContext = await setupClient(serverUrl)
    const hook = createHookPayload({
      version: 0,
      createFile: 'state_numbers',
      namespace: 'state_numbers',
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
    // await clearAllHooksV3({
    //   client: testContext.client,
    //   seed: testContext.hook1.seed,
    // } as SetHookParams)
    await teardownClient(testContext)
  })

  it('state numbers - success', async () => {
    // INVOKE OUT
    const hookWallet = testContext.hook1

    const model: NumbersModel = new NumbersModel(0, 0, 0, BigInt(0))
    const param1 = new iHookParamEntry(
      new iHookParamName('M'),
      new iHookParamValue(model.encode(), true)
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
    await Xrpld.submit(testContext.client, {
      wallet: hookWallet,
      tx: builtTx,
    })

    const hookState = await StateUtility.getHookState(
      testContext.client,
      testContext.hook1.classicAddress,
      padHexString(xrpAddressToHex(hookWallet.classicAddress)),
      hexNamespace('state_numbers')
    )
    const _model = decodeModel(hookState.HookStateData, NumbersModel)
    expect(_model.int8).toBe(1)
    expect(_model.int16).toBe(1)
    expect(_model.int32).toBe(1)
    expect(_model.int64).toBe(BigInt(1))
  })
})
