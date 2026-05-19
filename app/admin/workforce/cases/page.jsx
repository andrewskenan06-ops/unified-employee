"use client";
import { useState, useEffect } from "react";

function TypeBadge({ type }) {
  const map = {
    concern:      "bg-amber-100 text-amber-700",
    coaching:     "bg-blue-100 text-blue-700",
    disciplinary: "bg-red-100 text-red-700",
  };
  return (
    <span className={`inline-flex items-center text-[11px] font-semibold px-2 py-0.5 rounded-full capitalize ${map[type] ?? "bg-gray-100 text-gray-500"}`}>
      {type ?? "—"}
    </span>
  );
}

function StatusBadge({ status }) {
  const map = {
    open:     "bg-amber-100 text-amber-700",
    resolved: "bg-green-100 text-green-700",
    closed:   "bg-gray-100 text-gray-500",
  };
  return (
    <span className={`inline-flex items-center text-[11px] font-semibold px-2 py-0.5 rounded-full capitalize ${map[status] ?? "bg-gray-100 text-gray-500"}`}>
      {status ?? "open"}
    </span>
  );
}

function fmtDate(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString();
}

const FILTERS = ["All", "Concerns", "Coaching", "Disciplinary"];
const FILTER_MAP = { All: null, Concerns: "concern", Coaching: "coaching", Disciplinary: "disciplinary" };

export default function WorkforceCasesPage() {
  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("All");
  const [expandedId, setExpandedId] = useState(null);

  useEffect(() => {
    fetch("/api/workforce/cases")
      .then(r => r.ok ? r.json() : [])
      .then(d => { setCases(Array.isArray(d) ? d : (d?.cases ?? [])); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const filtered = cases.filter(c => {
    const t = FILTER_MAP[filter];
    return t === null || c.case_type === t || c.type === t;
  });

  if (loading) return <div className="p-10 text-center text-gray-400 text-sm">Loading…</div>;

  return (
    <div className="px-8 py-8 max-w-6xl mx-auto space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-primary">Cases &amp; Coaching</h1>
          <p className="text-sm text-gray-400 mt-1">{cases.length} cases</p>
        </div>
      </div>

      {/* Filter bar */}
      <div className="flex items-center gap-2">
        {FILTERS.map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition-colors ${
              filter === f
                ? "bg-primary text-white"
                : "bg-white border border-gray-200 text-gray-500 hover:text-primary hover:border-primary/30"
            }`}>
            {f}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-100">
              <th className="px-5 py-3.5 text-left text-[10px] font-bold text-gray-400 uppercase tracking-widest">Employee</th>
              <th className="px-5 py-3.5 text-left text-[10px] font-bold text-gray-400 uppercase tracking-widest">Type</th>
              <th className="px-5 py-3.5 text-left text-[10px] font-bold text-gray-400 uppercase tracking-widest">Category</th>
              <th className="px-5 py-3.5 text-left text-[10px] font-bold text-gray-400 uppercase tracking-widest">Title</th>
              <th className="px-5 py-3.5 text-left text-[10px] font-bold text-gray-400 uppercase tracking-widest">Severity</th>
              <th className="px-5 py-3.5 text-left text-[10px] font-bold text-gray-400 uppercase tracking-widest">Status</th>
              <th className="px-5 py-3.5 text-left text-[10px] font-bold text-gray-400 uppercase tracking-widest">Created</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {filtered.length === 0 ? (
              <tr><td colSpan={7} className="px-5 py-10 text-center text-gray-400 text-sm">No cases found.</td></tr>
            ) : filtered.map(c => (
              <>
                <tr
                  key={c.id}
                  className="hover:bg-gray-50 cursor-pointer"
                  onClick={() => setExpandedId(expandedId === c.id ? null : c.id)}>
                  <td className="px-5 py-3.5 text-sm font-semibold text-primary">{c.employee_name ?? c.name ?? "—"}</td>
                  <td className="px-5 py-3.5"><TypeBadge type={c.case_type ?? c.type} /></td>
                  <td className="px-5 py-3.5 text-sm text-gray-500 capitalize">{(c.category ?? "—").replace(/_/g, " ")}</td>
                  <td className="px-5 py-3.5 text-sm text-gray-700">{c.title ?? "—"}</td>
                  <td className="px-5 py-3.5">
                    <span className="text-sm text-gray-500 capitalize">{c.severity ?? "—"}</span>
                  </td>
                  <td className="px-5 py-3.5"><StatusBadge status={c.status} /></td>
                  <td className="px-5 py-3.5 text-sm text-gray-400">{fmtDate(c.created_at)}</td>
                </tr>
                {expandedId === c.id && (
                  <tr key={`${c.id}-expand`}>
                    <td colSpan={7} className="px-5 py-0">
                      <div className="bg-gray-50 rounded-xl mx-0 my-2 px-5 py-4 border border-gray-100">
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">Description</p>
                        <p className="text-sm text-gray-600">{c.description ?? c.notes ?? "No description provided."}</p>
                      </div>
                    </td>
                  </tr>
                )}
              </>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
