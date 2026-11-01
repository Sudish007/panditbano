// Build configuration (design.md §3.1, §11.5, §21). Every value comes from the environment with a
// documented default; invalid values stop the build with exit code 2 and a one-line message.
import { resolve } from "node:path";

export const LANGS = ["hi", "en", "bho"];
export const DEFAULT_LANG = "hi";

// CLI flags of `node build/build.mjs` override the environment (brief §15: parallel steps share one shell, so
// persistent $env: values leak between steps): --content <dir> (CONTENT_DIR), --dist <dir> (DIST),
// --base-path </x/> (BASE_PATH), --site-origin <https://host> (SITE_ORIGIN), --ci (CI=true).
const FLAGS = { "--content": "CONTENT_DIR", "--dist": "DIST", "--base-path": "BASE_PATH", "--site-origin": "SITE_ORIGIN" };
/** `--flag value` (or `--flag=value`) pairs of argv as an env-shaped object; unknown flags are ignored (other tools own them). */
export function fromArgv(argv = []) {
  const out = {};
  for (let i = 0; i < argv.length; i++) {
    const a = String(argv[i]);
    const eq = a.indexOf("=");
    const key = eq > 0 ? a.slice(0, eq) : a;
    if (FLAGS[key]) {
      const v = eq > 0 ? a.slice(eq + 1) : argv[++i];
      if (v === undefined) throw new Error(`${key} needs a value`);
      out[FLAGS[key]] = v;
    } else if (a === "--ci") out.CI = "true";
  }
  return out;
}
/** Validate the raw environment (with CLI overrides applied) and return the config object. Throws on invalid input (design §21). */
export function fromEnv(env = process.env, argv = []) {
  env = { ...env, ...fromArgv(argv) };
  const BASE_PATH = env.BASE_PATH ?? "/panditbano/";
  if (!/^\/([a-z0-9._-]+\/)*$/i.test(BASE_PATH)) {
    throw new Error(`BASE_PATH must start and end with "/" (got ${JSON.stringify(BASE_PATH)})`);
  }
  const SITE_ORIGIN = env.SITE_ORIGIN ?? "https://sudish007.github.io";
  if (!/^https:\/\/[a-z0-9.-]+(:\d+)?$/i.test(SITE_ORIGIN)) {
    throw new Error(`SITE_ORIGIN must be https:// with no path and no trailing slash (got ${JSON.stringify(SITE_ORIGIN)})`);
  }
  const CONTENT_DIR = resolve(env.CONTENT_DIR ?? "content");
  const DIST = resolve(env.DIST ?? "dist");
  return {
    BASE_PATH,
    SITE_ORIGIN,
    LANGS,
    DEFAULT_LANG,
    CONTENT_DIR,
    DIST,
    CI: env.CI === "true" || env.CI === "1",
    features: { search: false },
  };
}

/** argv flags count only when the running script is the build itself (tests, the gate and tools keep their own argv). */
const isBuild = /[\\/]build[\\/]build\.mjs$/i.test(String(process.argv[1] || ""));
let config;
try {
  config = fromEnv(process.env, isBuild ? process.argv.slice(2) : []);
} catch (err) {
  console.error(`build config: ${err.message}`);
  process.exit(2);
}
export default config;
