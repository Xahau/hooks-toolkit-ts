// xrpl
import {
  Invoke,
  TrustSet,
  AccountSet,
  SetHookFlags,
  AccountSetAsfFlags,
  TransactionMetadata,
} from 'xahau'
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
} from '../../../../dist/npm/src'
import { IssuedCurrencyAmount } from 'xahau/dist/npm/models/common'

describe('tsh', () => {
  let testContext: XrplIntegrationTestContext

  beforeAll(async () => {
    testContext = await setupClient(serverUrl)
  })
  afterAll(async () => {
    await teardownClient(testContext)
  })

  it('tsh weak', async () => {
    const asTx: AccountSet = {
      TransactionType: 'AccountSet',
      Account: testContext.gw.classicAddress,
      SetFlag: AccountSetAsfFlags.asfTshCollect,
    }
    await Xrpld.submit(testContext.client, {
      wallet: testContext.gw,
      tx: asTx,
    })

    const hook = createHookPayload({
      version: 0,
      createFile: 'tsh',
      namespace: 'tsh',
      flags: SetHookFlags.hsfCollect + SetHookFlags.hsfOverride,
      hookOnArray: ['TrustSet'],
    })
    await setHooksV3({
      client: testContext.client,
      wallet: testContext.gw,
      hooks: [{ Hook: hook }],
    } as SetHookParams)

    const aliceWallet = testContext.alice
    // TRUST SET IN
    const amount: IssuedCurrencyAmount = {
      value: String(1000),
      currency: testContext.ic.currency as string,
      issuer: testContext.ic.issuer as string,
    }
    const builtTx: TrustSet = {
      TransactionType: 'TrustSet',
      Account: aliceWallet.classicAddress,
      LimitAmount: amount,
    }
    const result = await Xrpld.submit(testContext.client, {
      wallet: aliceWallet,
      tx: builtTx,
    })

    const meta = result.meta as TransactionMetadata
    const executions = meta.HookExecutions as any[]
    expect(executions[0].HookExecution.HookReturnString).toMatch('000001')

    await clearAllHooksV3({
      client: testContext.client,
      wallet: testContext.gw,
    } as SetHookParams)

    await clearAllHooksV3({
      client: testContext.client,
      wallet: testContext.alice,
    } as SetHookParams)
  })

  it('tsh strong', async () => {
    const hook = createHookPayload({
      version: 0,
      createFile: 'tsh',
      namespace: 'tsh',
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

    const meta = result.meta as TransactionMetadata
    const executions = meta.HookExecutions as any[]
    expect(executions[0].HookExecution.HookReturnString).toMatch('000000')

    await clearAllHooksV3({
      client: testContext.client,
      wallet: testContext.gw,
    } as SetHookParams)

    await clearAllHooksV3({
      client: testContext.client,
      wallet: testContext.alice,
    } as SetHookParams)
  })
  it('tsh aaw', async () => {
    const hook = createHookPayload({
      version: 0,
      createFile: 'tsh',
      namespace: 'tsh',
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
    const otxn1Param1 = new iHookParamEntry(
      new iHookParamName('AAW'),
      new iHookParamValue('01', true)
    )
    const builtTx: Invoke = {
      TransactionType: 'Invoke',
      Account: aliceWallet.classicAddress,
      Destination: hookWallet.classicAddress,
      HookParameters: [otxn1Param1.toXrpl()],
    }
    const result = await Xrpld.submit(testContext.client, {
      wallet: aliceWallet,
      tx: builtTx,
    })

    const meta = result.meta as TransactionMetadata
    const executions = meta.HookExecutions as any[]
    expect(executions[0].HookExecution.HookReturnString).toMatch('000000')
    expect(executions[1].HookExecution.HookReturnString).toMatch('000002')

    await clearAllHooksV3({
      client: testContext.client,
      wallet: testContext.gw,
    } as SetHookParams)

    await clearAllHooksV3({
      client: testContext.client,
      wallet: testContext.alice,
    } as SetHookParams)
  })
})
