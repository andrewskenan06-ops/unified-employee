"use client";
import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { getSession } from "@/lib/auth";

const MAX_WORKERS = 3;

function formatDate(dateStr) {
  return new Date(dateStr + "T00:00:00").toLocaleDateString([], {
    weekday: "long", month: "long", day: "numeric", year: "numeric",
  });
}

export default function SchedulePage() {
  const { date } = useParams();
  const router   = useRouter();
  const [session, setSession]     = useState(null);
  const [workers, setWorkers]     = useState([]); // [{ id, name, slotId }]
  const [allEmployees, setAllEmployees] = useState([]);
  const [loading, setLoading]     = useState(true);

  useEffect(() => {
    const s = getSession();
    if (!s) { router.replace("/login"); return; }
    setSession(s);

    Promise.all([
      fetch(`/api/schedule`).then(r => r.json()),
      fetch(`/api/employees`).then(r => r.json()),
    ]).then(([schedule, employees]) => {
      setWorkers(schedule[date] || []);
      setAllEmployees(employees);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [date, router]);

  if (!session || loading) return null;

  const isAdmin = session.role === "admin";

  async function adminAdd(emp) {
    const res  = await fetch("/api/schedule", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ date, employeeId: emp.id, addedBy: session.id }),
    });
    const data = await res.json();
    if (data.slotId) {
      setWorkers(w => [...w, { id: emp.id, name: emp.name, slotId: data.slotId }]);
    }
  }

  async function adminRemove(worker) {
    await fetch(`/api/schedule/${worker.slotId}`, { method: "DELETE" });
    setWorkers(w => w.filter(x => x.slotId !== worker.slotId));
  }

  const unscheduled = allEmployees.filter((e) => !workers.some((w) => w.id === e.id));

  return (
    <div className="px-8 py-8 max-w-xl mx-auto space-y-6">

      <Link href="/dashboard/calendar" className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-primary transition-colors">
        <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="9,2 3,7 9,12"/>
        </svg>
        Back to Calendar
      </Link>

      {/* Header */}
      <div className="bg-accent/10 border border-accent/20 rounded-2xl px-6 py-5">
        <p className="text-xs font-semibold uppercase tracking-widest text-accent mb-1">Saturday Shift</p>
        <h1 className="text-xl font-bold text-primary">{formatDate(date)}</h1>
        <p className="text-sm text-primary/70 font-semibold mt-1">8:00 AM – 11:00 AM</p>
        <p className="text-xs text-gray-400 mt-2">{workers.length} / {MAX_WORKERS} workers scheduled</p>
      </div>

      {/* Workers list */}
      <div>
        <h2 className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-3">
          Workers Scheduled — {workers.length}
        </h2>

        {workers.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 p-10 text-center text-gray-400 text-sm">
            No one is scheduled yet.
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden divide-y divide-gray-50">
            {workers.map((w) => (
              <div key={w.slotId ?? w.id} className="flex items-center gap-3 px-5 py-4">
                <div className="w-8 h-8 rounded-full bg-accent/10 text-accent flex items-center justify-center text-xs font-bold flex-shrink-0">
                  {w.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)}
                </div>
                <span className="text-sm font-medium text-primary">{w.name}</span>
                {w.id === session.id && (
                  <span className="ml-auto text-[10px] font-semibold bg-accent/10 text-accent px-2 py-0.5 rounded-full">You</span>
                )}
                {isAdmin && (
                  <button
                    onClick={() => adminRemove(w)}
                    className="ml-auto text-[10px] font-semibold text-red-400 hover:text-red-600 border border-red-100 hover:bg-red-50 px-2.5 py-1 rounded-lg transition-colors"
                  >
                    Remove
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Admin: add unscheduled employees */}
      {isAdmin && unscheduled.length > 0 && (
        <div>
          <h2 className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-3">Add Employee</h2>
          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden divide-y divide-gray-50">
            {unscheduled.map((emp) => (
              <div key={emp.id} className="flex items-center gap-3 px-5 py-4">
                <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold flex-shrink-0">
                  {emp.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)}
                </div>
                <span className="text-sm font-medium text-primary">{emp.name}</span>
                <button
                  onClick={() => adminAdd(emp)}
                  disabled={workers.length >= MAX_WORKERS}
                  className="ml-auto text-[10px] font-semibold bg-accent hover:bg-accent/90 disabled:opacity-40 disabled:cursor-not-allowed text-primary px-3 py-1.5 rounded-lg transition-colors"
                >
                  Add
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
