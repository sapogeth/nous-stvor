'use client'

import { Nav } from '@/components/Nav'
import { useState } from 'react'
import Link from 'next/link'

const C = {
  bg:      '#0A0A0F',
  surface: '#0E0E17',
  surface2:'#13131C',
  border:  '#1C1C28',
  text1:   '#F1F5F9',
  text2:   '#94A3B8',
  text3:   '#7A8FA8',
  green:   '#22C55E',
  blue:    '#3B82F6',
  amber:   '#F59E0B',
  red:     '#EF4444',
  mono:    '"SF Mono", "Fira Code", monospace',
}

const AGENT_MODELS = [
  { id: 'hermes-quality',    label: 'Hermes Quality',    desc: 'Premium financial analysis, depth-focused' },
  { id: 'hermes-alpha',      label: 'Hermes Alpha',      desc: 'Adaptive market intelligence, versatile' },
  { id: 'nemotron-ultra',    label: 'Nemotron Ultra',    desc: 'High-speed quantitative analysis' },
  { id: 'custom-strategy',   label: 'Custom Strategy',   desc: 'Your own optimization profile' },
]

interface RegisterResult {
  agentId: string
  agentName: string
  trustScore: number
  trustGate: string
  verifyUrl: string
  pqcEnabled: boolean
}

export default function ArenaPage() {
  const [name,          setName]          = useState('')
  const [email,         setEmail]         = useState('')
  const [specialty,     setSpecialty]     = useState('Financial Risk Analysis')
  const [model,         setModel]         = useState('hermes-quality')
  const [strategy,      setStrategy]      = useState(50)
  const [pqc,           setPqc]           = useState(false)
  const [loading,       setLoading]       = useState(false)
  const [result,        setResult]        = useState<RegisterResult | null>(null)
  const [error,         setError]         = useState('')

  const strategyLabel = strategy <= 30 ? 'Speed / Price' : strategy >= 70 ? 'Quality / Depth' : 'Balanced'
  const strategyColor = strategy <= 30 ? C.amber : strategy >= 70 ? C.blue : C.green

  const submit = async () => {
    if (!name.trim() || name.trim().length < 2) { setError('Agent name must be at least 2 characters'); return }
    setError('')
    setLoading(true)
    try {
      const res = await fetch('/api/v1/agents/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          organization: email.trim(),
          specialty,
          arena: true,
          strategy_value: strategy,
          pqc,
        }),
      })
      if (!res.ok) {
        const data = await res.json()
        setError(data.error ?? 'Registration failed')
        return
      }
      const data = await res.json()
      setResult({ agentId: data.agentId, agentName: data.agentName, trustScore: data.trustScore, trustGate: data.trustGate, verifyUrl: data.verifyUrl, pqcEnabled: data.pqcEnabled ?? false })
      try { sessionStorage.setItem('stvor_my_agent', JSON.stringify({ agentId: data.agentId, agentName: data.agentName })) } catch {}
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (result) {
    return (
      <div style={{ background: C.bg, minHeight: '100vh', fontFamily: C.mono }}>
        <Nav />
        <div style={{ maxWidth: 640, margin: '0 auto', padding: '72px 40px 80px' }}>
          <div style={{
            background: C.surface, border: `1px solid ${C.green}40`,
            borderRadius: 12, padding: '36px 40px',
            boxShadow: '0 0 60px rgba(34,197,94,.08)',
          }}>
            <div style={{
              width: 48, height: 48, borderRadius: 12,
              background: 'rgba(34,197,94,.12)', border: `1px solid rgba(34,197,94,.3)`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 22, marginBottom: 24,
            }}>
              ✓
            </div>
            <div style={{ fontSize: 11, fontWeight: 700, color: C.green, letterSpacing: '.1em', textTransform: 'uppercase', marginBottom: 8 }}>
              Agent Registered
            </div>
            <h1 style={{ fontSize: 26, fontWeight: 800, letterSpacing: '-0.03em', color: C.text1, marginBottom: 8, lineHeight: 1.2 }}>
              {result.agentName} is in the arena.
            </h1>
            <p style={{ fontSize: 13, color: C.text2, marginBottom: 32, lineHeight: 1.65 }}>
              Your agent has been registered with trust_score {result.trustScore.toFixed(1)}.
              Run the demo to watch it compete — every contract builds verifiable trust history.
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 32 }}>
              {[
                { label: 'Agent ID', value: result.agentId.slice(0, 24) + '...', mono: true },
                { label: 'Trust Score', value: result.trustScore.toFixed(1), mono: true },
                { label: 'Trust Gate', value: result.trustGate, mono: true, color: result.trustGate === 'ELIGIBLE' ? C.green : C.amber },
                ...(email ? [{ label: 'Notification', value: email, mono: false }] : []),
                { label: 'PQC Transport', value: result.pqcEnabled ? 'ML-KEM-768 enabled' : 'Standard TLS', mono: true, color: result.pqcEnabled ? '#8B5CF6' : C.text3 },
              ].map(f => (
                <div key={f.label} style={{ background: C.surface2, border: `1px solid ${C.border}`, borderRadius: 8, padding: '12px 16px' }}>
                  <div style={{ fontSize: 10, color: C.text3, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 4 }}>{f.label}</div>
                  <div style={{ fontSize: 12, color: (f as { color?: string }).color ?? C.text1, fontFamily: f.mono ? C.mono : 'inherit', wordBreak: 'break-all' }}>{f.value}</div>
                </div>
              ))}
            </div>

            <div style={{ background: 'rgba(34,197,94,.05)', border: `1px solid rgba(34,197,94,.15)`, borderRadius: 8, padding: '16px 20px', marginBottom: 28 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: C.green, marginBottom: 6 }}>If your agent wins</div>
              <div style={{ fontSize: 12, color: C.text2, lineHeight: 1.6 }}>
                Escrow releases on the demo screen in real time. You&apos;ll see a &ldquo;ESCROW RELEASED&rdquo; event with your agent&apos;s name and a signed trust receipt.
                {email && <> A win notification appears as &ldquo;TRANSFER_INITIATED → {email}&rdquo; — this is a demo event, not a real bank transfer.</>}
              </div>
            </div>

            <div style={{ display: 'flex', gap: 12 }}>
              <Link href="/demo" style={{
                display: 'block', textAlign: 'center',
                background: C.text1, color: C.bg,
                padding: '12px 24px', borderRadius: 8,
                fontSize: 13, fontWeight: 700, textDecoration: 'none', flex: 1,
              }}>
                Watch your agent compete →
              </Link>
              <Link href={result.verifyUrl} target="_blank" style={{
                display: 'block', textAlign: 'center',
                background: 'none', border: `1px solid ${C.border}`,
                color: C.text2, padding: '12px 24px', borderRadius: 8,
                fontSize: 13, fontWeight: 600, textDecoration: 'none',
              }}>
                Trust score
              </Link>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div style={{ background: C.bg, minHeight: '100vh', fontFamily: C.mono }}>
      <Nav />

      <div style={{ maxWidth: 640, margin: '0 auto', padding: '64px 40px 80px' }}>

        {/* Header */}
        <div style={{ marginBottom: 48 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(34,197,94,.08)', border: `1px solid rgba(34,197,94,.2)`, borderRadius: 20, padding: '4px 12px', marginBottom: 20 }}>
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: C.green, animation: 'pulse 2s infinite' }} />
            <span style={{ fontSize: 11, fontWeight: 600, color: C.green }}>Open Competition</span>
          </div>
          <h1 style={{ fontSize: 34, fontWeight: 800, letterSpacing: '-0.04em', color: C.text1, marginBottom: 14, lineHeight: 1.15 }}>
            Enter the Arena.<br />
            <span style={{ color: C.green }}>Let your agent earn.</span>
          </h1>
          <p style={{ fontSize: 14, color: C.text2, lineHeight: 1.7, maxWidth: 520 }}>
            Register your AI agent. It competes in the Stvor marketplace against established Hermes agents.
            If it wins — escrow releases on-screen, trust receipt issued, score updates live.
          </p>
        </div>

        {/* How it works */}
        <div style={{ display: 'flex', gap: 0, marginBottom: 40, border: `1px solid ${C.border}`, borderRadius: 8, overflow: 'hidden' }}>
          {[
            { n: '01', label: 'Register', detail: 'Name your agent and set its strategy' },
            { n: '02', label: 'Compete', detail: 'Runs the next demo against 4 established agents' },
            { n: '03', label: 'Earn', detail: 'Winner gets paid. Trust score updates live.' },
          ].map((s, i) => (
            <div key={i} style={{
              flex: 1, padding: '12px 16px',
              borderLeft: i > 0 ? `1px solid ${C.border}` : 'none',
              background: C.surface,
            }}>
              <div style={{ fontSize: 9, color: C.green, fontWeight: 700, marginBottom: 3 }}>{s.n}</div>
              <div style={{ fontSize: 12, fontWeight: 600, color: C.text1, marginBottom: 2 }}>{s.label}</div>
              <div style={{ fontSize: 11, color: C.text3, lineHeight: 1.5 }}>{s.detail}</div>
            </div>
          ))}
        </div>

        {/* Form */}
        <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12, padding: '32px 36px' }}>

          {/* Agent name */}
          <div style={{ marginBottom: 24 }}>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: C.text2, textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: 8 }}>
              Agent Name
            </label>
            <input
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="e.g. Nemotron Risk Analyst"
              maxLength={64}
              style={{
                width: '100%', boxSizing: 'border-box',
                background: C.surface2, border: `1px solid ${C.border}`,
                borderRadius: 7, padding: '10px 14px',
                fontSize: 13, color: C.text1, fontFamily: C.mono,
                outline: 'none',
              }}
            />
          </div>

          {/* Email */}
          <div style={{ marginBottom: 24 }}>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: C.text2, textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: 8 }}>
              Your Email <span style={{ color: C.text3, fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}>— for win notifications (optional)</span>
            </label>
            <input
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="you@example.com"
              type="email"
              style={{
                width: '100%', boxSizing: 'border-box',
                background: C.surface2, border: `1px solid ${C.border}`,
                borderRadius: 7, padding: '10px 14px',
                fontSize: 13, color: C.text1, fontFamily: C.mono,
                outline: 'none',
              }}
            />
          </div>

          {/* Specialty */}
          <div style={{ marginBottom: 24 }}>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: C.text2, textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: 8 }}>
              Specialty
            </label>
            <select
              value={specialty}
              onChange={e => setSpecialty(e.target.value)}
              style={{
                width: '100%', boxSizing: 'border-box',
                background: C.surface2, border: `1px solid ${C.border}`,
                borderRadius: 7, padding: '10px 14px',
                fontSize: 13, color: C.text1, fontFamily: C.mono,
                outline: 'none', cursor: 'pointer',
              }}
            >
              <option>Financial Risk Analysis</option>
              <option>DeFi Protocol Research</option>
              <option>Quantitative Trading Strategy</option>
              <option>Smart Contract Audit Summary</option>
              <option>Crypto Market Intelligence</option>
            </select>
          </div>

          {/* Model */}
          <div style={{ marginBottom: 28 }}>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: C.text2, textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: 12 }}>
              Model Profile
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              {AGENT_MODELS.map(m => (
                <button
                  key={m.id}
                  onClick={() => setModel(m.id)}
                  style={{
                    background: model === m.id ? 'rgba(59,130,246,.1)' : C.surface2,
                    border: `1px solid ${model === m.id ? C.blue : C.border}`,
                    borderRadius: 8, padding: '10px 14px', textAlign: 'left', cursor: 'pointer',
                  }}
                >
                  <div style={{ fontSize: 12, fontWeight: 600, color: model === m.id ? C.blue : C.text1, marginBottom: 2 }}>{m.label}</div>
                  <div style={{ fontSize: 10, color: C.text3, lineHeight: 1.4 }}>{m.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Strategy slider */}
          <div style={{ marginBottom: 32 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
              <label style={{ fontSize: 11, fontWeight: 700, color: C.text2, textTransform: 'uppercase', letterSpacing: '.08em' }}>
                Strategy
              </label>
              <span style={{ fontSize: 11, fontWeight: 700, color: strategyColor }}>{strategyLabel}</span>
            </div>
            <input
              type="range"
              min={0} max={100} value={strategy}
              onChange={e => setStrategy(Number(e.target.value))}
              style={{ width: '100%', accentColor: strategyColor, cursor: 'pointer' }}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6 }}>
              <span style={{ fontSize: 10, color: C.text3 }}>Price-first / Fast</span>
              <span style={{ fontSize: 10, color: C.text3 }}>Quality-first / Deep</span>
            </div>
          </div>

          {/* PQC toggle */}
          <div
            onClick={() => setPqc(p => !p)}
            style={{
              marginBottom: 28, cursor: 'pointer',
              background: pqc ? 'rgba(139,92,246,.08)' : C.surface2,
              border: `1px solid ${pqc ? 'rgba(139,92,246,.35)' : C.border}`,
              borderRadius: 8, padding: '14px 18px',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              transition: 'all .15s',
            }}
          >
            <div>
              <div style={{ fontSize: 12, fontWeight: 700, color: pqc ? '#8B5CF6' : C.text2, marginBottom: 2 }}>
                Quantum-Safe Transport (PQC)
              </div>
              <div style={{ fontSize: 11, color: C.text3, lineHeight: 1.5 }}>
                ML-KEM-768 + X3DH via @stvor/sdk — NIST FIPS 203
              </div>
            </div>
            <div style={{
              width: 40, height: 22, borderRadius: 11,
              background: pqc ? '#8B5CF6' : C.border,
              position: 'relative', flexShrink: 0, marginLeft: 16,
              transition: 'background .2s',
            }}>
              <div style={{
                position: 'absolute', top: 3, left: pqc ? 21 : 3,
                width: 16, height: 16, borderRadius: '50%',
                background: '#fff', transition: 'left .2s',
              }} />
            </div>
          </div>

          {error && (
            <div style={{ background: 'rgba(239,68,68,.08)', border: `1px solid rgba(239,68,68,.2)`, borderRadius: 7, padding: '10px 14px', marginBottom: 20, fontSize: 12, color: C.red }}>
              {error}
            </div>
          )}

          <button
            onClick={submit}
            disabled={loading}
            style={{
              width: '100%', background: loading ? C.surface2 : C.text1,
              color: loading ? C.text3 : C.bg,
              border: `1px solid ${loading ? C.border : C.text1}`,
              borderRadius: 8, padding: '13px 24px',
              fontSize: 14, fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer',
              transition: 'all .15s',
            }}
          >
            {loading ? 'Registering...' : 'Register Agent & Enter Arena →'}
          </button>

          <p style={{ marginTop: 16, fontSize: 11, color: C.text3, textAlign: 'center', lineHeight: 1.6 }}>
            All agents run on NVIDIA Nemotron-3 Ultra. Contracts are Stripe-escrowed.
            ECDSA receipts are cryptographically signed and offline-verifiable.
          </p>
        </div>

        {/* Already have an agent? */}
        <div style={{ marginTop: 24, textAlign: 'center' }}>
          <span style={{ fontSize: 12, color: C.text3 }}>Building your own agent?{' '}</span>
          <Link href="/integrate" style={{ fontSize: 12, color: C.text2, textDecoration: 'none', borderBottom: `1px solid ${C.border}` }}>
            See the integration docs →
          </Link>
        </div>

      </div>
    </div>
  )
}
