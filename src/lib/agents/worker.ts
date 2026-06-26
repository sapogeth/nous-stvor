import { nvidia, WORKER_MODEL } from '../nvidia/client'
import { Agent } from '../db/queries'

export interface WorkerOutput {
  content: string
  agentId: string
  agentName: string
  model: string
  inferenceMs: number
}

export async function runWorkerAgent(
  agent: Agent,
  taskDescription: string,
  useRound2Prompt = false
): Promise<WorkerOutput> {
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

  return { content, agentId: agent.id, agentName: agent.name, model: WORKER_MODEL, inferenceMs }
}
