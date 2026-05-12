import {
  Invoke,
  LedgerEntryRequest,
  SetHookFlags,
  calculateHookOn,
} from 'xahau'
import { AccountID, UInt64 } from 'xahau-binary-codec/dist/types'
// src
import {
  serverUrl,
  XrplIntegrationTestContext,
  setupClient,
  teardownClient,
  Xrpld,
  SetHookParams,
  setHooksV3,
  hexNamespace,
  iHook,
  readHookBinaryHexFromNS,
  clearAllHooksV3,
  StateUtility,
  padHexString,
} from '../../../dist/npm/src'
import {
  HookDefinition as LeHookDefinition,
  Hook as LeHook,
} from 'xahau/dist/npm/models/ledger'
import { flipHex } from '@transia/binary-models'

// TEST WITH DELTA/DEFAULT PARAMS - HookHash
// The hook parameters on the hook definition are not always the hook parameters.
// They are the delta default variables.

describe('SetHook - End to End', () => {
  let testContext: XrplIntegrationTestContext

  beforeAll(async () => {
    testContext = await setupClient(serverUrl)
  })
  afterAll(async () => teardownClient(testContext))

  it('sethook - end to end', async () => {
    // SETHOOK IN
    const hook = {
      CreateCode: readHookBinaryHexFromNS('state_basic', 'wasm'),
      Flags: SetHookFlags.hsfOverride,
      HookOn: calculateHookOn(['Invoke']),
      HookNamespace: hexNamespace('state_basic'),
      HookApiVersion: 0,
    } as iHook
    await setHooksV3({
      client: testContext.client,
      wallet: testContext.hook1,
      hooks: [{ Hook: hook }],
    } as SetHookParams)

    // VALIDATION
    const hookReq: LedgerEntryRequest = {
      command: 'ledger_entry',
      hook: {
        account: testContext.hook1.classicAddress,
      },
    }
    const hookRes = await testContext.client.request(hookReq)
    const leHook = hookRes.result.node as LeHook
    expect(leHook.Hooks.length).toBe(1)
    expect(leHook.Hooks[0].Hook.HookHash).toEqual(
      '955705F019B60A9E5C31D7E5963D2E45D2589F8A287EFEA6E5101912FC000E92'
    )
    const hookDefRequest: LedgerEntryRequest = {
      command: 'ledger_entry',
      hook_definition: leHook.Hooks[0].Hook.HookHash,
    }
    const hookDefRes = await testContext.client.request(hookDefRequest)
    expect((hookDefRes.result.node as LeHookDefinition).HookNamespace).toEqual(
      '097692A0AA4759D14DDCDC0BBE7BA76B85248529B38F678E1D4E9E635D0FDB28'
    )

    // INVOKE IN
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

    // VALIDATION
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

    const clearHook = {
      Flags: SetHookFlags.hsfNSDelete,
      HookNamespace: hexNamespace('state_basic'),
    } as iHook
    await setHooksV3({
      client: testContext.client,
      wallet: testContext.hook1,
      hooks: [{ Hook: clearHook }],
    } as SetHookParams)

    await clearAllHooksV3({
      client: testContext.client,
      wallet: testContext.hook1,
    } as SetHookParams)
  })
})

describe('SetHook - (noop|create|install', () => {
  let testContext: XrplIntegrationTestContext

  beforeAll(async () => {
    testContext = await setupClient(serverUrl)
  })
  afterAll(async () => teardownClient(testContext))

  it('sethook - no operation', async () => {
    // SKIP
  })

  it('sethook - create', async () => {
    const hook = {
      CreateCode: readHookBinaryHexFromNS('hook_on_tt', 'wasm'),
      Flags: SetHookFlags.hsfOverride,
      HookOn: calculateHookOn(['Invoke']),
      HookNamespace: hexNamespace('hook_on_tt'),
      HookApiVersion: 0,
    } as iHook

    await setHooksV3({
      client: testContext.client,
      wallet: testContext.hook1,
      hooks: [{ Hook: hook }],
    } as SetHookParams)
    const hookReq: LedgerEntryRequest = {
      command: 'ledger_entry',
      hook: {
        account: testContext.hook1.classicAddress,
      },
    }
    const hookRes = await testContext.client.request(hookReq)
    const leHook = hookRes.result.node as LeHook
    expect(leHook.Hooks.length).toBe(1)
    expect(leHook.Hooks[0].Hook.HookHash).toEqual(
      '2500852196A87009FA4FDA3723728CE5853458ABD8C5BE4E5AB1BC93149523F5'
    )
    const hookDefRequest: LedgerEntryRequest = {
      command: 'ledger_entry',
      hook_definition: leHook.Hooks[0].Hook.HookHash,
    }
    const hookDefRes = await testContext.client.request(hookDefRequest)
    expect((hookDefRes.result.node as LeHookDefinition).HookNamespace).toEqual(
      '326178559E63837BA3B83BC05E5DC323A7B52C782AC4D5B3B182B2E050565581'
    )

    await clearAllHooksV3({
      client: testContext.client,
      wallet: testContext.hook1,
    } as SetHookParams)
  })

  it('sethook - install', async () => {
    const hook1 = {
      CreateCode: readHookBinaryHexFromNS('hook_on_tt', 'wasm'),
      Flags: SetHookFlags.hsfOverride,
      HookOn: calculateHookOn(['Invoke']),
      HookNamespace: hexNamespace('hook_on_tt'),
      HookApiVersion: 0,
    } as iHook

    await setHooksV3({
      client: testContext.client,
      wallet: testContext.hook1,
      hooks: [{ Hook: hook1 }],
    } as SetHookParams)

    const hook1Req: LedgerEntryRequest = {
      command: 'ledger_entry',
      hook: {
        account: testContext.hook1.classicAddress,
      },
    }
    const hook1Res = await testContext.client.request(hook1Req)
    const leHook1 = hook1Res.result.node as LeHook
    expect(leHook1.Hooks.length).toBe(1)
    expect(leHook1.Hooks[0].Hook.HookHash).toEqual(
      '2500852196A87009FA4FDA3723728CE5853458ABD8C5BE4E5AB1BC93149523F5'
    )

    const hook2 = {
      HookHash: leHook1.Hooks[0].Hook.HookHash,
      Flags: SetHookFlags.hsfOverride,
      HookOn: calculateHookOn(['Invoke']),
      HookNamespace: hexNamespace('hook_on_tt'),
    } as iHook

    await setHooksV3({
      client: testContext.client,
      wallet: testContext.hook2,
      hooks: [{ Hook: hook2 }],
    } as SetHookParams)

    const hookReq: LedgerEntryRequest = {
      command: 'ledger_entry',
      hook: {
        account: testContext.hook2.classicAddress,
      },
    }
    const hookRes = await testContext.client.request(hookReq)
    const leHook = hookRes.result.node as LeHook
    expect(leHook.Hooks.length).toBe(1)
    const hookDefRequest: LedgerEntryRequest = {
      command: 'ledger_entry',
      hook_definition: leHook.Hooks[0].Hook.HookHash,
    }
    const hookDefRes = await testContext.client.request(hookDefRequest)
    expect((hookDefRes.result.node as LeHookDefinition).HookNamespace).toBe(
      '326178559E63837BA3B83BC05E5DC323A7B52C782AC4D5B3B182B2E050565581'
    )

    await clearAllHooksV3({
      client: testContext.client,
      wallet: testContext.hook1,
    } as SetHookParams)
    await clearAllHooksV3({
      client: testContext.client,
      wallet: testContext.hook2,
    } as SetHookParams)
  })

  // TODO: Make sure that the namespace was changed: Do Params & Grant
  it('sethook - update: Namespace', async () => {
    const hook1 = {
      CreateCode: readHookBinaryHexFromNS('hook_on_tt', 'wasm'),
      Flags: SetHookFlags.hsfOverride,
      HookOn: calculateHookOn(['Invoke']),
      HookNamespace: hexNamespace('hook_on_tt'),
      HookApiVersion: 0,
    } as iHook

    await setHooksV3({
      client: testContext.client,
      wallet: testContext.hook1,
      hooks: [{ Hook: hook1 }],
    } as SetHookParams)

    const hook2 = {
      HookNamespace: hexNamespace('hook_on_tts'),
    } as iHook
    await setHooksV3({
      client: testContext.client,
      wallet: testContext.hook1,
      hooks: [{ Hook: hook2 }],
    } as SetHookParams)

    const hookReq1: LedgerEntryRequest = {
      command: 'ledger_entry',
      hook: {
        account: testContext.hook1.classicAddress,
      },
    }
    const hookRes1 = await testContext.client.request(hookReq1)
    const leHook1 = hookRes1.result.node as LeHook
    expect(leHook1.Hooks.length).toBe(1)
    const hookDefRequest1: LedgerEntryRequest = {
      command: 'ledger_entry',
      hook_definition: leHook1.Hooks[0].Hook.HookHash,
    }
    const hookDefRes1 = await testContext.client.request(hookDefRequest1)
    expect((hookDefRes1.result.node as LeHookDefinition).HookNamespace).toBe(
      '326178559E63837BA3B83BC05E5DC323A7B52C782AC4D5B3B182B2E050565581'
    )
  })

  it('sethook - delete', async () => {
    const hook1 = {
      CreateCode: readHookBinaryHexFromNS('hook_on_tt', 'wasm'),
      Flags: SetHookFlags.hsfOverride,
      HookOn: calculateHookOn(['Invoke']),
      HookNamespace: hexNamespace('hook_on_tt'),
      HookApiVersion: 0,
    } as iHook

    await setHooksV3({
      client: testContext.client,
      wallet: testContext.hook1,
      hooks: [{ Hook: hook1 }],
    } as SetHookParams)

    const hook = {
      CreateCode: '',
      Flags: SetHookFlags.hsfOverride,
    } as iHook
    await setHooksV3({
      client: testContext.client,
      wallet: testContext.hook1,
      hooks: [{ Hook: hook }],
    } as SetHookParams)
    try {
      const hookReq: LedgerEntryRequest = {
        command: 'ledger_entry',
        hook: {
          account: testContext.hook1.classicAddress,
        },
      }
      await testContext.client.request(hookReq)
      throw Error('invalidError')
    } catch (error: unknown) {
      if (error instanceof Error) {
        expect(error.message).toEqual('entryNotFound')
      }
    }
  })

  it('sethook - ns reset', async () => {
    // SETHOOK IN
    const hook = {
      CreateCode: readHookBinaryHexFromNS('state_basic', 'wasm'),
      Flags: SetHookFlags.hsfOverride,
      HookOn: calculateHookOn(['Invoke']),
      HookNamespace: hexNamespace('state_basic'),
      HookApiVersion: 0,
    } as iHook
    await setHooksV3({
      client: testContext.client,
      wallet: testContext.hook1,
      hooks: [{ Hook: hook }],
    } as SetHookParams)

    // INVOKE IN
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

    // VALIDATION
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

    const clearHook = {
      Flags: SetHookFlags.hsfNSDelete,
      HookNamespace: hexNamespace('state_basic'),
    } as iHook
    await setHooksV3({
      client: testContext.client,
      wallet: testContext.hook1,
      hooks: [{ Hook: clearHook }],
    } as SetHookParams)

    try {
      await StateUtility.getHookState(
        testContext.client,
        testContext.hook1.classicAddress,
        padHexString(hookAccHex),
        hexNamespace('state_basic')
      )
      throw Error('invalidError')
    } catch (error: unknown) {
      if (error instanceof Error) {
        expect(error.message).toEqual('entryNotFound')
      }
    }
  })
})
