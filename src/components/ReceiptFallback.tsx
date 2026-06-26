'use client'

import { useEffect } from 'react'
import Link from 'next/link'

export function ReceiptFallback({ id }: { id: string }) {
  useEffect(() => {
    // Check sessionStorage for receipt data saved by the demo page
    try {
      const stored = sessionStorage.getItem(`stvor:receipt:${id}`)
      if (stored) {
        const receipt = JSON.parse(stored)
        if (receipt?.id) {
          // Redirect to self with ?d= so the server component can render the full receipt
          const encoded = encodeURIComponent(btoa(JSON.stringify(receipt)))
          window.location.replace(`/receipts/${id}?d=${encoded}`)
        }
      }
    } catch {}
  }, [id])

  return (
    <div style={{
      minHeight: '100dvh', background: '#07070F', color: '#EEEEF8',
      fontFamily: 'system-ui, sans-serif',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <div style={{ maxWidth: 520, padding: '0 32px', textAlign: 'center' }}>
        <div style={{ fontSize: 40, marginBottom: 20, opacity: 0.25 }}>◌</div>
        <h1 style={{
          fontSize: 20, fontWeight: 700, letterSpacing: '-0.03em',
          marginBottom: 10, color: '#EEEEF8',
        }}>
          Receipt link expired
        </h1>
        <p style={{ fontSize: 13, color: '#7575A0', lineHeight: 1.75, marginBottom: 28 }}>
          This receipt link doesn't include its embedded data payload.
          Permanent receipt links from the demo encode all data directly in the URL
          and work anywhere, forever — no server required.
          <br /><br />
          Use the <strong style={{ color: '#EEEEF8' }}>View + verify ↗</strong> button
          from the demo page to get a permanent link, or run a fresh demo below.
        </p>

        <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link href="/demo" style={{
            fontSize: 13, fontWeight: 600, color: '#fff',
            background: '#4F7AFF', borderRadius: 7, padding: '10px 22px',
            textDecoration: 'none',
          }}>
            Run Demo →
          </Link>
          <Link href="/" style={{
            fontSize: 13, color: '#7575A0',
            border: '1px solid rgba(100,100,200,0.16)',
            borderRadius: 7, padding: '10px 22px',
            textDecoration: 'none',
          }}>
            Home
          </Link>
        </div>

        <p style={{ fontSize: 10, color: '#3A3A55', marginTop: 36, fontFamily: 'monospace' }}>
          id: {id}
        </p>
      </div>
    </div>
  )
}
