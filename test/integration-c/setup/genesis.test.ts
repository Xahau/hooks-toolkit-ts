import {
  serverUrl,
  XrplIntegrationTestContext,
  setupClient,
  teardownClient,
  hasGovernance,
} from '../../../src'

describe('SetHook - End to End', () => {
  let testContext: XrplIntegrationTestContext

  beforeAll(async () => {
    testContext = await setupClient(serverUrl, true)
  })
  afterAll(async () => teardownClient(testContext))

  it('genesis setup', async () => {
    const response = await hasGovernance(
      testContext.client,
      testContext.master.classicAddress
    )
    expect(response).toBe(true)
  })
})
