"use client";
import { useState, useEffect } from "react";

const DIRECTIONS = ["in", "out"];
const EMPTY_Q    = { message: "", type: "confirm", button_text: "Yes", video_url: "" };

export default function AdminChecklistPage() {
  const [questions, setQuestions] = useState([]);
  const [jobRoles,  setJobRoles]  = useState([]);
  const [loading, setLoading]     = useState(true);
  const [editing, setEditing]     = useState(null);
  const [editForm, setEditForm]   = useState({});
  const [adding, setAdding]       = useState(null); // { job_role, direction }
  const [addForm, setAddForm]     = useState(EMPTY_Q);
  const [saving, setSaving]       = useState(false);

  useEffect(() => {
    Promise.all([
      fetch("/api/checklist").then(r => r.json()),
      fetch("/api/job-roles").then(r => r.json()),
    ]).then(([qs, roles]) => {
      setQuestions(qs);
      setJobRoles(roles.map(r => r.name));
      setLoading(false);
    });
  }, []);

  function questionsFor(role, dir) {
    return questions
      .filter(q => q.job_role === role && q.direction === dir)
      .sort((a, b) => a.sort_order - b.sort_order);
  }

  async function saveEdit(id) {
    setSaving(true);
    const updated = await fetch(`/api/checklist/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(editForm),
    }).then(r => r.json());
    setQuestions(qs => qs.map(q => q.id === id ? updated : q));
    setEditing(null);
    setSaving(false);
  }

  async function deleteQuestion(id) {
    if (!confirm("Remove this question?")) return;
    await fetch(`/api/checklist/${id}`, { method: "DELETE" });
    setQuestions(qs => qs.filter(q => q.id !== id));
  }

  async function addQuestion(role, dir) {
    setSaving(true);
    const existing = questionsFor(role, dir);
    const newQ = await fetch("/api/checklist", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        job_role: role, direction: dir,
        ...addForm,
        sort_order: existing.length,
      }),
    }).then(r => r.json());
    setQuestions(qs => [...qs, newQ]);
    setAdding(null);
    setAddForm(EMPTY_Q);
    setSaving(false);
  }

  if (loading) return <div className="p-10 text-center text-gray-400 text-sm">Loading…</div>;

  return (
    <div className="px-8 py-8 max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-primary">Clock-In Checklist</h1>
        <p className="text-sm text-gray-400 mt-0.5">Manage questions shown to employees when clocking in and out</p>
      </div>

      {jobRoles.map(role => (
        <div key={role} className="space-y-4">
          <h2 className="text-sm font-bold text-primary border-b border-gray-100 pb-2">{role}</h2>

          <div className="grid grid-cols-2 gap-4">
            {DIRECTIONS.map(dir => {
              const qs = questionsFor(role, dir);
              const isAdding = adding?.job_role === role && adding?.direction === dir;

              return (
                <div key={dir} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                  <div className="px-5 py-3 border-b border-gray-50 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${dir === "in" ? "bg-accent/10 text-accent" : "bg-primary/10 text-primary"}`}>
                        Clock {dir === "in" ? "In" : "Out"}
                      </span>
                      <span className="text-xs text-gray-400">{qs.length} question{qs.length !== 1 ? "s" : ""}</span>
                    </div>
                    <button
                      onClick={() => { setAdding({ job_role: role, direction: dir }); setAddForm(EMPTY_Q); setEditing(null); }}
                      className="text-xs font-semibold text-accent hover:text-accent/80 transition-colors">
                      + Add
                    </button>
                  </div>

                  <div className="divide-y divide-gray-50">
                    {qs.length === 0 && !isAdding && (
                      <p className="px-5 py-4 text-xs text-gray-300 italic">No questions — employees skip directly to clock {dir}.</p>
                    )}

                    {qs.map((q, idx) => (
                      <div key={q.id} className="px-5 py-3">
                        {editing === q.id ? (
                          <div className="space-y-3">
                            <textarea
                              value={editForm.message}
                              onChange={e => setEditForm(f => ({ ...f, message: e.target.value }))}
                              rows={2}
                              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm text-primary focus:outline-none focus:border-accent resize-none"
                            />
                            <div className="grid grid-cols-2 gap-3">
                              <div className="space-y-1">
                                <label className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">Type</label>
                                <select value={editForm.type} onChange={e => setEditForm(f => ({ ...f, type: e.target.value }))}
                                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm text-primary focus:outline-none focus:border-accent">
                                  <option value="confirm">Confirm (Yes / No — cancel)</option>
                                  <option value="acknowledge">Acknowledge (button only)</option>
                                  <option value="video">Video (must watch)</option>
                                </select>
                              </div>
                              <div className="space-y-1">
                                <label className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">Button Label</label>
                                <input value={editForm.button_text} onChange={e => setEditForm(f => ({ ...f, button_text: e.target.value }))}
                                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm text-primary focus:outline-none focus:border-accent" />
                              </div>
                            </div>
                            {editForm.type === "video" && (
                              <div className="space-y-1">
                                <label className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">Video URL (YouTube or direct)</label>
                                <input value={editForm.video_url ?? ""} onChange={e => setEditForm(f => ({ ...f, video_url: e.target.value }))}
                                  placeholder="https://youtube.com/watch?v=..."
                                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm text-primary focus:outline-none focus:border-accent" />
                              </div>
                            )}
                            <div className="flex gap-2">
                              <button onClick={() => saveEdit(q.id)} disabled={saving}
                                className="bg-accent hover:bg-accent/90 text-primary font-bold px-4 py-1.5 rounded-lg text-xs transition-colors disabled:opacity-50">
                                {saving ? "Saving…" : "Save"}
                              </button>
                              <button onClick={() => setEditing(null)} className="text-xs text-gray-400 hover:text-gray-600 px-2">Cancel</button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-start gap-3">
                            <span className="text-[10px] font-bold text-gray-300 mt-0.5 w-4 flex-shrink-0">{idx + 1}</span>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm text-primary leading-snug">{q.message}</p>
                              <div className="flex items-center gap-2 mt-1">
                                <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${q.type === "confirm" ? "bg-orange-50 text-orange-500" : q.type === "video" ? "bg-blue-50 text-blue-500" : "bg-gray-100 text-gray-400"}`}>
                                  {q.type}
                                </span>
                                {q.type !== "video" && <span className="text-[10px] text-gray-300">btn: "{q.button_text}"</span>}
                                {q.type === "video" && q.video_url && <span className="text-[10px] text-gray-300 truncate max-w-[120px]">{q.video_url}</span>}
                              </div>
                            </div>
                            <div className="flex gap-1 flex-shrink-0">
                              <button onClick={() => { setEditing(q.id); setEditForm({ message: q.message, type: q.type, button_text: q.button_text, sort_order: q.sort_order, video_url: q.video_url ?? "" }); setAdding(null); }}
                                className="text-xs text-gray-300 hover:text-primary px-2 py-1 rounded-lg hover:bg-gray-50 transition-colors">
                                Edit
                              </button>
                              <button onClick={() => deleteQuestion(q.id)}
                                className="text-xs text-gray-300 hover:text-red-400 px-2 py-1 rounded-lg hover:bg-red-50 transition-colors">
                                ✕
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}

                    {/* Add form */}
                    {isAdding && (
                      <div className="px-5 py-4 space-y-3 bg-accent/5 border-t border-accent/10">
                        <textarea
                          value={addForm.message}
                          onChange={e => setAddForm(f => ({ ...f, message: e.target.value }))}
                          placeholder="Enter question…"
                          rows={2}
                          className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm text-primary focus:outline-none focus:border-accent resize-none"
                        />
                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-1">
                            <label className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">Type</label>
                            <select value={addForm.type} onChange={e => setAddForm(f => ({ ...f, type: e.target.value }))}
                              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm text-primary focus:outline-none focus:border-accent">
                              <option value="confirm">Confirm (Yes / No — cancel)</option>
                              <option value="acknowledge">Acknowledge (button only)</option>
                              <option value="video">Video (must watch)</option>
                            </select>
                          </div>
                          <div className="space-y-1">
                            <label className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">Button Label</label>
                            <input value={addForm.button_text} onChange={e => setAddForm(f => ({ ...f, button_text: e.target.value }))}
                              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm text-primary focus:outline-none focus:border-accent" />
                          </div>
                        </div>
                        {addForm.type === "video" && (
                          <div className="space-y-1">
                            <label className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">Video URL (YouTube or direct)</label>
                            <input value={addForm.video_url} onChange={e => setAddForm(f => ({ ...f, video_url: e.target.value }))}
                              placeholder="https://youtube.com/watch?v=..."
                              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm text-primary focus:outline-none focus:border-accent" />
                          </div>
                        )}
                        <div className="flex gap-2">
                          <button onClick={() => addQuestion(role, dir)} disabled={saving || !addForm.message.trim()}
                            className="bg-accent hover:bg-accent/90 text-primary font-bold px-4 py-1.5 rounded-lg text-xs transition-colors disabled:opacity-50">
                            {saving ? "Saving…" : "Add Question"}
                          </button>
                          <button onClick={() => setAdding(null)} className="text-xs text-gray-400 hover:text-gray-600 px-2">Cancel</button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
