import { NextRequest, NextResponse } from 'next/server'
import { contractQueries, bidQueries } from '@/lib/db/queries'
import { transitionContract } from '@/lib/commerce/escrow'
import { captureEscrowPayment } from '@/lib/stripe/payments'
import { sha256 } from '@/lib/crypto'

export const dynamic = 'force-dynamic'

// POST /api/v1/escrow/release
// Body: { contractId, winnerBidId, workDelivered }
// Verifies sha256(workDelivered) === bid.work_hash, then captures Stripe payment.
export async function POST(req: NextRequest) {
  let body: Record<string, unknown>
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const { contractId, winnerBidId, workDelivered } = body as {
    contractId?: string
    winnerBidId?: string
    workDelivered?: string
  }

  if (!contractId || !winnerBidId || !workDelivered) {
    return NextResponse.json({ error: 'contractId, winnerBidId, and workDelivered are required' }, { status: 400 })
  }

  const contract = contractQueries.getById(contractId)
  if (!contract) return NextResponse.json({ error: `Contract "${contractId}" not found` }, { status: 404 })
  if (!['FUNDED', 'SUBMITTED'].includes(contract.status)) {
    return NextResponse.json({
      error: `Contract is "${contract.status}" — can only release from FUNDED or SUBMITTED`,
    }, { status: 409 })
  }

  const bid = bidQueries.getById(winnerBidId)
  if (!bid || bid.contract_id !== contractId) {
    return NextResponse.json({ error: `Bid "${winnerBidId}" not found on contract "${contractId}"` }, { status: 404 })
  }

  // Attestation: verify hash before releasing funds
  const deliveredHash = sha256(workDelivered)
  if (bid.work_hash && bid.work_hash !== deliveredHash) {
    return NextResponse.json({
      error: 'Attestation failed: sha256(workDelivered) does not match recorded work_hash',
      expectedHash: bid.work_hash,
      receivedHash: deliveredHash,
      action: 'Funds withheld. Use POST /api/v1/escrow/hold to cancel and return funds.',
    }, { status: 422 })
  }

  if (contract.status === 'FUNDED') {
    transitionContract(contractId, 'SUBMITTED')
  }

  const paymentIntentId = contract.stripe_payment_intent_id!
  const captured = await captureEscrowPayment(paymentIntentId, bid.price_cents)
  transitionContract(contractId, 'COMPLETE', { winner_agent_id: bid.agent_id })

  return NextResponse.json({
    contractId,
    winnerBidId,
    agentId: bid.agent_id,
    amountCapturedCents: bid.price_cents,
    paymentIntentId,
    stripeStatus: (captured as { status?: string }).status ?? 'succeeded',
    attestation: {
      verified: true,
      workHash: deliveredHash,
    },
    status: 'COMPLETE',
    message: 'Attestation passed. Escrow released and payment captured.',
  })
}
