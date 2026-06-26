'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const C = {
  bg:     '#04040A',
  border: 'rgba(255,255,255,0.07)',
  text1:  '#F0F4FF',
  text2:  '#8892B0',
  text3:  '#4A5568',
  green:  '#00FF9D',
  blue:   '#00C8FF',
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
            width: 24, height: 24, borderRadius: 6,
            background: 'linear-gradient(135deg, #00C8FF, #8B5CF6)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 10, fontWeight: 900, color: '#fff', letterSpacing: '-0.02em',
            boxShadow: '0 0 12px rgba(0,200,255,0.4)',
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
