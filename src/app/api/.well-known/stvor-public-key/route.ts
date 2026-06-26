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
const payload = JSON.stringify({ id, contract_id, agent_id, agent_name, task_hash, work_hash, escrow_status, judge_score, trust_score_before, trust_score_after, trust_delta });
const sig = Buffer.from(receipt.signature.replace('ecdsa:', ''), 'base64');
console.log('valid:', crypto.verify('sha256', Buffer.from(payload), pubKey, sig));`,
    },
    spec: 'NIST P-256 (FIPS 186-4) — same curve used by TLS 1.3, Signal Protocol, and @stvor/sdk',
    pqcTransport: 'For quantum-resistant agent communication, see @stvor/sdk (npm) with pqc:true (ML-KEM-768 + X3DH)',
    updatedAt: new Date().toISOString(),
  })
}
