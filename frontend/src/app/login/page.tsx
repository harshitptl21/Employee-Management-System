'use client';

import { FormEvent, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { getErrorMessage } from '@/lib/utils';

export default function LoginPage() {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await login(email, password);
    } catch (err: any) {
      setError(getErrorMessage(err, 'Unable to sign in. Check your credentials.'));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="grid min-h-screen grid-cols-1 lg:grid-cols-2">
      {/* Signature panel: an org-chart trace motif rendered in the brand color */}
      <div className="relative hidden overflow-hidden bg-ink lg:flex lg:flex-col lg:justify-between lg:p-12">
        <OrgTraceMotif />
        <div className="relative z-10">
          <span className="font-mono text-sm tracking-widest text-slate-400">EMS / 01</span>
          <h1 className="mt-4 max-w-sm text-3xl font-semibold leading-tight text-white">
            One record for every person, role, and reporting line.
          </h1>
        </div>
        <p className="relative z-10 max-w-sm text-sm text-slate-400">
          Employee Management System — secure authentication, role-based access, and a live
          organizational chart, in one place.
        </p>
      </div>

      {/* Form panel */}
      <div className="flex items-center justify-center px-6 py-16">
        <div className="w-full max-w-sm">
          <div className="mb-8 lg:hidden">
            <span className="font-mono text-xs tracking-widest text-slate-500">EMS</span>
          </div>
          <h2 className="text-xl font-semibold text-ink dark:text-slate-50">Sign in</h2>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
            Use your work email and password.
          </p>

          <form onSubmit={handleSubmit} className="mt-8 space-y-5">
            <div>
              <label className="label-field" htmlFor="email">
                Email
              </label>
              <input
                id="email"
                type="email"
                required
                autoComplete="email"
                className="input-field"
                placeholder="you@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div>
              <label className="label-field" htmlFor="password">
                Password
              </label>
              <input
                id="password"
                type="password"
                required
                autoComplete="current-password"
                className="input-field"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            {error && (
              <p className="rounded-badge bg-signal-red-bg px-3 py-2 text-sm text-signal-red">{error}</p>
            )}

            <button type="submit" disabled={submitting} className="btn-primary w-full">
              {submitting ? 'Signing in…' : 'Sign in'}
            </button>
          </form>

          <div className="mt-8 rounded-card border border-line bg-slate-50 p-4 text-xs text-slate-600 dark:border-line-dark dark:bg-white/5 dark:text-slate-400">
            <p className="font-medium text-slate-800 dark:text-slate-300">Demo credentials (after seeding)</p>
            <p className="mt-1 font-mono">admin@ems.local / ChangeMe123!</p>
            <p className="font-mono">hr.manager@ems.local / Password@123</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function OrgTraceMotif() {
  // Decorative — echoes the org-chart connector style used in OrgTree.tsx.
  return (
    <svg
      className="pointer-events-none absolute inset-0 h-full w-full opacity-[0.15]"
      viewBox="0 0 500 700"
      fill="none"
      aria-hidden="true"
    >
      <circle cx="250" cy="60" r="5" fill="#5C87C9" />
      <path d="M250 65 V 140" stroke="#5C87C9" strokeWidth="1.5" />
      <path d="M100 140 H 400" stroke="#5C87C9" strokeWidth="1.5" />
      <path d="M100 140 V 220" stroke="#5C87C9" strokeWidth="1.5" />
      <path d="M250 140 V 220" stroke="#5C87C9" strokeWidth="1.5" />
      <path d="M400 140 V 220" stroke="#5C87C9" strokeWidth="1.5" />
      <circle cx="100" cy="225" r="5" fill="#5C87C9" />
      <circle cx="250" cy="225" r="5" fill="#5C87C9" />
      <circle cx="400" cy="225" r="5" fill="#5C87C9" />
      <path d="M40 225 H 160" stroke="#5C87C9" strokeWidth="1.5" />
      <path d="M40 225 V 300" stroke="#5C87C9" strokeWidth="1.5" />
      <path d="M160 225 V 300" stroke="#5C87C9" strokeWidth="1.5" />
      <circle cx="40" cy="305" r="5" fill="#5C87C9" />
      <circle cx="160" cy="305" r="5" fill="#5C87C9" />
    </svg>
  );
}
