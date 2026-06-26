import { NextRequest, NextResponse } from 'next/server'
import { contractQueries } from '@/lib/db/queries'
import { transitionContract } from '@/lib/commerce/escrow'
import { refundEscrowPayment } from '@/lib/stripe/payments'

export const dynamic = 'force-dynamic'

// POST /api/v1/escrow/hold
// Body: { contractId, reason }
// Cancels escrow and refunds buyer on attestation failure or dispute.
export async function POST(req: NextRequest) {
  let body: Record<string, unknown>
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const { contractId, reason } = body as { contractId?: string; reason?: string }
  if (!contractId || typeof contractId !== 'string') {
    return NextResponse.json({ error: 'contractId is required' }, { status: 400 })
  }

  const contract = contractQueries.getById(contractId)
  if (!contract) return NextResponse.json({ error: `Contract "${contractId}" not found` }, { status: 404 })
  if (contract.status === 'COMPLETE' || contract.status === 'DISPUTED') {
    return NextResponse.json({
      error: `Contract is already "${contract.status}" — cannot hold`,
    }, { status: 409 })
  }

  const paymentIntentId = contract.stripe_payment_intent_id
  let refundId: string | null = null

  if (paymentIntentId) {
    const refund = await refundEscrowPayment(paymentIntentId)
    refundId = (refund as { id?: string }).id ?? null
  }

  transitionContract(contractId, 'DISPUTED')

  return NextResponse.json({
    contractId,
    status: 'DISPUTED',
    refundId,
    paymentIntentId,
    reason: reason ?? 'No reason provided',
    message: 'Escrow cancelled. Funds returned to buyer. Seller trust score will be penalized if attestation failed.',
  })
}
