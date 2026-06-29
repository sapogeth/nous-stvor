import { NextResponse } from 'next/server'
import { syncTrustScoresFromRedis } from '@/lib/db/queries'
import { getDb } from '@/lib/db/client'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    // Step 1: Run the exact same sync that /receipts page runs
    await syncTrustScoresFromRedis()

    // Step 2: Run the exact same query that /receipts page runs
    const db = getDb()
    const receipts = db.prepare(
      `SELECT id, agent_id, agent_name, judge_score, escrow_status, generated_at
       FROM trust_receipts WHERE agent_id != 'hermes-veteran' ORDER BY generated_at DESC`
    ).all() as Array<{ id: string; agent_id: string; agent_name: string; judge_score: number; escrow_status: string; generated_at: string }>

    // Also check total rows (including hermes-veteran)
    const totalRows = (db.prepare('SELECT COUNT(*) as c FROM trust_receipts').get() as { c: number }).c

    return NextResponse.json({
      receiptsAfterSync: receipts.length,
      totalRowsInTable: totalRows,
      firstReceipt: receipts[0] ?? null,
    })
  } catch (e) {
    return NextResponse.json({ error: String(e) })
  }
}
