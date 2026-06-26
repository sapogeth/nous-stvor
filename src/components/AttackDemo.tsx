'use client'

import { StvorEvent } from '@/types'

const T = {
  bg:      '#0A0A0F',
  surface: '#111118',
  surface2:'#16161F',
  border:  '#1C1C28',
  borderHi:'#2C2C3E',
  text1:   '#F1F5F9',
  text2:   '#94A3B8',
  text3:   '#7A8FA8',
  green:   '#22C55E',
  red:     '#EF4444',
  redDim:  'rgba(239,68,68,.06)',
  mono:    'var(--font-geist-mono), ui-monospace, monospace',
}

interface Props {
  events: StvorEvent[]
  currentStep: number
}

export function AttackDemo({ events, currentStep }: Props) {
  const contractCreated = events.find(e => e.type === 'CONTRACT_CREATED') as Extract<StvorEvent, { type: 'CONTRACT_CREATED' }> | undefined
  const escrowFunded    = events.find(e => e.type === 'ESCROW_FUNDED') as Extract<StvorEvent, { type: 'ESCROW_FUNDED' }> | undefined
  const attackStarted   = events.find(e => e.type === 'ATTACK_STARTED') as Extract<StvorEvent, { type: 'ATTACK_STARTED' }> | undefined
  const attestFailed    = events.find(e => e.type === 'ATTESTATION_FAILED') as Extract<StvorEvent, { type: 'ATTESTATION_FAILED' }> | undefined
  const escrowHeld      = events.find(e => e.type === 'ESCROW_HELD') as Extract<StvorEvent, { type: 'ESCROW_HELD' }> | undefined
  const attackPrevented = events.find(e => e.type === 'ATTACK_PREVENTED') as Extract<StvorEvent, { type: 'ATTACK_PREVENTED' }> | undefined

  if (currentStep === 0) {
    return (
      <div style={{
        background: T.surface,
        border: `1px solid ${T.border}`,
        borderLeft: `3px solid ${T.red}`,
        borderRadius: 10,
        padding: '52px 40px',
        textAlign: 'center',
      }}>
        <div style={{ width:48, height:48, borderRadius:10, background:T.redDim, border:`1px solid rgba(239,68,68,.15)`, display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 18px', fontSize:20, color: T.red }}>
          ⚠
        </div>
        <h3 style={{ fontSize:17, fontWeight:700, marginBottom:10, letterSpacing:'-0.02em', color:T.text1 }}>
          Supply Chain Attack Simulation
        </h3>
        <p style={{ color:T.text3, fontSize:13, lineHeight:1.75, maxWidth:400, margin:'0 auto' }}>
          An attacker intercepts the task payload between buyer and agent —
          substituting a fund-theft instruction for the original task.
          <br /><br />
          <span style={{ color:T.text1, fontWeight:600 }}>Stvor catches it before execution.</span>
        </p>
      </div>
    )
  }

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:10 }}>

      {/* Step 1: Contract + original task hash */}
      {contractCreated && (
        <AttackCard status="ok" label="Contract Signed — Task Payload Committed">
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
            <div>
              <Label>Original Task</Label>
              <div style={{ fontSize:12, color:T.text2, lineHeight:1.6, fontStyle:'italic' }}>
                &ldquo;{contractCreated.data.taskDescription.slice(0, 100)}...&rdquo;
              </div>
            </div>
            <div>
              <Label>SHA-256 Commitment</Label>
              <div style={{ fontSize:10, fontFamily:T.mono, color:T.text1, wordBreak:'break-all', lineHeight:1.7 }}>
                {contractCreated.data.taskHash}
              </div>
              <div style={{ fontSize:10, color:T.green, marginTop:6, fontWeight:600 }}>Buyer signature locked</div>
            </div>
          </div>
        </AttackCard>
      )}

      {/* Step 2: Escrow funded */}
      {escrowFunded && (
        <AttackCard status="ok" label="Escrow Funded — Stripe">
          <div style={{ display:'flex', gap:20, alignItems:'center' }}>
            <div style={{ fontSize:28, fontWeight:700, fontFamily:T.mono, color:T.green, letterSpacing:'-0.02em' }}>
              ${(escrowFunded.data.amountCents / 100).toFixed(0)}
            </div>
            <div>
              <div style={{ fontSize:12, color:T.green, marginBottom:4 }}>Held in escrow</div>
              <div style={{ fontSize:11, fontFamily:T.mono, color:T.text3 }}>{escrowFunded.data.paymentIntentId}</div>
              <div style={{ fontSize:11, color:T.text3, marginTop:3 }}>Release requires attestation to pass</div>
            </div>
          </div>
        </AttackCard>
      )}

      {/* Step 3: ATTACK */}
      {attackStarted && (
        <AttackCard status="danger" label="Attack Detected — Payload Intercepted in Transit" pulse>
          <div style={{ marginBottom:12 }}>
            <div style={{
              background:T.redDim, border:`1px solid rgba(239,68,68,.15)`,
              borderRadius:7, padding:'9px 12px', marginBottom:10,
              fontSize:12, color:T.text3,
            }}>
              <span style={{ color:T.red, fontWeight:600 }}>Attacker</span> intercepted the task payload.
              Original instruction replaced with fund-theft command.
            </div>
          </div>

          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
            <div style={{ background:'rgba(34,197,94,.04)', border:`1px solid rgba(34,197,94,.12)`, borderRadius:7, padding:'10px 12px' }}>
              <div style={{ fontSize:9, color:T.green, marginBottom:5, fontWeight:600, textTransform:'uppercase', letterSpacing:'.07em' }}>
                Original — buyer signed
              </div>
              <div style={{ fontSize:11, color:T.text2, lineHeight:1.6 }}>
                {attackStarted.data.originalTask.slice(0, 120)}...
              </div>
            </div>

            <div style={{ background:T.redDim, border:`1px solid rgba(239,68,68,.2)`, borderRadius:7, padding:'10px 12px' }}>
              <div style={{ fontSize:9, color:T.red, marginBottom:5, fontWeight:600, textTransform:'uppercase', letterSpacing:'.07em' }}>
                Tampered — agent receives
              </div>
              <div style={{ fontSize:11, color:'#FCA5A5', lineHeight:1.6, fontFamily:T.mono }}>
                {attackStarted.data.tamperedTask.slice(0, 120)}...
              </div>
            </div>
          </div>
        </AttackCard>
      )}

      {/* Step 4: Attestation FAILED */}
      {attestFailed && (
        <AttackCard status="danger" label="Payload Attestation Failed — Hash Mismatch">
          <div style={{ marginBottom:12, fontSize:13, color:T.red, fontWeight:600 }}>
            Hash of received payload does not match buyer&apos;s signature.
          </div>
          <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
            <HashCompare label="Expected — buyer signed" value={attestFailed.data.expectedHash} status="ok" />
            <div style={{ textAlign:'center', fontSize:12, color:T.red, fontWeight:700, letterSpacing:'.02em' }}>≠ MISMATCH</div>
            <HashCompare label="Received — tampered payload" value={attestFailed.data.receivedHash} status="danger" />
          </div>
        </AttackCard>
      )}

      {/* Step 5: Escrow HELD */}
      {escrowHeld && (
        <AttackCard status="warn" label="Escrow Locked — Funds Held, Execution Refused">
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>
            <div>
              <div style={{ fontSize:11, color:T.text3, marginBottom:8 }}>With Stvor</div>
              <div style={{ fontSize:22, fontWeight:700, fontFamily:T.mono, color:T.green, letterSpacing:'-0.02em' }}>
                ${(escrowHeld.data.amountCents / 100).toFixed(0)} SAFE
              </div>
              <div style={{ fontSize:11, color:T.green, marginTop:4 }}>Returned to buyer. Attack blocked.</div>
            </div>
            <div>
              <div style={{ fontSize:11, color:T.text3, marginBottom:8 }}>Without Stvor</div>
              <div style={{ fontSize:22, fontWeight:700, fontFamily:T.mono, color:T.red, textDecoration:'line-through', opacity:.6 }}>
                ${(escrowHeld.data.amountCents / 100).toFixed(0)} LOST
              </div>
              <div style={{ fontSize:11, color:T.red, marginTop:4 }}>Agent executes tampered task. Funds gone.</div>
            </div>
          </div>
          <div style={{ marginTop:12, padding:'9px 12px', background:T.surface, border:`1px solid ${T.border}`, borderRadius:6, fontSize:11, color:T.text3, fontFamily:T.mono }}>
            {escrowHeld.data.reason}
          </div>
        </AttackCard>
      )}

      {/* Final: Attack prevented */}
      {attackPrevented && (
        <div style={{
          background: T.surface,
          border: `1px solid rgba(34,197,94,.25)`,
          borderLeft: `3px solid ${T.green}`,
          borderRadius: 10, padding: '22px',
          animation: 'fadeUp 0.3s ease-out',
        }}>
          <div style={{ display:'flex', alignItems:'center', gap:16, marginBottom:16 }}>
            <div style={{ width:44, height:44, borderRadius:9, background:'rgba(34,197,94,.08)', border:`1px solid rgba(34,197,94,.2)`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:20, color: T.green }}>
              ✓
            </div>
            <div>
              <div style={{ fontSize:16, fontWeight:700, color:T.green, letterSpacing:'-0.02em' }}>
                Attack Prevented
              </div>
              <div style={{ fontSize:12, color:T.text3, marginTop:2 }}>
                Supply chain payload substitution blocked by cryptographic attestation
              </div>
            </div>
            <div style={{ marginLeft:'auto', textAlign:'right' }}>
              <div style={{ fontSize:26, fontWeight:700, fontFamily:T.mono, color:T.green, letterSpacing:'-0.02em' }}>
                ${(attackPrevented.data.amountSaved / 100).toFixed(0)}
              </div>
              <div style={{ fontSize:11, color:T.text3 }}>saved from theft</div>
            </div>
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(3, 1fr)', gap:10 }}>
            <StatBox label="Attack Type" value="Payload Substitution" color={T.red} />
            <StatBox label="Detection"   value="SHA-256 Attestation"  color={T.text2} />
            <StatBox label="Escrow"      value="Funds Returned"       color={T.green} />
          </div>
        </div>
      )}
    </div>
  )
}

// ── Sub-components ───────────────────────────────────────────────────────────

function Label({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ fontSize:9, color:T.text3, marginBottom:5, textTransform:'uppercase', letterSpacing:'.07em' }}>
      {children}
    </div>
  )
}

function AttackCard({ status, label, children, pulse }: {
  status: 'ok' | 'danger' | 'warn'
  label: string
  children: React.ReactNode
  pulse?: boolean
}) {
  const border = status === 'danger' ? 'rgba(239,68,68,.2)' : status === 'warn' ? 'rgba(245,158,11,.2)' : T.border
  const labelColor = status === 'danger' ? T.red : status === 'warn' ? '#F59E0B' : T.text2
  const headerBg = status === 'danger' ? T.redDim : status === 'warn' ? 'rgba(245,158,11,.04)' : 'transparent'

  return (
    <div style={{
      background: T.surface,
      border: `1px solid ${border}`,
      borderRadius: 10,
      overflow: 'hidden',
      animation: pulse ? 'attackPulse 1.8s ease-in-out infinite, fadeUp 0.2s ease-out' : 'fadeUp 0.2s ease-out',
    }}>
      <div style={{
        padding:'10px 16px', background:headerBg,
        borderBottom:`1px solid ${border}`,
        display:'flex', alignItems:'center', gap:8,
      }}>
        <span style={{ fontSize:12, fontWeight:600, color:labelColor, letterSpacing:'-0.01em' }}>{label}</span>
      </div>
      <div style={{ padding:'14px 16px' }}>{children}</div>
    </div>
  )
}

function HashCompare({ label, value, status }: { label:string; value:string; status:'ok'|'danger' }) {
  const color = status === 'ok' ? T.green : T.red
  const bg = status === 'ok' ? 'rgba(34,197,94,.04)' : T.redDim
  return (
    <div style={{ background:bg, border:`1px solid ${color}20`, borderRadius:7, padding:'9px 12px' }}>
      <div style={{ fontSize:9, color:T.text3, marginBottom:4, textTransform:'uppercase', letterSpacing:'.07em' }}>{label}</div>
      <div style={{ fontSize:10, fontFamily:T.mono, color, wordBreak:'break-all', lineHeight:1.7 }}>{value}</div>
    </div>
  )
}

function StatBox({ label, value, color }: { label:string; value:string; color:string }) {
  return (
    <div style={{ background:T.bg, border:`1px solid ${T.border}`, borderRadius:7, padding:'9px 12px' }}>
      <div style={{ fontSize:9, color:T.text3, marginBottom:3, textTransform:'uppercase', letterSpacing:'.07em' }}>{label}</div>
      <div style={{ fontSize:11, fontWeight:600, color, fontFamily:T.mono }}>{value}</div>
    </div>
  )
}
