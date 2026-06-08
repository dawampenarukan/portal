export async function safeQuery<T>(
  fn: () => Promise<T>,
  fallback: T,
  label?: string
): Promise<T> {
  try {
    return await fn();
  } catch (err) {
    const tag = label ? `: ${label}` : "";
    console.error(`[db${tag}]`, err);
    if (process.env.NODE_ENV === "production") {
      console.error(
        `[db${tag}] Menggunakan data fallback — cek DATABASE_URL dan koneksi PostgreSQL`
      );
    }
    return fallback;
  }
}

export function isLocalDatabaseUrl(): boolean {
  const url = process.env.DATABASE_URL ?? "";
  return url.includes("localhost") || url.includes("127.0.0.1");
}

/** Host database yang sedang dipakai (untuk diagnosa dev vs production). */
export function getDatabaseInfo(): {
  host: string;
  database: string;
  isLocal: boolean;
  configured: boolean;
} {
  const url = process.env.DATABASE_URL ?? "";
  if (!url) {
    return { host: "not-set", database: "not-set", isLocal: false, configured: false };
  }
  try {
    const parsed = new URL(url.replace(/^postgresql:\/\//, "http://"));
    return {
      host: parsed.hostname,
      database: parsed.pathname.replace(/^\//, "").split("?")[0] || "unknown",
      isLocal: isLocalDatabaseUrl(),
      configured: true,
    };
  } catch {
    return { host: "invalid-url", database: "unknown", isLocal: false, configured: true };
  }
}
