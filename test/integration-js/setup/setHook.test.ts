import {
  // Invoke,
  LedgerEntryRequest,
  SetHookFlags,
  calculateHookOn,
} from 'xahau'
// import { AccountID, UInt64 } from 'xahau-binary-codec/dist/types'
// xrpl-helpers
import {
  serverUrl,
  XrplIntegrationTestContext,
  setupClient,
  teardownClient,
} from '../../../src/libs/xrpl-helpers'
// src
import {
  // Xrpld,
  SetHookParams,
  setHooksV3,
  hexNamespace,
  iHook,
  readHookBinaryHexFromNS,
  clearAllHooksV3,
  // StateUtility,
  // padHexString,
} from '../../../dist/npm/src'
import { flipHex } from '@transia/binary-models'
import {
  HookDefinition as LeHookDefinition,
  Hook as LeHook,
} from 'xahau/dist/npm/models/ledger'

// describe('SetHook - End to End', () => {
//   let testContext: XrplIntegrationTestContext

//   beforeAll(async () => {
//     testContext = await setupClient(serverUrl)
//   })
//   afterAll(async () => teardownClient(testContext))

//   it('sethook - end to end', async () => {
//     // SETHOOK IN
//     const hook = {
//       CreateCode: readHookBinaryHexFromNS('state_basic'),
//       Flags: SetHookFlags.hsfOverride,
//       HookOn: calculateHookOn(['Invoke']),
//       HookNamespace: hexNamespace('state_basic'),
//       HookApiVersion: 1,
//     } as iHook
//     await setHooksV3({
//       client: testContext.client,
//       seed: testContext.hook1.seed,
//       hooks: [{ Hook: hook }],
//     } as SetHookParams)

//     // VALIDATION
//     const hookReq: LedgerEntryRequest = {
//       command: 'ledger_entry',
//       hook: {
//         account: testContext.hook1.classicAddress,
//       },
//     }
//     const hookRes = await testContext.client.request(hookReq)
//     const leHook = hookRes.result.node as LeHook
//     expect(leHook.Hooks.length).toBe(1)
//     expect(leHook.Hooks[0].Hook.HookHash).toEqual(
//       'B1F39E63D27603F1A2E7E804E92514FAC721F353D849B0787288F5026809AD84'
//     )
//     const hookDefRequest: LedgerEntryRequest = {
//       command: 'ledger_entry',
//       hook_definition: leHook.Hooks[0].Hook.HookHash,
//     }
//     const hookDefRes = await testContext.client.request(hookDefRequest)
//     expect((hookDefRes.result.node as LeHookDefinition).HookNamespace).toEqual(
//       '097692A0AA4759D14DDCDC0BBE7BA76B85248529B38F678E1D4E9E635D0FDB28'
//     )

//     // INVOKE IN
//     const hookWallet = testContext.hook1
//     const hookAccHex = AccountID.from(hookWallet.classicAddress).toHex()
//     const builtTx: Invoke = {
//       TransactionType: 'Invoke',
//       Account: hookWallet.classicAddress,
//     }
//     await Xrpld.submit(testContext.client, {
//       wallet: hookWallet,
//       tx: builtTx,
//     })

//     // VALIDATION
//     const hookState = await StateUtility.getHookState(
//       testContext.client,
//       testContext.hook1.classicAddress,
//       padHexString(hookAccHex),
//       hexNamespace('state_basic')
//     )
//     const stateCount = Number(
//       UInt64.from(flipHex(hookState.HookStateData)).valueOf()
//     )
//     expect(stateCount).toBeGreaterThan(0)

//     const clearHook = {
//       Flags: SetHookFlags.hsfNSDelete,
//       HookNamespace: hexNamespace('state_basic'),
//     } as iHook
//     await setHooksV3({
//       client: testContext.client,
//       wallet: testContext.hook1,
//       hooks: [{ Hook: clearHook }],
//     } as SetHookParams)

//     await clearAllHooksV3({
//       client: testContext.client,
//       wallet: testContext.hook1,
//     } as SetHookParams)
//   })
// })

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
      CreateCode: readHookBinaryHexFromNS('base', 'bc'),
      Flags: SetHookFlags.hsfOverride,
      HookOn: calculateHookOn(['Invoke']),
      HookNamespace: hexNamespace('base'),
      HookApiVersion: 1,
      Fee: '1000000',
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
    // expect(leHook.Hooks[0].Hook.HookHash).toEqual(
    //   '79813E42C61BE62D1EA2668A00A7C4B7476D38A0A8CEE31267ABC22390157CF8'
    // )
    const hookDefRequest: LedgerEntryRequest = {
      command: 'ledger_entry',
      hook_definition: leHook.Hooks[0].Hook.HookHash,
    }
    const hookDefRes = await testContext.client.request(hookDefRequest)
    expect((hookDefRes.result.node as LeHookDefinition).HookNamespace).toEqual(
      'CAE662172FD450BB0CD710A769079C05BFC5D8E35EFA6576EDC7D0377AFDD4A2'
    )

    await clearAllHooksV3({
      client: testContext.client,
      wallet: testContext.hook1,
    } as SetHookParams)
  })

  // it('sethook - install', async () => {
  //   const hook1 = {
  //     CreateCode: readHookBinaryHexFromNS('hook_on_tt'),
  //     Flags: SetHookFlags.hsfOverride,
  //     HookOn: calculateHookOn(['Invoke']),
  //     HookNamespace: hexNamespace('hook_on_tt'),
  //     HookApiVersion: 0,
  //   } as iHook

  //   await setHooksV3({
  //     client: testContext.client,
  //     seed: testContext.hook1.seed,
  //     hooks: [{ Hook: hook1 }],
  //   } as SetHookParams)

  //   const hook1Req: LedgerEntryRequest = {
  //     command: 'ledger_entry',
  //     hook: {
  //       account: testContext.hook1.classicAddress,
  //     },
  //   }
  //   const hook1Res = await testContext.client.request(hook1Req)
  //   const leHook1 = hook1Res.result.node as LeHook
  //   expect(leHook1.Hooks.length).toBe(1)
  //   expect(leHook1.Hooks[0].Hook.HookHash).toEqual(
  //     '52FF3454ADFBCD9F3A4E24671676C561343DF94C1CC349087243B4192F9CC29E'
  //   )

  //   const hook2 = {
  //     HookHash: leHook1.Hooks[0].Hook.HookHash,
  //     Flags: SetHookFlags.hsfOverride,
  //     HookOn: calculateHookOn(['Invoke']),
  //     HookNamespace: hexNamespace('hook_on_tt'),
  //   } as iHook

  //   await setHooksV3({
  //     client: testContext.client,
  //     seed: testContext.hook2.seed,
  //     hooks: [{ Hook: hook2 }],
  //   } as SetHookParams)

  //   const hookReq: LedgerEntryRequest = {
  //     command: 'ledger_entry',
  //     hook: {
  //       account: testContext.hook2.classicAddress,
  //     },
  //   }
  //   const hookRes = await testContext.client.request(hookReq)
  //   const leHook = hookRes.result.node as LeHook
  //   expect(leHook.Hooks.length).toBe(1)
  //   const hookDefRequest: LedgerEntryRequest = {
  //     command: 'ledger_entry',
  //     hook_definition: leHook.Hooks[0].Hook.HookHash,
  //   }
  //   const hookDefRes = await testContext.client.request(hookDefRequest)
  //   expect((hookDefRes.result.node as LeHookDefinition).HookNamespace).toBe(
  //     '326178559E63837BA3B83BC05E5DC323A7B52C782AC4D5B3B182B2E050565581'
  //   )

  //   await clearAllHooksV3({
  //     client: testContext.client,
  //     wallet: testContext.hook1,
  //   } as SetHookParams)
  //   await clearAllHooksV3({
  //     client: testContext.client,
  //     wallet: testContext.hook2,
  //   } as SetHookParams)
  // })

  // // TODO: Make sure that the namespace was changed: Do Params & Grant
  // it('sethook - update: Namespace', async () => {
  //   const hook1 = {
  //     CreateCode: readHookBinaryHexFromNS('hook_on_tt'),
  //     Flags: SetHookFlags.hsfOverride,
  //     HookOn: calculateHookOn(['Invoke']),
  //     HookNamespace: hexNamespace('hook_on_tt'),
  //     HookApiVersion: 0,
  //   } as iHook

  //   await setHooksV3({
  //     client: testContext.client,
  //     seed: testContext.hook1.seed,
  //     hooks: [{ Hook: hook1 }],
  //   } as SetHookParams)

  //   const hook2 = {
  //     HookNamespace: hexNamespace('hook_on_tts'),
  //   } as iHook
  //   await setHooksV3({
  //     client: testContext.client,
  //     seed: testContext.hook1.seed,
  //     hooks: [{ Hook: hook2 }],
  //   } as SetHookParams)

  //   const hookReq1: LedgerEntryRequest = {
  //     command: 'ledger_entry',
  //     hook: {
  //       account: testContext.hook1.classicAddress,
  //     },
  //   }
  //   const hookRes1 = await testContext.client.request(hookReq1)
  //   const leHook1 = hookRes1.result.node as LeHook
  //   expect(leHook1.Hooks.length).toBe(1)
  //   const hookDefRequest1: LedgerEntryRequest = {
  //     command: 'ledger_entry',
  //     hook_definition: leHook1.Hooks[0].Hook.HookHash,
  //   }
  //   const hookDefRes1 = await testContext.client.request(hookDefRequest1)
  //   expect((hookDefRes1.result.node as LeHookDefinition).HookNamespace).toBe(
  //     '326178559E63837BA3B83BC05E5DC323A7B52C782AC4D5B3B182B2E050565581'
  //   )
  // })

  // it('sethook - delete', async () => {
  //   const hook1 = {
  //     CreateCode: readHookBinaryHexFromNS('hook_on_tt'),
  //     Flags: SetHookFlags.hsfOverride,
  //     HookOn: calculateHookOn(['Invoke']),
  //     HookNamespace: hexNamespace('hook_on_tt'),
  //     HookApiVersion: 0,
  //   } as iHook

  //   await setHooksV3({
  //     client: testContext.client,
  //     seed: testContext.hook1.seed,
  //     hooks: [{ Hook: hook1 }],
  //   } as SetHookParams)

  //   const hook = {
  //     CreateCode: '',
  //     Flags: SetHookFlags.hsfOverride,
  //   } as iHook
  //   await setHooksV3({
  //     client: testContext.client,
  //     seed: testContext.hook1.seed,
  //     hooks: [{ Hook: hook }],
  //   } as SetHookParams)
  //   try {
  //     const hookReq: LedgerEntryRequest = {
  //       command: 'ledger_entry',
  //       hook: {
  //         account: testContext.hook1.classicAddress,
  //       },
  //     }
  //     await testContext.client.request(hookReq)
  //     throw Error('invalidError')
  //   } catch (error: unknown) {
  //     if (error instanceof Error) {
  //       expect(error.message).toEqual('entryNotFound')
  //     }
  //   }
  // })

  // it('sethook - ns reset', async () => {
  //   // SETHOOK IN
  //   const hook = {
  //     CreateCode: readHookBinaryHexFromNS('state_basic'),
  //     Flags: SetHookFlags.hsfOverride,
  //     HookOn: calculateHookOn(['Invoke']),
  //     HookNamespace: hexNamespace('state_basic'),
  //     HookApiVersion: 0,
  //   } as iHook
  //   await setHooksV3({
  //     client: testContext.client,
  //     seed: testContext.hook1.seed,
  //     hooks: [{ Hook: hook }],
  //   } as SetHookParams)

  //   // INVOKE IN
  //   const hookWallet = testContext.hook1
  //   const hookAccHex = AccountID.from(hookWallet.classicAddress).toHex()
  //   const builtTx: Invoke = {
  //     TransactionType: 'Invoke',
  //     Account: hookWallet.classicAddress,
  //   }
  //   await Xrpld.submit(testContext.client, {
  //     wallet: hookWallet,
  //     tx: builtTx,
  //   })

  //   // VALIDATION
  //   const hookState = await StateUtility.getHookState(
  //     testContext.client,
  //     testContext.hook1.classicAddress,
  //     padHexString(hookAccHex),
  //     hexNamespace('state_basic')
  //   )
  //   const stateCount = Number(
  //     UInt64.from(flipHex(hookState.HookStateData)).valueOf()
  //   )
  //   expect(stateCount).toBeGreaterThan(0)

  //   const clearHook = {
  //     Flags: SetHookFlags.hsfNSDelete,
  //     HookNamespace: hexNamespace('state_basic'),
  //   } as iHook
  //   await setHooksV3({
  //     client: testContext.client,
  //     seed: testContext.hook1.seed,
  //     hooks: [{ Hook: clearHook }],
  //   } as SetHookParams)

  //   try {
  //     await StateUtility.getHookState(
  //       testContext.client,
  //       testContext.hook1.classicAddress,
  //       padHexString(hookAccHex),
  //       hexNamespace('state_basic')
  //     )
  //     throw Error('invalidError')
  //   } catch (error: unknown) {
  //     if (error instanceof Error) {
  //       expect(error.message).toEqual('entryNotFound')
  //     }
  //   }
  // })
})
