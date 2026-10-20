# The Hooks Toolkit (Typescript)

## Global Prerequsits

`$ npm i -g @xahau/hooks-cli@3.0.0`

Compilation runs locally (no compile server needed) and requires Node >= 20.12.

## Compile C Hooks

Run this command to locally compile an XAHL Hook source file (inside ./contracts) from .c to .wasm code:

`$ hooks-cli compile-c contracts-c/toolbox build --headers contracts-c/utils/hook`
`$ hooks-cli compile-c contracts-c/txns build --headers contracts-c/utils/hook`

You can also build a single hook with;

`$ hooks-cli compile-c contracts-c/toolbox/base.c build --headers contracts-c/utils/hook`

## Test the Hook Library

Before you can run the integration tests you must have a standalone rippled server running.

- Full env with explorer:

- - `$ xrpld-netgen up:standalone --version=2025.2.24-HEAD+1366`

- Docker standalone only:

- - `$ docker run -p 5005:5005 -p 6006:6006 -it transia/xahaud:latest`

Run C Hooks Integration tests

`$ pnpm run test:integration-c`

Run single C Hooks Integration test

`$ pnpm run test:integration-c test/integration-c/toolbox/base.test.ts`
