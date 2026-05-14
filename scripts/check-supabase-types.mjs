import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const outputPath = resolve("lib/supabase/database.types.ts");
const projectRef = process.env.SUPABASE_PROJECT_REF ?? process.env.SUPABASE_PROJECT_ID;
const args = projectRef
  ? ["supabase", "gen", "types", "typescript", "--project-id", projectRef, "--schema=public"]
  : ["supabase", "gen", "types", "typescript", "--linked", "--schema=public"];

const result = spawnSync("npx", args, {
  encoding: "utf8",
  shell: true,
  maxBuffer: 10 * 1024 * 1024,
});

if (result.error) {
  console.error(result.error.message);
  process.exit(1);
}

if (result.status !== 0) {
  if (result.stdout) {
    process.stdout.write(result.stdout);
  }
  if (result.stderr) {
    process.stderr.write(result.stderr);
  }
  process.exit(result.status ?? 1);
}

const generated = normalize(result.stdout);
const checkedIn = normalize(readFileSync(outputPath, "utf8"));

if (generated !== checkedIn) {
  console.error("Supabase database types are out of date.");
  console.error(`Run npm run db:types and commit ${outputPath}.`);
  process.exit(1);
}

function normalize(value) {
  return value.replace(/\r\n/g, "\n").trimEnd();
}
