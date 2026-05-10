"use client";
import { useState, useEffect, useMemo } from "react";

function fmtTime(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}
function fmtDate(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString([], { month: "short", day: "numeric", year: "numeric" });
}
function hoursWorked(inT, outT) {
  if (!inT || !outT) return null;
  return ((new Date(outT) - new Date(inT)) / 3600000).toFixed(2);
}
function todayRange() {
  const d = new Date(); d.setHours(0,0,0,0);
  const t = new Date(d); t.setDate(t.getDate() + 1);
  return { from: d.toISOString(), to: t.toISOString() };
}
function weekRange() {
  const d = new Date(); d.setHours(0,0,0,0);
  d.setDate(d.getDate() - d.getDay());
  const t = new Date(d); t.setDate(t.getDate() + 7);
  return { from: d.toISOString(), to: t.toISOString() };
}
function monthRange() {
  const d = new Date(); d.setDate(1); d.setHours(0,0,0,0);
  const t = new Date(d); t.setMonth(t.getMonth() + 1);
  return { from: d.toISOString(), to: t.toISOString() };
}

const PRESET_LABELS = ["Today", "This Week", "This Month", "All Time"];

export default function AdminTimePage() {
  const [records,  setRecords]  = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [search,   setSearch]   = useState("");
  const [preset,   setPreset]   = useState("This Week");
  const [filter,   setFilter]   = useState("all"); // all | active | flagged | approved | rejected
  const [clockingOut, setClockingOut] = useState(null);

  useEffect(() => {
    load();
  }, [preset]);

  async function load() {
    setLoading(true);
    let url = "/api/time-records";
    if (preset === "Today")      { const r = todayRange(); url += `?from=${r.from}&to=${r.to}`; }
    if (preset === "This Week")  { const r = weekRange();  url += `?from=${r.from}&to=${r.to}`; }
    if (preset === "This Month") { const r = monthRange(); url += `?from=${r.from}&to=${r.to}`; }
    const data = await fetch(url).then(r => r.json());
    setRecords(Array.isArray(data) ? data : []);
    setLoading(false);
  }

  async function setApproval(id, approved) {
    setRecords(rs => rs.map(r => r.id === id ? { ...r, approved } : r));
    await fetch(`/api/time-records/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ approved }),
    });
  }

  async function clockOut(record) {
    setClockingOut(record.id);
    const now = new Date().toISOString();
    await fetch(`/api/time-records/${record.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ clockOut: { time: now, lat: null, lng: null, distanceFt: null, flagged: false } }),
    });
    setRecords(rs => rs.map(r => r.id === record.id
      ? { ...r, clockOut: { time: now, lat: null, lng: null, distanceFt: null, flagged: false }, status: "complete" }
      : r
    ));
    setClockingOut(null);
  }

  const filtered = useMemo(() => {
    let rs = records;
    if (search.trim()) rs = rs.filter(r => r.employeeName?.toLowerCase().includes(search.toLowerCase()));
    if (filter === "active")   rs = rs.filter(r => r.status === "active");
    if (filter === "flagged")  rs = rs.filter(r => r.flagged && r.approved == null);
    if (filter === "approved") rs = rs.filter(r => r.approved === true);
    if (filter === "rejected") rs = rs.filter(r => r.approved === false);
    return rs;
  }, [records, search, filter]);

  const counts = useMemo(() => ({
    all:      records.length,
    active:   records.filter(r => r.status === "active").length,
    flagged:  records.filter(r => r.flagged && r.approved == null).length,
    approved: records.filter(r => r.approved === true).length,
    rejected: records.filter(r => r.approved === false).length,
  }), [records]);

  return (
    <div className="flex flex-col h-full overflow-hidden">

      {/* Top bar */}
      <div className="bg-white border-b border-gray-100 px-8 py-4 flex items-center gap-4 flex-shrink-0">
        <div>
          <h1 className="text-lg font-bold text-primary">Time Records</h1>
          <p className="text-xs text-gray-400">{filtered.length} records</p>
        </div>

        {/* Search */}
        <div className="relative ml-4">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="6" cy="6" r="5"/><line x1="10" y1="10" x2="14" y2="14"/>
          </svg>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search employee…"
            className="border border-gray-200 rounded-xl pl-8 pr-4 py-2 text-sm text-primary focus:outline-none focus:border-accent transition-colors w-52" />
        </div>

        {/* Date presets */}
        <div className="flex items-center gap-1 bg-gray-100 rounded-xl p-1 ml-auto">
          {PRESET_LABELS.map(p => (
            <button key={p} onClick={() => setPreset(p)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${preset === p ? "bg-white text-primary shadow-sm" : "text-gray-400 hover:text-gray-600"}`}>
              {p}
            </button>
          ))}
        </div>
      </div>

      {/* Filter tabs */}
      <div className="bg-white border-b border-gray-100 px-8 flex items-center gap-1">
        {[
          { key: "all",      label: "All",           count: counts.all      },
          { key: "active",   label: "Clocked In",    count: counts.active   },
          { key: "flagged",  label: "Pending Review", count: counts.flagged  },
          { key: "approved", label: "Approved",      count: counts.approved },
          { key: "rejected", label: "Rejected",      count: counts.rejected },
        ].map(t => (
          <button key={t.key} onClick={() => setFilter(t.key)}
            className={`flex items-center gap-1.5 px-4 py-3 text-xs font-semibold border-b-2 transition-colors ${
              filter === t.key ? "border-accent text-primary" : "border-transparent text-gray-400 hover:text-gray-600"
            }`}>
            {t.label}
            {t.count > 0 && (
              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                t.key === "flagged"  ? "bg-red-50 text-red-500" :
                t.key === "active"  ? "bg-accent/10 text-accent" :
                t.key === "approved" ? "bg-emerald-50 text-emerald-600" :
                t.key === "rejected" ? "bg-red-50 text-red-400" :
                "bg-gray-100 text-gray-500"
              }`}>{t.count}</span>
            )}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="flex-1 overflow-auto bg-gray-50">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="w-8 h-8 rounded-full border-4 border-accent/30 border-t-accent animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-2 text-gray-300">
            <svg width="32" height="32" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="16" cy="16" r="14"/><polyline points="16,8 16,16 20,18"/>
            </svg>
            <p className="text-sm font-semibold">No records found</p>
          </div>
        ) : (
          <div className="p-6">
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              {/* Table header */}
              <div className="grid grid-cols-[2fr_1.2fr_1.2fr_0.8fr_0.8fr_1.4fr] gap-4 px-5 py-3 border-b border-gray-100 bg-gray-50/80">
                {["Employee", "Clock In", "Clock Out", "Hours", "Distance", "Status"].map(h => (
                  <p key={h} className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{h}</p>
                ))}
              </div>

              {/* Rows */}
              <div className="divide-y divide-gray-50">
                {filtered.map(r => {
                  const hrs      = hoursWorked(r.clockIn?.time, r.clockOut?.time);
                  const isActive = r.status === "active";
                  const approved = r.approved === true;
                  const rejected = r.approved === false;
                  const pending  = r.flagged && r.approved == null;

                  return (
                    <div key={r.id} className={`grid grid-cols-[2fr_1.2fr_1.2fr_0.8fr_0.8fr_1.4fr] gap-4 px-5 py-3.5 items-center transition-colors hover:bg-gray-50/50 ${
                      approved ? "bg-emerald-50/20" : rejected ? "bg-red-50/20" : ""
                    }`}>

                      {/* Employee */}
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-7 h-7 rounded-lg bg-primary/10 text-primary flex items-center justify-center text-[10px] font-black flex-shrink-0">
                          {r.employeeName?.split(" ").map(w => w[0]).join("").toUpperCase().slice(0,2)}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-primary truncate">{r.employeeName}</p>
                          <p className="text-[10px] text-gray-400">{fmtDate(r.clockIn?.time)}</p>
                        </div>
                      </div>

                      {/* Clock in */}
                      <div>
                        <p className="text-sm font-semibold text-primary tabular-nums">{fmtTime(r.clockIn?.time)}</p>
                        {r.clockIn?.distanceFt > 0 && (
                          <p className="text-[10px] text-red-500 font-semibold">{r.clockIn.distanceFt}ft away</p>
                        )}
                      </div>

                      {/* Clock out */}
                      <div>
                        {isActive ? (
                          <button onClick={() => clockOut(r)} disabled={clockingOut === r.id}
                            className="text-[11px] font-bold text-amber-600 bg-amber-50 hover:bg-amber-100 border border-amber-200 px-2.5 py-1 rounded-lg transition-colors disabled:opacity-50">
                            {clockingOut === r.id ? "…" : "Clock Out"}
                          </button>
                        ) : (
                          <>
                            <p className="text-sm font-semibold text-primary tabular-nums">{fmtTime(r.clockOut?.time)}</p>
                            {r.clockOut?.distanceFt > 0 && (
                              <p className="text-[10px] text-red-500 font-semibold">{r.clockOut.distanceFt}ft away</p>
                            )}
                          </>
                        )}
                      </div>

                      {/* Hours */}
                      <p className={`text-sm font-bold tabular-nums ${isActive ? "text-accent" : "text-primary"}`}>
                        {isActive ? "Live" : hrs ? `${hrs}h` : "—"}
                      </p>

                      {/* Distance flag */}
                      <div>
                        {r.flagged
                          ? <span className="text-[10px] font-bold text-red-500 bg-red-50 px-1.5 py-0.5 rounded-full">Flagged</span>
                          : <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-full">Clear</span>
                        }
                      </div>

                      {/* Status / actions */}
                      <div className="flex items-center gap-1.5">
                        {isActive && (
                          <span className="flex items-center gap-1 text-[10px] font-bold text-accent bg-accent/10 px-2 py-1 rounded-full">
                            <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />Clocked In
                          </span>
                        )}
                        {!isActive && !r.flagged && (
                          <span className="text-[10px] font-bold text-gray-400 bg-gray-100 px-2 py-1 rounded-full">Complete</span>
                        )}
                        {pending && <>
                          <button onClick={() => setApproval(r.id, true)}
                            className="text-[10px] font-bold text-emerald-600 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 px-2 py-1 rounded-lg transition-colors">
                            Approve
                          </button>
                          <button onClick={() => setApproval(r.id, false)}
                            className="text-[10px] font-bold text-red-500 bg-red-50 hover:bg-red-100 border border-red-200 px-2 py-1 rounded-lg transition-colors">
                            Reject
                          </button>
                        </>}
                        {approved && <>
                          <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 border border-emerald-200 px-2 py-1 rounded-lg">Approved</span>
                          <button onClick={() => setApproval(r.id, null)} className="text-[10px] text-gray-300 hover:text-gray-500 transition-colors">undo</button>
                        </>}
                        {rejected && <>
                          <span className="text-[10px] font-bold text-red-400 bg-red-50 border border-red-200 px-2 py-1 rounded-lg">Rejected</span>
                          <button onClick={() => setApproval(r.id, null)} className="text-[10px] text-gray-300 hover:text-gray-500 transition-colors">undo</button>
                        </>}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
