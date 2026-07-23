#!/usr/bin/env bash
set -euo pipefail
source /home/sdwianto/Assignment/penarukan2/portal/.env
echo "=== REMOTE ${INVENTORY_APP_URL} ==="
curl -sS -w "\nHTTP:%{http_code}\n" -H "X-Api-Key: ${INVENTORY_API_KEY}" \
  "${INVENTORY_APP_URL}/api/fp-public/plans?from=2026-07-20&to=2026-08-02" || true
echo "=== LOCAL 127.0.0.1:3001 ==="
curl -sS -w "\nHTTP:%{http_code}\n" -H "X-Api-Key: ${INVENTORY_API_KEY}" \
  "http://127.0.0.1:3001/api/fp-public/plans?from=2026-07-20&to=2026-08-02" || true
