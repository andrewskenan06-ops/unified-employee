import { neon } from "@neondatabase/serverless";
import { readFileSync } from "fs";

const env = Object.fromEntries(
  readFileSync(new URL("../.env.local", import.meta.url), "utf8")
    .split("\n").filter(l => l.includes("="))
    .map(l => l.split("=").map(s => s.trim()))
);
const sql = neon(env.DATABASE_URL);

await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS email              TEXT`;
await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS phone              TEXT`;
await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS start_date         DATE`;
await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS employment_type    TEXT NOT NULL DEFAULT 'full-time'`;
await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS emergency_name     TEXT`;
await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS emergency_phone    TEXT`;

console.log("✓ Employee fields added to users table");
process.exit(0);
