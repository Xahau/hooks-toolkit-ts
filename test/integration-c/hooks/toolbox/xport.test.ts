// xrpl
import {
  type Invoke,
  type TransactionMetadata,
  type Wallet,
  Wallet as XahauWallet,
} from 'xahau'
import { HookFlags } from 'xahau/dist/npm/models/common/xahau'
// src
import {
  // Testing
  type XrplIntegrationTestContext,
  setupClient,
  teardownClient,
  serverUrl,
  ICXAH,
  fund,
  // Export
  exportUnavailableReason,
  registerExportKeys,
  setupExporter,
  closeUntilExportFinal,
  returnExport,
  // Main
  Xrpld,
  createHookPayload,
  setHooks,
  ExecutionUtility,
} from '../../../../src'

// Opt-in with XAHAU_EXPORT=1 (which also enables the amendment in genesis.js):
// needs a node with the Export amendment enabled and a validator key
// ([validation_seed]), and fails with the reason when the node is not usable.
// Registering the node's export key takes a few ledgers, ~6 minutes on nodes
// without the standalone shortcut (see the README).
const describeExport = process.env.XAHAU_EXPORT ? describe : describe.skip

describeExport('xport', () => {
  let testContext: XrplIntegrationTestContext
  let exporter: Wallet
  let exportKey: string

  beforeAll(
    async () => {
      testContext = await setupClient(serverUrl)
      const reason = await exportUnavailableReason(testContext.client)
      if (reason) {
        throw new Error(
          `XAHAU_EXPORT is set but the node is not usable: ${reason}`
        )
      }
      const setup = await registerExportKeys(
        testContext.client,
        testContext.master
      )
      exportKey = setup.signers[0].export_key

      // a fresh account: the exporter state lives on the account
      exporter = XahauWallet.generate()
      await fund(
        testContext.client,
        testContext.master,
        new ICXAH(1000),
        exporter.classicAddress
      )
      await setupExporter(testContext.client, exporter)
      await setHooks({
        client: testContext.client,
        wallet: exporter,
        hooks: [
          {
            Hook: createHookPayload({
              version: 0,
              createFile: 'xport',
              namespace: 'xport',
              flags: HookFlags.hsfOverride,
              hookOnArray: ['Invoke'],
            }),
          },
        ],
      })
    },
    20 * 60 * 1000
  )
  afterAll(async () => {
    await teardownClient(testContext)
  })

  // Invoke -> xport() -> the validators sign -> ExportFinal
  async function invokeAndExport() {
    const result = await Xrpld.submit(testContext.client, {
      wallet: exporter,
      tx: {
        TransactionType: 'Invoke',
        Account: exporter.classicAddress,
      } as Invoke,
    })
    const hookExecutions = await ExecutionUtility.getHookExecutionsFromMeta(
      testContext.client,
      result.meta as TransactionMetadata
    )
    expect(hookExecutions.executions[0].HookReturnString).toEqual(
      'xport.c: export emitted.'
    )
    return closeUntilExportFinal(testContext.client)
  }

  async function returnedHook(
    exported: Record<string, unknown>,
    result: string
  ) {
    const imported = await returnExport(testContext.client, exported, {
      result,
    })
    expect(imported.meta.TransactionResult).toEqual('tesSUCCESS')
    const { executions } = await ExecutionUtility.getHookExecutionsFromMeta(
      testContext.client,
      imported.meta as TransactionMetadata
    )
    return executions[0]
  }

  it('sets up the exporter', async () => {
    const objects = await testContext.client.request({
      command: 'account_objects',
      account: exporter.classicAddress,
    })
    const ex = objects.result.account_objects.find(
      (o) => (o.LedgerEntryType as string) === 'Exporter'
    ) as unknown as {
      ExportSignerList: { SignerEntries: unknown[] }
      ExportTicketNext: number
    }
    expect(ex.ExportSignerList.SignerEntries.length).toBeGreaterThan(0)
    expect(ex.ExportTicketNext).toBeGreaterThan(0)
  }, 180000)

  it('exports a transaction signed by the node and gets it back: tesSUCCESS', async () => {
    const { exported } = await invokeAndExport()
    expect(exported.TransactionType).toEqual('Payment')
    expect(exported.Account).toEqual(exporter.classicAddress)
    expect(exported.Signers).toHaveLength(1)
    expect(exported.Signers[0].Signer.SigningPubKey).toEqual(exportKey)

    const hook = await returnedHook(exported, 'tesSUCCESS')
    expect(hook.HookAccount).toEqual(exporter.classicAddress)
    expect(hook.HookReturnString).toEqual('xport.c: export returned.')
    expect(Number.parseInt(hook.HookReturnCode, 16)).toEqual(0)
  }, 180000)

  it('gets it back with a tec result', async () => {
    const { exported } = await invokeAndExport()
    const hook = await returnedHook(exported, 'tecUNFUNDED_PAYMENT')
    expect(hook.HookReturnString).toEqual('xport.c: export returned.')
    // tecUNFUNDED_PAYMENT = 104
    expect(Number.parseInt(hook.HookReturnCode, 16)).toEqual(104)
  }, 180000)
})
