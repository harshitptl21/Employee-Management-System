'use client';

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { Employee } from '@/types';

const COLORS = ['#2E5EAA', '#1F9D63', '#C97A1A', '#C23B3B', '#5C87C9', '#8B93A1'];

export function DepartmentChart({ employees }: { employees: Employee[] }) {
  const counts = new Map<string, number>();
  for (const emp of employees) {
    const dept = emp.department ?? 'Unassigned';
    counts.set(dept, (counts.get(dept) ?? 0) + 1);
  }
  const data = Array.from(counts.entries()).map(([name, value]) => ({ name, value }));

  if (data.length === 0) {
    return <p className="text-sm text-slate-500">No department data yet.</p>;
  }

  return (
    <ResponsiveContainer width="100%" height={260}>
      <PieChart>
        <Pie data={data} dataKey="value" nameKey="name" innerRadius={55} outerRadius={90} paddingAngle={2}>
          {data.map((entry, index) => (
            <Cell key={entry.name} fill={COLORS[index % COLORS.length]} stroke="none" />
          ))}
        </Pie>
        <Tooltip
          contentStyle={{ borderRadius: 8, border: '1px solid #E2E4E8', fontSize: 12 }}
        />
        <Legend wrapperStyle={{ fontSize: 12 }} />
      </PieChart>
    </ResponsiveContainer>
  );
}
