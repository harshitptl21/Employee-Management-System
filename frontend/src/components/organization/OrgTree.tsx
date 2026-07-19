'use client';

import Link from 'next/link';
import { OrgNode } from '@/types';

export function OrgTree({ nodes }: { nodes: OrgNode[] }) {
  return (
    <div className="flex gap-10 overflow-x-auto pb-6">
      {nodes.map((node) => (
        <OrgTreeNode key={node.id} node={node} isRoot />
      ))}
    </div>
  );
}

function OrgTreeNode({ node, isRoot }: { node: OrgNode; isRoot?: boolean }) {
  const hasReports = node.reports.length > 0;

  return (
    <div className="flex flex-col items-center">
      <NodeCard node={node} />

      {hasReports && (
        <div className="relative mt-0 flex flex-col items-center">
          {/* vertical trunk from parent down to the horizontal rail */}
          <div className="h-6 w-px bg-line dark:bg-line-dark" />

          <div className="relative flex gap-8">
            {/* horizontal rail connecting all siblings */}
            {node.reports.length > 1 && (
              <div className="absolute left-0 right-0 top-0 h-px bg-line dark:bg-line-dark" />
            )}
            {node.reports.map((child) => (
              <div key={child.id} className="flex flex-col items-center">
                <div className="h-6 w-px bg-line dark:bg-line-dark" />
                <OrgTreeNode node={child} />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function NodeCard({ node }: { node: OrgNode }) {
  return (
    <Link
      href={`/employees/${node.id}`}
      className="card flex w-48 flex-col gap-1 px-4 py-3 transition-colors hover:border-brand-400"
    >
      <p className="truncate text-sm font-semibold text-ink dark:text-slate-50">{node.name}</p>
      <p className="truncate text-xs text-slate-500 dark:text-slate-400">{node.designation ?? '—'}</p>
      <div className="mt-1 flex items-center justify-between">
        <span className="badge-code">{node.employeeCode}</span>
        {node.reports.length > 0 && (
          <span className="text-[11px] font-medium text-brand-600 dark:text-brand-400">
            {node.reports.length} report{node.reports.length > 1 ? 's' : ''}
          </span>
        )}
      </div>
    </Link>
  );
}
