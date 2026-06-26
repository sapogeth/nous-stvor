export interface TrustReceipt {
  id: string
  contract_id: string
  agent_id: string
  agent_name: string
  trust_score_before: number
  trust_score_after: number
  trust_delta: number
  judge_score: number
  escrow_status: string
  task_hash: string
  work_hash: string
  signature: string
  generated_at: string
}

export interface AdaptationEntry {
  agentId: string
  agentName: string
  r1Score: number
  r2Score: number
  scoreDelta: number
  r1Price: number
  r2Price: number
  adaptationReason: string
}

export type StvorEvent =
  | { type: 'CONNECTED' }
  | { type: 'CONTRACT_CREATED'; data: { contractId: string; taskLabel?: string; taskDescription: string; budgetCents: number; taskHash: string; round: number } }
  | { type: 'ESCROW_FUNDED'; data: { contractId: string; amountCents: number; paymentIntentId: string } }
  | { type: 'BID_SUBMITTED'; data: { contractId: string; bidId: string; agentId: string; agentName: string; priceCents: number; round: number; expectedValue: number; model: string; adaptationReason?: string } }
  | { type: 'INFERENCE_STARTED'; data: { contractId: string; agentCount: number; model: string; parallelThreads: number; round?: number } }
  | { type: 'INFERENCE_COMPLETE'; data: { contractId: string; avgLatencyMs: number; parallelThreads: number; model?: string } }
  | { type: 'WORK_DELIVERED'; data: { bidId: string; agentId: string; agentName: string; workPreview: string; latencyMs: number; round: number; deliveryMethod?: 'webhook' | 'nim' } }
  | { type: 'JUDGE_STARTED'; data: { contractId: string; round: number } }
  | { type: 'BID_SCORED'; data: { bidId: string; agentId: string; agentName: string; judgeScore: number; breakdown: Record<string, number>; reasoning: string; round: number } }
  | { type: 'WINNER_SELECTED'; data: { contractId: string; winnerId: string; winnerName: string; score: number; priceCents: number; round: number } }
  | { type: 'ESCROW_RELEASED'; data: { contractId: string; agentId: string; agentName: string; amountCents: number; paymentIntentId: string; round: number } }
  | { type: 'TRUST_UPDATED'; data: { agentId: string; agentName: string; before: number; after: number; delta: number; round: number } }
  | { type: 'RECEIPT_GENERATED'; data: TrustReceipt }
  | { type: 'ROUND2_STARTING'; data: { contractId: string; message: string } }
  | { type: 'ADAPTATION_SUMMARY'; data: { contractId: string; adaptations: AdaptationEntry[] } }
  | { type: 'AGENT_INFERENCE_STARTED'; data: { agentId: string; agentName: string; round: number } }
  | { type: 'BUYER_REASONING'; data: { round: number; winnerName: string; winnerTrust: number; winnerScore: number; winnerPrice: number; reasoning: string } }
  | { type: 'TRUST_GATE_REJECTED'; data: { agentId: string; agentName: string; trustScore: number; minRequired: number; round: number } }
  | { type: 'DEMO_COMPLETE'; data: { contractId: string; contract2Id: string } }
  | { type: 'DEMO_ERROR'; data: { message: string } }
  // Attack demo events
  | { type: 'ATTACK_STARTED'; data: { contractId: string; originalTask: string; tamperedTask: string; originalHash: string } }
  | { type: 'ATTESTATION_FAILED'; data: { contractId: string; expectedHash: string; receivedHash: string; originalTask: string; tamperedTask: string } }
  | { type: 'ESCROW_HELD'; data: { contractId: string; amountCents: number; paymentIntentId: string; reason: string } }
  | { type: 'ATTACK_PREVENTED'; data: { contractId: string; amountSaved: number; attackType: string } }
  | { type: 'ATTESTATION_VERIFIED'; data: { contractId: string; taskHash: string; agentName: string } }
  | { type: 'ATTACK_DEMO_COMPLETE'; data: { contractId: string } }
  | { type: 'TRANSFER_INITIATED'; data: { contractId: string; agentName: string; recipientEmail: string; amountCents: number; note: string } }
  | { type: 'PQC_CHANNEL_ESTABLISHED'; data: {
      agentId: string
      agentName: string
      algorithm: string       // 'ML-KEM-768 + ECDH P-256 (Hybrid)'
      standard: string        // 'NIST FIPS 203'
      ekPreview: string       // first 40 chars of agent's encapsulation key
      ctPreview: string       // first 40 chars of KEM ciphertext
      kemCiphertextBytes: number  // 1088
      taskEncryption: string  // 'AES-256-GCM'
      hybridKdf: string       // 'HKDF-SHA256(ECDH_SS || ML-KEM_SS)'
      library: string         // '@noble/post-quantum'
    } }
