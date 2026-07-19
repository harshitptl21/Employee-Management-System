import { cn } from '@/lib/utils';
import { EmployeeStatus } from '@/types';

export function StatusBadge({ status }: { status: EmployeeStatus }) {
  const isActive = status === 'ACTIVE';
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-badge px-2 py-0.5 text-xs font-medium',
        isActive
          ? 'bg-signal-green-bg text-signal-green'
          : 'bg-signal-red-bg text-signal-red',
      )}
    >
      <span className={cn('h-1.5 w-1.5 rounded-full', isActive ? 'bg-signal-green' : 'bg-signal-red')} />
      {isActive ? 'Active' : 'Inactive'}
    </span>
  );
}
