"use client";
import { useState, useEffect } from "react";

const INPUT = "w-full border border-gray-200 rounded-xl px-3 py-2 text-sm text-primary focus:outline-none focus:border-accent transition-colors";

const EMPTY_FORM = {
  title: "",
  briefing_category: "general",
  content_type: "text",
  body: "",
  video_url: "",
  gates_clock_in: false,
  is_required: false,
};

function Field({ label, children }) {
  return (
    <div className="space-y-1.5">
      <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block">{label}</label>
      {children}
    </div>
  );
}

function StatusBadge({ status }) {
  const map = {
    draft:     "bg-gray-100 text-gray-500",
    published: "bg-green-100 text-green-700",
    archived:  "bg-amber-100 text-amber-700",
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

export default function WorkforceBriefingsPage() {
  const [briefings, setBriefings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/workforce/briefings")
      .then(r => r.ok ? r.json() : [])
      .then(d => { setBriefings(Array.isArray(d) ? d : (d?.briefings ?? [])); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  async function handleAction(id, action) {
    if (action === "delete" && !confirm("Delete this briefing?")) return;
    const res = await fetch("/api/workforce/briefings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, briefing_id: id }),
    });
    if (res.ok) {
      if (action === "delete") {
        setBriefings(prev => prev.filter(b => b.id !== id));
      } else {
        const statusMap = { publish: "published", archive: "archived" };
        setBriefings(prev => prev.map(b => b.id === id ? { ...b, status: statusMap[action] ?? b.status } : b));
      }
    }
  }

  async function handleCreate() {
    if (!form.title.trim()) { setError("Title is required."); return; }
    setSaving(true);
    const res = await fetch("/api/workforce/briefings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "create", ...form }),
    });
    if (res.ok) {
      const d = await res.json();
      setBriefings(prev => [d.briefing ?? { id: Date.now(), ...form, status: "draft", created_at: new Date().toISOString() }, ...prev]);
      setAdding(false);
      setForm(EMPTY_FORM);
      setError("");
    } else {
      const d = await res.json().catch(() => ({}));
      setError(d.error ?? "Failed to create briefing.");
    }
    setSaving(false);
  }

  if (loading) return <div className="p-10 text-center text-gray-400 text-sm">Loading…</div>;

  return (
    <div className="px-8 py-8 max-w-6xl mx-auto space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-primary">Briefings</h1>
          <p className="text-sm text-gray-400 mt-1">{briefings.length} briefings</p>
        </div>
        <button
          onClick={() => { setAdding(true); setError(""); }}
          className="flex items-center gap-2 bg-accent hover:bg-accent/90 text-primary font-bold px-5 py-2.5 rounded-xl text-sm transition-colors shadow-sm">
          <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="7" y1="1" x2="7" y2="13"/><line x1="1" y1="7" x2="13" y2="7"/>
          </svg>
          New Briefing
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              <th className="px-5 py-3.5 text-left text-[10px] font-bold text-gray-500 uppercase tracking-widest">Title</th>
              <th className="px-5 py-3.5 text-left text-[10px] font-bold text-gray-500 uppercase tracking-widest">Category</th>
              <th className="px-5 py-3.5 text-left text-[10px] font-bold text-gray-500 uppercase tracking-widest">Content Type</th>
              <th className="px-5 py-3.5 text-left text-[10px] font-bold text-gray-500 uppercase tracking-widest">Status</th>
              <th className="px-5 py-3.5 text-left text-[10px] font-bold text-gray-500 uppercase tracking-widest">Gates Clock-In</th>
              <th className="px-5 py-3.5 text-left text-[10px] font-bold text-gray-500 uppercase tracking-widest">Created</th>
              <th className="px-5 py-3.5 text-left text-[10px] font-bold text-gray-500 uppercase tracking-widest">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {briefings.length === 0 ? (
              <tr><td colSpan={7} className="px-5 py-10 text-center text-gray-400 text-sm">No briefings found.</td></tr>
            ) : briefings.map(b => (
              <tr key={b.id} className="hover:bg-gray-50">
                <td className="px-5 py-3.5">
                  <p className="text-sm font-semibold text-primary">{b.title}</p>
                </td>
                <td className="px-5 py-3.5 text-sm text-gray-500 capitalize">{(b.briefing_category ?? b.category ?? "—").replace(/_/g, " ")}</td>
                <td className="px-5 py-3.5 text-sm text-gray-500 capitalize">{b.content_type ?? "text"}</td>
                <td className="px-5 py-3.5"><StatusBadge status={b.status} /></td>
                <td className="px-5 py-3.5">
                  {b.gates_clock_in ? (
                    <svg width="16" height="16" fill="none" stroke="#00ce7c" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="2,8 6,12 14,4"/>
                    </svg>
                  ) : (
                    <svg width="16" height="16" fill="none" stroke="#d1d5db" strokeWidth="2" strokeLinecap="round">
                      <line x1="3" y1="3" x2="13" y2="13"/><line x1="13" y1="3" x2="3" y2="13"/>
                    </svg>
                  )}
                </td>
                <td className="px-5 py-3.5 text-sm text-gray-400">{fmtDate(b.created_at)}</td>
                <td className="px-5 py-3.5">
                  <div className="flex items-center gap-2">
                    {b.status !== "published" && (
                      <button onClick={() => handleAction(b.id, "publish")}
                        className="text-[11px] font-bold text-emerald-600 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 px-2.5 py-1 rounded-lg transition-colors">
                        Publish
                      </button>
                    )}
                    {b.status !== "archived" && (
                      <button onClick={() => handleAction(b.id, "archive")}
                        className="text-[11px] font-bold text-amber-600 bg-amber-50 hover:bg-amber-100 border border-amber-200 px-2.5 py-1 rounded-lg transition-colors">
                        Archive
                      </button>
                    )}
                    <button onClick={() => handleAction(b.id, "delete")}
                      className="p-1.5 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                      <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="2,4 4,4 16,4"/><path d="M15,4l-1,11H6L5,4"/><path d="M8,8v5"/><path d="M11,8v5"/>
                        <path d="M7,4V3a1,1,0,0,1,1-1h3a1,1,0,0,1,1,1v1"/>
                      </svg>
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* New Briefing modal */}
      {adding && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => { setAdding(false); setForm(EMPTY_FORM); setError(""); }}>
          <div className="absolute inset-0 bg-primary/40 backdrop-blur-sm" />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between flex-shrink-0">
              <p className="text-sm font-bold text-primary">New Briefing</p>
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
              <Field label="Title">
                <input value={form.title} onChange={e => set("title", e.target.value)} placeholder="Briefing title…" className={INPUT} />
              </Field>
              <div className="grid grid-cols-2 gap-4">
                <Field label="Category">
                  <select value={form.briefing_category} onChange={e => set("briefing_category", e.target.value)} className={INPUT}>
                    <option value="general">General</option>
                    <option value="safety">Safety</option>
                    <option value="training">Training</option>
                    <option value="policy">Policy</option>
                    <option value="announcement">Announcement</option>
                  </select>
                </Field>
                <Field label="Content Type">
                  <select value={form.content_type} onChange={e => set("content_type", e.target.value)} className={INPUT}>
                    <option value="text">Text</option>
                    <option value="video">Video</option>
                  </select>
                </Field>
              </div>
              <Field label="Body">
                <textarea
                  value={form.body}
                  onChange={e => set("body", e.target.value)}
                  rows={4}
                  placeholder="Briefing content…"
                  className={INPUT + " resize-none"}
                />
              </Field>
              {form.content_type === "video" && (
                <Field label="Video URL">
                  <input value={form.video_url} onChange={e => set("video_url", e.target.value)} placeholder="https://…" className={INPUT} />
                </Field>
              )}
              <div className="flex items-center gap-6">
                <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer select-none">
                  <input type="checkbox" checked={form.gates_clock_in} onChange={e => set("gates_clock_in", e.target.checked)} className="accent-accent w-4 h-4" />
                  Gates Clock-In
                </label>
                <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer select-none">
                  <input type="checkbox" checked={form.is_required} onChange={e => set("is_required", e.target.checked)} className="accent-accent w-4 h-4" />
                  Required
                </label>
              </div>
            </div>
            <div className="px-6 py-4 border-t border-gray-100 flex gap-3 flex-shrink-0 bg-gray-50/50">
              <button onClick={handleCreate} disabled={saving}
                className="bg-accent hover:bg-accent/90 text-primary font-bold px-6 py-2.5 rounded-xl text-sm transition-colors disabled:opacity-50 shadow-sm">
                {saving ? "Saving…" : "Create Briefing"}
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
