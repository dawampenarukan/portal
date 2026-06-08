export async function safeQuery<T>(
  fn: () => Promise<T>,
  fallback: T,
  label?: string
): Promise<T> {
  try {
    return await fn();
  } catch (err) {
    console.error(`[db${label ? `: ${label}` : ""}]`, err);
    return fallback;
  }
}

export function isLocalDatabaseUrl(): boolean {
  const url = process.env.DATABASE_URL ?? "";
  return url.includes("localhost") || url.includes("127.0.0.1");
}
