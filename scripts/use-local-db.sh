#!/usr/bin/env bash
# Kembali ke database PostgreSQL lokal (WSL) — hapus .env.local yang override
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

if [ -f ".env.local" ]; then
  rm -f ".env.local"
  echo "✓ .env.local dihapus — dev kembali pakai DATABASE_URL dari .env (localhost)."
else
  echo "Tidak ada .env.local — sudah memakai database lokal."
fi

echo ""
echo "Pastikan .env berisi:"
echo '  DATABASE_URL="postgresql://postgres:...@localhost:5432/sppg_penarukan2"'
echo '  NEXTAUTH_SECRET="..."'
echo '  NEXTAUTH_URL="http://localhost:3000"'
echo ""
echo "Jalankan: npm run dev"
