import { NextRequest, NextResponse } from 'next/server'
import { receiptQueries } from '@/lib/db/queries'
import { ecdsaVerify, getPublicKeyInfo } from '@/lib/crypto'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  const { receiptId, receiptData } = await req.json()

  // Try DB first; fall back to client-supplied receipt data (for Vercel ephemeral SQLite)
  let receipt = receiptQueries.getById(receiptId)
  if (!receipt && receiptData && receiptData.id === receiptId) {
    receipt = receiptData
  }

  if (!receipt) {
    return NextResponse.json({ valid: false, reason: 'Receipt not found in active database.' }, { status: 404 })
  }

  const payload = JSON.stringify({
    id: receipt.id,
    contract_id: receipt.contract_id,
    agent_id: receipt.agent_id,
    agent_name: receipt.agent_name,
    task_hash: receipt.task_hash,
    work_hash: receipt.work_hash,
    escrow_status: receipt.escrow_status,
    judge_score: receipt.judge_score,
    trust_score_before: receipt.trust_score_before,
    trust_score_after: receipt.trust_score_after,
    trust_delta: receipt.trust_delta,
  })

  const valid = ecdsaVerify(payload, receipt.signature)
  const pkInfo = getPublicKeyInfo()
  const isEcdsa = receipt.signature.startsWith('ecdsa:')

  return NextResponse.json({
    valid,
    receiptId: receipt.id,
    agentName: receipt.agent_name,
    judgeScore: receipt.judge_score,
    escrowStatus: receipt.escrow_status,
    trustDelta: receipt.trust_delta,
    generatedAt: receipt.generated_at,
    signatureAlgorithm: isEcdsa ? 'ECDSA P-256 (SHA-256)' : 'HMAC-SHA256 (legacy)',
    publicKeyUrl: '/api/.well-known/stvor-public-key',
    verifyOffline: isEcdsa ? 'node -e "const c=require(\'crypto\');const pub=require(\'crypto\').createPublicKey({key:Buffer.from(\'<STVOR_EC_PUBLIC_KEY_B64>\',\'base64\'),format:\'der\',type:\'spki\'});console.log(c.verify(\'sha256\',Buffer.from(JSON.stringify(PAYLOAD)),pub,Buffer.from(SIG,\'base64\')))"' : null,
    reason: valid ? 'Signature verified. Receipt is authentic and tamper-proof.' : 'Signature mismatch. Receipt may be tampered.',
  })
}
