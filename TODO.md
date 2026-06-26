# Stvor — Build Strategy & TODO

## Архитектура одной фразой
> Agent marketplace сверху. Trust layer снизу. Stripe посередине.

---

## Stack
- **Next.js 15** — dashboard UI + API routes (один процесс)
- **SQLite** (better-sqlite3) — база данных, синхронная, без сервера
- **Claude API** (@anthropic-ai/sdk) — CEO Agent, Worker Agents × 3, Judge Agent
- **Stripe** — Stripe test mode, PaymentIntent, Transfer simulation
- **SSE** (Server-Sent Events) — real-time обновления в UI
- **Node.js crypto** — HMAC-SHA256 для Trust Receipt signature

---

## Структура файлов

```
src/
  app/
    page.tsx              ← главный dashboard
    demo/page.tsx         ← страница live demo
    api/
      contracts/
        route.ts          ← POST создать контракт
        [id]/
          route.ts        ← GET статус
          fund/route.ts   ← POST fund escrow
          judge/route.ts  ← POST запустить судью
          complete/route.ts ← POST release escrow
      bids/
        route.ts          ← POST создать bid
        [id]/work/route.ts ← POST сдать работу
      agents/route.ts     ← GET список агентов
      events/route.ts     ← GET SSE stream
      demo/run/route.ts   ← POST запустить полный demo flow
  lib/
    db/
      schema.ts           ← CREATE TABLE statements
      client.ts           ← singleton SQLite connection
      queries.ts          ← все SQL запросы
    agents/
      ceo.ts              ← CEO Agent (Claude)
      worker.ts           ← Worker Agent template (Claude)
      judge.ts            ← Judge Agent (Claude)
      personas.ts         ← 3 конкретных агента с именами и стратегиями
    commerce/
      escrow.ts           ← state machine OPEN→FUNDED→SUBMITTED→COMPLETE
      trust-score.ts      ← формула TrustScore + пересчёт
      receipt.ts          ← генерация и подпись Trust Receipt
    stripe/
      client.ts           ← Stripe SDK init
      payments.ts         ← createPaymentIntent, capturePayment, refund
    demo/
      runner.ts           ← оркестрирует полный demo flow
    events.ts             ← SSE event emitter (singleton)
    crypto.ts             ← SHA256 hash, HMAC sign/verify
  components/
    Dashboard.tsx         ← главный экран
    AgentLeaderboard.tsx  ← таблица агентов с Trust Score
    DemoFlow.tsx          ← анимированный demo (6 шагов)
    TrustReceipt.tsx      ← финальный receipt экран
    LiveFeed.tsx          ← real-time лог событий
    EscrowStatus.tsx      ← визуализация lifecycle
```

---

## База данных — полная схема

### agents
```sql
CREATE TABLE IF NOT EXISTS agents (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  specialty TEXT NOT NULL,
  strategy TEXT NOT NULL,           -- 'quality' | 'price' | 'balanced'
  base_price_cents INTEGER NOT NULL,
  trust_score REAL DEFAULT 50.0,    -- 0–100, начинаем с 50
  escrow_success_rate REAL DEFAULT 0.5,
  avg_judge_score REAL DEFAULT 50.0,
  reliability_score REAL DEFAULT 1.0,
  total_contracts INTEGER DEFAULT 0,
  successful_contracts INTEGER DEFAULT 0,
  total_revenue_cents INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now'))
);
```

### contracts
```sql
CREATE TABLE IF NOT EXISTS contracts (
  id TEXT PRIMARY KEY,
  task_description TEXT NOT NULL,
  task_hash TEXT NOT NULL,          -- SHA256(task_description)
  evaluation_criteria TEXT NOT NULL, -- JSON: [{name, description, weight}]
  budget_cents INTEGER NOT NULL,
  status TEXT DEFAULT 'OPEN',       -- OPEN|FUNDED|SUBMITTED|COMPLETE|DISPUTED
  buyer_agent_id TEXT NOT NULL,
  winner_agent_id TEXT,
  stripe_payment_intent_id TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  funded_at TEXT,
  completed_at TEXT,
  FOREIGN KEY (buyer_agent_id) REFERENCES agents(id)
);
```

### bids
```sql
CREATE TABLE IF NOT EXISTS bids (
  id TEXT PRIMARY KEY,
  contract_id TEXT NOT NULL,
  agent_id TEXT NOT NULL,
  price_cents INTEGER NOT NULL,
  work_delivered TEXT,              -- текст работы от Worker Agent
  work_hash TEXT,                   -- SHA256(work_delivered)
  judge_score REAL,                 -- итоговый балл 0–100
  judge_breakdown TEXT,             -- JSON: {criterionName: score}
  judge_reasoning TEXT,             -- объяснение от Judge Agent
  submitted_at TEXT,
  FOREIGN KEY (contract_id) REFERENCES contracts(id),
  FOREIGN KEY (agent_id) REFERENCES agents(id)
);
```

### trust_receipts
```sql
CREATE TABLE IF NOT EXISTS trust_receipts (
  id TEXT PRIMARY KEY,
  contract_id TEXT NOT NULL,
  agent_id TEXT NOT NULL,
  trust_score_before REAL NOT NULL,
  trust_score_after REAL NOT NULL,
  trust_delta REAL NOT NULL,
  judge_score REAL NOT NULL,
  escrow_status TEXT NOT NULL,      -- 'RELEASED' | 'REFUNDED'
  task_hash TEXT NOT NULL,
  work_hash TEXT NOT NULL,
  signature TEXT NOT NULL,          -- HMAC-SHA256
  generated_at TEXT DEFAULT (datetime('now'))
);
```

### audit_log
```sql
CREATE TABLE IF NOT EXISTS audit_log (
  id TEXT PRIMARY KEY,
  event_type TEXT NOT NULL,
  contract_id TEXT,
  agent_id TEXT,
  data TEXT,                        -- JSON
  created_at TEXT DEFAULT (datetime('now'))
);
```

---

## Trust Score — формула

```
TrustScore = 100 × (
  0.40 × EscrowSuccessRate
  0.40 × (avg_judge_score / 100)
  0.20 × ReliabilityScore
)

EscrowSuccessRate = successful_contracts / max(total_contracts, 1)
ReliabilityScore  = 1.0 → убывает на 0.1 за каждый timeout/failure
```

**При первом контракте** (total_contracts = 0):
```
TrustScore = 50.0  ← нейтральный старт
```

**После каждого контракта** — пересчёт живой.

**Формула delta:**
```
delta = newScore - oldScore
```
Показываем на UI: `91.2 → 92.8 (+1.6)`

---

## Trust Receipt — структура и подпись

```typescript
interface TrustReceipt {
  id: string              // UUID
  contractId: string
  agentId: string
  agentName: string
  taskHash: string        // SHA256(task_description)
  workHash: string        // SHA256(work_delivered)
  escrowStatus: 'RELEASED' | 'REFUNDED'
  judgeScore: number      // 0–100
  judgeBreakdown: Record<string, number>
  trustScoreBefore: number
  trustScoreAfter: number
  trustDelta: number
  generatedAt: string     // ISO 8601
  signature: string       // HMAC-SHA256(payload, STVOR_SECRET)
}

// Подпись:
const payload = JSON.stringify({ ...receipt, signature: undefined })
signature = HMAC-SHA256(payload, process.env.STVOR_SECRET)

// Верификация (live в демо):
isValid = HMAC-SHA256(payload, STVOR_SECRET) === signature
```

---

## Три агента для демо

```typescript
// lib/agents/personas.ts
export const AGENT_PERSONAS = [
  {
    id: 'copywriter-pro',
    name: 'CopyPro-7',
    specialty: 'B2B SaaS copywriting',
    strategy: 'quality',        // высокая цена, высокое качество
    base_price_cents: 4500,     // $45
    trust_score: 78.0,
    systemPrompt: `You are CopyPro-7, a specialist B2B SaaS copywriter.
    You always include: headline, 3 specific benefits, pricing section, CTA.
    Write professional, conversion-focused copy.`
  },
  {
    id: 'landing-ai',
    name: 'LandingAI',
    specialty: 'Landing page optimization',
    strategy: 'balanced',       // средняя цена, хорошее качество
    base_price_cents: 2800,     // $28
    trust_score: 65.0,
    systemPrompt: `You are LandingAI, optimized for landing pages.
    Focus on clarity, value proposition, and conversion.`
  },
  {
    id: 'prose-bot',
    name: 'ProseBot',
    specialty: 'General writing',
    strategy: 'price',          // низкая цена, среднее качество
    base_price_cents: 1500,     // $15
    trust_score: 54.0,
    systemPrompt: `You are ProseBot, a general-purpose writing assistant.
    Write engaging content based on the brief provided.`
  }
]
```

---

## Demo Task (hardcoded для надёжности)

```typescript
// lib/demo/runner.ts
const DEMO_TASK = {
  description: `Write landing page copy for "DataFlow" — a B2B SaaS analytics 
  tool targeting data engineering teams at mid-size tech companies.
  The product automates data pipeline monitoring and reduces incident response time.`,

  evaluation_criteria: [
    {
      name: "Value Proposition Headline",
      description: "Has a clear headline communicating the core value for data teams",
      weight: 0.25
    },
    {
      name: "Three Specific Benefits",
      description: "Lists at least 3 concrete, specific benefits for data engineers",
      weight: 0.30
    },
    {
      name: "Pricing Section",
      description: "Includes a pricing section or mentions pricing tiers",
      weight: 0.20
    },
    {
      name: "Call to Action",
      description: "Has at least one clear, action-oriented CTA button text",
      weight: 0.15
    },
    {
      name: "B2B Professional Tone",
      description: "Maintains professional tone appropriate for enterprise buyers",
      weight: 0.10
    }
  ],

  budget_cents: 10000  // $100 budget — все три агента получают ниже
}
```

---

## SSE Events (real-time stream)

```typescript
// lib/events.ts
type StvorEvent =
  | { type: 'CONTRACT_CREATED';   data: { contractId; taskDescription; budgetCents } }
  | { type: 'ESCROW_FUNDED';      data: { contractId; amount; paymentIntentId } }
  | { type: 'BID_SUBMITTED';      data: { contractId; agentId; agentName; priceCents } }
  | { type: 'WORK_DELIVERED';     data: { bidId; agentId; agentName; workPreview } }
  | { type: 'JUDGE_STARTED';      data: { contractId } }
  | { type: 'BID_SCORED';         data: { bidId; agentId; judgeScore; breakdown } }
  | { type: 'WINNER_SELECTED';    data: { contractId; winnerId; winnerName; score } }
  | { type: 'ESCROW_RELEASED';    data: { contractId; agentId; amountCents } }
  | { type: 'TRUST_UPDATED';      data: { agentId; agentName; before; after; delta } }
  | { type: 'RECEIPT_GENERATED';  data: TrustReceipt }
  | { type: 'DEMO_COMPLETE';      data: { contractId } }
```

---

## API Endpoints — детали

### POST /api/demo/run
Запускает весь demo flow автоматически.
```typescript
// Внутри runner.ts — последовательность:
1. createContract(DEMO_TASK)          → emit CONTRACT_CREATED
2. fundEscrow(contractId)             → emit ESCROW_FUNDED
3. parallel: workers[0,1,2].bid()    → emit BID_SUBMITTED ×3
4. parallel: workers[0,1,2].doWork() → emit WORK_DELIVERED ×3
5. judgeAgent.evaluateAll(bids)       → emit JUDGE_STARTED, BID_SCORED ×3
6. selectWinner(bids)                 → emit WINNER_SELECTED
7. stripe.releaseEscrow(winner)       → emit ESCROW_RELEASED
8. updateTrustScores(allAgents)       → emit TRUST_UPDATED ×3
9. generateReceipt(winner)            → emit RECEIPT_GENERATED
10. logAudit()                        → emit DEMO_COMPLETE
```

### GET /api/events
SSE stream. Клиент подключается один раз, получает все события.

### GET /api/agents
Возвращает всех агентов с текущим Trust Score, Revenue, Contracts.

---

## UI — 6 экранов demo

### Экран 0: Dashboard
```
┌─────────────────────────────────────────────────┐
│  STVOR  Trust Layer for Agent Commerce          │
│                                                  │
│  Total Volume  Active Contracts  Agents          │
│  $0            0                 3               │
│                                                  │
│  ┌────────────────────────────────────────────┐  │
│  │ # Agent      Trust  Revenue  Contracts     │  │
│  │ 1 CopyPro-7  78.0   $0       0             │  │
│  │ 2 LandingAI  65.0   $0       0             │  │
│  │ 3 ProseBot   54.0   $0       0             │  │
│  └────────────────────────────────────────────┘  │
│                                                  │
│  [▶ Run Demo]                                    │
└─────────────────────────────────────────────────┘
```

### Экран 1: Contract Created
```
CEO Agent → Task Published
"Write landing page copy for DataFlow..."
Budget: $100 | Task Hash: a73c8f...
Status: OPEN
```

### Экран 2: Escrow Funded
```
Stripe PaymentIntent: pi_3QxY...
Amount: $100.00 locked
Status: FUNDED ●
```

### Экран 3: Bidding (анимированный)
```
Agents competing:
CopyPro-7  ████████ $45  Trust 78
LandingAI  ████████ $28  Trust 65
ProseBot   ████████ $15  Trust 54
```

### Экран 4: Judge Scoring (live progress bars)
```
Judge Agent evaluating...

CopyPro-7:
  Value Proposition  ████████████ 95
  Three Benefits     █████████░░░ 88
  Pricing Section    ██████████░░ 90
  CTA                ████████████ 95
  B2B Tone           ████████░░░░ 80
  TOTAL: 90.2

LandingAI: ...
ProseBot:  ...
```

### Экран 5: Payment Release
```
Winner: CopyPro-7 (Score: 90.2)
Stripe Transfer: $45.00 released
Escrow: COMPLETE ✓

Trust Score Updates:
CopyPro-7  78.0 → 82.4  (+4.4)  ✓
LandingAI  65.0 → 63.8  (-1.2)
ProseBot   54.0 → 52.1  (-1.9)
```

### Экран 6: Trust Receipt
```
┌──────────────────────────────────────────┐
│  STVOR TRUST RECEIPT #001                │
│                                          │
│  Contract: #a73c8f...                   │
│  Agent:    CopyPro-7                     │
│  Task:     a73c8f...b21d [SHA256]        │
│  Work:     9f4e2a...c83b [SHA256]        │
│  Escrow:   RELEASED ✓                   │
│  Judge:    90.2 / 100                   │
│  Trust:    78.0 → 82.4 (+4.4)          │
│  Date:     2026-06-24T14:32:01Z         │
│                                          │
│  Signature: 8f3c2a1b...                 │
│  ✓ Verified by Stvor                    │
└──────────────────────────────────────────┘
```

---

## TO DO LIST — по дням

### День 1 (сегодня) — Infrastructure
- [ ] Next.js config (tsconfig, tailwind)
- [ ] SQLite schema + client.ts
- [ ] Seed 3 агентов в БД
- [ ] Stripe client init + createPaymentIntent
- [ ] SSE events system (lib/events.ts)
- [ ] SHA256 + HMAC crypto utils

### День 2 — Agents
- [ ] Worker Agent (Claude API, принимает persona + task → возвращает текст)
- [ ] Judge Agent (Claude API, принимает task + criteria + work → возвращает JSON scores)
- [ ] CEO Agent (выбирает winner по judge score)
- [ ] Demo runner orchestrator (весь flow, последовательный)

### День 3 — Commerce
- [ ] Escrow state machine (transitions + validation)
- [ ] Trust Score computation (формула + обновление в БД)
- [ ] Trust Receipt generation + HMAC signature
- [ ] API routes (/api/demo/run, /api/agents, /api/events)

### День 4 — UI
- [ ] Dashboard + Agent Leaderboard
- [ ] Demo Flow компонент (6 шагов, анимации)
- [ ] SSE хук (useDemoEvents)
- [ ] Trust Receipt modal
- [ ] Live Feed (audit log на экране)

### День 5 — Polish
- [ ] Hardcode seed данных для leaderboard (несколько прошлых контрактов)
- [ ] Animate Trust Score update (число плавно меняется)
- [ ] Mobile-friendly layout
- [ ] Demo recording
- [ ] README + submission writeup

---

## Ключевые реализации — детально

### lib/commerce/escrow.ts
```typescript
type EscrowStatus = 'OPEN' | 'FUNDED' | 'SUBMITTED' | 'COMPLETE' | 'DISPUTED'

const TRANSITIONS: Record<EscrowStatus, EscrowStatus[]> = {
  OPEN:      ['FUNDED'],
  FUNDED:    ['SUBMITTED', 'DISPUTED'],
  SUBMITTED: ['COMPLETE', 'DISPUTED'],
  COMPLETE:  [],
  DISPUTED:  [],
}

function transition(current: EscrowStatus, next: EscrowStatus): EscrowStatus {
  if (!TRANSITIONS[current].includes(next)) {
    throw new Error(`Invalid transition: ${current} → ${next}`)
  }
  return next
}
```

### lib/agents/judge.ts
```typescript
// Judge prompt template
const JUDGE_PROMPT = (task, criteria, work) => `
You are an impartial Judge Agent. Evaluate the delivered work against each criterion.

TASK: ${task}

WORK DELIVERED:
${work}

EVALUATION CRITERIA:
${criteria.map(c => `- ${c.name} (weight: ${c.weight}): ${c.description}`).join('\n')}

Return JSON only:
{
  "scores": {
    "criterion_name": <number 0-100>
  },
  "reasoning": "<one sentence per criterion>",
  "total": <weighted average 0-100>
}
`
```

### lib/commerce/trust-score.ts
```typescript
function computeTrustScore(agent: Agent): number {
  const escrowRate = agent.successful_contracts / Math.max(agent.total_contracts, 1)
  const judgeRate  = agent.avg_judge_score / 100
  const reliability = agent.reliability_score

  return 100 * (0.40 * escrowRate + 0.40 * judgeRate + 0.20 * reliability)
}

function updateAfterContract(agent: Agent, judgeScore: number, success: boolean): {
  newScore: number
  delta: number
} {
  const newAgent = {
    ...agent,
    total_contracts: agent.total_contracts + 1,
    successful_contracts: success ? agent.successful_contracts + 1 : agent.successful_contracts,
    avg_judge_score: (agent.avg_judge_score * agent.total_contracts + judgeScore) / (agent.total_contracts + 1),
  }
  const newScore = computeTrustScore(newAgent)
  return { newScore, delta: newScore - agent.trust_score }
}
```

---

## Питч для судей — готовый текст

**10 секунд:**
> AI agents can spend money. They cannot trust each other. We built the trust layer.

**60 секунд:**
> Watch three AI agents compete for a real contract. They bid on price, deliver work,
> and a Judge Agent scores quality against explicit criteria. Stripe escrow releases
> automatically to the winner. Every interaction updates a portable Trust Score.

**90 секунд:**
> This is the credit system for AI agents. The same way FICO scores enabled the
> mortgage market, Stvor Trust Scores enable autonomous agent commerce at scale.
> We are building the operating layer for agent economies.

**На вопрос "почему не смарт-контракт":**
> Smart contracts move money. Stvor manages trust between autonomous parties
> before money moves — on real fiat rails through Stripe.

**На вопрос "почему не Stripe":**
> Stripe solves payment routing. Stvor solves agent identity, reputation,
> and verified deliverable attestation. We sit above Stripe, not beside it.
