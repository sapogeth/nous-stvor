import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET() {
  const url   = process.env.UPSTASH_REDIS_REST_URL   ?? process.env.KV_REST_API_URL
  const token = process.env.UPSTASH_REDIS_REST_TOKEN ?? process.env.KV_REST_API_TOKEN
  let redisOk = false

  if (url && token) {
    try {
      const { Redis } = await import('@upstash/redis')
      const r = new Redis({ url, token })
      await r.set('stvor:debug:ping', 'ok', { ex: 60 })
      const v = await r.get('stvor:debug:ping')
      redisOk = v === 'ok'
    } catch {}
  }

  return NextResponse.json({
    hasUrl:   Boolean(url),
    hasToken: Boolean(token),
    urlPrefix: url?.slice(0, 35) ?? null,
    redisOk,
    envVars: {
      UPSTASH_REDIS_REST_URL:   Boolean(process.env.UPSTASH_REDIS_REST_URL),
      KV_REST_API_URL:           Boolean(process.env.KV_REST_API_URL),
      UPSTASH_REDIS_REST_TOKEN: Boolean(process.env.UPSTASH_REDIS_REST_TOKEN),
      KV_REST_API_TOKEN:         Boolean(process.env.KV_REST_API_TOKEN),
    },
  })
}
