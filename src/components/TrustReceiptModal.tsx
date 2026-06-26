'use client'

import { useState } from 'react'
import { TrustReceipt } from '@/types'

const T = {
  bg:      '#07070F',
  surface: '#0C0C1A',
  surface2:'#101020',
  border:  'rgba(100,100,200,0.08)',
  borderHi:'rgba(100,100,200,0.18)',
  text1:   '#EEEEF8',
  text2:   '#9898C0',
  text3:   '#6868A0',
  green:   '#00DDA0',
  red:     '#FF4555',
  blue:    '#4F7AFF',
  mono:    'var(--font-geist-mono), ui-monospace, monospace',
}

export function TrustReceiptModal({ receipt, onClose }: { receipt: TrustReceipt; onClose: () => void }) {
  const [verifying,    setVerifying]    = useState(false)
  const [verifyResult, setVerifyResult] = useState<{ valid: boolean; reason: string } | null>(null)
  const [copied,       setCopied]       = useState(false)

  const isEcdsa = receipt.signature?.startsWith('ecdsa:')

  // Always embed receipt data in URL so the link works across Vercel instances
  const encoded    = typeof window !== 'undefined' ? encodeURIComponent(btoa(JSON.stringify(receipt))) : ''
  const receiptUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/receipts/${receipt.id}${encoded ? `?d=${encoded}` : ''}`
    : `/receipts/${receipt.id}`

  const copyUrl = () => {
    navigator.clipboard.writeText(receiptUrl).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    })
  }

  const handleVerify = async () => {
    setVerifying(true)
    try {
      const res = await fetch('/api/receipts/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        // Pass full receipt data so verification works even if Vercel routed
        // this request to a different instance (ephemeral SQLite fallback)
        body: JSON.stringify({ receiptId: receipt.id, receiptData: receipt }),
      })
      const data = await res.json()
      setVerifyResult({ valid: data.valid, reason: data.reason })
    } catch {
      setVerifyResult({ valid: false, reason: 'Network error — try again.' })
    } finally {
      setVerifying(false)
    }
  }

  const verifyBtnLabel = () => {
    if (verifying) return 'Verifying...'
    if (!verifyResult) return 'Verify signature'
    if (verifyResult.valid) return '✓ Valid — receipt authentic'
    const r = verifyResult.reason?.toLowerCase() ?? ''
    if (r.includes('not found')) return '⚠ Receipt not in active DB'
    return '✗ Invalid — signature mismatch'
  }

  const verifyBtnColor = () => {
    if (!verifyResult) return { bg: T.text1, border: T.text1, color: T.bg }
    if (verifyResult.valid) return { bg: 'rgba(0,221,160,0.08)', border: 'rgba(0,221,160,0.25)', color: T.green }
    const r = verifyResult.reason?.toLowerCase() ?? ''
    if (r.includes('not found')) return { bg: 'rgba(79,122,255,0.06)', border: 'rgba(79,122,255,0.2)', color: T.blue }
    return { bg: 'rgba(255,69,85,0.08)', border: 'rgba(255,69,85,0.25)', color: T.red }
  }

  const btnStyle = verifyBtnColor()

  return (
    <div
      style={{
        position: 'fixed', inset: 0,
        background: 'rgba(0,0,0,.80)',
        backdropFilter: 'blur(10px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 100,
      }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div style={{
        background: T.surface,
        border: `1px solid ${T.borderHi}`,
        borderTop: `1px solid rgba(79,122,255,0.3)`,
        borderRadius: 12, padding: '26px',
        maxWidth: 500, width: '92%',
        animation: 'fadeUp 0.2s ease-out',
      }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{
              width: 36, height: 36, borderRadius: 8,
              background: 'rgba(0,221,160,0.10)', border: '1px solid rgba(0,221,160,0.25)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 16, color: T.green, fontWeight: 700,
            }}>✓</div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, letterSpacing: '-0.025em', color: T.text1 }}>
                Stvor Trust Receipt
              </div>
              <div style={{ fontSize: 10, color: T.text3, fontFamily: T.mono }}>
                #{receipt.id.slice(0, 12)}
              </div>
            </div>
          </div>
          <button onClick={onClose} style={{
            background: 'none', border: `1px solid ${T.border}`, borderRadius: 5,
            padding: '4px 10px', color: T.text3, cursor: 'pointer', fontSize: 12,
          }}>✕</button>
        </div>

        {/* Agent */}
        <div style={{ background: T.surface2, borderRadius: 8, padding: '12px 14px', marginBottom: 10, border: `1px solid ${T.border}` }}>
          <div style={{ fontSize: 9, color: T.text3, marginBottom: 4, textTransform: 'uppercase', letterSpacing: '.07em' }}>Contract Winner</div>
          <div style={{ fontSize: 15, fontWeight: 700, color: T.text1 }}>{receipt.agent_name}</div>
          <div style={{ fontSize: 10, color: T.text3, fontFamily: T.mono, marginTop: 2 }}>Hermes Agent · Nemotron-3 Ultra</div>
        </div>

        {/* Scores */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginBottom: 10 }}>
          <ScoreBox label="Judge Score" value={`${receipt.judge_score.toFixed(1)}`} sub="/100" color={T.text1} />
          <ScoreBox label="Trust Before" value={receipt.trust_score_before.toFixed(1)} color={T.text2} />
          <ScoreBox label="Trust After"  value={receipt.trust_score_after.toFixed(1)}
            sub={`${receipt.trust_delta > 0 ? '+' : ''}${receipt.trust_delta.toFixed(1)}`}
            color={receipt.trust_delta >= 0 ? T.green : T.red} />
        </div>

        {/* Hashes */}
        <div style={{ background: T.surface2, borderRadius: 8, padding: '12px 14px', marginBottom: 10, border: `1px solid ${T.border}` }}>
          <HashRow label="Task Hash (SHA-256)" value={receipt.task_hash} />
          <HashRow label="Work Hash (SHA-256)" value={receipt.work_hash} />
          <div style={{ marginTop: 8, paddingTop: 8, borderTop: `1px solid ${T.border}`, display: 'flex', gap: 8 }}>
            <span style={{ background: 'rgba(0,221,160,0.08)', color: T.green, padding: '2px 8px', borderRadius: 4, fontSize: 10, fontWeight: 600, fontFamily: T.mono }}>
              {receipt.escrow_status}
            </span>
            <span style={{ fontSize: 10, color: T.text3, fontFamily: T.mono, alignSelf: 'center' }}>
              {new Date(receipt.generated_at).toLocaleString()}
            </span>
          </div>
        </div>

        {/* Signature */}
        <div style={{ background: T.surface2, borderRadius: 8, padding: '10px 13px', marginBottom: 10, border: `1px solid ${T.border}` }}>
          <div style={{ fontSize: 9, color: T.text3, marginBottom: 4, textTransform: 'uppercase', letterSpacing: '.07em' }}>
            {isEcdsa ? 'ECDSA P-256 Signature' : 'HMAC-SHA256 Signature'}
          </div>
          <div style={{ fontSize: 10, fontFamily: T.mono, color: T.text3, wordBreak: 'break-all', lineHeight: 1.7 }}>
            {receipt.signature}
          </div>
          {isEcdsa && (
            <div style={{ marginTop: 5, fontSize: 10, color: T.text3 }}>
              Verifiable offline — no Stvor server required. Public key: <code style={{ color: T.text2, fontSize: 9 }}>/api/.well-known/stvor-public-key</code>
            </div>
          )}
        </div>

        {/* Permanent link — always includes ?d= */}
        <div style={{ background: T.surface2, border: `1px solid rgba(0,221,160,0.18)`, borderRadius: 8, padding: '10px 13px', marginBottom: 14 }}>
          <div style={{ fontSize: 9, color: T.green, marginBottom: 4, textTransform: 'uppercase', letterSpacing: '.07em', fontWeight: 600 }}>
            Permanent receipt URL <span style={{ color: T.text3, fontWeight: 400 }}>(data embedded in URL)</span>
          </div>
          <div style={{ fontSize: 10, fontFamily: T.mono, color: T.text2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginBottom: 8 }}>
            /receipts/{receipt.id}<span style={{ color: T.green }}>?d=…</span>
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            <button onClick={copyUrl} style={{
              flex: 1, background: copied ? 'rgba(0,221,160,0.08)' : T.surface,
              border: `1px solid ${copied ? 'rgba(0,221,160,0.25)' : T.border}`,
              borderRadius: 5, padding: '5px 0',
              fontSize: 10, fontWeight: 600,
              color: copied ? T.green : T.text3,
              cursor: 'pointer', transition: 'all .15s',
            }}>
              {copied ? '✓ copied' : 'copy link'}
            </button>
            <a href={receiptUrl} target="_blank" rel="noopener noreferrer" style={{
              flex: 1, textAlign: 'center',
              background: 'none', border: `1px solid ${T.border}`,
              borderRadius: 5, padding: '5px 0',
              fontSize: 10, fontWeight: 600, color: T.text3,
              textDecoration: 'none', display: 'inline-block',
            }}>
              open ↗
            </a>
          </div>
        </div>

        {/* Verify */}
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <button
            onClick={handleVerify}
            disabled={verifying}
            style={{
              background: btnStyle.bg,
              border: `1px solid ${btnStyle.border}`,
              color: btnStyle.color,
              borderRadius: 7, padding: '9px 16px',
              fontSize: 12, fontWeight: 600, cursor: verifying ? 'wait' : 'pointer',
              transition: 'all .15s',
              display: 'flex', alignItems: 'center', gap: 7,
              flexShrink: 0,
            }}
          >
            {verifying && <MiniSpinner />}
            {verifyBtnLabel()}
          </button>

          {verifyResult && (
            <div style={{ fontSize: 11, color: T.text3, flex: 1, lineHeight: 1.5 }}>
              {verifyResult.reason}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function ScoreBox({ label, value, sub, color }: { label: string; value: string; sub?: string; color: string }) {
  return (
    <div style={{ background: T.bg, border: `1px solid ${T.border}`, borderRadius: 7, padding: '10px', textAlign: 'center' }}>
      <div style={{ fontSize: 9, color: T.text3, marginBottom: 4, textTransform: 'uppercase', letterSpacing: '.07em' }}>{label}</div>
      <div style={{ fontSize: 20, fontWeight: 700, fontFamily: T.mono, color }} className="num">{value}</div>
      {sub && <div style={{ fontSize: 10, color: T.text3, marginTop: 2 }}>{sub}</div>}
    </div>
  )
}

function HashRow({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ marginBottom: 8 }}>
      <div style={{ fontSize: 9, color: T.text3, marginBottom: 3, textTransform: 'uppercase', letterSpacing: '.07em' }}>{label}</div>
      <div style={{ fontSize: 10, fontFamily: T.mono, color: T.text2, wordBreak: 'break-all', lineHeight: 1.6 }}>{value}</div>
    </div>
  )
}

function MiniSpinner() {
  return (
    <div style={{ width: 11, height: 11, border: `1.5px solid rgba(255,255,255,0.1)`, borderTop: `1.5px solid currentColor`, borderRadius: '50%', animation: 'spin .8s linear infinite' }} />
  )
}
