import { NextRequest, NextResponse } from 'next/server'
import { agentQueries, receiptQueries } from '@/lib/db/queries'
import { getDb } from '@/lib/db/client'

export const dynamic = 'force-dynamic'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ agentId: string }> }
) {
  const { agentId } = await params
  const agent = agentQueries.getById(agentId)

  if (!agent) {
    return NextResponse.json({ error: 'Agent not found' }, { status: 404 })
  }

  const recentReceipts = getDb()
    .prepare('SELECT * FROM trust_receipts WHERE agent_id = ? ORDER BY generated_at DESC LIMIT 5')
    .all(agentId) as Array<{ id: string; judge_score: number; trust_delta: number; escrow_status: string; generated_at: string }>

  return NextResponse.json({
    agentId: agent.id,
    agentName: agent.name,
    organization: agent.organization ?? null,
    source: agent.source ?? 'builtin',
    trustScore: parseFloat(agent.trust_score.toFixed(2)),
    trustGate: agent.trust_score >= 60 ? 'ELIGIBLE' : 'BLOCKED',
    minTrustRequired: 60,
    components: {
      escrowSuccessRate: parseFloat(agent.escrow_success_rate.toFixed(4)),
      avgJudgeScore: parseFloat(agent.avg_judge_score.toFixed(2)),
      reliabilityScore: parseFloat(agent.reliability_score.toFixed(4)),
    },
    formula: 'trust_score = 100 * (0.40 * escrow_success_rate + 0.40 * (avg_judge_score / 100) + 0.20 * reliability_score)',
    history: {
      totalContracts: agent.total_contracts,
      successfulContracts: agent.successful_contracts,
      totalRevenueCents: agent.total_revenue_cents,
    },
    recentReceipts: recentReceipts.map(r => ({
      receiptId: r.id,
      judgeScore: r.judge_score,
      trustDelta: r.trust_delta,
      escrowStatus: r.escrow_status,
      generatedAt: r.generated_at,
      verifyUrl: `/receipts/${r.id}`,
    })),
    verifyReceiptUrl: '/api/receipts/verify',
    updatedAt: new Date().toISOString(),
  })
}
