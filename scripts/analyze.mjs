/**
 * Cross-platform bundle analyze — set ANALYZE=true lalu jalankan build.
 * Hasil: laporan @next/bundle-analyzer setelah `next build`.
 */
import { spawnSync } from "node:child_process";

process.env.ANALYZE = "true";

const result = spawnSync("npm", ["run", "build"], {
  stdio: "inherit",
  env: process.env,
  shell: true,
});

process.exit(result.status ?? 1);
