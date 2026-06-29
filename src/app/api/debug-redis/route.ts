import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET() {
  const url   = process.env.UPSTASH_REDIS_REST_URL   ?? process.env.KV_REST_API_URL
  const token = process.env.UPSTASH_REDIS_REST_TOKEN ?? process.env.KV_REST_API_TOKEN
  if (!url || !token) return NextResponse.json({ error: 'no redis creds' })

  try {
    const { Redis } = await import('@upstash/redis')
    const r = new Redis({ url, token })

    // Get raw receipts from Redis
    const raw = await r.hgetall('stvor:receipts') as Record<string, unknown> | null
    if (!raw) return NextResponse.json({ receiptCount: 0 })

    const values = Object.values(raw)
    const firstRaw = values[0]

    // Parse one receipt to inspect its shape
    let firstReceipt: Record<string, unknown> | null = null
    try {
      firstReceipt = typeof firstRaw === 'string' ? JSON.parse(firstRaw) : firstRaw as Record<string, unknown>
    } catch {}

    // Try inserting into SQLite
    let insertError: string | null = null
    let insertSuccess = false
    if (firstReceipt) {
      try {
        const { getDb } = await import('@/lib/db/client')
        const db = getDb()
        const stmt = db.prepare(`
          INSERT OR IGNORE INTO trust_receipts
            (id, contract_id, agent_id, agent_name, trust_score_before, trust_score_after,
             trust_delta, judge_score, escrow_status, task_hash, work_hash, signature, generated_at)
          VALUES
            (@id, @contract_id, @agent_id, @agent_name, @trust_score_before, @trust_score_after,
             @trust_delta, @judge_score, @escrow_status, @task_hash, @work_hash, @signature, @generated_at)
        `)
        stmt.run(firstReceipt)
        insertSuccess = true
        // Check if it's actually in DB now
        const row = db.prepare('SELECT id FROM trust_receipts WHERE id = ?').get(firstReceipt.id as string)
        insertSuccess = Boolean(row)
      } catch (e) {
        insertError = String(e)
      }
    }

    return NextResponse.json({
      receiptCount: values.length,
      firstReceiptKeys: firstReceipt ? Object.keys(firstReceipt) : null,
      firstReceiptSample: firstReceipt ? {
        id: firstReceipt.id,
        agent_id: firstReceipt.agent_id,
        escrow_status: firstReceipt.escrow_status,
        judge_score: firstReceipt.judge_score,
        has_work_hash: Boolean(firstReceipt.work_hash),
        has_signature: Boolean(firstReceipt.signature),
        has_task_hash: Boolean(firstReceipt.task_hash),
        generated_at: firstReceipt.generated_at,
      } : null,
      insertSuccess,
      insertError,
    })
  } catch (e) {
    return NextResponse.json({ error: String(e) })
  }
}
