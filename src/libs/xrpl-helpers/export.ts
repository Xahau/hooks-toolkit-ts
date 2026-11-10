/**
 * Test helpers for the Export amendment on a standalone node.
 *
 * `xport()` makes the UNL validators multisign a transaction for another
 * network, and the result comes back as an `Import` of an XPOP. A standalone
 * node has no other network and no relay, so these helpers (a) get the node's
 * export key onto the ledger and (b) FORGE the other network's proofs with
 * test keys: the VL public key `EXPORT_TEST_VL_KEY` must be listed under
 * `[import_vl_keys]` in the node's validators file (see `.ci-config`).
 */
import { createHash } from 'node:crypto'
import {
  type Client,
  type Wallet,
  decodeNodePublic,
  deriveAddress,
  deriveKeypair,
  encodeNodePublic,
  encodeSeed,
} from 'xahau'
import { XrplDefinitions, encode, encodeForSigning } from 'xahau-binary-codec'
import { sign } from 'xahau-keypairs'

// biome-ignore lint/suspicious/noExplicitAny: raw node JSON
type Json = Record<string, any>
type KeyPair = { publicKey: string; privateKey: string }

const sha512 = (...parts: Buffer[]): Buffer =>
  createHash('sha512').update(Buffer.concat(parts)).digest()
const sha512Half = (...parts: Buffer[]): Buffer =>
  sha512(...parts).subarray(0, 32)
const hex = (b: Uint8Array): string => Buffer.from(b).toString('hex')
const HEX = (b: Uint8Array): string => hex(b).toUpperCase()
const u32 = (n: number): Buffer => {
  const b = Buffer.alloc(4)
  b.writeUInt32BE(n >>> 0)
  return b
}
const u64 = (n: bigint): Buffer => {
  const b = Buffer.alloc(8)
  b.writeBigUInt64BE(n)
  return b
}
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))
// rippled HashPrefix values (3 chars + NUL)
const HP = (s: string) => Buffer.from(`${s}\0`)
const HP_TX_ID = HP('TXN')
const HP_TX_NODE = HP('SND')
const HP_INNER_NODE = HP('MIN')
const HP_LEDGER = HP('LWR')
const HP_VALIDATION = HP('VAL')
const HP_MANIFEST = HP('MAN')
// XRPL variable-length prefix
function vl(b: Buffer): Buffer {
  const n = b.length
  const head =
    n <= 192
      ? [n]
      : n <= 12480
        ? [193 + ((n - 193) >> 8), (n - 193) & 255]
        : [
            241 + ((n - 12481) >> 16),
            ((n - 12481) >> 8) & 255,
            (n - 12481) & 255,
          ]
  return Buffer.concat([Buffer.from(head), b])
}

function testKey(role: string, algorithm: 'secp256k1' | 'ed25519'): KeyPair {
  // deterministic: seed entropy = sha512("xahau hooks-toolkit export test <role>")[0..16]
  const entropy = sha512(Buffer.from(`xahau hooks-toolkit export test ${role}`))
  return deriveKeypair(encodeSeed(entropy.subarray(0, 16), algorithm), {
    algorithm: algorithm === 'ed25519' ? 'ed25519' : 'ecdsa-secp256k1',
  } as never)
}

/** Default keys of the forged "other network": a VL publisher and one validator. */
export const EXPORT_TEST_KEYS = {
  vlMaster: testKey('vl master', 'secp256k1'),
  vlSigning: testKey('vl signing', 'secp256k1'),
  validatorMaster: testKey('validator master', 'ed25519'),
  validatorSigning: testKey('validator signing', 'secp256k1'),
}

/**
 * The VL publisher key the node must trust for network 0 (XRPL): put this line
 * under `[import_vl_keys]` in the node's validators file.
 * 035F67DD697C7D5B3070E07DF8318B1625E09AB87814B3237C1984ADB4067353E5
 */
export const EXPORT_TEST_VL_KEY = EXPORT_TEST_KEYS.vlMaster.publicKey

/**
 * Seed of the node's `[validation_seed]` used by `.ci-config` (secp256k1; an
 * ed25519 seed is fatal for the node).
 */
export const EXPORT_TEST_VALIDATION_SEED = 'shdHyxyJERxVqpdjhurNGaXciNXi3'

// Every Import of a ticketed XPOP may be signed by anyone; xahaud publishes this
// ed25519 key for loopback Imports: seed = sha512("xahau export relay")[0..16].
const RELAY_ENTROPY = sha512(Buffer.from('xahau export relay')).subarray(0, 16)
const RELAY_KEY: KeyPair = deriveKeypair(encodeSeed(RELAY_ENTROPY, 'ed25519'), {
  algorithm: 'ed25519',
} as never)

async function rpc(
  client: Client,
  command: string,
  params: Record<string, unknown> = {}
): Promise<Json> {
  const res = await client.request({ command, ...params } as never)
  return (res as unknown as { result: Json }).result
}

const definitions = new WeakMap<Client, Promise<XrplDefinitions>>()
/** The bundled codec lacks the Export fields and tx types: use the node's own. */
function nodeDefinitions(client: Client): Promise<XrplDefinitions> {
  let d = definitions.get(client)
  if (!d) {
    d = rpc(client, 'server_definitions').then(
      (r) => new XrplDefinitions(r as never)
    )
    definitions.set(client, d)
  }
  return d
}

async function networkId(client: Client): Promise<number> {
  const info = (await rpc(client, 'server_info')).info
  return info.network_id ?? 0
}

// ---------------------------------------------------------------------------
// paced ledger close
// ---------------------------------------------------------------------------

// A validation whose sign time is ~180 s ahead of the wall clock is silently
// dropped by the node. The node signs each validation at max(now, last + 1 s),
// so closing faster than 1 ledger/s for ~3 minutes makes it drop every
// validation, and without validations the export key is never registered.
// Mirror that clock and stay at most MAX_AHEAD seconds ahead of the wall clock.
const MAX_AHEAD = 150
const FAST_PATH_LEDGERS = 5
const lastSign = new WeakMap<Client, number>()

/**
 * `ledger_accept`, paced so the node's validation clock never runs more than
 * 150 s ahead of the wall clock: the first ~150 closes are fast, then 1/s.
 */
export async function ledgerAcceptPaced(client: Client): Promise<number> {
  let last = lastSign.get(client)
  if (last === undefined) {
    // a node that was closed fast before: its last close time tells where its clock is
    const l = (await rpc(client, 'ledger', { ledger_index: 'validated' }))
      .ledger
    last = Math.max(Date.now() / 1000, Number(l.close_time) + 946684800)
  }
  for (;;) {
    const now = Date.now() / 1000
    const next = Math.max(now, last + 1)
    if (next - now <= MAX_AHEAD) {
      last = next
      break
    }
    await sleep(250)
  }
  lastSign.set(client, last)
  const r = await rpc(client, 'ledger_accept')
  return r.ledger_current_index - 1 // the ledger just closed
}

// ---------------------------------------------------------------------------
// node requirements, key registration
// ---------------------------------------------------------------------------

/**
 * Why Export cannot be tested on this node, or `null` when it can: the
 * amendment must be enabled (see `GENESIS_EXPORT` in `.ci-config/genesis.js`)
 * and the node needs a validator key (`[validation_seed]`).
 */
export async function exportUnavailableReason(
  client: Client
): Promise<string | null> {
  try {
    const f = await rpc(client, 'feature', { feature: 'Export' })
    const entry = Object.values(f).find(
      (v) => v && typeof v === 'object' && (v as Json).name === 'Export'
    ) as Json | undefined
    if (!entry) return 'this xahaud build does not know the Export amendment'
    if (!entry.enabled) return 'the Export amendment is not enabled'
  } catch {
    return 'this xahaud build does not know the Export amendment'
  }
  const info = (await rpc(client, 'server_info')).info
  if (!info.pubkey_validator || info.pubkey_validator === 'none') {
    return 'the node has no validator key: set [validation_seed] in xahaud.cfg (.ci-config/xahaud-export.cfg)'
  }
  return null
}

async function assertExportAvailable(client: Client): Promise<void> {
  const reason = await exportUnavailableReason(client)
  if (reason) throw new Error(`Export is not available: ${reason}`)
}

/** `export_setup` of the node: the validators' export keys, `null` before they are registered. */
async function exportSetup(
  client: Client,
  account?: string
): Promise<Json | null> {
  try {
    const r = await rpc(client, 'export_setup', account ? { account } : {})
    return r.signers?.length ? r : null
  } catch (e) {
    if (/No export keys/.test(String((e as Error)?.message))) return null
    throw e
  }
}

/**
 * Get the node's export key onto the ledger. Returns at once when it is
 * registered already. Otherwise: funds the validator's master account from
 * `funder` and closes ledgers (paced) until `export_setup` has signers. A node
 * that registers its own key (standalone shortcut) is done within a few
 * ledgers; older nodes nominate it in a flag-ledger validation, which takes
 * ~520 ledgers, about 6 minutes with pacing.
 */
export async function registerExportKeys(
  client: Client,
  funder: Wallet,
  { maxLedgers = 1100 }: { maxLedgers?: number } = {}
): Promise<Json> {
  await assertExportAvailable(client)
  const existing = await exportSetup(client)
  if (existing) return existing
  // the validator master account must exist before the report flag ledger
  const info = (await rpc(client, 'server_info')).info
  const master = HEX(decodeNodePublic(info.pubkey_validator))
  const validator = deriveAddress(master)
  const funded = await rpc(client, 'account_info', {
    account: validator,
    ledger_index: 'current',
  }).then(
    () => true,
    () => false
  )
  if (!funded) {
    await sendTx(client, funder, {
      TransactionType: 'Payment',
      Destination: validator,
      Amount: '1000000000',
    })
  }
  for (let i = 0; i < maxLedgers; i++) {
    await ledgerAcceptPaced(client)
    // newer standalone nodes register their own key within a few ledgers of the
    // funding; older ones need the flag ledger, so check less often after that
    if (i < FAST_PATH_LEDGERS || i % 4 === 3) {
      const setup = await exportSetup(client)
      if (setup) return setup
    }
  }
  throw new Error(
    `export key not registered after ${maxLedgers} ledgers: is [validation_seed] set and is the node validating?`
  )
}

// ---------------------------------------------------------------------------
// signing and submitting with the node's definitions
// ---------------------------------------------------------------------------

async function signTx(
  client: Client,
  tx: Json,
  key: KeyPair
): Promise<{ blob: string; hash: string }> {
  const defs = await nodeDefinitions(client)
  const t: Json = { ...tx, SigningPubKey: key.publicKey }
  t.TxnSignature = sign(encodeForSigning(t as never, defs), key.privateKey)
  const blob = encode(t as never, defs)
  return { blob, hash: HEX(sha512Half(HP_TX_ID, Buffer.from(blob, 'hex'))) }
}

/** Submit a signed blob, close one ledger, and return the validated tx (with meta). */
async function submitBlob(client: Client, blob: string, hash: string) {
  const sub = await rpc(client, 'submit', { tx_blob: blob })
  await ledgerAcceptPaced(client)
  try {
    return await rpc(client, 'tx', { transaction: hash })
  } catch {
    throw new Error(
      `${sub.engine_result}: ${sub.engine_result_message ?? ''} (not in a ledger)`
    )
  }
}

async function nextSequence(client: Client, account: string): Promise<number> {
  const r = await rpc(client, 'account_info', {
    account,
    ledger_index: 'current',
  })
  return r.account_data.Sequence
}

/** Sign (native tx, with NetworkID when required), submit, close a ledger; throws unless tesSUCCESS. */
async function sendTx(client: Client, wallet: Wallet, tx: Json): Promise<Json> {
  const net = await networkId(client)
  const t: Json = {
    Account: wallet.classicAddress,
    Fee: '1000',
    Sequence: await nextSequence(client, wallet.classicAddress),
    ...(net > 1024 ? { NetworkID: net } : {}),
    ...tx,
  }
  const { blob, hash } = await signTx(client, t, wallet)
  const r = await submitBlob(client, blob, hash)
  if (r.meta?.TransactionResult !== 'tesSUCCESS') {
    throw new Error(`${t.TransactionType}: ${r.meta?.TransactionResult}`)
  }
  return r
}

// ---------------------------------------------------------------------------
// the forged "other network"
// ---------------------------------------------------------------------------

export interface XpopOptions {
  /** ledger index there (default: a fresh one per call) */
  ledgerSeq?: number
  /** close time there, Ripple epoch (default: now) */
  closeTime?: number
  /** TransactionResult in the forged meta (default tesSUCCESS) */
  result?: string
  /** meta AffectedNodes there (decoded JSON) */
  affected?: Json[]
}

let nextLedgerSeq = 1000
const nowRipple = () => Math.floor(Date.now() / 1000) - 946684800

async function manifest(
  client: Client,
  master: KeyPair,
  signing: KeyPair
): Promise<string> {
  const defs = await nodeDefinitions(client)
  const body = {
    Sequence: 1,
    PublicKey: master.publicKey,
    SigningPubKey: signing.publicKey,
  }
  const pre = Buffer.concat([
    HP_MANIFEST,
    Buffer.from(encode(body as never, defs), 'hex'),
  ])
  const full = {
    ...body,
    Signature: sign(hex(pre), signing.privateKey),
    MasterSignature: sign(hex(pre), master.privateKey),
  }
  return Buffer.from(encode(full as never, defs), 'hex').toString('base64')
}

/**
 * Forge an XPOP: `txBlob` (hex, as signed/executed on the other network) as the
 * only transaction of a ledger there, validated by the test validator, whose
 * list is signed by the test VL (`EXPORT_TEST_KEYS`). Returns the XPOP JSON.
 */
export async function xpop(
  client: Client,
  txBlob: string,
  {
    ledgerSeq = nextLedgerSeq++,
    closeTime = nowRipple(),
    result = 'tesSUCCESS',
    affected = [],
  }: XpopOptions = {}
): Promise<Json> {
  const k = EXPORT_TEST_KEYS
  const defs = await nodeDefinitions(client)
  const txBytes = Buffer.from(txBlob, 'hex')
  const txid = sha512Half(HP_TX_ID, txBytes)
  const metaHex = encode(
    {
      TransactionIndex: 0,
      TransactionResult: result,
      AffectedNodes: affected,
    } as never,
    defs
  )
  const leaf = sha512Half(
    HP_TX_NODE,
    vl(txBytes),
    vl(Buffer.from(metaHex, 'hex')),
    txid
  )
  // transaction tree with a single leaf: 16 branches, the leaf in the one its id selects
  const kids = Array.from({ length: 16 }, (_, b) =>
    b === txid[0] >> 4 ? leaf : Buffer.alloc(32)
  )
  const txroot = sha512Half(HP_INNER_NODE, ...kids)
  const coins = '99999999999999000'
  const phash = Buffer.alloc(32)
  phash[31] = 1
  const acroot = Buffer.alloc(32)
  acroot[31] = 2
  const pclose = closeTime - 10
  const ledgerHash = sha512Half(
    HP_LEDGER,
    u32(ledgerSeq),
    u64(BigInt(coins)),
    phash,
    txroot,
    acroot,
    u32(pclose),
    u32(closeTime),
    Buffer.from([10]),
    Buffer.from([0])
  )
  const val = {
    Flags: 0x80000001,
    LedgerSequence: ledgerSeq,
    SigningTime: closeTime + 1,
    LedgerHash: HEX(ledgerHash),
    SigningPubKey: k.validatorSigning.publicKey,
  }
  const valPre = Buffer.concat([
    HP_VALIDATION,
    Buffer.from(encode(val as never, defs), 'hex'),
  ])
  const valFull = encode(
    {
      ...val,
      Signature: sign(hex(valPre), k.validatorSigning.privateKey),
    } as never,
    defs
  )
  const unl = JSON.stringify({
    sequence: 1,
    effective: 0,
    expiration: closeTime + 365 * 24 * 3600,
    validators: [
      {
        validation_public_key: k.validatorMaster.publicKey,
        manifest: await manifest(client, k.validatorMaster, k.validatorSigning),
      },
    ],
  })
  return {
    ledger: {
      index: ledgerSeq,
      coins,
      phash: HEX(phash),
      txroot: HEX(txroot),
      acroot: HEX(acroot),
      pclose,
      close: closeTime,
      cres: 10,
      flags: 0,
    },
    transaction: { blob: HEX(txBytes), meta: metaHex, proof: kids.map(HEX) },
    validation: {
      data: {
        [encodeNodePublic(Buffer.from(k.validatorSigning.publicKey, 'hex'))]:
          valFull,
      },
      unl: {
        public_key: k.vlMaster.publicKey,
        manifest: await manifest(client, k.vlMaster, k.vlSigning),
        blob: Buffer.from(unl).toString('base64'),
        signature: sign(hex(Buffer.from(unl)), k.vlSigning.privateKey),
        version: 1,
      },
    },
  }
}

/**
 * Submit an `Import` of `proof`, close one ledger and return the validated tx.
 * `loopback` Imports (a result coming back for an exporter's ticketed tx) have
 * Sequence 0 and Fee 0 and are signed by the published relay key; they must not
 * be autofilled. Otherwise the Import is a normal one signed by `wallet`.
 */
async function submitImport(
  client: Client,
  account: string,
  proof: Json,
  signer: Wallet | null
): Promise<Json> {
  const net = await networkId(client)
  const tx: Json = {
    TransactionType: 'Import',
    Account: account,
    ...(net > 1024 ? { NetworkID: net } : {}),
    Blob: Buffer.from(JSON.stringify(proof)).toString('hex').toUpperCase(),
    ...(signer
      ? { Fee: '1000', Sequence: await nextSequence(client, account) }
      : { Fee: '0', Sequence: 0 }),
  }
  const { blob, hash } = await signTx(
    client,
    tx,
    signer ?? (RELAY_KEY as unknown as KeyPair)
  )
  return submitBlob(client, blob, hash)
}

// ---------------------------------------------------------------------------
// exporter setup, round trip
// ---------------------------------------------------------------------------

const XRPL_FEE = '12' // drops "burned" there: Import mints this, so it must be > 0

async function exporterOf(client: Client, account: string) {
  const objs = await rpc(client, 'account_objects', {
    account,
    ledger_index: 'current',
  })
  return (objs.account_objects as Json[]).find(
    (o) => o.LedgerEntryType === 'Exporter'
  )
}

const accountRootNode = (account: string, sequence: number): Json => ({
  ModifiedNode: {
    LedgerEntryType: 'AccountRoot',
    LedgerIndex: HEX(sha512Half(Buffer.from(account))),
    FinalFields: { Account: account, Sequence: sequence, Balance: '100000000' },
  },
})

/**
 * Make `wallet` an exporter by forging the XPOPs of the two transactions it
 * would have executed on the other network: a SignerListSet naming the
 * validators' export keys (Imported with a normal Import signed by the
 * account), then a TicketCreate (loopback Import). Needs `registerExportKeys`
 * first. Does nothing for the parts the account already has.
 */
export async function setupExporter(
  client: Client,
  wallet: Wallet,
  { tickets = 50 }: { tickets?: number } = {}
): Promise<void> {
  const account = wallet.classicAddress
  const net = await networkId(client)
  let ex = await exporterOf(client, account)
  let seq: number = ex?.ExportSequence ?? 3 // its Sequence there (unrelated to ours)
  const key = wallet as unknown as KeyPair

  if (!ex?.ExportSignerList) {
    const setup = await exportSetup(client, account)
    if (!setup)
      throw new Error('export keys are not registered, see registerExportKeys')
    const signed = await signTx(
      client,
      { ...setup.tx_json, Account: account, Sequence: seq, Fee: XRPL_FEE },
      key
    )
    const proof = await xpop(client, signed.blob, {
      affected: [accountRootNode(account, seq + 1)],
    })
    const r = await submitImport(client, account, proof, wallet)
    if (r.meta?.TransactionResult !== 'tesSUCCESS') {
      throw new Error(`Import(SignerListSet): ${r.meta?.TransactionResult}`)
    }
    seq++
  }

  ex = await exporterOf(client, account)
  if (!ex?.ExportTicketNext) {
    const signed = await signTx(
      client,
      {
        TransactionType: 'TicketCreate',
        Account: account,
        Sequence: seq,
        Fee: XRPL_FEE,
        TicketCount: tickets,
        OperationLimit: net,
      },
      key
    )
    const made: Json[] = []
    for (let t = seq + 1; t <= seq + tickets; t++) {
      made.push({
        CreatedNode: {
          LedgerEntryType: 'Ticket',
          LedgerIndex: HEX(sha512Half(Buffer.from(`ticket${account}${t}`))),
          NewFields: { Account: account, TicketSequence: t },
        },
      })
    }
    const proof = await xpop(client, signed.blob, {
      affected: [accountRootNode(account, seq + 1 + tickets), ...made],
    })
    const r = await submitImport(client, account, proof, null)
    if (r.meta?.TransactionResult !== 'tesSUCCESS') {
      throw new Error(`Import(TicketCreate): ${r.meta?.TransactionResult}`)
    }
  }
}

export interface ExportFinal {
  /** the signed exported transaction (the ExportedTxn FinalFields), as JSON */
  exported: Json
  /** the validated ExportFinal transaction */
  final: Json
}

const isNodeOwn = (t: Json) =>
  t.TransactionType === 'TicketCreate' || t.TransactionType === 'SignerListSet'

/**
 * Close ledgers (paced) until an ExportFinal shows up and return the signed
 * exported transaction. The ledger also exports on its own (ExportAuto: ticket
 * refills, signer lists); by default those are skipped. `match` overrides which
 * exported transaction is wanted.
 */
export async function closeUntilExportFinal(
  client: Client,
  {
    maxLedgers = 16,
    match = (t) => !isNodeOwn(t),
  }: { maxLedgers?: number; match?: (exported: Json) => boolean } = {}
): Promise<ExportFinal> {
  for (let i = 0; i < maxLedgers; i++) {
    const closed = await ledgerAcceptPaced(client)
    const led = await rpc(client, 'ledger', {
      ledger_index: closed,
      transactions: true,
      expand: true,
    })
    for (const tx of led.ledger.transactions as Json[]) {
      if (tx.TransactionType !== 'ExportFinal') continue
      const gone = (tx.metaData?.AffectedNodes as Json[])
        ?.map((n) => n.DeletedNode)
        .find((n) => n?.LedgerEntryType === 'ExportedTxn')
      const exported = gone?.FinalFields?.ExportedTxn
      if (exported && match(exported)) return { exported, final: tx }
    }
  }
  throw new Error(`no matching ExportFinal within ${maxLedgers} ledgers`)
}

/**
 * Return an export the way the other network would: forge the XPOP of the
 * signed exported tx executed there with `result`, and submit it as a loopback
 * Import. The exporter's hook gets its `cbak`. Returns the validated Import
 * (`meta.HookExecutions` for assertions); a replay fails with tefNO_TICKET.
 */
export async function returnExport(
  client: Client,
  exported: Json,
  { result = 'tesSUCCESS' }: { result?: string } = {}
): Promise<Json> {
  const defs = await nodeDefinitions(client)
  const proof = await xpop(client, encode(exported as never, defs), {
    result,
    affected: [accountRootNode(exported.Account, 1)],
  })
  return submitImport(client, exported.Account, proof, null)
}
