import { NextResponse } from 'next/server'
import { agentQueries } from '@/lib/db/queries'

export const dynamic = 'force-dynamic'

export function GET() {
  const agents = agentQueries.getAll()
    .filter(a => a.source !== 'external' || a.total_contracts > 0)
    .map(({ system_prompt, round2_system_prompt, ...pub }) => pub)
  return NextResponse.json(agents)
}
