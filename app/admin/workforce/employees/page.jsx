"use client";
import { useState, useEffect } from "react";

const INPUT = "w-full border border-gray-200 rounded-xl px-3 py-2 text-sm text-primary focus:outline-none focus:border-accent transition-colors";

const EMPTY_FORM = {
  first_name: "",
  last_name: "",
  employee_number: "",
  employment_type: "full_time",
  pay_type: "hourly",
  pay_rate: "",
  hire_date: "",
};

function Field({ label, children }) {
  return (
    <div className="space-y-1.5">
      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block">{label}</label>
      {children}
    </div>
  );
}

function StatusBadge({ status }) {
  const active = status !== "inactive";
  return (
    <span className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full ${active ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-400"}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${active ? "bg-green-500" : "bg-gray-300"}`} />
      {active ? "Active" : "Inactive"}
    </span>
  );
}

function initials(name) {
  return (name ?? "?").split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2);
}

export default function WorkforceEmployeesPage() {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/employees")
      .then(r => r.json())
      .then(d => { setEmployees(Array.isArray(d) ? d : []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  async function handleAdd() {
    if (!form.first_name.trim() || !form.last_name.trim()) {
      setError("First and last name are required.");
      return;
    }
    setSaving(true);
    // TODO: POST to /api/workforce/employees once route is created
    try {
      const res = await fetch("/api/workforce/employees", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "create", ...form }),
      });
      if (res.ok) {
        const d = await res.json();
        setEmployees(e => [...e, d.employee ?? { id: Date.now(), name: `${form.first_name} ${form.last_name}`, ...form }]);
        setAdding(false);
        setForm(EMPTY_FORM);
        setError("");
      } else {
        const d = await res.json().catch(() => ({}));
        setError(d.error ?? "Failed to add employee. (Route may not exist yet.)");
      }
    } catch {
      setError("Route /api/workforce/employees does not exist yet.");
    }
    setSaving(false);
  }

  if (loading) return <div className="p-10 text-center text-gray-400 text-sm">Loading…</div>;

  return (
    <div className="px-8 py-8 max-w-6xl mx-auto space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-primary">Workforce Employees</h1>
          <p className="text-sm text-gray-400 mt-1">{employees.length} employees</p>
        </div>
        <button
          onClick={() => { setAdding(true); setError(""); }}
          className="flex items-center gap-2 bg-accent hover:bg-accent/90 text-primary font-bold px-5 py-2.5 rounded-xl text-sm transition-colors shadow-sm">
          <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="7" y1="1" x2="7" y2="13"/><line x1="1" y1="7" x2="13" y2="7"/>
          </svg>
          Add Workforce Employee
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-100">
              <th className="px-5 py-3.5 text-left text-[10px] font-bold text-gray-400 uppercase tracking-widest">Name</th>
              <th className="px-5 py-3.5 text-left text-[10px] font-bold text-gray-400 uppercase tracking-widest">Status</th>
              <th className="px-5 py-3.5 text-left text-[10px] font-bold text-gray-400 uppercase tracking-widest">Employment Type</th>
              <th className="px-5 py-3.5 text-left text-[10px] font-bold text-gray-400 uppercase tracking-widest">Pay Rate</th>
              <th className="px-5 py-3.5 text-left text-[10px] font-bold text-gray-400 uppercase tracking-widest">Hire Date</th>
              <th className="px-5 py-3.5 text-left text-[10px] font-bold text-gray-400 uppercase tracking-widest">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {employees.length === 0 ? (
              <tr><td colSpan={6} className="px-5 py-10 text-center text-gray-400 text-sm">No workforce employees found.</td></tr>
            ) : employees.map(emp => (
              <tr key={emp.id} className="hover:bg-gray-50">
                <td className="px-5 py-3.5">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold flex-shrink-0">
                      {initials(emp.name ?? `${emp.first_name ?? ""} ${emp.last_name ?? ""}`)}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-primary">
                        {emp.name || (`${emp.first_name ?? ""} ${emp.last_name ?? ""}`.trim()) || "—"}
                      </p>
                      {emp.employee_number && <p className="text-[10px] text-gray-400">#{emp.employee_number}</p>}
                    </div>
                  </div>
                </td>
                <td className="px-5 py-3.5"><StatusBadge status={emp.status ?? "active"} /></td>
                <td className="px-5 py-3.5">
                  <span className="text-sm text-gray-600 capitalize">
                    {(emp.employment_type ?? "—").replace(/_/g, " ")}
                  </span>
                </td>
                <td className="px-5 py-3.5">
                  <span className="text-sm font-semibold text-primary">
                    {emp.pay_rate
                      ? emp.pay_type === "hourly"
                        ? `$${Number(emp.pay_rate).toFixed(2)}/hr`
                        : `$${Number(emp.pay_rate).toLocaleString()}/yr`
                      : "—"}
                  </span>
                </td>
                <td className="px-5 py-3.5">
                  <span className="text-sm text-gray-500">
                    {emp.hire_date ?? emp.start_date
                      ? new Date(emp.hire_date ?? emp.start_date).toLocaleDateString()
                      : "—"}
                  </span>
                </td>
                <td className="px-5 py-3.5">
                  <button className="text-xs font-semibold text-gray-400 hover:text-primary border border-gray-200 hover:border-primary/30 px-3 py-1.5 rounded-lg transition-colors">
                    Edit
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Add modal */}
      {adding && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => { setAdding(false); setForm(EMPTY_FORM); setError(""); }}>
          <div className="absolute inset-0 bg-primary/40 backdrop-blur-sm" />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between flex-shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-accent/10 flex items-center justify-center">
                  <svg width="14" height="14" fill="none" stroke="#00ce7c" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="7" y1="1" x2="7" y2="13"/><line x1="1" y1="7" x2="13" y2="7"/>
                  </svg>
                </div>
                <p className="text-sm font-bold text-primary">Add Workforce Employee</p>
              </div>
              <button onClick={() => { setAdding(false); setForm(EMPTY_FORM); setError(""); }}
                className="text-gray-400 hover:text-gray-600 p-1.5 rounded-lg hover:bg-gray-100 transition-colors">
                <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <line x1="1" y1="1" x2="15" y2="15"/><line x1="15" y1="1" x2="1" y2="15"/>
                </svg>
              </button>
            </div>
            <div className="px-6 py-5 overflow-y-auto space-y-4">
              {error && (
                <div className="flex items-center gap-2 bg-red-50 border border-red-100 text-red-600 text-xs font-semibold px-3 py-2 rounded-xl">
                  <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="7" cy="7" r="6"/><line x1="7" y1="4" x2="7" y2="7"/><line x1="7" y1="10" x2="7.01" y2="10"/>
                  </svg>
                  {error}
                </div>
              )}
              <div className="grid grid-cols-2 gap-4">
                <Field label="First Name">
                  <input value={form.first_name} onChange={e => set("first_name", e.target.value)} placeholder="Jordan" className={INPUT} />
                </Field>
                <Field label="Last Name">
                  <input value={form.last_name} onChange={e => set("last_name", e.target.value)} placeholder="Lee" className={INPUT} />
                </Field>
              </div>
              <Field label="Employee Number">
                <input value={form.employee_number} onChange={e => set("employee_number", e.target.value)} placeholder="EMP-001" className={INPUT} />
              </Field>
              <div className="grid grid-cols-2 gap-4">
                <Field label="Employment Type">
                  <select value={form.employment_type} onChange={e => set("employment_type", e.target.value)} className={INPUT}>
                    <option value="full_time">Full Time</option>
                    <option value="part_time">Part Time</option>
                    <option value="contractor">Contractor</option>
                  </select>
                </Field>
                <Field label="Pay Type">
                  <select value={form.pay_type} onChange={e => set("pay_type", e.target.value)} className={INPUT}>
                    <option value="hourly">Hourly</option>
                    <option value="salary">Salary</option>
                  </select>
                </Field>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Field label={form.pay_type === "hourly" ? "Hourly Rate ($)" : "Annual Salary ($)"}>
                  <input type="number" value={form.pay_rate} onChange={e => set("pay_rate", e.target.value)} placeholder="0.00" className={INPUT} />
                </Field>
                <Field label="Hire Date">
                  <input type="date" value={form.hire_date} onChange={e => set("hire_date", e.target.value)} className={INPUT} />
                </Field>
              </div>
            </div>
            <div className="px-6 py-4 border-t border-gray-100 flex gap-3 flex-shrink-0 bg-gray-50/50">
              <button onClick={handleAdd} disabled={saving}
                className="bg-accent hover:bg-accent/90 text-primary font-bold px-6 py-2.5 rounded-xl text-sm transition-colors disabled:opacity-50 shadow-sm">
                {saving ? "Saving…" : "Add Employee"}
              </button>
              <button onClick={() => { setAdding(false); setForm(EMPTY_FORM); setError(""); }}
                className="text-sm text-gray-400 hover:text-gray-600 px-4 py-2.5 rounded-xl hover:bg-white transition-colors">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
