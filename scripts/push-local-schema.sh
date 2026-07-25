#!/usr/bin/env bash
# Push Prisma schema ke Postgres lokal (.env) — BUKAN Neon.
set -euo pipefail
cd "$(dirname "$0")/.."

if [ -f .env.local ]; then
  echo "Hapus .env.local dulu (npm run env:local) agar tidak bentrok."
  exit 1
fi

set -a
# shellcheck disable=SC1091
source .env
set +a

host="$(node -e "console.log(new URL(process.env.DATABASE_URL).hostname)")"
echo "Target: $host"
if [ "$host" != "localhost" ] && [ "$host" != "127.0.0.1" ]; then
  echo "DIBATALKAN: DATABASE_URL bukan localhost ($host)"
  exit 1
fi

pg_isready -h localhost -p 5432
npx prisma db push --accept-data-loss
echo "OK — schema lokal sudah sync (termasuk Publication.surveyId)."
