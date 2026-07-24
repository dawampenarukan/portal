#!/usr/bin/env bash
# Pastikan development memakai Postgres lokal (.env), bukan Neon via .env.local.
# .env.neon TIDAK dihapus — Next.js tidak memuatnya; file itu khusus db:deploy.
set -euo pipefail
cd "$(dirname "$0")/.."

if [ -f .env.local ]; then
  rm -f .env.local
  echo "✓ Menghapus .env.local (agar tidak menimpa DATABASE_URL lokal)"
  echo "Dev kembali ke DATABASE_URL di .env (Postgres lokal)."
else
  echo "Tidak ada .env.local — sudah memakai .env (localhost)."
fi

if [ -f .env.neon ]; then
  echo "ℹ .env.neon tetap ada (hanya untuk npm run db:deploy → Neon)."
fi
