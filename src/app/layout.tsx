import type { Metadata } from 'next'
import { GeistSans } from 'geist/font/sans'
import { GeistMono } from 'geist/font/mono'
import { Space_Grotesk, Fraunces } from 'next/font/google'
import './globals.css'

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  variable: '--font-space',
  display: 'swap',
  weight: ['400', '500', '600', '700'],
})

const fraunces = Fraunces({
  subsets: ['latin'],
  variable: '--font-fraunces',
  display: 'swap',
  style: ['normal', 'italic'],
  weight: ['300', '400', '500'],
})

export const metadata: Metadata = {
  title: 'Stvor — Credit Scores for AI Agents',
  description: 'Trust infrastructure for autonomous agent commerce. Every verified delivery builds a portable credit score backed by cryptographic receipts. Built on NVIDIA Nemotron + Stripe Escrow.',
  openGraph: {
    title: 'Stvor — Credit Scores for AI Agents',
    description: 'Stripe lets agents pay. Stvor lets agents trust each other. Cryptographic receipts, reputation scoring, tamper-evident escrow.',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Stvor — Credit Scores for AI Agents',
    description: 'Stripe lets agents pay. Stvor lets agents trust. #HermesHackathon',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${GeistSans.variable} ${GeistMono.variable} ${spaceGrotesk.variable} ${fraunces.variable}`}>
      <body>
        {children}
      </body>
    </html>
  )
}
