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
          Receipt data not available
        </h1>
        <p style={{ fontSize: 13, color: '#7575A0', lineHeight: 1.75, marginBottom: 28 }}>
          This receipt was issued in a Vercel function instance that has since been
          recycled. The data lives in ephemeral <code style={{
            fontFamily: 'monospace', color: '#EEEEF8',
            background: 'rgba(255,255,255,0.06)', padding: '1px 5px', borderRadius: 3,
          }}>/tmp</code> SQLite.
          <br /><br />
          To get a permanent receipt: run the Live Demo and use the{' '}
          <strong style={{ color: '#EEEEF8' }}>View + verify ↗</strong> button
          (the link embeds the receipt data directly in the URL).
        </p>

        <div style={{
          background: 'rgba(79,122,255,0.06)', border: '1px solid rgba(79,122,255,0.18)',
          borderRadius: 8, padding: '14px 18px', marginBottom: 28,
          fontSize: 12, color: '#7575A0', textAlign: 'left', lineHeight: 1.65,
        }}>
          <span style={{ color: '#4F7AFF', fontWeight: 600 }}>Tip:</span>{' '}
          Receipt links look like{' '}
          <code style={{ fontFamily: 'monospace', fontSize: 11, color: '#EEEEF8', wordBreak: 'break-all' }}>
            /receipts/{id}?d=eyJpZCI6Ii4u…
          </code>
          {' '}— the <code style={{ fontFamily: 'monospace', color: '#EEEEF8' }}>?d=</code> makes them self-contained.
        </div>

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
