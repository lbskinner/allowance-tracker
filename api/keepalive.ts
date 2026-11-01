// Vercel Cron target (see vercel.json). Makes a cheap GET to Supabase so the
// project doesn't get paused for inactivity.
export async function GET(request: Request): Promise<Response> {
  const secret = process.env.CRON_SECRET
  if (!secret || request.headers.get('authorization') !== `Bearer ${secret}`) {
    return new Response('Unauthorized', { status: 401 })
  }

  const url = process.env.VITE_SUPABASE_URL
  const key = process.env.VITE_SUPABASE_PUBLISHABLE_KEY
  if (!url || !key) {
    return new Response('Supabase env vars not configured', { status: 500 })
  }

  try {
    const res = await fetch(`${url}/rest/v1/households?select=id&limit=1`, {
      headers: { apikey: key },
    })
    if (!res.ok) {
      return new Response(`Supabase responded ${res.status}`, { status: 502 })
    }
    return Response.json({ ok: true, at: new Date().toISOString() })
  } catch (err) {
    return new Response(`Supabase request failed: ${String(err)}`, { status: 502 })
  }
}
