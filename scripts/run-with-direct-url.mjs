#!/usr/bin/env node
/**
 * Pastikan DIRECT_URL ada sebelum perintah Prisma (generate / db push).
 * - Lokal: load .env / .env.local (Node tidak load otomatis seperti Prisma CLI).
 * - Build Vercel: sering hanya punya DATABASE_URL → fallback ke DATABASE_URL.
 * - db:deploy: warn jika DIRECT_URL masih pooler (migrate bisa gagal / lambat).
 */
import { spawnSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

function readEnvFile(filePath) {
  const out = {};
  if (!existsSync(filePath)) return out;
  const text = readFileSync(filePath, "utf8");
  for (const line of text.split("\n")) {
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

const root = process.cwd();
const fromFiles = {
  ...readEnvFile(resolve(root, ".env")),
  ...readEnvFile(resolve(root, ".env.local")),
};

const env = { ...process.env };
for (const [key, value] of Object.entries(fromFiles)) {
  if (env[key] === undefined || env[key] === "") {
    env[key] = value;
  }
}

const command = process.argv.slice(2);

if (command.length === 0) {
  console.error("Usage: node scripts/run-with-direct-url.mjs <command> [...args]");
  process.exit(1);
}

if (!env.DIRECT_URL && env.DATABASE_URL) {
  env.DIRECT_URL = env.DATABASE_URL;
  console.warn(
    "[ensure-direct-url] DIRECT_URL belum di-set — memakai DATABASE_URL sebagai fallback."
  );
  console.warn(
    "[ensure-direct-url] Production Neon: set DIRECT_URL = connection string Direct (tanpa -pooler)."
  );
}

const directUrl = env.DIRECT_URL ?? "";
const argsJoined = command.join(" ");
const pushing = argsJoined.includes("db push");

if (pushing && directUrl.includes("-pooler")) {
  console.warn(
    "[ensure-direct-url] PERINGATAN: DIRECT_URL memakai host -pooler."
  );
  console.warn(
    "[ensure-direct-url] Prisma migrate/db push sebaiknya pakai Neon Direct (tanpa -pooler)."
  );
}

if (!env.DIRECT_URL && !env.DATABASE_URL) {
  console.error(
    "[ensure-direct-url] DATABASE_URL dan DIRECT_URL kosong — set di .env / Vercel."
  );
  process.exit(1);
}

const result = spawnSync(command[0], command.slice(1), {
  stdio: "inherit",
  env,
  shell: true,
});

process.exit(result.status ?? 1);
