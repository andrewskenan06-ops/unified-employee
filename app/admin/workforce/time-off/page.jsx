"use client";
import { useState, useEffect } from "react";

function StatusBadge({ status }) {
  const map = {
    pending:  "bg-amber-100 text-amber-700",
    approved: "bg-green-100 text-green-700",
    denied:   "bg-red-100 text-red-700",
  };
  return (
    <span className={`inline-flex items-center text-[11px] font-semibold px-2 py-0.5 rounded-full capitalize ${map[status] ?? "bg-gray-100 text-gray-500"}`}>
      {status ?? "unknown"}
    </span>
  );
}

function TypeBadge({ type }) {
  const map = {
    pto:  "bg-blue-100 text-blue-700",
    sick: "bg-purple-100 text-purple-700",
  };
  return (
    <span className={`inline-flex items-center text-[11px] font-semibold px-2 py-0.5 rounded-full uppercase ${map[type] ?? "bg-gray-100 text-gray-500"}`}>
      {type ?? "—"}
    </span>
  );
}

function fmtDate(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString();
}

export default function WorkforceTimeOffPage() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState(null);

  useEffect(() => {
    fetch("/api/workforce/time-off?view=all")
      .then(r => r.ok ? r.json() : [])
      .then(d => { setRequests(Array.isArray(d) ? d : (d?.requests ?? [])); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  async function handleAction(requestId, action) {
    setActing(requestId + action);
    const res = await fetch("/api/workforce/time-off", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, request_id: requestId }),
    });
    if (res.ok) {
      setRequests(prev => prev.map(r =>
        r.id === requestId ? { ...r, status: action === "approve" ? "approved" : "denied" } : r
      ));
    }
    setActing(null);
  }

  if (loading) return <div className="p-10 text-center text-gray-400 text-sm">Loading…</div>;

  return (
    <div className="px-8 py-8 max-w-6xl mx-auto space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-primary">Time Off Requests</h1>
          <p className="text-sm text-gray-400 mt-1">
            {requests.filter(r => r.status === "pending").length} pending · {requests.length} total
          </p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              <th className="px-5 py-3.5 text-left text-[10px] font-bold text-gray-500 uppercase tracking-widest">Employee</th>
              <th className="px-5 py-3.5 text-left text-[10px] font-bold text-gray-500 uppercase tracking-widest">Type</th>
              <th className="px-5 py-3.5 text-left text-[10px] font-bold text-gray-500 uppercase tracking-widest">Start Date</th>
              <th className="px-5 py-3.5 text-left text-[10px] font-bold text-gray-500 uppercase tracking-widest">End Date</th>
              <th className="px-5 py-3.5 text-left text-[10px] font-bold text-gray-500 uppercase tracking-widest">Status</th>
              <th className="px-5 py-3.5 text-left text-[10px] font-bold text-gray-500 uppercase tracking-widest">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {requests.length === 0 ? (
              <tr><td colSpan={6} className="px-5 py-10 text-center text-gray-400 text-sm">No time off requests found.</td></tr>
            ) : requests.map(req => (
              <tr key={req.id} className="hover:bg-gray-50">
                <td className="px-5 py-3.5">
                  <p className="text-sm font-semibold text-primary">{req.employee_name ?? req.name ?? "—"}</p>
                </td>
                <td className="px-5 py-3.5"><TypeBadge type={req.leave_type ?? req.type} /></td>
                <td className="px-5 py-3.5 text-sm text-gray-600">{fmtDate(req.start_date)}</td>
                <td className="px-5 py-3.5 text-sm text-gray-600">{fmtDate(req.end_date)}</td>
                <td className="px-5 py-3.5"><StatusBadge status={req.status} /></td>
                <td className="px-5 py-3.5">
                  {req.status === "pending" ? (
                    <div className="flex items-center gap-2">
                      <button
                        disabled={!!acting}
                        onClick={() => handleAction(req.id, "approve")}
                        className="text-[11px] font-bold text-emerald-600 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50">
                        Approve
                      </button>
                      <button
                        disabled={!!acting}
                        onClick={() => handleAction(req.id, "deny")}
                        className="text-[11px] font-bold text-red-500 bg-red-50 hover:bg-red-100 border border-red-200 px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50">
                        Deny
                      </button>
                    </div>
                  ) : (
                    <span className="text-xs text-gray-400">—</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
