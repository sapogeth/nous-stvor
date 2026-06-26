import { NextRequest, NextResponse } from 'next/server'
import { sign } from '@/sdk'

export const dynamic = 'force-dynamic'

/**
 * POST /api/v1/attest/sign
 *
 * Sign a task payload at contract creation time.
 * Returns a cryptographic commitment the buyer keeps as proof.
 *
 * Body: { task: string, agentId?: string }
 * Returns: { taskHash, timestamp, signature, stvorVersion }
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { task, agentId } = body

    if (!task || typeof task !== 'string' || task.trim().length === 0) {
      return NextResponse.json({ error: 'task is required and must be a non-empty string' }, { status: 400 })
    }

    const commitment = sign(task.trim())

    return NextResponse.json({
      ok: true,
      commitment,
      agentId: agentId ?? null,
      signedAt: commitment.timestamp,
    })
  } catch {
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
