/**
 * Next.js 16 membutuhkan Node >= 20.9.0.
 * Gagal cepat dengan pesan jelas (bukan error cryptic dari next build).
 */
const REQUIRED = [20, 9, 0];
const [major, minor, patch] = process.versions.node.split(".").map(Number);

const ok =
  major > REQUIRED[0] ||
  (major === REQUIRED[0] && minor > REQUIRED[1]) ||
  (major === REQUIRED[0] && minor === REQUIRED[1] && patch >= REQUIRED[2]);

if (!ok) {
  console.error(
    `[check-node] Node ${process.versions.node} terdeteksi. Butuh >= ${REQUIRED.join(".")}.`
  );
  console.error(
    "  WSL:  source ~/.nvm/nvm.sh && nvm install 20 && nvm use 20"
  );
  console.error("  Atau:  fnm use 20  /  volta install node@20");
  process.exit(1);
}
