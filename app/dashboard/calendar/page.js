"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

const YEAR = 2026;

const MONTH_NAMES = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December",
];
const DAY_NAMES = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];

const DAY_HOURS = {
  0: "Closed",
  1: "6:30–4:30",
  2: "6:30–4:30",
  3: "6:30–4:30",
  4: "6:30–4:30",
  5: "6:30–4:30",
  6: "8–11 AM",
};

function buildCalendar(year, month) {
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  return cells;
}

function toDateKey(year, month, day) {
  return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function loadSchedule() {
  try { return JSON.parse(localStorage.getItem("ue_schedule") || "{}"); }
  catch { return {}; }
}

const today         = new Date();
const todayMidnight = new Date(today.getFullYear(), today.getMonth(), today.getDate());

export default function CalendarPage() {
  const router = useRouter();
  const [month, setMonth]           = useState(today.getMonth());
  const [schedule, setSchedule]     = useState({});

  useEffect(() => {
    setSchedule(loadSchedule());
  }, []);

  const cells = buildCalendar(YEAR, month);

  function handleSatClick(dateKey) {
    router.push(`/dashboard/schedule/${dateKey}`);
  }

  return (
    <div className="h-full flex flex-col px-6 py-5 gap-4">

      {/* Header + nav */}
      <div className="flex items-center justify-between flex-shrink-0">
        <div>
          <h1 className="text-xl font-bold text-primary">Company Calendar</h1>
          <p className="text-xs text-gray-400 mt-0.5">{YEAR}</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setMonth((m) => Math.max(0, m - 1))}
            disabled={month === 0}
            className="p-2 rounded-lg text-gray-400 hover:bg-white hover:text-primary disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="11,4 5,8 11,12"/>
            </svg>
          </button>
          <span className="text-base font-bold text-primary w-36 text-center">
            {MONTH_NAMES[month]} {YEAR}
          </span>
          <button
            onClick={() => setMonth((m) => Math.min(11, m + 1))}
            disabled={month === 11}
            className="p-2 rounded-lg text-gray-400 hover:bg-white hover:text-primary disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="5,4 11,8 5,12"/>
            </svg>
          </button>
        </div>
      </div>

      {/* Calendar */}
      <div className="flex-1 bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden flex flex-col">

        {/* Day headers */}
        <div className="grid grid-cols-7 border-b border-gray-100 flex-shrink-0">
          {DAY_NAMES.map((d, i) => (
            <div key={d} className={`py-3 text-center text-xs font-semibold uppercase tracking-wider ${
              i === today.getDay() ? "text-accent" : d === "Sun" ? "text-red-400" : d === "Sat" ? "text-accent/60" : "text-gray-400"
            }`}>
              {d}
            </div>
          ))}
        </div>

        {/* Days grid */}
        <div className="flex-1 grid grid-cols-7" style={{ gridAutoRows: "1fr" }}>
          {cells.map((day, i) => {
            if (!day) {
              return <div key={`empty-${i}`} className={`border-b border-gray-50 ${(i % 7) !== 6 ? "border-r" : ""}`} />;
            }

            const dow        = new Date(YEAR, month, day).getDay();
            const isSun      = dow === 0;
            const isSat      = dow === 6;
            const isLastCol  = (i % 7) === 6;
            const isToday    = today.getFullYear() === YEAR && today.getMonth() === month && today.getDate() === day;
            const dateKey    = toDateKey(YEAR, month, day);
            const workers    = schedule[dateKey] || [];
            const count      = workers.length;
            const hours      = DAY_HOURS[dow];
            const satDate    = new Date(YEAR, month, day);
            const isPast     = satDate < todayMidnight;
            const isFull     = count >= 3;

            if (isSat) {
              if (isPast) {
                // Past Saturday — grayed out, no button
                return (
                  <div key={day} className="border-b border-gray-50 bg-gray-50/80 flex flex-col p-1.5 gap-1 opacity-50">
                    <div className="flex items-start justify-between">
                      <span className="w-7 h-7 flex items-center justify-center rounded-full text-sm font-bold text-gray-400">
                        {day}
                      </span>
                      <span className="text-[9px] font-semibold text-gray-300 uppercase tracking-wide pt-1">{hours}</span>
                    </div>
                    <div className="flex-1 overflow-hidden">
                      {count > 0 && (
                        <div className="space-y-0.5 px-1">
                          {workers.slice(0, 3).map((w) => (
                            <p key={w.id} className="text-[10px] font-medium text-gray-400 truncate leading-tight">
                              {w.name.split(" ")[0]}
                            </p>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="text-center text-[10px] font-semibold text-gray-300 px-1.5 py-1 rounded-md border border-gray-200">
                      Past
                    </div>
                  </div>
                );
              }

              // Future/current Saturday
              const canClick = true;

              return (
                <div key={day} className="border-b border-gray-50 bg-accent/5 flex flex-col p-1.5 gap-1">
                  <div className="flex items-start justify-between">
                    <span className={`w-7 h-7 flex items-center justify-center rounded-full text-sm font-bold ${
                      isToday ? "bg-accent text-primary" : "text-primary"
                    }`}>
                      {day}
                    </span>
                    <span className="text-[9px] font-semibold text-accent uppercase tracking-wide pt-1">{hours}</span>
                  </div>
                  <div className="flex-1 overflow-hidden">
                    {count === 0 ? (
                      <p className="text-[9px] text-gray-300 italic px-1">No one yet</p>
                    ) : (
                      <div className="space-y-0.5 px-1">
                        {workers.slice(0, 3).map((w) => (
                          <p key={w.id} className="text-[10px] font-medium text-primary truncate leading-tight">
                            {w.name.split(" ")[0]}
                          </p>
                        ))}
                        {count > 3 && <p className="text-[9px] text-red-500 font-semibold">+{count - 3} more</p>}
                      </div>
                    )}
                  </div>

                  {canClick ? (
                    <button
                      onClick={() => handleSatClick(dateKey)}
                      className={`text-center text-[10px] font-semibold px-1.5 py-1 rounded-md transition-colors ${
                        isFull
                          ? "bg-red-500 hover:bg-red-600 text-white"
                          : "bg-accent hover:bg-accent/90 text-primary"
                      }`}
                    >
                      {count > 0 ? `${count} Scheduled` : "Workers Scheduled"}
                    </button>
                  ) : (
                    <div className="text-center text-[10px] font-semibold bg-red-500 text-white px-1.5 py-1 rounded-md cursor-not-allowed">
                      {count} Scheduled — Full
                    </div>
                  )}
                </div>
              );
            }

            return (
              <div
                key={day}
                className={`border-b border-gray-50 flex flex-col p-1.5
                  ${!isLastCol ? "border-r" : ""}
                  ${isSun ? "bg-red-50/50" : isPast ? "opacity-40" : "hover:bg-primary/5"}
                `}
              >
                <div className="flex items-start justify-between">
                  <span className={`w-7 h-7 flex items-center justify-center rounded-full text-sm font-bold ${
                    isToday ? "bg-accent text-primary" :
                    isSun   ? "text-red-500" : "text-gray-800"
                  }`}>
                    {day}
                  </span>
                  <span className={`text-[9px] font-semibold uppercase tracking-wide pt-1 ${
                    isSun ? "text-red-400" : "text-gray-300"
                  }`}>
                    {hours}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
