## [1.0.14] - 2024-03-13

### Added:
- `wasmToHex` utility function for building wasm outside of test env

### Updated:
- xrpl.js: ^2.7.3-alpha.25 -> ^2.7.3-alpha.26

## [1.0.15] - 2024-05-20

### Added:
- `submitBatch` utility function to submit a batch of txns

### Removed:
- `chai` removed the chai assert dependency

### Updated:
- `Account` reduce account generate costs @tequ

## [1.0.16] - 2024-05-21

### Fixed:
- exports of the `xrpl-helpers` and `binary-models` utils

### Updated:
- xrpl.js: ^2.7.3-alpha.26 -> ^2.7.3-alpha.26

## [2.0.0] - 2024-08-05

### Added:
- `jshooks` new functionality for js hooks

### Added:
- `params.debugStream` debug stream option when submitting hooks. Debug will stream to the console and create a debug.log file in the root of the repo.
- `@transia/hooks-cli` we now use the hooks-cli to build all wasm hooks

### Updated:
- `RIPPLED_ENV -> XAHAU_ENV` we updated the env name for selecting the txn submission type
- `C2WASM_CLI_HOST -> HOOKS_COMPILE_HOST` we now use the HOOKS_COMPILE_HOST for all wasm builds
- `ICXRP -> ICXAH` we now use the ICXAH for all issued currency tools

### Replaces `src/libs/binary-models` -> `@transia/binary-models`

### Updated:
- xrpl.js: ^2.7.3-alpha.26 -> ^2.7.3-alpha.28

## [3.0.0] - 2026-10-20

### Added:
- `validateHook` helper that calls the `hook_validate` RPC and logs the result

### Removed:
- JS hooks support (`contracts-js`, `test:integration-js`, `jshooks-api`) following hooks-cli 3
- `HOOKS_COMPILE_HOST` env, hooks-cli 3 compiles C hooks locally

### Updated:
- hooks-cli: 2.x -> 3.0.0
- xahau.js: ^4.1.1 -> ^4.2.0, xahau-binary-codec: ^2.2.0 -> ^2.3.0
- ESLint/Prettier -> Biome, lint and format now cover `src` and `test`
- CI runs against xahaud 2026.10.13-release+4119
- npm publish and GitHub Release are created by the `workflow_dispatch` publish workflow
