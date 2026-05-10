"use client";
import { useState, useEffect } from "react";
import { getSession } from "@/lib/auth";

const PRIORITY_STYLES = {
  low:    { bg: "bg-gray-100",  text: "text-gray-500",  dot: "bg-gray-400"  },
  medium: { bg: "bg-amber-50",  text: "text-amber-600", dot: "bg-amber-400" },
  high:   { bg: "bg-red-50",    text: "text-red-500",   dot: "bg-red-400"   },
};

function fmtDate(d) {
  if (!d) return null;
  return new Date(d + "T00:00:00").toLocaleDateString([], { month: "short", day: "numeric" });
}
function isOverdue(due_date, status) {
  if (!due_date || status === "completed") return false;
  return new Date(due_date + "T00:00:00") < new Date();
}

export default function EmployeeTasksPage() {
  const [tasks,   setTasks]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter,  setFilter]  = useState("active");

  useEffect(() => {
    const s = getSession();
    if (!s) return;
    fetch(`/api/tasks?assignedTo=${s.id}`)
      .then(r => r.json())
      .then(d => { setTasks(Array.isArray(d) ? d : []); setLoading(false); });
  }, []);

  async function markComplete(id) {
    setTasks(ts => ts.map(t => t.id === id ? { ...t, status: "completed", completed_at: new Date().toISOString() } : t));
    await fetch(`/api/tasks/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "completed" }),
    });
  }

  async function markInProgress(id) {
    setTasks(ts => ts.map(t => t.id === id ? { ...t, status: "in_progress" } : t));
    await fetch(`/api/tasks/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "in_progress" }),
    });
  }

  const active    = tasks.filter(t => t.status !== "completed");
  const completed = tasks.filter(t => t.status === "completed");
  const shown     = filter === "active" ? active : completed;

  return (
    <div className="px-6 py-8 max-w-2xl mx-auto space-y-6">

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-primary">My Tasks</h1>
          <p className="text-xs text-gray-400 mt-0.5">{active.length} remaining</p>
        </div>
        <div className="flex items-center gap-1 bg-gray-100 rounded-xl p-1">
          <button onClick={() => setFilter("active")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${filter === "active" ? "bg-white text-primary shadow-sm" : "text-gray-400"}`}>
            Active {active.length > 0 && <span className="ml-1 text-accent font-bold">{active.length}</span>}
          </button>
          <button onClick={() => setFilter("done")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${filter === "done" ? "bg-white text-primary shadow-sm" : "text-gray-400"}`}>
            Done
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 rounded-full border-4 border-accent/30 border-t-accent animate-spin" />
        </div>
      ) : shown.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 gap-3 text-gray-300">
          <svg width="36" height="36" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="9,11 12,14 22,4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>
          </svg>
          <p className="text-sm font-semibold">{filter === "active" ? "No tasks assigned — you're all clear!" : "No completed tasks yet."}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {shown.map(t => {
            const ps = PRIORITY_STYLES[t.priority] ?? PRIORITY_STYLES.medium;
            const overdue = isOverdue(t.due_date, t.status);
            const done = t.status === "completed";
            return (
              <div key={t.id} className={`bg-white rounded-2xl border shadow-sm p-5 transition-all ${done ? "opacity-60 border-gray-100" : overdue ? "border-red-200" : "border-gray-100"}`}>
                <div className="flex items-start gap-4">
                  <button
                    onClick={() => !done && markComplete(t.id)}
                    className={`mt-0.5 w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors ${done ? "bg-emerald-400 border-emerald-400" : "border-gray-300 hover:border-accent"}`}>
                    {done && <svg width="10" height="10" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="2,5 4,8 9,2"/></svg>}
                  </button>

                  <div className="flex-1 min-w-0">
                    <p className={`font-semibold text-sm ${done ? "line-through text-gray-400" : "text-primary"}`}>{t.title}</p>
                    {t.description && <p className="text-xs text-gray-400 mt-1">{t.description}</p>}

                    <div className="flex items-center gap-2 mt-3 flex-wrap">
                      <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded-full ${ps.bg} ${ps.text}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${ps.dot}`} />{t.priority}
                      </span>
                      {t.due_date && (
                        <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${overdue ? "bg-red-50 text-red-500" : "bg-gray-100 text-gray-400"}`}>
                          {overdue ? "Overdue · " : "Due "}{fmtDate(t.due_date)}
                        </span>
                      )}
                      {t.status === "in_progress" && (
                        <span className="text-[10px] font-bold bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded-full">In Progress</span>
                      )}
                    </div>

                    {!done && (
                      <div className="flex gap-2 mt-3">
                        {t.status === "pending" && (
                          <button onClick={() => markInProgress(t.id)}
                            className="text-[11px] font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100 px-2.5 py-1 rounded-lg transition-colors">
                            Start Task
                          </button>
                        )}
                        <button onClick={() => markComplete(t.id)}
                          className="text-[11px] font-semibold text-emerald-600 bg-emerald-50 hover:bg-emerald-100 px-2.5 py-1 rounded-lg transition-colors">
                          Mark Complete
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
