#!/usr/bin/env node
/**
 * Wrapper Prisma: pastikan DIRECT_URL ada.
 * Untuk `db push` / db:deploy: WAJIB ada `.env.neon` (Neon) — menolak localhost.
 */
import { spawnSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

function readEnvFile(filePath) {
  const out = {};
  if (!existsSync(filePath)) return out;
  const text = readFileSync(filePath, "utf8").replace(/^\uFEFF/, "");
  for (const line of text.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq <= 0) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    out[key] = value;
  }
  return out;
}

function hostHint(url) {
  try {
    return new URL(url).hostname;
  } catch {
    return "(invalid-url)";
  }
}

function isLocalHost(host) {
  return (
    !host ||
    host === "(invalid-url)" ||
    host === "localhost" ||
    host === "127.0.0.1" ||
    host.endsWith(".local")
  );
}

const root = process.cwd();
const neonPath = resolve(root, ".env.neon");
const fromDotEnv = readEnvFile(resolve(root, ".env"));
const fromLocal = readEnvFile(resolve(root, ".env.local"));
const fromNeon = readEnvFile(neonPath);

const env = { ...process.env };

for (const [key, value] of Object.entries({ ...fromDotEnv, ...fromLocal })) {
  if (env[key] === undefined || env[key] === "") {
    env[key] = value;
  }
}

const command = process.argv.slice(2);
if (command.length === 0) {
  console.error("Usage: node scripts/run-with-direct-url.mjs <command> [...args]");
  process.exit(1);
}

const argsJoined = command.join(" ");
const pushing = /\bdb\s+push\b/.test(argsJoined) || argsJoined.includes("db push");

if (pushing) {
  if (!existsSync(neonPath)) {
    console.error("[db:deploy] File .env.neon tidak ada.");
    console.error("  Buat .env.neon dengan DATABASE_URL + DIRECT_URL dari Neon, lalu simpan (Ctrl+S).");
    process.exit(1);
  }
  if (!fromNeon.DATABASE_URL && !fromNeon.DIRECT_URL) {
    console.error("[db:deploy] .env.neon ada tetapi DATABASE_URL / DIRECT_URL kosong / tidak terbaca.");
    console.error("  Simpan file, format:");
    console.error('  DATABASE_URL="postgresql://...pooler.../neondb?sslmode=require"');
    console.error('  DIRECT_URL="postgresql://.../neondb?sslmode=require"');
    process.exit(1);
  }
  if (fromNeon.DATABASE_URL) env.DATABASE_URL = fromNeon.DATABASE_URL;
  if (fromNeon.DIRECT_URL) env.DIRECT_URL = fromNeon.DIRECT_URL;
  if (!env.DIRECT_URL) env.DIRECT_URL = env.DATABASE_URL;
}

if (!env.DIRECT_URL && env.DATABASE_URL) {
  env.DIRECT_URL = env.DATABASE_URL;
  console.warn(
    "[ensure-direct-url] DIRECT_URL belum di-set — memakai DATABASE_URL sebagai fallback."
  );
}

const targetHost = hostHint(env.DIRECT_URL || env.DATABASE_URL || "");

if (pushing) {
  console.log(`[db:deploy] .env.neon → ${targetHost}`);
  if (isLocalHost(targetHost) || !String(targetHost).includes("neon.tech")) {
    console.error("[db:deploy] DIBATALKAN: target bukan Neon (host harus *.neon.tech).");
    console.error(`  Host terdeteksi: ${targetHost}`);
    console.error("  Jangan biarkan DATABASE_URL lokal menimpa — periksa .env.neon tersimpan.");
    process.exit(1);
  }
  if ((env.DIRECT_URL || "").includes("-pooler")) {
    console.warn("[db:deploy] PERINGATAN: DIRECT_URL memakai -pooler; sebaiknya host direct.");
  }
}

if (!env.DIRECT_URL && !env.DATABASE_URL) {
  console.error("[ensure-direct-url] DATABASE_URL dan DIRECT_URL kosong.");
  process.exit(1);
}

const result = spawnSync(command[0], command.slice(1), {
  stdio: "inherit",
  env,
  shell: true,
});

process.exit(result.status ?? 1);
