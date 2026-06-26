'use client'
import { useEffect, useRef, useCallback } from 'react'

type Node = {
  x: number; y: number
  label: string; trust: number
  radius: number; phase: number; phaseSpd: number
}
type Packet = {
  from: number; to: number
  t: number; spd: number
  color: string; size: number; isAttack: boolean
}

const C_BLUE = '#4F7AFF'
const C_MINT = '#00DDA0'
const C_RED  = '#FF4555'

const AGENT_DATA = [
  { label: 'Quality',  trust: 91, pos: [0.14, 0.24] },
  { label: 'Veteran',  trust: 84, pos: [0.76, 0.19] },
  { label: 'Safe',     trust: 75, pos: [0.44, 0.52] },
  { label: 'Alpha',    trust: 71, pos: [0.84, 0.56] },
  { label: 'Meridian', trust: 68, pos: [0.20, 0.74] },
  { label: 'Economy',  trust: 54, pos: [0.63, 0.80] },
]

export function NetworkCanvas({ style, opacity = 0.4 }: { style?: React.CSSProperties; opacity?: number }) {
  const ref        = useRef<HTMLCanvasElement>(null)
  const nodes      = useRef<Node[]>([])
  const packets    = useRef<Packet[]>([])
  const frame      = useRef(0)
  const lastSpawn  = useRef(0)

  const mkNodes = useCallback((w: number, h: number) => {
    nodes.current = AGENT_DATA.map(d => ({
      x: d.pos[0] * w, y: d.pos[1] * h,
      label: d.label, trust: d.trust,
      radius: 3.5 + (d.trust / 100) * 4,
      phase: Math.random() * Math.PI * 2,
      phaseSpd: 0.006 + Math.random() * 0.005,
    }))
  }, [])

  useEffect(() => {
    const canvas = ref.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')!
    const dpr = window.devicePixelRatio || 1

    const resize = () => {
      const w = canvas.offsetWidth, h = canvas.offsetHeight
      canvas.width  = w * dpr
      canvas.height = h * dpr
      ctx.scale(dpr, dpr)
      mkNodes(w, h)
    }
    resize()
    const ro = new ResizeObserver(resize)
    ro.observe(canvas)

    let prev = 0
    const draw = (now: number) => {
      frame.current = requestAnimationFrame(draw)
      if (now - prev < 16) return
      prev = now

      const w = canvas.offsetWidth, h = canvas.offsetHeight
      ctx.clearRect(0, 0, w, h)
      const ns = nodes.current

      // Connection lines
      for (let i = 0; i < ns.length; i++) {
        for (let j = i + 1; j < ns.length; j++) {
          const dx = ns[j].x - ns[i].x, dy = ns[j].y - ns[i].y
          const dist = Math.sqrt(dx * dx + dy * dy)
          if (dist > w * 0.62) continue
          const a = Math.max(0, 0.13 - (dist / (w * 0.62)) * 0.13)
          ctx.beginPath()
          ctx.moveTo(ns[i].x, ns[i].y)
          ctx.lineTo(ns[j].x, ns[j].y)
          ctx.strokeStyle = `rgba(79,122,255,${a})`
          ctx.lineWidth = 0.5
          ctx.stroke()
        }
      }

      // Nodes
      for (const n of ns) {
        n.phase += n.phaseSpd
        const pulse = 0.85 + Math.sin(n.phase) * 0.15
        const r = n.radius * pulse
        // Outer glow
        const grd = ctx.createRadialGradient(n.x, n.y, 0, n.x, n.y, r * 7)
        grd.addColorStop(0, 'rgba(79,122,255,0.14)')
        grd.addColorStop(0.4, 'rgba(79,122,255,0.04)')
        grd.addColorStop(1, 'transparent')
        ctx.beginPath()
        ctx.arc(n.x, n.y, r * 7, 0, Math.PI * 2)
        ctx.fillStyle = grd
        ctx.fill()
        // Ring
        ctx.beginPath()
        ctx.arc(n.x, n.y, r + 2.5, 0, Math.PI * 2)
        ctx.strokeStyle = `rgba(79,122,255,${0.22 + Math.sin(n.phase) * 0.08})`
        ctx.lineWidth = 0.8
        ctx.stroke()
        // Core
        ctx.beginPath()
        ctx.arc(n.x, n.y, r, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(79,122,255,${0.72 + Math.sin(n.phase) * 0.12})`
        ctx.fill()
        // Label
        ctx.font = '500 9px ui-monospace, monospace'
        ctx.fillStyle = 'rgba(238,238,248,0.28)'
        ctx.textAlign = 'center'
        ctx.fillText(n.label, n.x, n.y + r + 14)
      }

      // Spawn packet
      if (now - lastSpawn.current > 480 && packets.current.length < 10) {
        const n = ns.length
        if (n >= 2) {
          const from = Math.floor(Math.random() * n)
          let to = Math.floor(Math.random() * n)
          while (to === from) to = Math.floor(Math.random() * n)
          const isAttack = Math.random() < 0.12
          packets.current.push({
            from, to, t: 0, isAttack,
            spd: 0.003 + Math.random() * 0.003,
            color: isAttack ? C_RED : (Math.random() > 0.3 ? C_BLUE : C_MINT),
            size: 2.5 + Math.random() * 2,
          })
          lastSpawn.current = now
        }
      }

      // Draw packets
      packets.current = packets.current.filter(p => p.t <= 1)
      for (const pk of packets.current) {
        pk.t += pk.spd
        const n0 = ns[pk.from], n1 = ns[pk.to]
        if (!n0 || !n1) continue
        const x  = n0.x + (n1.x - n0.x) * pk.t
        const y  = n0.y + (n1.y - n0.y) * pk.t
        const tx = n0.x + (n1.x - n0.x) * Math.max(0, pk.t - 0.09)
        const ty = n0.y + (n1.y - n0.y) * Math.max(0, pk.t - 0.09)
        // Trail
        const g = ctx.createLinearGradient(tx, ty, x, y)
        g.addColorStop(0, 'transparent')
        g.addColorStop(1, pk.color + 'BB')
        ctx.beginPath()
        ctx.moveTo(tx, ty)
        ctx.lineTo(x, y)
        ctx.strokeStyle = g
        ctx.lineWidth = pk.isAttack ? 2 : 1.5
        ctx.stroke()
        // Head dot
        ctx.beginPath()
        ctx.arc(x, y, pk.size, 0, Math.PI * 2)
        ctx.fillStyle = pk.color
        ctx.fill()
        // Attack: add red X mark at destination when near
        if (pk.isAttack && pk.t > 0.85) {
          const alpha = (pk.t - 0.85) / 0.15
          ctx.strokeStyle = `rgba(255,69,85,${alpha * 0.6})`
          ctx.lineWidth = 1.5
          const s = 6
          ctx.beginPath()
          ctx.moveTo(n1.x - s, n1.y - s); ctx.lineTo(n1.x + s, n1.y + s)
          ctx.moveTo(n1.x + s, n1.y - s); ctx.lineTo(n1.x - s, n1.y + s)
          ctx.stroke()
        }
      }
    }

    frame.current = requestAnimationFrame(draw)
    return () => { cancelAnimationFrame(frame.current); ro.disconnect() }
  }, [mkNodes])

  return (
    <canvas
      ref={ref}
      style={{ display: 'block', width: '100%', height: '100%', opacity, ...style }}
    />
  )
}
