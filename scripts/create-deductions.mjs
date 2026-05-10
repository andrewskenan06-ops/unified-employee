import { neon } from "@neondatabase/serverless";
import { readFileSync } from "fs";

const env = Object.fromEntries(
  readFileSync(new URL("../.env.local", import.meta.url), "utf8")
    .split("\n").filter(l => l.includes("="))
    .map(l => l.split("=").map(s => s.trim()))
);
const sql = neon(env.DATABASE_URL);

await sql`
  CREATE TABLE IF NOT EXISTS employee_deductions (
    employee_id          TEXT PRIMARY KEY REFERENCES users(id),
    federal_tax          BOOLEAN      NOT NULL DEFAULT true,
    state_tax            BOOLEAN      NOT NULL DEFAULT true,
    social_security      BOOLEAN      NOT NULL DEFAULT true,
    medicare             BOOLEAN      NOT NULL DEFAULT true,
    benefits             BOOLEAN      NOT NULL DEFAULT true,
    child_support        BOOLEAN      NOT NULL DEFAULT false,
    child_support_amount NUMERIC(8,2) NOT NULL DEFAULT 0,
    updated_at           TIMESTAMPTZ  NOT NULL DEFAULT NOW()
  )
`;

// Seed all employees with defaults (child support off)
const employees = await sql`SELECT id FROM users WHERE role = 'employee'`;
for (const emp of employees) {
  await sql`
    INSERT INTO employee_deductions (employee_id)
    VALUES (${emp.id})
    ON CONFLICT (employee_id) DO NOTHING`;
}

console.log(`✓ employee_deductions table created and seeded for ${employees.length} employees`);
process.exit(0);
