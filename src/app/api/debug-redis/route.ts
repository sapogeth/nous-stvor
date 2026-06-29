import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET() {
  const url   = process.env.UPSTASH_REDIS_REST_URL   ?? process.env.KV_REST_API_URL
  const token = process.env.UPSTASH_REDIS_REST_TOKEN ?? process.env.KV_REST_API_TOKEN
  let redisOk = false
  let receiptCount = 0
  let trustKeys = 0
  let allKeys: string[] = []

  if (url && token) {
    try {
      const { Redis } = await import('@upstash/redis')
      const r = new Redis({ url, token })
      await r.set('stvor:debug:ping', 'ok', { ex: 60 })
      const v = await r.get('stvor:debug:ping')
      redisOk = v === 'ok'

      // Check how many receipts are in Redis
      const receipts = await r.hgetall('stvor:receipts') as Record<string, string> | null
      receiptCount = receipts ? Object.keys(receipts).length : 0

      // Check trust score keys
      const trust = await r.hgetall('stvor:trust_scores') as Record<string, string> | null
      trustKeys = trust ? Object.keys(trust).length : 0

      // List all stvor:* keys
      allKeys = await r.keys('stvor:*') as string[]
    } catch (e) {
      return NextResponse.json({ error: String(e) })
    }
  }

  return NextResponse.json({
    hasUrl:   Boolean(url),
    hasToken: Boolean(token),
    urlPrefix: url?.slice(0, 40) ?? null,
    redisOk,
    receiptCount,
    trustKeys,
    allKeys,
  })
}
