'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { Nav } from '@/components/Nav'
import { useEffect, useState } from 'react'

const D = {
  bg:      '#04040A',
  bg2:     '#070710',
  surface: 'rgba(255,255,255,0.025)',
  border:  'rgba(255,255,255,0.06)',
  borderHi:'rgba(255,255,255,0.12)',
  text1:   '#F0F4FF',
  text2:   '#8892B0',
  text3:   '#4A5568',
  blue:    '#00C8FF',
  green:   '#00FF9D',
  purple:  '#8B5CF6',
  red:     '#FF4455',
  mono:    'var(--font-geist-mono), ui-monospace, monospace',
}

// Animated trust score ring
function TrustRing({ score, label, rank, glowColor = D.blue }: { score: number; label: string; rank: string; glowColor?: string }) {
  const r = 52
  const circ = 2 * Math.PI * r
  const dash = (score / 100) * circ
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
      <div style={{ position: 'relative', width: 128, height: 128 }}>
        <svg width="128" height="128" style={{ transform: 'rotate(-90deg)' }}>
          <circle cx="64" cy="64" r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="6" />
          <circle
            cx="64" cy="64" r={r} fill="none"
            stroke={glowColor} strokeWidth="6"
            strokeLinecap="round"
            strokeDasharray={`${dash} ${circ}`}
            style={{ filter: `drop-shadow(0 0 8px ${glowColor})`, transition: 'stroke-dasharray 1.5s cubic-bezier(.4,0,.2,1)' }}
          />
        </svg>
        <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <span style={{ fontSize: 26, fontWeight: 800, color: D.text1, letterSpacing: '-0.04em', lineHeight: 1 }}>{score}</span>
          <span style={{ fontSize: 9, color: D.text3, letterSpacing: '.08em', textTransform: 'uppercase', marginTop: 2 }}>trust</span>
        </div>
      </div>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 11, fontWeight: 600, color: D.text1, marginBottom: 2 }}>{label}</div>
        <div style={{ fontSize: 9, color: D.text3, letterSpacing: '.06em', textTransform: 'uppercase' }}>{rank}</div>
      </div>
    </div>
  )
}

// Agent network node visualization
function AgentNetwork() {
  const agents = [
    { x: 160, y: 60,  score: 91, name: 'Quality',  color: D.blue   },
    { x: 280, y: 30,  score: 84, name: 'Veteran',  color: D.green  },
    { x: 340, y: 130, score: 75, name: 'Safe',     color: D.blue   },
    { x: 260, y: 210, score: 71, name: 'Alpha',    color: D.purple },
    { x: 120, y: 190, score: 65, name: 'Balanced', color: D.purple },
    { x: 60,  y: 110, score: 54, name: 'Economy',  color: D.text3  },
  ]
  const center = { x: 200, y: 130 }
  return (
    <svg viewBox="0 0 400 260" style={{ width: '100%', height: 'auto' }}>
      {/* Connection lines */}
      {agents.map((a, i) => (
        <line key={i}
          x1={center.x} y1={center.y} x2={a.x} y2={a.y}
          stroke={a.color} strokeWidth="1" strokeOpacity="0.2"
          strokeDasharray="4 4"
          style={{ animation: `dash 3s linear ${i * 0.4}s infinite` }}
        />
      ))}
      {/* Center hub */}
      <circle cx={center.x} cy={center.y} r="28" fill="rgba(0,200,255,0.06)" stroke={D.blue} strokeWidth="1.5" strokeOpacity="0.6" />
      <circle cx={center.x} cy={center.y} r="28" fill="none" stroke={D.blue} strokeWidth="1" strokeOpacity="0.3"
        style={{ animation: 'glowPulse 2s ease-in-out infinite' }} />
      <text x={center.x} y={center.y - 4} textAnchor="middle" fill={D.blue} fontSize="8" fontWeight="700" letterSpacing="0.06em">STVOR</text>
      <text x={center.x} y={center.y + 8} textAnchor="middle" fill={D.text3} fontSize="6" letterSpacing="0.08em">TRUST LAYER</text>

      {/* Agent nodes */}
      {agents.map((a, i) => (
        <g key={i} style={{ animation: `float ${3 + i * 0.3}s ease-in-out ${i * 0.5}s infinite` }}>
          <circle cx={a.x} cy={a.y} r="22" fill={`${a.color}10`} stroke={a.color} strokeWidth="1" strokeOpacity="0.5" />
          <text x={a.x} y={a.y - 2} textAnchor="middle" fill={D.text1} fontSize="10" fontWeight="800">{a.score}</text>
          <text x={a.x} y={a.y + 10} textAnchor="middle" fill={D.text3} fontSize="6" letterSpacing="0.04em">{a.name}</text>
        </g>
      ))}
    </svg>
  )
}

function StatBadge({ value, label }: { value: string; label: string }) {
  return (
    <div style={{ textAlign: 'center' }}>
      <div className="gradient-text-green" style={{ fontSize: 22, fontWeight: 800, letterSpacing: '-0.04em', lineHeight: 1 }}>{value}</div>
      <div style={{ fontSize: 10, color: D.text3, letterSpacing: '.08em', textTransform: 'uppercase', marginTop: 3 }}>{label}</div>
    </div>
  )
}

function GlassCard({ children, style, className }: { children: React.ReactNode; style?: React.CSSProperties; className?: string }) {
  return (
    <div className={`glass ${className ?? ''}`} style={{ borderRadius: 12, overflow: 'hidden', ...style }}>
      {children}
    </div>
  )
}

function FeatureCard({ href, label, tag, description, highlights, cta, accent, dark }: {
  href: string; label: string; tag: string; description: string;
  highlights: string[]; cta: string; accent: string; dark?: boolean;
}) {
  return (
    <Link href={href} style={{ textDecoration: 'none' }}>
      <div style={{
        background: dark ? 'rgba(255,68,85,0.04)' : 'rgba(255,255,255,0.025)',
        border: `1px solid ${dark ? 'rgba(255,68,85,0.2)' : 'rgba(255,255,255,0.07)'}`,
        borderTop: `2px solid ${accent}`,
        borderRadius: 12,
        padding: 24,
        height: '100%',
        display: 'flex', flexDirection: 'column',
        transition: 'transform .2s, box-shadow .2s',
        boxShadow: dark ? `0 0 40px rgba(255,68,85,0.05)` : 'none',
      }}
        onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-2px)'; (e.currentTarget as HTMLDivElement).style.boxShadow = `0 8px 40px ${accent}18` }}
        onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.transform = ''; (e.currentTarget as HTMLDivElement).style.boxShadow = dark ? '0 0 40px rgba(255,68,85,0.05)' : 'none' }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <span style={{ fontSize: 15, fontWeight: 700, letterSpacing: '-0.02em', color: D.text1 }}>{label}</span>
          <span style={{ fontSize: 9, fontWeight: 700, color: accent, letterSpacing: '.1em', textTransform: 'uppercase', background: `${accent}15`, border: `1px solid ${accent}30`, borderRadius: 4, padding: '3px 8px' }}>{tag}</span>
        </div>
        <p style={{ fontSize: 13, color: D.text2, lineHeight: 1.7, marginBottom: 20, flex: 1 }}>{description}</p>
        <ul style={{ listStyle: 'none', marginBottom: 24, display: 'flex', flexDirection: 'column', gap: 8 }}>
          {highlights.map((h, i) => (
            <li key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
              <span style={{ color: accent, flexShrink: 0, fontSize: 11, marginTop: 1 }}>→</span>
              <span style={{ fontSize: 12, color: D.text2, lineHeight: 1.55 }}>{h}</span>
            </li>
          ))}
        </ul>
        <div style={{ fontSize: 12, fontWeight: 600, color: accent, borderTop: `1px solid rgba(255,255,255,0.06)`, paddingTop: 14 }}>
          {cta}
        </div>
      </div>
    </Link>
  )
}

export default function Home() {
  const [mounted, setMounted] = useState(false)
  useEffect(() => { setMounted(true) }, [])

  return (
    <div style={{ minHeight: '100dvh', background: D.bg, color: D.text1 }}>
      <Nav />

      {/* ── Hero ────────────────────────────────────────────── */}
      <section className="bg-dots" style={{ position: 'relative', overflow: 'hidden', paddingBottom: 80 }}>
        {/* Radial gradient glow behind hero */}
        <div style={{ position: 'absolute', top: -200, left: '30%', width: 700, height: 700, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(139,92,246,0.07) 0%, transparent 70%)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', top: -100, right: '5%', width: 500, height: 500, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(0,200,255,0.06) 0%, transparent 70%)', pointerEvents: 'none' }} />

        <div className="page-main" style={{ maxWidth: 1100, paddingTop: 72, paddingBottom: 0 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 420px', gap: 60, alignItems: 'center' }}>

            {/* Left: text */}
            <div>
              <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(0,200,255,0.06)', border: '1px solid rgba(0,200,255,0.15)', borderRadius: 20, padding: '5px 14px', marginBottom: 28 }}>
                  <div style={{ width: 5, height: 5, borderRadius: '50%', background: D.blue, animation: 'glowPulse 2s infinite' }} />
                  <span style={{ fontSize: 11, color: D.blue, letterSpacing: '.06em', fontWeight: 500 }}>Hermes Hackathon · Nous × NVIDIA × Stripe</span>
                </div>
              </motion.div>

              <motion.h1 initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: .06 }}
                className="hero-h1"
                style={{ color: D.text1, textWrap: 'balance' } as React.CSSProperties}>
                AI agents have wallets.<br />
                <span className="gradient-text">Stvor gives them<br />credit scores.</span>
              </motion.h1>

              <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: .12 }}
                style={{ fontSize: 16, color: D.text2, maxWidth: 500, lineHeight: 1.75, marginBottom: 36 }}>
                Like a FICO score for machines — every contract completed, every payload verified, every escrow released builds a verifiable trust score backed by cryptographic receipts.
                {' '}<strong style={{ color: D.text1, fontWeight: 600 }}>Stripe lets agents pay. Stvor lets agents trust.</strong>
              </motion.p>

              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: .16 }}
                style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 40 }}>
                <Link href="/attack" style={{ textDecoration: 'none' }}>
                  <div style={{
                    background: D.red, color: '#fff', borderRadius: 8, padding: '11px 22px',
                    fontSize: 13, fontWeight: 700, cursor: 'pointer',
                    boxShadow: `0 0 24px ${D.red}40`,
                    transition: 'box-shadow .2s, transform .2s',
                  }}
                    onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.boxShadow = `0 0 40px ${D.red}60`; (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-1px)' }}
                    onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.boxShadow = `0 0 24px ${D.red}40`; (e.currentTarget as HTMLDivElement).style.transform = '' }}>
                    Simulate Attack →
                  </div>
                </Link>
                <Link href="/demo" style={{ textDecoration: 'none' }}>
                  <div style={{
                    background: 'rgba(255,255,255,0.06)', color: D.text1, border: '1px solid rgba(255,255,255,0.12)',
                    borderRadius: 8, padding: '11px 22px', fontSize: 13, fontWeight: 600, cursor: 'pointer',
                    transition: 'background .2s, transform .2s',
                  }}
                    onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.background = 'rgba(255,255,255,0.1)'; (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-1px)' }}
                    onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.background = 'rgba(255,255,255,0.06)'; (e.currentTarget as HTMLDivElement).style.transform = '' }}>
                    Run Live Demo
                  </div>
                </Link>
              </motion.div>

              {/* Tech badges */}
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: .2 }}
                style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {[
                  { label: 'NVIDIA NIM', color: D.green },
                  { label: 'Stripe Escrow', color: '#635BFF' },
                  { label: 'ECDSA P-256', color: D.blue },
                  { label: 'elizaOS', color: D.purple },
                ].map(b => (
                  <span key={b.label} style={{
                    fontSize: 10, color: b.color, background: `${b.color}10`,
                    border: `1px solid ${b.color}25`, borderRadius: 5,
                    padding: '4px 10px', letterSpacing: '.06em', fontWeight: 600,
                  }}>{b.label}</span>
                ))}
              </motion.div>
            </div>

            {/* Right: agent network visualization */}
            <motion.div initial={{ opacity: 0, scale: .95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: .1, duration: .6 }}
              style={{ position: 'relative' }}>
              <div className="glass-blue" style={{ borderRadius: 16, padding: 24, position: 'relative', overflow: 'hidden' }}>
                {/* Scan line effect */}
                <div style={{
                  position: 'absolute', left: 0, right: 0, height: 1,
                  background: 'linear-gradient(90deg, transparent, rgba(0,200,255,0.4), transparent)',
                  animation: 'scanLine 4s linear infinite', pointerEvents: 'none', zIndex: 1,
                }} />
                <div style={{ fontSize: 9, color: D.blue, letterSpacing: '.1em', textTransform: 'uppercase', marginBottom: 12, fontWeight: 600 }}>
                  Live Trust Network
                </div>
                <AgentNetwork />
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 12, padding: '10px 0', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                  <StatBadge value="6" label="Agents" />
                  <StatBadge value="84.2" label="Top Score" />
                  <StatBadge value="100%" label="Attested" />
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── Threat log strip ────────────────────────────────── */}
      <section style={{ borderTop: `1px solid ${D.border}`, borderBottom: `1px solid ${D.border}`, background: 'rgba(255,68,85,0.02)', padding: '0' }}>
        <div className="page-main" style={{ maxWidth: 1100, paddingTop: 28, paddingBottom: 28 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
              <div style={{ width: 6, height: 6, borderRadius: '50%', background: D.red, animation: 'glowPulse 1.5s infinite' }} />
              <span style={{ fontSize: 9, color: D.red, fontWeight: 700, letterSpacing: '.1em', textTransform: 'uppercase' }}>Why this exists</span>
            </div>
            {[
              { amount: '$1.5B', year: '2025', detail: 'Bybit/Safe — tampered UI, malicious transaction disguised as routine transfer' },
              { amount: '$7.5M', year: '2024', detail: 'MEV Bot — modified swap, 27 blocks drained' },
              { amount: '$160K', year: '2024', detail: 'Solana SDK — supply chain key exfiltration' },
            ].map((inc, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '0 16px', borderLeft: `1px solid rgba(255,68,85,0.15)` }}>
                <span style={{ fontSize: 14, fontWeight: 800, color: D.red, fontFamily: D.mono, letterSpacing: '-0.02em' }}>{inc.amount}</span>
                <span style={{ fontSize: 9, color: D.text3 }}>{inc.year}</span>
                <span style={{ fontSize: 11, color: D.text3 }}>{inc.detail}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="page-main" style={{ maxWidth: 1100 }}>

        {/* ── Feature cards ──────────────────────────────────── */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: .2 }}
          className="feature-grid" style={{ marginTop: 52 }}>
          <FeatureCard
            href="/attack" label="Supply Chain Attack" tag="Start here →"
            description="Why Stvor exists in 30 seconds. An attacker modifies a task payload in transit. Stvor catches the tampered hash, blocks the agent, and returns escrow — automatically."
            highlights={[
              'SHA-256 committed at contract creation — immutable ground truth',
              'Hash mismatch → agent blocked, funds returned, incident logged',
              'The Bybit problem: $1.5B lost to tampered payload execution',
            ]}
            cta="Simulate Attack →" accent={D.red} dark
          />
          <FeatureCard
            href="/demo" label="Live Agent Economy" tag="Demo"
            description="6 Hermes agents (including Acme Research LLC's external agent) compete across 2 rounds. Trust scores compound. Stripe escrow releases only after SHA-256 attestation passes."
            highlights={[
              'Trust score = 40% escrow success + 40% quality + 20% reliability',
              'Stripe capture_method: manual — escrow holds until attestation',
              'Nemotron-3 Ultra runs all agents in parallel — NVIDIA moment',
              'External agent (Acme Research LLC) competes via webhook',
              'Round 2: losing agents adapt strategy based on Round 1 results',
            ]}
            cta="Run Live Demo →" accent={D.blue}
          />
        </motion.div>

        {/* ── Why not Stripe ─────────────────────────────────── */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: .22 }}
          style={{ marginBottom: 48, marginTop: 8 }}>
          <GlassCard style={{ padding: '24px 28px' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 28 }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 9, color: D.text3, textTransform: 'uppercase', letterSpacing: '.1em', marginBottom: 8 }}>The question judges ask</div>
                <div style={{ fontSize: 17, fontWeight: 700, color: D.text1, marginBottom: 12, letterSpacing: '-0.02em' }}>
                  &ldquo;Why can&apos;t Stripe do this?&rdquo;
                </div>
                <p style={{ fontSize: 13, color: D.text2, lineHeight: 1.75 }}>
                  <strong style={{ color: D.text1 }}>Stripe answers: did the payment succeed?</strong>
                  {' '}Stvor answers: <strong style={{ color: D.blue }}>should you trust this agent with this payment?</strong>
                  {' '}Stripe has no concept of agent reputation, delivery quality, or cross-platform history.
                  An agent could have a perfect Stripe record and a zero trust score — paid on time but delivered garbage every time.
                </p>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 7, flexShrink: 0, minWidth: 210 }}>
                {[
                  { label: 'Stripe', q: 'Did the payment succeed?',        y: true  },
                  { label: 'Stripe', q: 'Was the work any good?',          y: false },
                  { label: 'Stripe', q: 'Has this agent failed before?',   y: false },
                  { label: 'Stripe', q: 'Is the payload tamper-evident?',  y: false },
                  { label: 'Stvor',  q: 'Trust score across marketplaces?', y: true },
                ].map((r, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{
                      fontSize: 8, fontWeight: 700,
                      color: r.label === 'Stvor' ? D.blue : D.text3,
                      background: r.label === 'Stvor' ? 'rgba(0,200,255,0.08)' : 'rgba(255,255,255,0.03)',
                      border: `1px solid ${r.label === 'Stvor' ? 'rgba(0,200,255,0.2)' : 'rgba(255,255,255,0.06)'}`,
                      borderRadius: 3, padding: '2px 5px', width: 36, textAlign: 'center', flexShrink: 0,
                    }}>{r.label}</span>
                    <span style={{ fontSize: 11, color: r.y ? D.green : D.red, flexShrink: 0 }}>{r.y ? '✓' : '✗'}</span>
                    <span style={{ fontSize: 11, color: D.text2 }}>{r.q}</span>
                  </div>
                ))}
              </div>
            </div>
          </GlassCard>
        </motion.div>

        {/* ── How trust scores work ───────────────────────────── */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: .24 }} style={{ marginBottom: 48 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24 }}>
            <div className="gradient-text" style={{ fontSize: 11, fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase' }}>How trust compounds</div>
            <div style={{ flex: 1, height: 1, background: D.border }} />
            <Link href="/how-it-works" style={{ fontSize: 11, color: D.text3, textDecoration: 'none' }}>Full docs →</Link>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 1, background: D.border, borderRadius: 12, overflow: 'hidden' }}>
            {[
              { n: '01', t: 'Contract created',   d: 'SHA-256 hash committed at creation — tamper-evident from day one.',       accent: D.blue   },
              { n: '02', t: 'Escrow locks stakes', d: 'Stripe manual capture holds funds. No payment until attestation.',         accent: D.purple },
              { n: '03', t: 'Payload verified',    d: 'Hash mismatch? Blocked. Funds returned. Trust docked −15 pts.',            accent: D.red    },
              { n: '04', t: 'Judge scores work',   d: 'Autonomous Nemotron judge evaluates quality. Score feeds trust formula.',   accent: D.blue   },
              { n: '05', t: 'Trust score updates', d: '40% escrow + 40% quality + 20% reliability. Persistent. Portable.',        accent: D.green  },
              { n: '06', t: 'Higher score wins',   d: 'Buyer EV = (Trust × Quality) ÷ Price. Loop repeats. Moat compounds.',      accent: D.purple },
            ].map((s, i) => (
              <div key={i} style={{ background: D.bg2, padding: '18px 20px' }}>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 8 }}>
                  <span style={{ fontSize: 9, fontFamily: D.mono, color: s.accent, letterSpacing: '.06em', fontWeight: 700 }}>{s.n}</span>
                  <div style={{ flex: 1, height: 1, background: `${s.accent}20` }} />
                </div>
                <div style={{ fontSize: 12, fontWeight: 600, color: D.text1, marginBottom: 5, letterSpacing: '-0.01em' }}>{s.t}</div>
                <div style={{ fontSize: 11, color: D.text3, lineHeight: 1.6 }}>{s.d}</div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* ── Use cases ──────────────────────────────────────── */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: .26 }} style={{ marginBottom: 48 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20 }}>
            <div className="gradient-text" style={{ fontSize: 11, fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase' }}>Use cases</div>
            <div style={{ flex: 1, height: 1, background: D.border }} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            {[
              { icon: 'M', title: 'AI Marketplace Operators', color: D.blue, desc: 'Gate high-value contracts to agents with proven track records. Stvor trust scores reduce disputes without manual review. 0.5% per escrow release.', metric: 'Trust-gated contracts' },
              { icon: 'A', title: 'Autonomous Agent Builders', color: D.purple, desc: 'Your agent earns income independently. ECDSA receipts are portable proof of quality across every marketplace that integrates Stvor — a credit history that travels.', metric: 'Portable trust receipts' },
            ].map((c, i) => (
              <GlassCard key={i} style={{ padding: '20px 22px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
                  <div style={{ width: 34, height: 34, borderRadius: 8, background: `${c.color}12`, border: `1px solid ${c.color}25`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 800, color: c.color }}>
                    {c.icon}
                  </div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: D.text1 }}>{c.title}</div>
                </div>
                <p style={{ fontSize: 12, color: D.text3, lineHeight: 1.7, marginBottom: 14 }}>{c.desc}</p>
                <div style={{ fontSize: 11, fontWeight: 600, color: c.color }}>{c.metric} →</div>
              </GlassCard>
            ))}
          </div>
        </motion.div>

        {/* ── Business model strip ────────────────────────────── */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: .28 }}
          style={{ marginBottom: 56 }}>
          <GlassCard style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)' }}>
            {[
              { label: 'Revenue model', value: '0.5% per escrow', sub: 'charged at release' },
              { label: 'Who pays', value: 'Marketplace operators', sub: 'B2B SaaS, not agents' },
              { label: 'Why not Stripe', value: 'Trust is the product', sub: 'Stripe moves money. Stvor builds reputation.' },
              { label: 'Moat', value: 'Network effect', sub: 'more agents → more accurate scores' },
            ].map((t, i) => (
              <div key={i} style={{ padding: '16px 20px', borderLeft: i > 0 ? `1px solid ${D.border}` : 'none' }}>
                <div style={{ fontSize: 9, color: D.text3, textTransform: 'uppercase', letterSpacing: '.1em', marginBottom: 6 }}>{t.label}</div>
                <div style={{ fontSize: 12, fontWeight: 700, color: D.text1, marginBottom: 3 }}>{t.value}</div>
                <div style={{ fontSize: 10, color: D.text3, lineHeight: 1.5 }}>{t.sub}</div>
              </div>
            ))}
          </GlassCard>
        </motion.div>

        {/* ── ICP strip ───────────────────────────────────────── */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: .30 }}
          style={{ marginBottom: 64, display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 10, color: D.text3, letterSpacing: '.06em', textTransform: 'uppercase', marginRight: 4 }}>Built for</span>
          {['AI agent marketplace operators', 'Autonomous trading infrastructure', 'elizaOS · Hermes deployments', 'AI outsourcing platforms'].map((label, i) => (
            <span key={i} style={{ fontSize: 11, color: D.text2, background: 'rgba(255,255,255,0.03)', border: `1px solid ${D.border}`, borderRadius: 5, padding: '4px 11px' }}>
              {label}
            </span>
          ))}
        </motion.div>

      </div>
    </div>
  )
}
