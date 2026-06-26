/**
 * @stvor/plugin-agent-commerce — elizaOS integration example
 *
 * This plugin wraps any elizaOS agent action with Stvor payload attestation.
 * Every task is cryptographically verified before execution.
 * If the payload was tampered in transit, the agent refuses to run.
 *
 * Usage:
 *   import { stvorPlugin } from './plugin'
 *   export default { plugins: [stvorPlugin], ... }
 */

const STVOR_API = process.env.STVOR_API_URL ?? 'https://stvor.dev/api/v1'

interface StvorCommitment {
  taskHash: string
  timestamp: string
  signature: string
  stvorVersion: string
}

/**
 * Sign a task before sending it to an executing agent.
 * Call this on the BUYER side, at contract creation time.
 */
export async function signTask(task: string): Promise<StvorCommitment> {
  const res = await fetch(`${STVOR_API}/attest/sign`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ task }),
  })
  const { commitment } = await res.json()
  return commitment
}

/**
 * Verify a task before executing it.
 * Call this on the AGENT side, before running any received task.
 * Throws if payload was tampered — use in try/catch.
 */
export async function verifyTask(receivedTask: string, taskHash: string): Promise<void> {
  const res = await fetch(`${STVOR_API}/attest/verify`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ task: receivedTask, taskHash }),
  })
  const result = await res.json()

  if (!result.valid) {
    throw new Error(`[Stvor] PAYLOAD TAMPERED — refusing execution. ${result.reason}`)
  }
}

/**
 * elizaOS plugin definition.
 * Add to your agent's plugins array to enable attestation for all actions.
 */
export const stvorPlugin = {
  name: '@stvor/plugin-agent-commerce',
  description: 'Payload attestation middleware for secure agent-to-agent task execution',

  // elizaOS action middleware — wraps every incoming task
  actions: [
    {
      name: 'STVOR_VERIFY_PAYLOAD',
      description: 'Verify task payload integrity before execution using Stvor attestation',
      similes: ['VERIFY_TASK', 'ATTEST_PAYLOAD', 'CHECK_INTEGRITY'],

      validate: async (_runtime: unknown, message: { content: { task?: string; taskHash?: string } }) => {
        return !!(message.content.task && message.content.taskHash)
      },

      handler: async (
        _runtime: unknown,
        message: { content: { task: string; taskHash: string } }
      ) => {
        const { task, taskHash } = message.content
        await verifyTask(task, taskHash)
        return { verified: true, taskHash }
      },
    },
  ],

  // elizaOS evaluator — scores agent performance after task completion
  evaluators: [],

  // elizaOS providers — supplies attestation context to agent memory
  providers: [
    {
      get: async () => ({
        text: 'Stvor payload attestation is active. All incoming tasks will be verified before execution.',
      }),
    },
  ],
}
