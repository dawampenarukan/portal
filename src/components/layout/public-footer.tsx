import Link from "next/link";
import { BrandLogo } from "@/components/layout/brand-logo";
import { NAV_ITEMS, SITE_NAME } from "@/lib/constants";

export function PublicFooter() {
  return (
    <footer className="mt-auto bg-gradient-to-br from-[#3cb88a] via-primary to-[#2a8f5f] text-white">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 md:grid-cols-3">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
          <BrandLogo size="lg" tone="light" />
          <p className="min-w-0 text-sm leading-relaxed text-white/90 sm:pt-1">
            Bersama wujudkan generasi sehat lewat makan bergizi yang enak dan
            menyenangkan! 🥗
          </p>
        </div>

        <div>
          <p className="mb-3 font-bold">🗺️ Jelajahi</p>
          <ul className="space-y-2 text-sm text-white/85">
            {NAV_ITEMS.map((item) => (
              <li key={item.href}>
                <Link href={item.href} className="transition hover:text-white">
                  {item.emoji} {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <p className="mb-3 font-bold">📞 Hubungi Kami</p>
          <ul className="space-y-2 text-sm text-white/85">
            <li>SPPG Penarukan 2</li>
            <li>Email: info@sppg-penarukan2.id</li>
            <li>Senin–Jumat, 08.00–15.00 WIB</li>
          </ul>
        </div>
      </div>
      <div className="border-t border-white/20 py-4 text-center text-xs text-white/70">
        © {new Date().getFullYear()} {SITE_NAME} · Dibuat dengan penuh cinta untuk keluarga
        Indonesia 💚
      </div>
    </footer>
  );
}
