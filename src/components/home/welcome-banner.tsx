import Link from "next/link";
import { SITE_TAGLINE } from "@/lib/constants";

export function WelcomeBanner() {
  return (
    <section className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-primary via-[#3cb88a] to-sky p-6 text-white shadow-lg md:p-8">
      <div className="pointer-events-none absolute -right-6 -top-6 h-32 w-32 rounded-full bg-white/10" />
      <div className="pointer-events-none absolute -bottom-8 right-1/4 h-24 w-24 rounded-full bg-sunny/30" />
      <div className="pointer-events-none absolute bottom-4 left-1/3 h-16 w-16 rounded-full bg-coral/20" />

      <div className="relative flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-white/80">
            Halo, selamat datang! 👋
          </p>
          <h1 className="mt-1 text-2xl font-extrabold leading-tight md:text-3xl">
            {SITE_TAGLINE}
          </h1>
          <p className="mt-2 max-w-xl text-sm text-white/90 md:text-base">
            Tempat berbagi cerita makan bergizi, kegiatan seru, dan kabar terbaru untuk
            siswa SD & SMP, guru, serta ibu hamil.
          </p>
        </div>
        <div className="flex shrink-0 flex-wrap gap-2">
          <Link
            href="/berita"
            className="rounded-full bg-white px-5 py-2.5 text-sm font-bold text-primary shadow-md transition hover:scale-105 hover:shadow-lg"
          >
            📰 Baca Berita
          </Link>
          <Link
            href="/masukan"
            className="rounded-full bg-white/20 px-5 py-2.5 text-sm font-bold text-white backdrop-blur-sm transition hover:bg-white/30"
          >
            💬 Kirim Masukan
          </Link>
        </div>
      </div>
    </section>
  );
}
