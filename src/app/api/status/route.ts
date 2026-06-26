import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET() {
  const stripeKey = process.env.STRIPE_SECRET_KEY ?? ''
  const stripeDemoMode = !stripeKey || stripeKey.includes('placeholder') || stripeKey.includes('your_stripe') || stripeKey === 'sk_test_placeholder'
  const stripeTestMode = stripeKey.startsWith('sk_test_')
  const stripeLiveMode = stripeKey.startsWith('sk_live_')

  const nvidiaKey = process.env.NVIDIA_API_KEY ?? ''
  const ecKey = process.env.STVOR_EC_PRIVATE_KEY_B64 ?? ''

  return NextResponse.json({
    stripe: {
      mode: stripeDemoMode ? 'demo' : stripeTestMode ? 'test' : stripeLiveMode ? 'live' : 'unknown',
      configured: !stripeDemoMode,
      note: stripeDemoMode
        ? 'Stripe not configured — payments are simulated. Set STRIPE_SECRET_KEY to enable real escrow.'
        : stripeTestMode
          ? 'Stripe test mode active — real PaymentIntents, no real money.'
          : 'Stripe live mode active.',
    },
    nvidia: {
      configured: nvidiaKey.length > 0,
    },
    ecdsa: {
      configured: ecKey.length > 0,
      note: ecKey.length > 0
        ? 'ECDSA P-256 keys configured — receipts are fully offline-verifiable.'
        : 'ECDSA keys not set — receipts use HMAC-SHA256 fallback (server-side only).',
    },
    timestamp: new Date().toISOString(),
  })
}
