"use client";
import { useState, useEffect } from "react";

const INPUT = "w-full border border-gray-200 rounded-xl px-3 py-2 text-sm text-primary focus:outline-none focus:border-accent transition-colors";

const EMPTY_FORM = {
  uuid: "",
  label: "",
  location: "",
  role: "clock_terminal",
};

function Field({ label, children }) {
  return (
    <div className="space-y-1.5">
      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block">{label}</label>
      {children}
    </div>
  );
}

function StatusBadge({ active }) {
  return (
    <span className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full ${active ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-400"}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${active ? "bg-green-500" : "bg-gray-300"}`} />
      {active ? "Active" : "Inactive"}
    </span>
  );
}

function fmtDate(iso) {
  if (!iso) return "Never";
  const d = new Date(iso);
  return d.toLocaleDateString() + " " + d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function truncateUuid(uuid) {
  if (!uuid) return "—";
  return uuid.length > 13 ? uuid.slice(0, 8) + "…" + uuid.slice(-4) : uuid;
}

export default function WorkforceDevicesPage() {
  const [devices, setDevices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/workforce/clock-terminal?view=list")
      .then(r => r.ok ? r.json() : [])
      .then(d => { setDevices(Array.isArray(d) ? d : (d?.devices ?? [])); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  async function toggleActive(device) {
    const res = await fetch("/api/workforce/clock-terminal", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "toggle_active", device_id: device.id }),
    });
    if (res.ok) {
      setDevices(prev => prev.map(d => d.id === device.id ? { ...d, is_active: !d.is_active, active: !d.active } : d));
    }
  }

  async function handleRegister() {
    if (!form.uuid.trim() || !form.label.trim()) {
      setError("UUID and label are required.");
      return;
    }
    setSaving(true);
    const res = await fetch("/api/devices/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    if (res.ok) {
      const d = await res.json();
      setDevices(prev => [...prev, d.device ?? { id: Date.now(), ...form, is_active: true, last_seen_at: null }]);
      setAdding(false);
      setForm(EMPTY_FORM);
      setError("");
    } else {
      const d = await res.json().catch(() => ({}));
      setError(d.error ?? "Failed to register device.");
    }
    setSaving(false);
  }

  function generateUuid() {
    const s4 = () => Math.floor((1 + Math.random()) * 0x10000).toString(16).slice(1);
    return `${s4()}${s4()}-${s4()}-${s4()}-${s4()}-${s4()}${s4()}${s4()}`;
  }

  if (loading) return <div className="p-10 text-center text-gray-400 text-sm">Loading…</div>;

  return (
    <div className="px-8 py-8 max-w-6xl mx-auto space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-primary">Clock Terminal Devices</h1>
          <p className="text-sm text-gray-400 mt-1">{devices.length} registered devices</p>
        </div>
        <button
          onClick={() => { setAdding(true); setError(""); setForm({ ...EMPTY_FORM, uuid: generateUuid() }); }}
          className="flex items-center gap-2 bg-accent hover:bg-accent/90 text-primary font-bold px-5 py-2.5 rounded-xl text-sm transition-colors shadow-sm">
          <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="7" y1="1" x2="7" y2="13"/><line x1="1" y1="7" x2="13" y2="7"/>
          </svg>
          Register Device
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-100">
              <th className="px-5 py-3.5 text-left text-[10px] font-bold text-gray-400 uppercase tracking-widest">Label</th>
              <th className="px-5 py-3.5 text-left text-[10px] font-bold text-gray-400 uppercase tracking-widest">Location</th>
              <th className="px-5 py-3.5 text-left text-[10px] font-bold text-gray-400 uppercase tracking-widest">Role</th>
              <th className="px-5 py-3.5 text-left text-[10px] font-bold text-gray-400 uppercase tracking-widest">Status</th>
              <th className="px-5 py-3.5 text-left text-[10px] font-bold text-gray-400 uppercase tracking-widest">Last Seen</th>
              <th className="px-5 py-3.5 text-left text-[10px] font-bold text-gray-400 uppercase tracking-widest">UUID</th>
              <th className="px-5 py-3.5 text-left text-[10px] font-bold text-gray-400 uppercase tracking-widest">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {devices.length === 0 ? (
              <tr><td colSpan={7} className="px-5 py-10 text-center text-gray-400 text-sm">No devices registered.</td></tr>
            ) : devices.map(device => {
              const isActive = device.is_active ?? device.active ?? false;
              return (
                <tr key={device.id} className="hover:bg-gray-50">
                  <td className="px-5 py-3.5 text-sm font-semibold text-primary">{device.label ?? "—"}</td>
                  <td className="px-5 py-3.5 text-sm text-gray-500">{device.location ?? "—"}</td>
                  <td className="px-5 py-3.5 text-sm text-gray-500 capitalize">{(device.role ?? "—").replace(/_/g, " ")}</td>
                  <td className="px-5 py-3.5"><StatusBadge active={isActive} /></td>
                  <td className="px-5 py-3.5 text-sm text-gray-400">{fmtDate(device.last_seen_at ?? device.last_seen)}</td>
                  <td className="px-5 py-3.5">
                    <span className="text-xs font-mono text-gray-400 bg-gray-50 border border-gray-100 px-2 py-1 rounded-lg">
                      {truncateUuid(device.uuid ?? device.device_uuid)}
                    </span>
                  </td>
                  <td className="px-5 py-3.5">
                    <button
                      onClick={() => toggleActive(device)}
                      className={`text-xs font-semibold px-3 py-1.5 rounded-lg border transition-colors ${
                        isActive
                          ? "text-gray-400 hover:text-red-500 border-gray-200 hover:border-red-200 hover:bg-red-50"
                          : "text-accent border-accent/30 hover:bg-accent/10"
                      }`}>
                      {isActive ? "Deactivate" : "Activate"}
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Register Device modal */}
      {adding && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => { setAdding(false); setForm(EMPTY_FORM); setError(""); }}>
          <div className="absolute inset-0 bg-primary/40 backdrop-blur-sm" />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] flex flex-col overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between flex-shrink-0">
              <p className="text-sm font-bold text-primary">Register Device</p>
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
              <Field label="UUID">
                <div className="flex gap-2">
                  <input value={form.uuid} onChange={e => set("uuid", e.target.value)} placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx" className={INPUT} />
                  <button
                    onClick={() => set("uuid", generateUuid())}
                    className="flex-shrink-0 text-xs font-bold bg-gray-100 hover:bg-gray-200 text-gray-600 px-3 py-2 rounded-xl transition-colors">
                    Generate
                  </button>
                </div>
              </Field>
              <Field label="Label">
                <input value={form.label} onChange={e => set("label", e.target.value)} placeholder="Front Desk Terminal" className={INPUT} />
              </Field>
              <Field label="Location">
                <input value={form.location} onChange={e => set("location", e.target.value)} placeholder="Main Office" className={INPUT} />
              </Field>
              <Field label="Role">
                <select value={form.role} onChange={e => set("role", e.target.value)} className={INPUT}>
                  <option value="clock_terminal">Clock Terminal</option>
                  <option value="kiosk">Kiosk</option>
                  <option value="tablet">Tablet</option>
                </select>
              </Field>
            </div>
            <div className="px-6 py-4 border-t border-gray-100 flex gap-3 flex-shrink-0 bg-gray-50/50">
              <button onClick={handleRegister} disabled={saving}
                className="bg-accent hover:bg-accent/90 text-primary font-bold px-6 py-2.5 rounded-xl text-sm transition-colors disabled:opacity-50 shadow-sm">
                {saving ? "Registering…" : "Register Device"}
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
