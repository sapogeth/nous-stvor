'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

// ── Design tokens ─────────────────────────────────────────────────────────────
const C = {
  bg:      '#0A0A0F',
  surface: '#0E0E17',
  surface2:'#13131C',
  border:  '#1C1C28',
  border2: '#252535',
  text1:   '#F1F5F9',
  text2:   '#9898C0',
  text3:   '#6868A0',
  blue:    '#3B82F6',
  blueD:   'rgba(59,130,246,0.08)',
  blueB:   'rgba(59,130,246,0.20)',
  mint:    '#00DDA0',
  mintD:   'rgba(0,221,160,0.08)',
  red:     '#EF4444',
  redD:    'rgba(239,68,68,0.08)',
  amber:   '#F59E0B',
  indigo:  '#6366F1',
  mono:    '"SF Mono","Fira Code",monospace',
  disp:    "'Space Grotesk',system-ui,sans-serif",
}

// ── Types ─────────────────────────────────────────────────────────────────────
interface TopAgent {
  id: string; name: string; organization: string | null
  trustScore: number; totalContracts: number; successfulContracts: number
  totalRevenueCents: number; revenuePct: number
}
interface Receipt {
  id: string; fullId: string; agentName: string; agentId: string
  organization: string; judgeScore: number; escrowStatus: string
  trustDelta: number; generatedAt: string
}
interface DashData {
  topAgents: TopAgent[]
  recentReceipts: Receipt[]
  disputes: { total: number; complete: number; cancelled: number; held: number; inProgress: number }
  volumePoints: { label: string; valueCents: number }[]
  totalVolumeCents: number
  updatedAt: string
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function fmtUSD(cents: number) {
  if (cents >= 100_000) return `$${(cents / 100_000).toFixed(1)}K`
  return `$${(cents / 100).toFixed(0)}`
}
function fmtBig(cents: number) {
  if (cents >= 100_000_00) return `$${(cents / 100_000_00).toFixed(2)}M`
  if (cents >= 100_000) return `$${(cents / 100_000).toFixed(1)}K`
  return `$${(cents / 100).toFixed(0)}`
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

// ── Sidebar ───────────────────────────────────────────────────────────────────
const NAV_ITEMS = [
  { href: '/dashboard',  label: 'Overview',  icon: GridIcon     },
  { href: '/receipts',   label: 'Receipts',  icon: ReceiptIcon  },
  { href: '/demo',       label: 'Escrow',    icon: EscrowIcon   },
  { href: '/disputes',   label: 'Disputes',  icon: DisputeIcon  },
  { href: '/agents',     label: 'Agents',    icon: AgentIcon    },
  { href: '/arena',      label: 'Arena',     icon: ArenaIcon    },
  { href: '/ats-1',      label: 'Protocol',  icon: SettingsIcon },
]

function Sidebar() {
  const path = usePathname()
  return (
    <aside style={{
      width: 220, flexShrink: 0,
      background: C.surface,
      borderRight: `1px solid ${C.border}`,
      display: 'flex', flexDirection: 'column',
      height: '100vh', position: 'sticky', top: 0,
    }}>
      {/* Logo */}
      <div style={{ padding: '20px 20px 16px', borderBottom: `1px solid ${C.border}` }}>
        <Link href="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 32, height: 32, borderRadius: 8,
            background: C.blue, display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 14, fontWeight: 800, color: '#fff', fontFamily: C.disp,
          }}>S</div>
          <div>
            <div style={{ fontSize: 15, fontWeight: 700, color: C.text1, fontFamily: C.disp, letterSpacing: '-0.03em' }}>Stvor</div>
            <div style={{ fontSize: 10, color: C.text3, letterSpacing: '.04em' }}>Trust Infrastructure</div>
          </div>
        </Link>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: '12px 10px', display: 'flex', flexDirection: 'column', gap: 2 }}>
        {NAV_ITEMS.map(item => {
          const active = path === item.href
          const Icon = item.icon
          return (
            <Link key={item.href} href={item.href} style={{ textDecoration: 'none' }}>
              <div style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '8px 10px', borderRadius: 7,
                background: active ? C.blueD : 'transparent',
                border: active ? `1px solid ${C.blueB}` : '1px solid transparent',
                color: active ? C.blue : C.text2,
                fontSize: 13, fontWeight: active ? 600 : 400,
                transition: 'all .12s',
                cursor: 'pointer',
              }}>
                <Icon size={15} color={active ? C.blue : C.text3} />
                {item.label}
              </div>
            </Link>
          )
        })}
      </nav>

      {/* Footer */}
      <div style={{ padding: '12px 14px', borderTop: `1px solid ${C.border}` }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{
            width: 30, height: 30, borderRadius: '50%',
            background: 'rgba(59,130,246,0.15)', border: `1px solid ${C.blueB}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 11, fontWeight: 700, color: C.blue,
          }}>AI</div>
          <div>
            <div style={{ fontSize: 12, fontWeight: 600, color: C.text1 }}>Stvor Agent</div>
            <div style={{ fontSize: 10, color: C.text3 }}>nous.stvor.xyz</div>
          </div>
        </div>
      </div>
    </aside>
  )
}

// ── Card shell ────────────────────────────────────────────────────────────────
function Card({ title, icon, linkHref, linkLabel, children, style }: {
  title: string; icon?: React.ReactNode; linkHref?: string; linkLabel?: string
  children: React.ReactNode; style?: React.CSSProperties
}) {
  return (
    <div style={{
      background: C.surface,
      border: `1px solid ${C.border}`,
      borderRadius: 12, overflow: 'hidden',
      display: 'flex', flexDirection: 'column',
      ...style,
    }}>
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '16px 20px', borderBottom: `1px solid ${C.border}`,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {icon && <div style={{
            width: 30, height: 30, borderRadius: 7,
            background: C.surface2, border: `1px solid ${C.border}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>{icon}</div>}
          <span style={{ fontSize: 15, fontWeight: 700, color: C.text1, fontFamily: C.disp, letterSpacing: '-0.02em' }}>
            {title}
          </span>
        </div>
        {linkHref && (
          <Link href={linkHref} style={{
            textDecoration: 'none', fontSize: 12, color: C.blue,
            display: 'flex', alignItems: 'center', gap: 4,
          }}>
            {linkLabel ?? 'View all'} <span style={{ fontSize: 10 }}>›</span>
          </Link>
        )}
      </div>
      <div style={{ flex: 1 }}>{children}</div>
    </div>
  )
}

// ── Top Agents card ───────────────────────────────────────────────────────────
function TopAgentsCard({ agents }: { agents: TopAgent[] }) {
  return (
    <Card title="Top Agents" icon={<AgentIcon size={14} color={C.blue} />} linkHref="/agents" linkLabel="View all">
      <div>
        <div style={{
          display: 'grid', gridTemplateColumns: '36px 1fr 70px 120px',
          padding: '8px 20px', gap: 8,
          fontSize: 10, color: C.text3, letterSpacing: '.08em', textTransform: 'uppercase',
          fontFamily: C.mono, borderBottom: `1px solid ${C.border}`,
        }}>
          <span>Rank</span><span>Agent</span><span style={{ textAlign: 'right' }}>Score</span>
          <span>Escrow Volume</span>
        </div>
        {agents.map((a, i) => (
          <div key={a.id} style={{
            display: 'grid', gridTemplateColumns: '36px 1fr 70px 120px',
            padding: '11px 20px', gap: 8, alignItems: 'center',
            borderBottom: i < agents.length - 1 ? `1px solid ${C.border}` : 'none',
            background: i === 0 ? 'rgba(59,130,246,0.03)' : 'transparent',
          }}>
            {/* Rank */}
            <div style={{
              width: 22, height: 22, borderRadius: '50%',
              background: i < 3 ? C.blue : C.surface2,
              border: i < 3 ? 'none' : `1px solid ${C.border}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 10, fontWeight: 700, color: i < 3 ? '#fff' : C.text3,
              fontFamily: C.mono,
            }}>{i + 1}</div>

            {/* Name */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
              <div style={{
                width: 28, height: 28, borderRadius: '50%', flexShrink: 0,
                background: `hsl(${(i * 47 + 210) % 360}, 60%, 25%)`,
                border: `1px solid ${C.border2}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 10, fontWeight: 700, color: C.text2, fontFamily: C.mono,
              }}>
                {a.name.slice(0, 2).toUpperCase()}
              </div>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: C.text1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {a.name}
                  {a.trustScore >= 75 && (
                    <span style={{ marginLeft: 4, color: C.blue, fontSize: 10 }}>●</span>
                  )}
                </div>
                <div style={{ fontSize: 10, color: C.text3 }}>{a.totalContracts} contracts</div>
              </div>
            </div>

            {/* Trust score */}
            <div style={{ textAlign: 'right', fontSize: 13, fontWeight: 700, color: C.text1, fontFamily: C.mono }}>
              {a.trustScore.toFixed(0)}
            </div>

            {/* Revenue bar */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 11, color: C.text2, fontFamily: C.mono, flexShrink: 0, width: 44, textAlign: 'right' }}>
                {fmtUSD(a.totalRevenueCents)}
              </span>
              <div style={{ flex: 1, height: 4, background: C.surface2, borderRadius: 2 }}>
                <div style={{
                  height: '100%', borderRadius: 2,
                  width: `${a.revenuePct}%`,
                  background: i === 0 ? C.blue : i === 1 ? '#60A5FA' : '#93C5FD',
                  transition: 'width .4s ease',
                }} />
              </div>
            </div>
          </div>
        ))}
      </div>
    </Card>
  )
}

// ── Recent Receipts card ──────────────────────────────────────────────────────
function RecentReceiptsCard({ receipts }: { receipts: Receipt[] }) {
  return (
    <Card title="Recent Receipts" icon={<ReceiptIcon size={14} color={C.blue} />} linkHref="/receipts" linkLabel="View all">
      <div>
        <div style={{
          display: 'grid', gridTemplateColumns: '100px 1fr 60px 80px 60px',
          padding: '8px 20px', gap: 8,
          fontSize: 10, color: C.text3, letterSpacing: '.08em', textTransform: 'uppercase',
          fontFamily: C.mono, borderBottom: `1px solid ${C.border}`,
        }}>
          <span>ID</span><span>Agent</span><span style={{ textAlign: 'center' }}>Score</span>
          <span>Status</span><span style={{ textAlign: 'right' }}>Time</span>
        </div>
        {receipts.length === 0 ? (
          <div style={{ padding: '32px 20px', textAlign: 'center', fontSize: 12, color: C.text3 }}>
            No receipts yet — run the demo to generate receipts.
          </div>
        ) : receipts.map((r, i) => (
          <Link key={r.id} href={`/receipts/${r.fullId}`} style={{ textDecoration: 'none' }}>
            <div style={{
              display: 'grid', gridTemplateColumns: '100px 1fr 60px 80px 60px',
              padding: '10px 20px', gap: 8, alignItems: 'center',
              borderBottom: i < receipts.length - 1 ? `1px solid ${C.border}` : 'none',
              transition: 'background .1s',
              cursor: 'pointer',
            }}
              onMouseEnter={e => (e.currentTarget.style.background = C.surface2)}
              onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
            >
              <span style={{ fontSize: 11, color: C.blue, fontFamily: C.mono }}>R-{r.id}</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{
                  width: 22, height: 22, borderRadius: '50%', flexShrink: 0,
                  background: 'rgba(59,130,246,0.15)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 8, fontWeight: 700, color: C.blue,
                }}>
                  {r.agentName.slice(0, 2).toUpperCase()}
                </div>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: 12, color: C.text1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {r.agentName}
                  </div>
                  <div style={{ fontSize: 10, color: C.text3 }}>{r.organization}</div>
                </div>
              </div>
              <div style={{ textAlign: 'center', fontSize: 12, fontWeight: 600, color: r.judgeScore >= 70 ? C.mint : r.judgeScore >= 50 ? C.amber : C.red, fontFamily: C.mono }}>
                {r.judgeScore}
              </div>
              <div>
                <span style={{
                  fontSize: 10, fontWeight: 600, padding: '2px 7px', borderRadius: 3,
                  background: r.escrowStatus === 'RELEASED' ? C.mintD : r.escrowStatus === 'CANCELLED' ? C.redD : 'rgba(245,158,11,0.08)',
                  color: r.escrowStatus === 'RELEASED' ? C.mint : r.escrowStatus === 'CANCELLED' ? C.red : C.amber,
                  border: `1px solid ${r.escrowStatus === 'RELEASED' ? 'rgba(0,221,160,0.2)' : r.escrowStatus === 'CANCELLED' ? 'rgba(239,68,68,0.2)' : 'rgba(245,158,11,0.2)'}`,
                }}>
                  {r.escrowStatus}
                </span>
              </div>
              <div style={{ textAlign: 'right', fontSize: 11, color: C.text3 }}>{timeAgo(r.generatedAt)}</div>
            </div>
          </Link>
        ))}
      </div>
    </Card>
  )
}

// ── Disputes card ─────────────────────────────────────────────────────────────
function DisputesCard({ d }: { d: DashData['disputes'] }) {
  const openPct      = d.total > 0 ? Math.round((d.cancelled / d.total) * 100) : 0
  const inReviewPct  = d.total > 0 ? Math.round((d.held    / d.total) * 100) : 0
  const resolvedPct  = 100 - openPct - inReviewPct

  // CSS conic-gradient donut
  const openEnd    = openPct
  const reviewEnd  = openPct + inReviewPct
  const gradient   = `conic-gradient(${C.blue} 0% ${openEnd}%, ${C.indigo} ${openEnd}% ${reviewEnd}%, #2D2D44 ${reviewEnd}% 100%)`

  return (
    <Card title="Disputes" icon={<DisputeIcon size={14} color={C.amber} />} linkHref="/disputes" linkLabel="View all">
      <div style={{ padding: '20px' }}>
        <div style={{ display: 'flex', gap: 20, alignItems: 'center' }}>
          {/* Stats */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16, flex: 1 }}>
            {[
              { label: 'TOTAL DISPUTES', value: d.cancelled + d.held, sub: 'hash mismatch + held' },
              { label: 'OPEN (CANCELLED)', value: d.cancelled, sub: 'funds returned', color: C.red },
              { label: 'IN REVIEW (HELD)', value: d.held, sub: 'manual review', color: C.amber },
              { label: 'RESOLVED', value: d.complete, sub: 'attestation passed', color: C.mint },
            ].map(s => (
              <div key={s.label}>
                <div style={{ fontSize: 9, color: C.text3, letterSpacing: '.1em', textTransform: 'uppercase', fontFamily: C.mono, marginBottom: 2 }}>
                  {s.label}
                </div>
                <div style={{ fontSize: 28, fontWeight: 800, color: s.color ?? C.text1, fontFamily: C.mono, letterSpacing: '-0.04em', lineHeight: 1 }}>
                  {s.value}
                </div>
                <div style={{ fontSize: 10, color: C.text3, marginTop: 1 }}>{s.sub}</div>
              </div>
            ))}
          </div>

          {/* Donut */}
          <div style={{ flexShrink: 0, position: 'relative', width: 140, height: 140 }}>
            <div style={{
              width: 140, height: 140, borderRadius: '50%',
              background: gradient,
            }} />
            {/* Center hole */}
            <div style={{
              position: 'absolute', top: '50%', left: '50%',
              transform: 'translate(-50%, -50%)',
              width: 80, height: 80, borderRadius: '50%',
              background: C.surface,
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            }}>
              <span style={{ fontSize: 22, fontWeight: 800, color: C.text1, fontFamily: C.mono, lineHeight: 1 }}>{d.total}</span>
              <span style={{ fontSize: 9, color: C.text3, letterSpacing: '.06em' }}>Total</span>
            </div>
          </div>
        </div>

        {/* Legend */}
        <div style={{ display: 'flex', gap: 16, marginTop: 16, paddingTop: 16, borderTop: `1px solid ${C.border}` }}>
          {[
            { color: C.blue,   label: 'Open',       pct: openPct,     n: d.cancelled },
            { color: C.indigo, label: 'In Review',  pct: inReviewPct, n: d.held },
            { color: '#2D2D44',label: 'Resolved',   pct: resolvedPct, n: d.complete },
          ].map(l => (
            <div key={l.label} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: C.text2 }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: l.color, flexShrink: 0 }} />
              {l.label} <span style={{ color: C.text3 }}>{l.pct}% ({l.n})</span>
            </div>
          ))}
        </div>
      </div>
    </Card>
  )
}

// ── Escrow Volume chart ───────────────────────────────────────────────────────
function VolumeCard({ points, totalCents }: { points: DashData['volumePoints']; totalCents: number }) {
  const max = Math.max(...points.map(p => p.valueCents), 1)
  const W = 340, H = 120, PAD = { t: 12, b: 28, l: 0, r: 0 }
  const chartW = W - PAD.l - PAD.r
  const chartH = H - PAD.t - PAD.b
  const n = points.length

  const x = (i: number) => PAD.l + (i / (n - 1)) * chartW
  const y = (v: number) => PAD.t + chartH - (v / max) * chartH

  const path = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${x(i).toFixed(1)} ${y(p.valueCents).toFixed(1)}`).join(' ')
  const area = path + ` L ${x(n - 1).toFixed(1)} ${(PAD.t + chartH).toFixed(1)} L ${x(0).toFixed(1)} ${(PAD.t + chartH).toFixed(1)} Z`

  // Last point tooltip
  const last = points[points.length - 1]
  const lastX = x(n - 1)
  const lastY = y(last?.valueCents ?? 0)

  return (
    <Card title="Escrow Volume" icon={<EscrowIcon size={14} color={C.mint} />}>
      <div style={{ padding: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginBottom: 4 }}>
          <span style={{ fontSize: 10, color: C.text3, textTransform: 'uppercase', letterSpacing: '.08em', fontFamily: C.mono }}>
            TOTAL VOLUME
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
          <span style={{ fontSize: 30, fontWeight: 800, color: C.text1, fontFamily: C.mono, letterSpacing: '-0.04em' }}>
            {fmtBig(totalCents)}
          </span>
          <span style={{
            fontSize: 11, fontWeight: 600, color: C.mint,
            background: C.mintD, border: '1px solid rgba(0,221,160,0.2)',
            borderRadius: 4, padding: '2px 6px',
          }}>↑ live</span>
        </div>

        {/* SVG Chart */}
        <div style={{ overflowX: 'auto' }}>
          <svg width={W} height={H} style={{ overflow: 'visible' }}>
            <defs>
              <linearGradient id="volGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={C.blue} stopOpacity="0.25" />
                <stop offset="100%" stopColor={C.blue} stopOpacity="0" />
              </linearGradient>
            </defs>

            {/* Y-axis grid lines */}
            {[0, 0.5, 1].map(f => (
              <line key={f}
                x1={PAD.l} y1={PAD.t + chartH * (1 - f)}
                x2={W - PAD.r} y2={PAD.t + chartH * (1 - f)}
                stroke={C.border} strokeWidth={1} strokeDasharray="2,4"
              />
            ))}

            {/* Area fill */}
            <path d={area} fill="url(#volGrad)" />

            {/* Line */}
            <path d={path} fill="none" stroke={C.blue} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />

            {/* Data points */}
            {points.map((p, i) => (
              <circle key={i} cx={x(i)} cy={y(p.valueCents)} r={3}
                fill={i === n - 1 ? C.blue : C.surface}
                stroke={C.blue} strokeWidth={1.5}
              />
            ))}

            {/* Last point tooltip */}
            {last && last.valueCents > 0 && (
              <g>
                <rect x={lastX - 36} y={lastY - 28} width={72} height={22} rx={4}
                  fill={C.surface2} stroke={C.border2} />
                <text x={lastX} y={lastY - 13} textAnchor="middle"
                  fontSize={9} fill={C.text3} fontFamily="monospace">{last.label}</text>
                <text x={lastX} y={lastY - 4} textAnchor="middle"
                  fontSize={9} fill={C.text1} fontFamily="monospace" fontWeight="600">
                  {fmtUSD(last.valueCents)}
                </text>
              </g>
            )}

            {/* X-axis labels */}
            {points.filter((_, i) => i === 0 || i === Math.floor(n / 2) || i === n - 1).map((p, _, arr) => {
              const origIdx = points.indexOf(p)
              return (
                <text key={origIdx} x={x(origIdx)} y={H - 4}
                  textAnchor="middle" fontSize={9} fill={C.text3} fontFamily="monospace">
                  {p.label}
                </text>
              )
            })}
          </svg>
        </div>
      </div>
    </Card>
  )
}

// ── Icons ─────────────────────────────────────────────────────────────────────
function GridIcon({ size = 16, color = C.text2 }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none">
      <rect x="1" y="1" width="6" height="6" rx="1.5" fill={color} />
      <rect x="9" y="1" width="6" height="6" rx="1.5" fill={color} />
      <rect x="1" y="9" width="6" height="6" rx="1.5" fill={color} />
      <rect x="9" y="9" width="6" height="6" rx="1.5" fill={color} />
    </svg>
  )
}
function ReceiptIcon({ size = 16, color = C.text2 }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none">
      <path d="M3 1h10v14l-2-1.5-2 1.5-2-1.5-2 1.5V1z" stroke={color} strokeWidth="1.2" fill="none" />
      <line x1="5.5" y1="5.5" x2="10.5" y2="5.5" stroke={color} strokeWidth="1.2" strokeLinecap="round" />
      <line x1="5.5" y1="8" x2="9" y2="8" stroke={color} strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  )
}
function EscrowIcon({ size = 16, color = C.text2 }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none">
      <rect x="2" y="5" width="12" height="9" rx="1.5" stroke={color} strokeWidth="1.2" />
      <path d="M5 5V4a3 3 0 016 0v1" stroke={color} strokeWidth="1.2" strokeLinecap="round" />
      <circle cx="8" cy="9.5" r="1.5" fill={color} />
    </svg>
  )
}
function DisputeIcon({ size = 16, color = C.text2 }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none">
      <path d="M8 2L1.5 13h13L8 2z" stroke={color} strokeWidth="1.2" strokeLinejoin="round" />
      <line x1="8" y1="6" x2="8" y2="9.5" stroke={color} strokeWidth="1.2" strokeLinecap="round" />
      <circle cx="8" cy="11.5" r=".75" fill={color} />
    </svg>
  )
}
function AgentIcon({ size = 16, color = C.text2 }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none">
      <circle cx="8" cy="5.5" r="2.5" stroke={color} strokeWidth="1.2" />
      <path d="M2 14c0-3.3 2.7-5 6-5s6 1.7 6 5" stroke={color} strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  )
}
function ArenaIcon({ size = 16, color = C.text2 }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none">
      <polygon points="8,1.5 14.5,12.5 1.5,12.5" stroke={color} strokeWidth="1.2" strokeLinejoin="round" fill="none" />
      <line x1="8" y1="5" x2="8" y2="9" stroke={color} strokeWidth="1.2" strokeLinecap="round" />
      <circle cx="8" cy="11" r=".75" fill={color} />
    </svg>
  )
}
function SettingsIcon({ size = 16, color = C.text2 }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none">
      <circle cx="8" cy="8" r="2" stroke={color} strokeWidth="1.2" />
      <path d="M8 1v2M8 13v2M1 8h2M13 8h2M3.1 3.1l1.4 1.4M11.5 11.5l1.4 1.4M3.1 12.9l1.4-1.4M11.5 4.5l1.4-1.4" stroke={color} strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  )
}

// ── Main Dashboard ────────────────────────────────────────────────────────────
export default function DashboardPage() {
  const [data, setData] = useState<DashData | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch('/api/dashboard')
      if (res.ok) setData(await res.json())
    } catch { /* silent */ }
    finally { setLoading(false) }
  }, [])

  useEffect(() => {
    fetchData()
    const t = setInterval(fetchData, 15000) // auto-refresh every 15s
    return () => clearInterval(t)
  }, [fetchData])

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: C.bg, color: C.text1, fontFamily: C.disp }}>
      <Sidebar />

      {/* Main */}
      <div style={{ flex: 1, overflow: 'auto' }}>
        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '20px 28px', borderBottom: `1px solid ${C.border}`,
          position: 'sticky', top: 0, background: C.bg, zIndex: 10,
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
              <Link href="/demo" style={{ textDecoration: 'none', fontSize: 11, color: C.text3, display: 'flex', alignItems: 'center', gap: 3 }}>
                ← Live Demo
              </Link>
              <span style={{ color: C.border2, fontSize: 11 }}>/</span>
              <Link href="/attack" style={{ textDecoration: 'none', fontSize: 11, color: C.text3 }}>Attack Sim</Link>
              <span style={{ color: C.border2, fontSize: 11 }}>/</span>
              <Link href="/ats-1" style={{ textDecoration: 'none', fontSize: 11, color: C.text3 }}>ATS-1</Link>
            </div>
            <h1 style={{ fontSize: 22, fontWeight: 700, letterSpacing: '-0.03em', color: C.text1, margin: 0, fontFamily: C.disp }}>
              Trust Dashboard
            </h1>
            <p style={{ fontSize: 12, color: C.text3, margin: '3px 0 0' }}>
              Overview of trust, activity, and escrow performance.
            </p>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 6,
              background: C.surface, border: `1px solid ${C.border}`,
              borderRadius: 7, padding: '7px 12px', fontSize: 12, color: C.text2,
            }}>
              <span style={{ fontSize: 11 }}>📅</span>
              Live · refreshes every 15s
            </div>
            <a href="/api/dashboard" target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none' }}>
              <div style={{
                display: 'flex', alignItems: 'center', gap: 6,
                background: C.surface, border: `1px solid ${C.border}`,
                borderRadius: 7, padding: '7px 12px', fontSize: 12, color: C.text2,
                cursor: 'pointer',
              }}>
                ↓ Export JSON
              </div>
            </a>
          </div>
        </div>

        {/* Content */}
        <div style={{ padding: '24px 28px' }}>
          {loading ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 300, color: C.text3, fontSize: 13 }}>
              Loading dashboard data…
            </div>
          ) : !data ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 300, color: C.red, fontSize: 13 }}>
              Failed to load. <Link href="/demo" style={{ color: C.blue, marginLeft: 6 }}>Run demo first →</Link>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              {/* Row 1 */}
              <TopAgentsCard agents={data.topAgents} />
              <RecentReceiptsCard receipts={data.recentReceipts} />

              {/* Row 2 */}
              <DisputesCard d={data.disputes} />
              <VolumeCard points={data.volumePoints} totalCents={data.totalVolumeCents} />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
