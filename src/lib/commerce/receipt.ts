import { v4 as uuid } from 'uuid'
import { ecdsaSign } from '../crypto'
import { receiptQueries, TrustReceipt } from '../db/queries'

interface ReceiptInput {
  contractId: string
  agentId: string
  agentName: string
  taskHash: string
  workHash: string
  escrowStatus: 'RELEASED' | 'REFUNDED'
  judgeScore: number
  trustScoreBefore: number
  trustScoreAfter: number
  trustDelta: number
}

export function generateReceipt(input: ReceiptInput): TrustReceipt {
  const id = uuid()

  const payload = JSON.stringify({
    id,
    contract_id: input.contractId,
    agent_id: input.agentId,
    agent_name: input.agentName,
    task_hash: input.taskHash,
    work_hash: input.workHash,
    escrow_status: input.escrowStatus,
    judge_score: input.judgeScore,
    trust_score_before: input.trustScoreBefore,
    trust_score_after: input.trustScoreAfter,
    trust_delta: input.trustDelta,
  })

  const signature = ecdsaSign(payload)

  return receiptQueries.create({
    id,
    contract_id: input.contractId,
    agent_id: input.agentId,
    agent_name: input.agentName,
    trust_score_before: input.trustScoreBefore,
    trust_score_after: input.trustScoreAfter,
    trust_delta: input.trustDelta,
    judge_score: input.judgeScore,
    escrow_status: input.escrowStatus,
    task_hash: input.taskHash,
    work_hash: input.workHash,
    signature,
  })
}
