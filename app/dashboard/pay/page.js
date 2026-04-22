"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getSession } from "@/lib/auth";

const HEALTH_LABELS = { none: "No Coverage", basic: "Basic Plan", premium: "Premium Plan" };
const HEALTH_STYLES = {
  none:    { bg: "bg-gray-100",    text: "text-gray-500"   },
  basic:   { bg: "bg-blue-50",     text: "text-blue-700"   },
  premium: { bg: "bg-violet-50",   text: "text-violet-700" },
};

function fmt$(n) {
  return Number(n).toLocaleString("en-US", { style: "currency", currency: "USD" });
}

function fmtDate(d) {
  if (!d) return "—";
  const date = new Date(String(d).includes("T") ? d : d + "T00:00:00");
  return date.toLocaleDateString([], { month: "short", day: "numeric", year: "numeric" });
}

function nextPayDate() {
  const today = new Date();
  const ref   = new Date("2026-04-24");
  while (ref <= today) ref.setDate(ref.getDate() + 7);
  return ref.toLocaleDateString([], { month: "long", day: "numeric", year: "numeric" });
}

// ── Employee View ─────────────────────────────────────────────────
function EmployeePayPage({ session }) {
  const [data, setData]         = useState(null);
  const [loading, setLoading]   = useState(true);
  const [expanded, setExpanded] = useState(null);

  useEffect(() => {
    fetch(`/api/pay/${session.id}`)
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, [session.id]);

  if (loading) return <div className="p-10 text-center text-gray-400 text-sm">Loading…</div>;
  if (!data?.pay) return <div className="p-10 text-center text-gray-400 text-sm">No pay info set yet — contact your manager.</div>;

  const { pay, benefits, stubs } = data;
  const latest = stubs?.[0];
  const ytd    = stubs?.reduce((sum, s) => sum + Number(s.gross_pay), 0) ?? 0;

  const deductions = latest ? [
    { label: "Federal Tax",      amount: latest.federal_tax,        color: "text-red-600" },
    { label: "State Tax",        amount: latest.state_tax,          color: "text-red-600" },
    { label: "Social Security",  amount: latest.social_security,    color: "text-orange-600" },
    { label: "Medicare",         amount: latest.medicare,           color: "text-orange-600" },
    { label: "Benefits",         amount: latest.benefits_deduction, color: "text-blue-600" },
  ] : [];

  return (
    <div className="px-8 py-8 max-w-3xl mx-auto space-y-6">

      <div>
        <h1 className="text-2xl font-bold text-primary">Pay & Benefits</h1>
        <p className="text-sm text-gray-400 mt-0.5">{session.name}</p>
      </div>

      {/* Top cards */}
      <div className="grid grid-cols-2 gap-4">

        {/* Pay card */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
          <p className="text-xs font-semibold uppercase tracking-widest text-gray-400">Compensation</p>
          <div>
            <p className="text-3xl font-black text-primary tabular-nums">
              {pay.pay_type === "hourly" ? `${fmt$(pay.pay_rate)}/hr` : fmt$(pay.pay_rate)}
            </p>
            <p className="text-xs text-gray-400 mt-1 capitalize">
              {pay.pay_type === "salary" ? "Annual salary" : "Hourly"} · Weekly pay
            </p>
          </div>
          <div className="border-t border-gray-100 pt-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Next payday</span>
              <span className="font-semibold text-primary">{nextPayDate()}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">YTD Gross</span>
              <span className="font-semibold text-accent">{fmt$(ytd)}</span>
            </div>
          </div>
        </div>

        {/* Benefits card */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
          <p className="text-xs font-semibold uppercase tracking-widest text-gray-400">Benefits</p>
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500">Health</span>
              <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${HEALTH_STYLES[benefits?.health_plan ?? "none"].bg} ${HEALTH_STYLES[benefits?.health_plan ?? "none"].text}`}>
                {HEALTH_LABELS[benefits?.health_plan ?? "none"]}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500">Dental</span>
              <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${benefits?.dental ? "bg-accent/10 text-accent" : "bg-gray-100 text-gray-400"}`}>
                {benefits?.dental ? "Enrolled" : "Not enrolled"}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500">Vision</span>
              <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${benefits?.vision ? "bg-accent/10 text-accent" : "bg-gray-100 text-gray-400"}`}>
                {benefits?.vision ? "Enrolled" : "Not enrolled"}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500">401(k)</span>
              <span className="text-xs font-semibold bg-primary/5 text-primary px-2.5 py-1 rounded-full">
                {benefits?.retirement_pct ?? 0}% contribution
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Last paycheck breakdown */}
      {latest && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-5">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-widest text-gray-400">Last Paycheck</p>
            <span className="text-xs text-gray-400">{fmtDate(latest.period_start)} – {fmtDate(latest.period_end)}</span>
          </div>

          {/* Gross → Net */}
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-400 uppercase tracking-wide">Gross Pay</p>
              <p className="text-2xl font-black text-primary tabular-nums">{fmt$(latest.gross_pay)}</p>
            </div>
            <div className="text-gray-200 text-2xl">→</div>
            <div className="text-right">
              <p className="text-xs text-gray-400 uppercase tracking-wide">Net Pay</p>
              <p className="text-2xl font-black text-accent tabular-nums">{fmt$(latest.net_pay)}</p>
            </div>
          </div>

          {/* Hours & Earnings */}
          {latest.hours_worked != null && (
            <div className="border-t border-gray-100 pt-4 space-y-3">
              <p className="text-xs font-semibold uppercase tracking-widest text-gray-300">Hours & Earnings</p>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500">Regular — {Number(latest.regular_hours)}h @ {fmt$(pay.pay_rate)}/hr</span>
                <span className="font-semibold tabular-nums text-primary">{fmt$(latest.regular_pay)}</span>
              </div>
              <div className={`flex items-center justify-between text-sm rounded-xl px-3 py-2 ${Number(latest.overtime_hours) > 0 ? "bg-amber-50 border border-amber-100" : "bg-gray-50 border border-gray-100"}`}>
                <span className="flex items-center gap-2 font-medium text-amber-700">
                  Overtime — {Number(latest.overtime_hours)}h
                  <span className="text-[10px] font-bold bg-amber-200 text-amber-800 px-1.5 py-0.5 rounded-full">1.5×</span>
                </span>
                <span className={`font-bold tabular-nums ${Number(latest.overtime_hours) > 0 ? "text-amber-700" : "text-gray-400"}`}>
                  {Number(latest.overtime_hours) > 0 ? fmt$(latest.overtime_pay) : "$0.00"}
                </span>
              </div>
            </div>
          )}

          {/* Deductions */}
          <div className="border-t border-gray-100 pt-4 space-y-2">
            <p className="text-xs font-semibold uppercase tracking-widest text-gray-300 mb-3">Deductions</p>
            {deductions.map(d => (
              <div key={d.label} className="flex items-center justify-between text-sm">
                <span className="text-gray-500">{d.label}</span>
                <span className={`font-semibold tabular-nums ${d.color}`}>− {fmt$(d.amount)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Pay stub history */}
      {stubs?.length > 0 && (
        <div>
          <h2 className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-3">Pay Stub History</h2>
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden divide-y divide-gray-50">
            {stubs.map((s) => (
              <div key={s.id}>
                <button
                  onClick={() => setExpanded(expanded === s.id ? null : s.id)}
                  className="w-full flex items-center justify-between px-6 py-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="text-left">
                    <p className="text-sm font-semibold text-primary">
                      {fmtDate(s.period_start)} – {fmtDate(s.period_end)}
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">Paid {fmtDate(s.paid_at)}</p>
                  </div>
                  <div className="flex items-center gap-4">
                    {Number(s.overtime_hours) > 0 && (
                      <span className="text-[10px] font-bold bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">
                        {s.overtime_hours}h OT
                      </span>
                    )}
                    <div className="text-right">
                      <p className="text-xs text-gray-400">Net</p>
                      <p className="text-sm font-bold text-accent tabular-nums">{fmt$(s.net_pay)}</p>
                    </div>
                    <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                      className={`text-gray-300 transition-transform ${expanded === s.id ? "rotate-180" : ""}`}>
                      <polyline points="2,5 7,10 12,5"/>
                    </svg>
                  </div>
                </button>

                {expanded === s.id && (
                  <div className="px-6 pb-5 space-y-2 bg-gray-50/50">
                    {/* Earnings */}
                    {s.hours_worked && (
                      <>
                        <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-300 pt-2">Earnings</p>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-400">Regular ({s.regular_hours}h)</span>
                          <span className="font-semibold tabular-nums text-primary">{fmt$(s.regular_pay)}</span>
                        </div>
                        {Number(s.overtime_hours) > 0 && (
                          <div className="flex justify-between text-sm">
                            <span className="flex items-center gap-1.5 text-amber-600">
                              Overtime ({s.overtime_hours}h)
                              <span className="text-[9px] font-bold bg-amber-100 text-amber-700 px-1 py-0.5 rounded-full">1.5×</span>
                            </span>
                            <span className="font-semibold tabular-nums text-amber-600">{fmt$(s.overtime_pay)}</span>
                          </div>
                        )}
                        <div className="flex justify-between text-sm pb-1">
                          <span className="font-semibold text-gray-500">Gross Pay</span>
                          <span className="font-bold tabular-nums text-primary">{fmt$(s.gross_pay)}</span>
                        </div>
                      </>
                    )}
                    {/* Deductions */}
                    <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-300 pt-1">Deductions</p>
                    {[
                      { label: "Federal Tax",     value: `-${fmt$(s.federal_tax)}`         },
                      { label: "State Tax",       value: `-${fmt$(s.state_tax)}`           },
                      { label: "Social Security", value: `-${fmt$(s.social_security)}`     },
                      { label: "Medicare",        value: `-${fmt$(s.medicare)}`            },
                      { label: "Benefits",        value: `-${fmt$(s.benefits_deduction)}`  },
                    ].map(row => (
                      <div key={row.label} className="flex justify-between text-sm">
                        <span className="text-gray-400">{row.label}</span>
                        <span className="font-semibold tabular-nums text-red-500">{row.value}</span>
                      </div>
                    ))}
                    <div className="flex justify-between text-sm pt-2 border-t border-gray-200">
                      <span className="font-bold text-primary">Net Pay</span>
                      <span className="font-black text-accent tabular-nums">{fmt$(s.net_pay)}</span>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Admin View ────────────────────────────────────────────────────
function AdminPayPage() {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading]     = useState(true);
  const [editing, setEditing]     = useState(null);
  const [form, setForm]           = useState({});

  useEffect(() => {
    fetch("/api/pay")
      .then(r => r.json())
      .then(d => { setEmployees(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  function openEdit(emp) {
    setEditing(emp.id);
    setForm({
      pay_type:      emp.pay_type      ?? "hourly",
      pay_rate:      emp.pay_rate      ?? "",
      pay_period:    emp.pay_period    ?? "biweekly",
      health_plan:   emp.health_plan   ?? "none",
      dental:        emp.dental        ?? false,
      vision:        emp.vision        ?? false,
      retirement_pct: emp.retirement_pct ?? 0,
    });
  }

  async function saveEdit(empId) {
    await fetch(`/api/pay/${empId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        pay:      { pay_type: form.pay_type, pay_rate: parseFloat(form.pay_rate), pay_period: form.pay_period },
        benefits: { health_plan: form.health_plan, dental: form.dental, vision: form.vision, retirement_pct: parseFloat(form.retirement_pct) },
      }),
    });
    setEmployees(emps => emps.map(e => e.id === empId ? { ...e, ...form, pay_rate: parseFloat(form.pay_rate), retirement_pct: parseFloat(form.retirement_pct) } : e));
    setEditing(null);
  }

  if (loading) return <div className="p-10 text-center text-gray-400 text-sm">Loading…</div>;

  return (
    <div className="px-8 py-8 max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-primary">Pay & Benefits</h1>
        <p className="text-sm text-gray-400 mt-0.5">Admin view — all employees</p>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden divide-y divide-gray-50">
        {employees.map((emp) => {
          const isOpen = editing === emp.id;
          return (
            <div key={emp.id} className="px-6 py-5">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-bold flex-shrink-0">
                  {emp.name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-primary">{emp.name}</p>
                  <p className="text-xs text-gray-400">{emp.job_role ?? "No role"}</p>
                </div>
                <div className="text-right hidden sm:block">
                  <p className="text-sm font-bold text-primary tabular-nums">
                    {emp.pay_rate ? (emp.pay_type === "hourly" ? `${fmt$(emp.pay_rate)}/hr` : fmt$(emp.pay_rate)) : "—"}
                  </p>
                  <p className="text-xs text-gray-400">{HEALTH_LABELS[emp.health_plan ?? "none"]}</p>
                </div>
                {!isOpen && (
                  <button
                    onClick={() => openEdit(emp)}
                    className="text-xs font-semibold text-gray-400 hover:text-primary border border-gray-200 hover:border-primary/30 px-3 py-1.5 rounded-lg transition-colors"
                  >
                    Edit
                  </button>
                )}
                {isOpen && (
                  <button onClick={() => setEditing(null)} className="text-xs text-gray-400 hover:text-gray-600">Cancel</button>
                )}
              </div>

              {isOpen && (
                <div className="mt-5 ml-14 grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Pay Type</label>
                    <select value={form.pay_type} onChange={e => setForm(f => ({ ...f, pay_type: e.target.value }))}
                      className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm text-primary focus:outline-none focus:border-accent">
                      <option value="hourly">Hourly</option>
                      <option value="salary">Salary</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
                      {form.pay_type === "hourly" ? "Hourly Rate ($)" : "Annual Salary ($)"}
                    </label>
                    <input type="number" value={form.pay_rate} onChange={e => setForm(f => ({ ...f, pay_rate: e.target.value }))}
                      className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm text-primary focus:outline-none focus:border-accent" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Pay Period</label>
                    <select value={form.pay_period} onChange={e => setForm(f => ({ ...f, pay_period: e.target.value }))}
                      className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm text-primary focus:outline-none focus:border-accent">
                      <option value="weekly">Weekly</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Health Plan</label>
                    <select value={form.health_plan} onChange={e => setForm(f => ({ ...f, health_plan: e.target.value }))}
                      className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm text-primary focus:outline-none focus:border-accent">
                      <option value="none">No Coverage</option>
                      <option value="basic">Basic Plan</option>
                      <option value="premium">Premium Plan</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-gray-400 uppercase tracking-wide">401(k) %</label>
                    <input type="number" min="0" max="100" step="0.5" value={form.retirement_pct}
                      onChange={e => setForm(f => ({ ...f, retirement_pct: e.target.value }))}
                      className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm text-primary focus:outline-none focus:border-accent" />
                  </div>
                  <div className="space-y-2 pt-1">
                    <label className="text-xs font-semibold text-gray-400 uppercase tracking-wide block">Coverage</label>
                    <div className="flex gap-4">
                      <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
                        <input type="checkbox" checked={form.dental} onChange={e => setForm(f => ({ ...f, dental: e.target.checked }))}
                          className="accent-accent w-4 h-4" /> Dental
                      </label>
                      <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
                        <input type="checkbox" checked={form.vision} onChange={e => setForm(f => ({ ...f, vision: e.target.checked }))}
                          className="accent-accent w-4 h-4" /> Vision
                      </label>
                    </div>
                  </div>
                  <div className="col-span-2">
                    <button onClick={() => saveEdit(emp.id)}
                      className="bg-accent hover:bg-accent/90 text-primary font-bold px-6 py-2.5 rounded-xl text-sm transition-colors">
                      Save Changes
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Root ──────────────────────────────────────────────────────────
export default function PayPage() {
  const router  = useRouter();
  const [session, setSession] = useState(null);

  useEffect(() => {
    const s = getSession();
    if (!s) { router.replace("/login"); return; }
    setSession(s);
  }, [router]);

  if (!session) return null;
  return session.role === "admin" ? <AdminPayPage /> : <EmployeePayPage session={session} />;
}
