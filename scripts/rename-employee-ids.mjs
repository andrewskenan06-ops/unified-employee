import { neon } from "@neondatabase/serverless";
import { readFileSync } from "fs";

const env = Object.fromEntries(
  readFileSync(new URL("../.env.local", import.meta.url), "utf8")
    .split("\n").filter(l => l.includes("="))
    .map(l => l.split("=").map(s => s.trim()))
);
const sql = neon(env.DATABASE_URL);

const mapping = [
  ["emp_1", "jordan_lee"],
  ["emp_2", "sam_torres"],
  ["emp_3", "morgan_davis"],
  ["emp_4", "justin_andrews"],
  ["emp_5", "alex_rivera"],
  ["emp_6", "taylor_brooks"],
  ["emp_7", "casey_nguyen"],
  ["emp_8", "riley_simmons"],
  ["emp_9", "drew_patel"],
];

// Drop all FK constraints pointing to users(id)
await sql`ALTER TABLE employee_pay        DROP CONSTRAINT IF EXISTS employee_pay_employee_id_fkey`;
await sql`ALTER TABLE employee_benefits   DROP CONSTRAINT IF EXISTS employee_benefits_employee_id_fkey`;
await sql`ALTER TABLE employee_deductions DROP CONSTRAINT IF EXISTS employee_deductions_employee_id_fkey`;
await sql`ALTER TABLE employee_hours      DROP CONSTRAINT IF EXISTS employee_hours_employee_id_fkey`;
await sql`ALTER TABLE employee_overtime   DROP CONSTRAINT IF EXISTS employee_overtime_employee_id_fkey`;
await sql`ALTER TABLE pay_stubs           DROP CONSTRAINT IF EXISTS pay_stubs_employee_id_fkey`;
await sql`ALTER TABLE time_records        DROP CONSTRAINT IF EXISTS time_records_employee_id_fkey`;
await sql`ALTER TABLE schedule_slots      DROP CONSTRAINT IF EXISTS schedule_slots_employee_id_fkey`;
console.log("✓ FK constraints dropped");

// Rename IDs everywhere
for (const [oldId, newId] of mapping) {
  await sql`UPDATE employee_pay        SET employee_id = ${newId} WHERE employee_id = ${oldId}`;
  await sql`UPDATE employee_benefits   SET employee_id = ${newId} WHERE employee_id = ${oldId}`;
  await sql`UPDATE employee_deductions SET employee_id = ${newId} WHERE employee_id = ${oldId}`;
  await sql`UPDATE employee_hours      SET employee_id = ${newId} WHERE employee_id = ${oldId}`;
  await sql`UPDATE employee_overtime   SET employee_id = ${newId} WHERE employee_id = ${oldId}`;
  await sql`UPDATE pay_stubs           SET employee_id = ${newId} WHERE employee_id = ${oldId}`;
  await sql`UPDATE time_records        SET employee_id = ${newId} WHERE employee_id = ${oldId}`;
  await sql`UPDATE schedule_slots      SET employee_id = ${newId} WHERE employee_id = ${oldId}`;
  await sql`UPDATE users               SET id          = ${newId} WHERE id          = ${oldId}`;
  console.log(`✓ ${oldId} → ${newId}`);
}

// Restore FK constraints
await sql`ALTER TABLE employee_pay        ADD CONSTRAINT employee_pay_employee_id_fkey        FOREIGN KEY (employee_id) REFERENCES users(id)`;
await sql`ALTER TABLE employee_benefits   ADD CONSTRAINT employee_benefits_employee_id_fkey   FOREIGN KEY (employee_id) REFERENCES users(id)`;
await sql`ALTER TABLE employee_deductions ADD CONSTRAINT employee_deductions_employee_id_fkey FOREIGN KEY (employee_id) REFERENCES users(id)`;
await sql`ALTER TABLE employee_hours      ADD CONSTRAINT employee_hours_employee_id_fkey      FOREIGN KEY (employee_id) REFERENCES users(id)`;
await sql`ALTER TABLE employee_overtime   ADD CONSTRAINT employee_overtime_employee_id_fkey   FOREIGN KEY (employee_id) REFERENCES users(id)`;
await sql`ALTER TABLE pay_stubs           ADD CONSTRAINT pay_stubs_employee_id_fkey           FOREIGN KEY (employee_id) REFERENCES users(id)`;
await sql`ALTER TABLE time_records        ADD CONSTRAINT time_records_employee_id_fkey        FOREIGN KEY (employee_id) REFERENCES users(id)`;
await sql`ALTER TABLE schedule_slots      ADD CONSTRAINT schedule_slots_employee_id_fkey      FOREIGN KEY (employee_id) REFERENCES users(id)`;
console.log("✓ FK constraints restored");

process.exit(0);
