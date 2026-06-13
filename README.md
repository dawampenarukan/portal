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
# Edit DATABASE_URL dan NEXTAUTH_SECRET di .env

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
| `/admin/menu` | Kelola menu favorit & jadwal |
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

## Deploy ke Vercel

Build Vercel **tidak** menjalankan `prisma db push` (tidak butuh koneksi DB saat compile).

Setelah mengubah `prisma/schema.prisma`, jalankan schema ke Neon **dari mesin lokal**:

```bash
npm run env:pull          # tarik DATABASE_URL production dari Vercel
npm run db:deploy         # push schema ke Neon
npm run db:ensure-admin   # pastikan akun admin & entri ada
```

Jika `db:deploy` gagal dengan pooler URL, di Neon dashboard gunakan connection string **Direct** (bukan pooler) sebagai `DATABASE_URL` sementara, lalu jalankan lagi.

Pastikan di Vercel → Settings → Environment Variables sudah ada:
- `DATABASE_URL`
- `NEXTAUTH_SECRET` atau `AUTH_SECRET`
- `NEXTAUTH_URL` = URL production (mis. `https://portalpenarukan2.vercel.app`)

## Status Development

Semua item roadmap selesai:
1. ✅ Koneksi database & API routes CRUD lengkap
2. ✅ Autentikasi admin (NextAuth + middleware)
3. ✅ Upload gambar masukan
4. ✅ CMS berita lengkap
5. ✅ Survey builder & agregasi hasil ke beranda
