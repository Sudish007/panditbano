// npm test: unit tests → build → integration tests, sequentially; exits non-zero on the first failure (brief §7).
import { spawnSync } from "node:child_process";
import { existsSync, readdirSync } from "node:fs";

const steps = [
  ["unit tests", ["--test", "test/unit/**/*.test.mjs"]],
  ["build", ["build/build.mjs"]],
  ["integration tests", ["--test", "test/integration/**/*.test.mjs"]],
];
for (const [name, args] of steps) {
  const dir = args[0] === "--test" ? args[1].split("/**")[0] : null;
  if (dir && (!existsSync(dir) || !readdirSync(dir).some((f) => f.endsWith(".test.mjs")))) {
    console.log(`\n== ${name}: no tests yet, skipped`);
    continue;
  }
  console.log(`\n== ${name}: node ${args.join(" ")}`);
  const r = spawnSync(process.execPath, args, { stdio: "inherit", env: process.env });
  if (r.status !== 0) {
    console.error(`\n${name} failed (exit ${r.status})`);
    process.exit(r.status || 1);
  }
}
console.log("\nall green");
