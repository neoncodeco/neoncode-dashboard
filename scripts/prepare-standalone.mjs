import { cpSync, existsSync, mkdirSync, rmSync } from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const root = path.resolve(path.dirname(__filename), "..");
const standaloneDir = path.join(root, ".next", "standalone");

if (!existsSync(standaloneDir)) {
  throw new Error("Standalone output not found. Run `npm run build` first.");
}

const copyFresh = (from, to) => {
  if (!existsSync(from)) {
    console.warn(`[prepare-standalone] Skipping missing path: ${from}`);
    return;
  }

  rmSync(to, { force: true, recursive: true });
  mkdirSync(path.dirname(to), { recursive: true });
  cpSync(from, to, { recursive: true });
};

const publicDir = path.join(root, "public");
const logoPath = path.join(publicDir, "Neon-Studio-icon.png");
if (!existsSync(logoPath)) {
  throw new Error(
    "Missing public/Neon-Studio-icon.png — add the logo file before deploying."
  );
}

copyFresh(publicDir, path.join(standaloneDir, "public"));
copyFresh(
  path.join(root, ".next", "static"),
  path.join(standaloneDir, ".next", "static"),
);

const envLocal = path.join(root, ".env.local");
if (existsSync(envLocal)) {
  copyFresh(envLocal, path.join(standaloneDir, ".env.local"));
} else {
  console.warn("[prepare-standalone] No .env.local found — copy env vars manually on the server.");
}

console.log("[prepare-standalone] Standalone bundle ready.");
