"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { getSession, logout } from "@/lib/auth";

const NAV = [
  {
    label: "Overview",
    href: "/dashboard",
    icon: (
      <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="1" y="1" width="6" height="6" rx="1"/>
        <rect x="9" y="1" width="6" height="6" rx="1"/>
        <rect x="1" y="9" width="6" height="6" rx="1"/>
        <rect x="9" y="9" width="6" height="6" rx="1"/>
      </svg>
    ),
  },
  {
    label: "Time Clock",
    href: "/dashboard/time",
    icon: (
      <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="8" cy="8" r="7"/>
        <polyline points="8,4 8,8 11,10"/>
      </svg>
    ),
  },
  {
    label: "Time Off & Shifts",
    href: "/dashboard/time-off",
    icon: (
      <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="3" width="12" height="11" rx="1"/>
        <line x1="10" y1="1" x2="10" y2="5"/>
        <line x1="6" y1="1" x2="6" y2="5"/>
        <line x1="2" y1="7" x2="14" y2="7"/>
      </svg>
    ),
  },
  {
    label: "Company Calendar",
    href: "/dashboard/calendar",
    icon: (
      <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="3" width="12" height="11" rx="1"/>
        <line x1="10" y1="1" x2="10" y2="5"/>
        <line x1="6" y1="1" x2="6" y2="5"/>
        <line x1="2" y1="7" x2="14" y2="7"/>
        <circle cx="5" cy="11" r="0.8" fill="currentColor"/>
        <circle cx="8" cy="11" r="0.8" fill="currentColor"/>
        <circle cx="11" cy="11" r="0.8" fill="currentColor"/>
      </svg>
    ),
  },
  {
    label: "Pay & Benefits",
    href: "/dashboard/pay",
    icon: (
      <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="1" y="5" width="14" height="10" rx="1"/>
        <path d="M11 5V4a2 2 0 0 0-2-2H7a2 2 0 0 0-2 2v1"/>
        <line x1="8" y1="9" x2="8" y2="11"/>
        <line x1="7" y1="10" x2="9" y2="10"/>
      </svg>
    ),
  },
];

export default function DashboardShell({ children }) {
  const [open, setOpen] = useState(true);
  const [session, setSession] = useState(null);
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    const s = getSession();
    if (!s) { router.replace("/login"); }
    else { setSession(s); }
  }, [router]);

  function handleLogout() {
    logout();
    router.replace("/login");
  }

  if (!session) return null;

  const initials = session.name.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2);

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      {/* Sidebar */}
      <aside className={`bg-primary flex flex-col flex-shrink-0 transition-all duration-300 ease-in-out overflow-hidden ${open ? "w-56" : "w-0"}`}>

        {/* Logo */}
        <div className="px-4 py-[18px] flex items-center gap-2.5 border-b border-white/10 flex-shrink-0">
          <div className="w-7 h-7 rounded-md bg-accent flex items-center justify-center flex-shrink-0">
            <span className="text-primary text-xs font-black tracking-tighter">UE</span>
          </div>
          <span className="text-white font-semibold text-sm whitespace-nowrap">Unified Employee</span>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-2 py-3 space-y-0.5 overflow-y-auto overflow-x-hidden">
          <p className="px-3 pt-1 pb-2 text-white/30 text-[10px] font-semibold uppercase tracking-widest whitespace-nowrap">
            Employee Platform
          </p>
          {NAV.map(({ href, label, icon }) => {
            const active = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                  active
                    ? "bg-accent/20 text-accent"
                    : "text-white/50 hover:text-white hover:bg-white/10"
                }`}
              >
                <span className="flex-shrink-0">{icon}</span>
                <span>{label}</span>
                {active && <span className="ml-auto w-1.5 h-1.5 rounded-full bg-accent flex-shrink-0" />}
              </Link>
            );
          })}

          {/* Admin-only section */}
          {session.role === "admin" && (
            <div className="pt-4">
              <p className="px-3 pb-2 text-white/30 text-[10px] font-semibold uppercase tracking-widest whitespace-nowrap">
                Admin
              </p>
              {[{
                href: "/dashboard/employees",
                label: "Employees",
                icon: (
                  <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="6" cy="5" r="3"/>
                    <path d="M1 14s0-4 5-4"/>
                    <circle cx="12" cy="5" r="3"/>
                    <path d="M11 14s0-4 4-4"/>
                  </svg>
                ),
              }].map(({ href, label, icon }) => {
                const active = pathname === href;
                return (
                  <Link
                    key={href}
                    href={href}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                      active
                        ? "bg-accent/20 text-accent"
                        : "text-white/50 hover:text-white hover:bg-white/10"
                    }`}
                  >
                    <span className="flex-shrink-0">{icon}</span>
                    <span>{label}</span>
                    {active && <span className="ml-auto w-1.5 h-1.5 rounded-full bg-accent flex-shrink-0" />}
                  </Link>
                );
              })}
            </div>
          )}
        </nav>

        {/* User + logout */}
        <div className="px-3 py-4 border-t border-white/10 flex-shrink-0 space-y-3">
          <div className="flex items-center gap-2.5 px-1">
            <div className="w-7 h-7 rounded-full bg-accent/20 text-accent flex items-center justify-center text-xs font-bold flex-shrink-0">
              {initials}
            </div>
            <div className="min-w-0">
              <p className="text-white text-xs font-semibold truncate whitespace-nowrap">{session.name}</p>
              <p className="text-white/30 text-[10px] capitalize whitespace-nowrap">{session.role}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-white/40 hover:text-white hover:bg-white/10 text-xs font-medium transition-colors"
          >
            <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M10 8H3M6 5l-3 3 3 3"/><path d="M6 2H13a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H6"/>
            </svg>
            Sign out
          </button>
        </div>
      </aside>

      {/* Main area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Header */}
        <header className="bg-white border-b border-gray-200 px-6 py-[14px] flex items-center gap-3 flex-shrink-0">
          <button
            onClick={() => setOpen((o) => !o)}
            className="p-1.5 rounded-md text-gray-400 hover:bg-gray-100 hover:text-gray-700 transition-colors flex-shrink-0"
          >
            <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <line x1="2" y1="4" x2="16" y2="4"/>
              <line x1="2" y1="9" x2="16" y2="9"/>
              <line x1="2" y1="14" x2="16" y2="14"/>
            </svg>
          </button>

          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-md bg-accent flex items-center justify-center">
              <span className="text-primary text-xs font-black tracking-tighter">UE</span>
            </div>
            <span className="font-bold text-primary text-sm">Unified Employee</span>
          </div>

          <div className="ml-auto flex items-center gap-3">
            {session.role === "admin" && (
              <span className="text-xs font-semibold bg-accent/10 text-accent border border-accent/20 px-3 py-1 rounded-full">
                Admin
              </span>
            )}
            <span className="text-sm text-gray-400">
              Hi, <span className="font-semibold text-primary">{session.name.split(" ")[0]}</span>
            </span>
          </div>
        </header>

        <main className="flex-1 overflow-auto">{children}</main>
      </div>
    </div>
  );
}
