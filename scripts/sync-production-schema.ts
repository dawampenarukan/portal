import { execSync } from "node:child_process";

console.log("==> Push schema Prisma ke database...");
execSync("node scripts/run-with-direct-url.mjs npx prisma db push --skip-generate", {
  stdio: "inherit",
});

console.log("==> Memastikan akun admin & entri...");
execSync("npm run db:ensure-admin", { stdio: "inherit" });

console.log("==> Selesai.");
