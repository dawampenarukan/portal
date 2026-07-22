import Link from "next/link";
import { organolepticNoticeHref } from "@/lib/organoleptic-meta";
import { cn } from "@/lib/utils";

export interface MenuOrganolepticNoticesData {
  unsafeCount: number;
  returnedPackagesCount: number;
}

function formatCount(n: number) {
  return n > 99 ? "99+" : String(n);
}

interface MenuOrganolepticNoticesProps {
  notices: MenuOrganolepticNoticesData;
  /** Kontras untuk sidebar admin (latar gelap) vs nav publik. */
  tone?: "admin" | "public";
  className?: string;
  /** Jika true, tiap angka menjadi link ke checklist organoleptik. */
  linkToChecklist?: boolean;
}

export function MenuOrganolepticNotices({
  notices,
  tone = "admin",
  className,
  linkToChecklist = true,
}: MenuOrganolepticNoticesProps) {
  const { unsafeCount, returnedPackagesCount } = notices;
  if (unsafeCount <= 0 && returnedPackagesCount <= 0) return null;

  const isAdmin = tone === "admin";

  // Admin drawer: larger hit area; public chrome stays compact
  const sizeClass = isAdmin
    ? "inline-flex h-8 min-w-8 items-center justify-center rounded-full px-2 text-xs font-bold"
    : "inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-[10px] font-bold";

  const unsafeClass = cn(
    sizeClass,
    "transition hover:opacity-90",
    isAdmin
      ? "bg-coral text-white"
      : "bg-coral text-white shadow-sm ring-2 ring-white/80"
  );
  const returnedClass = cn(
    sizeClass,
    "transition hover:opacity-90",
    isAdmin
      ? "bg-sunny text-amber-950"
      : "bg-sunny text-amber-950 shadow-sm ring-2 ring-white/80"
  );

  return (
    <span className={cn("inline-flex items-center gap-1", className)}>
      {unsafeCount > 0 &&
        (linkToChecklist ? (
          <Link
            href={organolepticNoticeHref("unsafe")}
            prefetch={false}
            title={`${unsafeCount} temuan tidak aman — buka checklist`}
            aria-label={`${unsafeCount} temuan tidak aman, buka checklist`}
            className={unsafeClass}
          >
            {formatCount(unsafeCount)}
          </Link>
        ) : (
          <span
            title={`${unsafeCount} temuan tidak aman`}
            aria-label={`${unsafeCount} temuan tidak aman`}
            className={unsafeClass}
          >
            {formatCount(unsafeCount)}
          </span>
        ))}
      {returnedPackagesCount > 0 &&
        (linkToChecklist ? (
          <Link
            href={organolepticNoticeHref("returned")}
            prefetch={false}
            title={`${returnedPackagesCount} paket dikembalikan — buka checklist`}
            aria-label={`${returnedPackagesCount} paket dikembalikan, buka checklist`}
            className={returnedClass}
          >
            {formatCount(returnedPackagesCount)}
          </Link>
        ) : (
          <span
            title={`${returnedPackagesCount} paket dikembalikan`}
            aria-label={`${returnedPackagesCount} paket dikembalikan`}
            className={returnedClass}
          >
            {formatCount(returnedPackagesCount)}
          </span>
        ))}
    </span>
  );
}
