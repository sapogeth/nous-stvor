import { NextRequest, NextResponse } from 'next/server'
import { agentQueries } from '@/lib/db/queries'
import { getDb } from '@/lib/db/client'

export const dynamic = 'force-dynamic'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ agentId: string }> }
) {
  const { agentId } = await params
  const agent = agentQueries.getById(agentId)

  if (!agent) {
    return NextResponse.json({ error: 'Agent not found' }, { status: 404 })
  }

  const { searchParams } = new URL(req.url)
  const limit  = Math.min(parseInt(searchParams.get('limit')  ?? '20'), 100)
  const offset = parseInt(searchParams.get('offset') ?? '0')

  const receipts = getDb()
    .prepare(`SELECT * FROM trust_receipts WHERE agent_id = ? ORDER BY generated_at DESC LIMIT ? OFFSET ?`)
    .all(agentId, limit, offset) as Array<Record<string, unknown>>

  const total = (getDb()
    .prepare('SELECT COUNT(*) as count FROM trust_receipts WHERE agent_id = ?')
    .get(agentId) as { count: number }).count

  return NextResponse.json({
    agentId,
    agentName: agent.name,
    trustScore: parseFloat(agent.trust_score.toFixed(2)),
    total,
    limit,
    offset,
    receipts: receipts.map(r => ({
      ...r,
      verifyUrl: `/api/receipts/verify?id=${r.id}`,
      receiptUrl: `/receipts/${r.id}`,
    })),
    exportNote: 'ATS-1 §5 — import this array into any ATS-1-compatible marketplace to bootstrap trust without starting from 65.',
  })
}
