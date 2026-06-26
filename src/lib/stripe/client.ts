import Stripe from 'stripe'

const globalKey = '__stvor_stripe__'
declare global {
  // eslint-disable-next-line no-var
  var __stvor_stripe__: Stripe | undefined
}

export const stripe: Stripe = global[globalKey] ?? (global[globalKey] = new Stripe(
  process.env.STRIPE_SECRET_KEY ?? 'sk_test_placeholder',
  { apiVersion: '2025-02-24.acacia' }
))
