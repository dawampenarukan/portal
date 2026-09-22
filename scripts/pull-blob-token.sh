#!/usr/bin/env bash
# Tarik HANYA BLOB_READ_WRITE_TOKEN dari Vercel Production → .env.local
# Tidak menimpa DATABASE_URL / NEXTAUTH di .env.
#
# Pakai sekali di mesin developer agar upload cover (termasuk MP4)
# otomatis ke cloud dan tampil di production.

set -euo pipefail
cd "$(dirname "$0")/.."

TMP="$(mktemp)"
cleanup() { rm -f "$TMP"; }
trap cleanup EXIT

if command -v vercel >/dev/null 2>&1; then
  VERCEL_BIN=(vercel)
else
  VERCEL_BIN=(npx vercel)
fi

echo "→ Mengambil env production dari Vercel (sementara)…"
"${VERCEL_BIN[@]}" env pull "$TMP" --environment=production --yes

TOKEN_LINE="$(grep -E '^BLOB_READ_WRITE_TOKEN=' "$TMP" || true)"
if [[ -z "$TOKEN_LINE" ]]; then
  echo ""
  echo "✗ BLOB_READ_WRITE_TOKEN tidak ada di Vercel Production."
  echo "  Vercel → Storage → Blob Store → Connect Project → pastikan token terpasang."
  exit 1
fi

TOKEN_VALUE="${TOKEN_LINE#BLOB_READ_WRITE_TOKEN=}"
TOKEN_VALUE="${TOKEN_VALUE%\"}"
TOKEN_VALUE="${TOKEN_VALUE#\"}"
TOKEN_VALUE="${TOKEN_VALUE%\'}"
TOKEN_VALUE="${TOKEN_VALUE#\'}"

if [[ "$TOKEN_VALUE" == "[SENSITIVE]" ]] || [[ "$TOKEN_VALUE" == *SENSITIVE* ]] || [[ ! "$TOKEN_VALUE" == vercel_blob_rw_* ]]; then
  echo ""
  echo "✗ Token Blob tidak bisa dibaca otomatis."
  echo "  Penyebab: Vercel CLI menyembunyikan secret production sebagai [SENSITIVE]."
  echo "  Auto-pull tidak bisa dipakai untuk BLOB_READ_WRITE_TOKEN — salin manual sekali:"
  echo ""
  echo "  1. Buka Vercel Dashboard → Storage → Blob Store (project portalpenarukan2)"
  echo "  2. Buka tab .env.local (atau Environment Variables yang berisi BLOB_READ_WRITE_TOKEN)"
  echo "  3. Salin nilai yang diawali: vercel_blob_rw_"
  echo "  4. Tempel ke file .env.local di root project ini, contoh:"
  echo '     BLOB_READ_WRITE_TOKEN="vercel_blob_rw_..."'
  echo "  5. Restart: hentikan npm run dev, lalu jalankan lagi"
  echo ""
  echo "  Catatan: tanpa token, upload MP4 di lokal tetap bisa (disimpan ke /uploads),"
  echo "  tapi URL itu hanya di laptop — tidak tampil di website production."
  exit 1
fi

ENV_LOCAL=".env.local"
touch "$ENV_LOCAL"

if grep -qE '^BLOB_READ_WRITE_TOKEN=' "$ENV_LOCAL"; then
  # Ganti baris yang ada (portable: tulis ulang file)
  awk -v tok="$TOKEN_VALUE" '
    BEGIN { done=0 }
    /^BLOB_READ_WRITE_TOKEN=/ {
      print "BLOB_READ_WRITE_TOKEN=\"" tok "\""
      done=1
      next
    }
    { print }
    END {
      if (!done) print "BLOB_READ_WRITE_TOKEN=\"" tok "\""
    }
  ' "$ENV_LOCAL" > "${ENV_LOCAL}.tmp"
  mv "${ENV_LOCAL}.tmp" "$ENV_LOCAL"
else
  {
    echo ""
    echo "# Upload cloud (Vercel Blob) — diisi oleh: npm run env:blob"
    echo "BLOB_READ_WRITE_TOKEN=\"${TOKEN_VALUE}\""
  } >> "$ENV_LOCAL"
fi

echo ""
echo "✓ BLOB_READ_WRITE_TOKEN tersimpan di .env.local"
echo "  Restart dev server: hentikan npm run dev, lalu jalankan lagi."
echo "  Setelah itu, upload cover/video di form berita otomatis ke cloud."
