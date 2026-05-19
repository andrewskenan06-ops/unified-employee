"use client";
import { useState, useEffect } from "react";
import Link from "next/link";

async function safeFetch(url) {
  try {
    const r = await fetch(url);
    if (!r.ok) return null;
    return r.json();
  } catch {
    return null;
  }
}

export default function WorkforceOverviewPage() {
  const [stats, setStats] = useState({ clockedIn: 0, pendingTimeOff: 0, disputedHours: 0, scheduledToday: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      safeFetch("/api/workforce/clock?view=active"),
      safeFetch("/api/workforce/time-off?view=pending"),
      safeFetch("/api/workforce/daily-approvals?view=disputed"),
      safeFetch("/api/workforce/shifts?view=today"),
    ]).then(([clock, timeOff, disputed, shifts]) => {
      setStats({
        clockedIn:      Array.isArray(clock)    ? clock.length    : (clock?.count    ?? 0),
        pendingTimeOff: Array.isArray(timeOff)  ? timeOff.length  : (timeOff?.count  ?? 0),
        disputedHours:  Array.isArray(disputed) ? disputed.length : (disputed?.count ?? 0),
        scheduledToday: Array.isArray(shifts)   ? shifts.length   : (shifts?.count   ?? 0),
      });
      setLoading(false);
    });
  }, []);

  if (loading) return <div className="p-10 text-center text-gray-400 text-sm">Loading…</div>;

  const statCards = [
    {
      label: "Clocked In Now",
      value: stats.clockedIn,
      sub: "active clock-ins",
      color: "text-accent",
      icon: (
        <svg width="22" height="22" fill="none" stroke="#00ce7c" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="11" cy="11" r="9"/><polyline points="11,6 11,11 14,13"/>
        </svg>
      ),
    },
    {
      label: "Pending Time Off",
      value: stats.pendingTimeOff,
      sub: "awaiting approval",
      color: stats.pendingTimeOff > 0 ? "text-amber-500" : "text-primary",
      icon: (
        <svg width="22" height="22" fill="none" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="2" y="3" width="18" height="17" rx="2"/>
          <line x1="14" y1="1" x2="14" y2="5"/><line x1="8" y1="1" x2="8" y2="5"/>
          <line x1="2" y1="9" x2="20" y2="9"/>
        </svg>
      ),
    },
    {
      label: "Disputed Hours",
      value: stats.disputedHours,
      sub: "need resolution",
      color: stats.disputedHours > 0 ? "text-red-500" : "text-primary",
      icon: (
        <svg width="22" height="22" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
          <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
        </svg>
      ),
    },
    {
      label: "Scheduled Today",
      value: stats.scheduledToday,
      sub: "shifts today",
      color: "text-primary",
      icon: (
        <svg width="22" height="22" fill="none" stroke="#1e293b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="2" y="3" width="18" height="17" rx="2"/>
          <line x1="14" y1="1" x2="14" y2="5"/><line x1="8" y1="1" x2="8" y2="5"/>
          <line x1="2" y1="9" x2="20" y2="9"/>
          <polyline points="8,13 10,15 14,11"/>
        </svg>
      ),
    },
  ];

  const quickLinks = [
    {
      href: "/admin/workforce/employees",
      label: "Workforce Employees",
      desc: "Manage workforce employee records, pay types, and hire dates.",
      icon: (
        <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="7" cy="5" r="3"/><path d="M1 18s0-5 6-5"/>
          <circle cx="15" cy="5" r="3"/><path d="M13 18s0-5 6-5"/>
        </svg>
      ),
    },
    {
      href: "/admin/workforce/time",
      label: "Time & Approvals",
      desc: "Review pending and disputed time entries.",
      icon: (
        <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="11" cy="11" r="9"/><polyline points="11,6 11,11 14,13"/>
        </svg>
      ),
    },
    {
      href: "/admin/workforce/time-off",
      label: "Time Off Requests",
      desc: "Approve or deny PTO and sick leave requests.",
      icon: (
        <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="2" y="3" width="18" height="17" rx="2"/>
          <line x1="14" y1="1" x2="14" y2="5"/><line x1="8" y1="1" x2="8" y2="5"/>
          <line x1="2" y1="9" x2="20" y2="9"/>
        </svg>
      ),
    },
  ];

  return (
    <div className="px-8 py-8 max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-primary">Workforce Overview</h1>
        <p className="text-sm text-gray-400 mt-1">
          {new Date().toLocaleDateString([], { weekday: "long", month: "long", day: "numeric", year: "numeric" })}
        </p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {statCards.map(card => (
          <div key={card.label} className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest leading-tight">{card.label}</p>
              {card.icon}
            </div>
            <div className="border-t border-gray-100 pt-3">
              <p className={`text-3xl font-black ${card.color}`}>{card.value}</p>
              <p className="text-xs text-gray-400 mt-1">{card.sub}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Quick links */}
      <div>
        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Quick Access</p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {quickLinks.map(ql => (
            <Link key={ql.href} href={ql.href}
              className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 hover:border-accent/40 hover:shadow-md transition-all group">
              <div className="w-10 h-10 rounded-xl bg-accent/10 text-accent flex items-center justify-center mb-3 group-hover:bg-accent/20 transition-colors">
                {ql.icon}
              </div>
              <p className="text-sm font-bold text-primary">{ql.label}</p>
              <p className="text-xs text-gray-400 mt-1">{ql.desc}</p>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
