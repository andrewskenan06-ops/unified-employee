"use client";
import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { getSession } from "@/lib/auth";

const ROLE_COLORS = {
  "Yard Worker":   { bg: "bg-emerald-50", text: "text-emerald-600", dot: "bg-emerald-400" },
  "Office Worker": { bg: "bg-blue-50",    text: "text-blue-600",    dot: "bg-blue-400"    },
  "Truck Driver":  { bg: "bg-orange-50",  text: "text-orange-600",  dot: "bg-orange-400"  },
  "Dirt Manager":  { bg: "bg-amber-50",   text: "text-amber-700",   dot: "bg-amber-400"   },
};

function initials(name) {
  return name.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2);
}

function formatDate(dateStr) {
  return new Date(dateStr + "T00:00:00").toLocaleDateString([], {
    weekday: "long", month: "long", day: "numeric", year: "numeric",
  });
}

export default function AdminScheduleDetailPage() {
  const { date } = useParams();
  const router   = useRouter();
  const [session,      setSession]      = useState(null);
  const [workers,      setWorkers]      = useState([]);
  const [allEmployees, setAllEmployees] = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [search,       setSearch]       = useState("");

  useEffect(() => {
    const s = getSession();
    if (!s) { router.replace("/admin/login"); return; }
    setSession(s);

    Promise.all([
      fetch("/api/schedule").then(r => r.json()),
      fetch("/api/employees").then(r => r.json()),
    ]).then(([schedule, employees]) => {
      setWorkers(schedule[date] || []);
      setAllEmployees(employees);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [date, router]);

  async function addWorker(emp) {
    const res  = await fetch("/api/schedule", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ date, employeeId: emp.id, addedBy: session?.id }),
    });
    const data = await res.json();
    if (data.slotId) {
      setWorkers(w => [...w, { id: emp.id, name: emp.name, slotId: data.slotId, job_role: emp.job_role }]);
    }
  }

  async function removeWorker(worker) {
    await fetch(`/api/schedule/${worker.slotId}`, { method: "DELETE" });
    setWorkers(w => w.filter(x => x.slotId !== worker.slotId));
  }

  if (!session || loading) return null;

  const unscheduled = allEmployees.filter(
    e => !workers.some(w => w.id === e.id) && e.status !== "inactive"
  );
  const filtered = search.trim()
    ? unscheduled.filter(e => e.name.toLowerCase().includes(search.toLowerCase()) || (e.job_role ?? "").toLowerCase().includes(search.toLowerCase()))
    : unscheduled;

  return (
    <div className="px-8 py-8 max-w-2xl mx-auto space-y-6">

      <Link href="/admin/schedule"
        className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-primary transition-colors">
        <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="9,2 3,7 9,12"/>
        </svg>
        Back to Calendar
      </Link>

      {/* Date header */}
      <div className="bg-accent/10 border border-accent/20 rounded-2xl px-6 py-5">
        <p className="text-xs font-semibold uppercase tracking-widest text-accent mb-1">Saturday Shift</p>
        <h1 className="text-xl font-bold text-primary">{formatDate(date)}</h1>
        <p className="text-sm text-primary/70 font-semibold mt-1">8:00 AM – 11:00 AM</p>
        <p className="text-xs text-gray-400 mt-2">{workers.length} worker{workers.length !== 1 ? "s" : ""} scheduled</p>
      </div>

      {/* Scheduled workers */}
      <div>
        <h2 className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-3">
          Scheduled — {workers.length}
        </h2>
        {workers.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 p-10 text-center text-gray-300 text-sm italic">
            No one scheduled yet.
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden divide-y divide-gray-50">
            {workers.map(w => {
              const rs = ROLE_COLORS[w.job_role] ?? { bg: "bg-gray-50", text: "text-gray-500", dot: "bg-gray-300" };
              return (
                <div key={w.slotId ?? w.id} className="flex items-center gap-3 px-5 py-4">
                  <div className="w-9 h-9 rounded-xl bg-primary text-accent flex items-center justify-center text-xs font-black flex-shrink-0">
                    {initials(w.name)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-primary">{w.name}</p>
                    {w.job_role && (
                      <span className={`inline-flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded-full mt-0.5 ${rs.bg} ${rs.text}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${rs.dot}`} />{w.job_role}
                      </span>
                    )}
                  </div>
                  <button
                    onClick={() => removeWorker(w)}
                    className="text-xs font-semibold text-red-400 hover:text-red-600 border border-red-100 hover:bg-red-50 px-3 py-1.5 rounded-lg transition-colors flex-shrink-0"
                  >
                    Remove
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Add employees */}
      {unscheduled.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xs font-semibold uppercase tracking-widest text-gray-400">
              Add Employee — {unscheduled.length} available
            </h2>
          </div>

          {/* Search */}
          <div className="relative mb-3">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="6" cy="6" r="5"/><line x1="10" y1="10" x2="14" y2="14"/>
            </svg>
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search by name or role…"
              className="w-full border border-gray-200 rounded-xl pl-8 pr-4 py-2 text-sm text-primary focus:outline-none focus:border-accent transition-colors"
            />
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden divide-y divide-gray-50">
            {filtered.length === 0 ? (
              <p className="px-5 py-6 text-sm text-gray-300 text-center italic">No employees match your search.</p>
            ) : (
              filtered.map(emp => {
                const rs = ROLE_COLORS[emp.job_role] ?? { bg: "bg-gray-50", text: "text-gray-500", dot: "bg-gray-300" };
                return (
                  <div key={emp.id} className="flex items-center gap-3 px-5 py-3.5">
                    <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center text-xs font-black flex-shrink-0">
                      {initials(emp.name)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-primary">{emp.name}</p>
                      <span className={`inline-flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded-full mt-0.5 ${rs.bg} ${rs.text}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${rs.dot}`} />{emp.job_role ?? "No role"}
                      </span>
                    </div>
                    <button
                      onClick={() => addWorker(emp)}
                      className="text-xs font-semibold bg-accent hover:bg-accent/90 text-primary px-3 py-1.5 rounded-lg transition-colors flex-shrink-0"
                    >
                      + Add
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {unscheduled.length === 0 && workers.length > 0 && (
        <div className="bg-accent/5 border border-accent/20 rounded-2xl p-5 text-center">
          <p className="text-sm font-semibold text-accent">All active employees are scheduled for this day.</p>
        </div>
      )}
    </div>
  );
}
