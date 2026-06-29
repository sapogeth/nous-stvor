import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const upstashUrl   = process.env.UPSTASH_REDIS_REST_URL
    const upstashToken = process.env.UPSTASH_REDIS_REST_TOKEN
    const kvUrl        = process.env.KV_REST_API_URL
    const kvToken      = process.env.KV_REST_API_TOKEN

    const effectiveUrl   = upstashUrl   ?? kvUrl
    const effectiveToken = upstashToken ?? kvToken

    // Try to connect and query directly
    let hlen = 0
    let hgetallCount = 0
    let connectError: string | null = null
    let firstField: string | null = null

    if (effectiveUrl && effectiveToken) {
      try {
        const { Redis } = await import('@upstash/redis')
        const r = new Redis({ url: effectiveUrl, token: effectiveToken })

        // Check the stvor:receipts hash length
        hlen = (await r.hlen('stvor:receipts')) as number

        // Attempt hgetall
        const all = await r.hgetall('stvor:receipts') as Record<string, string> | null
        if (all) {
          hgetallCount = Object.keys(all).length
          firstField = Object.keys(all)[0] ?? null
        }
      } catch (e) {
        connectError = String(e)
      }
    }

    return NextResponse.json({
      envVars: {
        UPSTASH_REDIS_REST_URL:   upstashUrl   ? `set (${upstashUrl.slice(0, 30)}...)` : 'MISSING',
        UPSTASH_REDIS_REST_TOKEN: upstashToken ? 'set' : 'MISSING',
        KV_REST_API_URL:          kvUrl        ? `set (${kvUrl.slice(0, 30)}...)` : 'MISSING',
        KV_REST_API_TOKEN:        kvToken      ? 'set' : 'MISSING',
      },
      effectiveUrl: effectiveUrl ? `${effectiveUrl.slice(0, 40)}...` : 'NONE',
      hlen,
      hgetallCount,
      firstField,
      connectError,
    })
  } catch (e) {
    return NextResponse.json({ error: String(e) })
  }
}
