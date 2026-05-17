"use client";
import { useState, useEffect, useMemo } from "react";
import { roleStyle } from "@/lib/constants";

const EMPTY_FORM = {
  name: "", job_role: "", pin: "",
  email: "", phone: "", start_date: "", employment_type: "full-time",
  emergency_name: "", emergency_phone: "",
  pay_type: "hourly", pay_rate: "",
  health_plan: "none", dental: false, vision: false, retirement_pct: 0,
  child_support: false, child_support_amount: 0,
  require_geofence: true, allow_mobile_anywhere: false,
};

function initials(name) {
  return name.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2);
}

function slugify(name) {
  return name.toLowerCase().replace(/\s+/g, "_").replace(/[^a-z_]/g, "");
}

const INPUT = "w-full border border-gray-200 rounded-xl px-3 py-2 text-sm text-primary focus:outline-none focus:border-accent transition-colors";

function Field({ label, children }) {
  return (
    <div className="space-y-1.5">
      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block">{label}</label>
      {children}
    </div>
  );
}

function FormSection({ form, setForm, jobRoles, employmentTypes, healthPlans }) {
  const set = (key, val) => setForm(f => ({ ...f, [key]: val }));
  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2 mb-4">
          <div className="w-1 h-4 bg-accent rounded-full" />
          <p className="text-xs font-bold text-primary uppercase tracking-widest">Employment</p>
        </div>
        <div className="grid grid-cols-3 gap-4">
          <Field label="Full Name">
            <input value={form.name} onChange={e => set("name", e.target.value)} placeholder="Jordan Lee" className={INPUT} />
          </Field>
          <Field label="Job Role">
            <select value={form.job_role} onChange={e => set("job_role", e.target.value)} className={INPUT}>
              {(jobRoles ?? []).map(r => <option key={r.name} value={r.name}>{r.name}</option>)}
            </select>
          </Field>
          <Field label="Employment Type">
            <select value={form.employment_type} onChange={e => set("employment_type", e.target.value)} className={INPUT}>
              {(employmentTypes ?? []).map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </Field>
          <Field label="Start Date">
            <input type="date" value={form.start_date} onChange={e => set("start_date", e.target.value)} className={INPUT} />
          </Field>
          <Field label="PIN (4 digits)">
            <input value={form.pin} onChange={e => set("pin", e.target.value)} placeholder="1234" maxLength={4} className={INPUT} />
          </Field>
        </div>
      </div>

      <div className="border-t border-gray-100 pt-6">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-1 h-4 bg-accent rounded-full" />
          <p className="text-xs font-bold text-primary uppercase tracking-widest">Contact</p>
        </div>
        <div className="grid grid-cols-3 gap-4">
          <Field label="Email">
            <input type="email" value={form.email} onChange={e => set("email", e.target.value)} placeholder="employee@email.com" className={INPUT} />
          </Field>
          <Field label="Phone">
            <input value={form.phone} onChange={e => set("phone", e.target.value)} placeholder="(555) 000-0000" className={INPUT} />
          </Field>
        </div>
      </div>

      <div className="border-t border-gray-100 pt-6">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-1 h-4 bg-accent rounded-full" />
          <p className="text-xs font-bold text-primary uppercase tracking-widest">Emergency Contact</p>
        </div>
        <div className="grid grid-cols-3 gap-4">
          <Field label="Name">
            <input value={form.emergency_name} onChange={e => set("emergency_name", e.target.value)} placeholder="Jane Doe" className={INPUT} />
          </Field>
          <Field label="Phone">
            <input value={form.emergency_phone} onChange={e => set("emergency_phone", e.target.value)} placeholder="(555) 000-0000" className={INPUT} />
          </Field>
        </div>
      </div>

      <div className="border-t border-gray-100 pt-6">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-1 h-4 bg-accent rounded-full" />
          <p className="text-xs font-bold text-primary uppercase tracking-widest">Compensation</p>
        </div>
        <div className="grid grid-cols-3 gap-4">
          <Field label="Pay Type">
            <select value={form.pay_type} onChange={e => set("pay_type", e.target.value)} className={INPUT}>
              <option value="hourly">Hourly</option>
              <option value="salary">Salary</option>
            </select>
          </Field>
          <Field label={form.pay_type === "hourly" ? "Hourly Rate ($)" : "Annual Salary ($)"}>
            <input type="number" value={form.pay_rate} onChange={e => set("pay_rate", e.target.value)} className={INPUT} />
          </Field>
        </div>
      </div>

      <div className="border-t border-gray-100 pt-6">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-1 h-4 bg-accent rounded-full" />
          <p className="text-xs font-bold text-primary uppercase tracking-widest">Benefits</p>
        </div>
        <div className="grid grid-cols-3 gap-4">
          <Field label="Health Plan">
            <select value={form.health_plan} onChange={e => set("health_plan", e.target.value)} className={INPUT}>
              {(healthPlans ?? []).map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
            </select>
          </Field>
          <Field label="401(k) %">
            <input type="number" min="0" max="100" step="0.5" value={form.retirement_pct}
              onChange={e => set("retirement_pct", e.target.value)} className={INPUT} />
          </Field>
          <div className="space-y-1.5 pt-1">
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block">Coverage</label>
            <div className="flex gap-4 pt-1">
              <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer select-none">
                <input type="checkbox" checked={form.dental} onChange={e => set("dental", e.target.checked)} className="accent-accent w-4 h-4" /> Dental
              </label>
              <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer select-none">
                <input type="checkbox" checked={form.vision} onChange={e => set("vision", e.target.checked)} className="accent-accent w-4 h-4" /> Vision
              </label>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-4 mt-4">
          <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer select-none">
            <input type="checkbox" checked={form.child_support} onChange={e => set("child_support", e.target.checked)} className="accent-accent w-4 h-4" />
            Child Support
          </label>
          {form.child_support && (
            <input type="number" min="0" step="0.01" placeholder="Court-Ordered Amount $"
              value={form.child_support_amount} onChange={e => set("child_support_amount", e.target.value)}
              className="border border-gray-200 rounded-xl px-3 py-1.5 text-sm text-primary focus:outline-none focus:border-accent w-52" />
          )}
        </div>
      </div>
    </div>
  );
}

function EmployeeCard({ emp, onEdit, onToggleStatus, onDelete, onToggleSetting, rolesMap }) {
  const rs = roleStyle(rolesMap?.[emp.job_role]);
  const isInactive = emp.status === "inactive";

  return (
    <div className={`bg-white rounded-2xl border shadow-sm overflow-hidden transition-all ${isInactive ? "border-gray-100 opacity-70" : "border-gray-100 hover:shadow-md hover:border-gray-200"}`}>
      <div className="px-5 pt-5 pb-4">
        <div className="flex items-start gap-4">
          <div className="relative flex-shrink-0">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-sm font-black ${isInactive ? "bg-gray-100 text-gray-400" : "bg-primary text-accent"}`}>
              {initials(emp.name)}
            </div>
            <div className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white ${isInactive ? "bg-gray-300" : "bg-accent"}`} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <p className={`font-bold text-sm ${isInactive ? "text-gray-400" : "text-primary"}`}>{emp.name}</p>
              {isInactive && (
                <span className="text-[9px] font-bold bg-gray-100 text-gray-400 px-1.5 py-0.5 rounded-full uppercase tracking-wide">Inactive</span>
              )}
            </div>
            <span className={`inline-flex items-center gap-1.5 mt-1 text-[11px] font-semibold px-2 py-0.5 rounded-full ${rs.bg} ${rs.text}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${rs.dot}`} />
              {emp.job_role ?? "No role"}
            </span>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-2">
          <div className="bg-gray-50 rounded-xl px-3 py-2">
            <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">Pay</p>
            <p className="text-sm font-bold text-primary mt-0.5">
              {emp.pay_rate
                ? emp.pay_type === "hourly"
                  ? `$${Number(emp.pay_rate).toFixed(2)}/hr`
                  : `$${Number(emp.pay_rate).toLocaleString()}/yr`
                : "—"}
            </p>
          </div>
          <div className="bg-gray-50 rounded-xl px-3 py-2">
            <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">PIN</p>
            <p className="text-sm font-bold text-primary mt-0.5 tracking-widest">{emp.pin ? "••••" : "—"}</p>
          </div>
          <div className="bg-gray-50 rounded-xl px-3 py-2">
            <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">Type</p>
            <p className="text-sm font-semibold text-primary mt-0.5 capitalize">{emp.employment_type ?? "—"}</p>
          </div>
          <div className="bg-gray-50 rounded-xl px-3 py-2">
            <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">Health</p>
            <p className="text-sm font-semibold text-primary mt-0.5 capitalize">{emp.health_plan === "none" || !emp.health_plan ? "None" : emp.health_plan}</p>
          </div>
        </div>
      </div>

      <div className="border-t border-gray-50 px-4 py-3 space-y-2">
        <div className="flex flex-col gap-1.5">
          <label className="flex items-center gap-2 text-xs text-gray-500 cursor-pointer select-none">
            <input type="checkbox" checked={emp.require_geofence ?? true}
              onChange={e => onToggleSetting(emp.id, "require_geofence", e.target.checked)}
              className="accent-accent w-3.5 h-3.5" />
            Enforce geofence
          </label>
          <label className="flex items-center gap-2 text-xs text-gray-500 cursor-pointer select-none">
            <input type="checkbox" checked={emp.allow_mobile_anywhere ?? false}
              onChange={e => onToggleSetting(emp.id, "allow_mobile_anywhere", e.target.checked)}
              className="accent-accent w-3.5 h-3.5" />
            Mobile clock in
          </label>
        </div>
        <div className="flex items-center gap-2">
        <button
          onClick={() => onToggleStatus(emp.id, emp.status ?? "active")}
          className={`flex-1 text-xs font-semibold py-1.5 rounded-lg border transition-colors ${
            isInactive
              ? "text-accent border-accent/30 hover:bg-accent/10"
              : "text-gray-400 hover:text-amber-600 border-gray-200 hover:border-amber-200 hover:bg-amber-50"
          }`}>
          {isInactive ? "Set Active" : "Set Inactive"}
        </button>
        <button
          onClick={() => onEdit(emp)}
          className="flex-1 text-xs font-semibold text-gray-500 hover:text-primary border border-gray-200 hover:border-primary/30 hover:bg-primary/5 py-1.5 rounded-lg transition-colors">
          Edit
        </button>
        <button
          onClick={() => onDelete(emp.id, emp.name)}
          className="p-1.5 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
          <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="3,6 5,6 21,6"/><path d="M19,6l-1,14H6L5,6"/><path d="M10,11v6"/><path d="M14,11v6"/>
            <path d="M9,6V4a1,1,0,0,1,1-1h4a1,1,0,0,1,1,1v2"/>
          </svg>
        </button>
        </div>
      </div>
    </div>
  );
}

export default function AdminEmployeesPage() {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading]     = useState(true);
  const [editing, setEditing]     = useState(null);
  const [editForm, setEditForm]   = useState({});
  const [adding, setAdding]       = useState(false);
  const [addForm, setAddForm]     = useState(EMPTY_FORM);
  const [saving, setSaving]       = useState(false);
  const [error, setError]         = useState("");
  const [jobRoles,  setJobRoles]  = useState([]);
  const [settings,  setSettings]  = useState({});

  const rolesMap        = useMemo(() => Object.fromEntries(jobRoles.map(r => [r.name, r.color])), [jobRoles]);
  const employmentTypes = settings.employment_types ?? [{ value: "full-time", label: "Full-Time" }, { value: "part-time", label: "Part-Time" }, { value: "contract", label: "Contract" }];
  const healthPlans     = settings.health_plans     ?? [{ value: "none", label: "No Coverage" }, { value: "basic", label: "Basic Plan" }, { value: "premium", label: "Premium Plan" }];

  useEffect(() => {
    Promise.all([
      fetch("/api/employees").then(r => r.json()),
      fetch("/api/job-roles").then(r => r.json()),
      fetch("/api/settings").then(r => r.json()),
    ]).then(([emps, roles, cfg]) => {
      setEmployees(emps);
      setJobRoles(roles);
      setSettings(cfg);
      setLoading(false);
    });
  }, []);

  function openEdit(emp) {
    setEditing(emp.id);
    setEditForm({
      name:                 emp.name,
      job_role:             emp.job_role             ?? jobRoles[0]?.name ?? "",
      pin:                  emp.pin                  ?? "",
      email:                emp.email                ?? "",
      phone:                emp.phone                ?? "",
      start_date:           emp.start_date           ? emp.start_date.split("T")[0] : "",
      employment_type:      emp.employment_type      ?? "full-time",
      emergency_name:       emp.emergency_name       ?? "",
      emergency_phone:      emp.emergency_phone      ?? "",
      pay_type:             emp.pay_type             ?? "hourly",
      pay_rate:             emp.pay_rate             ?? "",
      health_plan:          emp.health_plan          ?? "none",
      dental:               emp.dental               ?? false,
      vision:               emp.vision               ?? false,
      retirement_pct:       emp.retirement_pct       ?? 0,
      child_support:        emp.child_support        ?? false,
      child_support_amount: emp.child_support_amount ?? 0,
      require_geofence:     emp.require_geofence     ?? true,
      allow_mobile_anywhere: emp.allow_mobile_anywhere ?? false,
    });
    setAdding(false);
    setError("");
  }

  async function saveEdit(id) {
    if (!editForm.name.trim() || !editForm.pin.trim()) { setError("Name and PIN are required."); return; }
    if (editForm.pin.length !== 4 || !/^\d+$/.test(editForm.pin)) { setError("PIN must be exactly 4 digits."); return; }
    if (!editForm.pay_rate || isNaN(editForm.pay_rate)) { setError("Pay rate is required."); return; }
    setSaving(true);
    await Promise.all([
      fetch(`/api/employees/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: editForm.name, job_role: editForm.job_role, pin: editForm.pin,
          email: editForm.email, phone: editForm.phone,
          start_date: editForm.start_date || null,
          employment_type: editForm.employment_type,
          emergency_name: editForm.emergency_name,
          emergency_phone: editForm.emergency_phone,
          require_geofence: editForm.require_geofence,
          allow_mobile_anywhere: editForm.allow_mobile_anywhere,
        }),
      }),
      fetch(`/api/pay/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pay:      { pay_type: editForm.pay_type, pay_rate: parseFloat(editForm.pay_rate), pay_period: "weekly" },
          benefits: { health_plan: editForm.health_plan, dental: editForm.dental, vision: editForm.vision, retirement_pct: parseFloat(editForm.retirement_pct) },
        }),
      }),
      fetch(`/api/deductions/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          federal_tax: true, state_tax: true, social_security: true, medicare: true, benefits: true,
          child_support:        editForm.child_support,
          child_support_amount: parseFloat(editForm.child_support_amount) || 0,
        }),
      }),
    ]);
    setEmployees(emps => emps.map(e => e.id === id ? { ...e, ...editForm, pay_rate: parseFloat(editForm.pay_rate) } : e));
    setEditing(null);
    setSaving(false);
    setError("");
  }

  async function toggleStatus(id, current) {
    const next = current === "active" ? "inactive" : "active";
    await fetch(`/api/employees/${id}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: next }),
    });
    setEmployees(emps => emps.map(e => e.id === id ? { ...e, status: next } : e));
  }

  async function toggleSetting(id, field, value) {
    setEmployees(emps => emps.map(e => e.id === id ? { ...e, [field]: value } : e));
    const emp = employees.find(e => e.id === id);
    await fetch(`/api/employees/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: emp.name, job_role: emp.job_role, pin: emp.pin,
        email: emp.email ?? null, phone: emp.phone ?? null,
        start_date: emp.start_date ?? null, employment_type: emp.employment_type ?? "full-time",
        emergency_name: emp.emergency_name ?? null, emergency_phone: emp.emergency_phone ?? null,
        require_geofence:     field === "require_geofence"     ? value : (emp.require_geofence     ?? true),
        allow_mobile_anywhere: field === "allow_mobile_anywhere" ? value : (emp.allow_mobile_anywhere ?? false),
      }),
    });
  }

  async function deleteEmployee(id, name) {
    if (!confirm(`Remove ${name}? This cannot be undone.`)) return;
    await fetch(`/api/employees/${id}`, { method: "DELETE" });
    setEmployees(emps => emps.filter(e => e.id !== id));
  }

  async function addEmployee() {
    if (!addForm.name.trim() || !addForm.pin.trim()) { setError("Name and PIN are required."); return; }
    if (addForm.pin.length !== 4 || !/^\d+$/.test(addForm.pin)) { setError("PIN must be exactly 4 digits."); return; }
    setSaving(true);
    const id = slugify(addForm.name) || `emp_${Date.now()}`;
    const res = await fetch("/api/employees", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, ...addForm, start_date: addForm.start_date || null }),
    });
    if (res.ok) {
      setEmployees(emps => [...emps, { id, ...addForm }].sort((a, b) => a.name.localeCompare(b.name)));
      setAdding(false);
      setAddForm(EMPTY_FORM);
      setError("");
    } else {
      const d = await res.json();
      setError(d.error ?? "Failed to add employee.");
    }
    setSaving(false);
  }

  const activeCount   = employees.filter(e => e.status !== "inactive").length;
  const inactiveCount = employees.filter(e => e.status === "inactive").length;

  if (loading) return <div className="p-10 text-center text-gray-400 text-sm">Loading…</div>;

  return (
    <div className="px-8 py-8 max-w-5xl mx-auto space-y-6">

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-primary">Employees</h1>
          <div className="flex items-center gap-3 mt-1">
            <span className="text-sm text-gray-400">{activeCount} active</span>
            {inactiveCount > 0 && (
              <>
                <span className="text-gray-200">·</span>
                <span className="text-sm text-gray-400">{inactiveCount} inactive</span>
              </>
            )}
          </div>
        </div>
        <button
          onClick={() => { setAdding(true); setEditing(null); setError(""); }}
          className="flex items-center gap-2 bg-accent hover:bg-accent/90 text-primary font-bold px-5 py-2.5 rounded-xl text-sm transition-colors shadow-sm">
          <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="7" y1="1" x2="7" y2="13"/><line x1="1" y1="7" x2="13" y2="7"/>
          </svg>
          Add Employee
        </button>
      </div>

      {/* Employee grid */}
      <div className="grid grid-cols-2 gap-4 xl:grid-cols-3">
        {employees.map(emp => (
          <EmployeeCard
            key={emp.id}
            emp={emp}
            onEdit={openEdit}
            onToggleStatus={toggleStatus}
            onDelete={deleteEmployee}
            onToggleSetting={toggleSetting}
            rolesMap={rolesMap}
          />
        ))}
      </div>

      {/* Add Employee modal */}
      {adding && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => { setAdding(false); setAddForm(EMPTY_FORM); setError(""); }}>
          <div className="absolute inset-0 bg-primary/40 backdrop-blur-sm" />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between flex-shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-accent/10 flex items-center justify-center">
                  <svg width="14" height="14" fill="none" stroke="#00ce7c" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="7" y1="1" x2="7" y2="13"/><line x1="1" y1="7" x2="13" y2="7"/>
                  </svg>
                </div>
                <p className="text-sm font-bold text-primary">New Employee</p>
              </div>
              <button onClick={() => { setAdding(false); setAddForm(EMPTY_FORM); setError(""); }}
                className="text-gray-400 hover:text-gray-600 p-1.5 rounded-lg hover:bg-gray-100 transition-colors">
                <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <line x1="1" y1="1" x2="15" y2="15"/><line x1="15" y1="1" x2="1" y2="15"/>
                </svg>
              </button>
            </div>
            <div className="px-6 py-5 overflow-y-auto">
              {error && (
                <div className="mb-4 flex items-center gap-2 bg-red-50 border border-red-100 text-red-600 text-xs font-semibold px-3 py-2 rounded-xl">
                  <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="7" cy="7" r="6"/><line x1="7" y1="4" x2="7" y2="7"/><line x1="7" y1="10" x2="7.01" y2="10"/>
                  </svg>
                  {error}
                </div>
              )}
              <FormSection form={addForm} setForm={setAddForm} jobRoles={jobRoles} employmentTypes={employmentTypes} healthPlans={healthPlans} />
            </div>
            <div className="px-6 py-4 border-t border-gray-100 flex gap-3 flex-shrink-0 bg-gray-50/50">
              <button onClick={addEmployee} disabled={saving}
                className="bg-accent hover:bg-accent/90 text-primary font-bold px-6 py-2.5 rounded-xl text-sm transition-colors disabled:opacity-50 shadow-sm">
                {saving ? "Saving…" : "Add Employee"}
              </button>
              <button onClick={() => { setAdding(false); setAddForm(EMPTY_FORM); setError(""); }}
                className="text-sm text-gray-400 hover:text-gray-600 px-4 py-2.5 rounded-xl hover:bg-white transition-colors">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Employee modal */}
      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => { setEditing(null); setError(""); }}>
          <div className="absolute inset-0 bg-primary/40 backdrop-blur-sm" />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between flex-shrink-0 bg-primary/5">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center text-xs font-black text-primary">
                  {initials(employees.find(e => e.id === editing)?.name ?? "")}
                </div>
                <div>
                  <p className="text-sm font-bold text-primary">{employees.find(e => e.id === editing)?.name}</p>
                  <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-wide">Editing record</p>
                </div>
              </div>
              <button onClick={() => { setEditing(null); setError(""); }}
                className="text-gray-400 hover:text-gray-600 p-1.5 rounded-lg hover:bg-white transition-colors">
                <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <line x1="1" y1="1" x2="15" y2="15"/><line x1="15" y1="1" x2="1" y2="15"/>
                </svg>
              </button>
            </div>
            <div className="px-6 py-5 overflow-y-auto">
              {error && (
                <div className="mb-4 flex items-center gap-2 bg-red-50 border border-red-100 text-red-600 text-xs font-semibold px-3 py-2 rounded-xl">
                  <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="7" cy="7" r="6"/><line x1="7" y1="4" x2="7" y2="7"/><line x1="7" y1="10" x2="7.01" y2="10"/>
                  </svg>
                  {error}
                </div>
              )}
              <FormSection form={editForm} setForm={setEditForm} jobRoles={jobRoles} employmentTypes={employmentTypes} healthPlans={healthPlans} />
            </div>
            <div className="px-6 py-4 border-t border-gray-100 flex gap-3 flex-shrink-0 bg-gray-50/50">
              <button onClick={() => saveEdit(editing)} disabled={saving}
                className="bg-accent hover:bg-accent/90 text-primary font-bold px-6 py-2.5 rounded-xl text-sm transition-colors disabled:opacity-50 shadow-sm">
                {saving ? "Saving…" : "Save Changes"}
              </button>
              <button onClick={() => { setEditing(null); setError(""); }}
                className="text-sm text-gray-400 hover:text-gray-600 px-4 py-2.5 rounded-xl hover:bg-gray-50 transition-colors">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
