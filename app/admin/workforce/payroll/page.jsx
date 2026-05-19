"use client";
import { useState, useEffect } from "react";

const INPUT = "w-full border border-gray-200 rounded-xl px-3 py-2 text-sm text-primary focus:outline-none focus:border-accent transition-colors";

const EMPTY_FORM = {
  period_start: "",
  period_end: "",
  pay_date: "",
  notes: "",
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
  const map = {
    draft:    "bg-gray-100 text-gray-500",
    approved: "bg-blue-100 text-blue-700",
    paid:     "bg-green-100 text-green-700",
  };
  return (
    <span className={`inline-flex items-center text-[11px] font-semibold px-2 py-0.5 rounded-full capitalize ${map[status] ?? "bg-gray-100 text-gray-500"}`}>
      {status ?? "draft"}
    </span>
  );
}

function fmtDate(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString();
}

function fmtMoney(n) {
  if (n == null) return "—";
  return `$${Number(n).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export default function WorkforcePayrollPage() {
  const [runs, setRuns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState(null);
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/workforce/payroll")
      .then(r => r.ok ? r.json() : [])
      .then(d => { setRuns(Array.isArray(d) ? d : (d?.runs ?? [])); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  async function handleCreate() {
    if (!form.period_start || !form.period_end || !form.pay_date) {
      setError("Period start, end, and pay date are required.");
      return;
    }
    setSaving(true);
    const res = await fetch("/api/workforce/payroll", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "create_run", ...form }),
    });
    if (res.ok) {
      const d = await res.json();
      setRuns(prev => [d.run ?? { id: Date.now(), ...form, status: "draft", entries: [] }, ...prev]);
      setAdding(false);
      setForm(EMPTY_FORM);
      setError("");
    } else {
      const d = await res.json().catch(() => ({}));
      setError(d.error ?? "Failed to create payroll run.");
    }
    setSaving(false);
  }

  if (loading) return <div className="p-10 text-center text-gray-400 text-sm">Loading…</div>;

  return (
    <div className="px-8 py-8 max-w-6xl mx-auto space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-primary">Payroll Runs</h1>
          <p className="text-sm text-gray-400 mt-1">{runs.length} runs</p>
        </div>
        <button
          onClick={() => { setAdding(true); setError(""); }}
          className="flex items-center gap-2 bg-accent hover:bg-accent/90 text-primary font-bold px-5 py-2.5 rounded-xl text-sm transition-colors shadow-sm">
          <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="7" y1="1" x2="7" y2="13"/><line x1="1" y1="7" x2="13" y2="7"/>
          </svg>
          New Payroll Run
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-100">
              <th className="px-5 py-3.5 text-left text-[10px] font-bold text-gray-400 uppercase tracking-widest">Period</th>
              <th className="px-5 py-3.5 text-left text-[10px] font-bold text-gray-400 uppercase tracking-widest">Pay Date</th>
              <th className="px-5 py-3.5 text-left text-[10px] font-bold text-gray-400 uppercase tracking-widest">Status</th>
              <th className="px-5 py-3.5 text-left text-[10px] font-bold text-gray-400 uppercase tracking-widest">Entries</th>
              <th className="px-5 py-3.5 text-left text-[10px] font-bold text-gray-400 uppercase tracking-widest">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {runs.length === 0 ? (
              <tr><td colSpan={5} className="px-5 py-10 text-center text-gray-400 text-sm">No payroll runs found.</td></tr>
            ) : runs.map(run => (
              <>
                <tr key={run.id} className="hover:bg-gray-50 cursor-pointer" onClick={() => setExpandedId(expandedId === run.id ? null : run.id)}>
                  <td className="px-5 py-3.5">
                    <p className="text-sm font-semibold text-primary">
                      {fmtDate(run.period_start)} – {fmtDate(run.period_end)}
                    </p>
                  </td>
                  <td className="px-5 py-3.5 text-sm text-gray-600">{fmtDate(run.pay_date)}</td>
                  <td className="px-5 py-3.5"><StatusBadge status={run.status} /></td>
                  <td className="px-5 py-3.5 text-sm text-gray-600">{(run.entries ?? []).length}</td>
                  <td className="px-5 py-3.5">
                    <button
                      onClick={e => { e.stopPropagation(); setExpandedId(expandedId === run.id ? null : run.id); }}
                      className="flex items-center gap-1 text-xs font-semibold text-gray-400 hover:text-primary transition-colors">
                      <svg
                        width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                        className={`transition-transform ${expandedId === run.id ? "rotate-180" : ""}`}>
                        <polyline points="2,4 7,9 12,4"/>
                      </svg>
                      {expandedId === run.id ? "Collapse" : "View Entries"}
                    </button>
                  </td>
                </tr>
                {expandedId === run.id && (
                  <tr key={`${run.id}-expand`}>
                    <td colSpan={5} className="px-5 py-0">
                      <div className="bg-gray-50 rounded-xl mx-0 my-2 overflow-hidden border border-gray-100">
                        {(run.entries ?? []).length === 0 ? (
                          <p className="px-5 py-4 text-sm text-gray-400">No entries for this run.</p>
                        ) : (
                          <table className="w-full">
                            <thead>
                              <tr className="border-b border-gray-100">
                                <th className="px-4 py-2.5 text-left text-[10px] font-bold text-gray-400 uppercase tracking-widest">Employee</th>
                                <th className="px-4 py-2.5 text-left text-[10px] font-bold text-gray-400 uppercase tracking-widest">Regular Hrs</th>
                                <th className="px-4 py-2.5 text-left text-[10px] font-bold text-gray-400 uppercase tracking-widest">OT Hrs</th>
                                <th className="px-4 py-2.5 text-left text-[10px] font-bold text-gray-400 uppercase tracking-widest">Gross Pay</th>
                                <th className="px-4 py-2.5 text-left text-[10px] font-bold text-gray-400 uppercase tracking-widest">Net Pay</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                              {(run.entries ?? []).map((entry, i) => (
                                <tr key={entry.id ?? i}>
                                  <td className="px-4 py-2.5 text-sm font-semibold text-primary">{entry.employee_name ?? "—"}</td>
                                  <td className="px-4 py-2.5 text-sm text-gray-600">{entry.regular_hours ?? "—"}</td>
                                  <td className="px-4 py-2.5 text-sm text-gray-600">{entry.overtime_hours ?? "—"}</td>
                                  <td className="px-4 py-2.5 text-sm font-semibold text-primary">{fmtMoney(entry.gross_pay)}</td>
                                  <td className="px-4 py-2.5 text-sm font-semibold text-accent">{fmtMoney(entry.net_pay)}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        )}
                      </div>
                    </td>
                  </tr>
                )}
              </>
            ))}
          </tbody>
        </table>
      </div>

      {/* New Run modal */}
      {adding && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => { setAdding(false); setForm(EMPTY_FORM); setError(""); }}>
          <div className="absolute inset-0 bg-primary/40 backdrop-blur-sm" />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] flex flex-col overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between flex-shrink-0">
              <p className="text-sm font-bold text-primary">New Payroll Run</p>
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
                  {error}
                </div>
              )}
              <div className="grid grid-cols-2 gap-4">
                <Field label="Period Start">
                  <input type="date" value={form.period_start} onChange={e => set("period_start", e.target.value)} className={INPUT} />
                </Field>
                <Field label="Period End">
                  <input type="date" value={form.period_end} onChange={e => set("period_end", e.target.value)} className={INPUT} />
                </Field>
              </div>
              <Field label="Pay Date">
                <input type="date" value={form.pay_date} onChange={e => set("pay_date", e.target.value)} className={INPUT} />
              </Field>
              <Field label="Notes">
                <textarea value={form.notes} onChange={e => set("notes", e.target.value)} rows={3} placeholder="Optional notes…" className={INPUT + " resize-none"} />
              </Field>
            </div>
            <div className="px-6 py-4 border-t border-gray-100 flex gap-3 flex-shrink-0 bg-gray-50/50">
              <button onClick={handleCreate} disabled={saving}
                className="bg-accent hover:bg-accent/90 text-primary font-bold px-6 py-2.5 rounded-xl text-sm transition-colors disabled:opacity-50 shadow-sm">
                {saving ? "Saving…" : "Create Run"}
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
