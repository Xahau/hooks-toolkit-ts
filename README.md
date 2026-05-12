# The Hooks Toolkit (Typescript)

The Hooks-Toolkit is a powerful library that allows developers to interact with smart contracts on the Xahau.

## Table of Contents

- [Installation](#installation)
- [Set Hook](#set-hook)
- [Hook Payload](#hook-payload)
- [State Utility](#state-utility)
- [Execution Utility](#execution-utility)
- [Submit Tx](#submit-tx)

## Installation

To use the binary-models repo, you can install the package via npm or yarn:

```bash
yarn add @transia/hooks-toolkit
```

## Set Hook

The `setHooksV3` function in the SDK is used to set hooks on Xahau. It takes in a `SetHookParams` object as a parameter, which includes the client, seed, and hooks to be set.

### Setting Hooks with setHooksV3

To set a hook on Xahau using the `setHooksV3` function, you need to provide the following parameters:

- `client`: Xahau client object.
- `seed`: The seed of the account that will set the hook.
- `hooks`: An array of hook objects to be set.

Each hook object in the `hooks` array should have the following properties:

- `Hook`: The hook payload object.

Here is an example of setting a hook using the `setHooksV3` function:

```ts
import {
  SetHookFlags
} from 'xahau'
import {
  setHooksV3,
  createHookPayload,
  SetHookParams
} from '@transia/hooks-toolkit'

const hook = createHookPayload({
  version: 0, // HookApiVersion
  createFile: 'hook_on_tt', // filename in /build
  namespace: 'hook_on_tt', // namespace (ascii)
  flags: SetHookFlags.hsfOverride, // SetHookFlag
  hookOnArray: ['Invoke'] // HookOn Transactions
})

await setHooksV3({
  client: testContext.client,
  wallet: testContext.hook1,
  hooks: [{ Hook: hook }],
} as SetHookParams)
```

In the example above, we create a hook payload using the `createHookPayload` function and set the `hook_on` field to trigger on the `Invoke` transaction type. We then pass the hook payload as an object in the `hooks` array to the `setHooksV3` function.

Note that the `setHooksV3` function is an asynchronous function and returns a Promise. You can use `await` to wait for the function to complete.

### Deleting Hooks with clearAllHooksV3

To delete all hooks on Xahau using the `clearAllHooksV3` function, you need to provide the following parameters:

- `client`: Xahau client object.
- `seed`: The seed of the account that will remove the hook.

Here is an example of deleting all hooks using the `clearAllHooksV3` function:

```ts
import {
  clearAllHooksV3,
} from '@transia/hooks-toolkit'

await clearAllHooksV3({
  client: testContext.client,
  seed: testContext.hook1.seed,
} as SetHookParams)
```

### Deleting a single hook with setHooksV3

To delete a single hook and state on Xahau using the `setHooksV3` function, you need to provide the following parameters:

- `client`: Xahau client object.
- `seed`: The seed of the account that will delete the hook.
- `hooks`: An array of hook objects to be deleted.

Here is an example of deleting a single hook for the hook in position 2 using the `setHooksV3` function:

```ts
import {
  SetHookFlags
} from 'xahau'
import {
  SetHookParams,
  createHookPayload,
  setHooksV3,
} from '@transia/hooks-toolkit'

const clearHook = createHookPayload({
  namespace: 'mynamespace', // namespace (ascii)
  flags: SetHookFlags.hsfOverride | SetHookFlags.hsfNSDelete, // SetHookFlag
})
await setHooksV3({
  client: testContext.client,
  wallet: testContext.hook1,
  hooks: [{Hook: {}}, { Hook: clearHook }],
} as SetHookParams)
```

export const metadata = {
  title: 'Hook Payload',
  description:
    'In this guide, we will talk about what happens when something goes wrong while you work with the API.',
}

## Hook Payload

The `createHookPayload` function in the SDK is used to create a payload for a SetHook transaction in Xahau. It takes in several parameters to customize the hook payload.

### Hook API Version

The `version` parameter is used to set the Hook API version. It is an optional parameter and can be set to a number. Here is an example of creating a hook payload with the Hook API version set to `0`:

```ts
import {
  createHookPayload
} from '@transia/hooks-toolkit'

const hook = createHookPayload({
  version: 0, // HookApiVersion
  createFile: 'hook_on_tt', // filename in /build
  namespace: 'hook_on_tt', // namespace (ascii)
  flags: SetHookFlags.hsfOverride, // SetHookFlag
  hookOnArray: ['Payment'] // HookOn Transactions
})
```

### Create Code

The `createFile` parameter is used to set the create code for the hook. It is an optional parameter and can be set to a string. Here is an example of creating a hook payload with the create code set to `'hook_on_tt'`:

```ts
import {
  createHookPayload
} from '@transia/hooks-toolkit'

const hook = createHookPayload({
  version: 0, // HookApiVersion
  createFile: 'hook_on_tt', // filename in /build
  namespace: 'hook_on_tt', // namespace (ascii)
  flags: SetHookFlags.hsfOverride, // SetHookFlag
  hookOnArray: ['Payment'] // HookOn Transactions
})
```

### Hook Namespace

The `namespace` parameter is used to set the hook namespace. It is an optional parameter and can be set to a string. Here is an example of creating a hook payload with the hook namespace set to `'hook_on_tt'`:

```ts
import {
  createHookPayload
} from '@transia/hooks-toolkit'

const hook = createHookPayload({
  version: 2, // HookApiVersion
  createFile: 'hook_on_tt', // filename in /build
  namespace: 'hook_on_tt', // namespace (ascii)
  flags: SetHookFlags.hsfOverride, // SetHookFlag
  hookOnArray: ['Payment'] // HookOn Transactions
})
```

### Hook Flags

The `flags` parameter is used to set the hook flags. It is an optional parameter and can be set to a number. Here is an example of creating a hook payload with the hook flags set to `SetHookFlags.hsfOverride`:

```ts
import {
  createHookPayload,
  SetHookFlags
} from '@transia/hooks-toolkit'

const hook = createHookPayload({
  version: 0, // HookApiVersion
  createFile: 'hook_on_tt', // filename in /build
  namespace: 'hook_on_tt', // namespace (ascii)
  flags: SetHookFlags.hsfOverride, // SetHookFlag
  hookOnArray: ['Payment'] // HookOn Transactions
})
```

### Hook On Transaction Types

The `hookOnArray` parameter is used to specify which transaction types a hook should be triggered on. It is an optional parameter and should be passed as an array of strings. Here is an example of creating a hook payload with the `hookOnArray` set to trigger on the `Payment` transaction type:

```ts
import {
  createHookPayload
} from '@transia/hooks-toolkit'

const hook = createHookPayload({
  version: 2, // HookApiVersion
  createFile: 'hook_on_tt', // filename in /build
  namespace: 'hook_on_tt', // namespace (ascii)
  flags: SetHookFlags.hsfOverride, // SetHookFlag
  hookOnArray: ['Payment'] // HookOn Transactions
})
```

To create a hook that triggers on multiple transaction types, the `hookOnArray` should be set to an array of those types, such as `['Payment', 'EscrowFinish']`.

### Hook Parameters

The `hookParams` parameter is used to set the hook parameters. It is an optional parameter and should be passed as an array of `HookParameter` objects. Each `HookParameter` object consists of a `HookParamName` and a `HookParamValue`. Here is an example of creating a hook payload with a hook parameter:

```ts
import {
  createHookPayload,
  iHookParamEntry,
  iHookParamName,
  iHookParamValue,
} from '@transia/hooks-toolkit'
import { floatToLEXfl } from '@transia/binary-models'

const param1 = new iHookParamEntry(
  new iHookParamName('TEST'),
  new iHookParamValue(floatToLEXfl('10'), true)
)

const hook = createHookPayload({
  version: 0, // HookApiVersion
  createFile: 'hook_on_tt', // filename in /build
  namespace: 'hook_on_tt', // namespace (ascii)
  flags: SetHookFlags.hsfOverride, // SetHookFlag
  hookOnArray: ['Payment'] // HookOn Transactions
  hookParams: [param1.toXrpl()], // HookParameters
})
```

### Hook Grants

The `hookGrants` parameter is used to set the hook grants. It is an optional parameter and should be passed as an array of `HookGrant` objects. Each `HookGrant` object consists of a `HookGrantHash` and a `HookGrantAuthorize`. Here is an example of creating a hook payload with a hook grant:

```ts
import {
  createHookPayload,
  iHookGrantEntry,
  iHookGrantHash,
  iHookGrantAuthorize
} from '@transia/hooks-toolkit'

const hook2Grant1 = new iHookGrantEntry(
  new iHookGrantHash(hookHash as string),
  new iHookGrantAuthorize(carolWallet.classicAddress)
)

const hook = createHookPayload({
  version: 0, // HookApiVersion
  createFile: 'hook_on_tt', // filename in /build
  namespace: 'hook_on_tt', // namespace (ascii)
  flags: SetHookFlags.hsfOverride, // SetHookFlag
  hookOnArray: ['Payment'] // HookOn Transactions
  hookGrants: [hook2Grant1.toXrpl()], // HookGrants
})
```

### Reference

```ts
export interface SetHookPayload {
  version?: number | null
  hookHash?: string | null
  createFile?: string | null
  namespace?: string | null
  flags?: number | 0
  hookOnArray?: string[] | null
  hookParams?: HookParameter[] | null
  hookGrants?: HookGrant[] | null
}
export function createHookPayload(payload: SetHookPayload): iHook
```

### Parameters

- `version` (optional): The Hook API version. Defaults to `0`.
- `createFile` (optional): The create code for the hook.
- `namespace` (optional): The hook namespace.
- `flags` (optional): The hook flags.
- `hookOnArray` (optional): An array of transaction types that the hook should be triggered on.
- `hookParams` (optional): An array of hook parameters.
- `hookGrants` (optional): An array of hook grants.

### Return Value

- Returns a `HookPayload` object that represents the hook payload for a SetHook transaction in Xahau.

## State Utility

The `StateUtility` class in the SDK provides utility functions for working with hook states in Xahau. It includes functions to retrieve hook states, hook definitions, and hook state directories.

### Retrieving Hook State

The `getHookState` function is used to retrieve the state of a hook in Xahau. It takes in the following parameters:

- `client`: Xahau client object.
- `account`: The account that owns the hook.
- `key`: The key of the hook state.
- `namespace`: The namespace of the hook state.

Here is an example of retrieving the state of a hook:

```ts
import {
  serverUrl,
  setupClient,
  StateUtility,
  hexNamespace,
} from '@transia/hooks-toolkit'

const testContext = (await setupClient(
  serverUrl
)) as XrplIntegrationTestContext

const hookState = await StateUtility.getHookState(
  testContext.client,
  'r9cZA1mLK5R5Am25ArfXFmqgNwjZgnfk59',
  'state_key',
  hexNamespace('hook_namespace')
)

console.log(hookState)
```

### Retrieving Hook Definition

The `getHookDefinition` function is used to retrieve the definition of a hook in Xahau. It takes in the following parameters:

- `client`: Xahau client object.
- `hash`: The hash of the hook definition.

Here is an example of retrieving the definition of a hook:

```ts
import {
  serverUrl,
  setupClient,
  StateUtility
} from '@transia/hooks-toolkit'

const testContext = (await setupClient(
  serverUrl
)) as XrplIntegrationTestContext

const hookDefinition = await StateUtility.getHookDefinition(
  testContext.client,
  'hook_definition_hash'
)

console.log(hookDefinition)
```


### Retrieving Hook State Directory

The `getHookStateDir` function is used to retrieve the directory of hook states for a specific account and namespace in Xahau. It takes in the following parameters:

- `client`: Xahau client object.
- `account`: The account that owns the hook states.
- `namespace`: The namespace of the hook states.

Here is an example of retrieving the directory of hook states:

```ts
import {
  serverUrl,
  setupClient,
  StateUtility,
  hexNamespace
} from '@transia/hooks-toolkit'

const testContext = (await setupClient(
  serverUrl
)) as XrplIntegrationTestContext

const hookStateDir = await StateUtility.getHookStateDir(
  testContext.client,
  'r9cZA1mLK5R5Am25ArfXFmqgNwjZgnfk59',
  hexNamespace('hook_namespace')
)

console.log(hookStateDir)
```

## Execution Utility

The `ExecutionUtility` class in the SDK provides utility functions for working with hook executions and emitted transactions in Xahau.

### Getting Hook Executions from Transaction Metadata

The `getHookExecutionsFromMeta` function is used to retrieve hook executions from transaction metadata. It takes in the following parameters:

- `client`: Xahau client object.
- `meta`: The transaction metadata object.

Here is an example of using the `getHookExecutionsFromMeta` function:

```ts
import { TransactionMetadata } from 'xahau'
import {
  serverUrl,
  setupClient,
  ExecutionUtility 
} from '@transia/hooks-toolkit'

const testContext = (await setupClient(
  serverUrl
)) as XrplIntegrationTestContext

const meta: TransactionMetadata = {}

const hookExecutions = await ExecutionUtility.getHookExecutionsFromMeta(
  testContext.client, 
  meta
)
```

### Getting Hook Executions from Transaction Hash

The `getHookExecutionsFromTx` function is used to retrieve hook executions from a transaction hash. It takes in the following parameters:

- `client`: Xahau client object.
- `hash`: The transaction hash.

Here is an example of using the `getHookExecutionsFromTx` function:

```ts
import {
  serverUrl,
  setupClient,
  ExecutionUtility 
} from '@transia/hooks-toolkit'

const testContext = (await setupClient(
  serverUrl
)) as XrplIntegrationTestContext

const hash = '...'

const hookExecutions = await ExecutionUtility.getHookExecutionsFromTx(
  testContext.client,
  hash
)
```

### Getting Hook Emitted Transactions from Transaction Metadata

The `getHookEmittedTxsFromMeta` function is used to retrieve hook emitted transactions from transaction metadata. It takes in the following parameters:

- `client`: Xahau client object.
- `meta`: The transaction metadata object.

Here is an example of using the `getHookEmittedTxsFromMeta` function:

```ts
import { TransactionMetadata } from 'xahau'
import {
  serverUrl,
  setupClient,
  ExecutionUtility 
} from '@transia/hooks-toolkit'

const testContext = (await setupClient(
  serverUrl
)) as XrplIntegrationTestContext

const meta: TransactionMetadata = ...

const hookEmittedTxs = await ExecutionUtility.getHookEmittedTxsFromMeta(
  testContext.client,
  meta
)
```

## Submit Tx

The `Xrpld.submit` function in the SDK is used to submit a transaction to Xahau. It takes in a `SubmitTxParams` object as a parameter, which includes the client, wallet, and transaction to be submitted.

## Submitting a Transaction with submitTx

To submit a transaction to Xahau using the `Xrpld.submit` function, you need to provide the following parameters:

- `client`: Xahau client object.
- `wallet`: The wallet object that holds the account information for the transaction.
- `tx`: The transaction object to be submitted.

Here is an example of submitting a transaction using the `Xrpld.submit` function:

```ts
import {
  Xrpld,
  createHookPayload,
  setHooksV3,
  SetHookFlags
} from '@transia/hooks-toolkit'

const hook = createHookPayload({
  version: 0, // HookApiVersion
  createFile: 'hook_on_tt', // filename in /build
  namespace: 'hook_on_tt', // namespace (ascii)
  flags: SetHookFlags.hsfOverride, // SetHookFlag
  hookOnArray: ['Invoke'] // HookOn Transactions
})

await setHooksV3({
  client: testContext.client,
  wallet: testContext.alice,
  hooks: [{ Hook: hook }],
} as SetHookParams)

const aliceWallet = testContext.alice
const bobWallet = testContext.bob
const builtTx: Invoke = {
  TransactionType: 'Invoke',
  Account: bobWallet.classicAddress,
  Destination: aliceWallet.classicAddress,
}

const result = Xrpld.submit(testContext.client, {
  wallet: bobWallet,
  tx: builtTx,
} as SubmitTxParams)
```