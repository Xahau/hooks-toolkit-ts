import {
  serverUrl,
  type XrplIntegrationTestContext,
  setupClient,
  teardownClient,
  validateHook,
} from '../../../src'

describe('hook_validate', () => {
  let testContext: XrplIntegrationTestContext

  beforeAll(async () => {
    testContext = await setupClient(serverUrl)
  })
  afterAll(async () => teardownClient(testContext))

  it('valid hook', async () => {
    const result = await validateHook({
      client: testContext.client,
      createFile: 'base',
    })
    expect(result.valid).toBe(true)
    expect(typeof result.instruction_count_hook).toBe('string')
    expect(typeof result.instruction_count_cbak).toBe('string')
    expect(Array.isArray(result.log)).toBe(true)
  })

  it('invalid hook', async () => {
    const result = await validateHook({
      client: testContext.client,
      code: '00',
    })
    expect(result.valid).toBe(false)
    expect(result.log.length).toBeGreaterThan(0)
  })

  it('requires createFile or code', async () => {
    await expect(validateHook({ client: testContext.client })).rejects.toThrow(
      'validateHook: createFile or code is required'
    )
  })
})
