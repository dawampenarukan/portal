"use client";

import { useSearchParams } from "next/navigation";

/**
 * Remount children saat filter kategori berubah agar Suspense
 * menampilkan skeleton (hindari flash list kategori lama).
 */
export function BeritaFilterKeyed({ children }: { children: React.ReactNode }) {
  const searchParams = useSearchParams();
  const key = searchParams.get("kategori") ?? "Semua";
  return <div key={key}>{children}</div>;
}
