import { NextResponse } from 'next/server'
import { agentQueries, syncTrustScoresFromRedis } from '@/lib/db/queries'
import { redisGetExternalAgents } from '@/lib/redis'

export const dynamic = 'force-dynamic'

export async function GET() {
  // Sync trust scores and external agents from Redis on every leaderboard load
  // so data survives Vercel cold starts and page refreshes
  await syncTrustScoresFromRedis()
  const redisAgents = await redisGetExternalAgents()
  for (const ra of redisAgents) {
    if (!agentQueries.getById(ra.id)) {
      try {
        agentQueries.register({
          id: ra.id, name: ra.name, organization: ra.organization,
          specialty: ra.specialty, endpoint_url: ra.endpoint_url,
          api_key: ra.api_key, system_prompt: ra.system_prompt,
          initial_trust: ra.initial_trust, pqc: ra.pqc,
        })
      } catch { /* already exists */ }
    }
  }

  const agents = agentQueries.getAll()

  return NextResponse.json({
    agents: agents.map(a => ({
      agentId: a.id,
      agentName: a.name,
      organization: a.organization ?? null,
      source: a.source ?? 'builtin',
      trustScore: parseFloat(a.trust_score.toFixed(2)),
      trustGate: a.trust_score >= 60 ? 'ELIGIBLE' : 'BLOCKED',
      totalContracts: a.total_contracts,
      escrowSuccessRate: parseFloat(a.escrow_success_rate.toFixed(4)),
      avgJudgeScore: parseFloat(a.avg_judge_score.toFixed(2)),
      verifyUrl: `/api/v1/trust/${a.id}`,
    })).sort((a, b) => b.trustScore - a.trustScore),
    formula: 'trust_score = 100 * (0.40 * escrow_success_rate + 0.40 * (avg_judge_score / 100) + 0.20 * reliability_score)',
    trustGateMinimum: 60,
    verifyReceiptUrl: '/api/receipts/verify',
    updatedAt: new Date().toISOString(),
  })
}
