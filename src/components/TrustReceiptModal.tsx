'use client'

import { useState } from 'react'
import { TrustReceipt } from '@/types'

const T = {
  bg:      '#0A0A0F',
  surface: '#111118',
  surface2:'#16161F',
  border:  '#1C1C28',
  borderHi:'#2C2C3E',
  text1:   '#F1F5F9',
  text2:   '#94A3B8',
  text3:   '#475569',
  green:   '#22C55E',
  red:     '#EF4444',
  mono:    'var(--font-geist-mono), ui-monospace, monospace',
}

export function TrustReceiptModal({ receipt, onClose }: { receipt: TrustReceipt; onClose: () => void }) {
  const [verifying,    setVerifying]    = useState(false)
  const [verifyResult, setVerifyResult] = useState<{ valid: boolean; reason: string } | null>(null)
  const [copied,       setCopied]       = useState(false)

  const receiptUrl = typeof window !== 'undefined' ? `${window.location.origin}/receipts/${receipt.id}` : `/receipts/${receipt.id}`
  const isEcdsa = receipt.signature?.startsWith('ecdsa:')

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
        body: JSON.stringify({ receiptId: receipt.id }),
      })
      const data = await res.json()
      setVerifyResult({ valid: data.valid, reason: data.reason })
    } catch {
      setVerifyResult({ valid: false, reason: 'Verification request failed.' })
    } finally {
      setVerifying(false)
    }
  }

  return (
    <div
      style={{
        position: 'fixed', inset: 0,
        background: 'rgba(0,0,0,.85)',
        backdropFilter: 'blur(8px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 100,
      }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div style={{
        background: T.surface,
        border: `1px solid ${T.border}`,
        borderRadius: 12,
        padding: '28px',
        maxWidth: 500,
        width: '92%',
        animation: 'fadeUp 0.2s ease-out',
      }}>
        {/* Header */}
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:22 }}>
          <div style={{ display:'flex', alignItems:'center', gap:12 }}>
            <div style={{
              width:38, height:38, borderRadius:8,
              background: T.surface2, border:`1px solid ${T.borderHi}`,
              display:'flex', alignItems:'center', justifyContent:'center',
              fontSize:16, color:T.green, fontWeight:700,
            }}>✓</div>
            <div>
              <div style={{ fontSize:15, fontWeight:700, letterSpacing:'-0.02em', color:T.text1 }}>Stvor Trust Receipt</div>
              <div style={{ fontSize:11, color:T.text3, fontFamily:T.mono }}>#{receipt.id.slice(0, 12)}</div>
            </div>
          </div>
          <button onClick={onClose} style={{
            background:'none', border:`1px solid ${T.border}`, borderRadius:5,
            padding:'5px 11px', color:T.text3, cursor:'pointer', fontSize:12,
          }}>✕</button>
        </div>

        {/* Agent */}
        <div style={{ background:T.surface2, borderRadius:8, padding:'14px 16px', marginBottom:12, border:`1px solid ${T.border}` }}>
          <div style={{ fontSize:10, color:T.text3, marginBottom:5, textTransform:'uppercase', letterSpacing:'.07em' }}>Contract Winner</div>
          <div style={{ fontSize:16, fontWeight:700, color:T.text1 }}>{receipt.agent_name}</div>
          <div style={{ fontSize:11, color:T.text3, fontFamily:T.mono, marginTop:3 }}>Hermes Agent · Nemotron-3 Ultra</div>
        </div>

        {/* Scores */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(3, 1fr)', gap:8, marginBottom:12 }}>
          <ScoreBox label="Judge Score" value={`${receipt.judge_score.toFixed(1)}`} sub="/100" color={T.text1} />
          <ScoreBox label="Trust Before" value={receipt.trust_score_before.toFixed(1)} color={T.text2} />
          <ScoreBox label="Trust After" value={receipt.trust_score_after.toFixed(1)}
            sub={`${receipt.trust_delta > 0 ? '+' : ''}${receipt.trust_delta.toFixed(1)}`}
            color={receipt.trust_delta > 0 ? T.green : T.red} />
        </div>

        {/* Hashes */}
        <div style={{ background:T.surface2, borderRadius:8, padding:'14px 16px', marginBottom:12, border:`1px solid ${T.border}` }}>
          <HashRow label="Task Hash (SHA-256)" value={receipt.task_hash} />
          <HashRow label="Work Hash (SHA-256)" value={receipt.work_hash} />
          <div style={{ marginTop:10, paddingTop:10, borderTop:`1px solid ${T.border}`, display:'flex', gap:8 }}>
            <span style={{ background:'rgba(34,197,94,.08)', color:T.green, padding:'2px 9px', borderRadius:4, fontSize:10, fontWeight:600, fontFamily:T.mono }}>
              {receipt.escrow_status}
            </span>
            <span style={{ fontSize:10, color:T.text3, fontFamily:T.mono, alignSelf:'center' }}>
              {new Date(receipt.generated_at).toLocaleString()}
            </span>
          </div>
        </div>

        {/* Signature */}
        <div style={{ background:T.surface2, borderRadius:8, padding:'10px 14px', marginBottom:12, border:`1px solid ${T.border}` }}>
          <div style={{ fontSize:9, color:T.text3, marginBottom:5, textTransform:'uppercase', letterSpacing:'.07em' }}>
            {isEcdsa ? 'ECDSA P-256 Signature' : 'HMAC-SHA256 Signature'}
          </div>
          <div style={{ fontSize:10, fontFamily:T.mono, color:T.text3, wordBreak:'break-all', lineHeight:1.7 }}>
            {receipt.signature}
          </div>
          {isEcdsa && (
            <div style={{ marginTop:6, fontSize:10, color:T.text3 }}>
              Verifiable offline — no Stvor server required. Fetch public key from{' '}
              <code style={{ color:T.text2, fontSize:9 }}>/api/.well-known/stvor-public-key</code>
            </div>
          )}
        </div>

        {/* Permanent link */}
        <div style={{ background:T.surface2, border:`1px solid rgba(34,197,94,.2)`, borderRadius:8, padding:'10px 14px', marginBottom:16, display:'flex', alignItems:'center', gap:10 }}>
          <div style={{ flex:1, minWidth:0 }}>
            <div style={{ fontSize:9, color:T.green, marginBottom:3, textTransform:'uppercase', letterSpacing:'.07em', fontWeight:600 }}>
              Permanent receipt URL
            </div>
            <div style={{ fontSize:11, fontFamily:T.mono, color:T.text2, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
              {receiptUrl}
            </div>
          </div>
          <button onClick={copyUrl} style={{
            background: copied ? 'rgba(34,197,94,.1)' : T.surface,
            border:`1px solid ${copied ? 'rgba(34,197,94,.3)' : T.border}`,
            borderRadius:5, padding:'5px 12px',
            fontSize:10, fontWeight:600,
            color: copied ? T.green : T.text3,
            cursor:'pointer', flexShrink:0,
            transition:'all .15s',
          }}>
            {copied ? '✓ copied' : 'copy'}
          </button>
          <a href={`/receipts/${receipt.id}`} target="_blank" rel="noopener noreferrer" style={{
            background:'none', border:`1px solid ${T.border}`,
            borderRadius:5, padding:'5px 12px',
            fontSize:10, fontWeight:600, color:T.text3,
            textDecoration:'none', flexShrink:0,
            display:'inline-flex', alignItems:'center', gap:4,
          }}>
            open ↗
          </a>
        </div>

        {/* Verify */}
        <div style={{ display:'flex', gap:10, alignItems:'center' }}>
          <button
            onClick={handleVerify}
            disabled={verifying}
            style={{
              background: verifyResult?.valid === true  ? 'rgba(34,197,94,.08)'
                        : verifyResult?.valid === false ? 'rgba(239,68,68,.08)'
                        : T.text1,
              border: `1px solid ${verifyResult?.valid === true  ? 'rgba(34,197,94,.2)'
                                  : verifyResult?.valid === false ? 'rgba(239,68,68,.2)'
                                  : T.text1}`,
              color: verifyResult?.valid === true  ? T.green
                   : verifyResult?.valid === false ? T.red
                   : T.bg,
              borderRadius:7, padding:'10px 18px',
              fontSize:12, fontWeight:600, cursor: verifying ? 'wait' : 'pointer',
              transition:'border-color .15s',
              display:'flex', alignItems:'center', gap:8,
            }}
          >
            {verifying ? (
              <><MiniSpinner /> Verifying...</>
            ) : verifyResult?.valid === true ? (
              'Valid — receipt authentic'
            ) : verifyResult?.valid === false ? (
              'Invalid — signature mismatch'
            ) : (
              'Verify signature'
            )}
          </button>

          {verifyResult && (
            <div style={{ fontSize:11, color:T.text3, flex:1 }}>
              {verifyResult.reason}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function ScoreBox({ label, value, sub, color }: { label:string; value:string; sub?:string; color:string }) {
  return (
    <div style={{ background:T.bg, border:`1px solid ${T.border}`, borderRadius:7, padding:'10px', textAlign:'center' }}>
      <div style={{ fontSize:9, color:T.text3, marginBottom:5, textTransform:'uppercase', letterSpacing:'.07em' }}>{label}</div>
      <div style={{ fontSize:20, fontWeight:700, fontFamily:T.mono, color }} className="num">{value}</div>
      {sub && <div style={{ fontSize:10, color:T.text3, marginTop:2 }}>{sub}</div>}
    </div>
  )
}

function HashRow({ label, value }: { label:string; value:string }) {
  return (
    <div style={{ marginBottom:10 }}>
      <div style={{ fontSize:9, color:T.text3, marginBottom:3, textTransform:'uppercase', letterSpacing:'.07em' }}>{label}</div>
      <div style={{ fontSize:10, fontFamily:T.mono, color:T.text2, wordBreak:'break-all', lineHeight:1.6 }}>{value}</div>
    </div>
  )
}

function MiniSpinner() {
  return (
    <div style={{ width:11, height:11, border:`2px solid ${T.border}`, borderTop:`2px solid ${T.text2}`, borderRadius:'50%', animation:'spin .8s linear infinite' }} />
  )
}
