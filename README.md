# SPPG Penarukan 2 — Portal Informasi

Portal publikasi berita, event, hasil survey kepuasan, dan layanan masukan masyarakat untuk SPPG Penarukan 2.

## Tech Stack

- **Next.js 16** (App Router) + TypeScript
- **Tailwind CSS v4** + komponen UI custom
- **Prisma** + PostgreSQL
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
# Edit DATABASE_URL di .env

npx prisma generate
npx prisma db push

npm run dev
```

Buka [http://localhost:3000](http://localhost:3000)

## Struktur Halaman

### Publik
| Route | Deskripsi |
|-------|-----------|
| `/` | Beranda — widget survey, berita, event |
| `/berita` | Listing berita |
| `/berita/[slug]` | Detail berita + komentar |
| `/event` | Daftar event |
| `/kinerja` | Hasil survey & publikasi fixed |
| `/masukan` | Form masukan & kritik |

### Admin
| Route | Deskripsi |
|-------|-----------|
| `/admin/login` | Login admin (gaya OCTO split-screen) |
| `/admin` | Dashboard |
| `/admin/berita` | Kelola berita |
| `/admin/event` | Kelola event |
| `/admin/publikasi` | Publikasi fixed |
| `/admin/komentar` | Moderasi komentar |
| `/admin/masukan` | Inbox masukan |
| `/admin/survey` | Kelola survey |

## Status Development

Saat ini menggunakan **mock data** untuk demonstrasi UI. Fase berikutnya:
1. Koneksi database & API routes
2. Autentikasi admin (NextAuth)
3. Upload gambar masukan
4. CMS berita lengkap
5. Survey builder & agregasi hasil
