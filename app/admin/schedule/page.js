"use client";
import { useState, useEffect, useRef } from "react";
import { getSession } from "@/lib/auth";

const MONTH_NAMES = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const DAY_NAMES   = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];

const WORK_DAYS = [1,2,3,4,5,6]; // Mon–Sat

const DAY_HOURS = { 1:"6:30–4:30", 2:"6:30–4:30", 3:"6:30–4:30", 4:"6:30–4:30", 5:"6:30–4:30", 6:"8–11 AM" };

const ROLE_COLORS = {
  "Yard Worker":   { bg:"bg-emerald-50", text:"text-emerald-600", dot:"bg-emerald-400" },
  "Office Worker": { bg:"bg-blue-50",    text:"text-blue-600",    dot:"bg-blue-400"    },
  "Truck Driver":  { bg:"bg-orange-50",  text:"text-orange-600",  dot:"bg-orange-400"  },
  "Dirt Manager":  { bg:"bg-amber-50",   text:"text-amber-700",   dot:"bg-amber-400"   },
};

function initials(name) {
  return name.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2);
}

function toDateKey(date) {
  return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,"0")}-${String(date.getDate()).padStart(2,"0")}`;
}

function getMondayOf(date) {
  const d   = new Date(date);
  const dow = d.getDay();
  d.setDate(d.getDate() - (dow === 0 ? 6 : dow - 1));
  d.setHours(0,0,0,0);
  return d;
}

function addDays(date, n) {
  const d = new Date(date);
  d.setDate(d.getDate() + n);
  return d;
}

function buildMiniCalendar(year, month) {
  const firstDay    = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  return cells;
}

const today = new Date();
today.setHours(0,0,0,0);

export default function AdminSchedulePage() {
  const [session,    setSession]    = useState(null);
  const [schedule,   setSchedule]   = useState({});
  const [employees,  setEmployees]  = useState([]);
  const [weekStart,  setWeekStart]  = useState(() => getMondayOf(today));
  const [adding,     setAdding]     = useState(null); // dateKey being added to
  const [miniMonth,  setMiniMonth]  = useState(today.getMonth());
  const [miniYear]                   = useState(today.getFullYear());
  const addRef = useRef(null);

  useEffect(() => {
    const s = getSession();
    setSession(s);
    Promise.all([
      fetch("/api/schedule").then(r => r.json()),
      fetch("/api/employees").then(r => r.json()),
    ]).then(([sched, emps]) => {
      setSchedule(sched);
      setEmployees(emps.filter(e => e.status !== "inactive"));
    }).catch(() => {});
  }, []);

  // Close add dropdown when clicking outside
  useEffect(() => {
    function onClickOutside(e) {
      if (addRef.current && !addRef.current.contains(e.target)) setAdding(null);
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  async function addWorker(dateKey, emp) {
    const res  = await fetch("/api/schedule", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ date: dateKey, employeeId: emp.id, addedBy: session?.id }),
    });
    const data = await res.json();
    if (data.slotId) {
      setSchedule(prev => ({
        ...prev,
        [dateKey]: [...(prev[dateKey] || []), { id: emp.id, name: emp.name, slotId: data.slotId, job_role: emp.job_role }],
      }));
    }
    setAdding(null);
  }

  async function removeWorker(dateKey, worker) {
    await fetch(`/api/schedule/${worker.slotId}`, { method: "DELETE" });
    setSchedule(prev => ({
      ...prev,
      [dateKey]: (prev[dateKey] || []).filter(w => w.slotId !== worker.slotId),
    }));
  }

  // Work days for this week (Mon–Sat)
  const weekDays = WORK_DAYS.map(offset => addDays(weekStart, offset - 1));

  // Format week label
  const weekLabel = (() => {
    const s = weekDays[0];
    const e = weekDays[5];
    if (s.getMonth() === e.getMonth())
      return `${MONTH_NAMES[s.getMonth()]} ${s.getDate()}–${e.getDate()}, ${s.getFullYear()}`;
    return `${MONTH_NAMES[s.getMonth()]} ${s.getDate()} – ${MONTH_NAMES[e.getMonth()]} ${e.getDate()}, ${e.getFullYear()}`;
  })();

  // Mini calendar
  const miniCells = buildMiniCalendar(miniYear, miniMonth);

  return (
    <div className="flex gap-5 h-full px-6 py-5 overflow-hidden">

      {/* ── Left: Schedule tile ── */}
      <div className="flex-1 flex flex-col overflow-hidden gap-4 min-w-0">

        {/* Week nav */}
        <div className="flex items-center justify-between flex-shrink-0">
          <div>
            <h1 className="text-xl font-bold text-primary">Schedule</h1>
            <p className="text-xs text-gray-400 mt-0.5">{weekLabel}</p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setWeekStart(w => addDays(w, -7))}
              className="p-2 rounded-lg text-gray-400 hover:bg-white hover:text-primary transition-colors">
              <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="10,3 4,8 10,13"/></svg>
            </button>
            <button onClick={() => setWeekStart(getMondayOf(today))}
              className="px-3 py-1.5 text-xs font-semibold text-gray-400 hover:text-primary border border-gray-200 hover:border-primary/30 rounded-lg transition-colors">
              Today
            </button>
            <button onClick={() => setWeekStart(w => addDays(w, 7))}
              className="p-2 rounded-lg text-gray-400 hover:bg-white hover:text-primary transition-colors">
              <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="5,3 11,8 5,13"/></svg>
            </button>
          </div>
        </div>

        {/* Week grid */}
        <div className="flex-1 bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex flex-col">

          {/* Day headers */}
          <div className="grid grid-cols-6 border-b border-gray-100 flex-shrink-0">
            {weekDays.map(date => {
              const isToday = toDateKey(date) === toDateKey(today);
              const dow     = date.getDay();
              const isSat   = dow === 6;
              return (
                <div key={toDateKey(date)} className={`py-2 px-2 border-r border-gray-50 last:border-r-0 ${isSat ? "bg-accent/5" : ""}`}>
                  <p className={`text-[9px] font-bold uppercase tracking-wider ${isSat ? "text-accent/70" : "text-gray-400"}`}>
                    {DAY_NAMES[dow]}
                  </p>
                  <p className={`text-sm font-black mt-0.5 ${isToday ? "text-accent" : "text-primary"}`}>{date.getDate()}</p>
                  <p className={`text-[8px] font-semibold mt-0.5 ${isSat ? "text-accent/60" : "text-gray-300"}`}>{DAY_HOURS[dow]}</p>
                </div>
              );
            })}
          </div>

          {/* Employee rows */}
          <div className="flex-1 grid grid-cols-6 overflow-y-auto">
            {weekDays.map(date => {
              const dateKey  = toDateKey(date);
              const workers  = schedule[dateKey] || [];
              const isPast   = date < today;
              const isToday  = dateKey === toDateKey(today);
              const isSat    = date.getDay() === 6;
              const available = employees.filter(e => !workers.some(w => w.id === e.id));
              const isAdding  = adding === dateKey;

              return (
                <div key={dateKey}
                  className={`border-r border-gray-50 last:border-r-0 flex flex-col p-1.5 gap-1 relative ${isSat ? "bg-accent/5" : ""} ${isPast && !isToday ? "opacity-50" : ""}`}>

                  {/* Worker chips */}
                  {workers.map(w => {
                    const rs = ROLE_COLORS[w.job_role] ?? { bg:"bg-gray-100", text:"text-gray-500", dot:"bg-gray-300" };
                    return (
                      <div key={w.slotId ?? w.id}
                        className={`group flex items-center gap-1 px-1.5 py-1 rounded-md ${rs.bg} relative`}>
                        <span className={`w-4 h-4 rounded flex items-center justify-center text-[8px] font-black flex-shrink-0 bg-white/60 ${rs.text}`}>
                          {initials(w.name)}
                        </span>
                        <span className={`text-[9px] font-semibold truncate flex-1 ${rs.text}`}>
                          {w.name.split(" ")[0]}
                        </span>
                        {!isPast && (
                          <button onClick={() => removeWorker(dateKey, w)}
                            className={`opacity-0 group-hover:opacity-100 transition-opacity text-[9px] font-bold ${rs.text} hover:text-red-500 flex-shrink-0`}>
                            ×
                          </button>
                        )}
                      </div>
                    );
                  })}

                  {/* Add button */}
                  {!isPast && available.length > 0 && (
                    <div ref={isAdding ? addRef : null} className="relative">
                      <button onClick={() => setAdding(isAdding ? null : dateKey)}
                        className="w-full text-[9px] font-semibold text-gray-300 hover:text-accent border border-dashed border-gray-200 hover:border-accent/40 rounded-md py-1 transition-colors">
                        + Add
                      </button>

                      {isAdding && (
                        <div className="absolute top-full left-0 z-20 mt-1 w-52 bg-white rounded-xl border border-gray-100 shadow-xl overflow-hidden">
                          <div className="px-3 py-2 border-b border-gray-50">
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">Add to {DAY_NAMES[date.getDay()]} {date.getDate()}</p>
                          </div>
                          <div className="max-h-52 overflow-y-auto divide-y divide-gray-50">
                            {available.map(emp => {
                              const rs = ROLE_COLORS[emp.job_role] ?? { bg:"bg-gray-50", text:"text-gray-500", dot:"bg-gray-300" };
                              return (
                                <button key={emp.id} onClick={() => addWorker(dateKey, emp)}
                                  className="w-full flex items-center gap-2.5 px-3 py-2.5 hover:bg-gray-50 transition-colors text-left">
                                  <div className="w-7 h-7 rounded-lg bg-primary/10 text-primary flex items-center justify-center text-[10px] font-black flex-shrink-0">
                                    {initials(emp.name)}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p className="text-xs font-semibold text-primary truncate">{emp.name}</p>
                                    <span className={`inline-flex items-center gap-1 text-[9px] font-semibold ${rs.text}`}>
                                      <span className={`w-1 h-1 rounded-full ${rs.dot}`} />{emp.job_role ?? "—"}
                                    </span>
                                  </div>
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {workers.length === 0 && (isPast || available.length === 0) && (
                    <p className="text-[9px] text-gray-200 italic text-center py-2">—</p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── Right: Mini calendar ── */}
      <div className="w-52 flex-shrink-0 flex flex-col gap-3">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">

          {/* Month nav */}
          <div className="px-3 py-2.5 border-b border-gray-50 flex items-center justify-between">
            <button onClick={() => setMiniMonth(m => Math.max(0, m - 1))} disabled={miniMonth === 0}
              className="p-1 rounded-md text-gray-300 hover:text-primary hover:bg-gray-50 disabled:opacity-20 transition-colors">
              <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="8,2 3,6 8,10"/></svg>
            </button>
            <span className="text-xs font-bold text-primary">{MONTH_NAMES[miniMonth].slice(0,3)} {miniYear}</span>
            <button onClick={() => setMiniMonth(m => Math.min(11, m + 1))} disabled={miniMonth === 11}
              className="p-1 rounded-md text-gray-300 hover:text-primary hover:bg-gray-50 disabled:opacity-20 transition-colors">
              <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="4,2 9,6 4,10"/></svg>
            </button>
          </div>

          {/* Day headers */}
          <div className="grid grid-cols-7 px-1 pt-1">
            {DAY_NAMES.map(d => (
              <div key={d} className="text-center text-[8px] font-bold text-gray-300 uppercase py-1">{d[0]}</div>
            ))}
          </div>

          {/* Days */}
          <div className="grid grid-cols-7 px-1 pb-2">
            {miniCells.map((day, i) => {
              if (!day) return <div key={`e-${i}`} />;
              const thisDate   = new Date(miniYear, miniMonth, day);
              thisDate.setHours(0,0,0,0);
              const dateKey    = toDateKey(thisDate);
              const isToday    = dateKey === toDateKey(today);
              const dow        = thisDate.getDay();
              const isSun      = dow === 0;
              const inWeek     = thisDate >= weekStart && thisDate < addDays(weekStart, 7);
              const hasWorkers = (schedule[dateKey] || []).length > 0;
              const isWorkDay  = dow !== 0;

              return (
                <button key={day}
                  onClick={() => { if (isWorkDay) setWeekStart(getMondayOf(thisDate)); }}
                  disabled={isSun}
                  className={`relative w-6 h-6 mx-auto flex items-center justify-center rounded-full text-[10px] font-semibold transition-colors
                    ${isToday ? "bg-accent text-primary font-black" :
                      inWeek && isWorkDay ? "bg-primary/10 text-primary" :
                      isSun ? "text-red-300 cursor-default" :
                      "text-gray-500 hover:bg-gray-100 cursor-pointer"}`}>
                  {day}
                  {hasWorkers && !isToday && (
                    <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-accent" />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Week summary */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-3 space-y-1.5">
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">This Week</p>
          {weekDays.map(date => {
            const dateKey = toDateKey(date);
            const count   = (schedule[dateKey] || []).length;
            const dow     = date.getDay();
            return (
              <div key={dateKey} className="flex items-center justify-between">
                <span className="text-[10px] text-gray-400 font-semibold">{DAY_NAMES[dow]} {date.getDate()}</span>
                {count > 0
                  ? <span className="text-[10px] font-bold text-accent">{count} worker{count !== 1 ? "s" : ""}</span>
                  : <span className="text-[10px] text-gray-200">—</span>
                }
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
}
