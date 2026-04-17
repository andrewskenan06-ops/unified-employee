"use client";
import { useState, useEffect } from "react";
import { getSession, getDefaultRoles } from "@/lib/auth";

const LS_KEY       = "ue_time_records";
const LS_ROLES_KEY = "ue_employee_roles";

function loadRecords() {
  try { return JSON.parse(localStorage.getItem(LS_KEY) || "[]"); }
  catch { return []; }
}

function loadRoles() {
  try { return JSON.parse(localStorage.getItem(LS_ROLES_KEY) || "{}"); }
  catch { return {}; }
}

function fmtTime(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function fmtDate(iso) {
  return new Date(iso).toLocaleDateString([], { month: "short", day: "numeric", year: "numeric" });
}

function calcDuration(inIso, outIso) {
  if (!outIso) return null;
  const mins = Math.round((new Date(outIso) - new Date(inIso)) / 60000);
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

function isSameDay(isoDate, refDate) {
  const d = new Date(isoDate);
  return d.getFullYear() === refDate.getFullYear() &&
    d.getMonth()    === refDate.getMonth() &&
    d.getDate()     === refDate.getDate();
}

export default function TimePage() {
  const [session, setSession] = useState(null);
  const [records, setRecords] = useState([]);
  const [jobRole, setJobRole] = useState(null);
  const [now, setNow]         = useState(new Date());

  useEffect(() => {
    const s = getSession();
    setSession(s);
    setRecords(loadRecords());
    if (s) {
      let roles = loadRoles();
      if (Object.keys(roles).length === 0) {
        roles = getDefaultRoles();
        localStorage.setItem(LS_ROLES_KEY, JSON.stringify(roles));
      }
      setJobRole(roles[s.id] || null);
    }
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  if (!session) return null;

  const isAdmin        = session.role === "admin";
  const visibleRecords = isAdmin ? records : records.filter((r) => r.employeeId === session.id);
  const flaggedCount   = records.filter((r) => r.flagged).length;
  const myRecords      = records.filter((r) => r.employeeId === session.id);

  const todayRecord     = myRecords.find((r) => isSameDay(r.date, now));
  const yesterday       = new Date(now); yesterday.setDate(now.getDate() - 1);
  const yesterdayRecord = myRecords.find((r) => r.status === "complete" && isSameDay(r.date, yesterday));
  const isClockedIn     = !!myRecords.find((r) => r.status === "active");

  return (
    <div className="px-8 py-8 max-w-5xl mx-auto space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-primary">Time Clock</h1>
          <p className="text-sm text-gray-400 mt-0.5">
            {isAdmin ? "Admin view — all employees" : `Signed in as ${session.name}`}
          </p>
        </div>
        {isAdmin && flaggedCount > 0 && (
          <div className="flex items-center gap-2 bg-red-50 border border-red-200 px-4 py-2 rounded-xl">
            <span className="w-2 h-2 rounded-full bg-red-500" />
            <span className="text-sm font-semibold text-red-700">
              {flaggedCount} flagged {flaggedCount === 1 ? "punch" : "punches"} for review
            </span>
          </div>
        )}
      </div>

      {/* Today + Yesterday card — employees only */}
      {!isAdmin && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex flex-col gap-5 max-w-sm">

          {/* Status pill */}
          <div className="flex items-center gap-2">
            <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-full ${
              isClockedIn ? "bg-accent/10 text-accent" : "bg-gray-100 text-gray-500"
            }`}>
              <span className={`w-1.5 h-1.5 rounded-full ${isClockedIn ? "bg-accent animate-pulse" : "bg-gray-400"}`} />
              {isClockedIn ? "Currently clocked in" : "Not clocked in"}
            </span>
            {jobRole && (
              <span className="text-[10px] font-semibold bg-primary/5 text-primary px-2.5 py-1 rounded-full border border-primary/10">
                {jobRole}
              </span>
            )}
          </div>

          {/* Yesterday */}
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-300 mb-2">
              {yesterday.toLocaleDateString([], { weekday: "long", month: "short", day: "numeric" })}
            </p>
            {yesterdayRecord ? (
              <div className="flex items-center gap-4">
                <div>
                  <p className="text-[10px] text-gray-400 uppercase tracking-wide">In</p>
                  <p className="text-lg font-bold text-primary tabular-nums">{fmtTime(yesterdayRecord.clockIn.time)}</p>
                </div>
                <div className="text-gray-200 text-xl">→</div>
                <div>
                  <p className="text-[10px] text-gray-400 uppercase tracking-wide">Out</p>
                  <p className="text-lg font-bold text-primary tabular-nums">{fmtTime(yesterdayRecord.clockOut?.time)}</p>
                </div>
                {calcDuration(yesterdayRecord.clockIn.time, yesterdayRecord.clockOut?.time) && (
                  <div className="ml-auto">
                    <span className="text-xs font-semibold bg-gray-100 text-gray-500 px-2 py-1 rounded-full">
                      {calcDuration(yesterdayRecord.clockIn.time, yesterdayRecord.clockOut?.time)}
                    </span>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-sm text-gray-300 italic">No record</p>
            )}
          </div>

          <div className="border-t border-gray-100" />

          {/* Today */}
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-widest text-accent mb-2">
              Today — {now.toLocaleDateString([], { weekday: "long", month: "short", day: "numeric" })}
            </p>
            {todayRecord ? (
              <div className="flex items-center gap-4">
                <div>
                  <p className="text-[10px] text-gray-400 uppercase tracking-wide">In</p>
                  <p className="text-lg font-bold text-primary tabular-nums">{fmtTime(todayRecord.clockIn.time)}</p>
                </div>
                <div className="text-gray-200 text-xl">→</div>
                <div>
                  <p className="text-[10px] text-gray-400 uppercase tracking-wide">Out</p>
                  {todayRecord.clockOut ? (
                    <p className="text-lg font-bold text-primary tabular-nums">{fmtTime(todayRecord.clockOut.time)}</p>
                  ) : (
                    <p className="text-lg font-bold text-accent tabular-nums animate-pulse">
                      {now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </p>
                  )}
                </div>
                {todayRecord.clockOut && calcDuration(todayRecord.clockIn.time, todayRecord.clockOut.time) && (
                  <div className="ml-auto">
                    <span className="text-xs font-semibold bg-accent/10 text-accent px-2 py-1 rounded-full">
                      {calcDuration(todayRecord.clockIn.time, todayRecord.clockOut.time)}
                    </span>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-sm text-gray-300 italic">Not clocked in yet</p>
            )}
          </div>
        </div>
      )}

      {/* Records table */}
      <div>
        <h2 className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-4">
          {isAdmin ? "All Punch Records" : "Your Punch History"}
        </h2>

        {visibleRecords.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center text-gray-400 text-sm">
            {isAdmin ? "No punch records yet." : "No records yet — clock in with your PIN to get started."}
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50 text-left text-xs font-semibold uppercase tracking-wider text-gray-400">
                  <th className="px-5 py-4">Date</th>
                  {isAdmin && <th className="px-5 py-4">Employee</th>}
                  <th className="px-5 py-4">Clock In</th>
                  <th className="px-5 py-4">Clock Out</th>
                  <th className="px-5 py-4">Duration</th>
                  <th className="px-5 py-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {visibleRecords.map((r) => (
                  <tr key={r.id} className={`transition-colors ${r.flagged ? "bg-red-50/50 hover:bg-red-50" : "hover:bg-gray-50"}`}>
                    <td className="px-5 py-4 text-gray-500 text-xs">{fmtDate(r.date)}</td>
                    {isAdmin && <td className="px-5 py-4 font-medium text-primary">{r.employeeName}</td>}
                    <td className="px-5 py-4 tabular-nums">
                      <span className={r.clockIn.flagged ? "text-red-600 font-semibold" : "text-gray-700"}>{fmtTime(r.clockIn.time)}</span>
                      {r.clockIn.flagged && <span className="ml-1.5 text-[10px] bg-red-100 text-red-600 px-1.5 py-0.5 rounded-full font-semibold">{r.clockIn.distanceFt}ft</span>}
                    </td>
                    <td className="px-5 py-4 tabular-nums">
                      {r.clockOut ? (
                        <>
                          <span className={r.clockOut.flagged ? "text-red-600 font-semibold" : "text-gray-700"}>{fmtTime(r.clockOut.time)}</span>
                          {r.clockOut.flagged && <span className="ml-1.5 text-[10px] bg-red-100 text-red-600 px-1.5 py-0.5 rounded-full font-semibold">{r.clockOut.distanceFt}ft</span>}
                        </>
                      ) : (
                        <span className="text-accent font-medium text-xs">Active</span>
                      )}
                    </td>
                    <td className="px-5 py-4 text-gray-500 text-xs tabular-nums">{calcDuration(r.clockIn.time, r.clockOut?.time) ?? "—"}</td>
                    <td className="px-5 py-4">
                      {r.flagged ? (
                        <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-red-700 bg-red-100 px-2.5 py-1 rounded-full">
                          <span className="w-1.5 h-1.5 rounded-full bg-red-500" />Flagged
                        </span>
                      ) : r.status === "active" ? (
                        <span className="inline-flex items-center gap-1.5 text-xs font-semibold bg-accent/10 text-accent px-2.5 py-1 rounded-full">
                          <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-500 bg-gray-100 px-2.5 py-1 rounded-full">
                          <span className="w-1.5 h-1.5 rounded-full bg-gray-400" />Complete
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
