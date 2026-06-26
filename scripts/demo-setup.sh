#!/bin/bash
# Pre-recording setup script — run once before recording the demo video
# Usage: APP_URL=https://your-deployment.railway.app ./scripts/demo-setup.sh

set -e

APP_URL="${1:-${APP_URL:-http://localhost:3000}}"

echo ""
echo "=== Stvor Demo Setup ==="
echo "Target: $APP_URL"
echo ""

# 1. Check Stripe mode
echo "--- Stripe status ---"
STATUS=$(curl -s "$APP_URL/api/status")
STRIPE_MODE=$(echo "$STATUS" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d['stripe']['mode'])" 2>/dev/null || echo "unknown")
echo "Stripe mode: $STRIPE_MODE"
if [ "$STRIPE_MODE" = "demo" ]; then
  echo "WARNING: Stripe is in demo mode (simulated payments)."
  echo "  → Set STRIPE_SECRET_KEY=sk_test_... in your Railway/Vercel env vars."
  echo "  → Then redeploy and re-run this script."
elif [ "$STRIPE_MODE" = "test" ]; then
  echo "OK: Stripe test mode active — real PaymentIntents, test cards. GOOD FOR RECORDING."
elif [ "$STRIPE_MODE" = "live" ]; then
  echo "OK: Stripe live mode active — REAL MONEY. Good for production, not demo recording."
fi

echo ""
# 2. Register Acme Research LLC external agent
echo "--- External agent (Acme Research LLC) ---"
SETUP=$(curl -s -X POST "$APP_URL/api/v1/external-agent/setup" \
  -H "Content-Type: application/json")
echo "$SETUP" | python3 -c "
import sys, json
d = json.load(sys.stdin)
if 'agentId' in d:
    print(f'Agent: {d[\"agentName\"]} ({d.get(\"organization\",\"\")})')
    print(f'ID:    {d[\"agentId\"]}')
    print(f'Trust: {d[\"trustScore\"]}')
    print(f'URL:   {d[\"endpointUrl\"]}')
    print(f'Status: {d[\"message\"]}')
else:
    print(json.dumps(d, indent=2))
" 2>/dev/null || echo "$SETUP"

echo ""
# 3. Verify external agent status
echo "--- Verifying external agent ---"
CHECK=$(curl -s "$APP_URL/api/v1/external-agent/setup")
echo "$CHECK" | python3 -c "
import sys, json
d = json.load(sys.stdin)
if d.get('registered'):
    print(f'OK: {d[\"agentName\"]} registered, trust_score={d[\"trustScore\"]}')
else:
    print('NOT REGISTERED:', json.dumps(d))
" 2>/dev/null || echo "$CHECK"

echo ""
# 4. Show recording checklist
echo "=== PRE-RECORDING CHECKLIST ==="
echo ""
echo "  STRIPE"
if [ "$STRIPE_MODE" = "test" ] || [ "$STRIPE_MODE" = "live" ]; then
  echo "  [OK] Stripe $STRIPE_MODE — real PaymentIntents visible in dashboard"
else
  echo "  [!!] Stripe demo mode — set STRIPE_SECRET_KEY=sk_test_... and redeploy"
fi
echo ""
echo "  TABS (open these before hitting record — do NOT type URLs during recording)"
echo "  Tab 1: $APP_URL/attack        ← Start recording here"
echo "  Tab 2: $APP_URL/demo          ← Switch here after attack demo"
echo "  Tab 3: Run a demo now, copy a receipt URL → open before recording"
echo ""
echo "  VIDEO ORDER"
echo "  Act 1 (0:00-0:50): /attack → click 'Simulate Attack' → narrate Bybit"
echo "  Act 2 (0:50-2:20): /demo   → click 'Run Economy Demo' → narrate each event"
echo "  Act 3 (2:20-2:35): Trust receipt modal or /receipts/:id tab"
echo ""
echo "  NARRATION CUES"
echo "  Look for 'Meridian (Acme Research)' in the demo — that's your external agent"
echo "  When WORK_DELIVERED shows 'webhook:...' — that's cross-operator delivery"
echo "  When ESCROW_RELEASED fires — wait 2 seconds, let it land"
echo ""
echo "Setup complete. You're ready to record."
