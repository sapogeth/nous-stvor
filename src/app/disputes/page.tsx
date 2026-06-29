import { getDb } from '@/lib/db/client'
import { syncTrustScoresFromRedis } from '@/lib/db/queries'
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
  mono:    'var(--font-geist-mono),ui-monospace,monospace',
  disp:    "var(--font-space),'Space Grotesk',system-ui,sans-serif",
}

interface DisputeContract {
  id: string
  task_description: string
  budget_cents: number
  status: string
  created_at: string
  winner_agent_id: string | null
  stripe_payment_intent_id: string | null
}

function timeAgo(iso: string) {
  const utc = iso.includes('T') ? iso : iso.replace(' ', 'T') + 'Z'
  const diff = Date.now() - new Date(utc).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 1) return 'just now'
  if (m < 60) return `${m}m ago`
  if (m < 1440) return `${Math.floor(m / 60)}h ago`
  return `${Math.floor(m / 1440)}d ago`
}

function fmtUSD(cents: number) {
  return `$${(cents / 100).toFixed(2)}`
}

export default async function DisputesPage() {
  await syncTrustScoresFromRedis()

  let disputes: DisputeContract[] = []
  let totalCancelled = 0
  let totalHeld = 0

  try {
    const db = getDb()
    disputes = db.prepare(
      `SELECT id, task_description, budget_cents, status, created_at, winner_agent_id, stripe_payment_intent_id
       FROM contracts WHERE status IN ('CANCELLED', 'HELD') ORDER BY created_at DESC`
    ).all() as DisputeContract[]
    totalCancelled = (db.prepare("SELECT COUNT(*) as c FROM contracts WHERE status = 'CANCELLED'").get() as { c: number }).c
    totalHeld      = (db.prepare("SELECT COUNT(*) as c FROM contracts WHERE status = 'HELD'").get() as { c: number }).c
  } catch {}

  return (
    <div style={{ background: C.bg, minHeight: '100vh', color: C.text1 }}>
      {/* Sidebar-consistent header */}
      <div style={{ borderBottom: `1px solid ${C.border}`, padding: '20px 40px', display: 'flex', alignItems: 'center', gap: 16 }}>
        <Link href="/dashboard" style={{ textDecoration: 'none', fontSize: 12, color: C.text3 }}>← Dashboard</Link>
        <span style={{ color: C.border2 }}>›</span>
        <span style={{ fontSize: 12, color: C.text2 }}>Disputes</span>
      </div>

      <div style={{ maxWidth: 900, margin: '0 auto', padding: '40px 40px 100px' }}>

        {/* Header */}
        <div style={{ marginBottom: 36 }}>
          <h1 style={{ fontSize: 26, fontWeight: 800, letterSpacing: '-0.04em', color: C.text1, margin: '0 0 8px', fontFamily: C.disp }}>
            Escrow Disputes
          </h1>
          <p style={{ fontSize: 13, color: C.text3, margin: 0 }}>
            Contracts where attestation failed or escrow was held pending review.
          </p>
        </div>

        {/* Stats row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 32 }}>
          {[
            { label: 'Total Disputes', value: totalCancelled + totalHeld, color: C.text1 },
            { label: 'Hash Mismatch (Cancelled)', value: totalCancelled, color: C.red,   sub: 'Escrow returned to buyer' },
            { label: 'Held for Review', value: totalHeld, color: C.amber, sub: 'Pending manual resolution' },
          ].map(s => (
            <div key={s.label} style={{
              background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, padding: '18px 20px',
            }}>
              <div style={{ fontSize: 9, color: C.text3, textTransform: 'uppercase', letterSpacing: '.1em', fontFamily: C.mono, marginBottom: 6 }}>
                {s.label}
              </div>
              <div style={{ fontSize: 32, fontWeight: 800, color: s.color, fontFamily: C.mono, letterSpacing: '-0.04em', lineHeight: 1 }}>
                {s.value}
              </div>
              {s.sub && <div style={{ fontSize: 10, color: C.text3, marginTop: 4 }}>{s.sub}</div>}
            </div>
          ))}
        </div>

        {disputes.length === 0 ? (
          <div style={{
            background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12,
            padding: '60px 40px', textAlign: 'center',
          }}>
            <div style={{ fontSize: 32, marginBottom: 16 }}>🛡️</div>
            <div style={{ fontSize: 15, fontWeight: 700, color: C.text1, marginBottom: 8, fontFamily: C.disp }}>
              No disputes — all escrows cleared
            </div>
            <div style={{ fontSize: 13, color: C.text3, maxWidth: 400, margin: '0 auto 24px', lineHeight: 1.65 }}>
              Disputes occur when a submitted work hash doesn&apos;t match the committed task hash.
              Stvor cancels the Stripe PaymentIntent and returns funds to the buyer automatically.
            </div>
            <Link href="/attack" style={{
              textDecoration: 'none',
              display: 'inline-block',
              background: 'rgba(239,68,68,0.08)',
              border: '1px solid rgba(239,68,68,0.25)',
              color: C.red, padding: '10px 20px', borderRadius: 7,
              fontSize: 12, fontWeight: 700,
            }}>
              Simulate an attack →
            </Link>
          </div>
        ) : (
          <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12, overflow: 'hidden' }}>
            {/* Header row */}
            <div style={{
              display: 'grid', gridTemplateColumns: '120px 1fr 80px 120px 80px',
              padding: '10px 24px', gap: 12,
              fontSize: 10, color: C.text3, letterSpacing: '.08em', textTransform: 'uppercase',
              fontFamily: C.mono, borderBottom: `1px solid ${C.border}`,
            }}>
              <span>Contract</span><span>Task</span>
              <span style={{ textAlign: 'right' }}>Amount</span>
              <span>Status</span>
              <span style={{ textAlign: 'right' }}>Time</span>
            </div>

            {disputes.map((d, i) => (
              <div key={d.id} style={{
                display: 'grid', gridTemplateColumns: '120px 1fr 80px 120px 80px',
                padding: '14px 24px', gap: 12, alignItems: 'center',
                borderBottom: i < disputes.length - 1 ? `1px solid ${C.border}` : 'none',
              }}>
                <span style={{ fontSize: 11, color: C.blue, fontFamily: C.mono, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {d.id.slice(0, 8).toUpperCase()}
                </span>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: 12, color: C.text1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {d.task_description.slice(0, 80)}
                  </div>
                  {d.stripe_payment_intent_id && (
                    <div style={{ fontSize: 10, color: C.text3, fontFamily: C.mono }}>
                      PI: {d.stripe_payment_intent_id.slice(0, 20)}…
                    </div>
                  )}
                </div>
                <div style={{ textAlign: 'right', fontSize: 12, fontWeight: 600, color: C.text2, fontFamily: C.mono }}>
                  {fmtUSD(d.budget_cents)}
                </div>
                <div>
                  <span style={{
                    fontSize: 10, fontWeight: 700, padding: '3px 8px', borderRadius: 4,
                    background: d.status === 'CANCELLED'
                      ? 'rgba(239,68,68,0.08)' : 'rgba(245,158,11,0.08)',
                    color: d.status === 'CANCELLED' ? C.red : C.amber,
                    border: `1px solid ${d.status === 'CANCELLED' ? 'rgba(239,68,68,0.2)' : 'rgba(245,158,11,0.2)'}`,
                    fontFamily: C.mono,
                  }}>
                    {d.status === 'CANCELLED' ? '⚠ HASH MISMATCH' : '⏸ HELD'}
                  </span>
                </div>
                <div style={{ textAlign: 'right', fontSize: 11, color: C.text3 }}>
                  {timeAgo(d.created_at)}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* How disputes work */}
        <div style={{
          marginTop: 32,
          background: 'rgba(239,68,68,0.04)', border: '1px solid rgba(239,68,68,0.15)',
          borderRadius: 10, padding: '20px 24px',
        }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: C.red, textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: 12 }}>
            How disputes are triggered
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            {[
              {
                step: '1',
                title: 'Hash committed at creation',
                desc: 'SHA-256 of the task payload is committed when the contract is created. Any tampering is detectable.',
              },
              {
                step: '2',
                title: 'Work submitted with hash',
                desc: 'The seller agent submits work + SHA-256(work). Stvor verifies the hash matches before releasing escrow.',
              },
              {
                step: '3',
                title: 'Mismatch → automatic cancellation',
                desc: 'If hashes don\'t match, the Stripe PaymentIntent is cancelled. Funds return to buyer within seconds.',
              },
              {
                step: '4',
                title: 'Trust score penalised',
                desc: 'The offending agent\'s trust_score drops −15 points, persisted to Redis across all instances.',
              },
            ].map(s => (
              <div key={s.step} style={{ display: 'flex', gap: 12 }}>
                <div style={{
                  width: 22, height: 22, borderRadius: '50%', flexShrink: 0,
                  background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.25)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 10, fontWeight: 700, color: C.red, fontFamily: C.mono,
                }}>{s.step}</div>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: C.text1, marginBottom: 3 }}>{s.title}</div>
                  <div style={{ fontSize: 11, color: C.text3, lineHeight: 1.6 }}>{s.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  )
}
