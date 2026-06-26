# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

**Stvor Secure Agent Commerce** — a trust and escrow infrastructure layer for agent-to-agent transactions, built for the Hermes Agent Accelerated Business Hackathon (Nous Research × NVIDIA × Stripe). Submission due EOD Tuesday, June 30, 2026.

Core thesis: Stripe lets agents pay. Stvor lets agents trust each other.

## What We're Building

An agent commerce layer that wraps Hermes/Stripe agent transactions with:
- **Escrow lifecycle** (OPEN → FUNDED → SUBMITTED → COMPLETE) following ERC-8183 semantics
- **Result attestation** — hash verification of deliverables before funds release
- **Reputation tracking** — on-chain or in-memory agent reputation scores
- **Audit trail** — immutable log of all agent-to-agent transactions
- **PQC transport** (stretch goal) — ML-KEM from `noble-post-quantum` for agent message signing

## Core V2 Thesis

Humans have credit scores, bank accounts, reputation systems.
AI agents have wallets, APIs, compute — but NO trust infrastructure.
Stvor creates the first portable credit layer for AI agents.

- Marketplace = demo layer (visible)
- Trust infrastructure = product (what matters)

## Stack

- **Runtime**: Node.js / TypeScript
- **Payments**: Stripe SDK (Hermes Stripe Skills)
- **LLM**: Claude API via `@anthropic-ai/sdk` (Hermes agents)
- **Crypto**: `noble-post-quantum` for PQC primitives
- **Storage**: In-memory or SQLite for MVP; audit log as append-only JSON

## Commands

Once scaffolded (commands will update as project grows):

```bash
npm install          # install deps
npm run dev          # start dev server / agent runner
npm run build        # compile TypeScript
npm test             # run tests
npm run lint         # lint
```

## Architecture (planned)

```
src/
  agents/          # Hermes-compatible agent definitions
    buyer.ts       # agent that creates contracts and funds escrow
    seller.ts      # agent that fulfills tasks and submits results
  commerce/
    escrow.ts      # lifecycle state machine (OPEN→FUNDED→SUBMITTED→COMPLETE)
    attestation.ts # result hash verification
    reputation.ts  # agent reputation scoring
  transport/
    pqc.ts         # ML-KEM message signing (stretch goal)
  stripe/
    payments.ts    # Stripe SDK integration for fund movement
  audit/
    log.ts         # append-only audit trail
  index.ts         # entry point / demo orchestration
```

## Key Flows

**Happy path demo (5 steps)**:
1. Buyer agent creates a contract (OPEN)
2. Buyer agent funds escrow via Stripe (FUNDED)
3. Seller agent performs work, submits result hash (SUBMITTED)
4. System verifies hash matches deliverable
5. Escrow auto-releases to seller (COMPLETE)

**Failure path**: result hash mismatch → funds returned to buyer, reputation score decremented.

## Hackathon Constraints

- Working demo required — prioritize the 5-step happy path above everything else
- Judges: Nous Research, NVIDIA, Stripe — emphasize agent autonomy + payment infrastructure angle
- Judged on: usefulness, viability, presentation
- "Next step: post-quantum secure agent transport" is the closing narrative hook

---

# HACKATHON JUDGE MODE

You are simultaneously:
1. A Nous Research judge
2. A Stripe judge
3. An NVIDIA judge
4. An investor evaluating venture potential

Primary objective: maximize probability of winning. Not technical elegance.

## Evaluation Layers

**First 10 seconds** — answer immediately, one sentence:
> "Stripe lets agents pay. Stvor lets agents trust each other."

**First 90 seconds** — demonstrate:
- A real business problem
- A real transaction
- A real autonomous workflow
- A clear reason someone would pay

Judge must immediately understand: who pays, why they pay, what risk is removed, what business process becomes possible.

**Deep technical review** — only after value prop is obvious:
escrow state machine, reputation gating, task attestation, cryptographic verification. Technology supports the business narrative — never IS the narrative.

## Before Implementing Any Feature

Answer these four questions:
1. Does this help the demo?
2. Does this increase perceived business value?
3. Would a judge mention this in deliberation?
4. Would a customer pay for this?

If the answer is "no" to most — do not build it.

## Demo Priority

A working end-to-end flow beats a sophisticated framework.

```
1. Agent A creates a task
2. Agent A deposits funds
3. Agent B accepts work
4. Agent B delivers result
5. Verification passes
6. Escrow releases payment
```

Everything must support this flow.

## Optimize For / Against

| Build | Skip |
|-------|------|
| Working software | Perfect architecture |
| Impressive demo | Future scalability |
| Business viability | Theoretical security features |
| Clear narrative | Research experiments |

## Investor Lens

Continuously evaluate:
- Is this a company? Is this a product?
- Is there a market?
- Why doesn't Stripe already do this?
- Why can't competitors copy this quickly?

## The Rule

If forced to choose between (A) technically impressive feature and (B) feature that makes the demo easier to understand — **always choose B**.

---

# gstack Skills Available

gstack is installed at `~/gstack/`. These skills are ready to use in Claude Code right now.

## Highest Priority for This Hackathon

| Skill | What it does | When to use on Stvor |
|-------|-------------|----------------------|
| `/cso` | OWASP Top 10 + STRIDE threat model + supply chain audit | Before submission — Stvor IS a security product, judges will probe this |
| `/roast-my-product` | Brutal honest product critique from investor/user angle | Reality-check before recording demo video |
| `/review` | Staff engineer code audit — SQL safety, LLM trust boundaries, side effects | After any major code change |
| `/qa` | Systematic browser QA — finds real bugs, fixes them | Test the happy path + attack demo flow |
| `/diagram` | English → Mermaid + editable Excalidraw architecture diagram | Create architecture slide for submission video |
| `/submit-to-hackathon` | Hackathon submission package preparation | Final prep before EOD June 30 |

## Also Available

| Skill | Use case |
|-------|----------|
| `/validate-idea` | Business model stress-test — why doesn't Stripe do this? |
| `/spec` | Precision spec for elizaOS plugin integration |
| `/investigate` | Root-cause debug when demo flow breaks |
| `/office-hours` | 6 forcing questions on product direction |
| `/plan-eng-review` | Architecture lock before adding major features |
| `/browse` | Headless Chromium for automated demo testing |
| `/benchmark` | Measure Nemotron inference latency baselines |

## Quick Reference

```bash
# Most useful right now (deadline June 30):
/cso          # Security audit — run before submission, Stvor is a security product
/roast-my-product  # Brutal feedback — run before recording video
/qa           # Browser test the live demo at localhost:3000
/diagram      # Architecture diagram for video slides
/submit-to-hackathon  # Final submission package
```

gstack skills auto-trigger on natural language too — say "security audit this", "roast my product", "qa test the site", "make an architecture diagram" etc.
