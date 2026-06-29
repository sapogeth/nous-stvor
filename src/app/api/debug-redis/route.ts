import { NextResponse } from 'next/server'
import { redisGetReceipts } from '@/lib/redis'
import { syncTrustScoresFromRedis } from '@/lib/db/queries'
import { getDb } from '@/lib/db/client'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    // Check what type hgetall returns
    const { Redis } = await import('@upstash/redis')
    const url   = process.env.UPSTASH_REDIS_REST_URL   ?? process.env.KV_REST_API_URL ?? ''
    const token = process.env.UPSTASH_REDIS_REST_TOKEN ?? process.env.KV_REST_API_TOKEN ?? ''
    const r = new Redis({ url, token })
    const raw = await r.hgetall('stvor:receipts') as Record<string, unknown> | null
    const firstValue = raw ? Object.values(raw)[0] : null
    const firstValueType = firstValue !== null ? typeof firstValue : 'null'

    // Now call the fixed redisGetReceipts
    const receipts = await redisGetReceipts()

    // Sync and check DB
    await syncTrustScoresFromRedis()
    const db = getDb()
    const nonVeteran = (db.prepare("SELECT COUNT(*) as c FROM trust_receipts WHERE agent_id != 'hermes-veteran'").get() as { c: number }).c
    const total = (db.prepare("SELECT COUNT(*) as c FROM trust_receipts").get() as { c: number }).c

    return NextResponse.json({
      hgetallFirstValueType: firstValueType,
      redisReceiptCount: receipts.length,
      firstReceiptAgentId: receipts[0]?.agent_id ?? null,
      dbTotal: total,
      dbNonVeteran: nonVeteran,
    })
  } catch (e) {
    return NextResponse.json({ error: String(e) })
  }
}
