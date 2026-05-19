"use client";
import { useState, useEffect, useRef } from "react";
import { HexColorPicker } from "react-colorful";

const PRIMARY_PRESETS = [
  { label: "Navy",    value: "#023f62" },
  { label: "Slate",   value: "#1e293b" },
  { label: "Indigo",  value: "#3730a3" },
  { label: "Violet",  value: "#5b21b6" },
  { label: "Rose",    value: "#9f1239" },
  { label: "Stone",   value: "#44403c" },
  { label: "Forest",  value: "#14532d" },
  { label: "Black",   value: "#111111" },
];

const ACCENT_PRESETS = [
  { label: "Green",   value: "#00ce7c" },
  { label: "Sky",     value: "#0ea5e9" },
  { label: "Amber",   value: "#f59e0b" },
  { label: "Orange",  value: "#f97316" },
  { label: "Pink",    value: "#ec4899" },
  { label: "Violet",  value: "#8b5cf6" },
  { label: "Teal",    value: "#14b8a6" },
  { label: "Red",     value: "#ef4444" },
];

function hexToRgb(hex) {
  const h = hex.replace("#", "");
  return [parseInt(h.slice(0,2),16), parseInt(h.slice(2,4),16), parseInt(h.slice(4,6),16)];
}

function ColorField({ label, sublabel, value, onChange, presets }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return;
    function onDown(e) { if (ref.current && !ref.current.contains(e.target)) setOpen(false); }
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open]);

  return (
    <section className="bg-white border border-gray-200 rounded-xl p-5 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold text-gray-800 text-sm">{label}</h2>
        {sublabel && <span className="text-xs text-gray-400">{sublabel}</span>}
      </div>

      {/* Swatch + hex input + wheel toggle */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => setOpen(o => !o)}
          className="w-10 h-10 rounded-lg border-2 border-gray-200 flex-shrink-0 shadow-sm hover:scale-105 transition-transform"
          style={{ backgroundColor: value }}
          title="Open color wheel"
        />
        <input
          type="text"
          value={value}
          onChange={e => /^#[0-9a-fA-F]{0,6}$/.test(e.target.value) && onChange(e.target.value)}
          className="w-28 border border-gray-200 rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-accent/40"
        />
        <button
          onClick={() => setOpen(o => !o)}
          className="text-xs text-gray-400 hover:text-gray-700 underline underline-offset-2"
        >
          {open ? "Close" : "Color wheel"}
        </button>
      </div>

      {/* Color wheel (react-colorful) */}
      {open && (
        <div ref={ref} className="relative">
          <style>{`
            .react-colorful { width: 100% !important; height: 200px !important; border-radius: 10px; overflow: hidden; }
            .react-colorful__saturation { border-radius: 10px 10px 0 0; }
            .react-colorful__hue { height: 20px; border-radius: 0 0 10px 10px; margin-top: 4px; }
            .react-colorful__pointer { width: 20px; height: 20px; border-width: 3px; }
          `}</style>
          <HexColorPicker color={value} onChange={onChange} />
        </div>
      )}

      {/* Presets */}
      <div className="flex flex-wrap gap-2">
        {presets.map(p => (
          <button
            key={p.value}
            onClick={() => onChange(p.value)}
            title={p.label}
            className={`w-7 h-7 rounded-lg border-2 transition-all ${value === p.value ? "border-gray-800 scale-110" : "border-transparent hover:scale-105"}`}
            style={{ backgroundColor: p.value }}
          />
        ))}
      </div>
    </section>
  );
}

function PreviewSidebar({ companyName, logoUrl, primary, accent }) {
  const [r,g,b] = hexToRgb(accent);
  const accentSoft = `rgba(${r},${g},${b},0.2)`;
  return (
    <div className="rounded-xl overflow-hidden shadow-lg w-44 flex-shrink-0" style={{ backgroundColor: primary }}>
      {/* Header */}
      <div className="px-3 py-3 flex items-center gap-2 border-b border-white/10">
        <div className="w-6 h-6 rounded-md flex items-center justify-center overflow-hidden flex-shrink-0" style={{ backgroundColor: accent }}>
          {logoUrl
            ? <img src={logoUrl} alt="" className="w-full h-full object-cover" />
            : <span className="text-xs font-black" style={{ color: primary }}>{(companyName || "UE").slice(0,2).toUpperCase()}</span>
          }
        </div>
        <div>
          <p className="text-white text-[10px] font-semibold leading-none truncate">{companyName || "Unified Employee"}</p>
          <p className="text-[9px] font-bold uppercase tracking-wider mt-0.5" style={{ color: accent }}>Admin</p>
        </div>
      </div>
      {/* Nav groups */}
      {["Workforce Module","Work Module","General"].map(group => (
        <div key={group} className="px-2 pt-2">
          <p className="text-[8px] font-bold uppercase tracking-widest px-1 pb-1" style={{ color: "rgba(255,255,255,0.3)" }}>{group}</p>
          {[1,2,3].map(i => (
            <div key={i} className={`h-5 rounded mb-1 ${i === 1 ? "opacity-100" : "opacity-40"}`}
              style={{ backgroundColor: i === 1 ? accentSoft : "rgba(255,255,255,0.08)" }} />
          ))}
        </div>
      ))}
    </div>
  );
}

function PreviewKiosk({ companyName, logoUrl, primary, accent }) {
  const [r,g,b] = hexToRgb(accent);
  return (
    <div className="rounded-xl overflow-hidden shadow-lg w-36 flex-shrink-0 py-6 px-4 flex flex-col items-center gap-4" style={{ backgroundColor: primary }}>
      <div className="w-10 h-10 rounded-2xl flex items-center justify-center overflow-hidden shadow" style={{ backgroundColor: accent }}>
        {logoUrl
          ? <img src={logoUrl} alt="" className="w-full h-full object-cover" />
          : <span className="text-sm font-black" style={{ color: primary }}>{(companyName || "UE").slice(0,2).toUpperCase()}</span>
        }
      </div>
      <p className="text-white text-[10px] font-bold text-center">{companyName || "Unified Employee"}</p>
      <div className="flex gap-2">
        {[0,1,2,3].map(i => (
          <div key={i} className={`w-2.5 h-2.5 rounded-full border-2 ${i < 2 ? "border-transparent" : "border-white/30"}`}
            style={i < 2 ? { backgroundColor: accent, borderColor: accent } : {}} />
        ))}
      </div>
      <div className="grid grid-cols-3 gap-1.5 w-full">
        {[1,2,3,4,5,6,7,8,9,"",0,"⌫"].map((k, i) => (
          <div key={i} className="h-6 rounded-lg" style={{ backgroundColor: k === "" ? "transparent" : "rgba(255,255,255,0.12)" }} />
        ))}
      </div>
    </div>
  );
}

export default function BrandingPage() {
  const [form, setForm] = useState({
    company_name: "",
    logo_url: "",
    primary_color: "#023f62",
    accent_color: "#00ce7c",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving]   = useState(false);
  const [saved, setSaved]     = useState(false);

  useEffect(() => {
    fetch("/api/admin/branding")
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data) setForm({
          company_name:  data.company_name  || "",
          logo_url:      data.logo_url      || "",
          primary_color: data.primary_color || "#023f62",
          accent_color:  data.accent_color  || "#00ce7c",
        });
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  async function handleSave() {
    setSaving(true);
    setSaved(false);
    await fetch("/api/admin/branding", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        company_name:  form.company_name  || null,
        logo_url:      form.logo_url      || null,
        primary_color: form.primary_color || null,
        accent_color:  form.accent_color  || null,
      }),
    });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  }

  function set(key, val) { setForm(f => ({ ...f, [key]: val })); setSaved(false); }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 rounded-full border-2 border-accent/30 border-t-accent animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Branding</h1>
        <p className="text-gray-500 text-sm mt-1">Customize colors and logo across the admin panel, clock terminal, and employee portal.</p>
      </div>

      <div className="flex gap-8 items-start">
        {/* Form */}
        <div className="flex-1 space-y-6">

          {/* Company info */}
          <section className="bg-white border border-gray-200 rounded-xl p-5 space-y-4">
            <h2 className="font-semibold text-gray-800 text-sm">Company Info</h2>
            <div>
              <label className="text-xs font-medium text-gray-500 block mb-1">Company Name</label>
              <input
                type="text"
                value={form.company_name}
                onChange={e => set("company_name", e.target.value)}
                placeholder="Unified Employee"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent/40"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500 block mb-1">Logo URL</label>
              <input
                type="url"
                value={form.logo_url}
                onChange={e => set("logo_url", e.target.value)}
                placeholder="https://example.com/logo.png"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent/40"
              />
              {form.logo_url && (
                <div className="mt-2 flex items-center gap-2">
                  <img src={form.logo_url} alt="preview" className="w-8 h-8 rounded object-cover border border-gray-200" onError={e => e.target.style.display='none'} />
                  <span className="text-xs text-gray-400">Logo preview</span>
                </div>
              )}
            </div>
          </section>

          <ColorField
            label="Primary Color"
            sublabel="Sidebar, backgrounds"
            value={form.primary_color}
            onChange={v => set("primary_color", v)}
            presets={PRIMARY_PRESETS}
          />

          <ColorField
            label="Accent Color"
            sublabel="Buttons, highlights, active states"
            value={form.accent_color}
            onChange={v => set("accent_color", v)}
            presets={ACCENT_PRESETS}
          />

          {/* Save */}
          <div className="flex items-center gap-3">
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-6 py-2.5 rounded-lg text-sm font-semibold transition-colors disabled:opacity-60"
              style={{ backgroundColor: form.accent_color, color: form.primary_color }}
            >
              {saving ? "Saving…" : "Save Changes"}
            </button>
            {saved && <span className="text-sm text-green-600 font-medium">Saved! Reload to see changes.</span>}
          </div>
        </div>

        {/* Live Preview */}
        <div className="flex-shrink-0 space-y-4">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest text-center">Live Preview</p>
          <div className="flex flex-col items-center gap-6">
            <div className="space-y-1 text-center">
              <p className="text-[10px] text-gray-400">Admin Sidebar</p>
              <PreviewSidebar
                companyName={form.company_name}
                logoUrl={form.logo_url}
                primary={form.primary_color}
                accent={form.accent_color}
              />
            </div>
            <div className="space-y-1 text-center">
              <p className="text-[10px] text-gray-400">Clock Terminal</p>
              <PreviewKiosk
                companyName={form.company_name}
                logoUrl={form.logo_url}
                primary={form.primary_color}
                accent={form.accent_color}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
