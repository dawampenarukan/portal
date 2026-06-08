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

echo "==> Prisma generate & push schema..."
npx prisma generate
npx prisma db push

echo "==> Seed data awal..."
npx prisma db seed

echo "==> Selesai! Jalankan npm run dev untuk melihat data live."
