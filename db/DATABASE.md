# Database — Unified Employee Platform

**Provider:** [Neon](https://neon.tech) (Serverless PostgreSQL)  
**Database:** `neondb`  
**Region:** `us-east-1`  
**Endpoint:** `ep-snowy-mud-a4kwf9ev.us-east-1.aws.neon.tech`  
> Use the **non-pooler** endpoint for DDL operations. The pooler (`-pooler`) causes DDL visibility issues.

---

## Tables

### `users`
Stores all employees and admins. Replaces the hardcoded `USERS` array in `lib/auth.js` once Supabase auth is wired up.

| Column | Type | Notes |
|---|---|---|
| `id` | `TEXT` | Primary key — e.g. `emp_1`, `adm_1` |
| `username` | `TEXT` | Unique login username |
| `password` | `TEXT` | Plain text for demo — hash with bcrypt in production |
| `pin` | `TEXT` | 4-digit PIN used for kiosk clock in/out |
| `name` | `TEXT` | Full display name |
| `role` | `TEXT` | `employee` or `admin` |
| `job_role` | `TEXT` | `Office Worker`, `Yard Worker`, `Truck Driver`, `Dirt Manager` — nullable |
| `created_at` | `TIMESTAMPTZ` | Auto-set on insert |

---

### `time_records`
One row per clock-in event. Clock-out updates the same row.

| Column | Type | Notes |
|---|---|---|
| `id` | `SERIAL` | Primary key |
| `employee_id` | `TEXT` | FK → `users.id` |
| `clock_in` | `TIMESTAMPTZ` | Timestamp of clock-in punch |
| `clock_out` | `TIMESTAMPTZ` | Null until employee clocks out |
| `clock_in_lat` | `NUMERIC(10,7)` | GPS latitude at clock-in |
| `clock_in_lng` | `NUMERIC(10,7)` | GPS longitude at clock-in |
| `clock_out_lat` | `NUMERIC(10,7)` | GPS latitude at clock-out |
| `clock_out_lng` | `NUMERIC(10,7)` | GPS longitude at clock-out |
| `flagged` | `BOOLEAN` | `TRUE` if either punch was outside the geofence |
| `created_at` | `TIMESTAMPTZ` | Auto-set on insert |

**Indexes:** `idx_time_records_employee` on `employee_id`, `idx_time_records_clock_in` on `clock_in`

---

### `schedule_slots`
One row per employee per Saturday. Enforces a unique constraint so no one can be double-booked.

| Column | Type | Notes |
|---|---|---|
| `id` | `SERIAL` | Primary key |
| `date` | `DATE` | The Saturday date — e.g. `2026-04-18` |
| `employee_id` | `TEXT` | FK → `users.id` |
| `added_by` | `TEXT` | FK → `users.id` — `NULL` if self-scheduled, admin ID if admin-added |
| `created_at` | `TIMESTAMPTZ` | Auto-set on insert |

**Unique constraint:** `(date, employee_id)` — one slot per person per day  
**Index:** `idx_schedule_slots_date` on `date`

---

### `project_memory`
Stores AI assistant context documents so project knowledge persists across sessions.

| Column | Type | Notes |
|---|---|---|
| `id` | `SERIAL` | Primary key |
| `name` | `TEXT` | Unique document name |
| `type` | `TEXT` | `project`, `feedback`, `user`, `reference` |
| `description` | `TEXT` | One-line summary |
| `content` | `TEXT` | Full markdown content |
| `updated_at` | `TIMESTAMPTZ` | Auto-updated on upsert |

---

## Seed Data

All 10 users are pre-seeded with roles and PINs:

| Username | PIN | Role | Job Role |
|---|---|---|---|
| jordan | 1001 | employee | Yard Worker |
| sam | 1002 | employee | Office Worker |
| morgan | 1003 | employee | Truck Driver |
| justin | 1004 | employee | Dirt Manager |
| alex | 1005 | employee | Yard Worker |
| taylor | 1006 | employee | Office Worker |
| casey | 1007 | employee | Truck Driver |
| riley | 1008 | employee | Dirt Manager |
| drew | 1009 | employee | Yard Worker |
| admin | 0000 | admin | — |

---

## Geofence
Clock-in/out location is checked against:

| Field | Value |
|---|---|
| Location | Fordham University |
| Latitude | `40.8610` |
| Longitude | `-73.8837` |
| Radius | `1000 ft` |

Punches outside this radius are saved with `flagged = TRUE` and highlighted in the admin time records view.

---

## Environment
Connection string stored in `.env.local` (gitignored):
```
DATABASE_URL=postgresql://neondb_owner:...@ep-snowy-mud-a4kwf9ev.us-east-1.aws.neon.tech/neondb?sslmode=require
```
