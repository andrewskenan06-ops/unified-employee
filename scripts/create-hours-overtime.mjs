import { neon } from "@neondatabase/serverless";
import { readFileSync } from "fs";

const env = Object.fromEntries(
  readFileSync(new URL("../.env.local", import.meta.url), "utf8")
    .split("\n").filter(l => l.includes("="))
    .map(l => l.split("=").map(s => s.trim()))
);
const sql = neon(env.DATABASE_URL);

await sql`
  CREATE TABLE IF NOT EXISTS employee_hours (
    id          SERIAL PRIMARY KEY,
    employee_id TEXT        NOT NULL REFERENCES users(id),
    week_start  DATE        NOT NULL,
    week_end    DATE        NOT NULL,
    hours_worked   NUMERIC(6,2) NOT NULL DEFAULT 0,
    regular_hours  NUMERIC(6,2) NOT NULL DEFAULT 0,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (employee_id, week_start)
  )
`;

await sql`
  CREATE TABLE IF NOT EXISTS employee_overtime (
    id             SERIAL PRIMARY KEY,
    employee_id    TEXT        NOT NULL REFERENCES users(id),
    week_start     DATE        NOT NULL,
    week_end       DATE        NOT NULL,
    overtime_hours NUMERIC(6,2) NOT NULL DEFAULT 0,
    overtime_rate  NUMERIC(6,2) NOT NULL DEFAULT 0,
    overtime_pay   NUMERIC(8,2) NOT NULL DEFAULT 0,
    created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (employee_id, week_start)
  )
`;

console.log("✓ employee_hours and employee_overtime tables created");
process.exit(0);
