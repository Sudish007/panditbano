// Build configuration (design.md §3.1, §11.5, §21). Every value comes from the environment with a
// documented default; invalid values stop the build with exit code 2 and a one-line message.
import { resolve } from "node:path";

export const LANGS = ["hi", "en", "bho"];
export const DEFAULT_LANG = "hi";

/** Validate the raw environment and return the config object. Throws on invalid input (design §21). */
export function fromEnv(env = process.env) {
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

let config;
try {
  config = fromEnv();
} catch (err) {
  console.error(`build config: ${err.message}`);
  process.exit(2);
}
export default config;
