"use client";

import { useEffect } from "react";

export default function PublicError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="mx-auto flex min-h-[50vh] max-w-lg flex-col items-center justify-center px-4 text-center">
      <span className="text-5xl">😔</span>
      <h1 className="mt-4 text-2xl font-bold text-primary">Halaman gagal dimuat</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Kemungkinan database belum terhubung. Pastikan{" "}
        <code className="rounded bg-muted px-1">DATABASE_URL</code> di Vercel mengarah ke
        PostgreSQL cloud (bukan localhost), lalu jalankan{" "}
        <code className="rounded bg-muted px-1">npx prisma db push</code>.
      </p>
      <p className="mt-2 text-xs text-muted-foreground">
        Cek status:{" "}
        <a href="/api/health" className="text-primary underline">
          /api/health
        </a>
      </p>
      <button
        type="button"
        onClick={reset}
        className="mt-6 rounded-full bg-primary px-6 py-2.5 text-sm font-bold text-white"
      >
        Coba lagi
      </button>
    </div>
  );
}
