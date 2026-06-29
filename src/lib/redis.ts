import { Redis } from '@upstash/redis'

let _redis: Redis | null = null

function getRedis(): Redis | null {
  const url   = process.env.UPSTASH_REDIS_REST_URL
  const token = process.env.UPSTASH_REDIS_REST_TOKEN
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
