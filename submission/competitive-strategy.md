# Stvor — Competitive Strategy After Seeing the Field
**Office Hours Output · June 25, 2026**

---

## What the Competition Tells Us

### Strongest threats (honest ranking)

**#1 HermesCo** — Real $25 card, real GPU rental ($0.002131 for 9.598s of L4), real net profit +$24.99, on camera. Every judge will remember "I watched an AI make $24.99 in 90 seconds." That's the bar.

**#2 StoryPrompting Agent** — Fully autonomous film pipeline. Deliverable is a physical artifact (a video). Real Stripe authorize+capture (not off-the-shelf Stripe Skills — they built it). NemoClaw sandbox. Has a thing to show at the end.

**#3 OpsForge** — $100 budget, 47 decisions, 0 human interventions. Clean KPIs that write themselves into a judge's notes.

**#4 VentureOS** — Live domain, pricing page, polish. Judges click the link, it loads.

**#5 AntHill** — Governance layer for agent swarms with ~63% cost reduction claim. Closest to Stvor's category (infrastructure vs app).

### Where Stvor wins (the honest list)

1. **The attack demo** — Nobody else shows an adversarial scenario. Zero. HermesCo shows profit. StoryPrompting shows creation. Stvor shows PREVENTION. Unique.

2. **SHA-256 task commitment** — Not policy gates, not budget limits: mathematical proof that the task wasn't changed. This is a different primitive than anything else in the field.

3. **Trust receipts** — Portable, HMAC-signed proof of completion. HermesCo and OpsForge settle payments but don't issue receipts an agent can carry to the next transaction.

4. **Infrastructure angle** — All these apps are APPLICATIONS. Stvor is MIDDLEWARE. This is harder to explain but harder to copy.

### Where Stvor is losing right now

1. **Localhost** — VentureOS has ventureos.com. HermesCo has hermesco.ai. Stvor has `npm run dev`. Judges will not do `npm install`.

2. **Abstract metrics** — "Trust score 77.5" doesn't compete with "$24.99 net profit, 9.598s of GPU time." Both are numbers. Only one is visceral.

3. **Demo order is wrong** — Happy path first means you look like 15 other projects before you get to the part that makes you unique.

4. **The middleware pitch is abstract** — "Trust layer" sounds like a security whitepaper. Needs to be reframed in terms judges feel.

---

## The Three Premises That Must Change

### Premise 1: Lead with the attack, not the happy path

**Before:** Happy path demo (3 agents, 2 rounds, NVIDIA) → attack demo

**After:** Attack demo first → "Here's how Stvor prevents this. Now watch the happy path, fully attested."

Why: The attack is the only thing no one else has. Lead with your moat, not your feature.

Script change (first 30 seconds of video):
> "Every agent project in this hackathon has a critical vulnerability. Including mine — until I added Stvor."
> [Show attack: red events, ESCROW HELD, INVALID hash]
> "That's a tampered payload. An agent was told to execute a task that wasn't what the buyer signed."
> "Stvor caught it in < 1ms. Escrow held. Zero funds moved. Attack over."
> "Now let me show you the same economy running clean."

### Premise 2: Get a live URL before submission

Deploy to Vercel. 15 minutes if the env vars cooperate. Non-negotiable.

The judge friction of "clone the repo, install Node, set STVOR_SECRET" will kill you. Click a link or lose.

### Premise 3: Frame Stvor as the layer every other project needs

The meta-pitch: None of the other hackathon projects verify task payload integrity before execution. HermesCo autonomously rented a GPU — but nobody checked that the GPU rental instruction wasn't tampered with in transit. StoryPrompting ran a full film pipeline — but nobody attested the brief before the agent started generating.

This framing makes Stvor infrastructure, not a competitor.

Say it once in the video:
> "Every autonomous agent project here solves what agents DO. Stvor solves what agents can TRUST. You need both."

---

## Concrete Actions Before EOD June 30

### Today (June 25)

**[1] Restructure demo video script** (30 min)
Change the order: attack demo → attestation explained → happy path run.
New hook: "The $292M Bybit attack was a tampered instruction. So is this one. Watch Stvor catch it."

**[2] Add "Attacks Blocked" counter to the homepage** (45 min)
Next to the existing metrics ($3,330 volume, 136 contracts), add:
- `Attacks Blocked: 1` (increments with each tampered demo run)
- `Funds Protected: $100.00` (escrow amount from last attack demo)
- `Detection Time: < 1ms`

These compete with HermesCo's "$24.99 profit" on the same concreteness level.

**[3] Add "Why every agent needs Stvor" section to homepage** (1 hour)
One paragraph or visual below the hero:
"HermesCo autonomously rented a GPU. StoryPrompting autonomously produced a film. OpsForge made 47 decisions with no human. None of them verified the task wasn't changed before execution. Stvor does."
(Don't name specific projects — generic: "autonomous agents that spend money, render content, or make decisions")

### June 26-27

**[4] Deploy to public URL** (2-4 hours depending on NVIDIA/Stripe env var issues)
- Vercel (easiest) or Railway
- You'll need STVOR_SECRET, ANTHROPIC_API_KEY, NVIDIA_API_KEY, STRIPE keys in env
- Test: `/api/v1/attest/sign` and the demo run from the live URL

**[5] Update tweet and submission with live URL**
Replace all instances of "localhost:3000" with the real URL.

### June 28-29

**[6] Record the demo video**
Follow the restructured script: attack first, then happy path.
Key shots:
- The red events in live feed (attack blocked)
- The escrow modal showing HELD
- The ESCROW RELEASED in green after attestation passes
- The trust receipt modal
- The SDK code snippet (2-line integration)

**[7] Final submission check**
- GitHub repo public ✓
- README with setup instructions ✓  
- Demo video under 3 minutes ✓
- Tweet @nousresearch ✓
- Discord post ✓
- Typeform ✓

---

## The Pitch in 10 Seconds (memorize this)

**Version 1 (judge cold):**
> "Every agent project here shows what agents can DO. Stvor shows what agents can TRUST. Without attestation, any one of those autonomous decisions could be executing a tampered instruction. Stvor blocks it in < 1ms, holds the escrow, and issues a signed receipt. You need Stripe to pay. You need Stvor to trust."

**Version 2 (judge who saw HermesCo):**
> "HermesCo just showed you an agent making $24.99 autonomously. Beautiful. Now: what if the GPU rental instruction was tampered in transit? Without Stvor, the agent executes anyway. With Stvor, it stops, holds escrow, and alerts. That's the trust layer Stripe doesn't provide."

---

## What You Must NOT Do

1. **Do NOT add more features.** You have enough. Deploy what you have.
2. **Do NOT spend time polishing the agent leaderboard UI.** Judges want the attack demo, not design.
3. **Do NOT explain attestation before showing the attack.** Show, then explain.
4. **Do NOT compete with HermesCo on "real money."** Compete on safety — they make money, you protect it.

---

## Assignment (do this today)

Record a 90-second "attack demo only" clip — no happy path, no agents competing, just:
1. Show the tampered payload scenario (2 sentences narration)
2. Show Stvor catching it (the red live feed events)
3. Show escrow held, funds protected
4. Show the 2-line SDK that would have prevented it

Post this clip to Twitter before anything else. This clip is your competitive differentiator, not the full 2:30 demo. Get this clip in front of judges today.
