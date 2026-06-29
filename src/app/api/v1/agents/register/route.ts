import { NextRequest, NextResponse } from 'next/server'
import { v4 as uuid } from 'uuid'
import { agentQueries } from '@/lib/db/queries'
import { redisSaveExternalAgent } from '@/lib/redis'

export const dynamic = 'force-dynamic'

function generateApiKey(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  let token = ''
  for (let i = 0; i < 32; i++) token += chars[Math.floor(Math.random() * chars.length)]
  return `stvor_live_${token}`
}

function buildSystemPrompt(strategy: number, specialty: string): string {
  if (strategy <= 30) {
    return `You are a fast, efficient AI analysis agent specializing in ${specialty}. Prioritize speed and clarity. Be concise, structured, and direct. Lead with the most important findings. No verbose preamble.`
  }
  if (strategy >= 70) {
    return `You are a premium, thorough AI analysis agent specializing in ${specialty}. Provide exhaustive, evidence-backed analysis. Cover every angle with specific on-chain metrics, quantified risk factors, and professional-grade depth. Be the most comprehensive analysis in the room.`
  }
  return `You are a balanced AI analysis agent specializing in ${specialty}. Deliver thorough yet efficient analysis — structured, evidence-backed, with clear recommendations and specific supporting data. Quality over verbosity.`
}

export async function POST(req: NextRequest) {
  let body: Record<string, unknown>
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const name = (body.name as string | undefined)?.trim()
  if (!name || name.length < 2) {
    return NextResponse.json({ error: 'name is required (min 2 chars)' }, { status: 400 })
  }
  if (name.length > 64) {
    return NextResponse.json({ error: 'name must be under 64 chars' }, { status: 400 })
  }

  const organization = ((body.organization as string | undefined) ?? 'Independent').trim().slice(0, 64)
  const specialty    = ((body.specialty   as string | undefined) ?? 'General Purpose AI Agent').trim().slice(0, 128)
  const endpoint_url = ((body.endpoint_url as string | undefined) ?? '').trim().slice(0, 256)

  // arena=true: human-submitted agent, gets system prompt + higher initial trust
  const isArena = body.arena === true
  const strategyValue = typeof body.strategy_value === 'number'
    ? Math.max(0, Math.min(100, body.strategy_value))
    : 50
  const pqcEnabled = body.pqc === true

  const system_prompt = isArena ? buildSystemPrompt(strategyValue, specialty) : ''
  const initial_trust = 65.0

  const agentId = `ext-${uuid()}`
  const apiKey  = generateApiKey()

  const agent = agentQueries.register({
    id: agentId,
    name,
    organization,
    specialty,
    endpoint_url,
    api_key: apiKey,
    system_prompt,
    initial_trust,
    pqc: pqcEnabled,
  })

  // Persist to Redis so the agent survives Vercel cold starts / new function instances
  redisSaveExternalAgent({
    id: agentId, name, organization, specialty, endpoint_url,
    api_key: apiKey, system_prompt, initial_trust, pqc: pqcEnabled,
  }).catch(() => {})

  return NextResponse.json({
    agentId: agent.id,
    apiKey,
    agentName: agent.name,
    organization,
    specialty,
    trustScore: agent.trust_score,
    trustGate: agent.trust_score >= 60 ? 'ELIGIBLE' : 'BUILDING',
    trustGateMinimum: 60,
    status: 'REGISTERED',
    pqcEnabled,
    pqcProtocol: pqcEnabled ? 'ML-KEM-768 + X3DH (NIST FIPS 203) via @stvor/sdk' : null,
    message: isArena
      ? `Welcome to the Arena, ${name}! Your agent starts at trust_score: ${initial_trust}. Run the demo to compete for real contracts.${pqcEnabled ? ' PQC transport enabled — all messages use ML-KEM-768 hybrid encryption.' : ''}`
      : `Welcome to Stvor, ${name}. Your agent starts at trust_score: 65.0 (ELIGIBLE). Complete contracts to build reputation into the PREFERRED tier (80+).`,
    verifyUrl: `/api/v1/trust/${agentId}`,
    webhookProtocol: {
      description: 'Stvor sends tasks to your endpoint_url. Respond with your work result.',
      taskPayload: {
        contractId: '<uuid>',
        taskDescription: '<string>',
        taskHash: '<sha256-of-task>',
        evaluationCriteria: '<string>',
        budgetCents: '<number>',
        round: 1,
      },
      expectedResponse: {
        workDelivered: '<your deliverable as a string>',
        workHash: '<sha256-of-workDelivered — Stvor verifies this before releasing escrow>',
      },
      escrowRelease: 'Stvor verifies workHash == sha256(workDelivered). On match: payment captured. On mismatch: payment cancelled, trust_score −15pts.',
    },
    trustFormula: 'trust_score = 100 × (0.40 × escrow_success_rate + 0.40 × (avg_judge_score / 100) + 0.20 × reliability_score)',
    nextSteps: isArena
      ? [
          'Go to /demo and click "Run Economy Demo" — your agent will compete',
          `If your agent wins, payment is initiated to: ${organization}`,
          `View your live trust score: GET /api/v1/trust/${agentId}`,
          'Earn ECDSA P-256 receipts — portable proof of quality across every marketplace',
        ]
      : [
          `View your live trust score: GET /api/v1/trust/${agentId}`,
          'Set endpoint_url to receive contract tasks (webhook protocol above)',
          'Complete contracts to build trust_score into the PREFERRED tier (80+)',
          'Earn ECDSA P-256 receipts — portable proof of quality across every marketplace',
        ],
    registeredAt: new Date().toISOString(),
  }, { status: 201 })
}
