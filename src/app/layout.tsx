import type { Metadata } from 'next'
import { GeistSans } from 'geist/font/sans'
import { GeistMono } from 'geist/font/mono'
import './globals.css'

export const metadata: Metadata = {
  title: 'Stvor — Payload Attestation for AI Agents',
  description: 'Cryptographic verification that every agent task was not tampered before execution. Compatible with elizaOS. Built on NVIDIA Nemotron + Stripe Escrow.',
  openGraph: {
    title: 'Stvor — Payload Attestation for AI Agents',
    description: 'Every agent instruction. Cryptographically verified. Tampered wallet payloads caused $1.5B+ in losses in 2025. Stvor prevents agent-layer substitution attacks.',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Stvor — Payload Attestation for AI Agents',
    description: 'Every agent instruction. Cryptographically verified. #NousHackathon',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${GeistSans.variable} ${GeistMono.variable}`}>
      <body>
        {children}
      </body>
    </html>
  )
}
