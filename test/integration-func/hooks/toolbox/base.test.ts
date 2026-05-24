// xrpl
import {
  convertStringToHex,
  Invoke,
  SetHookFlags,
  TransactionMetadata,
} from 'xahau'
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
  // clearAllHooksV3,
  iHookFunctionEntry,
  iHookFunctionName,
  iFunctionParamTypeEntry,
  iFunctionParamName,
  iFunctionParamType,
  iFunctionParamTypeEntries,
} from '../../../../dist/npm/src'

describe('base', () => {
  let testContext: XrplIntegrationTestContext

  beforeAll(async () => {
    testContext = await setupClient(serverUrl)
    const hook1Func1Param1 = new iFunctionParamTypeEntry(
      new iFunctionParamName('amount'),
      new iFunctionParamType('UINT8')
    )
    const hook1Func1Params = new iFunctionParamTypeEntries([hook1Func1Param1])
    const hook1Func1 = new iHookFunctionEntry(
      new iHookFunctionName('func_one'),
      hook1Func1Params
    )
    const hook1Func2 = new iHookFunctionEntry(new iHookFunctionName('func_two'))
    const hook = createHookPayload({
      version: 3,
      createFile: 'base',
      namespace: 'base',
      flags: SetHookFlags.hsfOverride,
      hookOnArray: ['Invoke'],
      functions: [hook1Func1.toXrpl(), hook1Func2.toXrpl()],
    })
    console.log(JSON.stringify(hook, null, 2))

    await setHooksV3({
      client: testContext.client,
      wallet: testContext.hook1,
      hooks: [{ Hook: hook }],
    } as SetHookParams)
  })
  afterAll(async () => {
    // await clearAllHooksV3({
    //   client: testContext.client,
    //   wallet: testContext.hook1,
    // } as SetHookParams)
    await teardownClient(testContext)
  })

  it('basic hook', async () => {
    // INVOKE IN
    const aliceWallet = testContext.alice
    const hookWallet = testContext.hook1

    const builtTx: Invoke = {
      TransactionType: 'Invoke',
      Account: aliceWallet.classicAddress,
      Destination: hookWallet.classicAddress,
      FunctionName: convertStringToHex('func_one'),
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
      'base: Finished.'
    )
  })
})
