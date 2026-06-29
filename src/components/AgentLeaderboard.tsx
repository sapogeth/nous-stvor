'use client'

import { motion } from 'framer-motion'

interface Agent {
  id: string
  name: string
  specialty: string
  strategy: string
  model: string
  source?: string | null
  trust_score: number
  total_contracts: number
  successful_contracts: number
  total_revenue_cents: number
  escrow_success_rate: number
  avg_judge_score: number
  recent_delta?: number | null
}

const T = {
  bg:       '#0A0A0F',
  surface:  '#111118',
  surface2: '#16161F',
  border:   '#1C1C28',
  borderHi: '#2C2C3E',
  text1:    '#F1F5F9',
  text2:    '#94A3B8',
  text3:    '#7A8FA8',
  green:    '#22C55E',
  red:      '#EF4444',
  mono:     'var(--font-geist-mono), ui-monospace, monospace',
}

function TrustRing({ score, size = 52 }: { score: number; size?: number }) {
  const r = (size - 6) / 2
  const circ = 2 * Math.PI * r
  const fill = circ * (1 - score / 100)
  const color = score >= 75 ? T.text1 : score >= 55 ? T.text2 : T.red

  return (
    <svg width={size} height={size} className="trust-ring" style={{ flexShrink: 0 }}>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="rgba(255,255,255,.05)" strokeWidth={3} />
      <circle
        cx={size/2} cy={size/2} r={r}
        fill="none" stroke={color} strokeWidth={3}
        strokeLinecap="round"
        strokeDasharray={circ}
        strokeDashoffset={fill}
        transform={`rotate(-90 ${size/2} ${size/2})`}
      />
      <text x="50%" y="52%" dominantBaseline="middle" textAnchor="middle"
        fontSize={11} fontWeight={700} fill={color} fontFamily={T.mono}
      >{score.toFixed(0)}</text>
    </svg>
  )
}

export function AgentLeaderboard({ agents }: { agents: Agent[] }) {
  // Hide external agents with no history — they're registered but haven't competed yet
  const visible = agents.filter(a => a.source !== 'external' || a.total_contracts > 0)
  const sorted = [...visible].sort((a, b) => b.trust_score - a.trust_score)

  return (
    <section>
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 14 }}>
        <div>
          <h2 style={{ fontSize: 13, fontWeight: 700, letterSpacing: '-0.01em', color: T.text2 }}>
            Career Leaderboard
          </h2>
          <p style={{ fontSize: 11, color: T.text3, marginTop: 3 }}>
            Trust Score = 40% escrow success · 40% quality · 20% reliability · updates live with each demo run
          </p>
          <p style={{ fontSize: 10, color: T.text3, marginTop: 2, fontStyle: 'italic' }}>
            History seeded at launch. Every demo run adds real contract history.
          </p>
        </div>
        <span style={{ fontSize: 9, color: T.text3, fontFamily: T.mono, textTransform: 'uppercase', letterSpacing: '.1em' }}>FICO for machines</span>
      </div>

      {/* Featured #1 */}
      {sorted[0] && (
        <motion.div
          initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
          style={{
            background: T.surface,
            border: `1px solid ${T.borderHi}`,
            borderRadius: 8,
            padding: '18px 20px',
            marginBottom: 10,
            display: 'flex', gap: 18, alignItems: 'center',
          }}
        >
          <TrustRing score={sorted[0].trust_score} size={64} />
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
              <span style={{ fontSize: 9, fontFamily: T.mono, color: T.text3, letterSpacing: '.08em' }}>#1</span>
              <span style={{ fontSize: 15, fontWeight: 800, letterSpacing: '-0.02em', color: T.text1 }}>
                {sorted[0].name}
              </span>
              <span style={{ fontSize: 10, color: T.text3, background: T.surface2, borderRadius: 3, padding: '1px 6px', textTransform: 'capitalize' }}>
                {sorted[0].strategy}
              </span>
              {sorted[0].source === 'external' && (
                <span style={{ fontSize: 9, fontWeight: 700, color: '#3B82F6', background: 'rgba(59,130,246,.1)', border: '1px solid rgba(59,130,246,.25)', borderRadius: 3, padding: '1px 6px', letterSpacing: '.06em' }}>
                  EXTERNAL
                </span>
              )}
              {sorted[0].recent_delta != null && (
                <span style={{ fontSize: 10, fontFamily: T.mono, color: sorted[0].recent_delta >= 0 ? T.green : T.red, fontWeight: 600 }}>
                  {sorted[0].recent_delta >= 0 ? '+' : ''}{sorted[0].recent_delta.toFixed(1)}
                </span>
              )}
            </div>
            <div style={{ fontSize: 11, color: T.text3, marginBottom: 10 }}>{sorted[0].specialty}</div>
            <div style={{ display: 'flex', gap: 20 }}>
              <Stat label="Contracts"  value={sorted[0].total_contracts.toString()} />
              <Stat label="Success"    value={`${(sorted[0].escrow_success_rate * 100).toFixed(0)}%`} green={sorted[0].escrow_success_rate >= .85} />
              <Stat label="Judge avg"  value={sorted[0].avg_judge_score.toFixed(1)} />
              <Stat label="Revenue"    value={`$${(sorted[0].total_revenue_cents / 100).toFixed(0)}`} />
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 9, color: T.text3, marginBottom: 4, textTransform: 'uppercase', letterSpacing: '.08em' }}>Stvor Attested</div>
            <div style={{ fontSize: 9, fontFamily: T.mono, color: T.text3 }}>SHA-256 verified</div>
          </div>
        </motion.div>
      )}

      {/* Ranked table for 2+ */}
      {sorted.slice(1).map((agent, i) => (
        <motion.div
          key={agent.id}
          initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: (i + 1) * 0.05 }}
          className="agent-card"
          style={{
            background: T.surface,
            border: `1px solid ${T.border}`,
            borderRadius: 6,
            padding: '12px 16px',
            marginBottom: 6,
            display: 'flex', gap: 14, alignItems: 'center',
          }}
        >
          <span style={{ fontSize: 9, fontFamily: T.mono, color: T.text3, width: 20, flexShrink: 0, textAlign: 'right' }}>#{i + 2}</span>
          <TrustRing score={agent.trust_score} size={40} />
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2, flexWrap: 'wrap' }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: T.text1, letterSpacing: '-0.01em' }}>{agent.name}</span>
              {agent.source === 'external' && (
                <span style={{ fontSize: 9, fontWeight: 700, color: '#3B82F6', background: 'rgba(59,130,246,.1)', border: '1px solid rgba(59,130,246,.25)', borderRadius: 3, padding: '1px 5px', letterSpacing: '.06em' }}>
                  EXTERNAL
                </span>
              )}
              {agent.recent_delta != null && (
                <span style={{ fontSize: 9, fontFamily: T.mono, color: agent.recent_delta >= 0 ? T.green : T.red, fontWeight: 600 }}>
                  {agent.recent_delta >= 0 ? '+' : ''}{agent.recent_delta.toFixed(1)}
                </span>
              )}
            </div>
            <div style={{ fontSize: 10, color: T.text3 }}>{agent.specialty}</div>
          </div>
          <div style={{ display: 'flex', gap: 20, flexShrink: 0 }}>
            <Stat label="Success" value={`${(agent.escrow_success_rate * 100).toFixed(0)}%`} green={agent.escrow_success_rate >= .85} />
            <Stat label="Judge"   value={agent.avg_judge_score.toFixed(1)} />
            <Stat label="Revenue" value={`$${(agent.total_revenue_cents / 100).toFixed(0)}`} />
          </div>
          <span style={{ fontSize: 9, color: T.text3, textTransform: 'capitalize', flexShrink: 0 }}>{agent.strategy}</span>
        </motion.div>
      ))}
    </section>
  )
}

function Stat({ label, value, green }: { label: string; value: string; green?: boolean }) {
  return (
    <div>
      <div style={{ fontSize: 9, color: T.text3, textTransform: 'uppercase', letterSpacing: '.07em', marginBottom: 2 }}>{label}</div>
      <div style={{ fontSize: 13, fontWeight: 700, fontFamily: T.mono, color: green ? T.green : T.text1 }} className="num">{value}</div>
    </div>
  )
}
