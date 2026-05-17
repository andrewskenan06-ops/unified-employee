"use client";
import { useState, useEffect } from "react";
import { getSession } from "@/lib/auth";

function timeAgo(iso) {
  const diff = Math.floor((Date.now() - new Date(iso)) / 60000);
  if (diff < 1)  return "just now";
  if (diff < 60) return `${diff}m ago`;
  return `${Math.floor(diff / 60)}h ago`;
}

function clockedInDuration(iso) {
  const diff = Math.floor((Date.now() - new Date(iso)) / 60000);
  const h = Math.floor(diff / 60);
  const m = diff % 60;
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

export default function AdminOverviewPage() {
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState(null);
  const [flagged, setFlagged] = useState([]);

  useEffect(() => { setSession(getSession()); }, []);

  useEffect(() => {
    fetch("/api/admin/overview")
      .then(r => r.json())
      .then(d => { setData(d); setFlagged((d.recentFlagged ?? []).filter(r => r.approved === null)); setLoading(false); });
  }, []);

  async function setApproval(id, approved) {
    setFlagged(f => f.filter(r => r.id !== id));
    await fetch(`/api/time-records/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ approved }),
    });
  }

  if (loading) return <div className="p-10 text-center text-gray-400 text-sm">Loading…</div>;

  const { clockedIn, flaggedThisWeek, totalEmployees, totalOvertimeHours } = data;
  const firstName = session?.name?.split(" ")[0] ?? "Admin";

  return (
    <div className="px-8 py-8 max-w-5xl mx-auto space-y-8">

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-primary">Welcome back, {firstName}</h1>
        <p className="text-sm text-gray-400 mt-1">
          {new Date().toLocaleDateString([], { weekday: "long", month: "long", day: "numeric", year: "numeric" })}
        </p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-2">
          <p className="text-xs font-semibold uppercase tracking-widest text-gray-400">Clocked In Now</p>
          <p className="text-3xl font-black text-primary">{clockedIn.length}</p>
          <p className="text-xs text-gray-400">of {totalEmployees} employees</p>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-2">
          <p className="text-xs font-semibold uppercase tracking-widest text-gray-400">Total Employees</p>
          <p className="text-3xl font-black text-primary">{totalEmployees}</p>
          <p className="text-xs text-gray-400">active accounts</p>
        </div>
        <div className={`rounded-2xl border shadow-sm p-5 space-y-2 ${flaggedThisWeek > 0 ? "bg-red-50 border-red-100" : "bg-white border-gray-100"}`}>
          <p className="text-xs font-semibold uppercase tracking-widest text-gray-400">Flagged This Week</p>
          <p className={`text-3xl font-black ${flaggedThisWeek > 0 ? "text-red-500" : "text-primary"}`}>{flaggedThisWeek}</p>
          <p className="text-xs text-gray-400">out-of-range punches</p>
        </div>
        <div className={`rounded-2xl border shadow-sm p-5 space-y-2 ${totalOvertimeHours > 0 ? "bg-amber-50 border-amber-100" : "bg-white border-gray-100"}`}>
          <p className="text-xs font-semibold uppercase tracking-widest text-gray-400">OT Hours This Week</p>
          <p className={`text-3xl font-black ${totalOvertimeHours > 0 ? "text-amber-600" : "text-primary"}`}>{totalOvertimeHours}h</p>
          <p className="text-xs text-gray-400">across all employees</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">

        {/* Currently clocked in */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-50 flex items-center justify-between">
            <p className="text-sm font-bold text-primary">Currently Clocked In</p>
            <span className="flex items-center gap-1.5 text-xs font-semibold text-accent">
              <span className="w-2 h-2 rounded-full bg-accent animate-pulse" />
              Live
            </span>
          </div>
          {clockedIn.length === 0 ? (
            <div className="px-6 py-8 text-center text-gray-400 text-sm">No one is clocked in right now.</div>
          ) : (
            <div className="divide-y divide-gray-50">
              {clockedIn.map(emp => (
                <div key={emp.id} className="px-6 py-3.5 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold flex-shrink-0">
                    {emp.name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-primary truncate">{emp.name}</p>
                    <p className="text-xs text-gray-400">{emp.job_role ?? "—"}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-bold text-accent">{clockedInDuration(emp.clock_in)}</p>
                    <p className="text-[10px] text-gray-400">
                      {new Date(emp.clock_in).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Flagged punches */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-50 flex items-center justify-between">
            <p className="text-sm font-bold text-primary">Flagged Punches</p>
            <span className="text-[10px] font-bold text-gray-400 bg-gray-50 border border-gray-100 px-2 py-0.5 rounded-full">
              {flagged.filter(r => r.approved === null || r.approved == null).length} pending
            </span>
          </div>
          {flagged.length === 0 ? (
            <div className="px-6 py-8 text-center text-gray-400 text-sm">No flagged punches — all clear.</div>
          ) : (
            <div className="divide-y divide-gray-50">
              {flagged.map((r) => (
                <div key={r.id} className="px-6 py-4 flex items-start gap-3">
                  <div className="w-2 h-2 rounded-full mt-1.5 flex-shrink-0 bg-red-400" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-primary">{r.name}</p>
                    <p className="text-xs text-gray-400">{r.job_role ?? "—"} · {timeAgo(r.clock_in)}</p>
                    <div className="flex gap-1.5 mt-0.5">
                      {r.clock_in_dist_ft  && <span className="text-[10px] font-semibold text-red-500 bg-red-50 px-1.5 py-0.5 rounded-full">{r.clock_in_dist_ft}ft in</span>}
                      {r.clock_out_dist_ft && <span className="text-[10px] font-semibold text-red-500 bg-red-50 px-1.5 py-0.5 rounded-full">{r.clock_out_dist_ft}ft out</span>}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button onClick={() => setApproval(r.id, true)}
                      className="text-[11px] font-bold text-emerald-600 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 px-3 py-1.5 rounded-lg transition-colors">
                      Approve
                    </button>
                    <button onClick={() => setApproval(r.id, false)}
                      className="text-[11px] font-bold text-red-500 bg-red-50 hover:bg-red-100 border border-red-200 px-3 py-1.5 rounded-lg transition-colors">
                      Reject
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
