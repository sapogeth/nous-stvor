import { nvidia, JUDGE_MODEL } from '../nvidia/client'

export interface EvaluationCriterion {
  name: string
  description: string
  weight: number
}

export interface JudgeResult {
  totalScore: number
  breakdown: Record<string, number>
  reasoning: string
  model: string
  inferenceMs: number
}

export async function runJudgeAgent(
  taskDescription: string,
  criteria: EvaluationCriterion[],
  workDelivered: string
): Promise<JudgeResult> {
  const criteriaText = criteria
    .map(c => `- "${c.name}" (weight: ${(c.weight * 100).toFixed(0)}%): ${c.description}`)
    .join('\n')

  const t0 = Date.now()

  const completion = await nvidia.chat.completions.create({
    model: JUDGE_MODEL,
    max_tokens: 1024,
    messages: [
      {
        role: 'system',
        content: `You are an impartial Judge Agent for an AI contractor marketplace.
Evaluate submitted work strictly and fairly against the given criteria.
Always return valid JSON. Be rigorous — a score of 100 means perfect execution.`,
      },
      {
        role: 'user',
        content: `TASK:\n${taskDescription}\n\nEVALUATION CRITERIA:\n${criteriaText}\n\nWORK SUBMITTED:\n${workDelivered}\n\nReturn JSON only, no other text:\n{\n  "breakdown": {"criterion_name": score_0_to_100},\n  "reasoning": "one sentence explaining overall quality",\n  "total": weighted_average_0_to_100\n}`,
      },
    ],
  })

  const inferenceMs = Date.now() - t0
  const raw = completion.choices[0]?.message?.content?.trim() ?? '{}'

  try {
    // Nemotron-3-Super is a reasoning model — strip any <think>...</think> or reasoning preamble
    const stripped = raw
      .replace(/<think>[\s\S]*?<\/think>/gi, '')
      .replace(/^[\s\S]*?(\{)/m, '$1')
    const jsonMatch = stripped.match(/\{[\s\S]*\}/)
    const parsed = JSON.parse(jsonMatch?.[0] ?? '{}')
    const breakdown = parsed.breakdown ?? {}

    let weightedTotal = 0
    let totalWeight = 0
    for (const criterion of criteria) {
      const score = breakdown[criterion.name] ?? 50
      weightedTotal += score * criterion.weight
      totalWeight += criterion.weight
    }
    const totalScore = totalWeight > 0 ? weightedTotal / totalWeight : parsed.total ?? 50

    return {
      totalScore: Math.round(totalScore * 10) / 10,
      breakdown,
      reasoning: parsed.reasoning ?? 'Evaluation complete.',
      model: JUDGE_MODEL,
      inferenceMs,
    }
  } catch {
    return {
      totalScore: 50,
      breakdown: {},
      reasoning: 'Evaluation failed to parse.',
      model: JUDGE_MODEL,
      inferenceMs,
    }
  }
}
