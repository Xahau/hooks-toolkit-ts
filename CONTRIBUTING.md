# The Hooks Toolkit (Typescript)

## Global Prerequsits

`$ npm i -g @transia/hooks-cli`

## Compile C Hooks

Run this command to locally compile an XAHL Hook source file (inside ./contracts) from .c to .wasm code:

`$ hooks-cli compile-c contracts-c build`

You can also build a single hook with;

`$ hooks-cli compile-c contracts-c/toolbox/base.c build`

## Compile JS Hooks

## Compile C FHooks

Run this command to locally compile an XAHL Hook source file (inside ./contracts) from .c to .wasm code:

`$ hooks-cli compile-c contracts-cf build`

You can also build a single hook with;

`$ hooks-cli compile-c contracts-c/toolbox/base.c build`

## Test the Hook Library

Before you can run the integration tests you must have a standalone rippled server running.

- Full env with explorer:

- - `$ xrpld-netgen up:standalone --version=2025.2.24-HEAD+1366`

- Docker standalone only:

- - `$ docker run -p 5005:5005 -p 6006:6006 -it transia/xahaud:latest`

Run C Hooks Integration tests

`$ yarn run test:integration-c`

Run single C Hooks Integration test

`$ yarn run test:integration-c test/integration-c/toolbox/base.test.ts`

Run JS Hooks Integration tests

`$ yarn run test:integration-js`

Run single JS Hooks Integration test

`$ yarn run test:integration-js test/integration-js/toolbox/base.test.ts`

## JS Hooks

### Standalone

`$ xrpld-netgen up:standalone --version=2025.2.24-HEAD+1366`

### Compile

You can ONLY build a single js hook at a time;

`$ hooks-cli compile-js contracts-js/toolbox/base.ts build`

## Functional Hooks

### Standalone

`$ xrpld-netgen up:standalone --version=2025.5.4-HEAD+1765`

### Compile

`$ hooks-cli compile-c contracts-func/toolbox/base.c build`