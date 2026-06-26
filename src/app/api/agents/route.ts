import { NextResponse } from 'next/server'
import { agentQueries } from '@/lib/db/queries'

export const dynamic = 'force-dynamic'

export function GET() {
  const agents = agentQueries.getAll().map(({ system_prompt, round2_system_prompt, ...pub }) => pub)
  return NextResponse.json(agents)
}
