// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { GET } from './keepalive'

const req = (auth?: string) =>
  new Request('https://example.com/api/keepalive', {
    headers: auth ? { authorization: auth } : {},
  })

describe('api/keepalive', () => {
  beforeEach(() => {
    vi.stubEnv('CRON_SECRET', 's3cret')
    vi.stubEnv('VITE_SUPABASE_URL', 'https://proj.supabase.co')
    vi.stubEnv('VITE_SUPABASE_PUBLISHABLE_KEY', 'pk')
  })
  afterEach(() => {
    vi.unstubAllEnvs()
    vi.unstubAllGlobals()
  })

  it('rejects requests without the correct secret', async () => {
    const fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)
    expect((await GET(req())).status).toBe(401)
    expect((await GET(req('Bearer wrong'))).status).toBe(401)
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('rejects when CRON_SECRET is unset', async () => {
    vi.stubEnv('CRON_SECRET', '')
    expect((await GET(req('Bearer '))).status).toBe(401)
  })

  it('returns 500 when Supabase env vars are missing', async () => {
    vi.stubEnv('VITE_SUPABASE_URL', '')
    expect((await GET(req('Bearer s3cret'))).status).toBe(500)
  })

  it('pings Supabase and returns 200', async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response('[]', { status: 200 }))
    vi.stubGlobal('fetch', fetchMock)
    const res = await GET(req('Bearer s3cret'))
    expect(res.status).toBe(200)
    expect(fetchMock).toHaveBeenCalledWith(
      'https://proj.supabase.co/rest/v1/households?select=id&limit=1',
      { headers: { apikey: 'pk' } },
    )
  })

  it('returns 502 when Supabase errors or is unreachable', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('no', { status: 503 })))
    expect((await GET(req('Bearer s3cret'))).status).toBe(502)
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('boom')))
    expect((await GET(req('Bearer s3cret'))).status).toBe(502)
  })
})
