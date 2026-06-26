import { nvidia, WORKER_MODEL } from '../nvidia/client'
import { Agent } from '../db/queries'

export interface WorkerOutput {
  content: string
  agentId: string
  agentName: string
  model: string
  inferenceMs: number
  deliveryMethod: 'webhook' | 'nim'
}

export interface WebhookContext {
  contractId: string
  taskHash: string
  budgetCents: number
  round: number
}

async function tryWebhookDelivery(
  agent: Agent,
  taskDescription: string,
  ctx: WebhookContext,
): Promise<WorkerOutput | null> {
  if (!agent.endpoint_url) return null

  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), 30_000)

  try {
    const t0 = Date.now()
    const res = await fetch(agent.endpoint_url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Stvor-Agent-Id': agent.id,
        ...(agent.api_key ? { 'X-Stvor-Api-Key': agent.api_key } : {}),
      },
      body: JSON.stringify({
        contractId: ctx.contractId,
        taskDescription,
        taskHash: ctx.taskHash,
        budgetCents: ctx.budgetCents,
        round: ctx.round,
      }),
      signal: controller.signal,
    })
    clearTimeout(timeoutId)

    if (!res.ok) return null
    const data = await res.json() as { workDelivered?: string }
    if (typeof data.workDelivered !== 'string' || data.workDelivered.length < 10) return null

    const hostname = (() => { try { return new URL(agent.endpoint_url!).hostname } catch { return agent.endpoint_url! } })()

    return {
      content: data.workDelivered,
      agentId: agent.id,
      agentName: agent.name,
      model: `webhook:${hostname}`,
      inferenceMs: Date.now() - t0,
      deliveryMethod: 'webhook',
    }
  } catch {
    clearTimeout(timeoutId)
    return null
  }
}

export async function runWorkerAgent(
  agent: Agent,
  taskDescription: string,
  useRound2Prompt = false,
  webhookContext?: WebhookContext,
): Promise<WorkerOutput> {
  // For external agents with a real endpoint_url, attempt webhook delivery first
  if (agent.source === 'external' && agent.endpoint_url && webhookContext) {
    const result = await tryWebhookDelivery(agent, taskDescription, webhookContext)
    if (result) return result
    // Webhook failed or timed out — fall through to in-process NIM
  }

  const systemPrompt = useRound2Prompt && agent.round2_system_prompt
    ? agent.round2_system_prompt
    : agent.system_prompt

  const t0 = Date.now()

  const completion = await nvidia.chat.completions.create({
    model: WORKER_MODEL,
    max_tokens: 1200,
    messages: [
      { role: 'system', content: systemPrompt },
      {
        role: 'user',
        content: `TASK:\n${taskDescription}\n\nDeliver your complete work output now. No preamble — just the deliverable.`,
      },
    ],
  })

  const inferenceMs = Date.now() - t0
  const content = completion.choices[0]?.message?.content ?? ''

  return { content, agentId: agent.id, agentName: agent.name, model: WORKER_MODEL, inferenceMs, deliveryMethod: 'nim' }
}
