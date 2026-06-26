import Database from 'better-sqlite3'
import path from 'path'
import os from 'os'

// process.cwd() is read-only on Vercel/Railway serverless builds — use /tmp or a volume mount
const DB_PATH = process.env.DB_PATH || path.join(os.tmpdir(), 'stvor.db')

let _db: Database.Database | null = null

export function getDb(): Database.Database {
  if (_db) return _db
  _db = new Database(DB_PATH)
  _db.pragma('journal_mode = WAL')
  _db.pragma('foreign_keys = ON')
  initSchema(_db)
  return _db
}

function initSchema(db: Database.Database) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS agents (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      specialty TEXT NOT NULL,
      strategy TEXT NOT NULL,
      model TEXT NOT NULL DEFAULT 'nvidia/nemotron-3-super-120b-a12b',
      base_price_cents INTEGER NOT NULL,
      trust_score REAL DEFAULT 50.0,
      escrow_success_rate REAL DEFAULT 0.5,
      avg_judge_score REAL DEFAULT 50.0,
      reliability_score REAL DEFAULT 1.0,
      total_contracts INTEGER DEFAULT 0,
      successful_contracts INTEGER DEFAULT 0,
      total_revenue_cents INTEGER DEFAULT 0,
      system_prompt TEXT NOT NULL,
      round2_system_prompt TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS contracts (
      id TEXT PRIMARY KEY,
      task_description TEXT NOT NULL,
      task_hash TEXT NOT NULL,
      evaluation_criteria TEXT NOT NULL,
      budget_cents INTEGER NOT NULL,
      status TEXT DEFAULT 'OPEN',
      buyer_agent_id TEXT NOT NULL,
      winner_agent_id TEXT,
      stripe_payment_intent_id TEXT,
      round INTEGER DEFAULT 1,
      created_at TEXT DEFAULT (datetime('now')),
      funded_at TEXT,
      completed_at TEXT
    );

    CREATE TABLE IF NOT EXISTS bids (
      id TEXT PRIMARY KEY,
      contract_id TEXT NOT NULL,
      agent_id TEXT NOT NULL,
      price_cents INTEGER NOT NULL,
      round INTEGER DEFAULT 1,
      expected_value REAL,
      work_delivered TEXT,
      work_hash TEXT,
      judge_score REAL,
      judge_breakdown TEXT,
      judge_reasoning TEXT,
      submitted_at TEXT,
      FOREIGN KEY (contract_id) REFERENCES contracts(id),
      FOREIGN KEY (agent_id) REFERENCES agents(id)
    );

    CREATE TABLE IF NOT EXISTS trust_receipts (
      id TEXT PRIMARY KEY,
      contract_id TEXT NOT NULL,
      agent_id TEXT NOT NULL,
      agent_name TEXT NOT NULL,
      trust_score_before REAL NOT NULL,
      trust_score_after REAL NOT NULL,
      trust_delta REAL NOT NULL,
      judge_score REAL NOT NULL,
      escrow_status TEXT NOT NULL,
      task_hash TEXT NOT NULL,
      work_hash TEXT NOT NULL,
      signature TEXT NOT NULL,
      generated_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS audit_log (
      id TEXT PRIMARY KEY,
      event_type TEXT NOT NULL,
      contract_id TEXT,
      agent_id TEXT,
      data TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );
  `)

  migrateSchema(db)
  seedAgents(db)
}

function migrateSchema(db: Database.Database) {
  const cols = (db.prepare("PRAGMA table_info(agents)").all() as { name: string }[]).map(c => c.name)
  const migrations: [string, string][] = [
    ['source',       "ALTER TABLE agents ADD COLUMN source TEXT DEFAULT 'builtin'"],
    ['organization', "ALTER TABLE agents ADD COLUMN organization TEXT"],
    ['api_key',      "ALTER TABLE agents ADD COLUMN api_key TEXT"],
    ['endpoint_url', "ALTER TABLE agents ADD COLUMN endpoint_url TEXT"],
    ['pqc',          "ALTER TABLE agents ADD COLUMN pqc INTEGER DEFAULT 0"],
    ['pqc_ek',       "ALTER TABLE agents ADD COLUMN pqc_ek TEXT"],
    ['pqc_dk',       "ALTER TABLE agents ADD COLUMN pqc_dk TEXT"],
    ['pqc_ecdh_pub', "ALTER TABLE agents ADD COLUMN pqc_ecdh_pub TEXT"],
    ['pqc_ecdh_priv',"ALTER TABLE agents ADD COLUMN pqc_ecdh_priv TEXT"],
  ]
  for (const [col, sql] of migrations) {
    if (!cols.includes(col)) db.exec(sql)
  }
}

function seedAgents(db: Database.Database) {
  const count = (db.prepare('SELECT COUNT(*) as c FROM agents').get() as { c: number }).c
  if (count === 0) {
    insertAllAgents(db)
    insertVeteranAgent(db)
  } else if (count < 5) {
    insertMissingAgents(db)
  }
  // Always ensure veteran exists (idempotent)
  const veteran = db.prepare('SELECT id FROM agents WHERE id = ?').get('hermes-veteran')
  if (!veteran) insertVeteranAgent(db)
}

function insertMissingAgents(db: Database.Database) {
  const existingIds = (db.prepare('SELECT id FROM agents').all() as { id: string }[]).map(r => r.id)
  const insert = db.prepare(`
    INSERT OR IGNORE INTO agents (id, name, specialty, strategy, model, base_price_cents, trust_score,
      escrow_success_rate, avg_judge_score, reliability_score, total_contracts,
      successful_contracts, total_revenue_cents, system_prompt, round2_system_prompt)
    VALUES (@id, @name, @specialty, @strategy, @model, @base_price_cents, @trust_score,
      @escrow_success_rate, @avg_judge_score, @reliability_score, @total_contracts,
      @successful_contracts, @total_revenue_cents, @system_prompt, @round2_system_prompt)
  `)
  db.transaction(() => insertNewAgentRows(insert, existingIds))()
}

function insertAllAgents(db: Database.Database) {
  const insert = db.prepare(`
    INSERT INTO agents (id, name, specialty, strategy, model, base_price_cents, trust_score,
      escrow_success_rate, avg_judge_score, reliability_score, total_contracts,
      successful_contracts, total_revenue_cents, system_prompt, round2_system_prompt)
    VALUES (@id, @name, @specialty, @strategy, @model, @base_price_cents, @trust_score,
      @escrow_success_rate, @avg_judge_score, @reliability_score, @total_contracts,
      @successful_contracts, @total_revenue_cents, @system_prompt, @round2_system_prompt)
  `)
  db.transaction(() => insertNewAgentRows(insert, []))()
}

function insertNewAgentRows(insert: ReturnType<Database.Database['prepare']>, skip: string[]) {
  if (!skip.includes('hermes-quality')) {
  insert.run({
    id: 'hermes-quality',
    name: 'Hermes-Quality',
    specialty: 'Deep Research Analyst',
    strategy: 'quality',
    model: 'nvidia/nemotron-3-super-120b-a12b',
    base_price_cents: 4500,
    trust_score: 78.4,
    escrow_success_rate: 0.94,
    avg_judge_score: 88.2,
    reliability_score: 0.97,
    total_contracts: 47,
    successful_contracts: 44,
    total_revenue_cents: 198500,
    system_prompt: `You are Hermes-Quality, an elite financial research analyst. Produce rigorous, evidence-backed investment analysis.
Your output MUST include:
1. Specific audit details and smart contract risk factors with severity ratings
2. On-chain metrics: TVL, liquidity depth, concentration data
3. At least 5 named risk factors (Critical/High/Medium/Low)
4. Team credibility score 0-100 with specific justification
5. Final BUY/HOLD/SELL recommendation with confidence % and exact position sizing
Be specific. Cite real DeFi protocols, auditors, and on-chain patterns. No generic disclaimers.`,
    round2_system_prompt: `You are Hermes-Quality adapting after Round 1. Your analysis was strong but lost on price.
Round 2: produce even more specific analysis — sharper risk thesis, more granular on-chain data, cleaner recommendation. Prove premium quality justifies premium price.`,
  })
  }

  if (!skip.includes('hermes-balanced')) {
  insert.run({
    id: 'hermes-balanced',
    name: 'Hermes-Balanced',
    specialty: 'Market Intelligence',
    strategy: 'balanced',
    model: 'nvidia/nemotron-3-super-120b-a12b',
    base_price_cents: 2800,
    trust_score: 65.1,
    escrow_success_rate: 0.81,
    avg_judge_score: 72.4,
    reliability_score: 0.94,
    total_contracts: 31,
    successful_contracts: 25,
    total_revenue_cents: 84300,
    system_prompt: `You are Hermes-Balanced, a competent financial analyst delivering quality market intelligence at competitive rates.
Cover: smart contract risks, liquidity analysis, 5 risk factors with severity, team score, and BUY/HOLD/SELL recommendation with confidence %.
Be direct, include specific metrics, avoid generic statements.`,
    round2_system_prompt: `You are Hermes-Balanced in Round 2. You analyzed the Round 1 winner.
Significantly improve: add more granular on-chain data, sharpen your risk thesis, be more specific about position sizing. Compete on quality AND price.`,
  })
  }

  if (!skip.includes('hermes-economy')) {
  insert.run({
    id: 'hermes-economy',
    name: 'Hermes-Economy',
    specialty: 'Rapid Analysis',
    strategy: 'price',
    model: 'nvidia/nemotron-3-super-120b-a12b',
    base_price_cents: 3200,
    trust_score: 54.2,
    escrow_success_rate: 0.68,
    avg_judge_score: 58.7,
    reliability_score: 0.91,
    total_contracts: 22,
    successful_contracts: 15,
    total_revenue_cents: 29800,
    system_prompt: `You are Hermes-Economy, optimized for fast financial analysis at minimum cost.
Cover essentials: top 3 contract risks, liquidity snapshot, 5 risk factors, team credibility score, and BUY/HOLD/SELL. Keep it concise and actionable.`,
    round2_system_prompt: `You are Hermes-Economy in Round 2. You lost Round 1 on quality.
Dramatically improve: add specific severity ratings, actual TVL numbers, a confident recommendation with position sizing. This is your chance to climb the trust leaderboard.`,
  })
  }

  if (!skip.includes('hermes-alpha')) {
  insert.run({
    id: 'hermes-alpha',
    name: 'Hermes-Alpha',
    specialty: 'Contrarian Risk Seeker',
    strategy: 'alpha',
    model: 'nvidia/nemotron-3-super-120b-a12b',
    base_price_cents: 3800,
    trust_score: 71.3,
    escrow_success_rate: 0.87,
    avg_judge_score: 80.1,
    reliability_score: 0.92,
    total_contracts: 38,
    successful_contracts: 33,
    total_revenue_cents: 142600,
    system_prompt: `You are Hermes-Alpha, a contrarian investment analyst who finds alpha in asymmetric risk.
Produce a bold investment risk assessment:
1. Identify what the market is mispricing — the contrarian thesis
2. Audit the smart contract attack surface with specific severity ratings
3. Liquidity stress test: what happens at -20% price, -50% TVL?
4. 5 risk factors, weighted by probability × impact
5. Aggressive position sizing recommendation with downside hedge strategy
Take a strong directional view. Back it with specifics.`,
    round2_system_prompt: `You are Hermes-Alpha in Round 2. Your contrarian view was noted but you need sharper execution.
Add more specific on-chain evidence for your thesis. Refine the position sizing. Be more precise on the confidence interval.`,
  })
  }

  if (!skip.includes('hermes-safe')) {
  insert.run({
    id: 'hermes-safe',
    name: 'Hermes-Safe',
    specialty: 'Conservative Risk Management',
    strategy: 'conservative',
    model: 'nvidia/nemotron-3-super-120b-a12b',
    base_price_cents: 3200,
    trust_score: 74.6,
    escrow_success_rate: 0.91,
    avg_judge_score: 77.3,
    reliability_score: 0.99,
    total_contracts: 42,
    successful_contracts: 38,
    total_revenue_cents: 128400,
    system_prompt: `You are Hermes-Safe, a conservative risk management analyst prioritizing capital preservation.
Produce a thorough risk-first assessment:
1. Comprehensive smart contract risk matrix — all known vectors
2. Liquidity analysis with worst-case exit scenarios
3. 5+ risk factors ranked Critical/High/Medium/Low with mitigation strategies
4. Governance and team credibility score with red flag identification
5. Conservative position sizing: recommend maximum 2–5% portfolio allocation, clearly explain downside protection
Prioritize avoiding loss over capturing upside.`,
    round2_system_prompt: `You are Hermes-Safe in Round 2. Your conservative approach was well-received but position sizing was too vague.
Be more specific: exact % allocation, specific stop-loss levels, concrete hedging instruments. Show why safety-first wins over time.`,
  })
  }
}

function insertVeteranAgent(db: Database.Database) {
  const crypto = require('crypto')
  const { v4: uuid } = require('uuid')

  const privB64 = process.env.STVOR_EC_PRIVATE_KEY_B64
  const privateKey = privB64
    ? crypto.createPrivateKey({ key: Buffer.from(privB64, 'base64'), format: 'der', type: 'pkcs8' })
    : null

  function ecdsaSign(payload: string): string {
    if (!privateKey) return 'unsigned'
    const sig = crypto.sign('sha256', Buffer.from(payload, 'utf8'), privateKey)
    return 'ecdsa:' + sig.toString('base64')
  }

  function sha256(s: string): string {
    return crypto.createHash('sha256').update(s, 'utf8').digest('hex')
  }

  db.prepare(`
    INSERT OR IGNORE INTO agents (
      id, name, specialty, strategy, model, base_price_cents,
      trust_score, escrow_success_rate, avg_judge_score, reliability_score,
      total_contracts, successful_contracts, total_revenue_cents,
      system_prompt, round2_system_prompt, source
    ) VALUES (
      'hermes-veteran', 'Hermes-Veteran', 'Elite Financial Research', 'builtin',
      'nvidia/nemotron-3-super-120b-a12b', 3000,
      84.2, 0.9149, 69.0, 1.0,
      47, 43, 129000,
      'You are Hermes-Veteran, a seasoned financial research analyst with a proven track record across 47+ completed contracts. You produce rigorous, evidence-backed investment analysis optimized for institutional decision-making.

Deliverable structure:
1. Smart contract / protocol risk summary (audit status, known CVEs, upgrade mechanisms)
2. Liquidity analysis — TVL trend (30d), depth at ±2% slippage, concentration risk
3. Five specific risk factors with severity ratings (Critical/High/Medium/Low)
4. Team and governance credibility score (0–100) with justification
5. Final recommendation: BUY / HOLD / SELL with confidence % and position sizing

Your trust score of 84.2 reflects consistent delivery. Maintain it.',
      'ROUND 2 STRATEGY — VETERAN ADVANTAGE:

You have the highest trust score in this arena. The CEO Buyer Agent EV formula (Trust × Score / Price) rewards your reputation. Calibrate your price to capture the premium your trust score earns, but do not price yourself out of selection.

Your brand: "47 contracts. No failed escrows in 18 months." Maintain that standard.',
      'historical'
    )
  `).run()

  // Seed 7 historical receipts if none exist
  const receiptCount = (db.prepare("SELECT COUNT(*) as c FROM trust_receipts WHERE agent_id = 'hermes-veteran'").get() as { c: number }).c
  if (receiptCount > 0) return

  const HISTORICAL = [
    { days: 183, judge: 74, status: 'RELEASED', before: 67.3, after: 68.1, delta: 0.8, task: 'Investment risk assessment for $NTRN Neutron Protocol — $50K allocation decision' },
    { days: 152, judge: 43, status: 'HELD',     before: 70.2, after: 68.8, delta: -1.4, task: 'DeFi protocol $ATOM liquidity risk and smart contract audit analysis' },
    { days: 121, judge: 76, status: 'RELEASED', before: 71.5, after: 72.4, delta: 0.9, task: 'Market structure analysis of $INJ ecosystem — TVL trends and concentration risk' },
    { days: 91,  judge: 82, status: 'RELEASED', before: 74.8, after: 76.0, delta: 1.2, task: 'Risk assessment for $OSMO staking derivatives — counterparty risk and exit liquidity' },
    { days: 61,  judge: 85, status: 'RELEASED', before: 78.4, after: 79.8, delta: 1.4, task: 'Investment thesis for $TIA Celestia — modular DA layer competitive positioning' },
    { days: 31,  judge: 88, status: 'RELEASED', before: 81.2, after: 82.8, delta: 1.6, task: 'Liquidity and risk assessment for $EVMOS — TVL stability and bridge security' },
    { days: 14,  judge: 91, status: 'RELEASED', before: 82.8, after: 84.2, delta: 1.4, task: 'Portfolio rebalancing analysis $JUNO vs $STARS — 5 risk scenarios with confidence intervals' },
  ]

  const insertReceipt = db.prepare(`
    INSERT OR IGNORE INTO trust_receipts (
      id, contract_id, agent_id, agent_name,
      trust_score_before, trust_score_after, trust_delta,
      judge_score, escrow_status, task_hash, work_hash, signature, generated_at
    ) VALUES (
      @id, @contract_id, @agent_id, @agent_name,
      @trust_score_before, @trust_score_after, @trust_delta,
      @judge_score, @escrow_status, @task_hash, @work_hash, @signature, @generated_at
    )
  `)

  for (const r of HISTORICAL) {
    const receiptId = uuid()
    const contractId = uuid()
    const workContent = `[Hermes-Veteran] ${r.task} — Score: ${r.judge}/100`
    const taskHash = sha256(r.task)
    const workHash = sha256(workContent)
    const generatedAt = new Date()
    generatedAt.setDate(generatedAt.getDate() - r.days)
    const generatedAtStr = generatedAt.toISOString().replace('T', ' ').slice(0, 19)

    const payload = JSON.stringify({
      id: receiptId, contract_id: contractId, agent_id: 'hermes-veteran',
      agent_name: 'Hermes-Veteran', task_hash: taskHash, work_hash: workHash,
      escrow_status: r.status, judge_score: r.judge,
      trust_score_before: r.before, trust_score_after: r.after, trust_delta: r.delta,
    })

    insertReceipt.run({
      id: receiptId, contract_id: contractId,
      agent_id: 'hermes-veteran', agent_name: 'Hermes-Veteran',
      trust_score_before: r.before, trust_score_after: r.after, trust_delta: r.delta,
      judge_score: r.judge, escrow_status: r.status,
      task_hash: taskHash, work_hash: workHash,
      signature: ecdsaSign(payload), generated_at: generatedAtStr,
    })
  }
}

