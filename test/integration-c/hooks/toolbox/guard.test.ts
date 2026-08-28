// xrpl
import { Invoke, SetHookFlags, TransactionMetadata } from 'xahau'
import {
  // Testing
  XrplIntegrationTestContext,
  setupClient,
  teardownClient,
  serverUrl,
  // Main
  Xrpld,
  SetHookParams,
  ExecutionUtility,
  createHookPayload,
  setHooksV3,
  clearAllHooksV3,
} from '../../../../dist/npm/src'
import { BaseModel, Metadata, UInt64, XRPAddress } from '@transia/binary-models'

const accounts = [
  'rNfd5LnXUkx1a6Jm6HyJhgYhxHxCxBQWpa',
  'rhB9zpsW8puHN8UFLBrGzVWKPbokxREXq6',
  'rEeqzxBFcoxhk3x91F4XUjm9y4c81KV8f7',
  'rnmvzwjC1hKXpVL1yHEsHxywMdxvDu5X2H',
  'rEj8GhozdUEzYFNyNmSpsX5gNUXH4aVmp2',
  'rMijxTdkRSZYLzQn9ZXdg8rWMHbkQLGXPb',
  'rEk782hC2xVeHfp61gtJxpMBGovGw81rV',
  'rhiqgyXc7c9ypPYWDnuACFszddQMyiGckj',
  'rNvXbJtCE2dcmTq4RB86idQwy9AFFrptp7',
  'rn1rXYXDyVYfy8aVnVju54S6QnpzKhkFYG',
  'r4fstovu3FELQEPF5oyTFdp7HLyKEo1FxW',
  'rsYqdi6qmftywFYKgCkCVMRdggmR11FYvD',
  'rJVCJMHkg32i1nbRtUvsVD2g2o911Uzb3z',
  'rfDLm6MskDxNdUvHUeFf37vohGjTpe2SxV',
  'rJMGRQc4aXZKF9zUErhQ43LRHwmWs1pKji',
  'rpa7cwVmp7b52rQY9aEu5NdFULd8JCDoT9',
  'rEP3hFWYPZthkPgCTyJmvcW8i5ae7CKvQp',
  'r4j9iYVeey22d9ShvEusqqmtRApfrdyhjw',
  'rhdvcvLVVycjheNHzyuMU7pxq4C8pGvaDX',
  'rw7pSoMCRdJ7FhLpxBVzPEgSFHVFedE6qu',
  'rxz364HGe9dBgLsNH8Dv2iDZdYpB4FEbX',
  'rBSPqHUVPAMy47renKhxnwuRnJJF1F1s9B',
  'rK42c8mWoAG1eEt4Cq5EeoWx1Poj3csk8P',
  'rLVFuJvmvfZ6B63ss2f4EkdVnbaHNbZqVt',
  'raZMnsD9uC6W4huUru9AhEM4vSVrS3nL3N',
  'rUrxVLJyYVucJbohbXSD6dvVLPpobckD3A',
  'rDPRQDymygF16RbUUnQbQfTsxA9yaRnTPC',
  'rNLwcHGtJqTV9mxZw6YPotTDaj3TSFpMyn',
  'rs1bvftRZXNUyqMcnHQn5CHeGcBkkz6ZuJ',
  'rpcvftKzAD93S565KyXkZhWeGvs3EGxqth',
  'rUPPQzb7etsN2ci9AcDSV36kskLoREd9us',
  'rsRTbUX5NuBQv8obnJ29uGn5EWM24tpcgs',
  'rMs6y7fakLAoHH2ffmoKiQ5fzwJ46cWiTM',
  'r8CuT6d7vPamN8Q5o335dqtV4iQMud4e8',
  'rJkF6e4Q2r9Rz4LkJgsnXwRBcfdKFbDBw6',
  'rLMXFf5DdAU6pCmY2DBqj6iR47KM48kJEY',
  'rKi5GjgurCUsTKXi9jkCUMmKr77kVR86Bm',
  'rfFP2rnruzxowZ1jjBLYt4tvcohzWGZnaq',
  'ra6YcM3Gjv45nztSPmjMAEefQ7pc9iTQrR',
  'r4yFmirzVK2T98R1nmrzbX7ibziJkbUr5W',
  'rHy2q6yBqaCqF5UmQJpfxHGSbcUvMNwj4G',
  'rLM36BEnLTveS6eMPQCeQkbWtDLSC2qabH',
  'rUpX4faHQHLaSHHcrRoQ6yzF7PfFy541Ji',
  'rnD5zBnaEJc5YkiJB1SKSoZAzEWNp6UkUi',
  'rGNqqFSoY4scNgh9cpVMawdtVamUoE6wxh',
  'raSY1bQojAa7aXxwxd6PoaVCQ2Af5GgYPP',
  'ran92PZiUoi7KKcQGc1cRVArawrNxfLAvd',
  'rJtMfYVtWkPtdo4oMk2bcHRNfXNvsQf4uE',
  'r9yz69n3MMsVt7rrLXzPHrD5LTLYTKZEf4',
  'rFEorzuddGh7LPLCmobKE7EZXtGAJiT2A',
  'rgop5VC9WGqLDmbU7h4CKSTeeEgTWQtrm',
  'raZADqo65xKwfxZ61r77wwQEhuabqNDXix',
  'rfVvPDrnAM19qzwEi7rJ8rHVsy614mvbLC',
  'rE78YZuZ1LQfmTDtH72EW8bkn6xcTZczm9',
  'rwEhiTvnW4CvLTtXkLt3y5RBgaBFvYsAVy',
  'rGEwQ2K1L1NfdSEMXGkzy3bjaJVpgRkfgo',
  'rUnaXMjUjPFh39kz58Q4F2HjuwVQxU2VuL',
  'rKtZakSPiTguz89ychnVXemmYg8MzTfNn',
  'rGopy4kMxZmUVmxzq3wJrRYb1Se6FtMLra',
  'rn57fpmQiXC8KfBzW6iKszdBE2CchbcFgT',
  'rKv6jPuHFiRdBHFL67cdc5noAaV8ycidpg',
  'rKyTKttkBKSsALxCjivwS4sVndfq3xVh6k',
  'rpyHRU3xSuPbJV6yVzxMgAPtrkPVBcLLbV',
  'rL9U6iDn1Twg4VdT95J9vcZgdTk6HD5Bfx',
  'rhowGD9QAnAJ5P9tGLVSNBWoPKdqdUKjHM',
  'ra3j6M92VWgngy5SmJiuJMtakhMNew8P9K',
  'rNSv8i8tnonexDMJbJaimuwMQGBzWJ2pDe',
  'rpBPzzDpPnfiBCm8nt3SePaqy8CYpxWGS3',
  'ramR4MUkzkg4HavFDS7qm1ZtSUUFyC5uDn',
  'rMZyy7PSdk5B9ee4uGJcETGGsa9aQqcv8g',
  'rM5wCXfwv8fzrDhLgH7yzRKoU5jRNKm1uS',
  'rw16K7PVWt8s9CUaAMUby8tFNP6YTqa91k',
  'rnwV3nTJU6ph2wKJHiAjXC5vXJ1eDyv4CR',
  'rfn3pat4uCCfAsxGnzGbC6YkDDH3RQqzjz',
  'rUn2nvVCCMVicrNcPcof1GwtfzbH3H97Gy',
  'r9E5rWZ6T64xa5CPMEGw1F51mGEvcs3kAV',
  'rLQHBo1NqhageUpMTfxCRdCXNNPAXKcCdG',
  'rfQyBY8DFJ2qDhQPBVvikK2aef8uAQHPbV',
  'r3CFk7paqsivHPXhfgrwj181YELWqyoJbL',
  'rLJqP5wQtLNC6xWCGqZCpqcFYKko4DaixM',
  'rsVy8DyjJzLB6byugTvJJdGk9L2qNXzdje',
  'rK58F1WFaFKYy3ukguYLFemWCUDGzr3mdN',
  'rw7wPnBQAoriHhS2uMfrfN3WsLW6ui5eJW',
  'rhgnMUuXBJA7rK87uKJ2h26mzZ1i2QKwzz',
  'rB9DMLytaBiVqyRFHZ2zVFE7wMoACK73x4',
  'rMkhVhbxwa4ooTPSrAR8ebk3L5tjLWETC2',
  'rN95xyS993LBqrkdtN9D8Vg64yYNuKCDcH',
  'rKm8YH2FNZP2DQFG2wVWMJJ5ra5m2hZ8iD',
  'rsiEZ631z44aWXKVoNxBAMY8UnRgXTKK1C',
  'rUKJLetNjUmbaw7QUCWp3GGnCemxyTTGBr',
  'r3d6Wr5YwYdAHwtRWoWFR3UAdn26drD1Mv',
  'rpqCgmXGo65wfmmbEPbyCA6cFLBxy6W95m',
  'rfYSktU5U1g5aefuEscbp8ccN34yzuxtap',
  'rpJkKDZrEyCNUDGmVhs7aad3pxeQfMTktF',
  'rsofdAGcktk91UK15vnuv5EHEcKsYqnDWV',
  'rfncB4A1xuUis35ivxCNopKMf49xZhDX7t',
  'rDqBejAV7cxdjmho7SBUERLVLNHHPenRD9',
  'rK78DnCXh5sdKNfDJffi1oVfN1LBRMRFSS',
  'r9JKasMnRpKjBZfGzD9kpZd4iDC5q5rBTR',
  'rUUxcgTktAJQdT1rhvET43D99JffgN3Qwg',
]

export class Account extends BaseModel {
  account: XRPAddress
  count: UInt64

  // Total Bytes: 28
  constructor(account: XRPAddress, count: UInt64) {
    super()
    this.account = account // 0: 20 bytes
    this.count = count // 20: 8 bytes
  }

  getMetadata(): Metadata {
    return [
      { field: 'account', type: 'xrpAddress' },
      { field: 'count', type: 'uint64', little: true },
    ]
  }

  toJSON() {
    return {
      account: this.account,
      count: this.count,
    }
  }
}

describe('guard', () => {
  let testContext: XrplIntegrationTestContext

  beforeAll(async () => {
    testContext = await setupClient(serverUrl)
    const hook = createHookPayload({
      version: 0,
      createFile: 'guard',
      namespace: 'guard',
      flags: SetHookFlags.hsfOverride,
      hookOnArray: ['Invoke'],
    })
    await setHooksV3({
      client: testContext.client,
      wallet: testContext.hook1,
      hooks: [{ Hook: hook }],
    } as SetHookParams)
  })
  afterAll(async () => {
    await clearAllHooksV3({
      client: testContext.client,
      wallet: testContext.hook1,
    } as SetHookParams)
    await teardownClient(testContext)
  })

  it('guard hook', async () => {
    // INVOKE IN
    const aliceWallet = testContext.alice
    const hookWallet = testContext.hook1

    const whitelist: Account[] = []
    for (let i = 0; i < accounts.length; ++i) {
      whitelist.push(new Account(accounts[i], 1n))
    }

    let blob = ''
    for (let i = 0; i < whitelist.length; ++i) {
      const entry = whitelist[i]
      blob += '00'
      blob += entry.encode()
    }

    const builtTx: Invoke = {
      TransactionType: 'Invoke',
      Account: aliceWallet.classicAddress,
      Destination: hookWallet.classicAddress,
      Blob: blob,
    }
    const result = await Xrpld.submit(testContext.client, {
      wallet: aliceWallet,
      tx: builtTx,
    })
    const hookExecutions = await ExecutionUtility.getHookExecutionsFromMeta(
      testContext.client,
      result.meta as TransactionMetadata
    )
    expect(hookExecutions.executions[0].HookReturnString).toMatch(
      'guard: Finished.'
    )
  })
})
