import { stripe } from './client'

function isStripeDemo(): boolean {
  const key = process.env.STRIPE_SECRET_KEY ?? ''
  return !key || key.includes('placeholder') || key.includes('your_stripe') || key === 'sk_test_placeholder'
}

export async function createEscrowPaymentIntent(amountCents: number, contractId: string) {
  if (isStripeDemo()) {
    return {
      id: `pi_demo_${Date.now()}`,
      status: 'requires_capture',
      amount: amountCents,
      currency: 'usd',
    }
  }

  // Create with explicit card-only PM types, then confirm with test card → requires_capture
  return stripe.paymentIntents.create({
    amount: amountCents,
    currency: 'usd',
    capture_method: 'manual',
    payment_method_types: ['card'],
    confirm: true,
    payment_method: 'pm_card_visa',
    metadata: { contractId, purpose: 'stvor_escrow' },
    description: `Stvor escrow: contract ${contractId.slice(0, 8)}`,
  })
}

export async function captureEscrowPayment(paymentIntentId: string, captureCents: number) {
  if (isStripeDemo() || paymentIntentId.startsWith('pi_demo_')) {
    return { id: paymentIntentId, status: 'succeeded', amount_captured: captureCents }
  }

  return stripe.paymentIntents.capture(paymentIntentId, {
    amount_to_capture: captureCents,
  })
}

export async function refundEscrowPayment(paymentIntentId: string) {
  if (isStripeDemo() || paymentIntentId.startsWith('pi_demo_')) {
    return { id: `re_demo_${Date.now()}`, status: 'succeeded' }
  }

  return stripe.refunds.create({ payment_intent: paymentIntentId })
}
