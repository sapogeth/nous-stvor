import { NextRequest, NextResponse } from 'next/server'
import { v4 as uuid } from 'uuid'
import { contractQueries, agentQueries } from '@/lib/db/queries'
import { sha256 } from '@/lib/crypto'

export const dynamic = 'force-dynamic'

// POST /api/v1/contracts
// Body: { buyerAgentId, taskDescription, budgetCents, evaluationCriteria? }
// Returns: { contractId, taskHash, status, budgetCents }
export async function POST(req: NextRequest) {
  let body: Record<string, unknown>
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const { buyerAgentId, taskDescription, budgetCents, evaluationCriteria } = body as {
    buyerAgentId?: string
    taskDescription?: string
    budgetCents?: number
    evaluationCriteria?: unknown
  }

  if (!buyerAgentId || typeof buyerAgentId !== 'string') {
    return NextResponse.json({ error: 'buyerAgentId is required' }, { status: 400 })
  }
  if (!taskDescription || typeof taskDescription !== 'string' || taskDescription.length < 10) {
    return NextResponse.json({ error: 'taskDescription must be at least 10 characters' }, { status: 400 })
  }
  if (!budgetCents || typeof budgetCents !== 'number' || budgetCents < 100) {
    return NextResponse.json({ error: 'budgetCents must be >= 100 (= $1.00)' }, { status: 400 })
  }

  const buyer = agentQueries.getById(buyerAgentId)
  if (!buyer) {
    return NextResponse.json({ error: `No agent found with id "${buyerAgentId}"` }, { status: 404 })
  }

  const contractId = uuid()
  const taskHash = sha256(taskDescription)
  const criteria = evaluationCriteria ? JSON.stringify(evaluationCriteria) : '[]'

  const contract = contractQueries.create({
    id: contractId,
    task_description: taskDescription,
    task_hash: taskHash,
    evaluation_criteria: criteria,
    budget_cents: budgetCents,
    status: 'OPEN',
    buyer_agent_id: buyerAgentId,
    round: 1,
  })

  return NextResponse.json({
    contractId: contract.id,
    taskHash,
    status: contract.status,
    budgetCents: contract.budget_cents,
    buyerAgentId,
    createdAt: contract.created_at,
    message: 'Contract created. Next: POST /api/v1/escrow/fund with contractId to hold funds in escrow.',
  }, { status: 201 })
}

// GET /api/v1/contracts — list all contracts
export async function GET() {
  const contracts = contractQueries.getAll()
  return NextResponse.json({ contracts, count: contracts.length })
}
