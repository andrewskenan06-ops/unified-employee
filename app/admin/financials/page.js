"use client";
import { useState, useEffect, useMemo } from "react";

function fmt$(n) {
  return Number(n).toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
}
function fmtPct(n) {
  return `${Number(n).toFixed(1)}%`;
}
function sum(arr) {
  return arr.reduce((s, e) => s + Number(e.amount), 0);
}

const SECTION_META = {
  revenue:            { label: "Revenue",             color: "emerald" },
  cogs:               { label: "Cost of Goods Sold",  color: "orange"  },
  operating_expenses: { label: "Operating Expenses",  color: "red"     },
  assets:             { label: "Assets",              color: "blue"    },
  liabilities:        { label: "Liabilities",         color: "purple"  },
};

const COLOR_MAP = {
  emerald: { bg: "bg-emerald-50", text: "text-emerald-700", bar: "bg-emerald-400", badge: "bg-emerald-100 text-emerald-700", border: "border-emerald-200" },
  orange:  { bg: "bg-orange-50",  text: "text-orange-700",  bar: "bg-orange-400",  badge: "bg-orange-100 text-orange-700",  border: "border-orange-200"  },
  red:     { bg: "bg-red-50",     text: "text-red-700",     bar: "bg-red-400",     badge: "bg-red-100 text-red-500",        border: "border-red-200"     },
  blue:    { bg: "bg-blue-50",    text: "text-blue-700",    bar: "bg-blue-400",    badge: "bg-blue-100 text-blue-700",      border: "border-blue-200"    },
  purple:  { bg: "bg-violet-50",  text: "text-violet-700",  bar: "bg-violet-400",  badge: "bg-violet-100 text-violet-700",  border: "border-violet-200"  },
};

function StatCard({ label, value, sub, color = "blue", accent = false, onClick, active = false }) {
  const c = COLOR_MAP[color];
  return (
    <button onClick={onClick} className={`text-left bg-white rounded-2xl border shadow-sm p-5 space-y-2 w-full transition-all hover:shadow-md hover:-translate-y-0.5 ${
      active ? `border-2 ${c.border} ring-2 ring-offset-1 ${c.border.replace("border-","ring-")}` : accent ? `border-l-4 ${c.border}` : "border-gray-100"
    }`}>
      <div className="flex items-center justify-between">
        <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">{label}</p>
        <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={`${c.text} opacity-40`}>
          <line x1="1" y1="6" x2="11" y2="6"/><polyline points="7,2 11,6 7,10"/>
        </svg>
      </div>
      <p className={`text-2xl font-black tabular-nums ${accent ? c.text : "text-primary"}`}>{value}</p>
      {sub && <p className="text-xs text-gray-400">{sub}</p>}
    </button>
  );
}

function LineItemRow({ entry, onEdit, onDelete }) {
  const [editing, setEditing] = useState(false);
  const [form, setForm]       = useState({ label: entry.label, amount: entry.amount, notes: entry.notes ?? "" });
  const [saving, setSaving]   = useState(false);

  async function save() {
    setSaving(true);
    await fetch(`/api/financials/${entry.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ label: form.label, amount: parseFloat(form.amount), notes: form.notes }),
    });
    onEdit(entry.id, { ...entry, label: form.label, amount: parseFloat(form.amount), notes: form.notes });
    setEditing(false);
    setSaving(false);
  }

  if (editing) return (
    <div className="flex items-center gap-2 px-4 py-2.5 bg-gray-50 border-b border-gray-100">
      <input value={form.label} onChange={e => setForm(f => ({ ...f, label: e.target.value }))}
        className="flex-1 border border-gray-200 rounded-lg px-2.5 py-1.5 text-sm text-primary focus:outline-none focus:border-accent" />
      <input type="number" value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))}
        className="w-32 border border-gray-200 rounded-lg px-2.5 py-1.5 text-sm text-primary focus:outline-none focus:border-accent tabular-nums" />
      <button onClick={save} disabled={saving}
        className="text-[11px] font-bold bg-accent hover:bg-accent/90 text-primary px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50">
        {saving ? "…" : "Save"}
      </button>
      <button onClick={() => setEditing(false)} className="text-[11px] text-gray-400 hover:text-gray-600 px-2 py-1.5 rounded-lg">Cancel</button>
    </div>
  );

  return (
    <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-50 hover:bg-gray-50/50 group transition-colors">
      <p className="flex-1 text-sm text-gray-700">{entry.label}</p>
      {entry.notes && <p className="text-xs text-gray-400 italic hidden group-hover:block">{entry.notes}</p>}
      <p className="text-sm font-bold text-primary tabular-nums">{fmt$(entry.amount)}</p>
      <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
        <button onClick={() => setEditing(true)} className="p-1 text-gray-300 hover:text-primary rounded transition-colors">
          <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M8,1a1,1,0,0,1,1.5,1.5L3.5,8.5l-2,.5.5-2Z"/></svg>
        </button>
        <button onClick={() => onDelete(entry.id)} className="p-1 text-gray-300 hover:text-red-500 rounded transition-colors">
          <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="1" y1="1" x2="11" y2="11"/><line x1="11" y1="1" x2="1" y2="11"/></svg>
        </button>
      </div>
    </div>
  );
}

function Section({ title, entries, color, total, maxAmount, onEdit, onDelete, onAdd }) {
  const c = COLOR_MAP[color];
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <div className={`px-5 py-4 border-b border-gray-100 flex items-center justify-between ${c.bg}`}>
        <div>
          <p className={`text-xs font-bold uppercase tracking-widest ${c.text}`}>{title}</p>
          <p className="text-xl font-black text-primary tabular-nums mt-0.5">{fmt$(total)}</p>
        </div>
        <button onClick={onAdd}
          className={`flex items-center gap-1.5 text-[11px] font-bold px-3 py-1.5 rounded-xl border ${c.badge} ${c.border} hover:opacity-80 transition-opacity`}>
          <svg width="10" height="10" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="5" y1="1" x2="5" y2="9"/><line x1="1" y1="5" x2="9" y2="5"/></svg>
          Add Line
        </button>
      </div>
      <div>
        {entries.map(e => (
          <div key={e.id}>
            <LineItemRow entry={e} onEdit={onEdit} onDelete={onDelete} />
            <div className="px-4 pb-1">
              <div className="h-1 rounded-full bg-gray-100 overflow-hidden">
                <div className={`h-full rounded-full ${c.bar}`} style={{ width: `${Math.min(100, (Number(e.amount) / maxAmount) * 100)}%` }} />
              </div>
            </div>
          </div>
        ))}
        {entries.length === 0 && (
          <p className="px-5 py-6 text-sm text-gray-300 text-center italic">No entries — add one above.</p>
        )}
      </div>
    </div>
  );
}

export default function FinancialsDeepDivePage() {
  const [entries,  setEntries]  = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [view,     setView]     = useState("pnl"); // pnl | balance
  const [focused,  setFocused]  = useState(null);  // which stat card is drilled into
  const [adding,   setAdding]   = useState(null);  // section key
  const [addForm,  setAddForm]  = useState({ label: "", amount: "", notes: "" });
  const [saving,   setSaving]   = useState(false);

  useEffect(() => {
    fetch("/api/financials")
      .then(r => r.json())
      .then(d => { setEntries(Array.isArray(d) ? d : []); setLoading(false); });
  }, []);

  const bySection = useMemo(() => {
    const map = {};
    for (const e of entries) {
      if (!map[e.section]) map[e.section] = [];
      map[e.section].push(e);
    }
    return map;
  }, [entries]);

  const revenue    = sum(bySection.revenue            ?? []);
  const cogs       = sum(bySection.cogs               ?? []);
  const opex       = sum(bySection.operating_expenses ?? []);
  const grossProfit  = revenue - cogs;
  const ebit         = grossProfit - opex;
  const taxRate      = 0.21;
  const tax          = Math.max(0, ebit * taxRate);
  const netIncome    = ebit - tax;
  const grossMargin  = revenue > 0 ? (grossProfit / revenue) * 100 : 0;
  const netMargin    = revenue > 0 ? (netIncome   / revenue) * 100 : 0;

  const totalAssets      = sum(bySection.assets      ?? []);
  const totalLiabilities = sum(bySection.liabilities ?? []);
  const equity           = totalAssets - totalLiabilities;

  const maxPnL      = Math.max(...Object.values(bySection).flat().filter(e => ["revenue","cogs","operating_expenses"].includes(e.section)).map(e => Number(e.amount)), 1);
  const maxBalance  = Math.max(...Object.values(bySection).flat().filter(e => ["assets","liabilities"].includes(e.section)).map(e => Number(e.amount)), 1);

  function handleEdit(id, updated) {
    setEntries(es => es.map(e => e.id === id ? updated : e));
  }
  async function handleDelete(id) {
    setEntries(es => es.filter(e => e.id !== id));
    await fetch(`/api/financials/${id}`, { method: "DELETE" });
  }
  async function handleAdd() {
    if (!addForm.label.trim() || !addForm.amount) return;
    setSaving(true);
    const month = new Date().toISOString().slice(0, 7) + "-01";
    const res = await fetch("/api/financials", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ section: adding, label: addForm.label, amount: parseFloat(addForm.amount), notes: addForm.notes, month }),
    });
    const data = await res.json();
    if (data.id) setEntries(es => [...es, data]);
    setAdding(null);
    setAddForm({ label: "", amount: "", notes: "" });
    setSaving(false);
  }

  const incomeStatement = (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-100">
        <p className="text-sm font-bold text-primary">Income Statement</p>
      </div>
      <div className="divide-y divide-gray-50">
        {[
          { label: "Revenue",            value: revenue,     color: "text-emerald-600", bold: false },
          { label: "Cost of Goods Sold", value: -cogs,       color: "text-red-500",     bold: false },
          { label: "Gross Profit",       value: grossProfit, color: "text-primary",     bold: true,  border: true },
          { label: "Operating Expenses", value: -opex,       color: "text-red-500",     bold: false },
          { label: "EBIT",               value: ebit,        color: "text-primary",     bold: true,  border: true },
          { label: `Income Tax (${Math.round(taxRate*100)}%)`, value: -tax, color: "text-red-500", bold: false },
          { label: "Net Income",         value: netIncome,   color: netIncome >= 0 ? "text-emerald-600" : "text-red-500", bold: true, border: true, large: true },
        ].map(row => (
          <div key={row.label} className={`flex items-center justify-between px-6 py-3 ${row.border ? "bg-gray-50/50" : ""}`}>
            <p className={`text-sm ${row.bold ? "font-bold text-primary" : "text-gray-500"} ${row.large ? "text-base" : ""}`}>{row.label}</p>
            <p className={`tabular-nums text-sm ${row.bold ? "font-black" : "font-semibold"} ${row.color} ${row.large ? "text-lg" : ""}`}>
              {row.value < 0 ? `(${fmt$(Math.abs(row.value))})` : fmt$(row.value)}
            </p>
          </div>
        ))}
      </div>
    </div>
  );

  function SectionBlock({ sec, maxAmt }) {
    return (
      <Section
        title={SECTION_META[sec].label}
        color={SECTION_META[sec].color}
        entries={bySection[sec] ?? []}
        total={sum(bySection[sec] ?? [])}
        maxAmount={maxAmt}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onAdd={() => { setAdding(sec); setAddForm({ label: "", amount: "", notes: "" }); }}
      />
    );
  }

  if (loading) return <div className="flex items-center justify-center h-full"><div className="w-8 h-8 rounded-full border-4 border-accent/30 border-t-accent animate-spin" /></div>;

  return (
    <div className="flex flex-col h-full overflow-hidden">

      {/* Header */}
      <div className="bg-white border-b border-gray-100 px-8 py-4 flex items-center gap-4 flex-shrink-0">
        <div className="flex items-center gap-3">
          {focused && (
            <button onClick={() => setFocused(null)}
              className="flex items-center gap-1.5 text-xs font-semibold text-gray-400 hover:text-primary transition-colors">
              <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="9,2 3,7 9,12"/>
              </svg>
              Back
            </button>
          )}
          <div>
            <h1 className="text-lg font-bold text-primary">
              {focused
                ? { revenue: "Revenue", gross_profit: "Gross Profit", operating_expenses: "Operating Expenses", ebit: "EBIT", net_income: "Net Income", assets: "Assets", liabilities: "Liabilities", equity: "Equity" }[focused]
                : "Financial Deep Dive"}
            </h1>
            <p className="text-xs text-gray-400">{focused ? "Click Back to return to overview" : "Click any tile to drill in"}</p>
          </div>
        </div>
        {!focused && (
          <div className="flex items-center gap-1 bg-gray-100 rounded-xl p-1 ml-auto">
            <button onClick={() => { setView("pnl"); setFocused(null); }}
              className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-colors ${view === "pnl" ? "bg-white text-primary shadow-sm" : "text-gray-400 hover:text-gray-600"}`}>
              P&L Statement
            </button>
            <button onClick={() => { setView("balance"); setFocused(null); }}
              className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-colors ${view === "balance" ? "bg-white text-primary shadow-sm" : "text-gray-400 hover:text-gray-600"}`}>
              Balance Sheet
            </button>
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto bg-gray-50 p-6 space-y-6">

        {/* ── Focused views ── */}
        {focused === "revenue" && <SectionBlock sec="revenue" maxAmt={maxPnL} />}

        {focused === "gross_profit" && <>
          <div className="grid grid-cols-3 gap-4">
            <StatCard label="Revenue"     value={fmt$(revenue)}    color="emerald" accent />
            <StatCard label="COGS"        value={fmt$(-cogs)}      color="orange"  accent />
            <StatCard label="Gross Profit" value={fmt$(grossProfit)} sub={`Margin ${fmtPct(grossMargin)}`} color="blue" accent />
          </div>
          <SectionBlock sec="revenue" maxAmt={maxPnL} />
          <SectionBlock sec="cogs"    maxAmt={maxPnL} />
        </>}

        {focused === "operating_expenses" && <SectionBlock sec="operating_expenses" maxAmt={maxPnL} />}

        {focused === "ebit" && <>
          <div className="grid grid-cols-3 gap-4">
            <StatCard label="Gross Profit"     value={fmt$(grossProfit)} color="blue"   accent />
            <StatCard label="Operating Exp."   value={fmt$(opex)}        color="red"    accent />
            <StatCard label="EBIT"             value={fmt$(ebit)}        color="orange" accent />
          </div>
          {incomeStatement}
          <SectionBlock sec="operating_expenses" maxAmt={maxPnL} />
        </>}

        {focused === "net_income" && <>
          <div className="grid grid-cols-2 gap-4">
            <StatCard label="EBIT"       value={fmt$(ebit)}      color="orange"  accent />
            <StatCard label="Net Income" value={fmt$(netIncome)} sub={`After ${Math.round(taxRate*100)}% tax · Margin ${fmtPct(netMargin)}`} color="emerald" accent />
          </div>
          {incomeStatement}
        </>}

        {focused === "assets"      && <SectionBlock sec="assets"      maxAmt={maxBalance} />}
        {focused === "liabilities" && <SectionBlock sec="liabilities" maxAmt={maxBalance} />}

        {focused === "equity" && <>
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Equity Breakdown</p>
            <div className="flex items-center gap-4">
              <div className="flex-1 bg-blue-50 rounded-xl p-4 text-center">
                <p className="text-xs font-semibold text-blue-600 uppercase tracking-wide">Assets</p>
                <p className="text-2xl font-black text-primary tabular-nums mt-1">{fmt$(totalAssets)}</p>
              </div>
              <p className="text-2xl font-black text-gray-300">−</p>
              <div className="flex-1 bg-violet-50 rounded-xl p-4 text-center">
                <p className="text-xs font-semibold text-violet-600 uppercase tracking-wide">Liabilities</p>
                <p className="text-2xl font-black text-primary tabular-nums mt-1">{fmt$(totalLiabilities)}</p>
              </div>
              <p className="text-2xl font-black text-gray-300">=</p>
              <div className="flex-1 bg-emerald-50 rounded-xl p-4 text-center">
                <p className="text-xs font-semibold text-emerald-600 uppercase tracking-wide">Equity</p>
                <p className="text-2xl font-black text-emerald-600 tabular-nums mt-1">{fmt$(equity)}</p>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-6">
            <SectionBlock sec="assets"      maxAmt={maxBalance} />
            <SectionBlock sec="liabilities" maxAmt={maxBalance} />
          </div>
        </>}

        {/* ── Overview (no focus) ── */}
        {!focused && view === "pnl" && <>
          <div className="grid grid-cols-5 gap-4">
            <StatCard label="Total Revenue"  value={fmt$(revenue)}     color="emerald" accent active={focused==="revenue"}            onClick={() => setFocused("revenue")} />
            <StatCard label="Gross Profit"   value={fmt$(grossProfit)} color="blue"    accent active={focused==="gross_profit"}        onClick={() => setFocused("gross_profit")}   sub={`Margin ${fmtPct(grossMargin)}`} />
            <StatCard label="Operating Exp." value={fmt$(opex)}        color="red"     accent active={focused==="operating_expenses"}  onClick={() => setFocused("operating_expenses")} />
            <StatCard label="EBIT"           value={fmt$(ebit)}        color="orange"  accent active={focused==="ebit"}               onClick={() => setFocused("ebit")}     sub="Earnings before tax" />
            <StatCard label="Net Income"     value={fmt$(netIncome)}   color="emerald" accent active={focused==="net_income"}          onClick={() => setFocused("net_income")} sub={`Margin ${fmtPct(netMargin)}`} />
          </div>
          {incomeStatement}
          <div className="grid grid-cols-1 gap-6">
            {["revenue", "cogs", "operating_expenses"].map(sec => (
              <SectionBlock key={sec} sec={sec} maxAmt={maxPnL} />
            ))}
          </div>
        </>}

        {!focused && view === "balance" && <>
          <div className="grid grid-cols-3 gap-4">
            <StatCard label="Total Assets"      value={fmt$(totalAssets)}      color="blue"   accent active={focused==="assets"}      onClick={() => setFocused("assets")} />
            <StatCard label="Total Liabilities" value={fmt$(totalLiabilities)} color="purple" accent active={focused==="liabilities"} onClick={() => setFocused("liabilities")} />
            <StatCard label="Equity"            value={fmt$(equity)}           color="emerald" accent active={focused==="equity"}     onClick={() => setFocused("equity")} sub="Assets − Liabilities" />
          </div>
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Balance Sheet Summary</p>
            <div className="flex items-center gap-4">
              <div className="flex-1 bg-blue-50 rounded-xl p-4 text-center">
                <p className="text-xs font-semibold text-blue-600 uppercase tracking-wide">Assets</p>
                <p className="text-2xl font-black text-primary tabular-nums mt-1">{fmt$(totalAssets)}</p>
              </div>
              <p className="text-2xl font-black text-gray-300">=</p>
              <div className="flex-1 bg-violet-50 rounded-xl p-4 text-center">
                <p className="text-xs font-semibold text-violet-600 uppercase tracking-wide">Liabilities</p>
                <p className="text-2xl font-black text-primary tabular-nums mt-1">{fmt$(totalLiabilities)}</p>
              </div>
              <p className="text-2xl font-black text-gray-300">+</p>
              <div className="flex-1 bg-emerald-50 rounded-xl p-4 text-center">
                <p className="text-xs font-semibold text-emerald-600 uppercase tracking-wide">Equity</p>
                <p className="text-2xl font-black text-emerald-600 tabular-nums mt-1">{fmt$(equity)}</p>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-6">
            <SectionBlock sec="assets"      maxAmt={maxBalance} />
            <SectionBlock sec="liabilities" maxAmt={maxBalance} />
          </div>
        </>}
      </div>

      {/* Add line item modal */}
      {adding && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => setAdding(null)}>
          <div className="absolute inset-0 bg-primary/40 backdrop-blur-sm" />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <div>
                <p className="text-sm font-bold text-primary">Add Line Item</p>
                <p className="text-[10px] text-gray-400 uppercase tracking-widest font-semibold mt-0.5">{SECTION_META[adding]?.label}</p>
              </div>
              <button onClick={() => setAdding(null)} className="text-gray-400 hover:text-gray-600 p-1.5 rounded-lg hover:bg-gray-100 transition-colors">
                <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="1" y1="1" x2="14" y2="14"/><line x1="14" y1="1" x2="1" y2="14"/></svg>
              </button>
            </div>
            <div className="px-6 py-5 space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block">Label</label>
                <input value={addForm.label} onChange={e => setAddForm(f => ({ ...f, label: e.target.value }))}
                  placeholder="e.g. Service Revenue" autoFocus
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm text-primary focus:outline-none focus:border-accent transition-colors" />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block">Amount ($)</label>
                <input type="number" value={addForm.amount} onChange={e => setAddForm(f => ({ ...f, amount: e.target.value }))}
                  placeholder="e.g. 25000"
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm text-primary focus:outline-none focus:border-accent transition-colors" />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block">Notes (optional)</label>
                <input value={addForm.notes} onChange={e => setAddForm(f => ({ ...f, notes: e.target.value }))}
                  placeholder="Any context…"
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm text-primary focus:outline-none focus:border-accent transition-colors" />
              </div>
            </div>
            <div className="px-6 py-4 border-t border-gray-100 bg-gray-50/50 flex gap-3">
              <button onClick={handleAdd} disabled={saving}
                className="bg-accent hover:bg-accent/90 text-primary font-bold px-6 py-2.5 rounded-xl text-sm transition-colors disabled:opacity-50 shadow-sm">
                {saving ? "Adding…" : "Add"}
              </button>
              <button onClick={() => setAdding(null)}
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
