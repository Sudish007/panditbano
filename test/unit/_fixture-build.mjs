// Shared helper (FEAT-109 tests): run the real build once per test process on test/fixtures/content-sample into a fresh
// temp dist (no OG cache), and read files back. Never touches the repo's dist/.
import { mkdtempSync, readFileSync, existsSync, rmSync } from "node:fs";
import { join, dirname } from "node:path";
import { tmpdir } from "node:os";
import { fileURLToPath } from "node:url";
import { build } from "../../build/build.mjs";

export const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
export const FIXTURE = join(ROOT, "test", "fixtures", "content-sample");

let built = null;
/** { dist, report, read(rel) → string, bytes(rel) → Buffer, has(rel) } */
export async function fixtureBuild() {
  if (built) return built;
  const dist = mkdtempSync(join(tmpdir(), "pb-feat109-"));
  const report = await build({ CONTENT_DIR: FIXTURE, DIST: dist, CI: false, quiet: true });
  built = {
    dist,
    report,
    read: (rel) => readFileSync(join(dist, ...rel.split("/")), "utf8"),
    bytes: (rel) => readFileSync(join(dist, ...rel.split("/"))),
    has: (rel) => existsSync(join(dist, ...rel.split("/"))),
    cleanup: () => rmSync(dist, { recursive: true, force: true }),
  };
  return built;
}

/** Width/height of a PNG from its IHDR chunk (no image library; the BINARY-FILE RULE forbids reading PNGs as text). */
export function pngSize(buf) {
  if (buf.length < 24 || buf.toString("latin1", 1, 4) !== "PNG") throw new Error("not a PNG");
  return { width: buf.readUInt32BE(16), height: buf.readUInt32BE(20) };
}
