'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Clock,
  Calendar,
  DollarSign,
  CalendarOff,
  ChevronRight,
  TrendingUp,
} from 'lucide-react';

function fmt12(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
}

function fmtDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' });
}

function fmtCurrency(n) {
  if (n == null) return '—';
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n);
}

function hoursFromRecords(records) {
  let total = 0;
  for (const r of records) {
    if (!r.clockIn?.time) continue;
    const out = r.clockOut?.time ? new Date(r.clockOut.time) : new Date();
    const ms  = out - new Date(r.clockIn.time);
    total += ms / 3600000;
  }
  return Math.round(total * 10) / 10;
}

function StatCard({ icon: Icon, label, value, sub, href, color }) {
  const inner = (
    <div className="bg-white rounded-2xl border border-slate-200 p-5 flex items-start gap-4 hover:shadow-md transition-shadow">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${color}`}>
        <Icon className="w-5 h-5" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-slate-500 font-medium">{label}</p>
        <p className="text-xl font-bold text-slate-900 mt-0.5 truncate">{value}</p>
        {sub && <p className="text-xs text-slate-400 mt-0.5">{sub}</p>}
      </div>
      {href && <ChevronRight className="w-4 h-4 text-slate-300 self-center flex-shrink-0" />}
    </div>
  );
  return href ? <Link href={href}>{inner}</Link> : inner;
}

export default function EmployeeDashboard() {
  const [session, setSession]     = useState(null);
  const [hours, setHours]         = useState(null);
  const [schedule, setSchedule]   = useState(null);
  const [payData, setPayData]     = useState(null);
  const [activeRecord, setActive] = useState(null);
  const [loading, setLoading]     = useState(true);

  useEffect(() => {
    fetch('/api/auth/employee-session')
      .then((r) => r.ok ? r.json() : null)
      .then((s) => {
        if (!s?.authenticated) return;
        setSession(s);

        const now   = new Date();
        const day   = now.getDay();
        const monday = new Date(now);
        monday.setDate(now.getDate() - (day === 0 ? 6 : day - 1));
        monday.setHours(0, 0, 0, 0);
        const sunday = new Date(monday);
        sunday.setDate(monday.getDate() + 6);
        sunday.setHours(23, 59, 59, 999);

        const from = monday.toISOString().slice(0, 10);
        const to   = sunday.toISOString().slice(0, 10);

        return Promise.all([
          fetch(`/api/time-records?employeeId=${s.employeeId}&from=${from}&to=${to}`).then((r) => r.json()),
          fetch('/api/schedule').then((r) => r.json()),
          fetch(`/api/pay/${s.employeeId}`).then((r) => r.json()),
        ]).then(([records, sched, pay]) => {
          const list = Array.isArray(records) ? records : [];
          setHours(hoursFromRecords(list));
          setActive(list.find((r) => r.status === 'active') ?? null);

          // Find next upcoming scheduled Saturday
          const today = now.toISOString().slice(0, 10);
          const upcoming = Object.entries(sched || {})
            .filter(([date, employees]) =>
              date >= today && employees.some((e) => e.id === s.employeeId)
            )
            .sort(([a], [b]) => a.localeCompare(b));
          setSchedule(upcoming[0] ?? null);

          setPayData(pay);
          setLoading(false);
        });
      })
      .catch(() => setLoading(false));
  }, []);

  const firstName = session?.displayName?.split(' ')[0] ?? 'there';

  const hourOfDay = new Date().getHours();
  const greeting  = hourOfDay < 12 ? 'Good morning' : hourOfDay < 17 ? 'Good afternoon' : 'Good evening';

  const latestStub = payData?.stubs?.[0] ?? null;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div
          className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin"
          style={{ borderColor: 'var(--brand-primary)', borderTopColor: 'transparent' }}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-24 lg:pb-8">

      {/* Greeting */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">{greeting}, {firstName} 👋</h1>
        <p className="text-slate-500 text-sm mt-1">
          {new Date().toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' })}
        </p>
      </div>

      {/* Clocked-in banner */}
      {activeRecord && (
        <div
          className="rounded-2xl px-5 py-4 flex items-center gap-3 text-white"
          style={{ backgroundColor: 'var(--brand-primary)' }}
        >
          <div className="w-2.5 h-2.5 rounded-full bg-white animate-pulse flex-shrink-0" />
          <div>
            <p className="font-semibold text-sm">You're clocked in</p>
            <p className="text-white/70 text-xs">Since {fmt12(activeRecord.clockIn?.time)}</p>
          </div>
        </div>
      )}

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <StatCard
          icon={Clock}
          label="Hours this week"
          value={hours != null ? `${hours} hrs` : '—'}
          sub={activeRecord ? 'Currently clocked in' : 'No active clock-in'}
          color="bg-blue-50 text-blue-600"
        />

        <StatCard
          icon={Calendar}
          label="Next shift"
          value={schedule ? fmtDate(schedule[0]) : 'None scheduled'}
          sub={schedule ? 'Saturday' : 'Check back later'}
          href="/employee/schedule"
          color="bg-violet-50 text-violet-600"
        />

        <StatCard
          icon={DollarSign}
          label="Latest pay stub"
          value={latestStub ? fmtCurrency(latestStub.net_pay) : '—'}
          sub={latestStub ? `Period ending ${fmtDate(latestStub.period_end)}` : 'No stubs yet'}
          href="/employee/pay"
          color="bg-emerald-50 text-emerald-600"
        />

        <StatCard
          icon={TrendingUp}
          label="Pay rate"
          value={payData?.pay?.pay_rate != null ? fmtCurrency(payData.pay.pay_rate) : '—'}
          sub={payData?.pay?.pay_type ?? 'Not set'}
          color="bg-amber-50 text-amber-600"
        />
      </div>

      {/* Quick links */}
      <div>
        <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-3">Quick links</h2>
        <div className="grid grid-cols-2 gap-2">
          {[
            { label: 'My Schedule',   href: '/employee/schedule',  icon: Calendar },
            { label: 'Request Time Off', href: '/employee/time-off', icon: CalendarOff },
            { label: 'Pay Stubs',     href: '/employee/pay',       icon: DollarSign },
            { label: 'Briefings',     href: '/employee/briefings', icon: Clock },
          ].map(({ label, href, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className="bg-white border border-slate-200 rounded-xl px-4 py-3 flex items-center gap-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
            >
              <Icon className="w-4 h-4 text-slate-400" />
              {label}
            </Link>
          ))}
        </div>
      </div>

    </div>
  );
}
