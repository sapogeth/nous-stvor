'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const C = {
  bg:     '#09090B',
  border: 'rgba(255,255,255,0.07)',
  text1:  '#FAFAFA',
  text2:  '#A1A1AA',
  text3:  '#52525B',
  green:  '#22C55E',
  accent: '#3B72FF',
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
      background: 'rgba(4,4,10,0.85)',
      backdropFilter: 'blur(20px)',
      WebkitBackdropFilter: 'blur(20px)',
    }}>
      {/* Logo */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 28 }}>
        <Link href="/" style={{ display:'flex', alignItems:'center', gap:10, textDecoration:'none' }}>
          <div style={{
            width: 22, height: 22, borderRadius: 5,
            background: C.accent,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 11, fontWeight: 800, color: '#fff', letterSpacing: '-0.02em',
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
