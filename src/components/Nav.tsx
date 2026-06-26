'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const C = {
  bg:    '#07070F',
  b1:    'rgba(100,100,200,0.07)',
  t1:    '#EEEEF8',
  t2:    '#7575A0',
  t3:    '#3A3A55',
  mint:  '#00DDA0',
  blue:  '#4F7AFF',
}

const links = [
  { href: '/attack',       label: 'Attack Sim' },
  { href: '/demo',         label: 'Live Demo'  },
  { href: '/arena',        label: 'Arena'      },
  { href: '/how-it-works', label: 'How it works'},
  { href: '/integrate',    label: 'Integrate'  },
  { href: '/ats-1',        label: 'ATS-1'      },
  { href: '/api/v1/trust', label: 'Trust API'  },
]

export function Nav({ connected }: { connected?: boolean }) {
  const path = usePathname()

  return (
    <nav style={{
      borderBottom: `1px solid ${C.b1}`,
      height: 52,
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '0 40px',
      position: 'sticky', top: 0, zIndex: 100,
      background: 'rgba(7,7,15,0.90)',
      backdropFilter: 'blur(24px)',
      WebkitBackdropFilter: 'blur(24px)',
    }}>
      {/* Logo + links */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 32 }}>
        <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 9, textDecoration: 'none', flexShrink: 0 }}>
          {/* Stvor monogram: layered square + inner cutout */}
          <div style={{ position: 'relative', width: 22, height: 22, flexShrink: 0 }}>
            <div style={{ position: 'absolute', inset: 0, borderRadius: 5, background: C.blue }} />
            <div style={{ position: 'absolute', top: 3, left: 3, right: 3, bottom: 3, borderRadius: 3, background: 'rgba(7,7,15,0.55)' }} />
            <span style={{
              position: 'absolute', top: '50%', left: '50%',
              transform: 'translate(-50%, -50%)',
              fontSize: 11, fontWeight: 800, color: '#fff',
              letterSpacing: '-0.02em', lineHeight: 1,
              fontFamily: "var(--font-space, 'Space Grotesk', sans-serif)",
            }}>S</span>
          </div>
          <span style={{
            fontWeight: 700, fontSize: 14,
            letterSpacing: '-0.04em', color: C.t1,
            fontFamily: "var(--font-space, 'Space Grotesk', sans-serif)",
          }}>Stvor</span>
        </Link>

        <div className="nav-links">
          {links.map(l => {
            const active = path === l.href || path.startsWith(l.href + '/')
            return (
              <Link key={l.href} href={l.href} style={{
                fontSize: 12, fontWeight: active ? 500 : 400,
                color: active ? C.t1 : C.t3,
                textDecoration: 'none',
                padding: '4px 10px', borderRadius: 5,
                background: active ? 'rgba(79,122,255,0.08)' : 'transparent',
                transition: 'color .12s, background .12s',
                whiteSpace: 'nowrap',
              }}>
                {l.label}
              </Link>
            )
          })}
        </div>
      </div>

      {/* Right: tech labels + live dot */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
        <div style={{ display: 'flex', gap: 4 }}>
          {['Nemotron-3', 'elizaOS'].map(t => (
            <span key={t} style={{
              fontSize: 10, color: C.t3,
              background: 'rgba(79,122,255,0.04)',
              border: '1px solid rgba(79,122,255,0.10)',
              borderRadius: 4, padding: '3px 8px',
              fontFamily: "var(--font-geist-mono, monospace)",
            }}>
              {t}
            </span>
          ))}
        </div>

        {connected !== undefined && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 6,
            paddingLeft: 16, borderLeft: `1px solid ${C.b1}`,
          }}>
            <div style={{
              width: 5, height: 5, borderRadius: '50%',
              background: connected ? C.mint : C.t3,
              animation: connected ? 'mintPulse 2s infinite' : 'none',
            }} />
            <span style={{
              fontSize: 10, color: connected ? C.mint : C.t3,
              letterSpacing: '.06em', textTransform: 'uppercase',
              fontFamily: "var(--font-geist-mono, monospace)",
            }}>
              {connected ? 'live' : 'connecting'}
            </span>
          </div>
        )}
      </div>
    </nav>
  )
}
