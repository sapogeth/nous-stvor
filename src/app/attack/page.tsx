'use client'

import { useEffect, useState, useRef } from 'react'
import Link from 'next/link'
import { Nav } from '@/components/Nav'
import { AttackDemo } from '@/components/AttackDemo'
import { LiveFeed } from '@/components/LiveFeed'
import { StvorEvent } from '@/types'

const C = {
  bg:      '#07070F',
  surface: '#0C0C1A',
  surface2:'#101020',
  border:  'rgba(100,100,200,0.08)',
  text1:   '#EEEEF8',
  text2:   '#7575A0',
  text3:   '#3A3A55',
  green:   '#00DDA0',
  red:     '#FF4555',
  mono:    'var(--font-geist-mono), ui-monospace, monospace',
  disp:    "var(--font-space), 'Space Grotesk', system-ui, sans-serif",
}

export default function AttackPage() {
  const [events,      setEvents]      = useState<StvorEvent[]>([])
  const [currentStep, setCurrentStep] = useState(0)
  const [isRunning,   setIsRunning]   = useState(false)
  const [isDone,      setIsDone]      = useState(false)
  const [connected,   setConnected]   = useState(false)
  const eventsRef = useRef<StvorEvent[]>([])

  useEffect(() => {
    let es: EventSource
    let reconnectTimer: ReturnType<typeof setTimeout>

    function connect() {
      es = new EventSource('/api/events')
      es.onopen  = () => setConnected(true)
      es.onerror = () => {
        setConnected(false)
        es.close()
        reconnectTimer = setTimeout(connect, 3000)
      }
      es.onmessage = (e) => {
        const event: StvorEvent = JSON.parse(e.data)
        if (event.type === 'CONNECTED') return
        const updated = [event, ...eventsRef.current].slice(0, 100)
        eventsRef.current = updated
        setEvents([...updated])
        switch (event.type) {
          case 'CONTRACT_CREATED':   setCurrentStep(1); break
          case 'ESCROW_FUNDED':      setCurrentStep(2); break
          case 'ATTACK_STARTED':     setCurrentStep(3); break
          case 'ATTESTATION_FAILED': setCurrentStep(4); break
          case 'ESCROW_HELD':        setCurrentStep(5); break
          case 'ATTACK_PREVENTED':   setCurrentStep(6); break
          case 'ATTACK_DEMO_COMPLETE':
          case 'DEMO_ERROR':
            setIsRunning(false); setIsDone(true); break
        }
      }
    }

    connect()
    return () => { es?.close(); clearTimeout(reconnectTimer) }
  }, [])

  const reset = () => {
    setCurrentStep(0); eventsRef.current = []
    setEvents([]); setIsDone(false)
  }

  const run = async () => {
    if (isRunning) return
    reset(); setIsRunning(true)
    await fetch('/api/demo/tampered', { method: 'POST' })
  }

  return (
    <div style={{ minHeight: '100dvh', background: C.bg, color: C.text1 }}>
      <Nav connected={connected} />

      <main className="demo-main" style={{}}>

        {/* Page header */}
        <div style={{ marginBottom: 36 }}>
          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 20, marginBottom: 20 }}>
            <div>
              <p style={{ fontSize: 11, color: C.red, letterSpacing: '.08em', textTransform: 'uppercase', marginBottom: 8 }}>
                Supply Chain Attack Simulation
              </p>
              <h1 style={{ fontSize: 32, fontWeight: 700, letterSpacing: '-0.04em', color: C.text1, marginBottom: 8, fontFamily: C.disp }}>
                Payload tampered. Agent refused.
              </h1>
              <p style={{ fontSize: 14, color: C.text3, maxWidth: 560, lineHeight: 1.65 }}>
                An attacker intercepts the task payload in transit and substitutes
                a fund-theft instruction. Stvor computes SHA-256 of the received
                payload and compares it to the buyer&apos;s committed hash.
                Mismatch → execution blocked → escrow returned.
              </p>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, alignItems: 'flex-end', flexShrink: 0 }}>
              <button
                onClick={run} disabled={isRunning}
                style={{
                  background: 'transparent',
                  color: C.red,
                  border: `1px solid rgba(239,68,68,.4)`,
                  borderRadius: 6, padding: '10px 24px',
                  fontSize: 13, fontWeight: 600, cursor: isRunning ? 'not-allowed' : 'pointer',
                  display: 'inline-flex', alignItems: 'center', gap: 8,
                  transition: 'all .15s',
                  opacity: isRunning ? 0.6 : 1,
                }}
              >
                {isRunning
                  ? <><Spin /> Simulating attack...</>
                  : isDone ? 'Run Again' : 'Simulate Attack'}
              </button>
            </div>
          </div>

          {/* Attack step tracker */}
          <div style={{ display: 'flex', gap: 0, border: `1px solid ${C.border}`, borderRadius: 6, overflow: 'hidden' }}>
            {[
              { step: '01', label: 'Contract signed',    detail: 'Buyer commits SHA-256 hash of original task', ok: true },
              { step: '02', label: 'Escrow funded',      detail: 'Stripe holds funds — locked until attestation', ok: true },
              { step: '03', label: 'Payload intercepted',detail: 'Attacker modifies task in transit', danger: true },
              { step: '04', label: 'Hash mismatch',      detail: 'Expected ≠ received — Stvor detects tampering', danger: true },
              { step: '05', label: 'Execution refused',  detail: 'Agent blocked. Escrow frozen automatically', ok: true },
              { step: '06', label: 'Funds returned',     detail: 'Buyer gets escrow back. Attacker gains nothing', ok: true },
            ].map((s, i) => {
              const active = currentStep >= i + 1
              const color = active ? (s.danger ? C.red : C.green) : C.text3
              return (
                <div key={i} style={{
                  flex: 1, padding: '10px 14px',
                  borderLeft: i > 0 ? `1px solid ${C.border}` : 'none',
                  background: active ? C.surface2 : C.surface,
                  borderBottom: active ? `2px solid ${color}` : '2px solid transparent',
                  transition: 'all .3s',
                }}>
                  <div style={{ display: 'flex', gap: 7, alignItems: 'center', marginBottom: 3 }}>
                    <span style={{ fontSize: 9, fontFamily: C.mono, color }}>{s.step}</span>
                    <span style={{ fontSize: 11, fontWeight: 600, color: active ? C.text1 : C.text3 }}>{s.label}</span>
                  </div>
                  <div style={{ fontSize: 10, color: C.text3, lineHeight: 1.5 }}>{s.detail}</div>
                </div>
              )
            })}
          </div>
        </div>

        {/* What this proves */}
        <div style={{
          background: C.surface, border: `1px solid ${C.border}`,
          borderLeft: `3px solid ${C.red}`,
          borderRadius: 8, padding: '16px 20px', marginBottom: 24,
          display: 'flex', gap: 40, alignItems: 'center', flexWrap: 'wrap',
        }}>
          <div style={{ fontSize: 11, color: C.red, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.08em', flexShrink: 0 }}>
            What this proves
          </div>
          {[
            { label: 'Attack vector', value: 'Man-in-the-middle payload substitution' },
            { label: 'Defense',       value: 'Cryptographic hash commitment at creation time' },
            { label: 'Business case', value: 'AI agents execute at machine speed — humans can\'t audit in time' },
          ].map(r => (
            <div key={r.label}>
              <div style={{ fontSize: 9, color: C.text3, textTransform: 'uppercase', letterSpacing: '.07em', marginBottom: 3 }}>{r.label}</div>
              <div style={{ fontSize: 12, color: C.text1, fontWeight: 500 }}>{r.value}</div>
            </div>
          ))}
        </div>

        {/* ATS-1 callout — shown after attack completes */}
        {isDone && (
          <div style={{
            background: 'rgba(59,130,246,0.05)',
            border: '1px solid rgba(59,130,246,0.18)',
            borderLeft: '3px solid #3B82F6',
            borderRadius: 8, padding: '14px 20px', marginBottom: 20,
            display: 'flex', alignItems: 'center', gap: 24, flexWrap: 'wrap',
          }}>
            <div style={{ flex: 1, minWidth: 260 }}>
              <div style={{ fontSize: 10, color: '#3B82F6', fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase', marginBottom: 5 }}>
                Caught by ATS-1 §4 — Escrow Lifecycle
              </div>
              <div style={{ fontSize: 12, color: C.text2, lineHeight: 1.6 }}>
                Task hash mismatch triggered an automatic CANCELLED transition.
                Funds returned to buyer. Trust score penalised −15 pts.
                This is the ATS-1 v0.1.0 failure path — codified, deterministic, open.
              </div>
            </div>
            <Link href="/ats-1#escrow" style={{ textDecoration: 'none', flexShrink: 0 }}>
              <div style={{
                fontSize: 11, fontWeight: 600, color: '#3B82F6',
                background: 'rgba(59,130,246,0.10)',
                border: '1px solid rgba(59,130,246,0.25)',
                borderRadius: 6, padding: '8px 16px',
                whiteSpace: 'nowrap',
              }}>
                Read the standard →
              </div>
            </Link>
          </div>
        )}

        {/* Main grid */}
        <div className="demo-layout" style={{}}>
          <AttackDemo events={events} currentStep={currentStep} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14, position: 'sticky', top: 66 }}>
            <LiveFeed events={events} />
            <DefensePanel />
          </div>
        </div>
      </main>
    </div>
  )
}

function Spin() {
  return <div style={{ width: 12, height: 12, border: `1.5px solid rgba(239,68,68,.2)`, borderTop: `1.5px solid ${C.red}`, borderRadius: '50%', animation: 'spin .7s linear infinite', flexShrink: 0 }} />
}

function DefensePanel() {
  return (
    <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 8, padding: '16px 18px' }}>
      <div style={{ fontSize: 10, color: C.text3, textTransform: 'uppercase', letterSpacing: '.1em', fontWeight: 500, marginBottom: 14 }}>Stvor defense layer</div>
      {[
        { label: 'Commit',   value: 'SHA-256(task_json) at creation' },
        { label: 'Transmit', value: 'Normal channel (unencrypted ok)' },
        { label: 'Verify',   value: 'SHA-256(received) === committed?' },
        { label: 'If fail',  value: 'Block execution + hold escrow' },
        { label: 'Receipt',  value: 'ECDSA P-256 signed audit record' },
      ].map((r, i) => (
        <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: i < 4 ? `1px solid ${C.border}` : 'none', gap: 12 }}>
          <span style={{ fontSize: 11, color: C.text3, flexShrink: 0 }}>{r.label}</span>
          <span style={{ fontSize: 10, color: C.text2, fontFamily: C.mono, textAlign: 'right', lineHeight: 1.5 }}>{r.value}</span>
        </div>
      ))}
      <div style={{ marginTop: 14, padding: '10px 12px', background: 'rgba(34,197,94,.05)', border: '1px solid rgba(34,197,94,.12)', borderRadius: 6 }}>
        <div style={{ fontSize: 11, color: C.green, fontWeight: 600, marginBottom: 3 }}>Key insight</div>
        <div style={{ fontSize: 11, color: C.text3, lineHeight: 1.6 }}>
          The channel doesn&apos;t need to be secure. The commitment does.
          Stvor makes the payload tamper-evident, not tamper-proof.
        </div>
      </div>
      <Link href="/ats-1" style={{ textDecoration: 'none', display: 'block', marginTop: 10 }}>
        <div style={{
          fontSize: 10, color: '#3B82F6',
          background: 'rgba(59,130,246,0.06)',
          border: '1px solid rgba(59,130,246,0.15)',
          borderRadius: 5, padding: '7px 10px',
          letterSpacing: '.02em', lineHeight: 1.5,
        }}>
          ATS-1 — open standard for agent trust →
        </div>
      </Link>
    </div>
  )
}
