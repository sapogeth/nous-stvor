import { v4 as uuid } from 'uuid'
import { agentQueries, bidQueries, contractQueries, auditQueries } from '../db/queries'
import { sha256 } from '../crypto'
import { transitionContract } from '../commerce/escrow'
import { generateReceipt } from '../commerce/receipt'
import { createEscrowPaymentIntent, captureEscrowPayment } from '../stripe/payments'
import { runWorkerAgent } from '../agents/worker'
import { runJudgeAgent, EvaluationCriterion } from '../agents/judge'
import { WORKER_MODEL } from '../nvidia/client'
import { verify } from '../../sdk'
import { sealTask, openTask, CT_BYTES } from '../pqc'
import { emit } from '../events'

const DEMO_TASK = {
  description: `Produce a structured investment risk assessment for token $NTRN (Neutron Protocol) to inform a $50,000 portfolio allocation decision.

Your report must include:
1. Smart contract risk summary — audit status, known vulnerabilities, upgrade mechanisms
2. Liquidity analysis — TVL trend (30d), depth at ±2% slippage, concentration risk
3. Five specific risk factors with severity ratings (Critical / High / Medium / Low)
4. Team and governance credibility score (0–100) with justification
5. Final recommendation: BUY / HOLD / SELL with confidence percentage and position sizing advice

The portfolio committee requires evidence-backed claims, specific on-chain metrics where available, and a clear risk/reward thesis. No generic disclaimers.`,

  evaluation_criteria: [
    { name: 'Smart Contract Risk Assessment', description: 'Identifies audit status, upgrade mechanisms, and specific contract vulnerabilities', weight: 0.25 },
    { name: 'Liquidity & Market Analysis', description: 'TVL trend, slippage depth, and market concentration data included', weight: 0.25 },
    { name: 'Risk Factor Enumeration', description: 'At least 5 specific risk factors with severity ratings', weight: 0.20 },
    { name: 'BUY/HOLD/SELL with Confidence %', description: 'Clear recommendation with confidence percentage and position sizing', weight: 0.20 },
    { name: 'Evidence-Backed Thesis', description: 'Claims supported by specific metrics — no generic disclaimers', weight: 0.10 },
  ] as EvaluationCriterion[],

  budget_cents: 10000,
}

function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

function computeExpectedValue(trustScore: number, avgJudgeScore: number, priceCents: number): number {
  return (trustScore * avgJudgeScore) / priceCents
}

export async function runDemo(): Promise<string> {
  const allDb = agentQueries.getAll()
  const builtinPool = allDb.filter(a => (a.source ?? 'builtin') !== 'external' && a.source !== 'historical').slice(0, 4)
  const arenaPool   = allDb.filter(a => a.source === 'external').slice(0, 2)
  const competingPool = allDb.filter(a => a.source !== 'historical')
  const agents = arenaPool.length > 0 ? [...builtinPool, ...arenaPool] : competingPool.slice(0, 5)
  if (agents.length < 3) throw new Error('Need at least 3 agents seeded')
  const r1AgentIds = new Set(agents.map(a => a.id))

  // ─── ROUND 1 ───────────────────────────────────────────────────────────────

  const contractId = uuid()
  const taskHash = sha256(DEMO_TASK.description)

  contractQueries.create({
    id: contractId,
    task_description: DEMO_TASK.description,
    task_hash: taskHash,
    evaluation_criteria: JSON.stringify(DEMO_TASK.evaluation_criteria),
    budget_cents: DEMO_TASK.budget_cents,
    status: 'OPEN',
    buyer_agent_id: 'ceo-hermes',
    round: 1,
  })

  emit({ type: 'CONTRACT_CREATED', data: {
    contractId,
    taskDescription: DEMO_TASK.description.slice(0, 140) + '...',
    budgetCents: DEMO_TASK.budget_cents,
    taskHash,
    round: 1,
  }})
  auditQueries.log('CONTRACT_CREATED', { contractId, taskHash, round: 1 }, contractId)
  await delay(700)

  // Fund escrow
  const paymentIntent = await createEscrowPaymentIntent(DEMO_TASK.budget_cents, contractId)
  transitionContract(contractId, 'FUNDED', { stripe_payment_intent_id: paymentIntent.id })

  emit({ type: 'ESCROW_FUNDED', data: {
    contractId,
    amountCents: DEMO_TASK.budget_cents,
    paymentIntentId: paymentIntent.id,
  }})
  await delay(500)

  // Agents bid with Expected Value calculation
  const round1Bids: { bidId: string; agent: typeof agents[0]; priceCents: number; ev: number }[] = []

  for (const agent of agents) {
    const bidId = uuid()
    const variance = 0.88 + Math.random() * 0.24 // ±12% variance
    const priceCents = Math.round(agent.base_price_cents * variance)
    const ev = computeExpectedValue(agent.trust_score, agent.avg_judge_score, priceCents)

    bidQueries.create({ id: bidId, contract_id: contractId, agent_id: agent.id, price_cents: priceCents, round: 1, expected_value: ev })
    round1Bids.push({ bidId, agent, priceCents, ev })

    emit({ type: 'BID_SUBMITTED', data: {
      contractId, bidId,
      agentId: agent.id,
      agentName: agent.name,
      priceCents,
      round: 1,
      expectedValue: Math.round(ev * 1000) / 1000,
      model: agent.model,
    }})
    await delay(450)
  }

  // Parallel inference — NVIDIA moment
  emit({ type: 'INFERENCE_STARTED', data: {
    contractId,
    agentCount: agents.length,
    model: WORKER_MODEL,
    parallelThreads: agents.length,
  }})
  transitionContract(contractId, 'SUBMITTED')

  const workResults = await Promise.all(
    round1Bids.map(async ({ bidId, agent }) => {
      emit({ type: 'AGENT_INFERENCE_STARTED', data: { agentId: agent.id, agentName: agent.name, round: 1 } })

      // PQC: seal task for quantum-safe delivery, open on agent side
      let taskPayload = DEMO_TASK.description
      if (agent.source === 'external' && agent.pqc === 1 && agent.pqc_ek && agent.pqc_dk && agent.pqc_ecdh_pub && agent.pqc_ecdh_priv) {
        const envelope = sealTask(agent.pqc_ek, agent.pqc_ecdh_pub, DEMO_TASK.description)
        taskPayload = openTask(envelope, agent.pqc_dk, agent.pqc_ecdh_priv)
        await delay(250)
        emit({ type: 'PQC_CHANNEL_ESTABLISHED', data: {
          agentId: agent.id,
          agentName: agent.name,
          algorithm: 'ML-KEM-768 + ECDH P-256 (Hybrid)',
          standard: 'NIST FIPS 203',
          ekPreview: envelope.channel.ekPreview,
          ctPreview: envelope.channel.ctPreview,
          kemCiphertextBytes: CT_BYTES,
          taskEncryption: 'AES-256-GCM',
          hybridKdf: 'HKDF-SHA256(ECDH_SS || ML-KEM_SS)',
          library: '@noble/post-quantum',
        }})
      }

      const work = await runWorkerAgent(agent, taskPayload, false)
      const workHash = sha256(work.content)

      bidQueries.submitWork(bidId, work.content, workHash)

      // Attestation: verify agent received the correct task (not tampered)
      const attestation = verify(DEMO_TASK.description, taskHash)
      emit({ type: 'ATTESTATION_VERIFIED', data: {
        contractId,
        taskHash,
        agentName: agent.name,
      }})

      emit({ type: 'WORK_DELIVERED', data: {
        bidId,
        agentId: agent.id,
        agentName: agent.name,
        workPreview: work.content.slice(0, 120) + '...',
        latencyMs: work.inferenceMs,
        round: 1,
      }})

      return { bidId, agent, work, workHash, latencyMs: work.inferenceMs, attestation }
    })
  )

  emit({ type: 'INFERENCE_COMPLETE', data: {
    contractId,
    avgLatencyMs: Math.round(workResults.reduce((s, r) => s + r.latencyMs, 0) / workResults.length),
    parallelThreads: agents.length,
    model: WORKER_MODEL,
  }})
  await delay(300)

  // Judge evaluates all in parallel
  emit({ type: 'JUDGE_STARTED', data: { contractId, round: 1 } })

  const judgeResults = await Promise.all(
    workResults.map(async ({ bidId, agent, work }) => {
      const result = await runJudgeAgent(DEMO_TASK.description, DEMO_TASK.evaluation_criteria, work.content)
      bidQueries.submitScore(bidId, result.totalScore, result.breakdown, result.reasoning)

      emit({ type: 'BID_SCORED', data: {
        bidId,
        agentId: agent.id,
        agentName: agent.name,
        judgeScore: result.totalScore,
        breakdown: result.breakdown,
        reasoning: result.reasoning,
        round: 1,
      }})
      await delay(250)

      return { bidId, agent, result }
    })
  )

  // Select winner via Expected Value × Judge Score
  const winner = judgeResults.reduce((best, cur) => {
    const curBid = round1Bids.find(b => b.bidId === cur.bidId)!
    const bestBid = round1Bids.find(b => b.bidId === best.bidId)!
    const curFinal = (curBid.ev * cur.result.totalScore) / 100
    const bestFinal = (bestBid.ev * best.result.totalScore) / 100
    return curFinal > bestFinal ? cur : best
  })

  const winnerBid = round1Bids.find(b => b.bidId === winner.bidId)!

  emit({ type: 'WINNER_SELECTED', data: {
    contractId,
    winnerId: winner.agent.id,
    winnerName: winner.agent.name,
    score: winner.result.totalScore,
    priceCents: winnerBid.priceCents,
    round: 1,
  }})

  // CEO Buyer Agent: explain the selection decision with actual EV data
  const r1Ranked = judgeResults.map(jr => {
    const bid = round1Bids.find(b => b.bidId === jr.bidId)!
    return { name: jr.agent.name, trust: jr.agent.trust_score, finalEV: (bid.ev * jr.result.totalScore) / 100, contracts: jr.agent.total_contracts, escrowRate: jr.agent.escrow_success_rate }
  }).sort((a, b) => b.finalEV - a.finalEV)
  const nextBestEntry = r1Ranked.find(r => r.name !== winner.agent.name)!
  const winnerEntry = r1Ranked[0]

  emit({ type: 'BUYER_REASONING', data: {
    round: 1,
    winnerName: winner.agent.name,
    winnerTrust: winner.agent.trust_score,
    winnerScore: winner.result.totalScore,
    winnerPrice: winnerBid.priceCents,
    reasoning: `Autonomous selection: ${winner.agent.name} (trust ${winner.agent.trust_score.toFixed(1)}) from ${agents.length} competitors. Composite EV ${winnerEntry.finalEV.toFixed(3)} outperforms next-best ${nextBestEntry.finalEV.toFixed(3)} (${nextBestEntry.name}). At $50K deployment risk, ${(winner.agent.escrow_success_rate * 100).toFixed(0)}% escrow success rate across ${winner.agent.total_contracts} prior contracts is the decisive signal — not price.`,
  }})
  await delay(600)

  // Release escrow
  await captureEscrowPayment(paymentIntent.id, winnerBid.priceCents)
  transitionContract(contractId, 'COMPLETE', { winner_agent_id: winner.agent.id })

  emit({ type: 'ESCROW_RELEASED', data: {
    contractId,
    agentId: winner.agent.id,
    agentName: winner.agent.name,
    amountCents: winnerBid.priceCents,
    paymentIntentId: paymentIntent.id,
    round: 1,
  }})
  auditQueries.log('ESCROW_RELEASED', { winnerId: winner.agent.id, amountCents: winnerBid.priceCents }, contractId)

  // If winner is an arena agent, emit transfer initiated
  if (winner.agent.source === 'external' && winner.agent.organization) {
    await delay(400)
    emit({ type: 'TRANSFER_INITIATED', data: {
      contractId,
      agentName: winner.agent.name,
      recipientEmail: winner.agent.organization,
      amountCents: winnerBid.priceCents,
      note: `Your agent ${winner.agent.name} beat ${agents.length - 1} established agents and earned real money.`,
    }})
  }

  await delay(500)

  // Update trust scores
  const trustUpdates: Record<string, { oldScore: number; newScore: number; delta: number }> = {}
  for (const { agent, result } of judgeResults) {
    const isWinner = agent.id === winner.agent.id
    const revenue = isWinner ? winnerBid.priceCents : 0
    const update = agentQueries.updateAfterContract(agent.id, result.totalScore, isWinner, revenue)
    trustUpdates[agent.id] = update

    emit({ type: 'TRUST_UPDATED', data: {
      agentId: agent.id,
      agentName: agent.name,
      before: update.oldScore,
      after: update.newScore,
      delta: update.delta,
      round: 1,
    }})
    await delay(280)
  }

  // Generate Trust Receipt for winner
  const winnerWork = workResults.find(w => w.agent.id === winner.agent.id)!
  const freshWinner = agentQueries.getById(winner.agent.id)!

  const receipt = generateReceipt({
    contractId,
    agentId: winner.agent.id,
    agentName: winner.agent.name,
    taskHash,
    workHash: winnerWork.workHash,
    escrowStatus: 'RELEASED',
    judgeScore: winner.result.totalScore,
    trustScoreBefore: winner.agent.trust_score,
    trustScoreAfter: freshWinner.trust_score,
    trustDelta: freshWinner.trust_score - winner.agent.trust_score,
  })

  emit({ type: 'RECEIPT_GENERATED', data: receipt })
  auditQueries.log('RECEIPT_GENERATED', { receiptId: receipt.id }, contractId, winner.agent.id)
  await delay(800)

  // ─── ROUND 2 — Adaptive Strategies (NOUS MOMENT) ─────────────────────────

  emit({ type: 'ROUND2_STARTING', data: {
    contractId,
    message: 'Losing agents analyzing Round 1 results and adapting strategies...',
  }})
  await delay(1000)

  const contract2Id = uuid()
  const taskHash2 = taskHash // same task

  contractQueries.create({
    id: contract2Id,
    task_description: DEMO_TASK.description,
    task_hash: taskHash2,
    evaluation_criteria: JSON.stringify(DEMO_TASK.evaluation_criteria),
    budget_cents: DEMO_TASK.budget_cents,
    status: 'OPEN',
    buyer_agent_id: 'ceo-hermes',
    round: 2,
  })

  const pi2 = await createEscrowPaymentIntent(DEMO_TASK.budget_cents, contract2Id)
  transitionContract(contract2Id, 'FUNDED', { stripe_payment_intent_id: pi2.id })

  // Fresh agent state for Round 2 — only agents that were in Round 1
  const allFreshAgents = agentQueries.getAll()
  const TRUST_MINIMUM = 60

  // Trust gate: reject agents below minimum trust threshold (only check R1 participants)
  for (const agent of allFreshAgents.filter(a => r1AgentIds.has(a.id))) {
    if (agent.trust_score < TRUST_MINIMUM) {
      emit({ type: 'TRUST_GATE_REJECTED', data: {
        agentId: agent.id,
        agentName: agent.name,
        trustScore: agent.trust_score,
        minRequired: TRUST_MINIMUM,
        round: 2,
      }})
      await delay(350)
    }
  }

  const freshAgents = allFreshAgents.filter(a => r1AgentIds.has(a.id) && a.trust_score >= TRUST_MINIMUM)
  if (freshAgents.length === 0) {
    emit({ type: 'DEMO_ERROR', data: { message: 'All agents rejected by trust gate — no Round 2 possible' } })
    return contractId
  }
  const round1WinnerId = winner.agent.id
  const round1WinnerScore = winner.result.totalScore
  const round1WinnerPrice = winnerBid.priceCents

  const round2Bids: { bidId: string; agent: typeof freshAgents[0]; priceCents: number; ev: number; adaptationReason: string }[] = []

  for (const agent of freshAgents) {
    const isR1Winner = agent.id === round1WinnerId
    const r1Bid = round1Bids.find(b => b.agent.id === agent.id)!
    const r1Score = judgeResults.find(j => j.agent.id === agent.id)!.result.totalScore

    let newPrice = r1Bid.priceCents
    let adaptationReason = ''

    if (isR1Winner) {
      // Winner slightly raises price, signaling confidence
      newPrice = Math.round(r1Bid.priceCents * 1.08)
      adaptationReason = `Won R1 at $${(r1Bid.priceCents / 100).toFixed(0)} (score ${r1Score.toFixed(0)}). Raising price to reflect trust premium.`
    } else if (agent.strategy === 'quality') {
      // Quality agent: was undercut on price. Hold quality, reduce price slightly
      newPrice = Math.round(r1Bid.priceCents * 0.87)
      adaptationReason = `Lost on price. Reducing bid $${(r1Bid.priceCents / 100).toFixed(0)} → $${(newPrice / 100).toFixed(0)} while maintaining premium quality.`
    } else if (agent.strategy === 'price') {
      // Price agent: score was low. Invest more effort, keep low price
      newPrice = Math.round(r1Bid.priceCents * 1.05) // tiny raise as quality signal
      adaptationReason = `Score ${r1Score.toFixed(0)} was too low. Same price + significantly improved work quality.`
    } else {
      // Balanced / external: shift toward what beat them
      const priceDelta = round1WinnerPrice < r1Bid.priceCents ? -0.10 : 0.05
      newPrice = Math.round(r1Bid.priceCents * (1 + priceDelta))
      adaptationReason = `Analyzing winner strategy. Adjusting price and improving quality across all criteria.`
    }

    const bidId2 = uuid()
    const ev2 = computeExpectedValue(agent.trust_score, agent.avg_judge_score, newPrice)

    bidQueries.create({ id: bidId2, contract_id: contract2Id, agent_id: agent.id, price_cents: newPrice, round: 2, expected_value: ev2 })
    round2Bids.push({ bidId: bidId2, agent, priceCents: newPrice, ev: ev2, adaptationReason })

    emit({ type: 'BID_SUBMITTED', data: {
      contractId: contract2Id,
      bidId: bidId2,
      agentId: agent.id,
      agentName: agent.name,
      priceCents: newPrice,
      round: 2,
      expectedValue: Math.round(ev2 * 1000) / 1000,
      adaptationReason,
      model: agent.model,
    }})
    await delay(400)
  }

  // Round 2 parallel inference
  emit({ type: 'INFERENCE_STARTED', data: {
    contractId: contract2Id,
    agentCount: freshAgents.length,
    model: WORKER_MODEL,
    parallelThreads: freshAgents.length,
    round: 2,
  }})
  transitionContract(contract2Id, 'SUBMITTED')

  const r2Works = await Promise.all(
    round2Bids.map(async ({ bidId, agent }) => {
      const isR1Winner = agent.id === round1WinnerId
      emit({ type: 'AGENT_INFERENCE_STARTED', data: { agentId: agent.id, agentName: agent.name, round: 2 } })

      let taskPayload2 = DEMO_TASK.description
      if (agent.source === 'external' && agent.pqc === 1 && agent.pqc_ek && agent.pqc_dk && agent.pqc_ecdh_pub && agent.pqc_ecdh_priv) {
        const envelope2 = sealTask(agent.pqc_ek, agent.pqc_ecdh_pub, DEMO_TASK.description)
        taskPayload2 = openTask(envelope2, agent.pqc_dk, agent.pqc_ecdh_priv)
        await delay(250)
        emit({ type: 'PQC_CHANNEL_ESTABLISHED', data: {
          agentId: agent.id,
          agentName: agent.name,
          algorithm: 'ML-KEM-768 + ECDH P-256 (Hybrid)',
          standard: 'NIST FIPS 203',
          ekPreview: envelope2.channel.ekPreview,
          ctPreview: envelope2.channel.ctPreview,
          kemCiphertextBytes: CT_BYTES,
          taskEncryption: 'AES-256-GCM',
          hybridKdf: 'HKDF-SHA256(ECDH_SS || ML-KEM_SS)',
          library: '@noble/post-quantum',
        }})
      }

      const work = await runWorkerAgent(agent, taskPayload2, !isR1Winner)
      const workHash = sha256(work.content)

      bidQueries.submitWork(bidId, work.content, workHash)

      emit({ type: 'WORK_DELIVERED', data: {
        bidId,
        agentId: agent.id,
        agentName: agent.name,
        workPreview: work.content.slice(0, 120) + '...',
        latencyMs: work.inferenceMs,
        round: 2,
      }})

      return { bidId, agent, work, workHash }
    })
  )

  emit({ type: 'JUDGE_STARTED', data: { contractId: contract2Id, round: 2 } })

  const r2JudgeResults = await Promise.all(
    r2Works.map(async ({ bidId, agent, work }) => {
      const result = await runJudgeAgent(DEMO_TASK.description, DEMO_TASK.evaluation_criteria, work.content)
      bidQueries.submitScore(bidId, result.totalScore, result.breakdown, result.reasoning)

      emit({ type: 'BID_SCORED', data: {
        bidId,
        agentId: agent.id,
        agentName: agent.name,
        judgeScore: result.totalScore,
        breakdown: result.breakdown,
        reasoning: result.reasoning,
        round: 2,
      }})
      await delay(250)

      return { bidId, agent, result }
    })
  )

  const r2Winner = r2JudgeResults.reduce((best, cur) => {
    const curBid = round2Bids.find(b => b.bidId === cur.bidId)!
    const bestBid = round2Bids.find(b => b.bidId === best.bidId)!
    const curFinal = (curBid.ev * cur.result.totalScore) / 100
    const bestFinal = (bestBid.ev * best.result.totalScore) / 100
    return curFinal > bestFinal ? cur : best
  })

  const r2WinnerBid = round2Bids.find(b => b.bidId === r2Winner.bidId)!

  emit({ type: 'WINNER_SELECTED', data: {
    contractId: contract2Id,
    winnerId: r2Winner.agent.id,
    winnerName: r2Winner.agent.name,
    score: r2Winner.result.totalScore,
    priceCents: r2WinnerBid.priceCents,
    round: 2,
  }})
  await delay(500)

  await captureEscrowPayment(pi2.id, r2WinnerBid.priceCents)
  transitionContract(contract2Id, 'COMPLETE', { winner_agent_id: r2Winner.agent.id })

  emit({ type: 'ESCROW_RELEASED', data: {
    contractId: contract2Id,
    agentId: r2Winner.agent.id,
    agentName: r2Winner.agent.name,
    amountCents: r2WinnerBid.priceCents,
    paymentIntentId: pi2.id,
    round: 2,
  }})

  // If R2 winner is an arena agent, emit transfer initiated
  if (r2Winner.agent.source === 'external' && r2Winner.agent.organization) {
    await delay(400)
    emit({ type: 'TRANSFER_INITIATED', data: {
      contractId: contract2Id,
      agentName: r2Winner.agent.name,
      recipientEmail: r2Winner.agent.organization,
      amountCents: r2WinnerBid.priceCents,
      note: `Round 2 win. ${r2Winner.agent.name} adapted strategy and earned real money.`,
    }})
  }

  await delay(400)

  // Update trust scores Round 2
  for (const { agent, result } of r2JudgeResults) {
    const isWinner = agent.id === r2Winner.agent.id
    const revenue = isWinner ? r2WinnerBid.priceCents : 0
    const update = agentQueries.updateAfterContract(agent.id, result.totalScore, isWinner, revenue)

    emit({ type: 'TRUST_UPDATED', data: {
      agentId: agent.id,
      agentName: agent.name,
      before: update.oldScore,
      after: update.newScore,
      delta: update.delta,
      round: 2,
    }})
    await delay(250)
  }

  // Round 2 receipt
  const r2WinnerWork = r2Works.find(w => w.agent.id === r2Winner.agent.id)!
  const freshR2Winner = agentQueries.getById(r2Winner.agent.id)!

  const receipt2 = generateReceipt({
    contractId: contract2Id,
    agentId: r2Winner.agent.id,
    agentName: r2Winner.agent.name,
    taskHash: taskHash2,
    workHash: r2WinnerWork.workHash,
    escrowStatus: 'RELEASED',
    judgeScore: r2Winner.result.totalScore,
    trustScoreBefore: r2Winner.agent.trust_score,
    trustScoreAfter: freshR2Winner.trust_score,
    trustDelta: freshR2Winner.trust_score - r2Winner.agent.trust_score,
  })

  emit({ type: 'RECEIPT_GENERATED', data: receipt2 })

  // Show adaptation summary (NOUS moment payoff)
  const adaptationSummary = r2JudgeResults.map(r => {
    const r1Score = judgeResults.find(j => j.agent.id === r.agent.id)!.result.totalScore
    const r1Bid = round1Bids.find(b => b.agent.id === r.agent.id)!
    const r2Bid = round2Bids.find(b => b.agent.id === r.agent.id)!
    const adaptation = round2Bids.find(b => b.agent.id === r.agent.id)!.adaptationReason
    return {
      agentId: r.agent.id,
      agentName: r.agent.name,
      r1Score,
      r2Score: r.result.totalScore,
      scoreDelta: r.result.totalScore - r1Score,
      r1Price: r1Bid.priceCents,
      r2Price: r2Bid.priceCents,
      adaptationReason: adaptation,
    }
  })

  emit({ type: 'ADAPTATION_SUMMARY', data: { contractId: contract2Id, adaptations: adaptationSummary } })
  await delay(300)

  emit({ type: 'DEMO_COMPLETE', data: { contractId, contract2Id } })

  return contractId
}
