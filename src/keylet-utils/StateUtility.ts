import type { Client, LedgerEntryRequest } from 'xahau'
import type {
  Hook as LeHook,
  HookDefinition as LeHookDefinition,
  HookState as LeHookState,
} from 'xahau/dist/npm/models/ledger'
import type {
  AccountNamespaceRequest,
  AccountNamespaceResponse,
} from 'xahau/dist/npm/models/methods/accountNamespace'

export class StateUtility {
  static async getHook(client: Client, account: string): Promise<LeHook> {
    if (!client.isConnected()) {
      throw new Error('xrpl Client is not connected')
    }
    const hookReq: LedgerEntryRequest = {
      command: 'ledger_entry',
      hook: {
        account: account,
      },
    }
    const hookRes = await client.request(hookReq)
    return hookRes.result.node as LeHook
  }

  static async getHookDefinition(
    client: Client,
    hash: string
  ): Promise<LeHookDefinition> {
    if (!client.isConnected()) {
      throw new Error('xrpl Client is not connected')
    }
    const hookDefRequest: LedgerEntryRequest = {
      command: 'ledger_entry',
      hook_definition: hash,
    }
    const hookDefRes = await client.request(hookDefRequest)
    return hookDefRes.result.node as LeHookDefinition
  }

  static async getHookStateDir(
    client: Client,
    account: string,
    namespace: string,
    limit = 200
  ): Promise<LeHookState[]> {
    if (!client.isConnected()) {
      throw new Error('xrpl Client is not connected')
    }
    const request: AccountNamespaceRequest = {
      command: 'account_namespace',
      account: account,
      namespace_id: namespace,
      limit: limit,
    }
    const response = (await client.request(request)) as AccountNamespaceResponse
    return response.result.namespace_entries as LeHookState[]
  }
  static async getHookState(
    client: Client,
    account: string,
    key: string,
    namespace: string
  ): Promise<LeHookState> {
    if (!client.isConnected()) {
      throw new Error('xrpl Client is not connected')
    }
    const hookStateReq: LedgerEntryRequest = {
      command: 'ledger_entry',
      hook_state: {
        account: account,
        key: key,
        namespace_id: namespace,
      },
    }
    const hookStateResp = await client.request(hookStateReq)
    const hookStateLe = hookStateResp.result.node as LeHookState
    return hookStateLe
  }
}
