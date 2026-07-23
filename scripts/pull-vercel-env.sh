# Tarik env production dari Vercel (opsional — jarang dipakai)
# Untuk dual-DB: biarkan .env = lokal; production tetap di Vercel dashboard.
# Jangan biarkan hasil pull menimpa .env lokal dengan Neon kecuali sengaja.
#
# Catatan: jika CLI menulis nilai "[SENSITIVE]", isi manual dari Neon/Vercel Reveal.

set -euo pipefail
cd "$(dirname "$0")/.."

if ! command -v vercel >/dev/null 2>&1 && ! command -v npx >/dev/null 2>&1; then
  echo "Butuh Vercel CLI: npm i -g vercel"
  exit 1
fi

echo "Pull env → .env.neon (untuk db:deploy saja; tidak mengubah .env lokal)"
if command -v vercel >/dev/null 2>&1; then
  vercel env pull .env.neon --environment=production --yes
else
  npx vercel env pull .env.neon --environment=production --yes
fi

if grep -q '\[SENSITIVE\]' .env.neon 2>/dev/null; then
  echo ""
  echo "⚠ File berisi [SENSITIVE] — bukan URL asli."
  echo "  Isi MANUAL DATABASE_URL + DIRECT_URL dari Neon Console ke .env.neon"
  echo "  Lalu: set -a && source .env.neon && set +a && npm run db:deploy"
  exit 1
fi

echo "✓ Siap. Deploy schema ke Neon:"
echo "  set -a && source .env.neon && set +a && npm run db:deploy"
