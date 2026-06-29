import { getDb } from '@/lib/db/client'
import { Nav } from '@/components/Nav'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

interface Receipt {
  id: string; agent_id: string; agent_name: string
  judge_score: number; escrow_status: string; generated_at: string
}

const C = {
  bg:      '#0A0A0F',
  surface: '#0E0E17',
  border:  '#1C1C28',
  border2: '#252535',
  text1:   '#F1F5F9',
  text2:   '#9898C0',
  text3:   '#6868A0',
  blue:    '#3B82F6',
  mint:    '#00DDA0',
  red:     '#EF4444',
  amber:   '#F59E0B',
  mono:    'var(--font-geist-mono),ui-monospace,monospace',
}

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 1) return 'just now'
  if (m < 60) return `${m}m ago`
  if (m < 1440) return `${Math.floor(m / 60)}h ago`
  return `${Math.floor(m / 1440)}d ago`
}

export default async function ReceiptsIndexPage() {
  let receipts: Receipt[] = []
  try {
    receipts = getDb()
      .prepare('SELECT id, agent_id, agent_name, judge_score, escrow_status, generated_at FROM trust_receipts ORDER BY generated_at DESC')
      .all() as Receipt[]
  } catch { receipts = [] }

  return (
    <div style={{ background: C.bg, minHeight: '100vh', color: C.text1 }}>
      <Nav />
      <div style={{ maxWidth: 900, margin: '0 auto', padding: '52px 40px 80px' }}>
        <div style={{ marginBottom: 36 }}>
          <h1 style={{ fontSize: 26, fontWeight: 800, letterSpacing: '-0.04em', color: C.text1, margin: '0 0 6px', fontFamily: "'Space Grotesk',system-ui,sans-serif" }}>
            Trust Receipts
          </h1>
          <p style={{ fontSize: 13, color: C.text3, margin: 0 }}>
            Cryptographically signed records of every agent evaluation. Run the demo to generate receipts.
          </p>
        </div>

        <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12, overflow: 'hidden' }}>
          {/* Header row */}
          <div style={{
            display: 'grid', gridTemplateColumns: '140px 1fr 80px 100px 80px',
            padding: '10px 24px', gap: 12,
            fontSize: 10, color: C.text3, letterSpacing: '.08em', textTransform: 'uppercase',
            fontFamily: C.mono, borderBottom: `1px solid ${C.border}`,
          }}>
            <span>Receipt ID</span><span>Agent</span>
            <span style={{ textAlign: 'center' }}>Score</span>
            <span>Status</span><span style={{ textAlign: 'right' }}>Time</span>
          </div>

          {receipts.length === 0 ? (
            <div style={{ padding: '64px 24px', textAlign: 'center' }}>
              <div style={{ fontSize: 13, color: C.text3, marginBottom: 16 }}>No receipts yet.</div>
              <Link href="/demo" style={{
                display: 'inline-block', textDecoration: 'none',
                background: C.blue, color: '#fff',
                padding: '10px 20px', borderRadius: 7,
                fontSize: 12, fontWeight: 700,
              }}>
                Run Live Demo →
              </Link>
            </div>
          ) : receipts.map((r, i) => (
            <Link key={r.id} href={`/receipts/${r.id}`} style={{ textDecoration: 'none', display: 'block' }}>
              <div style={{
                display: 'grid', gridTemplateColumns: '140px 1fr 80px 100px 80px',
                padding: '13px 24px', gap: 12, alignItems: 'center',
                borderBottom: i < receipts.length - 1 ? `1px solid ${C.border}` : 'none',
                transition: 'background .1s',
              }}
                onMouseEnter={e => (e.currentTarget.style.background = '#13131C')}
                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
              >
                <span style={{ fontSize: 11, color: C.blue, fontFamily: C.mono, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  R-{r.id.slice(5, 13).toUpperCase()}
                </span>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: C.text1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {r.agent_name}
                  </div>
                  <div style={{ fontSize: 10, color: C.text3 }}>{r.agent_id.slice(0, 20)}…</div>
                </div>
                <div style={{ textAlign: 'center', fontSize: 13, fontWeight: 700,
                  color: r.judge_score >= 70 ? C.mint : r.judge_score >= 50 ? C.amber : C.red,
                  fontFamily: C.mono }}>
                  {Math.round(r.judge_score)}
                </div>
                <div>
                  <span style={{
                    fontSize: 10, fontWeight: 600, padding: '2px 7px', borderRadius: 3,
                    background: r.escrow_status === 'RELEASED' ? 'rgba(0,221,160,0.08)' : r.escrow_status === 'CANCELLED' ? 'rgba(239,68,68,0.08)' : 'rgba(245,158,11,0.08)',
                    color: r.escrow_status === 'RELEASED' ? C.mint : r.escrow_status === 'CANCELLED' ? C.red : C.amber,
                    border: `1px solid ${r.escrow_status === 'RELEASED' ? 'rgba(0,221,160,0.2)' : r.escrow_status === 'CANCELLED' ? 'rgba(239,68,68,0.2)' : 'rgba(245,158,11,0.2)'}`,
                  }}>
                    {r.escrow_status}
                  </span>
                </div>
                <div style={{ textAlign: 'right', fontSize: 11, color: C.text3 }}>
                  {timeAgo(r.generated_at)}
                </div>
              </div>
            </Link>
          ))}
        </div>

        {receipts.length > 0 && (
          <div style={{ marginTop: 16, fontSize: 11, color: C.text3, textAlign: 'right' }}>
            {receipts.length} receipt{receipts.length !== 1 ? 's' : ''} · <Link href="/api/v1/trust" style={{ color: C.blue, textDecoration: 'none' }}>Trust API →</Link>
          </div>
        )}
      </div>
    </div>
  )
}
