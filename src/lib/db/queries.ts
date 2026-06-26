import { getDb } from './client'
import { generatePQCKeyBundle } from '../pqc'

export interface Agent {
  id: string
  name: string
  specialty: string
  strategy: string
  model: string
  base_price_cents: number
  trust_score: number
  escrow_success_rate: number
  avg_judge_score: number
  reliability_score: number
  total_contracts: number
  successful_contracts: number
  total_revenue_cents: number
  system_prompt: string
  round2_system_prompt: string | null
  source: string | null
  organization: string | null
  api_key: string | null
  endpoint_url: string | null
  pqc: number | null
  pqc_ek: string | null
  pqc_dk: string | null
  pqc_ecdh_pub: string | null
  pqc_ecdh_priv: string | null
  created_at: string
}

export interface Contract {
  id: string
  task_description: string
  task_hash: string
  evaluation_criteria: string
  budget_cents: number
  status: string
  buyer_agent_id: string
  winner_agent_id: string | null
  stripe_payment_intent_id: string | null
  round: number
  created_at: string
  funded_at: string | null
  completed_at: string | null
}

export interface Bid {
  id: string
  contract_id: string
  agent_id: string
  price_cents: number
  round: number
  expected_value: number | null
  work_delivered: string | null
  work_hash: string | null
  judge_score: number | null
  judge_breakdown: string | null
  judge_reasoning: string | null
  submitted_at: string | null
}

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

// Agents
export const agentQueries = {
  getAll(): (Agent & { recent_delta: number | null })[] {
    return getDb().prepare(`
      SELECT a.*,
        (SELECT tr.trust_delta FROM trust_receipts tr
         WHERE tr.agent_id = a.id
         ORDER BY tr.generated_at DESC LIMIT 1) AS recent_delta
      FROM agents a
      ORDER BY a.trust_score DESC
    `).all() as (Agent & { recent_delta: number | null })[]
  },

  getById(id: string): Agent | null {
    return getDb().prepare('SELECT * FROM agents WHERE id = ?').get(id) as Agent | null
  },

  register(params: {
    id: string
    name: string
    organization: string
    specialty: string
    endpoint_url: string
    api_key: string
    system_prompt?: string
    initial_trust?: number
    pqc?: boolean
  }): Agent {
    const systemPrompt = params.system_prompt ?? ''
    const initialTrust = params.initial_trust ?? 65.0
    const initialEscrow = initialTrust >= 60 ? 0.6 : 0.5
    const initialJudge  = initialTrust >= 60 ? 60.0 : 50.0
    const pqcVal = params.pqc ? 1 : 0
    const pqcKeys = params.pqc ? generatePQCKeyBundle() : null

    getDb().prepare(`
      INSERT INTO agents
        (id, name, specialty, strategy, model, base_price_cents,
         trust_score, escrow_success_rate, avg_judge_score, reliability_score,
         total_contracts, successful_contracts, total_revenue_cents,
         system_prompt, round2_system_prompt,
         source, organization, api_key, endpoint_url, pqc,
         pqc_ek, pqc_dk, pqc_ecdh_pub, pqc_ecdh_priv)
      VALUES
        (@id, @name, @specialty, 'external', 'external', 2500,
         @initialTrust, @initialEscrow, @initialJudge, 1.0,
         0, 0, 0,
         @systemPrompt, NULL,
         'external', @organization, @api_key, @endpoint_url, @pqcVal,
         @pqcEk, @pqcDk, @pqcEcdhPub, @pqcEcdhPriv)
    `).run({
      ...params,
      systemPrompt, initialTrust, initialEscrow, initialJudge, pqcVal,
      pqcEk:       pqcKeys?.ekB64        ?? null,
      pqcDk:       pqcKeys?.dkB64        ?? null,
      pqcEcdhPub:  pqcKeys?.ecdhPubB64   ?? null,
      pqcEcdhPriv: pqcKeys?.ecdhPrivB64  ?? null,
    })
    return agentQueries.getById(params.id)!
  },

  updateAfterContract(id: string, judgeScore: number, success: boolean, revenueCents: number) {
    const db = getDb()
    const agent = agentQueries.getById(id)!
    const newTotal = agent.total_contracts + 1
    const newSuccessful = success ? agent.successful_contracts + 1 : agent.successful_contracts
    const newAvgJudge = (agent.avg_judge_score * agent.total_contracts + judgeScore) / newTotal
    const newEscrowRate = newSuccessful / newTotal
    const newTrustScore = 100 * (0.40 * newEscrowRate + 0.40 * (newAvgJudge / 100) + 0.20 * agent.reliability_score)

    db.prepare(`
      UPDATE agents SET
        total_contracts = ?,
        successful_contracts = ?,
        avg_judge_score = ?,
        escrow_success_rate = ?,
        trust_score = ?,
        total_revenue_cents = total_revenue_cents + ?
      WHERE id = ?
    `).run(newTotal, newSuccessful, newAvgJudge, newEscrowRate, newTrustScore, success ? revenueCents : 0, id)

    return { oldScore: agent.trust_score, newScore: newTrustScore, delta: newTrustScore - agent.trust_score }
  },
}

// Contracts
export const contractQueries = {
  create(contract: Omit<Contract, 'created_at' | 'funded_at' | 'completed_at' | 'winner_agent_id' | 'stripe_payment_intent_id'>): Contract {
    getDb().prepare(`
      INSERT INTO contracts (id, task_description, task_hash, evaluation_criteria, budget_cents, status, buyer_agent_id, round)
      VALUES (@id, @task_description, @task_hash, @evaluation_criteria, @budget_cents, @status, @buyer_agent_id, @round)
    `).run(contract)
    return contractQueries.getById(contract.id)!
  },

  getById(id: string): Contract | null {
    return getDb().prepare('SELECT * FROM contracts WHERE id = ?').get(id) as Contract | null
  },

  updateStatus(id: string, status: string, extra: Record<string, string> = {}) {
    const ALLOWED_COLUMNS = new Set(['stripe_payment_intent_id', 'winner_agent_id', 'funded_at', 'completed_at'])
    const safeKeys = Object.keys(extra).filter(k => ALLOWED_COLUMNS.has(k))
    const fields = ['status = ?', ...safeKeys.map(k => `${k} = ?`)]
    const values = [status, ...safeKeys.map(k => extra[k]), id]
    getDb().prepare(`UPDATE contracts SET ${fields.join(', ')} WHERE id = ?`).run(...values)
  },

  getAll(): Contract[] {
    return getDb().prepare('SELECT * FROM contracts ORDER BY created_at DESC').all() as Contract[]
  },
}

// Bids
export const bidQueries = {
  create(bid: Omit<Bid, 'work_delivered' | 'work_hash' | 'judge_score' | 'judge_breakdown' | 'judge_reasoning' | 'submitted_at'>): Bid {
    getDb().prepare(`
      INSERT INTO bids (id, contract_id, agent_id, price_cents, round, expected_value)
      VALUES (@id, @contract_id, @agent_id, @price_cents, @round, @expected_value)
    `).run(bid)
    return bidQueries.getById(bid.id)!
  },

  getById(id: string): Bid | null {
    return getDb().prepare('SELECT * FROM bids WHERE id = ?').get(id) as Bid | null
  },

  getByContract(contractId: string): Bid[] {
    return getDb().prepare('SELECT * FROM bids WHERE contract_id = ? ORDER BY price_cents ASC').all(contractId) as Bid[]
  },

  submitWork(id: string, workDelivered: string, workHash: string) {
    getDb().prepare(`
      UPDATE bids SET work_delivered = ?, work_hash = ?, submitted_at = datetime('now') WHERE id = ?
    `).run(workDelivered, workHash, id)
  },

  submitScore(id: string, judgeScore: number, judgeBreakdown: object, judgeReasoning: string) {
    getDb().prepare(`
      UPDATE bids SET judge_score = ?, judge_breakdown = ?, judge_reasoning = ? WHERE id = ?
    `).run(judgeScore, JSON.stringify(judgeBreakdown), judgeReasoning, id)
  },
}

// Trust Receipts
export const receiptQueries = {
  create(receipt: Omit<TrustReceipt, 'generated_at'>): TrustReceipt {
    getDb().prepare(`
      INSERT INTO trust_receipts
        (id, contract_id, agent_id, agent_name, trust_score_before, trust_score_after,
         trust_delta, judge_score, escrow_status, task_hash, work_hash, signature)
      VALUES
        (@id, @contract_id, @agent_id, @agent_name, @trust_score_before, @trust_score_after,
         @trust_delta, @judge_score, @escrow_status, @task_hash, @work_hash, @signature)
    `).run(receipt)
    return receiptQueries.getById(receipt.id)!
  },

  getById(id: string): TrustReceipt | null {
    return getDb().prepare('SELECT * FROM trust_receipts WHERE id = ?').get(id) as TrustReceipt | null
  },

  getLatest(): TrustReceipt | null {
    return getDb().prepare('SELECT * FROM trust_receipts ORDER BY generated_at DESC LIMIT 1').get() as TrustReceipt | null
  },
}

// Audit log
export const auditQueries = {
  log(eventType: string, data: object, contractId?: string, agentId?: string) {
    const { v4: uuid } = require('uuid')
    getDb().prepare(`
      INSERT INTO audit_log (id, event_type, contract_id, agent_id, data)
      VALUES (?, ?, ?, ?, ?)
    `).run(uuid(), eventType, contractId ?? null, agentId ?? null, JSON.stringify(data))
  },

  getRecent(limit = 50) {
    return getDb().prepare('SELECT * FROM audit_log ORDER BY created_at DESC LIMIT ?').all(limit)
  },
}
