#!/usr/bin/env bash
# Tarik env production dari Vercel → .env.local
# Dev akan pakai DATABASE_URL production (sama dengan Vercel), NEXTAUTH_URL tetap localhost.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

ENV_FILE=".env.local"
ENV_SOURCE=".env"

echo "==> Menarik environment production dari Vercel ke ${ENV_FILE}..."

if ! command -v vercel >/dev/null 2>&1; then
  echo "Vercel CLI belum terpasang. Jalankan:"
  echo "  npm i -g vercel"
  echo "  vercel login"
  exit 1
fi

if [ ! -d ".vercel" ]; then
  echo "==> Menghubungkan project ke Vercel (portalpenarukan2)..."
  vercel link --yes
fi

vercel env pull "${ENV_FILE}" --environment=production --yes

# Hapus variabel kosong — jika tidak, akan override .env dengan string kosong
strip_empty() {
  local key="$1"
  if grep -qE "^${key}=\"\"$" "${ENV_FILE}" 2>/dev/null; then
    sed -i "/^${key}=/d" "${ENV_FILE}"
    echo "  (dihapus ${key} kosong dari ${ENV_FILE})"
  elif grep -qE "^${key}=$" "${ENV_FILE}" 2>/dev/null; then
    sed -i "/^${key}=/d" "${ENV_FILE}"
    echo "  (dihapus ${key} kosong dari ${ENV_FILE})"
  fi
}

for key in DATABASE_URL NEXTAUTH_SECRET AUTH_SECRET BLOB_READ_WRITE_TOKEN; do
  strip_empty "${key}"
done

# Hapus variabel build Vercel yang tidak diperlukan di dev lokal
grep -vE '^(VERCEL=|VERCEL_ENV=|VERCEL_URL=|VERCEL_TARGET_ENV=|VERCEL_OIDC_TOKEN=|VERCEL_GIT_|NX_DAEMON=|TURBO_)' \
  "${ENV_FILE}" > "${ENV_FILE}.tmp" && mv "${ENV_FILE}.tmp" "${ENV_FILE}"

# Auth redirect harus tetap localhost saat npm run dev
# Jangan set port spesifik jika dev bisa pindah port (3000/3002) — trustHost menangani ini
if grep -q '^NEXTAUTH_URL=' "${ENV_FILE}" 2>/dev/null; then
  sed -i '/^NEXTAUTH_URL=/d' "${ENV_FILE}"
fi
if grep -q '^AUTH_URL=' "${ENV_FILE}" 2>/dev/null; then
  sed -i '/^AUTH_URL=/d' "${ENV_FILE}"
fi

# Validasi DATABASE_URL
if ! grep -qE '^DATABASE_URL=.+$' "${ENV_FILE}" 2>/dev/null; then
  echo ""
  echo "⚠ DATABASE_URL tidak ada di Vercel production (atau tidak ter-pull)."
  echo "  Dev akan pakai DATABASE_URL dari .env (localhost)."
  echo ""
  echo "  Untuk pakai DB production, set di Vercel Dashboard:"
  echo "  Settings → Environment Variables → DATABASE_URL"
  echo "  Lalu jalankan ulang: npm run env:pull"
  echo ""
fi

# Validasi NEXTAUTH_SECRET
if ! grep -qE '^NEXTAUTH_SECRET=.+$' "${ENV_FILE}" 2>/dev/null; then
  if [ -f "${ENV_SOURCE}" ] && grep -qE '^NEXTAUTH_SECRET=.+$' "${ENV_SOURCE}"; then
    grep '^NEXTAUTH_SECRET=' "${ENV_SOURCE}" >> "${ENV_FILE}"
    echo "  (NEXTAUTH_SECRET diambil dari .env)"
  fi
fi

echo ""
echo "✓ Selesai! Cek ${ENV_FILE}"
echo "  NEXTAUTH_URL = http://localhost:3000"
echo ""
echo "Langkah berikutnya:"
echo "  npm run dev"
echo "  Buka http://localhost:3000/api/health"
