'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';
import { OrgNode } from '@/types';
import { OrgTree } from '@/components/organization/OrgTree';

export default function OrganizationPage() {
  const { hasRole } = useAuth();
  const [tree, setTree] = useState<OrgNode[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await api.get<{ data: OrgNode[] }>('/organization/tree');
        setTree(res.data.data);
      } catch {
        setError('Unable to load the organization chart.');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (!hasRole('SUPER_ADMIN', 'HR_MANAGER')) {
    return <p className="text-sm text-signal-red">You do not have permission to view the org chart.</p>;
  }
  if (loading) return <p className="text-sm text-slate-500">Loading…</p>;
  if (error) return <p className="text-sm text-signal-red">{error}</p>;

  return (
    <div className="card p-6">
      <h2 className="mb-1 text-sm font-semibold text-ink dark:text-slate-50">Reporting structure</h2>
      <p className="mb-6 text-xs text-slate-500 dark:text-slate-400">
        Click any node to open that employee&apos;s profile. Top-level nodes report to no one.
      </p>
      {tree.length === 0 ? (
        <p className="text-sm text-slate-500">No employees to display yet.</p>
      ) : (
        <OrgTree nodes={tree} />
      )}
    </div>
  );
}
