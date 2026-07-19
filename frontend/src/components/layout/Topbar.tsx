'use client';

import { usePathname } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { useTheme } from '@/hooks/useTheme';

const ROLE_LABELS: Record<string, string> = {
  SUPER_ADMIN: 'Super Admin',
  HR_MANAGER: 'HR Manager',
  EMPLOYEE: 'Employee',
};

const TITLES: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/employees': 'Employees',
  '/organization': 'Org Chart',
};

function resolveTitle(pathname: string | null, ownProfilePath: string | null): string {
  if (!pathname) return 'EMS';
  if (TITLES[pathname]) return TITLES[pathname];
  if (pathname.startsWith('/employees/new')) return 'Add Employee';
  if (ownProfilePath && pathname === ownProfilePath) return 'My Profile';
  if (pathname.startsWith('/employees/')) return 'Employee Profile';
  return 'EMS';
}

export function Topbar({ onMenuClick }: { onMenuClick: () => void }) {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const pathname = usePathname();
  const title = resolveTitle(pathname, user ? `/employees/${user.sub}` : null);

  return (
    <header className="flex h-16 items-center justify-between gap-3 border-b border-line bg-surface px-4 dark:border-line-dark dark:bg-surface-dark sm:px-6">
      <div className="flex min-w-0 items-center gap-3">
        <button
          type="button"
          onClick={onMenuClick}
          aria-label="Open menu"
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-badge text-slate-600 hover:bg-slate-50 dark:text-slate-400 dark:hover:bg-white/5 lg:hidden"
        >
          <MenuIcon className="h-5 w-5" />
        </button>
        <h1 className="truncate text-base font-semibold text-ink dark:text-slate-50 sm:text-lg">{title}</h1>
      </div>

      <div className="flex shrink-0 items-center gap-2 sm:gap-3">
        {user && (
          <span className="badge-code hidden sm:inline-flex">{ROLE_LABELS[user.role] ?? user.role}</span>
        )}
        <button
          type="button"
          onClick={toggleTheme}
          aria-label="Toggle dark mode"
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-badge border border-line text-slate-600 transition-colors hover:bg-slate-50 dark:border-line-dark dark:text-slate-400 dark:hover:bg-white/5"
        >
          {theme === 'dark' ? '☀️' : '🌙'}
        </button>
        <button type="button" onClick={() => logout()} className="btn-secondary shrink-0 px-3 sm:px-4">
          Sign out
        </button>
      </div>
    </header>
  );
}

function MenuIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" {...props}>
      <path d="M4 7h16M4 12h16M4 17h16" strokeLinecap="round" />
    </svg>
  );
}
