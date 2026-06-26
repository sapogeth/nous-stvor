import { NextRequest, NextResponse } from 'next/server'
import { contractQueries } from '@/lib/db/queries'
import { transitionContract } from '@/lib/commerce/escrow'
import { createEscrowPaymentIntent } from '@/lib/stripe/payments'

export const dynamic = 'force-dynamic'

// POST /api/v1/escrow/fund
// Body: { contractId }
// Holds funds in Stripe escrow (capture_method: manual). No charge until release.
export async function POST(req: NextRequest) {
  let body: Record<string, unknown>
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const { contractId } = body as { contractId?: string }
  if (!contractId || typeof contractId !== 'string') {
    return NextResponse.json({ error: 'contractId is required' }, { status: 400 })
  }

  const contract = contractQueries.getById(contractId)
  if (!contract) {
    return NextResponse.json({ error: `Contract "${contractId}" not found` }, { status: 404 })
  }
  if (contract.status !== 'OPEN') {
    return NextResponse.json({
      error: `Contract is "${contract.status}", not OPEN — cannot fund`,
      currentStatus: contract.status,
    }, { status: 409 })
  }

  const paymentIntent = await createEscrowPaymentIntent(contract.budget_cents, contractId)
  transitionContract(contractId, 'FUNDED', { stripe_payment_intent_id: paymentIntent.id })

  return NextResponse.json({
    contractId,
    paymentIntentId: paymentIntent.id,
    status: 'FUNDED',
    amountCents: contract.budget_cents,
    stripeStatus: paymentIntent.status,
    message: 'Funds held in escrow. No charge until escrow is released. Next: POST /api/v1/escrow/release when work is attested.',
  })
}
