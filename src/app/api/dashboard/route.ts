import { NextResponse } from 'next/server'
import { agentQueries, syncTrustScoresFromRedis } from '@/lib/db/queries'
import { getDb } from '@/lib/db/client'

export const dynamic = 'force-dynamic'

export async function GET() {
  await syncTrustScoresFromRedis()
  const db = getDb()

  // ── Top Agents ────────────────────────────────────────────────────────────
  const agents = agentQueries.getAll()
  const topAgents = agents
    .filter(a => a.source !== 'historical')
    .slice(0, 8)
    .map(a => ({
      id: a.id,
      name: a.name,
      organization: a.organization ?? null,
      trustScore: parseFloat(a.trust_score.toFixed(1)),
      totalContracts: a.total_contracts,
      successfulContracts: a.successful_contracts,
      totalRevenueCents: a.total_revenue_cents,
    }))

  const maxRevenue = Math.max(...topAgents.map(a => a.totalRevenueCents), 1)

  // ── Recent Receipts ───────────────────────────────────────────────────────
  const recentReceipts = (db.prepare(
    `SELECT tr.id, tr.agent_id, tr.agent_name, tr.judge_score, tr.escrow_status,
            tr.trust_delta, tr.generated_at, a.organization
     FROM trust_receipts tr
     LEFT JOIN agents a ON a.id = tr.agent_id
     WHERE tr.agent_id != 'hermes-veteran'
     ORDER BY tr.generated_at DESC LIMIT 8`
  ).all() as Array<{
    id: string; agent_id: string; agent_name: string; judge_score: number
    escrow_status: string; trust_delta: number; generated_at: string
    organization: string | null
  }>).map(r => ({
    id: r.id.slice(5, 13).toUpperCase(),
    fullId: r.id,
    agentName: r.agent_name,
    agentId: r.agent_id,
    organization: r.organization ?? 'Independent',
    judgeScore: Math.round(r.judge_score),
    escrowStatus: r.escrow_status,
    trustDelta: parseFloat(r.trust_delta.toFixed(1)),
    generatedAt: r.generated_at,
  }))

  // ── Contracts summary ─────────────────────────────────────────────────────
  const contracts = db.prepare('SELECT status, budget_cents, created_at FROM contracts ORDER BY created_at ASC').all() as Array<{
    status: string; budget_cents: number; created_at: string
  }>

  const total      = contracts.length
  const complete   = contracts.filter(c => c.status === 'COMPLETE').length
  const cancelled  = contracts.filter(c => c.status === 'CANCELLED').length
  const held       = contracts.filter(c => c.status === 'HELD').length
  const inProgress = total - complete - cancelled - held

  // ── Escrow volume — last 7 time buckets ───────────────────────────────────
  // Group completed contracts by date for the line chart
  const completedByDate: Record<string, number> = {}
  for (const c of contracts.filter(c => c.status === 'COMPLETE')) {
    const day = c.created_at?.slice(0, 10) ?? 'unknown'
    completedByDate[day] = (completedByDate[day] ?? 0) + c.budget_cents
  }
  const allDays = Object.keys(completedByDate).sort()

  // If fewer than 6 data points, pad with synthetic growth for demo
  const volumePoints: { label: string; valueCents: number }[] = []
  if (allDays.length >= 2) {
    for (const d of allDays.slice(-7)) {
      const date = new Date(d)
      const label = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
      volumePoints.push({ label, valueCents: completedByDate[d] })
    }
  } else {
    // Seed demo volume data when no real runs yet
    const base = [0, 4500, 7200, 5800, 9100, 12400, 8700]
    for (let i = 0; i < 7; i++) {
      const d = new Date(); d.setDate(d.getDate() - (6 - i))
      const label = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
      volumePoints.push({ label, valueCents: base[i] })
    }
  }

  const totalVolumeCents = contracts.filter(c => c.status === 'COMPLETE').reduce((s, c) => s + c.budget_cents, 0)

  return NextResponse.json({
    topAgents: topAgents.map(a => ({ ...a, revenuePct: Math.round((a.totalRevenueCents / maxRevenue) * 100) })),
    recentReceipts,
    disputes: { total, complete, cancelled, held, inProgress },
    volumePoints,
    totalVolumeCents,
    updatedAt: new Date().toISOString(),
  })
}
