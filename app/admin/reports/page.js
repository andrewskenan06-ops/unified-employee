"use client";
import { useState, useEffect } from "react";

function fmt$(n)   { return Number(n).toLocaleString("en-US", { style:"currency", currency:"USD", maximumFractionDigits:0 }); }
function fmtPct(n) { return `${Number(n).toFixed(1)}%`; }
function fmtNum(n) { return Number(n).toLocaleString("en-US"); }

function display(value, format) {
  if (value == null) return null;
  if (format === "$")   return fmt$(value);
  if (format === "%")   return fmtPct(value);
  if (format === "num") return fmtNum(value);
  return String(value);
}

// ── Metric tile ───────────────────────────────────────────────────
function Tile({ label, value, format, change, changeLabel, live, sub, accent, onEdit }) {
  const val = display(value, format);
  const pos = change > 0, neg = change < 0;

  return (
    <div className={`bg-white rounded-2xl border shadow-sm p-5 flex flex-col gap-3 relative overflow-hidden transition-shadow hover:shadow-md group ${accent ? "border-accent/30" : "border-gray-100"}`}>
      <div className="flex items-start justify-between gap-2">
        <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest leading-tight">{label}</p>
        <div className="flex items-center gap-1.5 flex-shrink-0">
          {live
            ? <span className="flex items-center gap-1 text-[9px] font-bold text-accent bg-accent/10 px-1.5 py-0.5 rounded-full">
                <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />Live
              </span>
            : <>
                <button onClick={onEdit}
                  className="opacity-0 group-hover:opacity-100 transition-opacity text-gray-300 hover:text-primary p-0.5 rounded">
                  <svg width="11" height="11" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M8,1a1,1,0,0,1,1.5,1.5L3.5,8.5l-2,.5.5-2Z"/>
                  </svg>
                </button>
                <span className="text-[9px] font-bold text-gray-300 bg-gray-50 border border-gray-100 px-1.5 py-0.5 rounded-full select-none">API</span>
              </>
          }
        </div>
      </div>

      <div>
        {val != null
          ? <p className={`text-2xl font-black tabular-nums ${accent ? "text-accent" : "text-primary"}`}>{val}</p>
          : <p className="text-2xl font-black text-gray-200">—</p>
        }
        {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
      </div>

      {change != null && (
        <div className={`inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full w-fit ${pos ? "bg-emerald-50 text-emerald-600" : neg ? "bg-red-50 text-red-500" : "bg-gray-50 text-gray-400"}`}>
          {pos ? "↑" : neg ? "↓" : "→"} {Math.abs(change)}% {changeLabel ?? "vs last period"}
        </div>
      )}
    </div>
  );
}

// ── Tabs config ───────────────────────────────────────────────────
const TABS = [
  {
    id: "workforce",
    label: "Workforce",
    icon: <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="5" cy="5" r="3"/><path d="M1 13s0-3 4-3"/><circle cx="11" cy="5" r="3"/><path d="M9 13s0-3 4-3"/></svg>,
  },
  {
    id: "payroll",
    label: "Payroll",
    icon: <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="4" width="12" height="9" rx="1"/><path d="M9 4V3a1 1 0 0 0-1-1H6a1 1 0 0 0-1 1v1"/></svg>,
  },
  {
    id: "financials",
    label: "Financials",
    icon: <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="13" x2="3" y2="8"/><line x1="7" y1="13" x2="7" y2="4"/><line x1="11" y1="13" x2="11" y2="9"/><line x1="1" y1="13" x2="13" y2="13"/></svg>,
  },
  {
    id: "accounting",
    label: "Accounting",
    icon: <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 2H2a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1V3a1 1 0 0 0-1-1h-2"/><rect x="4" y="1" width="6" height="3" rx="1"/><line x1="4" y1="7" x2="10" y2="7"/><line x1="4" y1="10" x2="8" y2="10"/></svg>,
  },
  {
    id: "marketing",
    label: "Marketing",
    icon: <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>,
  },
];

// ── Main page ─────────────────────────────────────────────────────
export default function AdminReportsPage() {
  const [tab,       setTab]       = useState("workforce");
  const [metrics,   setMetrics]   = useState({});   // { [category]: row[] }
  const [liveData,  setLiveData]  = useState(null);
  const [employees, setEmployees] = useState(null);
  const [editing,   setEditing]   = useState(null); // { key, label, value, change_pct, change_label }
  const [editForm,  setEditForm]  = useState({});
  const [saving,    setSaving]    = useState(false);

  useEffect(() => {
    // Fetch all DB metrics
    fetch("/api/reports")
      .then(r => r.json())
      .then(rows => {
        const grouped = {};
        for (const row of rows) {
          if (!grouped[row.category]) grouped[row.category] = {};
          grouped[row.category][row.metric_key] = row;
        }
        setMetrics(grouped);
      });

    // Fetch live data
    Promise.all([
      fetch("/api/admin/overview").then(r => r.json()),
      fetch("/api/employees").then(r => r.json()),
      fetch("/api/pay").then(r => r.json()),
    ]).then(([ov, emps, pay]) => {
      setLiveData({ overview: ov, pay });
      setEmployees(emps);
    }).catch(() => {});
  }, []);

  // ── Live derived workforce/payroll numbers ──
  const totalEmps     = employees?.length ?? null;
  const activeEmps    = employees?.filter(e => e.status !== "inactive").length ?? null;
  const inactiveEmps  = employees != null ? totalEmps - activeEmps : null;
  const clockedIn     = liveData?.overview?.clockedInNow ?? null;
  const flaggedWeek   = liveData?.overview?.flaggedThisWeek ?? null;
  const otHours       = liveData?.overview?.totalOtHours ?? null;
  const hourlyWorkers = liveData?.pay?.filter(e => e.pay_type === "hourly") ?? [];
  const avgRate       = hourlyWorkers.length ? hourlyWorkers.reduce((s, e) => s + Number(e.pay_rate), 0) / hourlyWorkers.length : null;
  const weeklyPayroll = liveData?.pay?.reduce((sum, e) => {
    if (e.pay_type === "hourly") return sum + Number(e.pay_rate) * 40;
    if (e.pay_type === "salary") return sum + Number(e.pay_rate) / 52;
    return sum;
  }, 0) ?? null;
  const annualPayroll = weeklyPayroll != null ? weeklyPayroll * 52 : null;
  const otCost        = avgRate != null && otHours != null ? avgRate * 1.5 * otHours : null;

  function openEdit(key) {
    const row = Object.values(metrics).flatMap(cat => Object.values(cat)).find(r => r.metric_key === key) ?? {};
    setEditing({ key, label: row.metric_label ?? key });
    setEditForm({ value: row.value ?? "", change_pct: row.change_pct ?? "", change_label: row.change_label ?? "" });
  }

  async function saveEdit() {
    setSaving(true);
    await fetch("/api/reports", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        key: editing.key,
        value:        editForm.value      !== "" ? parseFloat(editForm.value)      : null,
        change_pct:   editForm.change_pct !== "" ? parseFloat(editForm.change_pct) : null,
        change_label: editForm.change_label || null,
      }),
    });
    // Refresh metrics
    const rows = await fetch("/api/reports").then(r => r.json());
    const grouped = {};
    for (const row of rows) {
      if (!grouped[row.category]) grouped[row.category] = {};
      grouped[row.category][row.metric_key] = row;
    }
    setMetrics(grouped);
    setEditing(null);
    setSaving(false);
  }

  // Helper: get a stored metric value
  function m(category, key) {
    return metrics[category]?.[key] ?? {};
  }

  // ── Tab content ───────────────────────────────────────────────
  function renderContent() {
    switch (tab) {

      case "workforce": return (
        <div className="grid grid-cols-4 gap-4">
          <Tile label="Total Employees"    value={totalEmps}    format="num" live sub="all roles"                    accent />
          <Tile label="Active Employees"   value={activeEmps}   format="num" live sub="currently employable"         />
          <Tile label="Inactive Employees" value={inactiveEmps} format="num" live sub="on leave or seasonal"         />
          <Tile label="Clocked In Now"     value={clockedIn}    format="num" live sub="on the clock right now"       accent />
          <Tile label="Flagged Punches"    value={flaggedWeek}  format="num" live sub="this week, outside geofence"  />
          <Tile label="OT Hours This Week" value={otHours}      format="num" live sub="hours over 60"                />
          <Tile label="Avg Hourly Rate"    value={avgRate}      format="$"   live sub="across hourly workers"        />
          <Tile label="OT Cost This Week"  value={otCost}       format="$"   live sub="at 1.5× rate"                 />
        </div>
      );

      case "payroll": return (
        <div className="grid grid-cols-4 gap-4">
          <Tile label="Est. Weekly Payroll"  value={weeklyPayroll}  format="$" live sub="regular hours, no OT"         accent />
          <Tile label="Est. Annual Payroll"  value={annualPayroll}  format="$" live sub="projected at current rates"    />
          {[
            { key:"last_payroll_run",        accent:true  },
            { key:"ytd_payroll"                           },
            { key:"payroll_tax_liability"                 },
            { key:"benefits_cost_month"                   },
            { key:"retirement_contributions"              },
            { key:"child_support_withheld"                },
          ].map(({ key, accent }) => {
            const row = m("payroll", key);
            return <Tile key={key} label={row.metric_label ?? key} value={row.value} format={row.format ?? "$"}
              change={row.change_pct} changeLabel={row.change_label} sub={row.sub_label} accent={accent} onEdit={() => openEdit(key)} />;
          })}
        </div>
      );

      case "financials": return (
        <div className="grid grid-cols-4 gap-4">
          {[
            { key:"total_revenue",       accent:true  },
            { key:"monthly_revenue"                   },
            { key:"revenue_growth"                    },
            { key:"net_profit",          accent:true  },
            { key:"gross_revenue"                     },
            { key:"operating_expenses"                },
            { key:"profit_margin"                     },
            { key:"cash_flow"                         },
          ].map(({ key, accent }) => {
            const row = m("financials", key);
            return <Tile key={key} label={row.metric_label ?? key} value={row.value} format={row.format ?? "$"}
              change={row.change_pct} changeLabel={row.change_label} sub={row.sub_label} accent={accent} onEdit={() => openEdit(key)} />;
          })}
        </div>
      );

      case "accounting": return (
        <div className="grid grid-cols-4 gap-4">
          {[
            { key:"accounts_receivable",  accent:true  },
            { key:"accounts_payable"                   },
            { key:"total_assets"                       },
            { key:"total_liabilities"                  },
            { key:"gross_margin"                       },
            { key:"operating_margin"                   },
            { key:"ebitda",               accent:true  },
            { key:"tax_liability_ytd"                  },
          ].map(({ key, accent }) => {
            const row = m("accounting", key);
            return <Tile key={key} label={row.metric_label ?? key} value={row.value} format={row.format ?? "$"}
              change={row.change_pct} changeLabel={row.change_label} sub={row.sub_label} accent={accent} onEdit={() => openEdit(key)} />;
          })}
        </div>
      );

      case "marketing": return (
        <div className="grid grid-cols-4 gap-4">
          {[
            { key:"total_leads",           accent:true  },
            { key:"new_leads_month"                     },
            { key:"conversion_rate"                     },
            { key:"active_customers",      accent:true  },
            { key:"customer_acq_cost"                   },
            { key:"avg_revenue_customer"                },
            { key:"return_customer_rate"                },
            { key:"website_visitors"                    },
          ].map(({ key, accent }) => {
            const row = m("marketing", key);
            return <Tile key={key} label={row.metric_label ?? key} value={row.value} format={row.format ?? "num"}
              change={row.change_pct} changeLabel={row.change_label} sub={row.sub_label} accent={accent} onEdit={() => openEdit(key)} />;
          })}
        </div>
      );

      default: return null;
    }
  }

  const activeTab = TABS.find(t => t.id === tab);

  return (
    <div className="flex h-full overflow-hidden">

      {/* ── Sidebar tabs ── */}
      <div className="w-52 flex-shrink-0 bg-white border-r border-gray-100 flex flex-col overflow-hidden">
        <div className="px-5 py-5 border-b border-gray-50">
          <h1 className="text-sm font-bold text-primary">Reports</h1>
          <p className="text-xs text-gray-400 mt-0.5">Business intelligence</p>
        </div>

        <nav className="flex-1 px-2 py-3 space-y-0.5">
          {TABS.map(t => {
            const active = tab === t.id;
            return (
              <button key={t.id} onClick={() => setTab(t.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors text-left ${
                  active ? "bg-primary text-white" : "text-gray-500 hover:bg-gray-50 hover:text-primary"
                }`}>
                <span className={`flex-shrink-0 ${active ? "text-accent" : "text-gray-400"}`}>{t.icon}</span>
                {t.label}
                {active && <span className="ml-auto w-1.5 h-1.5 rounded-full bg-accent flex-shrink-0" />}
              </button>
            );
          })}
        </nav>

        <div className="px-4 py-4 border-t border-gray-50">
          <p className="text-[10px] text-gray-300 font-semibold leading-relaxed">
            Hover any <span className="text-gray-400 font-bold">API</span> tile to see its endpoint. POST to <span className="font-mono">/api/reports</span> to push values.
          </p>
        </div>
      </div>

      {/* ── Content ── */}
      <div className="flex-1 overflow-y-auto bg-gray-50">
        <div className="px-8 py-8 space-y-6 max-w-5xl">

          {/* Section header */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center text-accent flex-shrink-0">
              {activeTab?.icon}
            </div>
            <div>
              <h2 className="text-xl font-bold text-primary">{activeTab?.label}</h2>
              <p className="text-xs text-gray-400 mt-0.5">
                {tab === "workforce"  && "Live data from your employee database"}
                {tab === "payroll"    && "Live estimates + connect your payroll API"}
                {tab === "financials" && "Connect your accounting or ERP system"}
                {tab === "accounting" && "Connect QuickBooks, Xero, or your own API"}
                {tab === "marketing"  && "Connect HubSpot, Google Analytics, or your CRM"}
              </p>
            </div>
            <div className="ml-auto flex items-center gap-2">
              <span className="flex items-center gap-1.5 text-[10px] font-bold text-accent bg-accent/10 px-2.5 py-1 rounded-full">
                <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" /> Live
              </span>
              <span className="text-[10px] font-bold text-gray-300 bg-white border border-gray-100 px-2.5 py-1 rounded-full">
                API — hover to edit
              </span>
            </div>
          </div>

          {renderContent()}
        </div>
      </div>

      {/* Edit metric modal */}
      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => setEditing(null)}>
          <div className="absolute inset-0 bg-primary/40 backdrop-blur-sm" />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <div>
                <p className="text-sm font-bold text-primary">{editing.label}</p>
                <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-widest mt-0.5">Edit Metric</p>
              </div>
              <button onClick={() => setEditing(null)} className="text-gray-400 hover:text-gray-600 p-1.5 rounded-lg hover:bg-gray-100 transition-colors">
                <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="1" y1="1" x2="14" y2="14"/><line x1="14" y1="1" x2="1" y2="14"/></svg>
              </button>
            </div>
            <div className="px-6 py-5 space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block">Value</label>
                <input type="number" value={editForm.value} onChange={e => setEditForm(f => ({ ...f, value: e.target.value }))}
                  placeholder="e.g. 284500" autoFocus
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm text-primary focus:outline-none focus:border-accent transition-colors" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block">Change %</label>
                  <input type="number" step="0.1" value={editForm.change_pct} onChange={e => setEditForm(f => ({ ...f, change_pct: e.target.value }))}
                    placeholder="e.g. 12.4"
                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm text-primary focus:outline-none focus:border-accent transition-colors" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block">Change Label</label>
                  <input value={editForm.change_label} onChange={e => setEditForm(f => ({ ...f, change_label: e.target.value }))}
                    placeholder="vs last month"
                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm text-primary focus:outline-none focus:border-accent transition-colors" />
                </div>
              </div>
            </div>
            <div className="px-6 py-4 border-t border-gray-100 bg-gray-50/50 flex gap-3">
              <button onClick={saveEdit} disabled={saving}
                className="bg-accent hover:bg-accent/90 text-primary font-bold px-6 py-2.5 rounded-xl text-sm transition-colors disabled:opacity-50 shadow-sm">
                {saving ? "Saving…" : "Save"}
              </button>
              <button onClick={() => setEditing(null)}
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
