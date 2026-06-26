'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { StvorEvent } from '@/types'

const T = {
  bg:      '#0A0A0F',
  surface: '#111118',
  border:  '#1C1C28',
  text1:   '#F1F5F9',
  text2:   '#94A3B8',
  text3:   '#475569',
  green:   '#22C55E',
  red:     '#EF4444',
}

type EventClass = 'neutral' | 'positive' | 'attack'

function classifyEvent(type: StvorEvent['type']): EventClass {
  if (type === 'ATTACK_STARTED' || type === 'ATTESTATION_FAILED' || type === 'DEMO_ERROR' || type === 'TRUST_GATE_REJECTED') return 'attack'
  if (type === 'ESCROW_RELEASED' || type === 'WINNER_SELECTED' || type === 'DEMO_COMPLETE'
    || type === 'ATTACK_PREVENTED' || type === 'RECEIPT_GENERATED' || type === 'ATTACK_DEMO_COMPLETE'
    || type === 'BUYER_REASONING' || type === 'TRANSFER_INITIATED' || type === 'PQC_CHANNEL_ESTABLISHED') return 'positive'
  return 'neutral'
}

const EVENT_LABEL: Partial<Record<StvorEvent['type'], string>> = {
  CONTRACT_CREATED:        'Contract signed',
  ESCROW_FUNDED:           'Escrow funded',
  BID_SUBMITTED:           'Bid submitted',
  INFERENCE_STARTED:       'Inference started',
  AGENT_INFERENCE_STARTED: 'Agent running',
  WORK_DELIVERED:          'Work delivered',
  JUDGE_STARTED:           'Evaluating',
  BID_SCORED:              'Score submitted',
  WINNER_SELECTED:         'Winner selected',
  BUYER_REASONING:         'CEO Agent decision',
  ESCROW_RELEASED:         'Escrow released',
  TRUST_UPDATED:           'Trust updated',
  TRUST_GATE_REJECTED:     'Trust gate — blocked',
  RECEIPT_GENERATED:       'Receipt signed',
  ROUND2_STARTING:         'Round 2 — agents adapt',
  ADAPTATION_SUMMARY:      'Adaptation complete',
  DEMO_COMPLETE:           'Demo complete',
  DEMO_ERROR:              'Error',
  ATTACK_STARTED:          'Attack detected',
  ATTESTATION_FAILED:      'Attestation failed',
  ESCROW_HELD:             'Escrow held',
  ATTACK_PREVENTED:        'Attack prevented',
  ATTACK_DEMO_COMPLETE:    'Demo complete',
  ATTESTATION_VERIFIED:    'Payload verified',
  TRANSFER_INITIATED:      'Payment initiated',
  PQC_CHANNEL_ESTABLISHED: 'PQC channel secured',
}

function getSummary(event: StvorEvent): string {
  switch (event.type) {
    case 'CONTRACT_CREATED':   return `$${(event.data.budgetCents/100).toFixed(0)} · ${event.data.taskHash.slice(0,10)}...`
    case 'ESCROW_FUNDED':      return `$${(event.data.amountCents/100).toFixed(2)} locked`
    case 'BID_SUBMITTED':      return `${event.data.agentName} · $${(event.data.priceCents/100).toFixed(0)}`
    case 'INFERENCE_STARTED':  return `${event.data.parallelThreads} threads · ${event.data.model.split('/')[1] ?? event.data.model}`
    case 'AGENT_INFERENCE_STARTED': return `${event.data.agentName} · R${event.data.round}`
    case 'BUYER_REASONING':    return event.data.winnerName + ' selected · autonomous'
    case 'TRUST_GATE_REJECTED': return `${event.data.agentName} ${event.data.trustScore.toFixed(1)} < ${event.data.minRequired}`
    case 'WORK_DELIVERED':     return `${event.data.agentName} · ${(event.data.latencyMs / 1000).toFixed(1)}s`
    case 'BID_SCORED':         return `${event.data.agentName}: ${event.data.judgeScore.toFixed(1)}/100`
    case 'WINNER_SELECTED':    return `${event.data.winnerName} · ${event.data.score.toFixed(1)} · $${(event.data.priceCents/100).toFixed(2)}`
    case 'ESCROW_RELEASED':    return `$${(event.data.amountCents/100).toFixed(2)} → ${event.data.agentName}`
    case 'TRUST_UPDATED':      return `${event.data.agentName} ${event.data.before.toFixed(1)} → ${event.data.after.toFixed(1)}`
    case 'RECEIPT_GENERATED':  return `#${event.data.id.slice(0,8)}`
    case 'ATTESTATION_FAILED': return `hash mismatch · execution refused`
    case 'ESCROW_HELD':        return `$${(event.data.amountCents/100).toFixed(0)} frozen`
    case 'ATTACK_PREVENTED':   return `$${(event.data.amountSaved/100).toFixed(0)} protected`
    case 'DEMO_ERROR':         return event.data.message
    case 'TRANSFER_INITIATED': return `$${(event.data.amountCents/100).toFixed(2)} → ${event.data.recipientEmail}`
    case 'PQC_CHANNEL_ESTABLISHED': return `${event.data.agentName} · ${event.data.algorithm} · ${event.data.kemCiphertextBytes}B KEM ct`
    default:                   return ''
  }
}

export function LiveFeed({ events }: { events: StvorEvent[] }) {
  const visible = events.filter(e => e.type !== 'CONNECTED')

  return (
    <div style={{
      background: T.surface,
      border: `1px solid ${T.border}`,
      borderRadius: 8,
      overflow: 'hidden',
      display: 'flex',
      flexDirection: 'column',
      maxHeight: 380,
    }}>
      <div style={{
        padding: '12px 16px',
        borderBottom: `1px solid ${T.border}`,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        flexShrink: 0,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
          <div style={{ width: 5, height: 5, borderRadius: '50%', background: T.green, animation: 'pulse 2s infinite' }} />
          <span style={{ fontSize: 11, fontWeight: 600, color: T.text1, letterSpacing: '-0.01em' }}>Live Events</span>
        </div>
        {visible.length > 0 && (
          <span style={{ fontSize: 10, fontFamily: 'var(--font-geist-mono)', color: T.text3 }}>
            {visible.length}
          </span>
        )}
      </div>

      <div style={{ overflowY: 'auto', flex: 1 }}>
        {visible.length === 0 ? (
          <div style={{ padding: '32px 20px', textAlign: 'center', color: T.text3, fontSize: 12 }}>
            Waiting for demo...
          </div>
        ) : (
          <AnimatePresence initial={false}>
            {visible.map((event, i) => {
              const label = EVENT_LABEL[event.type as keyof typeof EVENT_LABEL]
              if (!label) return null
              const cls = classifyEvent(event.type)
              const summary = getSummary(event)
              const dotColor = cls === 'attack' ? T.red : cls === 'positive' ? T.green : T.text3
              const labelColor = cls === 'attack' ? T.red : cls === 'positive' ? T.text1 : T.text2

              return (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: 6 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: .12 }}
                  className="feed-item"
                  style={{
                    padding: '9px 16px',
                    borderBottom: `1px solid ${T.bg}`,
                    display: 'flex', alignItems: 'flex-start', gap: 9,
                    background: cls === 'attack' ? 'rgba(239,68,68,.03)' : 'transparent',
                    borderLeft: cls === 'attack' ? `2px solid rgba(239,68,68,.3)` : '2px solid transparent',
                  }}
                >
                  <div style={{ width: 5, height: 5, borderRadius: '50%', background: dotColor, flexShrink: 0, marginTop: 4 }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 11, fontWeight: 500, color: labelColor, marginBottom: 1 }}>
                      {label}
                    </div>
                    {summary && (
                      <div style={{ fontSize: 10, color: T.text3, fontFamily: 'var(--font-geist-mono)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {summary}
                      </div>
                    )}
                  </div>
                </motion.div>
              )
            })}
          </AnimatePresence>
        )}
      </div>

      <div style={{ padding: '8px 16px', borderTop: `1px solid ${T.border}`, flexShrink: 0 }}>
        <div style={{ fontSize: 9, color: T.text3, textAlign: 'center', letterSpacing: '.05em', textTransform: 'uppercase' }}>
          Immutable audit trail
        </div>
      </div>
    </div>
  )
}
