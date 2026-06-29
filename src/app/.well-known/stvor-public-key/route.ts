import { NextResponse } from 'next/server'
import { getPublicKeyInfo } from '@/lib/crypto'

export const dynamic = 'force-dynamic'

export async function GET() {
  const info = getPublicKeyInfo()

  if (!info) {
    return NextResponse.json({ error: 'ECDSA keys not configured' }, { status: 503 })
  }

  return NextResponse.json({
    algorithm:    'ECDSA P-256 (prime256v1, SHA-256)',
    publicKey:    info.b64,
    publicKeyPem: info.pem,
    usage:        'Verify Stvor trust receipt signatures offline — no Stvor server required',
    verifyExample: {
      node: `const crypto = require('crypto');
const pubKey = crypto.createPublicKey({
  key: Buffer.from('${info.b64}', 'base64'),
  format: 'der', type: 'spki'
});
const { signature, generated_at, ...payload } = receipt;
const sig = Buffer.from(signature.replace('ecdsa:', ''), 'base64');
console.log('valid:', crypto.verify('sha256', Buffer.from(JSON.stringify(payload)), pubKey, sig));`,
    },
    spec: 'ATS-1 v0.1.0 — NIST P-256 (FIPS 186-4). Same curve used by TLS 1.3, Signal Protocol.',
    updatedAt: new Date().toISOString(),
  })
}
