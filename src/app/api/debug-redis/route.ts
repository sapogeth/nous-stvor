import { NextResponse } from 'next/server'
import { getDb } from '@/lib/db/client'
import { redisGetReceipts } from '@/lib/redis'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    // Call redisGetReceipts directly (same as syncTrustScoresFromRedis does internally)
    const receipts = await redisGetReceipts()

    const db = getDb()
    const totalRows = (db.prepare('SELECT COUNT(*) as c FROM trust_receipts').get() as { c: number }).c

    // Try inserting all receipts and count successes/failures
    let inserted = 0
    let skipped = 0
    let errors: string[] = []

    const insertReceipt = db.prepare(`
      INSERT OR IGNORE INTO trust_receipts
        (id, contract_id, agent_id, agent_name, trust_score_before, trust_score_after,
         trust_delta, judge_score, escrow_status, task_hash, work_hash, signature, generated_at)
      VALUES
        (@id, @contract_id, @agent_id, @agent_name, @trust_score_before, @trust_score_after,
         @trust_delta, @judge_score, @escrow_status, @task_hash, @work_hash, @signature, @generated_at)
    `)

    for (const r of receipts) {
      try {
        const result = insertReceipt.run(r)
        if (result.changes > 0) inserted++
        else skipped++
      } catch (e) {
        errors.push(String(e))
      }
    }

    const afterRows = (db.prepare('SELECT COUNT(*) as c FROM trust_receipts WHERE agent_id != ?').get('hermes-veteran') as { c: number }).c

    return NextResponse.json({
      redisReceiptCount: receipts.length,
      rowsBeforeInsert: totalRows,
      inserted,
      skipped,
      errors: errors.slice(0, 3),
      nonVeteranRowsAfter: afterRows,
      firstReceipt: receipts[0] ? { id: receipts[0].id, agent_id: receipts[0].agent_id, escrow_status: receipts[0].escrow_status } : null,
    })
  } catch (e) {
    return NextResponse.json({ error: String(e) })
  }
}
