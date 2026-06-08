/**
 * On Vercel, NEXTAUTH_URL is sometimes copied from local .env (localhost).
 * NextAuth then redirects to localhost instead of the deployed domain.
 */
export function ensureAuthUrl(): void {
  if (!process.env.VERCEL) return;

  const configured = process.env.AUTH_URL ?? process.env.NEXTAUTH_URL ?? "";
  const isLocalhost =
    configured.includes("localhost") || configured.includes("127.0.0.1");

  if (!isLocalhost && configured) return;

  // Prefer production URL, then deployment URL
  const vercelUrl =
    process.env.VERCEL_PROJECT_PRODUCTION_URL ?? process.env.VERCEL_URL;

  if (!vercelUrl) return;

  const productionUrl = vercelUrl.startsWith("http")
    ? vercelUrl
    : `https://${vercelUrl}`;

  process.env.AUTH_URL = productionUrl;
  process.env.NEXTAUTH_URL = productionUrl;
}

ensureAuthUrl();
