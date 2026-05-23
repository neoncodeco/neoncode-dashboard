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
    return;
  }

  rmSync(to, { force: true, recursive: true });
  mkdirSync(path.dirname(to), { recursive: true });
  cpSync(from, to, { recursive: true });
};

copyFresh(path.join(root, "public"), path.join(standaloneDir, "public"));
copyFresh(
  path.join(root, ".next", "static"),
  path.join(standaloneDir, ".next", "static"),
);
