import { NextRequest, NextResponse } from 'next/server'
import { runDemo } from '@/lib/demo/runner'
import { emit } from '@/lib/events'

export const dynamic = 'force-dynamic'

let isRunning = false

// Per-IP cooldown: one run per IP per 60s
const lastRunByIp = new Map<string, number>()
const COOLDOWN_MS = 60_000

export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown'
  const now = Date.now()
  const last = lastRunByIp.get(ip) ?? 0

  if (now - last < COOLDOWN_MS) {
    const remainS = Math.ceil((COOLDOWN_MS - (now - last)) / 1000)
    return NextResponse.json({ error: `Rate limited. Try again in ${remainS}s.` }, { status: 429 })
  }

  if (isRunning) {
    return NextResponse.json({ error: 'Demo already running' }, { status: 409 })
  }

  lastRunByIp.set(ip, now)
  isRunning = true

  runDemo()
    .catch((err) => {
      emit({ type: 'DEMO_ERROR', data: { message: err.message } })
    })
    .finally(() => {
      isRunning = false
    })

  return NextResponse.json({ started: true })
}
