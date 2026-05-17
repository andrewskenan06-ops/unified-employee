'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  PlayCircle,
  Calendar,
  CalendarOff,
  DollarSign,
  Heart,
  FileText,
  Award,
  Star,
  Bell,
  User,
  LogOut,
  Menu,
  X,
  Home,
  MoreHorizontal,
  ChevronDown,
} from 'lucide-react';
import { useBranding, brandStyle } from '@/lib/workforce/use-branding';

function NavLink({ item, active, onClick, indented }) {
  return (
    <Link
      href={item.href}
      onClick={onClick}
      className={cn(
        'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all',
        indented && 'ml-4',
        active ? 'font-semibold' : 'text-slate-600 hover:bg-slate-100',
      )}
      style={active
        ? { backgroundColor: 'var(--brand-primary-soft)', color: 'var(--brand-primary)' }
        : undefined}
    >
      <item.icon className="w-4 h-4" />
      {item.name}
    </Link>
  );
}

const PRIMARY_NAV = [
  { name: 'Dashboard', href: '/employee', icon: Home },
  { name: 'Briefings', href: '/employee/briefings', icon: PlayCircle },
  { name: 'Schedule', href: '/employee/schedule', icon: Calendar },
  { name: 'Time Off', href: '/employee/time-off', icon: CalendarOff },
  { name: 'Pay Stubs', href: '/employee/pay', icon: DollarSign },
];

const MORE_NAV = [
  { name: 'Benefits', href: '/employee/benefits', icon: Heart },
  { name: 'Documents', href: '/employee/documents', icon: FileText },
  { name: 'Credentials', href: '/employee/credentials', icon: Award },
  { name: 'Reviews', href: '/employee/reviews', icon: Star },
  { name: 'Events', href: '/employee/events', icon: Bell },
];

const FOOTER_NAV = [
  { name: 'Settings', href: '/employee/settings', icon: User },
];

export default function EmployeeLayout({ children }) {
  const [session, setSession] = useState(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [moreManuallyOpen, setMoreManuallyOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const branding = useBranding();

  const moreChildActive = MORE_NAV.some(
    (item) => pathname === item.href || pathname?.startsWith(item.href + '/'),
  );
  const moreOpen = moreChildActive || moreManuallyOpen;
  const isItemActive = (href) =>
    pathname === href || (href !== '/employee' && pathname?.startsWith(href));

  useEffect(() => {
    fetch('/api/auth/employee-session')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.authenticated) {
          setSession({
            displayName: data.displayName,
            role: data.role,
            employeeId: data.employeeId,
          });
        } else {
          router.push('/employee/login');
        }
      })
      .catch(() => router.push('/employee/login'));
  }, [router]);

  async function handleLogout() {
    await fetch('/api/auth/employee-logout', { method: 'POST' });
    router.push('/employee/login');
  }

  const portalName = branding.name || 'Employee Portal';
  const initial = (branding.name || 'E').trim().charAt(0).toUpperCase();

  return (
    <div className="min-h-screen bg-slate-50" style={brandStyle(branding)}>
      {/* Top nav bar */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur border-b border-slate-200/80">
        <div className="flex items-center justify-between h-16 px-4 lg:px-6">
          <div className="flex items-center gap-3">
            <button
              className="lg:hidden p-1.5 -ml-1.5 rounded-lg hover:bg-slate-100 transition-colors"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? (
                <X className="w-5 h-5 text-slate-600" />
              ) : (
                <Menu className="w-5 h-5 text-slate-600" />
              )}
            </button>
            <Link href="/employee" className="flex items-center gap-2.5">
              {branding.logo_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={branding.logo_url} alt={portalName} className="h-8 max-w-[140px] object-contain" />
              ) : (
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center text-white font-bold shadow-sm"
                  style={{ backgroundColor: 'var(--brand-primary)' }}
                >
                  {initial}
                </div>
              )}
              {!branding.logo_url && (
                <span className="font-semibold text-slate-900 text-sm leading-tight">
                  {portalName}
                </span>
              )}
            </Link>
          </div>

          <div className="flex items-center gap-3">
            {session && (
              <span className="text-sm text-slate-600 hidden sm:block">
                {session.displayName}
              </span>
            )}
            <button
              onClick={handleLogout}
              className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
              title="Sign out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Mobile navigation drawer */}
        {mobileMenuOpen && (
          <nav className="lg:hidden border-t border-slate-100 bg-white pb-2 max-h-[70vh] overflow-y-auto">
            <ul className="px-2 py-1.5 space-y-0.5">
              {PRIMARY_NAV.map((item) => (
                <li key={item.href}>
                  <NavLink
                    item={item}
                    active={isItemActive(item.href)}
                    onClick={() => setMobileMenuOpen(false)}
                  />
                </li>
              ))}

              <li>
                <button
                  type="button"
                  onClick={() => setMoreManuallyOpen((o) => !o)}
                  className={cn(
                    'w-full flex items-center justify-between gap-3 px-3 py-2.5 rounded-xl text-sm transition-all',
                    moreChildActive
                      ? 'font-semibold'
                      : 'text-slate-600 hover:bg-slate-100',
                  )}
                  style={moreChildActive
                    ? { backgroundColor: 'var(--brand-primary-soft)', color: 'var(--brand-primary)' }
                    : undefined}
                >
                  <span className="flex items-center gap-3">
                    <MoreHorizontal className="w-4 h-4" />
                    More
                  </span>
                  <ChevronDown className={cn('w-4 h-4 transition-transform', moreOpen && 'rotate-180')} />
                </button>
              </li>

              {moreOpen &&
                MORE_NAV.map((item) => (
                  <li key={item.href}>
                    <NavLink
                      item={item}
                      active={isItemActive(item.href)}
                      onClick={() => setMobileMenuOpen(false)}
                      indented
                    />
                  </li>
                ))}

              {FOOTER_NAV.map((item) => (
                <li key={item.href}>
                  <NavLink
                    item={item}
                    active={isItemActive(item.href)}
                    onClick={() => setMobileMenuOpen(false)}
                  />
                </li>
              ))}
            </ul>
          </nav>
        )}
      </header>

      <div className="flex">
        {/* Desktop sidebar */}
        <aside className="hidden lg:block w-60 border-r border-slate-200 bg-white min-h-[calc(100vh-4rem)]">
          <nav className="p-3 space-y-0.5">
            {PRIMARY_NAV.map((item) => (
              <NavLink key={item.href} item={item} active={isItemActive(item.href)} />
            ))}

            <button
              type="button"
              onClick={() => setMoreManuallyOpen((o) => !o)}
              className={cn(
                'w-full flex items-center justify-between gap-3 px-3 py-2.5 rounded-xl text-sm transition-all',
                moreChildActive ? 'font-semibold' : 'text-slate-600 hover:bg-slate-100',
              )}
              style={moreChildActive
                ? { backgroundColor: 'var(--brand-primary-soft)', color: 'var(--brand-primary)' }
                : undefined}
            >
              <span className="flex items-center gap-3">
                <MoreHorizontal className="w-4 h-4" />
                More
              </span>
              <ChevronDown className={cn('w-4 h-4 transition-transform', moreOpen && 'rotate-180')} />
            </button>

            {moreOpen &&
              MORE_NAV.map((item) => (
                <NavLink key={item.href} item={item} active={isItemActive(item.href)} indented />
              ))}

            {FOOTER_NAV.map((item) => (
              <NavLink key={item.href} item={item} active={isItemActive(item.href)} />
            ))}
          </nav>
        </aside>

        {/* Main content */}
        <main className="flex-1 px-4 py-5 lg:px-8 lg:py-8 max-w-6xl">{children}</main>
      </div>

      {/* Mobile bottom tab bar */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur border-t border-slate-200 z-40 safe-area-pb">
        <div className="flex items-center justify-around h-16 px-2">
          {[
            { name: 'Home', href: '/employee', icon: Home },
            { name: 'Time Off', href: '/employee/time-off', icon: CalendarOff },
            { name: 'Briefing', href: '/employee/briefings', icon: PlayCircle },
            { name: 'Schedule', href: '/employee/schedule', icon: Calendar },
            { name: 'Pay', href: '/employee/pay', icon: DollarSign },
          ].map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href !== '/employee' && pathname?.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex flex-col items-center gap-0.5 px-2 py-1.5 rounded-lg text-[10px] transition-all',
                  isActive ? 'font-semibold' : 'text-slate-400',
                )}
                style={isActive ? { color: 'var(--brand-primary)' } : undefined}
              >
                <item.icon className={cn('w-5 h-5', isActive && 'scale-110')} />
                {item.name}
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
