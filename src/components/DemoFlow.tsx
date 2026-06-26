'use client'

import { StvorEvent, AdaptationEntry } from '@/types'

const T = {
  bg:       '#0A0A0F',
  surface:  '#111118',
  surface2: '#16161F',
  border:   '#1C1C28',
  borderHi: '#2C2C3E',
  text1:    '#F1F5F9',
  text2:    '#94A3B8',
  text3:    '#475569',
  green:    '#22C55E',
  red:      '#EF4444',
  mono:     'var(--font-geist-mono), ui-monospace, monospace',
}

interface Props {
  currentStep: number
  events: StvorEvent[]
}

export function DemoFlow({ currentStep, events }: Props) {
  const contractR1     = events.find(e => e.type === 'CONTRACT_CREATED' && (e as any).data.round === 1) as Extract<StvorEvent, { type: 'CONTRACT_CREATED' }> | undefined
  const fundedEvent    = events.find(e => e.type === 'ESCROW_FUNDED') as Extract<StvorEvent, { type: 'ESCROW_FUNDED' }> | undefined
  const r1Bids         = events.filter(e => e.type === 'BID_SUBMITTED' && (e as any).data.round === 1) as Extract<StvorEvent, { type: 'BID_SUBMITTED' }>[]
  const inferenceEvent = events.find(e => e.type === 'INFERENCE_STARTED' && (e as any).data.round !== 2) as Extract<StvorEvent, { type: 'INFERENCE_STARTED' }> | undefined
  const inferenceComplete = events.find(e => e.type === 'INFERENCE_COMPLETE') as Extract<StvorEvent, { type: 'INFERENCE_COMPLETE' }> | undefined
  const r1Scores       = events.filter(e => e.type === 'BID_SCORED' && (e as any).data.round === 1) as Extract<StvorEvent, { type: 'BID_SCORED' }>[]
  const r1Winner       = events.find(e => e.type === 'WINNER_SELECTED' && (e as any).data.round === 1) as Extract<StvorEvent, { type: 'WINNER_SELECTED' }> | undefined
  const r1Released     = events.find(e => e.type === 'ESCROW_RELEASED' && (e as any).data.round === 1) as Extract<StvorEvent, { type: 'ESCROW_RELEASED' }> | undefined
  const trustEvents    = events.filter(e => e.type === 'TRUST_UPDATED' && (e as any).data.round === 1) as Extract<StvorEvent, { type: 'TRUST_UPDATED' }>[]
  const receiptEvent   = events.find(e => e.type === 'RECEIPT_GENERATED') as Extract<StvorEvent, { type: 'RECEIPT_GENERATED' }> | undefined
  const round2Starting = events.find(e => e.type === 'ROUND2_STARTING') as Extract<StvorEvent, { type: 'ROUND2_STARTING' }> | undefined
  const r2Bids         = events.filter(e => e.type === 'BID_SUBMITTED' && (e as any).data.round === 2) as Extract<StvorEvent, { type: 'BID_SUBMITTED' }>[]
  const r2Scores       = events.filter(e => e.type === 'BID_SCORED' && (e as any).data.round === 2) as Extract<StvorEvent, { type: 'BID_SCORED' }>[]
  const r2Winner       = events.find(e => e.type === 'WINNER_SELECTED' && (e as any).data.round === 2) as Extract<StvorEvent, { type: 'WINNER_SELECTED' }> | undefined
  const adaptationSummary = events.find(e => e.type === 'ADAPTATION_SUMMARY') as Extract<StvorEvent, { type: 'ADAPTATION_SUMMARY' }> | undefined
  const buyerReasoning   = events.find(e => e.type === 'BUYER_REASONING') as Extract<StvorEvent, { type: 'BUYER_REASONING' }> | undefined
  const trustRejected    = events.filter(e => e.type === 'TRUST_GATE_REJECTED') as Extract<StvorEvent, { type: 'TRUST_GATE_REJECTED' }>[]
  const r1WorkDelivered  = events.filter(e => e.type === 'WORK_DELIVERED' && (e as any).data.round === 1) as Extract<StvorEvent, { type: 'WORK_DELIVERED' }>[]
  const r2WorkDelivered  = events.filter(e => e.type === 'WORK_DELIVERED' && (e as any).data.round === 2) as Extract<StvorEvent, { type: 'WORK_DELIVERED' }>[]
  const r2TrustEvents    = events.filter(e => e.type === 'TRUST_UPDATED' && (e as any).data.round === 2) as Extract<StvorEvent, { type: 'TRUST_UPDATED' }>[]

  if (currentStep === 0) {
    return (
      <div style={{
        background: T.surface,
        border: `1px solid ${T.border}`,
        borderRadius: 10,
        padding: '52px 40px',
        textAlign: 'center',
      }}>
        <div style={{ width:48, height:48, borderRadius:10, background:T.surface2, border:`1px solid ${T.borderHi}`, display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 18px', fontSize:20, color: T.text2 }}>
          ▷
        </div>
        <h3 style={{ fontSize:17, fontWeight:700, marginBottom:10, letterSpacing:'-0.02em', color:T.text1 }}>
          Ready to run live economy
        </h3>
        <p style={{ color:T.text3, fontSize:13, lineHeight:1.7, maxWidth:360, margin:'0 auto' }}>
          5 Hermes agents compete across 2 rounds.<br />
          Watch agents adapt strategies in real-time,<br />
          parallel inference on NVIDIA NIM,<br />
          and Stripe escrow settle autonomously.
        </p>
      </div>
    )
  }

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:12 }}>

      <RoundLabel round={1} active={currentStep >= 1 && currentStep <= 6} complete={currentStep > 6} />

      {contractR1 && (
        <StepCard label="Contract Created" active={currentStep === 1} done={currentStep > 1}>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
            <InfoBox label="Budget" value={`$${(contractR1.data.budgetCents / 100).toFixed(2)}`} large />
            <InfoBox label="Buyer" value="CEO Hermes Agent" />
            <InfoBox label="Task Hash" value={contractR1.data.taskHash.slice(0, 20) + '...'} mono />
            <InfoBox label="Status" value="OPEN → FUNDED" color={T.green} />
          </div>
        </StepCard>
      )}

      {fundedEvent && (
        <StepCard label="Escrow Funded — Stripe" active={currentStep === 2} done={currentStep > 2}>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
            <InfoBox label="Amount Locked" value={`$${(fundedEvent.data.amountCents / 100).toFixed(2)}`} color={T.green} large />
            <InfoBox label="Payment Intent" value={fundedEvent.data.paymentIntentId} mono />
          </div>
          <StatusBadge color={T.green}>Funds held in Stripe escrow until work verified</StatusBadge>
        </StepCard>
      )}

      {r1Bids.length > 0 && (
        <StepCard label="Agent Bidding — EV = (Trust × Score) ÷ Price" active={currentStep === 3} done={currentStep > 3}>
          <div style={{ fontSize:11, color:T.text3, fontFamily:T.mono, marginBottom:10 }}>
            CEO Agent selects via expected value formula
          </div>
          <div style={{ display:'flex', gap:8 }}>
            {r1Bids.map(bid => {
              const score = r1Scores.find(s => s.data.agentId === bid.data.agentId)
              const isWinner = r1Winner?.data.winnerId === bid.data.agentId
              return (
                <BidCard
                  key={bid.data.bidId}
                  agentName={bid.data.agentName}
                  priceCents={bid.data.priceCents}
                  expectedValue={bid.data.expectedValue}
                  judgeScore={score?.data.judgeScore}
                  isWinner={isWinner}
                  model={bid.data.model}
                />
              )
            })}
          </div>
        </StepCard>
      )}

      {inferenceEvent && (
        <StepCard label="Parallel Inference — NVIDIA Nemotron-3 Ultra" active={currentStep === 4} done={currentStep > 4}>
          <NvidiaPanel
            agentCount={inferenceEvent.data.agentCount}
            model={inferenceEvent.data.model}
            avgLatency={inferenceComplete?.data.avgLatencyMs}
            agentLatencies={r1WorkDelivered.map(w => ({ name: w.data.agentName, ms: w.data.latencyMs }))}
          />
        </StepCard>
      )}

      {r1Scores.length > 0 && (
        <StepCard label="Nemotron-3 Ultra · Autonomous Judge Agent" active={currentStep === 5} done={currentStep > 5}>
          <NvidiaJudgeHeader model="nvidia/nemotron-3-super-120b-a12b" count={r1Scores.length} />
          <div style={{ display:'flex', gap:8 }}>
            {r1Scores.map(s => (
              <JudgeScoreCard
                key={s.data.bidId}
                agentName={s.data.agentName}
                score={s.data.judgeScore}
                breakdown={s.data.breakdown}
                reasoning={s.data.reasoning}
                isWinner={r1Winner?.data.winnerId === s.data.agentId}
              />
            ))}
          </div>
        </StepCard>
      )}

      {r1Released && (
        <StepCard label="Escrow Released + Trust Updated" active={currentStep === 6} done={currentStep > 6}>
          <div style={{
            background: 'rgba(34,197,94,.05)', border:`1px solid rgba(34,197,94,.12)`,
            borderRadius:8, padding:'14px 16px', marginBottom:10,
            display:'flex', justifyContent:'space-between', alignItems:'center',
          }}>
            <div>
              <div style={{ fontSize:11, color:T.text3, marginBottom:4 }}>Released to {r1Released.data.agentName}</div>
              <div style={{ fontSize:26, fontWeight:700, fontFamily:T.mono, color:T.green, letterSpacing:'-0.02em' }}>
                ${(r1Released.data.amountCents / 100).toFixed(2)}
              </div>
            </div>
            <div style={{ textAlign:'right' }}>
              <div style={{ fontSize:11, color:T.green, marginBottom:8, letterSpacing:'.02em' }}>STRIPE ESCROW RELEASED</div>
              {trustEvents.map((te, i) => (
                <div key={`${te.data.agentId}-${i}`} style={{
                  fontSize:11, fontFamily:T.mono,
                  color: te.data.delta > 0 ? T.green : T.red,
                  marginBottom:3,
                }}>
                  {te.data.agentName}: {te.data.before.toFixed(1)} → {te.data.after.toFixed(1)}
                  <span style={{ marginLeft:6, fontSize:10, opacity:.7 }}>
                    ({te.data.delta > 0 ? '+' : ''}{te.data.delta.toFixed(1)})
                  </span>
                </div>
              ))}
            </div>
          </div>
          {receiptEvent && (
            <StatusBadge color={T.text2}>
              Trust Receipt #{receiptEvent.data.id.slice(0, 8)} — HMAC-SHA256 signed
            </StatusBadge>
          )}
        </StepCard>
      )}

      {buyerReasoning && (
        <div style={{
          background: 'rgba(241,245,249,.03)',
          border: `1px solid rgba(241,245,249,.08)`,
          borderLeft: `3px solid ${T.text1}`,
          borderRadius: 8, padding: '14px 16px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <span style={{ fontSize: 9, fontFamily: T.mono, color: T.text3, letterSpacing: '.1em', textTransform: 'uppercase' }}>CEO Buyer Agent · Autonomous Decision</span>
          </div>
          <p style={{ fontSize: 13, color: T.text2, lineHeight: 1.65, margin: 0 }}>
            {buyerReasoning.data.reasoning}
          </p>
        </div>
      )}

      {round2Starting && (
        <>
          <RoundLabel round={2} active={currentStep >= 7 && currentStep <= 10} complete={currentStep > 10} />

          {trustRejected.length > 0 && (
            <div style={{
              background: 'rgba(239,68,68,.04)',
              border: `1px solid rgba(239,68,68,.15)`,
              borderRadius: 8, padding: '12px 16px',
              display: 'flex', alignItems: 'center', gap: 14,
            }}>
              <span style={{ fontSize: 9, fontFamily: T.mono, color: T.red, letterSpacing: '.1em', textTransform: 'uppercase', flexShrink: 0 }}>
                Trust Gate
              </span>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {trustRejected.map(e => (
                  <span key={e.data.agentId} style={{
                    fontSize: 11, color: T.red,
                    background: 'rgba(239,68,68,.08)', border: `1px solid rgba(239,68,68,.2)`,
                    borderRadius: 4, padding: '3px 9px', fontFamily: T.mono,
                  }}>
                    {e.data.agentName} ({e.data.trustScore.toFixed(1)}) — below {e.data.minRequired}
                  </span>
                ))}
              </div>
              <span style={{ fontSize: 11, color: T.text3, marginLeft: 'auto', flexShrink: 0 }}>
                Blocked from Round 2
              </span>
            </div>
          )}

          <StepCard label="Agent Adaptation — Emergent Behavior" active={currentStep === 7 || currentStep === 8} done={currentStep > 8}>
            <div style={{ fontSize:13, color:T.text2, marginBottom:12 }}>
              {round2Starting.data.message}
            </div>
            {r2Bids.length > 0 && (
              <div style={{ display:'flex', gap:8 }}>
                {r2Bids.map(bid => {
                  const r1Bid = r1Bids.find(b => b.data.agentId === bid.data.agentId)
                  const priceDelta = r1Bid ? bid.data.priceCents - r1Bid.data.priceCents : 0
                  const r2Score = r2Scores.find(s => s.data.agentId === bid.data.agentId)
                  const r1Score = r1Scores.find(s => s.data.agentId === bid.data.agentId)
                  const isWinner = r2Winner?.data.winnerId === bid.data.agentId
                  return (
                    <div key={bid.data.bidId} style={{
                      flex:1, background: isWinner ? T.surface2 : T.bg,
                      border:`1px solid ${isWinner ? T.borderHi : T.border}`,
                      borderRadius:8, padding:'12px',
                    }}>
                      <div style={{ fontSize:12, fontWeight:600, marginBottom:8, color:T.text1 }}>{bid.data.agentName}</div>
                      <div style={{ display:'flex', gap:8, marginBottom:6 }}>
                        <div style={{ fontFamily:T.mono, fontSize:15, fontWeight:700, color:T.text1 }}>
                          ${(bid.data.priceCents / 100).toFixed(0)}
                        </div>
                        {r1Bid && (
                          <div style={{ fontSize:11, color: priceDelta < 0 ? T.green : priceDelta > 0 ? T.red : T.text3, alignSelf:'center' }}>
                            {priceDelta < 0 ? '↓' : priceDelta > 0 ? '↑' : '='} ${Math.abs(priceDelta / 100).toFixed(0)} vs R1
                          </div>
                        )}
                      </div>
                      {r2Score && r1Score && (
                        <div style={{ fontSize:11, color:T.text3 }}>
                          Score:{' '}
                          <span style={{ color: r2Score.data.judgeScore > r1Score.data.judgeScore ? T.text1 : T.text3, fontFamily:T.mono }}>
                            {r1Score.data.judgeScore.toFixed(0)} → {r2Score.data.judgeScore.toFixed(0)}
                            {r2Score.data.judgeScore > r1Score.data.judgeScore ? ' ↑' : ' ↓'}
                          </span>
                        </div>
                      )}
                      {bid.data.adaptationReason && (
                        <div style={{ fontSize:10, color:T.text3, marginTop:6, lineHeight:1.5 }}>
                          {bid.data.adaptationReason}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </StepCard>
        </>
      )}

      {adaptationSummary && (
        <StepCard label="Adaptation Complete — Strategy Evolution" active={false} done>
          <div style={{ fontSize:12, color:T.text3, marginBottom:14 }}>
            Emergent economic behavior: agents updated strategies in response to Round 1 market signals.
          </div>

          {/* Strategy diff — side-by-side per agent */}
          <div style={{ display:'flex', flexDirection:'column', gap:8, marginBottom:4 }}>
            {adaptationSummary.data.adaptations.map((a: AdaptationEntry, i: number) => {
              const improved = a.scoreDelta > 0
              const priceDelta = a.r2Price - a.r1Price
              return (
                <div key={`${a.agentId}-${i}`} style={{
                  background:T.bg, border:`1px solid ${T.border}`, borderRadius:8, padding:'12px 14px',
                }}>
                  <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:8 }}>
                    <span style={{ fontSize:12, fontWeight:600, color:T.text1 }}>{a.agentName}</span>
                    <div style={{ display:'flex', gap:10, fontFamily:T.mono, fontSize:11 }}>
                      <span style={{ color:T.text3 }}>
                        Score: {a.r1Score.toFixed(0)} → <span style={{ color: improved ? T.green : T.text2 }}>{a.r2Score.toFixed(0)}</span>
                        {' '}<span style={{ color: improved ? T.green : T.red }}>{improved ? '↑' : '↓'}{Math.abs(a.scoreDelta).toFixed(1)}</span>
                      </span>
                      <span style={{ color:T.text3 }}>
                        Price: ${(a.r1Price/100).toFixed(0)} → <span style={{ color: priceDelta < 0 ? T.green : T.text2 }}>${(a.r2Price/100).toFixed(0)}</span>
                      </span>
                    </div>
                  </div>
                  {a.adaptationReason && (
                    <div style={{ fontSize:11, color:T.text3, lineHeight:1.55, borderTop:`1px solid ${T.border}`, paddingTop:8 }}>
                      <span style={{ color:T.text2, fontWeight:500 }}>Strategy: </span>{a.adaptationReason}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </StepCard>
      )}

      {/* Trust Evolution Table — the FICO credit history story */}
      {adaptationSummary && r1Bids.length > 0 && (
        <div style={{
          background: T.surface, border:`1px solid ${T.border}`,
          borderRadius:10, overflow:'hidden',
        }}>
          <div style={{ padding:'11px 16px', borderBottom:`1px solid ${T.border}`, display:'flex', alignItems:'center', justifyContent:'space-between' }}>
            <span style={{ fontSize:12, fontWeight:600, color:T.text1, letterSpacing:'-0.01em' }}>
              Trust Score Evolution — Agent Credit History
            </span>
            <span style={{ fontSize:10, color:T.text3 }}>2 rounds · 10 contracts</span>
          </div>
          <div style={{ padding:'14px 16px' }}>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 80px 80px 80px 80px', gap:8, marginBottom:10 }}>
              {['Agent', 'Initial', 'After R1', 'After R2', 'Net'].map((h, i) => (
                <div key={i} style={{ fontSize:9, color:T.text3, textTransform:'uppercase', letterSpacing:'.07em', textAlign: i > 0 ? 'right' : 'left' }}>
                  {h}
                </div>
              ))}
            </div>
            {r1Bids.map((bid, idx) => {
              const r1Trust  = trustEvents.find(e => e.data.agentId === bid.data.agentId)
              const r2Trust  = r2TrustEvents.find(e => e.data.agentId === bid.data.agentId)
              if (!r1Trust) return null
              const initial  = r1Trust.data.before
              const afterR1  = r1Trust.data.after
              const afterR2  = r2Trust ? r2Trust.data.after : afterR1
              const net      = afterR2 - initial
              const isGated  = trustRejected.some(e => e.data.agentId === bid.data.agentId)
              return (
                <div key={idx} style={{
                  display:'grid', gridTemplateColumns:'1fr 80px 80px 80px 80px', gap:8,
                  padding:'9px 0',
                  borderTop:`1px solid ${T.border}`,
                  opacity: isGated ? .6 : 1,
                }}>
                  <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                    <span style={{ fontSize:12, fontWeight:500, color: T.text1 }}>{bid.data.agentName}</span>
                    {isGated && (
                      <span style={{ fontSize:9, color:T.red, background:'rgba(239,68,68,.08)', border:'1px solid rgba(239,68,68,.2)', borderRadius:3, padding:'1px 5px' }}>
                        GATED
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize:12, fontFamily:T.mono, color:T.text3, textAlign:'right' }}>
                    {initial.toFixed(1)}
                  </div>
                  <div style={{ fontSize:12, fontFamily:T.mono, textAlign:'right', color: afterR1 > initial ? T.text1 : T.text3 }}>
                    {afterR1.toFixed(1)}
                    <span style={{ fontSize:9, color: afterR1 > initial ? T.green : T.red, marginLeft:3 }}>
                      {afterR1 > initial ? '↑' : afterR1 < initial ? '↓' : ''}
                    </span>
                  </div>
                  <div style={{ fontSize:12, fontFamily:T.mono, textAlign:'right', color: afterR2 > afterR1 ? T.text1 : T.text3 }}>
                    {afterR2.toFixed(1)}
                    {!isGated && (
                      <span style={{ fontSize:9, color: afterR2 > afterR1 ? T.green : T.red, marginLeft:3 }}>
                        {afterR2 > afterR1 ? '↑' : afterR2 < afterR1 ? '↓' : ''}
                      </span>
                    )}
                  </div>
                  <div style={{
                    fontSize:12, fontFamily:T.mono, textAlign:'right', fontWeight:600,
                    color: net > 0 ? T.green : net < 0 ? T.red : T.text3,
                  }}>
                    {net > 0 ? '+' : ''}{net.toFixed(1)}
                  </div>
                </div>
              )
            })}
            <div style={{ marginTop:14, paddingTop:12, borderTop:`1px solid ${T.border}`, fontSize:11, color:T.text3, lineHeight:1.6 }}>
              Trust score = 40% escrow success + 40% judge quality + 20% reliability.
              {' '}<strong style={{ color:T.text2 }}>Portable — this score follows each agent across every marketplace.</strong>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Sub-components ───────────────────────────────────────────────────────────

function RoundLabel({ round, active, complete }: { round:number; active:boolean; complete:boolean }) {
  return (
    <div style={{ display:'flex', alignItems:'center', gap:12 }}>
      <div style={{
        color: complete ? T.green : active ? T.text1 : T.text3,
        fontSize:10, fontWeight:700, letterSpacing:'.1em', textTransform:'uppercase', whiteSpace:'nowrap',
      }}>
        {complete ? '✓ ' : ''}Round {round}{round === 1 ? ' — Initial market' : ' — Adaptive strategies'}
      </div>
      <div style={{ flex:1, height:1, background:T.border }} />
    </div>
  )
}

function StepCard({ label, active, done, children }: {
  label:string; active:boolean; done:boolean; children: React.ReactNode
}) {
  return (
    <div style={{
      background: T.surface,
      border: `1px solid ${active ? T.borderHi : T.border}`,
      borderRadius: 10,
      overflow: 'hidden',
      animation: 'fadeUp 0.2s ease-out',
    }}>
      <div style={{
        padding:'11px 16px',
        background: active ? T.surface2 : 'transparent',
        borderBottom:`1px solid ${T.border}`,
        display:'flex', alignItems:'center', gap:10,
      }}>
        <span style={{ fontSize:12, fontWeight:600, color: active ? T.text1 : done ? T.text2 : T.text1, letterSpacing:'-0.01em' }}>
          {label}
        </span>
        <div style={{ marginLeft:'auto', display:'flex', alignItems:'center', gap:5 }}>
          {active && <LiveDot />}
          {done && <span style={{ fontSize:11, color:T.green }}>✓</span>}
        </div>
      </div>
      <div style={{ padding:'14px 16px' }}>{children}</div>
    </div>
  )
}

function BidCard({ agentName, priceCents, expectedValue, judgeScore, isWinner, model }: {
  agentName:string; priceCents:number; expectedValue:number; judgeScore?:number;
  isWinner?:boolean; model:string;
}) {
  return (
    <div style={{
      flex:1, background: isWinner ? T.surface2 : T.bg,
      border:`1px solid ${isWinner ? T.borderHi : T.border}`,
      borderRadius:8, padding:'12px', position:'relative',
    }}>
      {isWinner && (
        <div style={{
          position:'absolute', top:-8, right:10,
          background:T.text1, color:T.bg,
          fontSize:9, fontWeight:700, padding:'2px 7px', borderRadius:3, letterSpacing:'.04em',
        }}>SELECTED</div>
      )}
      <div style={{ fontSize:12, fontWeight:600, marginBottom:8, color:T.text1 }}>{agentName}</div>
      <div style={{ fontSize:20, fontWeight:700, fontFamily:T.mono, marginBottom:5, color:T.text1 }}>
        ${(priceCents / 100).toFixed(0)}
      </div>
      <div style={{ fontSize:10, color:T.text3, marginBottom:3, fontFamily:T.mono }}>
        EV: {expectedValue.toFixed(3)}
      </div>
      {judgeScore !== undefined && (
        <div style={{ fontSize:11, color: judgeScore >= 80 ? T.text1 : T.text3, fontFamily:T.mono }}>
          Judge: {judgeScore.toFixed(1)}/100
        </div>
      )}
      <div style={{ fontSize:9, color:T.text3, marginTop:5, fontFamily:T.mono, opacity:.6 }}>{model}</div>
    </div>
  )
}

function NvidiaPanel({ agentCount, model, avgLatency, agentLatencies }: {
  agentCount: number
  model: string
  avgLatency?: number
  agentLatencies?: { name: string; ms: number }[]
}) {
  const totalMs = agentLatencies && agentLatencies.length > 0
    ? Math.max(...agentLatencies.map(a => a.ms))
    : undefined

  return (
    <div style={{ background:T.bg, border:`1px solid ${T.border}`, borderRadius:8, padding:'14px 16px' }}>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:14 }}>
        <span style={{ fontSize:11, fontWeight:600, color:T.text2, letterSpacing:'.01em' }}>NVIDIA · Parallel Agent Inference</span>
        <div style={{ display:'flex', gap:14, alignItems:'center' }}>
          {totalMs && (
            <span style={{ fontSize:10, color:T.text3, fontFamily:T.mono }}>
              wall-clock {(totalMs / 1000).toFixed(1)}s · sequential ~{(totalMs * agentCount / 1000).toFixed(0)}s
            </span>
          )}
          {avgLatency && (
            <span style={{ fontSize:11, fontFamily:T.mono, color:T.green }}>avg {(avgLatency / 1000).toFixed(1)}s</span>
          )}
        </div>
      </div>

      {agentLatencies && agentLatencies.length > 0 ? (
        <div style={{ display:'flex', flexDirection:'column', gap:6, marginBottom:14 }}>
          {agentLatencies.map((a, i) => {
            const maxMs = Math.max(...agentLatencies.map(x => x.ms))
            const pct = Math.round((a.ms / maxMs) * 100)
            return (
              <div key={i}>
                <div style={{ display:'flex', justifyContent:'space-between', marginBottom:3 }}>
                  <span style={{ fontSize:10, color:T.text3 }}>{a.name}</span>
                  <span style={{ fontSize:10, fontFamily:T.mono, color:T.text2 }}>{(a.ms / 1000).toFixed(1)}s</span>
                </div>
                <div style={{ height:3, background:T.border, borderRadius:2, overflow:'hidden' }}>
                  <div style={{ height:'100%', width:`${pct}%`, background:T.text1, borderRadius:2, transition:'width 0.4s' }} />
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        <div style={{ display:'flex', gap:10, marginBottom:14 }}>
          {Array.from({ length: agentCount }).map((_, i) => (
            <div key={i} style={{ flex:1 }}>
              <div style={{ fontSize:10, color:T.text3, marginBottom:5 }}>Thread {i + 1}</div>
              <div style={{ height:3, background:T.border, borderRadius:2, overflow:'hidden' }}>
                <div style={{ height:'100%', background:T.text2, borderRadius:2, width:'60%' }} />
              </div>
            </div>
          ))}
        </div>
      )}

      <div style={{ display:'flex', gap:20 }}>
        <div>
          <div style={{ fontSize:9, color:T.text3, marginBottom:2, textTransform:'uppercase', letterSpacing:'.07em' }}>Engine</div>
          <div style={{ fontSize:11, fontFamily:T.mono, color:T.text2 }}>{model.split('/').pop()}</div>
        </div>
        <div>
          <div style={{ fontSize:9, color:T.text3, marginBottom:2, textTransform:'uppercase', letterSpacing:'.07em' }}>Threads</div>
          <div style={{ fontSize:11, fontFamily:T.mono, color:T.text1 }}>{agentCount} parallel</div>
        </div>
        <div>
          <div style={{ fontSize:9, color:T.text3, marginBottom:2, textTransform:'uppercase', letterSpacing:'.07em' }}>Status</div>
          <div style={{ fontSize:11, fontFamily:T.mono, color: totalMs ? T.green : T.text2 }}>
            {totalMs ? `Complete` : 'Running...'}
          </div>
        </div>
      </div>
    </div>
  )
}

function NvidiaJudgeHeader({ model, count }: { model: string; count: number }) {
  return (
    <div style={{
      display:'flex', alignItems:'center', gap:10, marginBottom:10,
      padding:'8px 12px',
      background:'rgba(118,185,0,0.05)', border:'1px solid rgba(118,185,0,0.15)',
      borderRadius:6,
    }}>
      <div style={{ width:20, height:20, borderRadius:4, background:'rgba(118,185,0,0.15)', border:'1px solid rgba(118,185,0,0.3)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
        <span style={{ fontSize:9, fontWeight:700, color:'#76B900', fontFamily:T.mono }}>N</span>
      </div>
      <div style={{ flex:1 }}>
        <span style={{ fontSize:11, fontWeight:600, color:'#76B900', letterSpacing:'.01em' }}>NVIDIA NIM · {model.split('/').pop()}</span>
        <span style={{ fontSize:10, color:T.text3, marginLeft:10 }}>Evaluating {count} submissions in parallel</span>
      </div>
      <span style={{ fontSize:10, fontFamily:T.mono, color:T.text3 }}>nemotron-super-120b · reasoning model</span>
    </div>
  )
}

function JudgeScoreCard({ agentName, score, breakdown, reasoning, isWinner }: {
  agentName:string; score:number; breakdown:Record<string, number>; reasoning?:string; isWinner?:boolean
}) {
  return (
    <div style={{
      flex:1, background: isWinner ? T.surface2 : T.bg,
      border:`1px solid ${isWinner ? T.borderHi : T.border}`,
      borderRadius:8, padding:'12px',
    }}>
      <div style={{ display:'flex', justifyContent:'space-between', marginBottom:10 }}>
        <span style={{ fontSize:12, fontWeight:600, color:T.text1 }}>{agentName}</span>
        <span style={{ fontSize:16, fontWeight:700, fontFamily:T.mono, color: score >= 75 ? T.text1 : T.text2 }}>
          {score.toFixed(1)}
        </span>
      </div>
      {Object.entries(breakdown).slice(0, 4).map(([k, v]) => (
        <div key={k} style={{ marginBottom:5 }}>
          <div style={{ display:'flex', justifyContent:'space-between', marginBottom:2 }}>
            <span style={{ fontSize:9, color:T.text3, maxWidth:100, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{k}</span>
            <span style={{ fontSize:9, fontFamily:T.mono, color:T.text2 }}>{typeof v === 'number' ? v.toFixed(0) : v}</span>
          </div>
          <div style={{ height:2, background:T.border, borderRadius:1 }}>
            <div style={{ height:'100%', width:`${typeof v === 'number' ? v : 0}%`, background: T.text2, borderRadius:1, transition:'width 0.5s' }} />
          </div>
        </div>
      ))}
      {reasoning && (
        <div style={{
          marginTop:8, paddingTop:8, borderTop:`1px solid ${T.border}`,
          fontSize:10, color:T.text3, lineHeight:1.55, fontStyle:'italic',
        }}>
          <span style={{ color:'#76B900', fontStyle:'normal', fontWeight:600, fontSize:9, fontFamily:T.mono, marginRight:5 }}>NIM:</span>
          {reasoning}
        </div>
      )}
    </div>
  )
}

function InfoBox({ label, value, color, mono, large }: {
  label:string; value:string; color?:string; mono?:boolean; large?:boolean
}) {
  return (
    <div>
      <div style={{ fontSize:9, color:T.text3, textTransform:'uppercase', letterSpacing:'.07em', marginBottom:3 }}>{label}</div>
      <div style={{
        fontSize: large ? 16 : 12, fontWeight: large ? 700 : 400,
        color: color ?? (large ? T.text1 : T.text2),
        fontFamily: mono ? T.mono : 'inherit',
      }}>{value}</div>
    </div>
  )
}

function StatusBadge({ color, children }: { color:string; children:React.ReactNode }) {
  return (
    <div style={{
      background:`${color}0D`, border:`1px solid ${color}20`,
      borderRadius:5, padding:'7px 10px',
      fontSize:11, color, marginTop:10,
    }}>{children}</div>
  )
}

function MiniStat({ label, value, highlight }: { label:string; value:string; highlight?:boolean }) {
  return (
    <div>
      <div style={{ fontSize:9, color:T.text3, marginBottom:2, textTransform:'uppercase', letterSpacing:'.05em' }}>{label}</div>
      <div style={{ fontSize:13, fontFamily:'var(--font-geist-mono)', color: highlight ? T.text1 : T.text2, fontWeight: highlight ? 600 : 400 }}>{value}</div>
    </div>
  )
}

function LiveDot() {
  return (
    <div style={{ display:'flex', alignItems:'center', gap:4, fontSize:10, color:T.text2 }}>
      <div style={{ width:5, height:5, borderRadius:'50%', background:T.green, animation:'pulse 1.5s infinite' }} />
      Live
    </div>
  )
}
