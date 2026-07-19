import { cn } from '@/lib/utils';

interface StatCardProps {
  label: string;
  value: number;
  accent?: 'brand' | 'green' | 'amber' | 'slate';
  hint?: string;
}

const ACCENTS: Record<NonNullable<StatCardProps['accent']>, string> = {
  brand: 'text-brand-600 bg-brand-50 dark:bg-brand/15 dark:text-brand-400',
  green: 'text-signal-green bg-signal-green-bg dark:bg-signal-green/15',
  amber: 'text-signal-amber bg-signal-amber-bg dark:bg-signal-amber/15',
  slate: 'text-slate-600 bg-slate-100 dark:bg-white/5 dark:text-slate-400',
};

export function StatCard({ label, value, accent = 'brand', hint }: StatCardProps) {
  return (
    <div className="card p-5">
      <div className="flex items-start justify-between">
        <p className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
          {label}
        </p>
        <span className={cn('rounded-badge px-2 py-0.5 font-mono text-[11px]', ACCENTS[accent])}>
          {hint ?? ''}
        </span>
      </div>
      <p className="mt-3 font-mono text-3xl font-semibold text-ink dark:text-slate-50">{value}</p>
    </div>
  );
}
