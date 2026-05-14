import { spawnSync } from "node:child_process";

const projectRef = process.env.SUPABASE_PROJECT_REF ?? process.env.SUPABASE_PROJECT_ID;
const accessToken = process.env.SUPABASE_ACCESS_TOKEN;
const dbPassword = process.env.SUPABASE_DB_PASSWORD;

if (!projectRef || !accessToken || !dbPassword) {
  console.log("Skipping Supabase migration check: missing SUPABASE_PROJECT_REF, SUPABASE_ACCESS_TOKEN, or SUPABASE_DB_PASSWORD.");
  process.exit(0);
}

const link = spawnSync("npx", ["supabase", "link", "--project-ref", projectRef], {
  encoding: "utf8",
  shell: true,
  maxBuffer: 10 * 1024 * 1024,
  env: {
    ...process.env,
    SUPABASE_ACCESS_TOKEN: accessToken,
    SUPABASE_DB_PASSWORD: dbPassword,
  },
});

if (link.error) {
  console.error(link.error.message);
  process.exit(1);
}

if (link.status !== 0) {
  if (link.stdout) process.stdout.write(link.stdout);
  if (link.stderr) process.stderr.write(link.stderr);
  process.exit(link.status ?? 1);
}

const push = spawnSync("npx", ["supabase", "db", "push", "--dry-run"], {
  encoding: "utf8",
  shell: true,
  maxBuffer: 10 * 1024 * 1024,
  env: {
    ...process.env,
    SUPABASE_ACCESS_TOKEN: accessToken,
    SUPABASE_DB_PASSWORD: dbPassword,
  },
});

if (push.error) {
  console.error(push.error.message);
  process.exit(1);
}

if (push.status !== 0) {
  if (push.stdout) process.stdout.write(push.stdout);
  if (push.stderr) process.stderr.write(push.stderr);
  process.exit(push.status ?? 1);
}

if (push.stdout) process.stdout.write(push.stdout);
if (push.stderr) process.stderr.write(push.stderr);
console.log("Supabase migration dry-run completed successfully.");
