'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Nav } from '@/components/Nav'
import { AgentLeaderboard } from '@/components/AgentLeaderboard'
import { DemoFlow } from '@/components/DemoFlow'
import { TrustReceiptModal } from '@/components/TrustReceiptModal'
import { LiveFeed } from '@/components/LiveFeed'
import { StvorEvent, TrustReceipt } from '@/types'

interface Agent {
  id: string; name: string; specialty: string; strategy: string; model: string; source?: string | null
  trust_score: number; total_contracts: number; successful_contracts: number
  total_revenue_cents: number; escrow_success_rate: number; avg_judge_score: number
}

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

export default function DemoPage() {
  const [agents,         setAgents]         = useState<Agent[]>([])
  const [events,         setEvents]         = useState<StvorEvent[]>([])
  const [receipt,        setReceipt]        = useState<TrustReceipt | null>(null)
  const [isRunning,      setIsRunning]      = useState(false)
  const [taskLabel,      setTaskLabel]      = useState<string>('')
  const [budgetCents,    setBudgetCents]    = useState<number | null>(null)
  const [stripeMode,     setStripeMode]     = useState<'demo' | 'test' | 'live' | null>(null)
  const [isDone,         setIsDone]         = useState(false)
  const [currentStep,    setCurrentStep]    = useState(0)
  const [showReceipt,    setShowReceipt]    = useState(false)
  const [connected,      setConnected]      = useState(false)
  const [transfer,       setTransfer]       = useState<{ agentName: string; recipientEmail: string; amountCents: number } | null>(null)
  const [receiptId,      setReceiptId]      = useState<string | null>(null)
  const eventsRef = useRef<StvorEvent[]>([])

  const fetchAgents = useCallback(async () => {
    try { const res = await fetch('/api/agents'); setAgents(await res.json()) } catch {}
  }, [])

  useEffect(() => {
    fetch('/api/status')
      .then(r => r.json())
      .then(d => setStripeMode(d.stripe?.mode ?? null))
      .catch(() => {})
  }, [])

  useEffect(() => {
    fetchAgents()
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
          case 'CONTRACT_CREATED':
            if (event.data.round === 1) {
              setCurrentStep(1)
              if (event.data.taskLabel) setTaskLabel(event.data.taskLabel as string)
              if (event.data.budgetCents) setBudgetCents(event.data.budgetCents)
            } else {
              setCurrentStep(7)
            }
            break
          case 'ESCROW_FUNDED':      setCurrentStep(p => Math.max(p, 2)); break
          case 'BID_SUBMITTED':      setCurrentStep(p => Math.max(p, 3)); break
          case 'INFERENCE_STARTED':  setCurrentStep(p => Math.max(p, 4)); break
          case 'JUDGE_STARTED':      setCurrentStep(p => Math.max(p, 5)); break
          case 'ESCROW_RELEASED':    setCurrentStep(p => Math.max(p, 6)); break
          case 'TRUST_GATE_REJECTED': setCurrentStep(p => Math.max(p, 7)); break
          case 'ROUND2_STARTING':    setCurrentStep(7); break
          case 'ADAPTATION_SUMMARY': setCurrentStep(10); break
          case 'RECEIPT_GENERATED':
            setCurrentStep(p => Math.max(p, 6))
            setReceipt(event.data as TrustReceipt)
            setReceiptId((event.data as TrustReceipt).id)
            setTimeout(() => setShowReceipt(true), 1000)
            break
          case 'TRUST_UPDATED': fetchAgents(); break
          case 'TRANSFER_INITIATED':
            setTransfer({ agentName: event.data.agentName, recipientEmail: event.data.recipientEmail, amountCents: event.data.amountCents })
            break
          case 'DEMO_COMPLETE':
          case 'DEMO_ERROR':
            setIsRunning(false); setIsDone(true); break
        }
      }
    }

    connect()
    return () => { es?.close(); clearTimeout(reconnectTimer) }
  }, [fetchAgents])

  const reset = () => {
    setCurrentStep(0); eventsRef.current = []
    setEvents([]); setReceipt(null)
    setShowReceipt(false); setIsDone(false); setTransfer(null); setTaskLabel(''); setBudgetCents(null); setReceiptId(null)
  }

  const run = async () => {
    if (isRunning) return
    reset(); setIsRunning(true)
    await fetch('/api/demo/run', { method: 'POST' })
  }

  const totalVolume    = agents.reduce((s, a) => s + a.total_revenue_cents, 0)
  const totalContracts = agents.reduce((s, a) => s + a.total_contracts, 0)

  return (
    <div style={{ minHeight: '100dvh', background: C.bg, color: C.text1 }}>
      <Nav connected={connected} />

      {stripeMode === 'demo' && (
        <div style={{
          background: 'rgba(245,158,11,.06)', borderBottom: '1px solid rgba(245,158,11,.2)',
          padding: '8px 40px', display: 'flex', alignItems: 'center', gap: 10,
        }}>
          <span style={{ fontSize: 10, fontWeight: 700, color: '#F59E0B', background: 'rgba(245,158,11,.12)', border: '1px solid rgba(245,158,11,.3)', borderRadius: 3, padding: '2px 6px', letterSpacing: '.08em', textTransform: 'uppercase' }}>
            Stripe Demo Mode
          </span>
          <span style={{ fontSize: 12, color: '#94A3B8' }}>
            Payments are simulated — set <code style={{ fontFamily: 'monospace', color: '#F1F5F9', background: 'rgba(255,255,255,.05)', padding: '1px 5px', borderRadius: 3 }}>STRIPE_SECRET_KEY=sk_test_...</code> in .env.local to enable real escrow
          </span>
        </div>
      )}
      {stripeMode === 'test' && (
        <div style={{
          background: 'rgba(59,130,246,.05)', borderBottom: '1px solid rgba(59,130,246,.15)',
          padding: '8px 40px', display: 'flex', alignItems: 'center', gap: 10,
        }}>
          <span style={{ fontSize: 10, fontWeight: 700, color: '#3B82F6', background: 'rgba(59,130,246,.1)', border: '1px solid rgba(59,130,246,.25)', borderRadius: 3, padding: '2px 6px', letterSpacing: '.08em', textTransform: 'uppercase' }}>
            Stripe Test Mode
          </span>
          <span style={{ fontSize: 12, color: '#94A3B8' }}>Real PaymentIntents, test cards — no real money</span>
        </div>
      )}

      {isRunning && !connected && (
        <div style={{
          background: 'rgba(239,68,68,.06)', borderBottom: '1px solid rgba(239,68,68,.2)',
          padding: '8px 40px', display: 'flex', alignItems: 'center', gap: 10,
        }}>
          <div style={{ width: 6, height: 6, borderRadius: '50%', border: '1.5px solid rgba(239,68,68,.6)', borderTop: '1.5px solid #EF4444', animation: 'spin .8s linear infinite' }} />
          <span style={{ fontSize: 12, color: '#EF4444' }}>SSE disconnected — reconnecting in 3s. Events may be delayed.</span>
        </div>
      )}

      {receiptId && isDone && (() => {
        // Encode receipt data in URL so the receipt page works even after
        // Vercel recycles the function instance (ephemeral /tmp SQLite).
        const receiptUrl = receipt
          ? `/receipts/${receiptId}?d=${encodeURIComponent(btoa(JSON.stringify(receipt)))}`
          : `/receipts/${receiptId}`
        return (
          <div style={{
            background: 'rgba(0,221,160,0.04)', borderBottom: '1px solid rgba(0,221,160,0.15)',
            padding: '8px 40px', display: 'flex', alignItems: 'center', gap: 14,
          }}>
            <span style={{ fontSize: 10, fontWeight: 700, color: C.green, textTransform: 'uppercase', letterSpacing: '.08em', flexShrink: 0 }}>
              Receipt issued
            </span>
            <span style={{ fontSize: 12, color: C.text3, fontFamily: C.mono, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
              /receipts/{receiptId}
            </span>
            <a href={receiptUrl} target="_blank" rel="noopener noreferrer" style={{
              fontSize: 11, fontWeight: 600, color: C.green,
              textDecoration: 'none', flexShrink: 0,
              background: 'rgba(0,221,160,0.08)', border: '1px solid rgba(0,221,160,0.2)',
              borderRadius: 5, padding: '4px 12px',
            }}>
              View + verify ↗
            </a>
          </div>
        )
      })()}

      <main className="demo-main" style={{}}>

        {/* Page header */}
        <div style={{ marginBottom: 36 }}>
          <div className="demo-header" style={{}}>
            <div>
              <p style={{ fontSize: 11, color: C.text3, letterSpacing: '.08em', textTransform: 'uppercase', marginBottom: 8 }}>
                Live Agent Economy
              </p>
              <h1 style={{ fontSize: 32, fontWeight: 800, letterSpacing: '-0.04em', color: C.text1, marginBottom: 8 }}>
                {agents.length || 5} agents. 2 rounds.{' '}
                {stripeMode === 'live' ? 'Real money.' : stripeMode === 'test' ? 'Test escrow.' : 'Escrowed contracts.'}
              </h1>
              <p style={{ fontSize: 14, color: C.text3, maxWidth: 560, lineHeight: 1.65 }}>
                Hermes agents compete for a real contract
                {taskLabel ? <strong style={{ color: C.text2 }}> — {taskLabel}</strong> : ''}.
                Task type is randomized each run. Arena agents included.
                NVIDIA Nemotron-3 Ultra runs all agents in parallel. A judge agent scores results.
                Stripe escrow releases only after SHA-256 attestation passes. Trust scores update live.
              </p>
            </div>

            {/* Stats + CTA inline */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, alignItems: 'flex-end', flexShrink: 0 }}>
              <div style={{ display: 'flex', gap: 24, background: C.surface, border: `1px solid ${C.border}`, borderRadius: 8, padding: '12px 20px' }}>
                <MiniMetric label="Volume protected" value={`$${(totalVolume/100).toFixed(0)}`} />
                <MiniMetric label="Contracts" value={totalContracts.toString()} />
                <MiniMetric label="Agents" value={agents.length.toString()} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}>
                <button
                  onClick={run} disabled={isRunning}
                  style={{
                    background: isRunning ? C.surface : C.text1,
                    color: isRunning ? C.text3 : C.bg,
                    border: `1px solid ${isRunning ? C.border : C.text1}`,
                    borderRadius: 6, padding: '10px 24px',
                    fontSize: 13, fontWeight: 600, cursor: isRunning ? 'not-allowed' : 'pointer',
                    display: 'inline-flex', alignItems: 'center', gap: 8,
                    transition: 'all .15s',
                  }}
                >
                  {isRunning
                    ? <><Spin /> Running economy...</>
                    : isDone ? 'Run Again' : 'Run Economy Demo'}
                </button>
                {!isRunning && (
                  <span style={{ fontSize: 10, color: C.text3 }}>
                    {isDone ? 'picks a new task type each run' : '~5–8 min · picks task type randomly'}
                  </span>
                )}
                {isRunning && taskLabel && (
                  <span style={{ fontSize: 10, color: C.text2, fontStyle: 'italic' }}>Task: {taskLabel}</span>
                )}
              </div>
            </div>
          </div>

          {/* What's happening explainer */}
          <div style={{ display: 'flex', gap: 0, border: `1px solid ${C.border}`, borderRadius: 6, overflow: 'hidden' }}>
            {[
              { step: '01', label: 'Contract created',   detail: `${budgetCents ? `$${(budgetCents/100).toFixed(0)} budget` : 'Buyer contract'} · SHA-256 hash committed` },
              { step: '02', label: 'Escrow funded',      detail: 'Stripe locks funds · capture_method: manual' },
              { step: '03', label: 'Agents bid',         detail: 'All agents bid · EV = (Trust × Score) ÷ Price' },
              { step: '04', label: 'NIM inference',      detail: 'Parallel Nemotron-3 Ultra · 5 concurrent threads' },
              { step: '05', label: 'Judge scores',       detail: 'Autonomous judge evaluates all 5 risk assessments' },
              { step: '06', label: 'Escrow releases',    detail: 'Attestation passes → funds released → trust score updates' },
            ].map((s, i) => (
              <div key={i} style={{
                flex: 1, padding: '10px 14px',
                borderLeft: i > 0 ? `1px solid ${C.border}` : 'none',
                background: currentStep >= i + 1 ? C.surface2 : C.surface,
                borderBottom: currentStep >= i + 1 ? `2px solid ${C.green}` : '2px solid transparent',
                transition: 'all .3s',
              }}>
                <div style={{ display: 'flex', gap: 7, alignItems: 'center', marginBottom: 3 }}>
                  <span style={{ fontSize: 9, fontFamily: C.mono, color: currentStep >= i + 1 ? C.green : C.text3 }}>{s.step}</span>
                  <span style={{ fontSize: 11, fontWeight: 600, color: currentStep >= i + 1 ? C.text1 : C.text3 }}>{s.label}</span>
                </div>
                <div style={{ fontSize: 10, color: C.text3, lineHeight: 1.5 }}>{s.detail}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Main content grid */}
        <div className="demo-layout" style={{}}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <DemoFlow currentStep={currentStep} events={events} />
            <AgentLeaderboard agents={agents} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14, position: 'sticky', top: 66 }}>
            <LiveFeed events={events} />
            <AttestationInfo />
          </div>
        </div>
      </main>

      {showReceipt && receipt && (
        <TrustReceiptModal receipt={receipt} onClose={() => setShowReceipt(false)} />
      )}

      <AnimatePresence>
        {transfer && (
          <motion.div
            initial={{ opacity: 0, y: 60 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 60 }}
            style={{
              position: 'fixed', bottom: 32, left: '50%', transform: 'translateX(-50%)',
              background: '#0D1F14', border: '1px solid #22C55E',
              borderRadius: 12, padding: '20px 28px',
              display: 'flex', alignItems: 'center', gap: 20,
              boxShadow: '0 0 40px rgba(34,197,94,.25)',
              zIndex: 200, minWidth: 420,
            }}
          >
            <div style={{
              width: 40, height: 40, borderRadius: 10,
              background: 'rgba(34,197,94,.15)', border: '1px solid rgba(34,197,94,.3)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 20, flexShrink: 0,
            }}>$</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#22C55E', letterSpacing: '.04em', marginBottom: 4 }}>
                ESCROW RELEASED
              </div>
              <div style={{ fontSize: 15, fontWeight: 700, color: '#F1F5F9', marginBottom: 2 }}>
                {transfer.agentName} won ${(transfer.amountCents / 100).toFixed(2)}
              </div>
              <div style={{ fontSize: 12, color: '#94A3B8' }}>
                {transfer.recipientEmail
                  ? `Notification → ${transfer.recipientEmail} · check Stripe dashboard for capture`
                  : 'Stripe capture confirmed · trust receipt issued'}
              </div>
            </div>
            <button onClick={() => setTransfer(null)} style={{
              background: 'none', border: 'none', color: '#475569',
              cursor: 'pointer', fontSize: 18, lineHeight: 1, flexShrink: 0,
            }}>×</button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function MiniMetric({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div style={{ fontSize: 9, color: C.text3, textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: 18, fontWeight: 800, fontFamily: C.mono, color: C.text1, letterSpacing: '-0.02em' }} className="num">{value}</div>
    </div>
  )
}

function Spin() {
  return <div style={{ width: 12, height: 12, border: `1.5px solid rgba(255,255,255,.2)`, borderTop: `1.5px solid ${C.text3}`, borderRadius: '50%', animation: 'spin .7s linear infinite', flexShrink: 0 }} />
}

function AttestationInfo() {
  return (
    <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 8, padding: '16px 18px' }}>
      <div style={{ fontSize: 10, color: C.text3, textTransform: 'uppercase', letterSpacing: '.1em', fontWeight: 500, marginBottom: 14 }}>Attestation protocol</div>
      {[
        { label: 'Algorithm',  value: 'SHA-256' },
        { label: 'Signed by',  value: 'Buyer at contract creation' },
        { label: 'Verified by', value: 'Stvor before execution' },
        { label: 'Receipt',    value: 'ECDSA P-256 · offline-verifiable' },
        { label: 'Escrow',     value: 'Stripe · manual capture' },
      ].map((r, i) => (
        <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: i < 4 ? `1px solid ${C.border}` : 'none' }}>
          <span style={{ fontSize: 11, color: C.text3 }}>{r.label}</span>
          <span style={{ fontSize: 11, color: C.text2, fontFamily: C.mono }}>{r.value}</span>
        </div>
      ))}
    </div>
  )
}
