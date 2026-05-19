"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { getSession, logout } from "@/lib/auth";

const NAV_GROUPS = [
  {
    label: "Work Module",
    items: [
      {
        label: "Overview",
        href: "/admin",
        icon: (
          <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="1" y="1" width="6" height="6" rx="1"/><rect x="9" y="1" width="6" height="6" rx="1"/>
            <rect x="1" y="9" width="6" height="6" rx="1"/><rect x="9" y="9" width="6" height="6" rx="1"/>
          </svg>
        ),
      },
      {
        label: "Employees",
        href: "/admin/employees",
        icon: (
          <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="6" cy="5" r="3"/><path d="M1 14s0-4 5-4"/>
            <circle cx="12" cy="5" r="3"/><path d="M11 14s0-4 4-4"/>
          </svg>
        ),
      },
      {
        label: "Time Records",
        href: "/admin/time",
        icon: (
          <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="8" cy="8" r="7"/><polyline points="8,4 8,8 11,10"/>
          </svg>
        ),
      },
      {
        label: "Schedule",
        href: "/admin/schedule",
        icon: (
          <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="2" y="3" width="12" height="11" rx="1"/>
            <line x1="10" y1="1" x2="10" y2="5"/><line x1="6" y1="1" x2="6" y2="5"/>
            <line x1="2" y1="7" x2="14" y2="7"/>
          </svg>
        ),
      },
      {
        label: "Tasks",
        href: "/admin/tasks",
        icon: (
          <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="9,11 12,14 22,4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>
          </svg>
        ),
      },
      {
        label: "Checklist",
        href: "/admin/checklist",
        icon: (
          <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="9,11 12,14 22,4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>
          </svg>
        ),
      },
    ],
  },
  {
    label: "CFO Module",
    items: [
      {
        label: "Pay & Benefits",
        href: "/admin/pay",
        icon: (
          <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="1" y="5" width="14" height="10" rx="1"/>
            <path d="M11 5V4a2 2 0 0 0-2-2H7a2 2 0 0 0-2 2v1"/>
          </svg>
        ),
      },
      {
        label: "Financials",
        href: "/admin/financials",
        icon: (
          <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 2H4a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1V3a1 1 0 0 0-1-1z"/>
            <line x1="5" y1="6" x2="11" y2="6"/><line x1="5" y1="9" x2="11" y2="9"/><line x1="5" y1="12" x2="8" y2="12"/>
          </svg>
        ),
      },
      {
        label: "Reports",
        href: "/admin/reports",
        icon: (
          <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="4" y1="14" x2="4" y2="9"/><line x1="8" y1="14" x2="8" y2="5"/>
            <line x1="12" y1="14" x2="12" y2="11"/><line x1="1" y1="14" x2="15" y2="14"/>
          </svg>
        ),
      },
    ],
  },
  {
    label: "General",
    items: [
      {
        label: "Employee Portal",
        href: "/employee",
        external: true,
        icon: (
          <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 3H5a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-4"/>
            <polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/>
          </svg>
        ),
      },
      {
        label: "Settings",
        href: "/admin/settings",
        icon: (
          <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="8" cy="8" r="3"/>
            <path d="M8 1v2M8 13v2M1 8h2M13 8h2M3.05 3.05l1.41 1.41M11.54 11.54l1.41 1.41M3.05 12.95l1.41-1.41M11.54 4.46l1.41-1.41"/>
          </svg>
        ),
      },
    ],
  },
];

function NavGroup({ group, pathname, openSidebar }) {
  const hasActive = group.items.some(i => i.href === pathname);
  const [expanded, setExpanded] = useState(hasActive);

  if (!openSidebar) return null;

  return (
    <div>
      <button
        onClick={() => setExpanded(e => !e)}
        className="w-full flex items-center justify-between px-3 py-2 text-[10px] font-bold uppercase tracking-widest text-white/30 hover:text-white/50 transition-colors"
      >
        <span>{group.label}</span>
        <svg
          width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2.5"
          strokeLinecap="round" strokeLinejoin="round"
          className={`transition-transform duration-200 ${expanded ? "rotate-180" : ""}`}
        >
          <polyline points="2,4 6,8 10,4"/>
        </svg>
      </button>

      {expanded && (
        <div className="space-y-0.5 mb-1">
          {group.items.map(({ href, label, icon, external }) => {
            const active = pathname === href;
            if (external) {
              return (
                <Link key={href} href={href}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium whitespace-nowrap transition-colors bg-accent/10 text-accent hover:bg-accent/20"
                >
                  <span className="flex-shrink-0">{icon}</span>
                  <span>{label}</span>
                </Link>
              );
            }
            return (
              <Link key={href} href={href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                  active ? "bg-accent/20 text-accent" : "text-white/50 hover:text-white hover:bg-white/10"
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
    </div>
  );
}

export default function AdminShell({ children }) {
  const [open, setOpen]       = useState(true);
  const [session, setSession] = useState(null);
  const pathname = usePathname();
  const router   = useRouter();

  useEffect(() => {
    const s = getSession();
    const verified = sessionStorage.getItem("admin_verified");
    if (!s || s.role !== "admin" || !verified) {
      router.replace("/admin/login");
      return;
    }
    setSession(s);
  }, [router]);

  function handleLogout() {
    logout();
    sessionStorage.removeItem("admin_verified");
    router.replace("/admin/login");
  }

  if (!session) return null;

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      {/* Sidebar */}
      <aside className={`bg-primary flex flex-col flex-shrink-0 transition-all duration-300 ease-in-out overflow-hidden ${open ? "w-56" : "w-0"}`}>
        <div className="px-4 py-[18px] flex items-center gap-2.5 border-b border-white/10 flex-shrink-0">
          <div className="w-7 h-7 rounded-md bg-accent flex items-center justify-center flex-shrink-0">
            <span className="text-primary text-xs font-black tracking-tighter">UE</span>
          </div>
          <div className="min-w-0">
            <span className="text-white font-semibold text-sm whitespace-nowrap">Unified Employee</span>
            <p className="text-accent text-[10px] font-semibold uppercase tracking-widest whitespace-nowrap">Admin</p>
          </div>
        </div>

        <nav className="flex-1 px-2 py-3 space-y-1 overflow-y-auto overflow-x-hidden">
          {NAV_GROUPS.map(group => (
            <NavGroup key={group.label} group={group} pathname={pathname} openSidebar={open} />
          ))}
        </nav>

        <div className="px-3 py-4 border-t border-white/10 flex-shrink-0 space-y-3">
          <div className="flex items-center gap-2.5 px-1">
            <div className="w-7 h-7 rounded-full bg-accent/20 text-accent flex items-center justify-center text-xs font-bold flex-shrink-0">
              {session.name.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2)}
            </div>
            <div className="min-w-0">
              <p className="text-white text-xs font-semibold truncate whitespace-nowrap">{session.name}</p>
              <p className="text-accent text-[10px] font-semibold whitespace-nowrap">Administrator</p>
            </div>
          </div>
          <button onClick={handleLogout}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-white/40 hover:text-white hover:bg-white/10 text-xs font-medium transition-colors">
            <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M10 8H3M6 5l-3 3 3 3"/><path d="M6 2H13a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H6"/>
            </svg>
            Sign out
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="bg-white border-b border-gray-200 px-6 py-[14px] flex items-center gap-3 flex-shrink-0">
          <button onClick={() => setOpen(o => !o)}
            className="p-1.5 rounded-md text-gray-400 hover:bg-gray-100 hover:text-gray-700 transition-colors flex-shrink-0">
            <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <line x1="2" y1="4" x2="16" y2="4"/><line x1="2" y1="9" x2="16" y2="9"/><line x1="2" y1="14" x2="16" y2="14"/>
            </svg>
          </button>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-md bg-accent flex items-center justify-center">
              <span className="text-primary text-xs font-black tracking-tighter">UE</span>
            </div>
            <span className="font-bold text-primary text-sm">Admin Dashboard</span>
          </div>
          <div className="ml-auto">
            <span className="text-xs font-semibold bg-accent/10 text-accent border border-accent/20 px-3 py-1 rounded-full">
              Admin
            </span>
          </div>
        </header>
        <main className="flex-1 overflow-auto">{children}</main>
      </div>
    </div>
  );
}
