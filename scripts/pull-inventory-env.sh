#!/usr/bin/env bash
# Tarik INVENTORY_APP_URL + INVENTORY_API_KEY dari Vercel Production → .env.local
# Pola sama dengan npm run env:blob — tidak menimpa DATABASE_URL di .env.
#
# Catatan: Vercel kadang mengembalikan [SENSITIVE] via CLI.
# Jika gagal, sync tetap bisa dari admin production (key ada di Vercel deploy).

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

read_var() {
  local key="$1"
  local line
  line="$(grep -E "^${key}=" "$TMP" || true)"
  if [[ -z "$line" ]]; then
    return 1
  fi
  local val="${line#*=}"
  val="${val%\"}"
  val="${val#\"}"
  val="${val%\'}"
  val="${val#\'}"
  printf '%s' "$val"
}

URL_VALUE="$(read_var INVENTORY_APP_URL || true)"
KEY_VALUE="$(read_var INVENTORY_API_KEY || true)"
KITCHEN_VALUE="$(read_var INVENTORY_KITCHEN_ID || true)"

is_bad() {
  local v="$1"
  [[ -z "$v" ]] || [[ "$v" == "[SENSITIVE]" ]] || [[ "$v" == *"SENSITIVE"* ]] || [[ "$v" == "sk_..." ]]
}

if is_bad "$URL_VALUE" || is_bad "$KEY_VALUE"; then
  echo ""
  echo "✗ Vercel CLI tidak mengembalikan nilai Inventory yang bisa dipakai (placeholder / kosong)."
  echo ""
  echo "  Key lama TIDAK perlu dibuat ulang jika sync dari production:"
  echo "  → Buka admin di website live (mis. https://www.sppgpenarukan2.id/admin/menu)"
  echo "  → Klik «Sync semua dari Inventory» di sana (env Vercel sudah terpasang)."
  echo ""
  echo "  Untuk npm run dev lokal, salin key yang SAMA (bukan key baru) dari:"
  echo "  • Inventory → Utiliti → API Keys → lihat daftar key aktif (prefix/label),"
  echo "    atau minta re-copy ke admin Inventory jika sistem mendukung;"
  echo "  • VPS/docker compose (PORTAL_INVENTORY_* di server production)."
  echo ""
  echo "  Lalu tempel manual ke .env.local:"
  echo '    INVENTORY_APP_URL="http://43.157.226.71:3001"'
  echo '    INVENTORY_API_KEY="sk_...key_yang_sudah_ada..."'
  echo "  Restart: npm run dev"
  exit 1
fi

ENV_LOCAL=".env.local"
touch "$ENV_LOCAL"

upsert_env_local() {
  local key="$1"
  local value="$2"
  if grep -qE "^${key}=" "$ENV_LOCAL"; then
    awk -v k="$key" -v v="$value" '
      BEGIN { done=0 }
      $0 ~ "^" k "=" {
        print k "=\"" v "\""
        done=1
        next
      }
      { print }
      END { if (!done) print k "=\"" v "\"" }
    ' "$ENV_LOCAL" > "${ENV_LOCAL}.tmp"
    mv "${ENV_LOCAL}.tmp" "$ENV_LOCAL"
  else
    echo "${key}=\"${value}\"" >> "$ENV_LOCAL"
  fi
}

if ! grep -q "# Sync Menu ← Inventory" "$ENV_LOCAL" 2>/dev/null; then
  {
    echo ""
    echo "# Sync Menu ← Inventory — diisi oleh: npm run env:inventory"
  } >> "$ENV_LOCAL"
fi

upsert_env_local "INVENTORY_APP_URL" "$URL_VALUE"
upsert_env_local "INVENTORY_API_KEY" "$KEY_VALUE"
if [[ -n "$KITCHEN_VALUE" ]] && ! is_bad "$KITCHEN_VALUE"; then
  upsert_env_local "INVENTORY_KITCHEN_ID" "$KITCHEN_VALUE"
fi

echo ""
echo "✓ INVENTORY_APP_URL + INVENTORY_API_KEY tersimpan di .env.local"
echo "  Restart dev server: hentikan npm run dev, lalu jalankan lagi."
