"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getSession } from "@/lib/auth";
import { healthStyle, nextPayDate as calcNextPayDate } from "@/lib/constants";

function fmt$(n) {
  return Number(n).toLocaleString("en-US", { style: "currency", currency: "USD" });
}

function fmtDate(d) {
  if (!d) return "—";
  const date = new Date(String(d).includes("T") ? d : d + "T00:00:00");
  return date.toLocaleDateString([], { month: "short", day: "numeric", year: "numeric" });
}

// ── Employee View ─────────────────────────────────────────────────
function EmployeePayPage({ session }) {
  const [data, setData]         = useState(null);
  const [deductCfg, setDeductCfg] = useState(null);
  const [settings, setSettings] = useState({});
  const [loading, setLoading]   = useState(true);
  const [expanded, setExpanded] = useState(null);

  useEffect(() => {
    Promise.all([
      fetch(`/api/pay/${session.id}`).then(r => r.json()),
      fetch(`/api/deductions/${session.id}`).then(r => r.json()),
      fetch("/api/settings").then(r => r.json()),
    ]).then(([d, dc, cfg]) => { setData(d); setDeductCfg(dc); setSettings(cfg); setLoading(false); })
      .catch(() => setLoading(false));
  }, [session.id]);

  if (loading) return <div className="p-10 text-center text-gray-400 text-sm">Loading…</div>;
  if (!data?.pay) return <div className="p-10 text-center text-gray-400 text-sm">No pay info set yet — contact your manager.</div>;

  const { pay, benefits, stubs } = data;
  const latest    = stubs?.[0];
  const ytd       = stubs?.reduce((sum, s) => sum + Number(s.gross_pay), 0) ?? 0;
  const healthPlans  = settings.health_plans  ?? [{ value: "none", label: "No Coverage" }, { value: "basic", label: "Basic Plan" }, { value: "premium", label: "Premium Plan" }];
  const otMultiplier = settings.overtime_multiplier ?? 1.5;
  const payDate      = calcNextPayDate(settings.pay_period_ref_date, settings.pay_period);

  const hValue = benefits?.health_plan ?? "none";
  const hPlan  = healthPlans.find(p => p.value === hValue);
  const hLabel = hPlan?.label ?? hValue;
  const hStyle = healthStyle(hValue, healthPlans);

  const deductions = latest ? [
    deductCfg?.federal_tax     !== false && { label: "Federal Tax",     amount: latest.federal_tax,        color: "text-red-600" },
    deductCfg?.state_tax       !== false && { label: "State Tax",       amount: latest.state_tax,          color: "text-red-600" },
    deductCfg?.social_security !== false && { label: "Social Security", amount: latest.social_security,    color: "text-orange-600" },
    deductCfg?.medicare        !== false && { label: "Medicare",        amount: latest.medicare,           color: "text-orange-600" },
    deductCfg?.benefits        !== false && { label: "Benefits",        amount: latest.benefits_deduction, color: "text-blue-600" },
    { label: "Child Support", amount: deductCfg?.child_support ? deductCfg.child_support_amount : 0, color: deductCfg?.child_support ? "text-purple-600" : "text-gray-300" },
  ].filter(Boolean) : [];

  return (
    <div className="px-8 py-8 max-w-3xl mx-auto space-y-6">

      <div>
        <h1 className="text-2xl font-bold text-primary">Pay & Benefits</h1>
        <p className="text-sm text-gray-400 mt-0.5">{session.name}</p>
      </div>

      {/* Top cards */}
      <div className="grid grid-cols-3 gap-4">

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
              <span className="font-semibold text-primary">{payDate}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">YTD Gross</span>
              <span className="font-semibold text-accent">{fmt$(ytd)}</span>
            </div>
          </div>
        </div>

        {/* Overtime card */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
          <div className="flex items-center gap-2">
            <p className="text-xs font-semibold uppercase tracking-widest text-gray-400">Overtime</p>
            <span className="text-[10px] font-bold bg-amber-200 text-amber-800 px-1.5 py-0.5 rounded-full">{otMultiplier}×</span>
          </div>
          {latest ? (
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Hours over 60</span>
                <span className="font-semibold text-primary">{Number(latest.overtime_hours)}h</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Pay for 60+ hrs</span>
                <span className="font-semibold text-primary">{fmt$(Number(pay.pay_rate) * otMultiplier)}/hr</span>
              </div>
              <div className="border-t border-gray-100 pt-3 flex justify-between text-sm">
                <span className="font-semibold text-gray-500">Total</span>
                <span className={`font-black tabular-nums text-lg ${Number(latest.overtime_hours) > 0 ? "text-amber-600" : "text-gray-300"}`}>
                  {fmt$(latest.overtime_pay)}
                </span>
              </div>
            </div>
          ) : (
            <p className="text-sm text-gray-300">No stubs yet</p>
          )}
        </div>

        {/* Benefits card */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
          <p className="text-xs font-semibold uppercase tracking-widest text-gray-400">Benefits</p>
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500">Health</span>
              <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${hStyle.bg} ${hStyle.text}`}>
                {hLabel}
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

          {latest.hours_worked != null && (
            <div className="border-t border-gray-100 pt-4 space-y-2">
              <p className="text-xs font-semibold uppercase tracking-widest text-gray-300">Regular Hours</p>
              <div className="flex items-center justify-between text-sm bg-gray-50 rounded-xl px-4 py-3">
                <span className="text-gray-500">{Number(latest.regular_hours)}h @ {fmt$(pay.pay_rate)}/hr</span>
                <span className="font-bold tabular-nums text-primary">{fmt$(latest.regular_pay)}</span>
              </div>
            </div>
          )}

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
                              <span className="text-[9px] font-bold bg-amber-100 text-amber-700 px-1 py-0.5 rounded-full">OT</span>
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
  const [employees, setEmployees]   = useState([]);
  const [deductions, setDeductions] = useState({});
  const [settings, setSettings]     = useState({});
  const [loading, setLoading]       = useState(true);
  const [editing, setEditing]       = useState(null);
  const [form, setForm]             = useState({});
  const [deductForm, setDeductForm] = useState({});

  useEffect(() => {
    Promise.all([
      fetch("/api/pay").then(r => r.json()),
      fetch("/api/settings").then(r => r.json()),
    ]).then(async ([emps, cfg]) => {
        setSettings(cfg);
        setEmployees(emps);
        const configs = await Promise.all(
          emps.map(e => fetch(`/api/deductions/${e.id}`).then(r => r.json()))
        );
        const map = {};
        emps.forEach((e, i) => { map[e.id] = configs[i]; });
        setDeductions(map);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const healthPlans = settings.health_plans ?? [{ value: "none", label: "No Coverage" }, { value: "basic", label: "Basic Plan" }, { value: "premium", label: "Premium Plan" }];

  function openEdit(emp) {
    setEditing(emp.id);
    const dc = deductions[emp.id] ?? {};
    setForm({
      pay_type:       emp.pay_type       ?? "hourly",
      pay_rate:       emp.pay_rate       ?? "",
      pay_period:     emp.pay_period     ?? "weekly",
      health_plan:    emp.health_plan    ?? "none",
      dental:         emp.dental         ?? false,
      vision:         emp.vision         ?? false,
      retirement_pct: emp.retirement_pct ?? 0,
    });
    setDeductForm({
      federal_tax:          dc.federal_tax          ?? true,
      state_tax:            dc.state_tax            ?? true,
      social_security:      dc.social_security      ?? true,
      medicare:             dc.medicare             ?? true,
      benefits:             dc.benefits             ?? true,
      child_support:        dc.child_support        ?? false,
      child_support_amount: dc.child_support_amount ?? 0,
    });
  }

  async function saveEdit(empId) {
    await Promise.all([
      fetch(`/api/pay/${empId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pay:      { pay_type: form.pay_type, pay_rate: parseFloat(form.pay_rate), pay_period: form.pay_period },
          benefits: { health_plan: form.health_plan, dental: form.dental, vision: form.vision, retirement_pct: parseFloat(form.retirement_pct) },
        }),
      }),
      fetch(`/api/deductions/${empId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...deductForm, child_support_amount: parseFloat(deductForm.child_support_amount) || 0 }),
      }),
    ]);
    setEmployees(emps => emps.map(e => e.id === empId ? { ...e, ...form, pay_rate: parseFloat(form.pay_rate), retirement_pct: parseFloat(form.retirement_pct) } : e));
    setDeductions(d => ({ ...d, [empId]: { ...deductForm } }));
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
          const hPlan  = healthPlans.find(p => p.value === (emp.health_plan ?? "none"));
          const hLabel = hPlan?.label ?? emp.health_plan ?? "None";
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
                  <p className="text-xs text-gray-400">{hLabel}</p>
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
                      {healthPlans.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
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
                  <div className="col-span-2 space-y-3 border-t border-gray-100 pt-4">
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Deductions</p>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { key: "federal_tax",     label: "Federal Tax" },
                        { key: "state_tax",        label: "State Tax" },
                        { key: "social_security",  label: "Social Security" },
                        { key: "medicare",         label: "Medicare" },
                        { key: "benefits",         label: "Benefits" },
                      ].map(({ key, label }) => (
                        <label key={key} className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
                          <input type="checkbox" checked={deductForm[key] ?? true}
                            onChange={e => setDeductForm(f => ({ ...f, [key]: e.target.checked }))}
                            className="accent-accent w-4 h-4" />
                          {label}
                        </label>
                      ))}
                    </div>
                    <div className="flex items-center gap-3 pt-1">
                      <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
                        <input type="checkbox" checked={deductForm.child_support ?? false}
                          onChange={e => setDeductForm(f => ({ ...f, child_support: e.target.checked }))}
                          className="accent-accent w-4 h-4" />
                        Child Support
                      </label>
                      {deductForm.child_support && (
                        <input type="number" min="0" step="0.01" placeholder="Court-Ordered Amount $"
                          value={deductForm.child_support_amount}
                          onChange={e => setDeductForm(f => ({ ...f, child_support_amount: e.target.value }))}
                          className="border border-gray-200 rounded-xl px-3 py-1.5 text-sm text-primary focus:outline-none focus:border-accent w-48" />
                      )}
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
