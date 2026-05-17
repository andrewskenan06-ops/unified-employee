"use client";
import { useState, useEffect } from "react";
import { AVAILABLE_COLORS, roleStyle } from "@/lib/constants";

const INPUT = "w-full border border-gray-200 rounded-xl px-3 py-2 text-sm text-primary focus:outline-none focus:border-accent transition-colors";

function Section({ title, children }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-2">
        <div className="w-1 h-4 bg-accent rounded-full" />
        <p className="text-sm font-bold text-primary uppercase tracking-widest">{title}</p>
      </div>
      <div className="px-6 py-5 space-y-4">{children}</div>
    </div>
  );
}

function Field({ label, hint, children }) {
  return (
    <div className="space-y-1.5">
      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block">{label}</label>
      {children}
      {hint && <p className="text-xs text-gray-400">{hint}</p>}
    </div>
  );
}

function SaveBar({ dirty, saving, onSave, onDiscard }) {
  if (!dirty) return null;
  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 bg-primary text-white px-5 py-3 rounded-2xl shadow-xl">
      <span className="text-sm font-semibold">You have unsaved changes</span>
      <button onClick={onSave} disabled={saving}
        className="bg-accent hover:bg-accent/90 text-primary font-bold px-4 py-1.5 rounded-lg text-sm transition-colors disabled:opacity-50">
        {saving ? "Saving…" : "Save"}
      </button>
      <button onClick={onDiscard} className="text-white/60 hover:text-white text-sm px-2 transition-colors">Discard</button>
    </div>
  );
}

export default function AdminSettingsPage() {
  const [settings,  setSettings]  = useState(null);
  const [original,  setOriginal]  = useState(null);
  const [roles,     setRoles]     = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [saving,    setSaving]    = useState(false);
  const [dirty,     setDirty]     = useState(false);

  // Job role add form
  const [newRole,   setNewRole]   = useState({ name: "", color: "gray" });
  const [addingRole, setAddingRole] = useState(false);
  const [editingRole, setEditingRole] = useState(null); // { id, name, color }

  // Employment types / health plans add
  const [newEmpType,   setNewEmpType]   = useState("");
  const [newHealthPlan, setNewHealthPlan] = useState({ value: "", label: "" });

  useEffect(() => {
    Promise.all([
      fetch("/api/settings").then(r => r.json()),
      fetch("/api/job-roles").then(r => r.json()),
    ]).then(([s, r]) => {
      setSettings(s);
      setOriginal(JSON.parse(JSON.stringify(s)));
      setRoles(r);
      setLoading(false);
    });
  }, []);

  function set(key, value) {
    setSettings(s => ({ ...s, [key]: value }));
    setDirty(true);
  }

  async function save() {
    setSaving(true);
    await fetch("/api/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(settings),
    });
    setOriginal(JSON.parse(JSON.stringify(settings)));
    setDirty(false);
    setSaving(false);
  }

  function discard() {
    setSettings(JSON.parse(JSON.stringify(original)));
    setDirty(false);
  }

  async function addRole() {
    if (!newRole.name.trim()) return;
    const r = await fetch("/api/job-roles", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newRole),
    }).then(r => r.json());
    if (r.id) { setRoles(rs => [...rs, r]); setNewRole({ name: "", color: "gray" }); setAddingRole(false); }
  }

  async function saveRole() {
    await fetch(`/api/job-roles/${editingRole.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: editingRole.name, color: editingRole.color }),
    });
    setRoles(rs => rs.map(r => r.id === editingRole.id ? { ...r, ...editingRole } : r));
    setEditingRole(null);
  }

  async function deleteRole(id) {
    await fetch(`/api/job-roles/${id}`, { method: "DELETE" });
    setRoles(rs => rs.filter(r => r.id !== id));
  }

  function addEmpType() {
    const v = newEmpType.trim().toLowerCase().replace(/\s+/g, "-");
    if (!v) return;
    set("employment_types", [...(settings.employment_types ?? []), v]);
    setNewEmpType("");
  }

  function removeEmpType(val) {
    set("employment_types", (settings.employment_types ?? []).filter(t => t !== val));
  }

  function addHealthPlan() {
    if (!newHealthPlan.value.trim() || !newHealthPlan.label.trim()) return;
    set("health_plans", [...(settings.health_plans ?? []), { value: newHealthPlan.value.trim(), label: newHealthPlan.label.trim() }]);
    setNewHealthPlan({ value: "", label: "" });
  }

  function removeHealthPlan(val) {
    set("health_plans", (settings.health_plans ?? []).filter(p => p.value !== val));
  }

  if (loading) return <div className="flex items-center justify-center h-full"><div className="w-8 h-8 rounded-full border-4 border-accent/30 border-t-accent animate-spin" /></div>;

  return (
    <div className="px-8 py-8 max-w-3xl mx-auto space-y-6 pb-24">
      <div>
        <h1 className="text-2xl font-bold text-primary">Settings</h1>
        <p className="text-sm text-gray-400 mt-1">Configure every aspect of your platform — no hardcoded values.</p>
      </div>

      {/* Company */}
      <Section title="Company">
        <Field label="Company Name">
          <input value={settings.company_name ?? ""} onChange={e => set("company_name", e.target.value)} className={INPUT} />
        </Field>
      </Section>

      {/* Location / Geofence */}
      <Section title="Location & Geofence">
        <div className="grid grid-cols-3 gap-4">
          <Field label="Latitude">
            <input type="number" step="0.0001" value={settings.geofence_lat ?? ""} onChange={e => set("geofence_lat", e.target.value)} className={INPUT} />
          </Field>
          <Field label="Longitude">
            <input type="number" step="0.0001" value={settings.geofence_lng ?? ""} onChange={e => set("geofence_lng", e.target.value)} className={INPUT} />
          </Field>
          <Field label="Radius (feet)" hint="Punches outside this radius are flagged">
            <input type="number" value={settings.geofence_radius_ft ?? ""} onChange={e => set("geofence_radius_ft", e.target.value)} className={INPUT} />
          </Field>
        </div>
      </Section>

      {/* Pay Rules */}
      <Section title="Pay Rules">
        <div className="grid grid-cols-3 gap-4">
          <Field label="Overtime Threshold (hrs/week)" hint="Hours above this are overtime">
            <input type="number" value={settings.overtime_threshold_hours ?? ""} onChange={e => set("overtime_threshold_hours", e.target.value)} className={INPUT} />
          </Field>
          <Field label="Overtime Multiplier" hint="e.g. 1.5 = time-and-a-half">
            <input type="number" step="0.1" value={settings.overtime_multiplier ?? ""} onChange={e => set("overtime_multiplier", e.target.value)} className={INPUT} />
          </Field>
          <Field label="Income Tax Rate" hint="e.g. 0.21 = 21%">
            <input type="number" step="0.01" min="0" max="1" value={settings.income_tax_rate ?? ""} onChange={e => set("income_tax_rate", e.target.value)} className={INPUT} />
          </Field>
          <Field label="Pay Period">
            <select value={settings.pay_period ?? "weekly"} onChange={e => set("pay_period", e.target.value)} className={INPUT}>
              <option value="weekly">Weekly</option>
              <option value="biweekly">Bi-Weekly</option>
              <option value="semimonthly">Semi-Monthly</option>
              <option value="monthly">Monthly</option>
            </select>
          </Field>
          <Field label="Reference Pay Date" hint="Base date for calculating next payday">
            <input type="date" value={settings.pay_reference_date ?? ""} onChange={e => set("pay_reference_date", e.target.value)} className={INPUT} />
          </Field>
        </div>
      </Section>

      {/* Clock-in / Kiosk */}
      <Section title="Clock-In Kiosk">
        <div className="grid grid-cols-3 gap-4">
          <Field label="PIN Length (digits)">
            <input type="number" min="3" max="8" value={settings.pin_length ?? 4} onChange={e => set("pin_length", e.target.value)} className={INPUT} />
          </Field>
          <Field label="Auto-Reset Delay (seconds)" hint="How long to show success screen before resetting">
            <input type="number" min="1" max="30" value={settings.kiosk_reset_seconds ?? 3} onChange={e => set("kiosk_reset_seconds", e.target.value)} className={INPUT} />
          </Field>
        </div>
      </Section>

      {/* Work Schedule */}
      <Section title="Work Schedule">
        <div className="grid grid-cols-2 gap-4">
          <Field label="Saturday Shift Label">
            <input value={settings.saturday_shift_label ?? ""} onChange={e => set("saturday_shift_label", e.target.value)} className={INPUT} />
          </Field>
          <Field label="Saturday Shift Hours">
            <input value={settings.saturday_shift_hours ?? ""} onChange={e => set("saturday_shift_hours", e.target.value)} className={INPUT} />
          </Field>
        </div>
        <div>
          <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-2">Daily Hours</label>
          <div className="grid grid-cols-3 gap-3">
            {["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"].map((day, i) => {
              const key = String(i + 1);
              return (
                <div key={day} className="space-y-1">
                  <p className="text-xs text-gray-500 font-semibold">{day}</p>
                  <input value={(settings.work_day_hours ?? {})[key] ?? ""}
                    onChange={e => set("work_day_hours", { ...(settings.work_day_hours ?? {}), [key]: e.target.value })}
                    className={INPUT} placeholder="e.g. 6:30–4:30" />
                </div>
              );
            })}
          </div>
        </div>
      </Section>

      {/* Job Roles */}
      <Section title="Job Roles">
        <div className="space-y-2">
          {roles.map(r => {
            const c = roleStyle(r.color);
            if (editingRole?.id === r.id) return (
              <div key={r.id} className="flex items-center gap-2 p-2 border border-gray-100 rounded-xl bg-gray-50">
                <input value={editingRole.name} onChange={e => setEditingRole(er => ({ ...er, name: e.target.value }))}
                  className="flex-1 border border-gray-200 rounded-lg px-2.5 py-1.5 text-sm text-primary focus:outline-none focus:border-accent" />
                <select value={editingRole.color} onChange={e => setEditingRole(er => ({ ...er, color: e.target.value }))}
                  className="border border-gray-200 rounded-lg px-2.5 py-1.5 text-sm text-primary focus:outline-none focus:border-accent">
                  {AVAILABLE_COLORS.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                </select>
                <button onClick={saveRole} className="text-[11px] font-bold bg-accent text-primary px-3 py-1.5 rounded-lg">Save</button>
                <button onClick={() => setEditingRole(null)} className="text-[11px] text-gray-400 px-2 py-1.5 rounded-lg hover:text-gray-600">Cancel</button>
              </div>
            );
            return (
              <div key={r.id} className="flex items-center gap-3 px-3 py-2.5 border border-gray-100 rounded-xl hover:bg-gray-50 group">
                <span className={`inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-full ${c.bg} ${c.text}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${c.dot}`} />{r.name}
                </span>
                <span className="text-xs text-gray-400 capitalize ml-1">{r.color}</span>
                <div className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                  <button onClick={() => setEditingRole({ id: r.id, name: r.name, color: r.color })}
                    className="p-1.5 text-gray-300 hover:text-primary rounded-lg transition-colors">
                    <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M8,1a1,1,0,0,1,1.5,1.5L3.5,8.5l-2,.5.5-2Z"/></svg>
                  </button>
                  <button onClick={() => deleteRole(r.id)}
                    className="p-1.5 text-gray-300 hover:text-red-500 rounded-lg transition-colors">
                    <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="1" y1="1" x2="11" y2="11"/><line x1="11" y1="1" x2="1" y2="11"/></svg>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
        {addingRole ? (
          <div className="flex items-center gap-2 mt-2">
            <input value={newRole.name} onChange={e => setNewRole(r => ({ ...r, name: e.target.value }))}
              placeholder="Role name" autoFocus
              className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-sm text-primary focus:outline-none focus:border-accent" />
            <select value={newRole.color} onChange={e => setNewRole(r => ({ ...r, color: e.target.value }))}
              className="border border-gray-200 rounded-xl px-3 py-2 text-sm text-primary focus:outline-none focus:border-accent">
              {AVAILABLE_COLORS.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
            </select>
            <button onClick={addRole} className="text-[11px] font-bold bg-accent text-primary px-3 py-2 rounded-xl">Add</button>
            <button onClick={() => setAddingRole(false)} className="text-[11px] text-gray-400 px-2 py-2 rounded-xl hover:text-gray-600">Cancel</button>
          </div>
        ) : (
          <button onClick={() => setAddingRole(true)}
            className="flex items-center gap-1.5 text-xs font-semibold text-accent hover:text-accent/80 transition-colors mt-1">
            <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="6" y1="1" x2="6" y2="11"/><line x1="1" y1="6" x2="11" y2="6"/></svg>
            Add Role
          </button>
        )}
      </Section>

      {/* Employment Types */}
      <Section title="Employment Types">
        <div className="flex flex-wrap gap-2">
          {(settings.employment_types ?? []).map(t => (
            <span key={t} className="flex items-center gap-1.5 bg-gray-100 text-gray-600 text-xs font-semibold px-3 py-1.5 rounded-full">
              {t}
              <button onClick={() => removeEmpType(t)} className="text-gray-400 hover:text-red-500 transition-colors">
                <svg width="10" height="10" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="1" y1="1" x2="9" y2="9"/><line x1="9" y1="1" x2="1" y2="9"/></svg>
              </button>
            </span>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <input value={newEmpType} onChange={e => setNewEmpType(e.target.value)}
            onKeyDown={e => e.key === "Enter" && addEmpType()}
            placeholder="e.g. seasonal" className="border border-gray-200 rounded-xl px-3 py-2 text-sm text-primary focus:outline-none focus:border-accent w-48" />
          <button onClick={addEmpType} className="text-xs font-bold text-accent hover:text-accent/80 transition-colors">Add</button>
        </div>
      </Section>

      {/* Health Plans */}
      <Section title="Health Plans">
        <div className="space-y-2">
          {(settings.health_plans ?? []).map(p => (
            <div key={p.value} className="flex items-center gap-3 px-3 py-2 border border-gray-100 rounded-xl">
              <span className="text-sm font-semibold text-primary">{p.label}</span>
              <span className="text-xs text-gray-400">{p.value}</span>
              <button onClick={() => removeHealthPlan(p.value)} className="ml-auto text-gray-300 hover:text-red-500 transition-colors p-1">
                <svg width="10" height="10" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="1" y1="1" x2="9" y2="9"/><line x1="9" y1="1" x2="1" y2="9"/></svg>
              </button>
            </div>
          ))}
        </div>
        <div className="flex items-center gap-2 mt-1">
          <input value={newHealthPlan.label} onChange={e => setNewHealthPlan(p => ({ ...p, label: e.target.value }))}
            placeholder="Label (e.g. Basic Plan)" className="border border-gray-200 rounded-xl px-3 py-2 text-sm text-primary focus:outline-none focus:border-accent flex-1" />
          <input value={newHealthPlan.value} onChange={e => setNewHealthPlan(p => ({ ...p, value: e.target.value }))}
            placeholder="Key (e.g. basic)" className="border border-gray-200 rounded-xl px-3 py-2 text-sm text-primary focus:outline-none focus:border-accent w-36" />
          <button onClick={addHealthPlan} className="text-xs font-bold text-accent hover:text-accent/80 transition-colors">Add</button>
        </div>
      </Section>

      <SaveBar dirty={dirty} saving={saving} onSave={save} onDiscard={discard} />
    </div>
  );
}
