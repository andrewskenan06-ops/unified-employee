"use client";
import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { getSession, logout } from "@/lib/auth";
import { useBranding, brandStyle } from "@/lib/workforce/use-branding";

const DEFAULT_NAV_GROUPS = [
  {
    label: "Workforce Module",
    items: [
      {
        label: "WF Overview",
        href: "/admin/workforce",
        icon: (
          <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="1" y="1" width="6" height="6" rx="1"/><rect x="9" y="1" width="6" height="6" rx="1"/>
            <rect x="1" y="9" width="6" height="6" rx="1"/><rect x="9" y="9" width="6" height="6" rx="1"/>
          </svg>
        ),
      },
      {
        label: "WF Employees",
        href: "/admin/workforce/employees",
        icon: (
          <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="6" cy="5" r="3"/><path d="M1 14s0-4 5-4"/>
            <circle cx="12" cy="5" r="3"/><path d="M11 14s0-4 4-4"/>
          </svg>
        ),
      },
      {
        label: "Time & Approvals",
        href: "/admin/workforce/time",
        icon: (
          <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="8" cy="8" r="7"/><polyline points="8,4 8,8 11,10"/>
          </svg>
        ),
      },
      {
        label: "Time Off",
        href: "/admin/workforce/time-off",
        icon: (
          <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="1" y="3" width="14" height="11" rx="1"/>
            <line x1="10" y1="1" x2="10" y2="5"/><line x1="6" y1="1" x2="6" y2="5"/>
            <line x1="1" y1="7" x2="15" y2="7"/>
          </svg>
        ),
      },
      {
        label: "Briefings",
        href: "/admin/workforce/briefings",
        icon: (
          <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M13 2H3a1 1 0 0 0-1 1v11a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1V3a1 1 0 0 0-1-1z"/>
            <line x1="5" y1="6" x2="11" y2="6"/><line x1="5" y1="9" x2="11" y2="9"/><line x1="5" y1="12" x2="8" y2="12"/>
          </svg>
        ),
      },
      {
        label: "Payroll Runs",
        href: "/admin/workforce/payroll",
        icon: (
          <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="1" y="4" width="14" height="10" rx="1"/>
            <path d="M10 4V3a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v1"/>
            <line x1="8" y1="8" x2="8" y2="10"/><circle cx="8" cy="10" r="0.5" fill="currentColor"/>
          </svg>
        ),
      },
      {
        label: "Cases",
        href: "/admin/workforce/cases",
        icon: (
          <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 2H5a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V5z"/>
            <polyline points="9,2 9,5 12,5"/>
            <line x1="5" y1="8" x2="10" y2="8"/><line x1="5" y1="11" x2="8" y2="11"/>
          </svg>
        ),
      },
      {
        label: "Devices",
        href: "/admin/workforce/devices",
        icon: (
          <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="1" width="10" height="14" rx="2"/>
            <line x1="8" y1="12" x2="8" y2="12" strokeWidth="2.5" strokeLinecap="round"/>
          </svg>
        ),
      },
    ],
  },
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
      {
        label: "Branding",
        href: "/admin/branding",
        icon: (
          <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="13" cy="3" r="2"/><circle cx="3" cy="13" r="2"/>
            <path d="M3 11C3 7 7 3 11 3"/><path d="M13 5c0 4-4 8-8 8"/>
          </svg>
        ),
      },
    ],
  },
];

function loadSavedOrder() {
  if (typeof window === "undefined") return null;
  try { return JSON.parse(localStorage.getItem("admin_nav_order")); }
  catch { return null; }
}

function applyOrder(defaults, saved) {
  if (!saved) return defaults;
  const groupMap = Object.fromEntries(defaults.map(g => [g.label, g]));
  const ordered = (saved.groupOrder || []).map(l => groupMap[l]).filter(Boolean);
  defaults.forEach(g => { if (!saved.groupOrder?.includes(g.label)) ordered.push(g); });
  return ordered.map(g => {
    const itemOrder = saved.itemOrders?.[g.label];
    if (!itemOrder) return g;
    const itemMap = Object.fromEntries(g.items.map(i => [i.href, i]));
    const orderedItems = itemOrder.map(h => itemMap[h]).filter(Boolean);
    g.items.forEach(i => { if (!itemOrder.includes(i.href)) orderedItems.push(i); });
    return { ...g, items: orderedItems };
  });
}

function persistOrder(groups) {
  localStorage.setItem("admin_nav_order", JSON.stringify({
    groupOrder: groups.map(g => g.label),
    itemOrders: Object.fromEntries(groups.map(g => [g.label, g.items.map(i => i.href)])),
  }));
}

const GripIcon = () => (
  <svg width="10" height="14" viewBox="0 0 10 14" fill="currentColor" className="opacity-0 group-hover:opacity-40 hover:!opacity-70 transition-opacity flex-shrink-0 cursor-grab active:cursor-grabbing">
    <circle cx="3" cy="2.5" r="1.2"/><circle cx="7" cy="2.5" r="1.2"/>
    <circle cx="3" cy="7" r="1.2"/><circle cx="7" cy="7" r="1.2"/>
    <circle cx="3" cy="11.5" r="1.2"/><circle cx="7" cy="11.5" r="1.2"/>
  </svg>
);

function NavGroup({ group, groupIndex, pathname, openSidebar, onGroupDragStart, onGroupDragOver, onGroupDrop, onGroupDragEnd, onItemDragStart, onItemDragOver, onItemDrop, onItemDragEnd, dragState }) {
  const hasActive = group.items.some(i => i.href === pathname);
  const [expanded, setExpanded] = useState(hasActive);

  if (!openSidebar) return null;

  const isGroupDragOver = dragState.current?.type === "group" && dragState.current?.overIndex === groupIndex && dragState.current?.fromIndex !== groupIndex;

  return (
    <div
      draggable
      onDragStart={e => onGroupDragStart(e, groupIndex)}
      onDragOver={e => onGroupDragOver(e, groupIndex)}
      onDrop={e => onGroupDrop(e, groupIndex)}
      onDragEnd={onGroupDragEnd}
      className={`rounded-lg transition-all ${isGroupDragOver ? "ring-1 ring-accent/50 bg-white/5" : ""}`}
    >
      <button
        onClick={() => setExpanded(e => !e)}
        className="group w-full flex items-center gap-1.5 px-3 py-2 text-[10px] font-bold uppercase tracking-widest text-white/30 hover:text-white/50 transition-colors"
      >
        <GripIcon />
        <span className="flex-1 text-left">{group.label}</span>
        <svg
          width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2.5"
          strokeLinecap="round" strokeLinejoin="round"
          className={`transition-transform duration-200 flex-shrink-0 ${expanded ? "rotate-180" : ""}`}
        >
          <polyline points="2,4 6,8 10,4"/>
        </svg>
      </button>

      {expanded && (
        <div className="space-y-0.5 mb-1">
          {group.items.map(({ href, label, icon, external }, itemIndex) => {
            const active = pathname === href;
            const isItemDragOver =
              dragState.current?.type === "item" &&
              dragState.current?.groupIndex === groupIndex &&
              dragState.current?.overItemIndex === itemIndex &&
              dragState.current?.fromItemIndex !== itemIndex;

            const content = (
              <>
                <GripIcon />
                <span className="flex-shrink-0">{icon}</span>
                <span>{label}</span>
                {active && !external && <span className="ml-auto w-1.5 h-1.5 rounded-full bg-accent flex-shrink-0" />}
              </>
            );

            const baseClass = `group flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
              isItemDragOver ? "ring-1 ring-accent/50 bg-white/5" : ""
            }`;

            if (external) {
              return (
                <div
                  key={href}
                  draggable
                  onDragStart={e => onItemDragStart(e, groupIndex, itemIndex)}
                  onDragOver={e => onItemDragOver(e, groupIndex, itemIndex)}
                  onDrop={e => onItemDrop(e, groupIndex, itemIndex)}
                  onDragEnd={onItemDragEnd}
                  className={baseClass}
                >
                  <Link href={href} className="flex items-center gap-2 flex-1 bg-accent/10 text-accent hover:bg-accent/20 rounded-lg px-1 py-0.5">
                    {content}
                  </Link>
                </div>
              );
            }
            return (
              <div
                key={href}
                draggable
                onDragStart={e => onItemDragStart(e, groupIndex, itemIndex)}
                onDragOver={e => onItemDragOver(e, groupIndex, itemIndex)}
                onDrop={e => onItemDrop(e, groupIndex, itemIndex)}
                onDragEnd={onItemDragEnd}
                className={`${baseClass} ${active ? "bg-accent/20 text-accent" : "text-white/50 hover:text-white hover:bg-white/10"}`}
              >
                <Link href={href} className="flex items-center gap-2 flex-1">
                  {content}
                </Link>
              </div>
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
  const [groups, setGroups]   = useState(() => applyOrder(DEFAULT_NAV_GROUPS, loadSavedOrder()));
  const pathname = usePathname();
  const router   = useRouter();
  const dragState = useRef(null);
  const branding  = useBranding();

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

  // --- Group drag handlers ---
  function onGroupDragStart(e, fromIndex) {
    dragState.current = { type: "group", fromIndex, overIndex: fromIndex };
    e.dataTransfer.effectAllowed = "move";
  }
  function onGroupDragOver(e, overIndex) {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    if (dragState.current?.type === "group") {
      dragState.current.overIndex = overIndex;
    }
  }
  function onGroupDrop(e, toIndex) {
    e.preventDefault();
    if (dragState.current?.type !== "group") return;
    const { fromIndex } = dragState.current;
    if (fromIndex === toIndex) return;
    setGroups(prev => {
      const next = [...prev];
      const [moved] = next.splice(fromIndex, 1);
      next.splice(toIndex, 0, moved);
      persistOrder(next);
      return next;
    });
    dragState.current = null;
  }
  function onGroupDragEnd() {
    dragState.current = null;
  }

  // --- Item drag handlers ---
  function onItemDragStart(e, groupIndex, fromItemIndex) {
    dragState.current = { type: "item", groupIndex, fromItemIndex, overItemIndex: fromItemIndex };
    e.dataTransfer.effectAllowed = "move";
    e.stopPropagation();
  }
  function onItemDragOver(e, groupIndex, overItemIndex) {
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = "move";
    if (dragState.current?.type === "item" && dragState.current.groupIndex === groupIndex) {
      dragState.current.overItemIndex = overItemIndex;
    }
  }
  function onItemDrop(e, groupIndex, toItemIndex) {
    e.preventDefault();
    e.stopPropagation();
    if (dragState.current?.type !== "item") return;
    const { fromItemIndex, groupIndex: fromGroup } = dragState.current;
    if (fromGroup !== groupIndex || fromItemIndex === toItemIndex) return;
    setGroups(prev => {
      const next = prev.map(g => ({ ...g, items: [...g.items] }));
      const items = next[groupIndex].items;
      const [moved] = items.splice(fromItemIndex, 1);
      items.splice(toItemIndex, 0, moved);
      persistOrder(next);
      return next;
    });
    dragState.current = null;
  }
  function onItemDragEnd() {
    dragState.current = null;
  }

  if (!session) return null;

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50" style={brandStyle(branding)}>
      {/* Sidebar */}
      <aside className={`bg-primary flex flex-col flex-shrink-0 transition-all duration-300 ease-in-out overflow-hidden ${open ? "w-56" : "w-0"}`}>
        <div className="px-4 py-[18px] flex items-center gap-2.5 border-b border-white/10 flex-shrink-0">
          <div className="w-7 h-7 rounded-md bg-accent flex items-center justify-center flex-shrink-0 overflow-hidden flex-shrink-0">
            {branding.logo_url
              ? <img src={branding.logo_url} alt="logo" className="w-full h-full object-cover" />
              : <span className="text-primary text-xs font-black tracking-tighter">
                  {(branding.company_name || "UE").slice(0, 2).toUpperCase()}
                </span>
            }
          </div>
          <div className="min-w-0">
            <span className="text-white font-semibold text-sm whitespace-nowrap">{branding.company_name || "Unified Employee"}</span>
            <p className="text-accent text-[10px] font-semibold uppercase tracking-widest whitespace-nowrap">Admin</p>
          </div>
        </div>

        <nav className="flex-1 px-2 py-3 space-y-1 overflow-y-auto overflow-x-hidden">
          {groups.map((group, groupIndex) => (
            <NavGroup
              key={group.label}
              group={group}
              groupIndex={groupIndex}
              pathname={pathname}
              openSidebar={open}
              onGroupDragStart={onGroupDragStart}
              onGroupDragOver={onGroupDragOver}
              onGroupDrop={onGroupDrop}
              onGroupDragEnd={onGroupDragEnd}
              onItemDragStart={onItemDragStart}
              onItemDragOver={onItemDragOver}
              onItemDrop={onItemDrop}
              onItemDragEnd={onItemDragEnd}
              dragState={dragState}
            />
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
