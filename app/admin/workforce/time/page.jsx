"use client";
import { useState, useEffect } from "react";

function fmt(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}
function fmtDate(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString();
}
function totalHours(clockIn, clockOut) {
  if (!clockIn || !clockOut) return "—";
  const diff = (new Date(clockOut) - new Date(clockIn)) / 3600000;
  return diff.toFixed(2) + "h";
}

export default function WorkforceTimePage() {
  const [tab, setTab] = useState("pending");
  const [pending, setPending] = useState([]);
  const [disputed, setDisputed] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch("/api/workforce/shifts").then(r => r.ok ? r.json() : []).catch(() => []),
      fetch("/api/workforce/daily-approvals?view=disputed").then(r => r.ok ? r.json() : []).catch(() => []),
    ]).then(([shifts, disp]) => {
      setPending(Array.isArray(shifts) ? shifts : (shifts?.entries ?? []));
      setDisputed(Array.isArray(disp) ? disp : (disp?.entries ?? []));
      setLoading(false);
    });
  }, []);

  async function resolveDispute(id) {
    await fetch("/api/workforce/daily-approvals", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "resolve_dispute", entry_id: id }),
    });
    setDisputed(d => d.filter(e => e.id !== id));
  }

  if (loading) return <div className="p-10 text-center text-gray-400 text-sm">Loading…</div>;

  const tabs = [
    { key: "pending", label: "Pending Approvals", count: pending.length },
    { key: "disputed", label: "Disputed", count: disputed.length },
  ];

  return (
    <div className="px-8 py-8 max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-primary">Time &amp; Approvals</h1>
        <p className="text-sm text-gray-400 mt-1">Review pending and disputed time entries</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-gray-200">
        {tabs.map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-4 py-2.5 text-sm font-semibold transition-colors border-b-2 -mb-px ${
              tab === t.key
                ? "border-accent text-primary font-semibold"
                : "border-transparent text-gray-500 hover:text-primary"
            }`}
          >
            {t.label}
            {t.count > 0 && (
              <span className={`ml-2 text-[10px] font-bold px-1.5 py-0.5 rounded-full ${tab === t.key ? "bg-accent/20 text-accent" : "bg-gray-100 text-gray-400"}`}>
                {t.count}
              </span>
            )}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {tab === "pending" && (
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="px-5 py-3.5 text-left text-[10px] font-bold text-gray-400 uppercase tracking-widest">Entry Date</th>
                <th className="px-5 py-3.5 text-left text-[10px] font-bold text-gray-400 uppercase tracking-widest">Employee</th>
                <th className="px-5 py-3.5 text-left text-[10px] font-bold text-gray-400 uppercase tracking-widest">Clock In</th>
                <th className="px-5 py-3.5 text-left text-[10px] font-bold text-gray-400 uppercase tracking-widest">Clock Out</th>
                <th className="px-5 py-3.5 text-left text-[10px] font-bold text-gray-400 uppercase tracking-widest">Total Hours</th>
                <th className="px-5 py-3.5 text-left text-[10px] font-bold text-gray-400 uppercase tracking-widest">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {pending.length === 0 ? (
                <tr><td colSpan={6} className="px-5 py-10 text-center text-gray-400 text-sm">No pending approvals.</td></tr>
              ) : pending.map(entry => (
                <tr key={entry.id} className="hover:bg-gray-50">
                  <td className="px-5 py-3.5 text-sm text-gray-600">{fmtDate(entry.entry_date ?? entry.clock_in)}</td>
                  <td className="px-5 py-3.5 text-sm font-semibold text-primary">{entry.employee_name ?? entry.name ?? "—"}</td>
                  <td className="px-5 py-3.5 text-sm text-gray-600">{fmt(entry.clock_in)}</td>
                  <td className="px-5 py-3.5 text-sm text-gray-600">{fmt(entry.clock_out)}</td>
                  <td className="px-5 py-3.5 text-sm font-semibold text-primary">{totalHours(entry.clock_in, entry.clock_out)}</td>
                  <td className="px-5 py-3.5">
                    <span className="inline-flex items-center text-[11px] font-semibold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">
                      Pending
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {tab === "disputed" && (
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="px-5 py-3.5 text-left text-[10px] font-bold text-gray-400 uppercase tracking-widest">Date</th>
                <th className="px-5 py-3.5 text-left text-[10px] font-bold text-gray-400 uppercase tracking-widest">Employee</th>
                <th className="px-5 py-3.5 text-left text-[10px] font-bold text-gray-400 uppercase tracking-widest">Reason</th>
                <th className="px-5 py-3.5 text-left text-[10px] font-bold text-gray-400 uppercase tracking-widest">Status</th>
                <th className="px-5 py-3.5 text-left text-[10px] font-bold text-gray-400 uppercase tracking-widest">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {disputed.length === 0 ? (
                <tr><td colSpan={5} className="px-5 py-10 text-center text-gray-400 text-sm">No disputed entries.</td></tr>
              ) : disputed.map(entry => (
                <tr key={entry.id} className="hover:bg-gray-50">
                  <td className="px-5 py-3.5 text-sm text-gray-600">{fmtDate(entry.entry_date ?? entry.date)}</td>
                  <td className="px-5 py-3.5 text-sm font-semibold text-primary">{entry.employee_name ?? entry.name ?? "—"}</td>
                  <td className="px-5 py-3.5 text-sm text-gray-500 max-w-xs truncate">{entry.dispute_reason ?? entry.reason ?? "—"}</td>
                  <td className="px-5 py-3.5">
                    <span className="inline-flex items-center text-[11px] font-semibold px-2 py-0.5 rounded-full bg-red-100 text-red-700">
                      Disputed
                    </span>
                  </td>
                  <td className="px-5 py-3.5">
                    <button
                      onClick={() => resolveDispute(entry.id)}
                      className="text-xs font-bold text-primary bg-accent/10 hover:bg-accent/20 text-accent px-3 py-1.5 rounded-lg transition-colors">
                      Resolve
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
