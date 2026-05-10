import { neon } from "@neondatabase/serverless";
import { readFileSync } from "fs";

const env = Object.fromEntries(
  readFileSync(new URL("../.env.local", import.meta.url), "utf8")
    .split("\n").filter(l => l.includes("="))
    .map(l => l.split("=").map(s => s.trim()))
);
const sql = neon(env.DATABASE_URL);

const stubs = await sql`
  SELECT ps.employee_id,
         ps.period_start::date AS week_start,
         ps.period_end::date   AS week_end,
         ps.hours_worked,
         ps.regular_hours,
         ps.overtime_hours,
         ps.overtime_pay,
         ep.pay_rate
  FROM pay_stubs ps
  JOIN employee_pay ep ON ep.employee_id = ps.employee_id
  WHERE ps.employee_id LIKE 'emp_%'
    AND ps.hours_worked IS NOT NULL`;

for (const s of stubs) {
  const overtime_rate = (Number(s.pay_rate) * 1.5).toFixed(2);

  await sql`
    INSERT INTO employee_hours (employee_id, week_start, week_end, hours_worked, regular_hours)
    VALUES (${s.employee_id}, ${s.week_start}, ${s.week_end}, ${s.hours_worked}, ${s.regular_hours})
    ON CONFLICT (employee_id, week_start) DO UPDATE SET
      week_end      = EXCLUDED.week_end,
      hours_worked  = EXCLUDED.hours_worked,
      regular_hours = EXCLUDED.regular_hours`;

  await sql`
    INSERT INTO employee_overtime (employee_id, week_start, week_end, overtime_hours, overtime_rate, overtime_pay)
    VALUES (${s.employee_id}, ${s.week_start}, ${s.week_end}, ${s.overtime_hours}, ${overtime_rate}, ${s.overtime_pay})
    ON CONFLICT (employee_id, week_start) DO UPDATE SET
      week_end       = EXCLUDED.week_end,
      overtime_hours = EXCLUDED.overtime_hours,
      overtime_rate  = EXCLUDED.overtime_rate,
      overtime_pay   = EXCLUDED.overtime_pay`;
}

console.log(`✓ Seeded ${stubs.length} records for ${new Set(stubs.map(s => s.employee_id)).size} employees`);
process.exit(0);
