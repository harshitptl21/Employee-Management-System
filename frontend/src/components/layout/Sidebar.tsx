'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';

const PRIVILEGED_NAV_ITEMS = [
  { href: '/dashboard', label: 'Dashboard', icon: GridIcon },
  { href: '/employees', label: 'Employees', icon: PeopleIcon },
  { href: '/organization', label: 'Org Chart', icon: TreeIcon },
];

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const pathname = usePathname();
  const { profile, user, hasRole } = useAuth();

  // Employees only get "My Profile" — directory/dashboard/org chart are Super Admin / HR only.
  const navItems = hasRole('SUPER_ADMIN', 'HR_MANAGER')
    ? PRIVILEGED_NAV_ITEMS
    : [{ href: `/employees/${user?.sub}`, label: 'My Profile', icon: PeopleIcon }];

  return (
    <>
      {/* Backdrop — only rendered on mobile while the drawer is open */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-ink/40 lg:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 flex w-64 shrink-0 flex-col border-r border-line bg-surface transition-transform duration-200 ease-out dark:border-line-dark dark:bg-surface-dark',
          'lg:static lg:z-auto lg:w-60 lg:translate-x-0',
          isOpen ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        <div className="flex h-16 items-center justify-between gap-2 border-b border-line px-6 dark:border-line-dark">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-badge bg-brand font-mono text-xs font-bold text-white">
              E
            </div>
            <span className="font-mono text-sm tracking-widest text-slate-600 dark:text-slate-400">
              EMS
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close menu"
            className="flex h-8 w-8 items-center justify-center rounded-badge text-slate-500 hover:bg-slate-50 dark:text-slate-400 dark:hover:bg-white/5 lg:hidden"
          >
            <CloseIcon className="h-4 w-4" />
          </button>
        </div>

        <nav className="flex-1 space-y-1 px-3 py-6">
          {navItems.map((item) => {
            const active = pathname === item.href || pathname?.startsWith(item.href + '/');
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center gap-3 rounded-badge px-3 py-2 text-sm font-medium transition-colors',
                  active
                    ? 'bg-brand-50 text-brand-700 dark:bg-brand/15 dark:text-brand-400'
                    : 'text-slate-600 hover:bg-slate-50 dark:text-slate-400 dark:hover:bg-white/5',
                )}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        {profile && (
          <div className="border-t border-line p-4 dark:border-line-dark">
            <p className="truncate text-sm font-medium text-ink dark:text-slate-50">{profile.name}</p>
            <p className="badge-code mt-1">{profile.employeeCode}</p>
          </div>
        )}
      </aside>
    </>
  );
}

function CloseIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" {...props}>
      <path d="M6 6l12 12M18 6L6 18" />
    </svg>
  );
}

function GridIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" {...props}>
      <rect x="3" y="3" width="8" height="8" rx="1.5" />
      <rect x="13" y="3" width="8" height="8" rx="1.5" />
      <rect x="3" y="13" width="8" height="8" rx="1.5" />
      <rect x="13" y="13" width="8" height="8" rx="1.5" />
    </svg>
  );
}
function PeopleIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" {...props}>
      <circle cx="9" cy="8" r="3.2" />
      <path d="M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6" />
      <circle cx="17" cy="8" r="2.5" opacity="0.6" />
      <path d="M15.5 14.2c2.6.4 4.5 2.6 4.5 5.3" opacity="0.6" />
    </svg>
  );
}
function TreeIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" {...props}>
      <circle cx="12" cy="4.5" r="2" />
      <circle cx="5" cy="19" r="2" />
      <circle cx="19" cy="19" r="2" />
      <path d="M12 6.5V11M12 11H5v6M12 11h7v6" />
    </svg>
  );
}
