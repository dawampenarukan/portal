#!/usr/bin/env bash
# Pastikan development memakai Postgres lokal (.env), bukan Neon.
set -euo pipefail
cd "$(dirname "$0")/.."

removed=0
for f in .env.local .env.neon; do
  if [ -f "$f" ]; then
    rm -f "$f"
    echo "✓ Menghapus $f (agar tidak menimpa DATABASE_URL lokal)"
    removed=1
  fi
done

if [ "$removed" -eq 0 ]; then
  echo "Tidak ada .env.local / .env.neon — sudah memakai .env (localhost)."
else
  echo "Dev kembali ke DATABASE_URL di .env (Postgres lokal)."
fi
