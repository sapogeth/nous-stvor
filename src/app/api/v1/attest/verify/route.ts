import { NextRequest, NextResponse } from 'next/server'
import { verify, verifyCommitment, AttestationCommitment } from '@/sdk'

export const dynamic = 'force-dynamic'

/**
 * POST /api/v1/attest/verify
 *
 * Verify a task payload before agent execution.
 * Call this in your agent middleware BEFORE running any task.
 * If valid === false, refuse to execute.
 *
 * Body: { task: string, taskHash?: string, commitment?: AttestationCommitment }
 * Returns: { valid: boolean, taskHash, expectedHash, reason }
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { task, taskHash, commitment } = body as {
      task: string
      taskHash?: string
      commitment?: AttestationCommitment
    }

    if (!task || typeof task !== 'string') {
      return NextResponse.json({ error: 'task is required' }, { status: 400 })
    }

    if (!taskHash && !commitment) {
      return NextResponse.json({ error: 'provide taskHash or commitment' }, { status: 400 })
    }

    const result = commitment
      ? verifyCommitment(task, commitment)
      : verify(task, taskHash!)

    return NextResponse.json({
      ok: true,
      ...result,
      checkedAt: new Date().toISOString(),
    })
  } catch {
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
