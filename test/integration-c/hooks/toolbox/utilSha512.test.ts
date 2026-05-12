// xrpl
import { Payment, SetHookFlags, TransactionMetadata, xahToDrops } from 'xahau'
import { AccountID, Amount } from 'xahau-binary-codec/dist/types'
import { IssuedCurrencyAmount } from 'xahau/dist/npm/models/common'
// src
import {
  // Testing
  XrplIntegrationTestContext,
  setupClient,
  teardownClient,
  serverUrl,
  trust,
  pay,
  // Main
  Xrpld,
  SetHookParams,
  ExecutionUtility,
  createHookPayload,
  setHooksV3,
  clearAllHooksV3,
  iHookParamEntry,
  iHookParamName,
  iHookParamValue,
} from '../../../../dist/npm/src'

// UtilVerify: ROLLBACK: xrp hashes dont match
// UtilVerify: ACCEPT: xrp hashes match
// UtilVerify: ROLLBACK: hashes token dont match
// UtilVerify: ACCEPT: hashes token match

describe('utilSha512', () => {
  let testContext: XrplIntegrationTestContext

  beforeAll(async () => {
    testContext = await setupClient(serverUrl)

    await trust(
      testContext.client,
      testContext.ic.set(100000),
      ...[testContext.hook1]
    )

    await pay(
      testContext.client,
      testContext.ic.set(1000),
      testContext.gw,
      ...[testContext.hook1.classicAddress]
    )

    const hook = createHookPayload({
      version: 0,
      createFile: 'util_sha512',
      namespace: 'util_sha512',
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

  it('util sha512 - xrp hashes dont match', async () => {
    try {
      // PAYMENT OUT
      const bobAcct = AccountID.from(testContext.bob.classicAddress)
      const param1 = new iHookParamEntry(
        new iHookParamName('HDE'),
        new iHookParamValue(bobAcct.toHex(), true)
      )
      const param2 = new iHookParamEntry(
        new iHookParamName('HAM'),
        new iHookParamValue(Amount.from(xahToDrops(10)).toHex(), true)
      )
      const hookWallet = testContext.hook1
      const bobWallet = testContext.bob
      const builtTx: Payment = {
        TransactionType: 'Payment',
        Account: hookWallet.classicAddress,
        Destination: bobWallet.classicAddress,
        Amount: xahToDrops(11),
        HookParameters: [param1.toXrpl(), param2.toXrpl()],
      }
      await Xrpld.submit(testContext.client, {
        wallet: hookWallet,
        tx: builtTx,
      })
    } catch (error: any) {
      expect(error.message).toEqual('53: util_sha512: Hashes do not match')
    }
  })

  it('util sha512 - xrp hashes match', async () => {
    // PAYMENT OUT
    const bobAcct = AccountID.from(testContext.bob.classicAddress)
    const param1 = new iHookParamEntry(
      new iHookParamName('HDE'),
      new iHookParamValue(bobAcct.toHex(), true)
    )
    const param2 = new iHookParamEntry(
      new iHookParamName('HAM'),
      new iHookParamValue(Amount.from(xahToDrops(10)).toHex(), true)
    )
    const hookWallet = testContext.hook1
    const bobWallet = testContext.bob
    const builtTx: Payment = {
      TransactionType: 'Payment',
      Account: hookWallet.classicAddress,
      Destination: bobWallet.classicAddress,
      Amount: xahToDrops(10),
      HookParameters: [param1.toXrpl(), param2.toXrpl()],
    }
    const result = await Xrpld.submit(testContext.client, {
      wallet: hookWallet,
      tx: builtTx,
    })

    const hookExecutions = await ExecutionUtility.getHookExecutionsFromMeta(
      testContext.client,
      result.meta as TransactionMetadata
    )
    expect(hookExecutions.executions[0].HookReturnString).toEqual(
      'util_sha512: Hashes match'
    )
  })

  it('util sha512 - token hashes dont match', async () => {
    try {
      // PAYMENT OUT
      const bobAcct = AccountID.from(testContext.bob.classicAddress)
      const param1 = new iHookParamEntry(
        new iHookParamName('HDE'),
        new iHookParamValue(bobAcct.toHex(), true)
      )
      const param2 = new iHookParamEntry(
        new iHookParamName('HAM'),
        new iHookParamValue(
          Amount.from({
            value: '10',
            currency: 'USD',
            issuer: testContext.gw.classicAddress,
          }).toHex(),
          true
        )
      )
      const amount: IssuedCurrencyAmount = {
        value: '11',
        currency: 'USD',
        issuer: testContext.gw.classicAddress,
      }
      const hookWallet = testContext.hook1
      const bobWallet = testContext.bob
      const builtTx: Payment = {
        TransactionType: 'Payment',
        Account: hookWallet.classicAddress,
        Destination: bobWallet.classicAddress,
        Amount: amount,
        HookParameters: [param1.toXrpl(), param2.toXrpl()],
      }
      await Xrpld.submit(testContext.client, {
        wallet: hookWallet,
        tx: builtTx,
      })
    } catch (error: any) {
      expect(error.message).toEqual('53: util_sha512: Hashes do not match')
    }
  })

  it('util sha512 - token hashes match', async () => {
    // PAYMENT OUT
    const bobAcct = AccountID.from(testContext.bob.classicAddress)
    const param1 = new iHookParamEntry(
      new iHookParamName('HDE'),
      new iHookParamValue(bobAcct.toHex(), true)
    )

    const param2 = new iHookParamEntry(
      new iHookParamName('HAM'),
      new iHookParamValue(
        Amount.from({
          value: '10',
          currency: 'USD',
          issuer: testContext.gw.classicAddress,
        }).toHex(),
        true
      )
    )
    const amount: IssuedCurrencyAmount = {
      value: '10',
      currency: 'USD',
      issuer: testContext.gw.classicAddress,
    }
    const hookWallet = testContext.hook1
    const bobWallet = testContext.bob
    const builtTx: Payment = {
      TransactionType: 'Payment',
      Account: hookWallet.classicAddress,
      Destination: bobWallet.classicAddress,
      Amount: amount,
      HookParameters: [param1.toXrpl(), param2.toXrpl()],
    }
    const result = await Xrpld.submit(testContext.client, {
      wallet: hookWallet,
      tx: builtTx,
    })

    const hookExecutions = await ExecutionUtility.getHookExecutionsFromMeta(
      testContext.client,
      result.meta as TransactionMetadata
    )
    expect(hookExecutions.executions[0].HookReturnString).toEqual(
      'util_sha512: Hashes match'
    )
  })
})
