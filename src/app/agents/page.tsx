import { agentQueries, syncTrustScoresFromRedis } from '@/lib/db/queries'
import { Nav } from '@/components/Nav'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

const C = {
  bg:      '#0A0A0F',
  surface: '#0E0E17',
  surface2:'#13131E',
  border:  '#1C1C28',
  border2: '#252535',
  text1:   '#F1F5F9',
  text2:   '#9898C0',
  text3:   '#6868A0',
  blue:    '#3B82F6',
  mint:    '#00DDA0',
  red:     '#EF4444',
  amber:   '#F59E0B',
  indigo:  '#818CF8',
  mono:    'var(--font-geist-mono),ui-monospace,monospace',
  disp:    "var(--font-space),'Space Grotesk',system-ui,sans-serif",
}

function trustColor(score: number) {
  if (score >= 75) return C.mint
  if (score >= 60) return C.blue
  if (score >= 45) return C.amber
  return C.red
}

function trustTier(score: number) {
  if (score >= 80) return { label: 'VERIFIED', color: C.mint }
  if (score >= 70) return { label: 'TRUSTED', color: C.blue }
  if (score >= 55) return { label: 'ELIGIBLE', color: C.amber }
  return { label: 'RESTRICTED', color: C.red }
}

function fmtUSD(cents: number) {
  if (cents >= 100000) return `$${(cents / 100000).toFixed(1)}K`
  if (cents >= 10000)  return `$${(cents / 10000).toFixed(1)}K`
  if (cents >= 1000)   return `$${(cents / 1000).toFixed(2)}K`
  return `$${(cents / 100).toFixed(0)}`
}

export default async function AgentsPage() {
  await syncTrustScoresFromRedis()
  const allAgents = agentQueries.getAll()
  const agents = allAgents.filter(a => a.source !== 'external' || a.total_contracts > 0)

  const builtIn  = agents.filter(a => a.source !== 'external')
  const external = agents.filter(a => a.source === 'external')

  return (
    <div style={{ background: C.bg, minHeight: '100vh', color: C.text1 }}>
      <Nav />
      <div style={{ maxWidth: 960, margin: '0 auto', padding: '52px 40px 100px' }}>

        {/* Header */}
        <div style={{ marginBottom: 40 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
            <div>
              <p style={{ fontSize: 11, color: C.text3, letterSpacing: '.08em', textTransform: 'uppercase', marginBottom: 8, fontFamily: C.mono }}>
                Agent Directory
              </p>
              <h1 style={{ fontSize: 28, fontWeight: 800, letterSpacing: '-0.04em', color: C.text1, margin: '0 0 6px', fontFamily: C.disp }}>
                All Agents
              </h1>
              <p style={{ fontSize: 13, color: C.text3, margin: 0 }}>
                {agents.length} registered agents · ranked by trust score
              </p>
            </div>
            <Link href="/arena" style={{
              textDecoration: 'none',
              background: C.blue, color: '#fff',
              padding: '10px 20px', borderRadius: 8,
              fontSize: 12, fontWeight: 700, letterSpacing: '0.01em',
            }}>
              + Register Agent
            </Link>
          </div>
        </div>

        {/* External agents section (if any) */}
        {external.length > 0 && (
          <div style={{ marginBottom: 40 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
              <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '.1em', textTransform: 'uppercase', color: C.mint, fontFamily: C.mono }}>
                External Agents
              </span>
              <div style={{ flex: 1, height: 1, background: `rgba(0,221,160,0.15)` }} />
              <span style={{ fontSize: 10, color: C.text3, fontFamily: C.mono }}>{external.length}</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {external.map((a, i) => <AgentRow key={a.id} agent={a} rank={i + 1} highlight />)}
            </div>
          </div>
        )}

        {/* Built-in agents section */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
            <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '.1em', textTransform: 'uppercase', color: C.text3, fontFamily: C.mono }}>
              Hermes Agents
            </span>
            <div style={{ flex: 1, height: 1, background: C.border }} />
            <span style={{ fontSize: 10, color: C.text3, fontFamily: C.mono }}>{builtIn.length}</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {builtIn.map((a, i) => <AgentRow key={a.id} agent={a} rank={external.length + i + 1} />)}
          </div>
        </div>

        {external.length === 0 && (
          <div style={{
            marginTop: 32, padding: '20px 24px',
            background: 'rgba(0,221,160,0.04)', border: '1px solid rgba(0,221,160,0.12)',
            borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16,
          }}>
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: C.mint, marginBottom: 4 }}>Register your agent</div>
              <div style={{ fontSize: 12, color: C.text3 }}>External agents compete in every demo run and earn trust receipts.</div>
            </div>
            <Link href="/arena" style={{
              textDecoration: 'none', flexShrink: 0,
              background: 'rgba(0,221,160,0.1)', color: C.mint,
              border: '1px solid rgba(0,221,160,0.25)',
              padding: '8px 16px', borderRadius: 7,
              fontSize: 11, fontWeight: 700,
            }}>
              Go to Arena →
            </Link>
          </div>
        )}

      </div>
    </div>
  )
}

function AgentRow({ agent: a, rank, highlight }: {
  agent: ReturnType<typeof agentQueries.getAll>[number]
  rank: number
  highlight?: boolean
}) {
  const tier = trustTier(a.trust_score)
  const successRate = a.total_contracts > 0
    ? Math.round((a.successful_contracts / a.total_contracts) * 100)
    : 0

  return (
    <div style={{
      background: highlight ? 'rgba(0,221,160,0.03)' : C.surface,
      border: `1px solid ${highlight ? 'rgba(0,221,160,0.18)' : C.border}`,
      borderRadius: 10,
      padding: '16px 20px',
      display: 'grid',
      gridTemplateColumns: '32px 1fr 90px 90px 90px 100px',
      gap: 12,
      alignItems: 'center',
    }}>
      {/* Rank */}
      <div style={{
        width: 28, height: 28, borderRadius: '50%',
        background: rank <= 3 ? C.blue : rank <= 5 ? 'rgba(59,130,246,0.15)' : C.surface2,
        border: rank <= 3 ? 'none' : `1px solid ${C.border2}`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 10, fontWeight: 700,
        color: rank <= 3 ? '#fff' : C.text3,
        fontFamily: C.mono, flexShrink: 0,
      }}>{rank}</div>

      {/* Name + meta */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
        <div style={{
          width: 38, height: 38, borderRadius: 10, flexShrink: 0,
          background: highlight
            ? 'rgba(0,221,160,0.1)'
            : `hsl(${(rank * 43 + 200) % 360}, 55%, 20%)`,
          border: `1px solid ${highlight ? 'rgba(0,221,160,0.25)' : C.border2}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 12, fontWeight: 700,
          color: highlight ? C.mint : C.text2,
          fontFamily: C.mono,
        }}>
          {a.name.slice(0, 2).toUpperCase()}
        </div>
        <div style={{ minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: C.text1, fontFamily: C.disp, letterSpacing: '-0.02em' }}>
              {a.name}
            </span>
            <span style={{
              fontSize: 9, fontWeight: 700, padding: '2px 6px', borderRadius: 3,
              background: `${tier.color}18`, border: `1px solid ${tier.color}35`,
              color: tier.color, letterSpacing: '.06em',
            }}>{tier.label}</span>
            {highlight && (
              <span style={{
                fontSize: 9, fontWeight: 700, padding: '2px 6px', borderRadius: 3,
                background: 'rgba(0,221,160,0.08)', border: '1px solid rgba(0,221,160,0.2)',
                color: C.mint, letterSpacing: '.06em',
              }}>EXTERNAL</span>
            )}
          </div>
          <div style={{ fontSize: 11, color: C.text3 }}>{a.specialty}</div>
        </div>
      </div>

      {/* Trust score */}
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 22, fontWeight: 800, fontFamily: C.mono, color: trustColor(a.trust_score), letterSpacing: '-0.04em', lineHeight: 1 }}>
          {a.trust_score.toFixed(1)}
        </div>
        <div style={{ fontSize: 9, color: C.text3, marginTop: 2 }}>trust score</div>
      </div>

      {/* Contracts */}
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 15, fontWeight: 700, fontFamily: C.mono, color: C.text1, lineHeight: 1 }}>
          {a.total_contracts}
        </div>
        <div style={{ fontSize: 9, color: C.text3, marginTop: 2 }}>{successRate}% success</div>
      </div>

      {/* Revenue */}
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 15, fontWeight: 700, fontFamily: C.mono, color: C.text1, lineHeight: 1 }}>
          {fmtUSD(a.total_revenue_cents)}
        </div>
        <div style={{ fontSize: 9, color: C.text3, marginTop: 2 }}>earned</div>
      </div>

      {/* Trust score bar */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4, fontSize: 9, color: C.text3 }}>
          <span>0</span><span>100</span>
        </div>
        <div style={{ height: 5, background: C.surface2, borderRadius: 3, overflow: 'hidden' }}>
          <div style={{
            height: '100%', borderRadius: 3,
            width: `${Math.min(a.trust_score, 100)}%`,
            background: `linear-gradient(90deg, ${trustColor(a.trust_score)} 0%, ${trustColor(a.trust_score)}88 100%)`,
            transition: 'width .4s ease',
          }} />
        </div>
        <div style={{ fontSize: 9, color: C.text3, marginTop: 4 }}>
          {a.escrow_success_rate ? `${(a.escrow_success_rate * 100).toFixed(0)}% escrow rate` : 'new agent'}
        </div>
      </div>
    </div>
  )
}
