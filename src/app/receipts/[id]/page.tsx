import { receiptQueries } from '@/lib/db/queries'
import { ecdsaVerify, getPublicKeyInfo } from '@/lib/crypto'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { Nav } from '@/components/Nav'

const C = {
  bg:      '#0A0A0F',
  surface: '#111118',
  surface2:'#16161F',
  border:  '#1C1C28',
  text1:   '#F1F5F9',
  text2:   '#94A3B8',
  text3:   '#475569',
  green:   '#22C55E',
  red:     '#EF4444',
  mono:    'var(--font-geist-mono), ui-monospace, monospace',
}

export default async function ReceiptPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const receipt = receiptQueries.getById(id)
  if (!receipt) notFound()

  const payload = JSON.stringify({
    id: receipt.id,
    contract_id: receipt.contract_id,
    agent_id: receipt.agent_id,
    agent_name: receipt.agent_name,
    task_hash: receipt.task_hash,
    work_hash: receipt.work_hash,
    escrow_status: receipt.escrow_status,
    judge_score: receipt.judge_score,
    trust_score_before: receipt.trust_score_before,
    trust_score_after: receipt.trust_score_after,
    trust_delta: receipt.trust_delta,
  })
  const payloadB64 = Buffer.from(payload).toString('base64')
  const valid = ecdsaVerify(payload, receipt.signature)
  const isEcdsa = receipt.signature.startsWith('ecdsa:')
  const pkInfo = getPublicKeyInfo()

  const deltaPositive = receipt.trust_delta >= 0
  const deltaColor    = deltaPositive ? C.green : C.red

  return (
    <div style={{ minHeight: '100dvh', background: C.bg, color: C.text1, fontFamily: 'system-ui, sans-serif' }}>
      <Nav />

      <main style={{ maxWidth: 680, margin: '0 auto', padding: '56px 40px 100px' }}>

        {/* Header */}
        <div style={{ marginBottom: 40 }}>
          <p style={{ fontSize: 11, color: C.text3, letterSpacing: '.08em', textTransform: 'uppercase', marginBottom: 10 }}>
            Stvor Trust Receipt · Portable Proof
          </p>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 10 }}>
            <div style={{
              width: 44, height: 44, borderRadius: 10,
              background: valid ? 'rgba(34,197,94,.1)' : 'rgba(239,68,68,.1)',
              border: `1px solid ${valid ? 'rgba(34,197,94,.25)' : 'rgba(239,68,68,.25)'}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 20, color: valid ? C.green : C.red, fontWeight: 700,
            }}>
              {valid ? '✓' : '✗'}
            </div>
            <div>
              <h1 style={{ fontSize: 24, fontWeight: 800, letterSpacing: '-0.04em', color: C.text1, marginBottom: 3 }}>
                {valid ? 'Receipt Verified' : 'Verification Failed'}
              </h1>
              <p style={{ fontSize: 13, color: C.text3, fontFamily: C.mono }}>#{receipt.id}</p>
            </div>
          </div>

          <div style={{
            background: valid ? 'rgba(34,197,94,.05)' : 'rgba(239,68,68,.05)',
            border: `1px solid ${valid ? 'rgba(34,197,94,.15)' : 'rgba(239,68,68,.15)'}`,
            borderRadius: 8, padding: '12px 16px',
            fontSize: 13, color: valid ? C.green : C.red, lineHeight: 1.6,
          }}>
            {valid
              ? `${isEcdsa ? 'ECDSA P-256 (SHA-256)' : 'HMAC-SHA256'} signature verified. This receipt is cryptographically authentic. ${isEcdsa ? 'Verifiable offline without contacting Stvor.' : ''}`
              : 'Signature mismatch. This receipt may have been tampered with.'}
          </div>

          {isEcdsa && (
            <div style={{ display: 'flex', gap: 8, marginTop: 10, flexWrap: 'wrap' }}>
              {[
                { label: 'ECDSA P-256', color: '#22C55E' },
                { label: 'Portable — verify without Stvor', color: '#3B82F6' },
                { label: 'Zero-trust verification', color: '#8B5CF6' },
              ].map(b => (
                <span key={b.label} style={{
                  fontSize: 10, fontWeight: 700, padding: '3px 9px', borderRadius: 4,
                  background: `${b.color}15`, border: `1px solid ${b.color}35`, color: b.color,
                  letterSpacing: '.04em',
                }}>{b.label}</span>
              ))}
            </div>
          )}
        </div>

        {/* Agent summary */}
        <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, padding: '20px 22px', marginBottom: 16 }}>
          <div style={{ fontSize: 10, color: C.text3, textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: 14 }}>Contract Winner</div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div style={{ fontSize: 22, fontWeight: 800, color: C.text1, letterSpacing: '-0.03em', marginBottom: 4 }}>
                {receipt.agent_name}
              </div>
              <div style={{ fontSize: 12, color: C.text3, fontFamily: C.mono }}>
                Agent ID: {receipt.agent_id}
              </div>
            </div>
            <div style={{
              background: receipt.escrow_status === 'RELEASED' ? 'rgba(34,197,94,.08)' : 'rgba(239,68,68,.08)',
              border: `1px solid ${receipt.escrow_status === 'RELEASED' ? 'rgba(34,197,94,.2)' : 'rgba(239,68,68,.2)'}`,
              borderRadius: 6, padding: '6px 14px',
              fontSize: 11, fontWeight: 700,
              color: receipt.escrow_status === 'RELEASED' ? C.green : C.red,
              fontFamily: C.mono,
            }}>
              {receipt.escrow_status}
            </div>
          </div>
        </div>

        {/* Score cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, marginBottom: 16 }}>
          {[
            { label: 'Judge Score',    value: `${receipt.judge_score.toFixed(1)}`, sub: '/ 100',   color: C.text1 },
            { label: 'Trust Before',   value: receipt.trust_score_before.toFixed(1), sub: 'score', color: C.text2 },
            { label: 'Trust After',    value: receipt.trust_score_after.toFixed(1),  sub: 'score', color: deltaColor },
            { label: 'Score Delta',    value: `${deltaPositive ? '+' : ''}${receipt.trust_delta.toFixed(1)}`, sub: 'points', color: deltaColor },
          ].map((s, i) => (
            <div key={i} style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 8, padding: '14px 16px', textAlign: 'center' }}>
              <div style={{ fontSize: 9, color: C.text3, textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: 8 }}>{s.label}</div>
              <div style={{ fontSize: 22, fontWeight: 700, fontFamily: C.mono, color: s.color, letterSpacing: '-0.02em' }}>{s.value}</div>
              <div style={{ fontSize: 10, color: C.text3, marginTop: 3 }}>{s.sub}</div>
            </div>
          ))}
        </div>

        {/* Cryptographic proof */}
        <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, overflow: 'hidden', marginBottom: 16 }}>
          <div style={{ padding: '12px 18px', borderBottom: `1px solid ${C.border}` }}>
            <span style={{ fontSize: 10, fontWeight: 600, color: C.text3, textTransform: 'uppercase', letterSpacing: '.08em' }}>
              Cryptographic Proof
            </span>
          </div>
          <div style={{ padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: 14 }}>
            <HashField label="Task Hash (SHA-256)" value={receipt.task_hash}
              note="SHA-256 of original task payload — committed at contract creation" />
            <HashField label="Work Hash (SHA-256)" value={receipt.work_hash}
              note="SHA-256 of delivered work — verified before escrow release" />
            <HashField label={isEcdsa ? 'ECDSA P-256 Signature' : 'HMAC-SHA256 Signature'} value={receipt.signature}
              note={isEcdsa ? 'ECDSA signature — verifiable offline with public key below' : 'HMAC signature of full receipt payload'} />
          </div>
        </div>

        {/* Timeline */}
        <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, overflow: 'hidden', marginBottom: 28 }}>
          <div style={{ padding: '12px 18px', borderBottom: `1px solid ${C.border}` }}>
            <span style={{ fontSize: 10, fontWeight: 600, color: C.text3, textTransform: 'uppercase', letterSpacing: '.08em' }}>
              Receipt Details
            </span>
          </div>
          <div style={{ padding: '0 18px' }}>
            {[
              { label: 'Receipt ID',     value: receipt.id,          mono: true },
              { label: 'Contract ID',    value: receipt.contract_id,  mono: true },
              { label: 'Agent ID',       value: receipt.agent_id,     mono: true },
              { label: 'Escrow Status',  value: receipt.escrow_status, mono: false },
              { label: 'Generated At',   value: new Date(receipt.generated_at).toLocaleString(), mono: false },
            ].map((r, i, arr) => (
              <div key={i} style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '11px 0',
                borderBottom: i < arr.length - 1 ? `1px solid ${C.border}` : 'none',
                gap: 20,
              }}>
                <span style={{ fontSize: 12, color: C.text3, flexShrink: 0 }}>{r.label}</span>
                <span style={{
                  fontSize: 11, color: C.text2,
                  fontFamily: r.mono ? C.mono : 'inherit',
                  textAlign: 'right', wordBreak: 'break-all',
                }}>{r.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* How to verify independently */}
        <div style={{ background: C.surface2, border: `1px solid ${C.border}`, borderRadius: 10, padding: '20px 22px', marginBottom: 16 }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: C.text3, textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: 14 }}>
            Verify via API
          </div>
          <pre style={{
            fontSize: 11, fontFamily: C.mono, color: C.text2, lineHeight: 1.75,
            overflowX: 'auto', margin: 0,
          }}>{`curl -X POST /api/receipts/verify \\
  -H "Content-Type: application/json" \\
  -d '{"receiptId": "${receipt.id}"}'

# → { "valid": ${valid}, "signatureAlgorithm": "${isEcdsa ? 'ECDSA P-256 (SHA-256)' : 'HMAC-SHA256'}" }`}</pre>
        </div>

        {isEcdsa && pkInfo && (
          <div style={{ background: C.surface2, border: `1px solid #3B82F620`, borderLeft: '3px solid #3B82F6', borderRadius: 10, padding: '20px 22px', marginBottom: 16 }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: '#3B82F6', textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: 14 }}>
              Verify Offline — No Stvor Server Required
            </div>
            <pre style={{
              fontSize: 10, fontFamily: C.mono, color: C.text2, lineHeight: 1.85,
              overflowX: 'auto', margin: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-all',
            }}>{`# Public key: GET /api/.well-known/stvor-public-key
# Verify this receipt using only Node.js built-ins — no Stvor server needed:

node -e "
const c = require('crypto');
const pub = c.createPublicKey({
  key: Buffer.from('${pkInfo.b64}', 'base64'),
  format: 'der', type: 'spki'
});
const sig = Buffer.from('${receipt.signature.replace('ecdsa:', '')}', 'base64');
const payload = Buffer.from('${payloadB64}', 'base64').toString('utf8');
console.log('valid:', c.verify('sha256', Buffer.from(payload), pub, sig));
"
# → valid: true`}</pre>
          </div>
        )}

        <div style={{ background: C.surface2, border: `1px solid #8B5CF620`, borderLeft: '3px solid #8B5CF6', borderRadius: 10, padding: '16px 22px', marginBottom: 28 }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: '#8B5CF6', marginBottom: 8 }}>
            Post-Quantum Transport Layer
          </div>
          <div style={{ fontSize: 12, color: C.text2, lineHeight: 1.65 }}>
            For quantum-resistant agent communication, arena agents can enable{' '}
            <code style={{ color: '#22C55E', background: 'rgba(255,255,255,.05)', padding: '1px 5px', borderRadius: 3, fontSize: 11 }}>@stvor/sdk</code>{' '}
            with <code style={{ color: '#22C55E', background: 'rgba(255,255,255,.05)', padding: '1px 5px', borderRadius: 3, fontSize: 11 }}>pqc: true</code>{' '}
            — ML-KEM-768 + X3DH hybrid key exchange. Verified against NIST FIPS 203 test vectors.
          </div>
        </div>

        {/* Back link */}
        <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
          <Link href="/demo" style={{
            fontSize: 13, color: C.text3, textDecoration: 'none',
            background: C.surface, border: `1px solid ${C.border}`,
            padding: '8px 16px', borderRadius: 6,
          }}>
            ← Back to Demo
          </Link>
          <Link href={`/api/v1/trust/${receipt.agent_id}`} style={{
            fontSize: 13, color: C.text3, textDecoration: 'none',
            background: C.surface, border: `1px solid ${C.border}`,
            padding: '8px 16px', borderRadius: 6,
          }}>
            View Trust Score →
          </Link>
        </div>

      </main>
    </div>
  )
}

function HashField({ label, value, note }: { label: string; value: string; note: string }) {
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
        <span style={{ fontSize: 10, fontWeight: 600, color: C.text2, textTransform: 'uppercase', letterSpacing: '.07em' }}>{label}</span>
        <span style={{ fontSize: 10, color: C.text3 }}>{note}</span>
      </div>
      <div style={{
        fontFamily: C.mono, fontSize: 11, color: C.text3,
        wordBreak: 'break-all', lineHeight: 1.65,
        background: C.bg, borderRadius: 6, padding: '8px 12px',
        border: `1px solid ${C.border}`,
      }}>
        {value}
      </div>
    </div>
  )
}
