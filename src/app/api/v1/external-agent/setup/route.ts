import { NextRequest, NextResponse } from 'next/server'
import { agentQueries } from '@/lib/db/queries'
import { v4 as uuid } from 'uuid'

export const dynamic = 'force-dynamic'

const ACME_AGENT_ID = 'acme-meridian-ext'

export async function POST(req: NextRequest) {
  const existing = agentQueries.getById(ACME_AGENT_ID)
  if (existing) {
    return NextResponse.json({
      message: 'Acme Research LLC agent already registered.',
      agentId: existing.id,
      agentName: existing.name,
      trustScore: existing.trust_score,
      endpointUrl: existing.endpoint_url,
      source: existing.source,
    })
  }

  // Determine base URL from the request — works on Railway, Vercel, and localhost
  const host = req.headers.get('host') ?? 'localhost:3000'
  const proto = host.includes('localhost') ? 'http' : 'https'
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? `${proto}://${host}`
  const endpointUrl = `${baseUrl}/api/v1/external-agent/webhook`

  const apiKey = `stvor_ext_${uuid().replace(/-/g, '').slice(0, 24)}`

  const agent = agentQueries.register({
    id: ACME_AGENT_ID,
    name: 'Meridian (Acme Research)',
    organization: 'Acme Research LLC',
    specialty: 'Quantitative Risk Modeling',
    endpoint_url: endpointUrl,
    api_key: apiKey,
    system_prompt: '',
    initial_trust: 68.5,
    pqc: false,
  })

  return NextResponse.json({
    message: 'Acme Research LLC agent registered. It will compete in the next demo run.',
    agentId: agent.id,
    agentName: agent.name,
    organization: 'Acme Research LLC',
    trustScore: agent.trust_score,
    trustGate: 'ELIGIBLE',
    endpointUrl,
    deliveryMethod: 'webhook → NIM (Nemotron-3 Ultra)',
    note: 'This agent receives tasks via webhook at its endpoint_url. It uses a different system prompt and analytical style than built-in agents — demonstrating cross-operator trust.',
  }, { status: 201 })
}

export async function GET() {
  const agent = agentQueries.getById(ACME_AGENT_ID)
  if (!agent) {
    return NextResponse.json({ registered: false, message: 'Acme Research LLC agent not registered. POST to this endpoint to register.' })
  }
  return NextResponse.json({
    registered: true,
    agentId: agent.id,
    agentName: agent.name,
    organization: agent.organization,
    trustScore: agent.trust_score,
    totalContracts: agent.total_contracts,
    successfulContracts: agent.successful_contracts,
    endpointUrl: agent.endpoint_url,
    source: agent.source,
  })
}
