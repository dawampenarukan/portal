#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

echo "==> Menyiapkan user & database PostgreSQL..."
if command -v sudo >/dev/null 2>&1; then
  sudo -u postgres psql -c "ALTER USER postgres PASSWORD 'PasswordBaru123';" 2>/dev/null || true
  DB_EXISTS=$(sudo -u postgres psql -tAc "SELECT 1 FROM pg_database WHERE datname='sppg_penarukan2'" || echo "")
  if [ "$DB_EXISTS" != "1" ]; then
    sudo -u postgres psql -c "CREATE DATABASE sppg_penarukan2;"
  fi
else
  echo "sudo tidak tersedia — pastikan DATABASE_URL di .env sudah benar."
fi

# Prisma schema mewajibkan DIRECT_URL — lokal boleh sama dengan DATABASE_URL
if [ -f .env ] && ! grep -qE '^DIRECT_URL=.+$' .env; then
  if grep -qE '^DATABASE_URL=.+$' .env; then
    grep -E '^DATABASE_URL=' .env | head -1 | sed 's/^DATABASE_URL=/DIRECT_URL=/' >> .env
    echo "==> DIRECT_URL ditambahkan ke .env (salinan DATABASE_URL)"
  fi
fi

echo "==> Prisma generate & push schema..."
npm run db:generate
npm run db:push

echo "==> Seed data awal..."
npx prisma db seed

echo "==> Selesai! Jalankan npm run dev untuk melihat data live."
