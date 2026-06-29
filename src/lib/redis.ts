import { Redis } from '@upstash/redis'

let _redis: Redis | null = null

function getRedis(): Redis | null {
  // Accept both Upstash direct vars and Vercel KV auto-injected vars
  const url   = process.env.UPSTASH_REDIS_REST_URL   ?? process.env.KV_REST_API_URL
  const token = process.env.UPSTASH_REDIS_REST_TOKEN ?? process.env.KV_REST_API_TOKEN
  if (!url || !token) return null
  if (_redis) return _redis
  _redis = new Redis({ url, token })
  return _redis
}

const TRUST_KEY          = 'stvor:trust_scores'
const EXTERNAL_AGENT_KEY = 'stvor:external_agents'

export interface RedisAgent {
  id: string; name: string; organization: string; specialty: string
  endpoint_url: string; api_key: string; system_prompt: string
  initial_trust: number; pqc: boolean
}

export async function redisSaveExternalAgent(agent: RedisAgent): Promise<void> {
  const r = getRedis()
  if (!r) return
  await r.hset(EXTERNAL_AGENT_KEY, { [agent.id]: JSON.stringify(agent) })
  await r.expire(EXTERNAL_AGENT_KEY, 86400) // 24h TTL — stale agents auto-expire
}

export async function redisGetExternalAgents(): Promise<RedisAgent[]> {
  const r = getRedis()
  if (!r) return []
  const all = await r.hgetall(EXTERNAL_AGENT_KEY) as Record<string, string> | null
  if (!all) return []
  return Object.values(all).map(v => {
    try { return JSON.parse(v) as RedisAgent } catch { return null }
  }).filter(Boolean) as RedisAgent[]
}

export async function redisSaveTrustScores(updates: Record<string, number>): Promise<void> {
  const r = getRedis()
  if (!r || Object.keys(updates).length === 0) return
  const payload: Record<string, string> = {}
  for (const [k, v] of Object.entries(updates)) payload[k] = String(v)
  await r.hset(TRUST_KEY, payload)
}

export async function redisIncrDemoRunCount(): Promise<number> {
  const r = getRedis()
  if (!r) return 0
  try {
    const val = await r.incr('stvor:demo_run_count')
    return (val as number) - 1 // 0-indexed: first call → 0
  } catch { return 0 }
}

export async function redisGetAllTrustScores(): Promise<Record<string, number>> {
  const r = getRedis()
  if (!r) return {}
  const all = await r.hgetall(TRUST_KEY) as Record<string, string> | null
  if (!all) return {}
  const result: Record<string, number> = {}
  for (const [k, v] of Object.entries(all)) {
    const n = parseFloat(v)
    if (!isNaN(n)) result[k] = n
  }
  return result
}

// ── Receipt persistence ────────────────────────────────────────────────────────
const RECEIPT_KEY = 'stvor:receipts'

export async function redisSaveReceipt(receipt: {
  id: string; contract_id: string; agent_id: string; agent_name: string
  trust_score_before: number; trust_score_after: number; trust_delta: number
  judge_score: number; escrow_status: string; task_hash: string
  work_hash: string; signature: string; generated_at: string
}): Promise<void> {
  const r = getRedis()
  if (!r) return
  try {
    await r.hset(RECEIPT_KEY, { [receipt.id]: JSON.stringify(receipt) })
    await r.expire(RECEIPT_KEY, 86400 * 7) // 7-day TTL
  } catch {}
}

export async function redisGetReceipts(): Promise<Array<{
  id: string; contract_id: string; agent_id: string; agent_name: string
  trust_score_before: number; trust_score_after: number; trust_delta: number
  judge_score: number; escrow_status: string; task_hash: string
  work_hash: string; signature: string; generated_at: string
}>> {
  const r = getRedis()
  if (!r) return []
  try {
    const all = await r.hgetall(RECEIPT_KEY) as Record<string, string> | null
    if (!all) return []
    return Object.values(all)
      .map(v => { try { return JSON.parse(v) } catch { return null } })
      .filter(Boolean)
      .sort((a, b) => new Date(b.generated_at).getTime() - new Date(a.generated_at).getTime())
  } catch { return [] }
}

// ── Escrow volume persistence (daily totals) ───────────────────────────────────
const VOLUME_KEY = 'stvor:volume'

export async function redisAddVolume(datePart: string, cents: number): Promise<void> {
  const r = getRedis()
  if (!r) return
  try {
    await r.hset(VOLUME_KEY, { [datePart]: String(cents) })
    await r.expire(VOLUME_KEY, 86400 * 30)
  } catch {}
}

export async function redisGetVolume(): Promise<Record<string, number>> {
  const r = getRedis()
  if (!r) return {}
  try {
    const all = await r.hgetall(VOLUME_KEY) as Record<string, string> | null
    if (!all) return {}
    const result: Record<string, number> = {}
    for (const [k, v] of Object.entries(all)) {
      const n = parseInt(v, 10)
      if (!isNaN(n)) result[k] = (result[k] ?? 0) + n
    }
    return result
  } catch { return {} }
}

// ── Dispute contracts persistence ───────────────────────────────────────────
const DISPUTE_KEY = 'stvor:disputes'

export async function redisSaveDisputeContract(contract: {
  id: string; task_description: string; budget_cents: number; status: string
  created_at: string; winner_agent_id: string | null; stripe_payment_intent_id: string | null
}): Promise<void> {
  const r = getRedis()
  if (!r) return
  try {
    await r.hset(DISPUTE_KEY, { [contract.id]: JSON.stringify(contract) })
    await r.expire(DISPUTE_KEY, 86400 * 14) // 14-day TTL
  } catch {}
}

export async function redisGetDisputeContracts(): Promise<Array<{
  id: string; task_description: string; budget_cents: number; status: string
  created_at: string; winner_agent_id: string | null; stripe_payment_intent_id: string | null
}>> {
  const r = getRedis()
  if (!r) return []
  try {
    const all = await r.hgetall(DISPUTE_KEY) as Record<string, string> | null
    if (!all) return []
    return Object.values(all).map(v => JSON.parse(v))
  } catch { return [] }
}
