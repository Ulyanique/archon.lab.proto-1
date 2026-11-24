import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { brotliDecompressSync } from "node:zlib";

/** Sparticuz extracts AL2023 libraries only on Lambda; supply its bundled NSS/NSPR on Linux too. */
export function chromiumLibraryPath(): string | undefined {
  if (process.platform !== "linux" || process.env.CHROMIUM_EXECUTABLE_PATH) return undefined;
  const require = createRequire(import.meta.url);
  const packageRoot = join(dirname(require.resolve("@sparticuz/chromium")), "../..");
  const archive = join(packageRoot, "bin/al2023.tar.br");
  const destination = join(tmpdir(), "archon-chromium-141-libs");
  const lib = join(destination, "lib");
  if (!existsSync(join(lib, "libnspr4.so"))) {
    mkdirSync(destination, { recursive: true });
    execFileSync("tar", ["-xf", "-", "-C", destination], { input: brotliDecompressSync(readFileSync(archive)) });
  }
  return [lib, process.env.LD_LIBRARY_PATH].filter(Boolean).join(":");
}
