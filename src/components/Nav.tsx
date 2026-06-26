'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const C = {
  bg:     '#0A0A0F',
  border: '#1C1C28',
  text1:  '#F1F5F9',
  text2:  '#94A3B8',
  text3:  '#475569',
  green:  '#22C55E',
}

const links = [
  { href: '/attack',        label: 'Attack Sim' },
  { href: '/demo',          label: 'Live Demo' },
  { href: '/arena',         label: 'Arena' },
  { href: '/how-it-works',  label: 'How It Works' },
  { href: '/integrate',     label: 'Integrate' },
  { href: '/api/v1/trust',  label: 'Trust API' },
]

export function Nav({ connected }: { connected?: boolean }) {
  const path = usePathname()

  return (
    <nav style={{
      borderBottom: `1px solid ${C.border}`,
      padding: '0 40px',
      height: 52,
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      position: 'sticky', top: 0, zIndex: 50,
      background: 'rgba(10,10,15,.95)',
      backdropFilter: 'blur(12px)',
    }}>
      {/* Logo */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 28 }}>
        <Link href="/" style={{ display:'flex', alignItems:'center', gap:10, textDecoration:'none' }}>
          <div style={{
            width: 24, height: 24, borderRadius: 5,
            background: C.text1,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 10, fontWeight: 900, color: C.bg, letterSpacing: '-0.02em',
          }}>S</div>
          <span style={{ fontWeight: 700, fontSize: 14, letterSpacing: '-0.03em', color: C.text1 }}>Stvor</span>
        </Link>

        <div className="nav-links">
          {links.map(l => {
            const active = path === l.href || path.startsWith(l.href + '/')
            return (
              <Link key={l.href} href={l.href} style={{
                fontSize: 12, fontWeight: active ? 600 : 400,
                color: active ? C.text1 : C.text3,
                textDecoration: 'none',
                padding: '5px 10px',
                borderRadius: 5,
                background: active ? 'rgba(255,255,255,.06)' : 'transparent',
                transition: 'all .12s',
              }}>
                {l.label}
              </Link>
            )
          })}
        </div>
      </div>

      {/* Right side */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
        <span style={{ fontSize: 11, color: C.text3 }}>Nemotron-3 Ultra</span>
        <span style={{ fontSize: 11, color: C.text3 }}>elizaOS</span>
        {connected !== undefined && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, paddingLeft: 16, borderLeft: `1px solid ${C.border}` }}>
            <div style={{
              width: 5, height: 5, borderRadius: '50%',
              background: connected ? C.green : C.text3,
              animation: connected ? 'pulse 2s infinite' : 'none',
            }} />
            <span style={{ fontSize: 11, color: C.text3 }}>{connected ? 'Live' : 'Connecting'}</span>
          </div>
        )}
      </div>
    </nav>
  )
}
