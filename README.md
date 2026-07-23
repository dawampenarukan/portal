# SPPG Penarukan 2 — Portal Informasi

Portal publikasi berita, event, hasil survey kepuasan, dan layanan masukan masyarakat untuk SPPG Penarukan 2.

## Tech Stack

- **Next.js 16** (App Router) + TypeScript
- **Tailwind CSS v4** + komponen UI custom
- **Prisma** + PostgreSQL
- **NextAuth v5** — autentikasi admin
- **Recharts** — grafik survey di beranda

## Memulai

### Prasyarat

- Node.js **>= 20.9.0** (disarankan)
- PostgreSQL (lokal atau cloud)

### Instalasi

```bash
cd portal
npm install
cp .env.example .env
# Edit DATABASE_URL, DIRECT_URL (lokal: boleh sama), dan NEXTAUTH_SECRET di .env

npm run db:setup   # generate, push schema, seed data
npm run dev
```

Buka [http://localhost:3000](http://localhost:3000)

### Login Admin

| Field | Nilai |
|-------|-------|
| URL | `/admin/login` |
| Email | `admin@sppgpenarukan2.id` |
| Password | `admin123` |

## Struktur Halaman

### Publik
| Route | Deskripsi |
|-------|-----------|
| `/` | Beranda — widget survey, berita, event |
| `/berita` | Listing berita |
| `/berita/[slug]` | Detail berita + komentar |
| `/event` | Daftar event |
| `/kinerja` | Hasil survey & publikasi fixed |
| `/survey/[id]` | Isi survey aktif |
| `/masukan` | Form masukan & kritik (dengan upload foto) |
| `/menu` | Menu favorit & request |

### Admin (memerlukan login)
| Route | Deskripsi |
|-------|-----------|
| `/admin/login` | Login admin |
| `/admin` | Dashboard live stats |
| `/admin/berita` | CMS berita (CRUD) |
| `/admin/event` | Kelola event |
| `/admin/publikasi` | Publikasi fixed |
| `/admin/komentar` | Moderasi komentar |
| `/admin/masukan` | Inbox masukan + status |
| `/admin/menu` | Kelola menu favorit & jadwal (tombol **Dari Inventory** = sync Rencana Produksi) |
| `/admin/survey` | Survey builder + publikasi hasil |

## API Routes

| Endpoint | Auth | Deskripsi |
|----------|------|-----------|
| `POST /api/feedback` | Public | Kirim masukan |
| `POST /api/comments` | Public | Kirim komentar (pending moderasi) |
| `POST /api/menu-requests` | Public | Request menu |
| `POST /api/upload` | Public | Upload gambar |
| `POST /api/surveys/[id]/responses` | Public | Jawab survey |
| `GET/POST /api/articles` | Admin | CRUD berita |
| `GET/PATCH/DELETE /api/articles/[id]` | Admin | Edit/hapus berita |
| `GET/POST /api/events` | Admin | CRUD event |
| `GET/POST /api/publications` | Admin | CRUD publikasi |
| `GET/POST /api/surveys` | Admin | Survey builder |
| `POST /api/surveys/[id]/publish` | Admin | Agregasi & publikasi ke beranda |

## Scripts

```bash
npm run dev          # Development server
npm run build        # Production build (tanpa koneksi DB)
npm run db:deploy    # Push schema ke DB production (jalankan manual setelah ubah schema)
npm run db:setup     # Setup database + seed
npm run db:studio    # Prisma Studio
```

## Deploy VPS (HTTPS `www.sppgpenarukan2.id`)

Portal dijalankan sebagai **sidecar tipis** di stack Sales compose (bukan Vercel), DB tetap **Neon**.

1. DNS `A/AAAA` → `www.sppgpenarukan2.id` ke IP VPS
2. Di `~/assignment/sales` (atau path compose ERP), isi `.env.docker`:
   - `PORTAL_HOST=www.sppgpenarukan2.id`
   - `PORTAL_DATABASE_URL` / `PORTAL_DIRECT_URL` (Neon)
   - `PORTAL_NEXTAUTH_SECRET`, `PORTAL_NEXTAUTH_URL=https://www.sppgpenarukan2.id`
3. `npm run docker:portal` (profile `portal` + `https`)
4. Cek: `curl -fsS https://www.sppgpenarukan2.id/api/health`

Resource cap: **0.3 CPU / 512 MB**. Detail: `sales/docs/DEPLOY-VPS.md` §9.2.

---

## Sync Menu Minggu Ini ← Inventory

Portal mengisi **Menu Minggu Ini** dari **Rencana Produksi** Inventory (`GET /api/fp-public/plans`). Nama resep memakai `recipeNama` (fallback `menuNama` legacy).

1. Di Inventory: buat API key dengan scope `food-production:read` (Utiliti → API Keys).
2. Di portal `.env` / Vercel / VPS (`PORTAL_INVENTORY_*` di sales compose):

```bash
INVENTORY_APP_URL="http://localhost:3001"       # lokal — atau http://43.157.226.71:3001 untuk VPS
INVENTORY_API_KEY="sk_..."
# INVENTORY_KITCHEN_ID=""                       # opsional
```

3. Admin → **Kelola Menu** → **Sync semua dari Inventory**, atau per kategori → **Dari Inventory**.

- Rentang default: **minggu ini + minggu depan** (14 hari dari Senin, Asia/Jakarta).
- Status yang di-sync: `APPROVED` / `PROCESSING` / `COMPLETED` (Draft, Diajukan, Dibatalkan dilewati).
- Mapping: `PORSI_KECIL`/`PORSI_BESAR` sama; `POSYANDU_BUMIL_BUSUI` → Ibu Hamil; `POSYANDU_BALITA` → Balita.
- Setelah sync: `MenuItem` yang tidak ada di hasil sync dinonaktifkan (favorit seed/mock hilang dari UI).

---

## Deploy ke Vercel

Build Vercel **tidak** menjalankan `prisma db push` (tidak butuh koneksi DB saat compile).

### Database Neon (performa serverless)

Pakai **dua** connection string agar cold start cepat dan migrate tetap aman:

| Variabel | Dipakai untuk | Sumber di Neon |
|----------|---------------|----------------|
| `DATABASE_URL` | Runtime app (Vercel / `npm run start`) | **Pooled** — host ada `-pooler`. Tambahkan `connection_limit=1` |
| `DIRECT_URL` | `prisma db push` / migrate (`npm run db:deploy`) | **Direct** — host tanpa `-pooler` |

Contoh (host/password diganti):

```bash
# Vercel + .env.local (production data)
DATABASE_URL="postgresql://USER:PASS@ep-xxxx-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&connection_limit=1"
DIRECT_URL="postgresql://USER:PASS@ep-xxxx.ap-southeast-1.aws.neon.tech/neondb?sslmode=require"
```

Lokal (Postgres WSL): kedua URL boleh sama — lihat `.env.example`.

### Sync schema ke Neon

Setelah mengubah `prisma/schema.prisma`, jalankan dari mesin lokal:

```bash
npm run env:pull          # tarik env production (DATABASE_URL + DIRECT_URL jika ada)
npm run db:deploy         # push schema via DIRECT_URL
npm run db:ensure-admin   # pastikan akun admin & entri ada
```

Prisma memakai `DIRECT_URL` untuk `db push`. Jangan pakai pooler sebagai satu-satunya URL untuk migrate.

Schema organoleptik **tidak** di-ALTER saat request runtime (demi performa cold start). Setelah ubah `schema.prisma`, sync lewat `npm run db:deploy` atau tombol schema-sync di `/admin/akun` (super admin).

### Env Vercel yang wajib

Pastikan di Vercel → Settings → Environment Variables:

- `DATABASE_URL` — Neon **pooled** + `connection_limit=1`
- `DIRECT_URL` — Neon **direct** (untuk deploy schema dari lokal / CI). Build Vercel akan fallback ke `DATABASE_URL` jika kosong, tetapi migrate tetap butuh direct.
- `NEXTAUTH_SECRET` atau `AUTH_SECRET`
- `NEXTAUTH_URL` = URL production (mis. `https://sppgpenarukan2.vercel.app`)

Setelah mengubah env DB, **Redeploy**. Verifikasi: `https://<app>/api/health` → `DATABASE_POOLER: "yes"` dan `performanceHints` idealnya `[]`.

## Status Development

Semua item roadmap selesai:
1. ✅ Koneksi database & API routes CRUD lengkap
2. ✅ Autentikasi admin (NextAuth + middleware)
3. ✅ Upload gambar masukan
4. ✅ CMS berita lengkap
5. ✅ Survey builder & agregasi hasil ke beranda
