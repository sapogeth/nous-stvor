/**
 * @stvor/plugin-agent-commerce
 *
 * Payload attestation SDK for AI agents.
 * Drop-in middleware that cryptographically verifies every task payload
 * before your agent executes it — preventing supply chain attacks.
 *
 * Compatible with elizaOS, Hermes Agent, and any agent that accepts tasks.
 */

import { sha256, ecdsaSign, ecdsaVerify } from '../lib/crypto'

export interface AttestationCommitment {
  taskHash: string
  timestamp: string
  signature: string
  stvorVersion: string
}

export interface AttestationResult {
  valid: boolean
  taskHash: string
  expectedHash: string
  reason: string
}

export interface EscrowReceipt {
  id: string
  taskHash: string
  workHash: string
  agentId: string
  judgeScore: number
  amountCents: number
  signature: string
  timestamp: string
}

const SDK_VERSION = '1.0.0'

/**
 * Sign a task payload at contract creation time.
 * Call this when the buyer agent creates a task — before it leaves your system.
 *
 * @example
 * const commitment = sign("Analyze Q2 revenue data for DataFlow...")
 * // Store commitment.taskHash alongside the contract
 */
export function sign(task: string): AttestationCommitment {
  const taskHash = sha256(task)
  const timestamp = new Date().toISOString()
  const payload = `${taskHash}:${timestamp}:${SDK_VERSION}`
  const signature = ecdsaSign(payload)

  return { taskHash, timestamp, signature, stvorVersion: SDK_VERSION }
}

/**
 * Verify a task payload before agent execution.
 * Call this when your agent receives a task — before running it.
 * If this returns false, REFUSE to execute.
 *
 * @example
 * const result = verify(receivedTask, commitment.taskHash)
 * if (!result.valid) throw new Error(`Stvor: ${result.reason}`)
 */
export function verify(receivedTask: string, expectedHash: string): AttestationResult {
  const receivedHash = sha256(receivedTask)
  const valid = receivedHash === expectedHash

  return {
    valid,
    taskHash: receivedHash,
    expectedHash,
    reason: valid
      ? 'Payload integrity verified. Task hash matches buyer commitment.'
      : `Payload tampered. Expected ${expectedHash.slice(0, 16)}... received ${receivedHash.slice(0, 16)}...`,
  }
}

/**
 * Verify an attestation commitment (full signature check).
 * Stronger than verify() — also checks the HMAC signature and timestamp.
 */
export function verifyCommitment(receivedTask: string, commitment: AttestationCommitment): AttestationResult {
  const hashResult = verify(receivedTask, commitment.taskHash)
  if (!hashResult.valid) return hashResult

  const payload = `${commitment.taskHash}:${commitment.timestamp}:${commitment.stvorVersion}`
  const signatureValid = ecdsaVerify(payload, commitment.signature)

  return {
    valid: signatureValid,
    taskHash: hashResult.taskHash,
    expectedHash: commitment.taskHash,
    reason: signatureValid
      ? 'Full attestation verified. Payload + HMAC signature match.'
      : 'Signature invalid. Commitment may have been forged.',
  }
}

/**
 * Generate an escrow receipt after successful work delivery and verification.
 * This is the portable proof of clean agent execution.
 */
export function generateEscrowReceipt(params: {
  taskHash: string
  work: string
  agentId: string
  judgeScore: number
  amountCents: number
}): EscrowReceipt {
  const id = sha256(`${params.taskHash}:${params.agentId}:${Date.now()}`).slice(0, 32)
  const workHash = sha256(params.work)
  const timestamp = new Date().toISOString()
  const payload = `${id}:${params.taskHash}:${workHash}:${params.amountCents}`
  const signature = ecdsaSign(payload)

  return {
    id,
    taskHash: params.taskHash,
    workHash,
    agentId: params.agentId,
    judgeScore: params.judgeScore,
    amountCents: params.amountCents,
    signature,
    timestamp,
  }
}

/**
 * Middleware factory for elizaOS agents.
 * Wraps your agent's task handler with automatic attestation.
 *
 * @example
 * const secureHandler = withAttestation(myAgentHandler)
 * // Now secureHandler will throw if payload was tampered
 */
export function withAttestation<T>(
  handler: (task: string) => Promise<T>,
  expectedHash: string
): (task: string) => Promise<T> {
  return async (receivedTask: string): Promise<T> => {
    const result = verify(receivedTask, expectedHash)
    if (!result.valid) {
      throw new Error(`[Stvor] Attestation failed: ${result.reason}`)
    }
    return handler(receivedTask)
  }
}

export { sha256 } from '../lib/crypto'
