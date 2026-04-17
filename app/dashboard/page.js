"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { getSession } from "@/lib/auth";

const MODULES = [
  {
    href: "/dashboard/time",
    label: "Time Clock",
    icon: (
      <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="11" cy="11" r="10"/>
        <polyline points="11,6 11,11 14,13"/>
      </svg>
    ),
  },
  {
    href: "/dashboard/time-off",
    label: "Time Off & Shift Swaps",
    icon: (
      <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="4" width="16" height="16" rx="2"/>
        <line x1="16" y1="2" x2="16" y2="6"/>
        <line x1="8" y1="2" x2="8" y2="6"/>
        <line x1="3" y1="10" x2="19" y2="10"/>
      </svg>
    ),
  },
  {
    href: "/dashboard/calendar",
    label: "Company Calendar",
    icon: (
      <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="4" width="16" height="16" rx="2"/>
        <line x1="16" y1="2" x2="16" y2="6"/>
        <line x1="8" y1="2" x2="8" y2="6"/>
        <line x1="3" y1="10" x2="19" y2="10"/>
        <circle cx="8" cy="15" r="1" fill="currentColor"/>
        <circle cx="12" cy="15" r="1" fill="currentColor"/>
        <circle cx="16" cy="15" r="1" fill="currentColor"/>
      </svg>
    ),
  },
  {
    href: "/dashboard/pay",
    label: "Pay, Benefits & Deductions",
    icon: (
      <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="6" width="18" height="13" rx="2"/>
        <path d="M16 6V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v1"/>
        <line x1="12" y1="11" x2="12" y2="15"/>
        <line x1="10" y1="13" x2="14" y2="13"/>
      </svg>
    ),
  },
];

export default function DashboardPage() {
  const [session, setSession] = useState(null);

  useEffect(() => { setSession(getSession()); }, []);

  const firstName = session?.name?.split(" ")[0] ?? "";

  return (
    <div className="px-8 py-8 max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-primary">
          {firstName ? `Welcome back, ${firstName}` : "Welcome back"}
        </h1>
        <p className="text-sm text-gray-400 mt-1">What do you need today?</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {MODULES.map(({ href, label, icon }) => (
          <Link
            key={href}
            href={href}
            className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 flex flex-col gap-6 hover:shadow-md hover:-translate-y-0.5 transition-all duration-150 group min-h-[160px] justify-between"
          >
            <div className="w-12 h-12 rounded-xl bg-primary/5 text-primary flex items-center justify-center">
              {icon}
            </div>
            <div className="flex items-end justify-between">
              <p className="font-semibold text-primary text-base">{label}</p>
              <span className="text-xs font-medium text-accent opacity-0 group-hover:opacity-100 transition-opacity">
                Open →
              </span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
