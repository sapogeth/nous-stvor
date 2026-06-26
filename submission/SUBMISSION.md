# Stvor — Hackathon Submission Package
**Hermes Agent Accelerated Business Hackathon · Nous Research × NVIDIA × Stripe**
**Deadline: EOD June 30, 2026**

---

## One-Liner (memorize this)

> **"Stripe lets agents pay. Stvor lets agents trust each other."**

---

## Project Description

**What Stvor does:**
Stvor is a payload attestation and escrow layer for AI agent transactions. Every task is SHA-256 signed at creation. Before any agent runs the task, Stvor verifies the hash. If the payload was modified in transit — by a compromised node, a supply chain attack, or a prompt injection — the agent refuses to execute and the escrow is held automatically.

**Why it matters:**
AI agents are being given wallets, API keys, and autonomous authority over real business processes. But they have no way to prove that the instruction they're about to execute is the same one the buyer originally signed. This is exactly how the $292M Bybit hack worked — tampered instructions, auto-executed. Stvor closes that gap.

**What we built:**
- SHA-256 payload attestation: sign at creation (`POST /api/v1/attest/sign`), verify before execution (`POST /api/v1/attest/verify`)
- Stripe escrow lifecycle (OPEN → FUNDED → SUBMITTED → COMPLETE) with `capture_method: manual` — funds only release after attestation passes
- Agent trust scoring: 40% escrow success + 40% task quality + 20% reliability, updated after every contract
- HMAC-SHA256 trust receipts: portable, cryptographically signed proof of completion
- Live marketplace: 3 Hermes agents competing across 2 rounds, parallel inference on NVIDIA Nemotron-3 Ultra
- Emergent agent behavior (Nous moment): agents adapt pricing and strategies between Round 1 and Round 2

**The attack demo:**
One click triggers a supply chain attack — a tampered payload attempts to execute. Stvor catches it in < 1ms via hash mismatch, refuses execution, holds the escrow, and flags the agent's trust score. The funds are protected automatically, without human intervention.

**Technical stack:**
- Runtime: Next.js / TypeScript
- LLM: Claude API (Hermes agents) + NVIDIA NIM (nemotron-3-super-120b-a12b for parallel inference)
- Payments: Stripe SDK (`capture_method: manual` for escrow semantics)
- Crypto: Node.js `crypto` module — SHA-256 + HMAC-SHA256 with `timingSafeEqual`
- Storage: SQLite (better-sqlite3) with append-only audit trail
- Transport: Server-Sent Events for real-time demo updates

**SDK (npm-ready):**
```bash
npm install @stvor/plugin-agent-commerce

import { sign, verify } from '@stvor/plugin-agent-commerce'

const commitment = sign(task)           // buyer signs at creation
const result = verify(task, commitment) // agent checks before running
if (!result.valid) throw new Error('Tampered payload — refusing execution')
```

---

## Demo Video Script (2:30)

### 0:00–0:20 — Hook
**[Show news headlines: Bybit $292M, $7.5M protocol exploits]**

"In 2024, $292 million was stolen from Bybit because an AI signing system executed tampered instructions. The agent did exactly what it was told — but what it was told had been changed. This is the #1 risk in autonomous agent commerce, and no one has solved it."

### 0:20–0:40 — Solution
**[Cut to Stvor homepage]**

"Stvor is a trust layer for AI agents. Every task instruction is cryptographically signed at creation. Before your agent runs anything, Stvor verifies the hash. Tampered payload? Execution blocked. Escrow held. Agent flagged. Automatically."

### 0:40–1:40 — Live Demo: Happy Path
**[Click 'Run Verified Economy']**

"Watch this. Three Hermes agents are competing to fulfill a business task. Buyer deposits $100 into Stripe escrow. Agents bid. NVIDIA Nemotron-3 Ultra runs parallel inference — 3 agents, 3 threads — each producing output that's judged for quality and price.

The winner gets paid. But first — Stvor verifies the task hash matches the original commitment. Same hash. Payment releases. Trust score updates. And the buyer gets a cryptographically signed receipt: proof that what was executed is exactly what was ordered."

**[Show trust receipt modal + live feed updating]**

"Notice the agents — after Round 1, they adapt. The economy agent drops its price, the quality agent holds. Emergent behavior, no human instruction. That's Nous in action."

### 1:40–2:10 — Attack Demo
**[Click 'Simulate Supply Chain Attack']**

"Now watch what happens when someone tampers with the payload in transit."

**[Show attack events in live feed — red borders]**

"Stvor catches it. Hash mismatch — the task the agent received is not the task the buyer signed. Execution refused. Escrow held, not released. Agent trust score decremented. The $100 is protected.

This is the entire value proposition: AI agents run autonomously, so you can't babysit every transaction. Stvor does it cryptographically."

### 2:10–2:30 — What's Next + Call to Action
**[Show architecture diagram]**

"Stvor ships as a plugin — drop-in for any Hermes, elizaOS, or Claude agent. The REST API works with any stack.

Next: post-quantum secure transport using ML-KEM for agent-to-agent message signing — so even quantum-capable adversaries can't forge task commitments.

The credit score for AI agents starts here. Try the live demo at localhost:3000. Code on GitHub."

---

## Submission Checklist

- [ ] **Demo live**: `npm run dev` → http://localhost:3000
- [ ] **Video recorded**: 2:30 demo video (OBS / QuickTime)
- [ ] **GitHub repo public**: Push codebase, clean README
- [ ] **Tweet**: Tweet @nousresearch with demo video + one-liner
- [ ] **Discord**: Post in hackathon Discord with project link
- [ ] **Typeform**: Submit via official hackathon Typeform

---

## Judges — What Each One Cares About

### Nous Research
- Emergent agent behavior ✓ (Round 2 strategy adaptation without explicit instruction)
- Hermes agent integration ✓ (3 competing agents, buyer/seller pattern)
- Agent autonomy ✓ (no human in the loop for escrow release)

### NVIDIA
- NIM inference ✓ (`nvidia/nemotron-3-super-120b-a12b` via OpenAI-compatible client)
- Parallel inference ✓ (3 threads simultaneously for agent bidding)
- Scale story ✓ (attestation + inference at every transaction)

### Stripe
- Real Stripe integration ✓ (`capture_method: manual`, payment intents, `pm_card_visa` test)
- Agent commerce infrastructure ✓ (the trust layer Stripe doesn't provide)
- "Why doesn't Stripe do this?" → Stripe moves money. Stvor verifies instructions.
  Stripe is infrastructure. Stvor is middleware. They stack, not compete.

### Investor
- Market: Every AI agent that touches money, contracts, or APIs needs this
- Moat: Spec ownership — become the ERC-8183 of agent attestation. If elizaOS references the spec, competitors implement our standard
- Revenue: Transaction fee on escrow volume, or SaaS per-agent trust score API
- Why now: Agent wallets exist (Stripe). The trust layer doesn't. We're 6 months early.

---

## Live Stats (as of demo)

| Metric | Value |
|--------|-------|
| Total escrow volume | $3,330.78 |
| Total contracts | 136 |
| Active agents | 3 |
| Avg trust score | 77.5 / 100 |
| Tamper detection | < 1ms |
| False positive rate | 0% |

---

## One-Paragraph Pitch (for Discord / tweet thread)

AI agents are running autonomous business transactions. Stripe gives them wallets. But who verifies the instruction the agent receives is the same one the buyer signed? Nobody — until Stvor. We SHA-256 hash every task at contract creation and verify the hash before execution via HMAC-SHA256. Tampered payload = execution blocked, escrow held, reputation hit. Built on Hermes agents, NVIDIA Nemotron-3 Ultra for parallel inference, and Stripe escrow with `capture_method: manual`. Drop-in plugin for any agent framework. This is the credit layer for AI agents. @nousresearch @nvidia @stripe #HermesHackathon
