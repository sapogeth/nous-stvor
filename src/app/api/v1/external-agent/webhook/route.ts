import { NextRequest, NextResponse } from 'next/server'
import { nvidia, WORKER_MODEL } from '@/lib/nvidia/client'
import { sha256 } from '@/lib/crypto'
import { agentQueries } from '@/lib/db/queries'

export const dynamic = 'force-dynamic'

const ACME_SYSTEM_PROMPT = `You are Meridian, an autonomous quantitative risk analyst built by Acme Research LLC.
Your analytical style:
- Lead with a quantitative thesis (a single number: probability of loss, confidence interval, or risk-adjusted return)
- Use structured markdown with clear section headers (##)
- Every claim must reference a verifiable metric or named comparable (e.g., "TVL down 23% vs 30-day MA", "comparable to Aave v3 liquidation risk profile")
- Risk ratings use: [CRITICAL], [HIGH], [MEDIUM], [LOW] in brackets
- Final recommendation must include: action, confidence %, allocation sizing, and exit condition
- Signature closing: "— Meridian | Acme Research LLC | Nemotron-3 Ultra"

You are competing against other agents for this contract. Quality and specificity win escrow. Generic analysis loses.`

const ACME_ROUND2_PROMPT = `You are Meridian (Acme Research LLC) in Round 2.
You know you did not win Round 1. Your competitor likely had better specificity or stronger evidence.
This round: be more aggressive on data citations, add a second opinion on the highest-risk factor,
and structure the recommendation with explicit upside/downside scenarios.
End with: "— Meridian v2 | Acme Research LLC | Adapted from R1 feedback"`

export async function POST(req: NextRequest) {
  // Validate API key
  const apiKey = req.headers.get('x-stvor-api-key') ?? req.headers.get('x-stvor-apikey')
  if (!apiKey) {
    return NextResponse.json({ error: 'Missing X-Stvor-Api-Key' }, { status: 401 })
  }

  // Verify agent exists with this key
  const allAgents = agentQueries.getAll()
  const agent = allAgents.find(a => a.api_key === apiKey && a.source === 'external')
  if (!agent) {
    return NextResponse.json({ error: 'Unknown agent' }, { status: 401 })
  }

  let body: {
    contractId?: string
    taskDescription?: string
    taskHash?: string
    budgetCents?: number
    round?: number
  }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const { taskDescription, round = 1 } = body
  if (!taskDescription || typeof taskDescription !== 'string') {
    return NextResponse.json({ error: 'Missing taskDescription' }, { status: 400 })
  }

  const systemPrompt = round >= 2 ? ACME_ROUND2_PROMPT : ACME_SYSTEM_PROMPT

  try {
    const response = await nvidia.chat.completions.create({
      model: WORKER_MODEL,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: taskDescription },
      ],
      max_tokens: 1200,
      temperature: 0.65,
    })

    const workDelivered = response.choices[0]?.message?.content ?? 'No response generated.'
    const workHash = sha256(workDelivered)

    return NextResponse.json({ workDelivered, workHash })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'NIM inference failed'
    return NextResponse.json({ error: message }, { status: 502 })
  }
}
