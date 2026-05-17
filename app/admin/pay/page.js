"use client";
import { useState, useEffect, useMemo } from "react";
import { getSession } from "@/lib/auth";
import { roleStyle as getRoleStyle, healthStyle, nextPayDate as calcNextPayDate } from "@/lib/constants";

function fmt$(n) {
  return Number(n).toLocaleString("en-US", { style: "currency", currency: "USD" });
}
function fmtDate(d) {
  if (!d) return "—";
  const date = new Date(String(d).includes("T") ? d : d + "T00:00:00");
  return date.toLocaleDateString([], { month: "short", day: "numeric", year: "numeric" });
}
function initials(name) {
  return name?.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2) ?? "??";
}

const INPUT = "w-full border border-gray-200 rounded-xl px-3 py-2 text-sm text-primary focus:outline-none focus:border-accent transition-colors";

function EditForm({ f, setF, df, setDf, onSave, onCancel, isSaving, healthPlans }) {
  return (
    <div className="bg-white rounded-2xl border border-primary/10 shadow-sm overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-50 bg-primary/5">
        <p className="text-xs font-bold text-primary uppercase tracking-widest">Edit Pay & Benefits</p>
      </div>
      <div className="px-6 py-5 space-y-6">
        <div>
          <div className="flex items-center gap-2 mb-4"><div className="w-1 h-4 bg-accent rounded-full" /><p className="text-xs font-bold text-primary uppercase tracking-widest">Compensation</p></div>
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block">Pay Type</label>
              <select value={f.pay_type} onChange={e => setF(x => ({ ...x, pay_type: e.target.value }))} className={INPUT}>
                <option value="hourly">Hourly</option><option value="salary">Salary</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block">{f.pay_type === "hourly" ? "Hourly Rate ($)" : "Annual Salary ($)"}</label>
              <input type="number" value={f.pay_rate} onChange={e => setF(x => ({ ...x, pay_rate: e.target.value }))} className={INPUT} />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block">Pay Period</label>
              <select value={f.pay_period} onChange={e => setF(x => ({ ...x, pay_period: e.target.value }))} className={INPUT}>
                <option value="weekly">Weekly</option>
              </select>
            </div>
          </div>
        </div>
        <div className="border-t border-gray-100 pt-6">
          <div className="flex items-center gap-2 mb-4"><div className="w-1 h-4 bg-accent rounded-full" /><p className="text-xs font-bold text-primary uppercase tracking-widest">Benefits</p></div>
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block">Health Plan</label>
              <select value={f.health_plan} onChange={e => setF(x => ({ ...x, health_plan: e.target.value }))} className={INPUT}>
                {(healthPlans ?? []).map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block">401(k) %</label>
              <input type="number" min="0" max="100" step="0.5" value={f.retirement_pct} onChange={e => setF(x => ({ ...x, retirement_pct: e.target.value }))} className={INPUT} />
            </div>
            <div className="space-y-1.5 pt-1">
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block">Coverage</label>
              <div className="flex gap-4 pt-1">
                <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer select-none">
                  <input type="checkbox" checked={f.dental} onChange={e => setF(x => ({ ...x, dental: e.target.checked }))} className="accent-accent w-4 h-4" /> Dental
                </label>
                <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer select-none">
                  <input type="checkbox" checked={f.vision} onChange={e => setF(x => ({ ...x, vision: e.target.checked }))} className="accent-accent w-4 h-4" /> Vision
                </label>
              </div>
            </div>
          </div>
        </div>
        <div className="border-t border-gray-100 pt-6">
          <div className="flex items-center gap-2 mb-4"><div className="w-1 h-4 bg-accent rounded-full" /><p className="text-xs font-bold text-primary uppercase tracking-widest">Deductions</p></div>
          <div className="grid grid-cols-3 gap-3">
            {[{key:"federal_tax",label:"Federal Tax"},{key:"state_tax",label:"State Tax"},{key:"social_security",label:"Social Security"},{key:"medicare",label:"Medicare"},{key:"benefits",label:"Benefits"}].map(({ key, label }) => (
              <label key={key} className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer select-none">
                <input type="checkbox" checked={df[key] ?? true} onChange={e => setDf(x => ({ ...x, [key]: e.target.checked }))} className="accent-accent w-4 h-4" />{label}
              </label>
            ))}
          </div>
          <div className="flex items-center gap-3 mt-3">
            <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer select-none">
              <input type="checkbox" checked={df.child_support ?? false} onChange={e => setDf(x => ({ ...x, child_support: e.target.checked }))} className="accent-accent w-4 h-4" /> Child Support
            </label>
            {df.child_support && (
              <input type="number" min="0" step="0.01" placeholder="Court-Ordered Amount $" value={df.child_support_amount}
                onChange={e => setDf(x => ({ ...x, child_support_amount: e.target.value }))}
                className="border border-gray-200 rounded-xl px-3 py-1.5 text-sm text-primary focus:outline-none focus:border-accent w-52" />
            )}
          </div>
        </div>
        <div className="border-t border-gray-50 pt-5 flex gap-3">
          <button onClick={onSave} disabled={isSaving} className="bg-accent hover:bg-accent/90 text-primary font-bold px-6 py-2.5 rounded-xl text-sm transition-colors disabled:opacity-50 shadow-sm">
            {isSaving ? "Saving…" : "Save Changes"}
          </button>
          <button onClick={onCancel} className="text-sm text-gray-400 hover:text-gray-600 px-4 py-2.5 rounded-xl hover:bg-gray-100 transition-colors">Cancel</button>
        </div>
      </div>
    </div>
  );
}

function PayCards({ pay, benefits, latestStub, ytdVal, healthPlans, payDate, otMultiplier }) {
  const hValue = benefits?.health_plan ?? "none";
  const hPlan  = (healthPlans ?? []).find(p => p.value === hValue);
  const hLabel = hPlan?.label ?? hValue;
  const hStyle = healthStyle(hValue, healthPlans ?? []);
  const otMult = otMultiplier ?? 1.5;
  return (
    <div className="grid grid-cols-3 gap-4">
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
        <p className="text-xs font-semibold uppercase tracking-widest text-gray-400">Compensation</p>
        <div>
          <p className="text-3xl font-black text-primary tabular-nums">
            {pay?.pay_rate ? (pay.pay_type === "hourly" ? `${fmt$(pay.pay_rate)}/hr` : fmt$(pay.pay_rate)) : "—"}
          </p>
          <p className="text-xs text-gray-400 mt-1 capitalize">{pay?.pay_type === "salary" ? "Annual salary" : "Hourly"} · Weekly pay</p>
        </div>
        <div className="border-t border-gray-100 pt-4 space-y-2">
          <div className="flex justify-between text-sm"><span className="text-gray-400">Next payday</span><span className="font-semibold text-primary">{payDate}</span></div>
          <div className="flex justify-between text-sm"><span className="text-gray-400">YTD Gross</span><span className="font-semibold text-accent">{fmt$(ytdVal)}</span></div>
        </div>
      </div>
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
        <div className="flex items-center gap-2">
          <p className="text-xs font-semibold uppercase tracking-widest text-gray-400">Overtime</p>
          <span className="text-[10px] font-bold bg-amber-200 text-amber-800 px-1.5 py-0.5 rounded-full">{otMult}×</span>
        </div>
        {latestStub ? (
          <div className="space-y-3">
            <div className="flex justify-between text-sm"><span className="text-gray-400">Hours over 60</span><span className="font-semibold text-primary">{Number(latestStub.overtime_hours)}h</span></div>
            <div className="flex justify-between text-sm"><span className="text-gray-400">Pay for 60+ hrs</span><span className="font-semibold text-primary">{pay?.pay_rate ? `${fmt$(Number(pay.pay_rate) * otMult)}/hr` : "—"}</span></div>
            <div className="border-t border-gray-100 pt-3 flex justify-between text-sm">
              <span className="font-semibold text-gray-500">Total</span>
              <span className={`font-black tabular-nums text-lg ${Number(latestStub.overtime_hours) > 0 ? "text-amber-600" : "text-gray-300"}`}>{fmt$(latestStub.overtime_pay)}</span>
            </div>
          </div>
        ) : <p className="text-sm text-gray-300">No stubs yet</p>}
      </div>
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
        <p className="text-xs font-semibold uppercase tracking-widest text-gray-400">Benefits</p>
        <div className="space-y-2.5">
          {[
            { label: "Health", value: hLabel, style: `${hStyle.bg} ${hStyle.text}` },
            { label: "Dental", value: benefits?.dental ? "Enrolled" : "Not enrolled", style: benefits?.dental ? "bg-accent/10 text-accent" : "bg-gray-100 text-gray-400" },
            { label: "Vision", value: benefits?.vision ? "Enrolled" : "Not enrolled", style: benefits?.vision ? "bg-accent/10 text-accent" : "bg-gray-100 text-gray-400" },
          ].map(row => (
            <div key={row.label} className="flex items-center justify-between">
              <span className="text-sm text-gray-500">{row.label}</span>
              <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${row.style}`}>{row.value}</span>
            </div>
          ))}
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-500">401(k)</span>
            <span className="text-xs font-semibold bg-primary/5 text-primary px-2.5 py-1 rounded-full">{benefits?.retirement_pct ?? 0}% contribution</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function LastPaycheck({ latestStub, pay, dRows }) {
  if (!latestStub) return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 text-center">
      <p className="text-sm text-gray-300">No pay stubs on record yet.</p>
    </div>
  );
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-5">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-widest text-gray-400">Last Paycheck</p>
        <span className="text-xs text-gray-400">{fmtDate(latestStub.period_start)} – {fmtDate(latestStub.period_end)}</span>
      </div>
      <div className="flex items-center justify-between">
        <div><p className="text-xs text-gray-400 uppercase tracking-wide">Gross Pay</p><p className="text-2xl font-black text-primary tabular-nums">{fmt$(latestStub.gross_pay)}</p></div>
        <div className="text-gray-200 text-2xl">→</div>
        <div className="text-right"><p className="text-xs text-gray-400 uppercase tracking-wide">Net Pay</p><p className="text-2xl font-black text-accent tabular-nums">{fmt$(latestStub.net_pay)}</p></div>
      </div>
      {latestStub.hours_worked != null && (
        <div className="border-t border-gray-100 pt-4 space-y-2">
          <p className="text-xs font-semibold uppercase tracking-widest text-gray-300">Regular Hours</p>
          <div className="flex items-center justify-between text-sm bg-gray-50 rounded-xl px-4 py-3">
            <span className="text-gray-500">{Number(latestStub.regular_hours)}h @ {fmt$(pay?.pay_rate)}/hr</span>
            <span className="font-bold tabular-nums text-primary">{fmt$(latestStub.regular_pay)}</span>
          </div>
        </div>
      )}
      <div className="border-t border-gray-100 pt-4 space-y-2">
        <p className="text-xs font-semibold uppercase tracking-widest text-gray-300 mb-3">Deductions</p>
        {dRows.map(d => (
          <div key={d.label} className="flex items-center justify-between text-sm">
            <span className="text-gray-500">{d.label}</span>
            <span className={`font-semibold tabular-nums ${d.color}`}>− {fmt$(d.amount)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function StubHistory({ stubs, expandedId, setExpandedId }) {
  if (!stubs?.length) return null;
  return (
    <div>
      <h2 className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-3">Pay Stub History</h2>
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden divide-y divide-gray-50">
        {stubs.map(s => (
          <div key={s.id}>
            <button onClick={() => setExpandedId(expandedId === s.id ? null : s.id)}
              className="w-full flex items-center justify-between px-6 py-4 hover:bg-gray-50 transition-colors">
              <div className="text-left">
                <p className="text-sm font-semibold text-primary">{fmtDate(s.period_start)} – {fmtDate(s.period_end)}</p>
                <p className="text-xs text-gray-400 mt-0.5">Paid {fmtDate(s.paid_at)}</p>
              </div>
              <div className="flex items-center gap-4">
                {Number(s.overtime_hours) > 0 && <span className="text-[10px] font-bold bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">{s.overtime_hours}h OT</span>}
                <div className="text-right"><p className="text-xs text-gray-400">Net</p><p className="text-sm font-bold text-accent tabular-nums">{fmt$(s.net_pay)}</p></div>
                <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`text-gray-300 transition-transform ${expandedId === s.id ? "rotate-180" : ""}`}><polyline points="2,5 7,10 12,5"/></svg>
              </div>
            </button>
            {expandedId === s.id && (
              <div className="px-6 pb-5 space-y-2 bg-gray-50/50">
                {s.hours_worked && (<>
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-300 pt-2">Earnings</p>
                  <div className="flex justify-between text-sm"><span className="text-gray-400">Regular ({s.regular_hours}h)</span><span className="font-semibold tabular-nums text-primary">{fmt$(s.regular_pay)}</span></div>
                  {Number(s.overtime_hours) > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="flex items-center gap-1.5 text-amber-600">Overtime ({s.overtime_hours}h)<span className="text-[9px] font-bold bg-amber-100 text-amber-700 px-1 py-0.5 rounded-full">OT</span></span>
                      <span className="font-semibold tabular-nums text-amber-600">{fmt$(s.overtime_pay)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-sm pb-1"><span className="font-semibold text-gray-500">Gross Pay</span><span className="font-bold tabular-nums text-primary">{fmt$(s.gross_pay)}</span></div>
                </>)}
                <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-300 pt-1">Deductions</p>
                {[{label:"Federal Tax",value:fmt$(s.federal_tax)},{label:"State Tax",value:fmt$(s.state_tax)},{label:"Social Security",value:fmt$(s.social_security)},{label:"Medicare",value:fmt$(s.medicare)},{label:"Benefits",value:fmt$(s.benefits_deduction)}].map(row => (
                  <div key={row.label} className="flex justify-between text-sm"><span className="text-gray-400">{row.label}</span><span className="font-semibold tabular-nums text-red-500">− {row.value}</span></div>
                ))}
                <div className="flex justify-between text-sm pt-2 border-t border-gray-200"><span className="font-bold text-primary">Net Pay</span><span className="font-black text-accent tabular-nums">{fmt$(s.net_pay)}</span></div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export default function AdminPayPage() {
  const [tab,        setTab]       = useState("mine");
  const [session,    setSession]   = useState(null);

  const [myDetail,    setMyDetail]    = useState(null);
  const [myDeductCfg, setMyDeductCfg] = useState(null);
  const [myLoading,   setMyLoading]   = useState(true);
  const [myExpanded,  setMyExpanded]  = useState(null);
  const [myEditing,   setMyEditing]   = useState(false);
  const [myForm,      setMyForm]      = useState({});
  const [myDeductForm,setMyDeductForm]= useState({});
  const [mySaving,    setMySaving]    = useState(false);

  const [employees, setEmployees] = useState([]);
  const [selected,  setSelected]  = useState(null);
  const [detail,    setDetail]    = useState(null);
  const [deductCfg, setDeductCfg] = useState(null);
  const [loading,   setLoading]   = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [editing,   setEditing]   = useState(false);
  const [form,      setForm]      = useState({});
  const [deductForm, setDeductForm] = useState({});
  const [saving,    setSaving]    = useState(false);
  const [expanded,  setExpanded]  = useState(null);

  const [jobRoles,  setJobRoles]  = useState([]);
  const [settings,  setSettings]  = useState({});

  const rolesMap     = useMemo(() => Object.fromEntries(jobRoles.map(r => [r.name, r.color])), [jobRoles]);
  const healthPlans  = settings.health_plans  ?? [{ value: "none", label: "No Coverage" }, { value: "basic", label: "Basic Plan" }, { value: "premium", label: "Premium Plan" }];
  const otMultiplier = settings.overtime_multiplier ?? 1.5;
  const payDate      = calcNextPayDate(settings.pay_period_ref_date, settings.pay_period);

  useEffect(() => {
    const s = getSession();
    setSession(s);
    if (s) {
      Promise.all([
        fetch(`/api/pay/${s.id}`).then(r => r.json()),
        fetch(`/api/deductions/${s.id}`).then(r => r.json()),
      ]).then(([d, dc]) => { setMyDetail(d); setMyDeductCfg(dc); setMyLoading(false); });
    } else {
      setMyLoading(false);
    }
    Promise.all([
      fetch("/api/pay").then(r => r.json()),
      fetch("/api/job-roles").then(r => r.json()),
      fetch("/api/settings").then(r => r.json()),
    ]).then(([emps, roles, cfg]) => {
      setEmployees(emps);
      setJobRoles(roles);
      setSettings(cfg);
      setLoading(false);
    });
  }, []);

  function openMyEdit() {
    if (!myDetail) return;
    const { pay, benefits } = myDetail;
    setMyForm({
      pay_type:       pay?.pay_type       ?? "hourly",
      pay_rate:       pay?.pay_rate       ?? "",
      pay_period:     pay?.pay_period     ?? "weekly",
      health_plan:    benefits?.health_plan    ?? "none",
      dental:         benefits?.dental         ?? false,
      vision:         benefits?.vision         ?? false,
      retirement_pct: benefits?.retirement_pct ?? 0,
    });
    setMyDeductForm({
      federal_tax:          myDeductCfg?.federal_tax          ?? true,
      state_tax:            myDeductCfg?.state_tax            ?? true,
      social_security:      myDeductCfg?.social_security      ?? true,
      medicare:             myDeductCfg?.medicare             ?? true,
      benefits:             myDeductCfg?.benefits             ?? true,
      child_support:        myDeductCfg?.child_support        ?? false,
      child_support_amount: myDeductCfg?.child_support_amount ?? 0,
    });
    setMyEditing(true);
  }

  async function saveMyEdit() {
    setMySaving(true);
    await Promise.all([
      fetch(`/api/pay/${session.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pay:      { pay_type: myForm.pay_type, pay_rate: parseFloat(myForm.pay_rate), pay_period: myForm.pay_period },
          benefits: { health_plan: myForm.health_plan, dental: myForm.dental, vision: myForm.vision, retirement_pct: parseFloat(myForm.retirement_pct) },
        }),
      }),
      fetch(`/api/deductions/${session.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...myDeductForm, child_support_amount: parseFloat(myDeductForm.child_support_amount) || 0 }),
      }),
    ]);
    const [d, dc] = await Promise.all([
      fetch(`/api/pay/${session.id}`).then(r => r.json()),
      fetch(`/api/deductions/${session.id}`).then(r => r.json()),
    ]);
    setMyDetail(d); setMyDeductCfg(dc);
    setMyEditing(false); setMySaving(false);
  }

  async function selectEmployee(emp) {
    if (selected?.id === emp.id) return;
    setSelected(emp);
    setEditing(false);
    setExpanded(null);
    setDetailLoading(true);
    const [d, dc] = await Promise.all([
      fetch(`/api/pay/${emp.id}`).then(r => r.json()),
      fetch(`/api/deductions/${emp.id}`).then(r => r.json()),
    ]);
    setDetail(d);
    setDeductCfg(dc);
    setDetailLoading(false);
  }

  function openEdit() {
    if (!detail) return;
    const { pay, benefits } = detail;
    setForm({
      pay_type:       pay?.pay_type       ?? "hourly",
      pay_rate:       pay?.pay_rate       ?? "",
      pay_period:     pay?.pay_period     ?? "weekly",
      health_plan:    benefits?.health_plan    ?? "none",
      dental:         benefits?.dental         ?? false,
      vision:         benefits?.vision         ?? false,
      retirement_pct: benefits?.retirement_pct ?? 0,
    });
    setDeductForm({
      federal_tax:          deductCfg?.federal_tax          ?? true,
      state_tax:            deductCfg?.state_tax            ?? true,
      social_security:      deductCfg?.social_security      ?? true,
      medicare:             deductCfg?.medicare             ?? true,
      benefits:             deductCfg?.benefits             ?? true,
      child_support:        deductCfg?.child_support        ?? false,
      child_support_amount: deductCfg?.child_support_amount ?? 0,
    });
    setEditing(true);
  }

  async function saveEdit() {
    setSaving(true);
    await Promise.all([
      fetch(`/api/pay/${selected.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pay:      { pay_type: form.pay_type, pay_rate: parseFloat(form.pay_rate), pay_period: form.pay_period },
          benefits: { health_plan: form.health_plan, dental: form.dental, vision: form.vision, retirement_pct: parseFloat(form.retirement_pct) },
        }),
      }),
      fetch(`/api/deductions/${selected.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...deductForm, child_support_amount: parseFloat(deductForm.child_support_amount) || 0 }),
      }),
    ]);
    const [d, dc] = await Promise.all([
      fetch(`/api/pay/${selected.id}`).then(r => r.json()),
      fetch(`/api/deductions/${selected.id}`).then(r => r.json()),
    ]);
    setDetail(d);
    setDeductCfg(dc);
    setEmployees(emps => emps.map(e => e.id === selected.id
      ? { ...e, pay_type: form.pay_type, pay_rate: parseFloat(form.pay_rate), health_plan: form.health_plan }
      : e
    ));
    setEditing(false);
    setSaving(false);
  }

  const selectedRoleStyle = selected ? getRoleStyle(rolesMap[selected.job_role]) : null;
  const latest = detail?.stubs?.[0];
  const ytd    = detail?.stubs?.reduce((sum, s) => sum + Number(s.gross_pay), 0) ?? 0;
  const deductionRows = latest ? [
    deductCfg?.federal_tax     !== false && { label: "Federal Tax",     amount: latest.federal_tax,        color: "text-red-600" },
    deductCfg?.state_tax       !== false && { label: "State Tax",       amount: latest.state_tax,          color: "text-red-600" },
    deductCfg?.social_security !== false && { label: "Social Security", amount: latest.social_security,    color: "text-orange-600" },
    deductCfg?.medicare        !== false && { label: "Medicare",        amount: latest.medicare,           color: "text-orange-600" },
    deductCfg?.benefits        !== false && { label: "Benefits",        amount: latest.benefits_deduction, color: "text-blue-600" },
    { label: "Child Support", amount: deductCfg?.child_support ? deductCfg.child_support_amount : 0, color: deductCfg?.child_support ? "text-purple-600" : "text-gray-300" },
  ].filter(Boolean) : [];

  const myLatest = myDetail?.stubs?.[0];
  const myYtd    = myDetail?.stubs?.reduce((sum, s) => sum + Number(s.gross_pay), 0) ?? 0;
  const myDeductionRows = myLatest ? [
    myDeductCfg?.federal_tax     !== false && { label: "Federal Tax",     amount: myLatest.federal_tax,        color: "text-red-600" },
    myDeductCfg?.state_tax       !== false && { label: "State Tax",       amount: myLatest.state_tax,          color: "text-red-600" },
    myDeductCfg?.social_security !== false && { label: "Social Security", amount: myLatest.social_security,    color: "text-orange-600" },
    myDeductCfg?.medicare        !== false && { label: "Medicare",        amount: myLatest.medicare,           color: "text-orange-600" },
    myDeductCfg?.benefits        !== false && { label: "Benefits",        amount: myLatest.benefits_deduction, color: "text-blue-600" },
    { label: "Child Support", amount: myDeductCfg?.child_support ? myDeductCfg.child_support_amount : 0, color: myDeductCfg?.child_support ? "text-purple-600" : "text-gray-300" },
  ].filter(Boolean) : [];

  return (
    <div className="flex flex-col h-full overflow-hidden">

      {/* Tab bar */}
      <div className="bg-white border-b border-gray-100 px-8 flex items-center gap-1 flex-shrink-0">
        {[{ id: "mine", label: "My Pay" }, { id: "team", label: "Team" }].map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`px-4 py-3.5 text-sm font-semibold border-b-2 transition-colors ${
              tab === t.id ? "border-accent text-primary" : "border-transparent text-gray-400 hover:text-gray-600"
            }`}>
            {t.label}
          </button>
        ))}
      </div>

      {/* My Pay */}
      {tab === "mine" && (
        <div className="flex-1 overflow-y-auto bg-gray-50">
          {myLoading && <div className="flex items-center justify-center h-full"><div className="w-8 h-8 rounded-full border-4 border-accent/30 border-t-accent animate-spin" /></div>}
          {!myLoading && (
            <div className="px-8 py-8 max-w-3xl mx-auto space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-primary text-accent flex items-center justify-center text-sm font-black">
                    {initials(session?.name ?? "")}
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-primary">{session?.name}</h2>
                    <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold px-2 py-0.5 rounded-full mt-0.5 bg-primary/5 text-primary">Administrator</span>
                  </div>
                </div>
                {!myEditing && (
                  <button onClick={openMyEdit} className="flex items-center gap-2 text-sm font-semibold text-gray-500 hover:text-primary border border-gray-200 hover:border-primary/30 hover:bg-white px-4 py-2 rounded-xl transition-colors">
                    <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11,2a1.414,1.414,0,0,1,2,2L4.5,12.5l-3,.5.5-3Z"/></svg>
                    Edit
                  </button>
                )}
                {myEditing && <button onClick={() => setMyEditing(false)} className="text-sm text-gray-400 hover:text-gray-600 px-4 py-2 rounded-xl hover:bg-white transition-colors">Cancel</button>}
              </div>

              {myEditing && <EditForm f={myForm} setF={setMyForm} df={myDeductForm} setDf={setMyDeductForm} onSave={saveMyEdit} onCancel={() => setMyEditing(false)} isSaving={mySaving} healthPlans={healthPlans} />}
              {!myEditing && <PayCards pay={myDetail?.pay} benefits={myDetail?.benefits} latestStub={myLatest} ytdVal={myYtd} healthPlans={healthPlans} payDate={payDate} otMultiplier={otMultiplier} />}
              {!myEditing && <LastPaycheck latestStub={myLatest} pay={myDetail?.pay} dRows={myDeductionRows} />}
              {!myEditing && <StubHistory stubs={myDetail?.stubs} expandedId={myExpanded} setExpandedId={setMyExpanded} />}
            </div>
          )}
        </div>
      )}

      {/* Team */}
      {tab === "team" && (
        <div className="flex flex-1 overflow-hidden">
          {/* Left: employee list */}
          <div className="w-72 flex-shrink-0 border-r border-gray-100 bg-white flex flex-col overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100">
              <p className="text-sm font-bold text-primary">{employees.length} employees</p>
            </div>
            {loading && <div className="flex items-center justify-center flex-1"><div className="w-6 h-6 rounded-full border-4 border-accent/30 border-t-accent animate-spin" /></div>}
            {!loading && (
              <div className="flex-1 overflow-y-auto divide-y divide-gray-50">
                {employees.map(emp => {
                  const rs = getRoleStyle(rolesMap[emp.job_role]);
                  const isSelected = selected?.id === emp.id;
                  return (
                    <button key={emp.id} onClick={() => selectEmployee(emp)}
                      className={`w-full text-left px-4 py-3.5 transition-colors flex items-center gap-3 ${isSelected ? "bg-primary/5 border-l-2 border-accent" : "hover:bg-gray-50 border-l-2 border-transparent"}`}>
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-xs font-black flex-shrink-0 ${isSelected ? "bg-primary text-accent" : "bg-primary/10 text-primary"}`}>
                        {initials(emp.name)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-semibold truncate ${isSelected ? "text-primary" : "text-gray-700"}`}>{emp.name}</p>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${rs.dot}`} />
                          <span className="text-[11px] text-gray-400 truncate">{emp.job_role ?? "No role"}</span>
                        </div>
                      </div>
                      <p className="text-xs font-bold text-primary tabular-nums flex-shrink-0">
                        {emp.pay_rate ? (emp.pay_type === "hourly" ? `$${Number(emp.pay_rate).toFixed(0)}/hr` : `$${(Number(emp.pay_rate)/1000).toFixed(0)}k`) : "—"}
                      </p>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Right: detail */}
          <div className="flex-1 overflow-y-auto bg-gray-50">
            {!selected && (
              <div className="flex flex-col items-center justify-center h-full gap-3 text-center px-8">
                <div className="w-14 h-14 rounded-2xl bg-white border border-gray-100 shadow-sm flex items-center justify-center">
                  <svg width="24" height="24" fill="none" stroke="#023f62" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.3">
                    <rect x="1" y="5" width="22" height="15" rx="2"/><path d="M12 10v4"/><path d="M9 12h6"/>
                  </svg>
                </div>
                <p className="text-sm font-semibold text-gray-400">Select an employee to view their pay & benefits</p>
              </div>
            )}
            {selected && detailLoading && <div className="flex items-center justify-center h-full"><div className="w-8 h-8 rounded-full border-4 border-accent/30 border-t-accent animate-spin" /></div>}
            {selected && !detailLoading && detail && (
              <div className="px-8 py-8 max-w-3xl mx-auto space-y-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-primary text-accent flex items-center justify-center text-sm font-black">{initials(selected.name)}</div>
                    <div>
                      <h2 className="text-xl font-bold text-primary">{selected.name}</h2>
                      <span className={`inline-flex items-center gap-1.5 text-[11px] font-semibold px-2 py-0.5 rounded-full mt-0.5 ${selectedRoleStyle.bg} ${selectedRoleStyle.text}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${selectedRoleStyle.dot}`} />{selected.job_role}
                      </span>
                    </div>
                  </div>
                  {!editing
                    ? <button onClick={openEdit} className="flex items-center gap-2 text-sm font-semibold text-gray-500 hover:text-primary border border-gray-200 hover:border-primary/30 hover:bg-white px-4 py-2 rounded-xl transition-colors">
                        <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11,2a1.414,1.414,0,0,1,2,2L4.5,12.5l-3,.5.5-3Z"/></svg>Edit
                      </button>
                    : <button onClick={() => setEditing(false)} className="text-sm text-gray-400 hover:text-gray-600 px-4 py-2 rounded-xl hover:bg-white transition-colors">Cancel</button>
                  }
                </div>
                {editing && <EditForm f={form} setF={setForm} df={deductForm} setDf={setDeductForm} onSave={saveEdit} onCancel={() => setEditing(false)} isSaving={saving} healthPlans={healthPlans} />}
                {!editing && <PayCards pay={detail.pay} benefits={detail.benefits} latestStub={latest} ytdVal={ytd} healthPlans={healthPlans} payDate={payDate} otMultiplier={otMultiplier} />}
                {!editing && <LastPaycheck latestStub={latest} pay={detail.pay} dRows={deductionRows} />}
                {!editing && <StubHistory stubs={detail.stubs} expandedId={expanded} setExpandedId={setExpanded} />}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
