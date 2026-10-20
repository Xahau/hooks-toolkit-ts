import fs from 'fs'
import path from 'path'
import { SHA256 } from 'crypto-js'
import { TRANSACTION_TYPES, TRANSACTION_TYPE_MAP } from 'xahau-binary-codec'
import { createHash } from 'crypto'

export function readHookBinaryHexFromNS(filename: string, ext: string): string {
  const buildPath = process.cwd() + '/' + 'build'
  return wasmToHex(path.resolve(__dirname, `${buildPath}/${filename}.${ext}`))
}

export function wasmToHex(path: string): string {
  const wasm = fs.readFileSync(path)
  return wasm.toString(`hex`).toUpperCase()
}

export function hexNamespace(hookNamespaceSeed: string): string {
  return SHA256(hookNamespaceSeed).toString().toUpperCase()
}

export function generateHash(dataBytes: Buffer) {
  const hash = createHash('sha512').update(dataBytes).digest()
  return hash.slice(0, 32).toString('hex').toUpperCase()
}

export function padHexString(input: string, targetLength = 64): string {
  const paddedString = '0'.repeat(targetLength - input.length) + input
  return paddedString
}

/**
 * @constant tts
 * @description
 * Transaction types
 */

/**
 * @typedef TTS
 * @description
 * Transaction types
 */
export type TTS = typeof TRANSACTION_TYPE_MAP

export function calculateHookOff(arr: Array<keyof TTS>): string {
  let hash =
    '0x0000000000000000000000000000000000000000000000000000000000000000'
  arr.forEach((nth) => {
    if (typeof nth !== 'string') {
      throw new Error(`HookOn transaction type must be string`)
    }
    if (!TRANSACTION_TYPES.includes(String(nth))) {
      throw new Error(
        `invalid transaction type '${String(nth)}' in HookOn array`
      )
    }

    const tts: Record<string, number> = TRANSACTION_TYPE_MAP
    let value = BigInt(hash)
    value ^= BigInt(1) << BigInt(tts[nth])
    hash = `0x${value.toString(16)}`
  })
  hash = hash.replace('0x', '')
  hash = hash.padStart(64, '0')
  return hash.toUpperCase()
}
