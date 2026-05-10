"use client";
import { useState, useEffect } from "react";
import { getSession } from "@/lib/auth";

const PRIORITY_STYLES = {
  low:    { bg: "bg-gray-100",    text: "text-gray-500",   dot: "bg-gray-400"   },
  medium: { bg: "bg-amber-50",    text: "text-amber-600",  dot: "bg-amber-400"  },
  high:   { bg: "bg-red-50",      text: "text-red-500",    dot: "bg-red-400"    },
};
const STATUS_STYLES = {
  pending:     { bg: "bg-gray-100",    text: "text-gray-500"   },
  in_progress: { bg: "bg-blue-50",     text: "text-blue-600"   },
  completed:   { bg: "bg-emerald-50",  text: "text-emerald-600"},
};

function fmtDate(d) {
  if (!d) return null;
  return new Date(d + "T00:00:00").toLocaleDateString([], { month: "short", day: "numeric", year: "numeric" });
}
function initials(name) {
  return name?.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2) ?? "??";
}
function isOverdue(due_date, status) {
  if (!due_date || status === "completed") return false;
  return new Date(due_date + "T00:00:00") < new Date();
}

export default function AdminTasksPage() {
  const [tasks,     setTasks]     = useState([]);
  const [employees, setEmployees] = useState([]);
  const [session,   setSession]   = useState(null);
  const [loading,   setLoading]   = useState(true);
  const [creating,  setCreating]  = useState(false);
  const [filter,    setFilter]    = useState("all");
  const [form,      setForm]      = useState({ title: "", description: "", assigned_to: "", due_date: "", priority: "medium" });
  const [saving,    setSaving]    = useState(false);
  const [error,     setError]     = useState("");

  useEffect(() => {
    setSession(getSession());
    Promise.all([
      fetch("/api/tasks").then(r => r.json()),
      fetch("/api/employees").then(r => r.json()),
    ]).then(([t, e]) => {
      setTasks(Array.isArray(t) ? t : []);
      setEmployees(e.filter(emp => emp.status !== "inactive"));
      setLoading(false);
    });
  }, []);

  async function createTask() {
    if (!form.title.trim())    { setError("Title is required."); return; }
    if (!form.assigned_to)     { setError("Select an employee."); return; }
    setSaving(true);
    const res = await fetch("/api/tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, created_by: session?.id ?? "admin" }),
    });
    const data = await res.json();
    if (data.id) {
      const emp = employees.find(e => e.id === form.assigned_to);
      setTasks(ts => [{ ...data, assigned_name: emp?.name }, ...ts]);
      setForm({ title: "", description: "", assigned_to: "", due_date: "", priority: "medium" });
      setCreating(false);
      setError("");
    } else {
      setError(data.error ?? "Failed to create task.");
    }
    setSaving(false);
  }

  async function setStatus(id, status) {
    setTasks(ts => ts.map(t => t.id === id ? { ...t, status, completed_at: status === "completed" ? new Date().toISOString() : null } : t));
    await fetch(`/api/tasks/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
  }

  async function deleteTask(id) {
    setTasks(ts => ts.filter(t => t.id !== id));
    await fetch(`/api/tasks/${id}`, { method: "DELETE" });
  }

  const filtered = tasks.filter(t => {
    if (filter === "pending")     return t.status === "pending";
    if (filter === "in_progress") return t.status === "in_progress";
    if (filter === "completed")   return t.status === "completed";
    if (filter === "overdue")     return isOverdue(t.due_date, t.status);
    return true;
  });

  const counts = {
    all:         tasks.length,
    pending:     tasks.filter(t => t.status === "pending").length,
    in_progress: tasks.filter(t => t.status === "in_progress").length,
    completed:   tasks.filter(t => t.status === "completed").length,
    overdue:     tasks.filter(t => isOverdue(t.due_date, t.status)).length,
  };

  return (
    <div className="flex flex-col h-full overflow-hidden">

      {/* Top bar */}
      <div className="bg-white border-b border-gray-100 px-8 py-4 flex items-center gap-4 flex-shrink-0">
        <div>
          <h1 className="text-lg font-bold text-primary">Tasks</h1>
          <p className="text-xs text-gray-400">{filtered.length} tasks</p>
        </div>
        <button onClick={() => { setCreating(true); setError(""); }}
          className="ml-auto flex items-center gap-2 bg-accent hover:bg-accent/90 text-primary font-bold px-4 py-2 rounded-xl text-sm transition-colors shadow-sm">
          <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="6.5" y1="1" x2="6.5" y2="12"/><line x1="1" y1="6.5" x2="12" y2="6.5"/></svg>
          New Task
        </button>
      </div>

      {/* Filter tabs */}
      <div className="bg-white border-b border-gray-100 px-8 flex items-center gap-1 flex-shrink-0">
        {[
          { key: "all",         label: "All"         },
          { key: "pending",     label: "Pending"     },
          { key: "in_progress", label: "In Progress" },
          { key: "completed",   label: "Completed"   },
          { key: "overdue",     label: "Overdue"     },
        ].map(t => (
          <button key={t.key} onClick={() => setFilter(t.key)}
            className={`flex items-center gap-1.5 px-4 py-3 text-xs font-semibold border-b-2 transition-colors ${
              filter === t.key ? "border-accent text-primary" : "border-transparent text-gray-400 hover:text-gray-600"
            }`}>
            {t.label}
            {counts[t.key] > 0 && (
              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                t.key === "overdue"     ? "bg-red-50 text-red-500" :
                t.key === "completed"  ? "bg-emerald-50 text-emerald-600" :
                t.key === "in_progress"? "bg-blue-50 text-blue-600" :
                "bg-gray-100 text-gray-500"
              }`}>{counts[t.key]}</span>
            )}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto bg-gray-50 p-6">

        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="w-8 h-8 rounded-full border-4 border-accent/30 border-t-accent animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-2 text-gray-300">
            <svg width="32" height="32" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="9,11 12,14 22,4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>
            </svg>
            <p className="text-sm font-semibold">No tasks here</p>
          </div>
        ) : (
          <div className="space-y-3 max-w-3xl">
            {filtered.map(t => {
              const ps = PRIORITY_STYLES[t.priority] ?? PRIORITY_STYLES.medium;
              const ss = STATUS_STYLES[t.status]     ?? STATUS_STYLES.pending;
              const overdue = isOverdue(t.due_date, t.status);
              return (
                <div key={t.id} className={`bg-white rounded-2xl border shadow-sm p-5 transition-all ${t.status === "completed" ? "opacity-60 border-gray-100" : overdue ? "border-red-200" : "border-gray-100 hover:shadow-md"}`}>
                  <div className="flex items-start gap-4">
                    {/* Checkbox */}
                    <button
                      onClick={() => setStatus(t.id, t.status === "completed" ? "pending" : "completed")}
                      className={`mt-0.5 w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors ${t.status === "completed" ? "bg-emerald-400 border-emerald-400" : "border-gray-300 hover:border-accent"}`}>
                      {t.status === "completed" && (
                        <svg width="10" height="10" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="2,5 4,8 9,2"/></svg>
                      )}
                    </button>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-3">
                        <p className={`font-semibold text-sm ${t.status === "completed" ? "line-through text-gray-400" : "text-primary"}`}>{t.title}</p>
                        <button onClick={() => deleteTask(t.id)} className="text-gray-200 hover:text-red-400 transition-colors flex-shrink-0">
                          <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="1" y1="1" x2="12" y2="12"/><line x1="12" y1="1" x2="1" y2="12"/></svg>
                        </button>
                      </div>

                      {t.description && <p className="text-xs text-gray-400 mt-1">{t.description}</p>}

                      <div className="flex items-center gap-2 mt-3 flex-wrap">
                        {/* Assigned */}
                        <div className="flex items-center gap-1.5">
                          <div className="w-5 h-5 rounded-full bg-primary/10 text-primary flex items-center justify-center text-[9px] font-black">
                            {initials(t.assigned_name)}
                          </div>
                          <span className="text-xs text-gray-500 font-medium">{t.assigned_name}</span>
                        </div>

                        <span className="text-gray-200">·</span>

                        {/* Priority */}
                        <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded-full ${ps.bg} ${ps.text}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${ps.dot}`} />{t.priority}
                        </span>

                        {/* Status */}
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${ss.bg} ${ss.text}`}>
                          {t.status.replace("_", " ")}
                        </span>

                        {/* Due date */}
                        {t.due_date && (
                          <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${overdue ? "bg-red-50 text-red-500" : "bg-gray-100 text-gray-400"}`}>
                            {overdue ? "Overdue · " : "Due "}{fmtDate(t.due_date)}
                          </span>
                        )}
                      </div>

                      {/* Status actions */}
                      {t.status !== "completed" && (
                        <div className="flex items-center gap-2 mt-3">
                          {t.status === "pending" && (
                            <button onClick={() => setStatus(t.id, "in_progress")}
                              className="text-[11px] font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100 px-2.5 py-1 rounded-lg transition-colors">
                              Mark In Progress
                            </button>
                          )}
                          {t.status === "in_progress" && (
                            <button onClick={() => setStatus(t.id, "pending")}
                              className="text-[11px] font-semibold text-gray-500 bg-gray-100 hover:bg-gray-200 px-2.5 py-1 rounded-lg transition-colors">
                              Back to Pending
                            </button>
                          )}
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

      {/* New Task modal */}
      {creating && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => setCreating(false)}>
          <div className="absolute inset-0 bg-primary/40 backdrop-blur-sm" />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <p className="text-sm font-bold text-primary">New Task</p>
              <button onClick={() => setCreating(false)} className="text-gray-400 hover:text-gray-600 p-1.5 rounded-lg hover:bg-gray-100 transition-colors">
                <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="1" y1="1" x2="14" y2="14"/><line x1="14" y1="1" x2="1" y2="14"/></svg>
              </button>
            </div>
            <div className="px-6 py-5 space-y-4">
              {error && (
                <div className="flex items-center gap-2 bg-red-50 border border-red-100 text-red-600 text-xs font-semibold px-3 py-2 rounded-xl">
                  <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="6.5" cy="6.5" r="5.5"/><line x1="6.5" y1="4" x2="6.5" y2="6.5"/><line x1="6.5" y1="9" x2="6.51" y2="9"/></svg>
                  {error}
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block">Task Title *</label>
                <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                  placeholder="e.g. Clean the yard area" autoFocus
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm text-primary focus:outline-none focus:border-accent transition-colors" />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block">Description</label>
                <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  placeholder="Optional details…" rows={3}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm text-primary focus:outline-none focus:border-accent transition-colors resize-none" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block">Assign To *</label>
                  <select value={form.assigned_to} onChange={e => setForm(f => ({ ...f, assigned_to: e.target.value }))}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm text-primary focus:outline-none focus:border-accent transition-colors">
                    <option value="">Select employee…</option>
                    {employees.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block">Priority</label>
                  <select value={form.priority} onChange={e => setForm(f => ({ ...f, priority: e.target.value }))}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm text-primary focus:outline-none focus:border-accent transition-colors">
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block">Due Date</label>
                <input type="date" value={form.due_date} onChange={e => setForm(f => ({ ...f, due_date: e.target.value }))}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm text-primary focus:outline-none focus:border-accent transition-colors" />
              </div>
            </div>
            <div className="px-6 py-4 border-t border-gray-100 bg-gray-50/50 flex gap-3">
              <button onClick={createTask} disabled={saving}
                className="bg-accent hover:bg-accent/90 text-primary font-bold px-6 py-2.5 rounded-xl text-sm transition-colors disabled:opacity-50 shadow-sm">
                {saving ? "Creating…" : "Create Task"}
              </button>
              <button onClick={() => setCreating(false)}
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
