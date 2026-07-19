'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { DashboardStats, Employee, PaginatedResponse } from '@/types';
import { StatCard } from '@/components/dashboard/StatCard';
import { DepartmentChart } from '@/components/dashboard/DepartmentChart';

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const [statsRes, employeesRes] = await Promise.all([
          api.get<{ data: DashboardStats }>('/dashboard/stats'),
          api.get<PaginatedResponse<Employee>>('/employees', { params: { limit: 100 } }),
        ]);
        setStats(statsRes.data.data);
        setEmployees(employeesRes.data.data);
      } catch {
        setError('Unable to load dashboard data. You may not have permission to view this page.');
      }
    })();
  }, []);

  if (error) {
    return <p className="rounded-badge bg-signal-red-bg px-4 py-3 text-sm text-signal-red">{error}</p>;
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total Employees" value={stats?.totalEmployees ?? 0} accent="brand" />
        <StatCard label="Active" value={stats?.activeEmployees ?? 0} accent="green" hint="ACTIVE" />
        <StatCard label="Inactive" value={stats?.inactiveEmployees ?? 0} accent="amber" hint="INACTIVE" />
        <StatCard label="Departments" value={stats?.departmentCount ?? 0} accent="slate" />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="card p-5 lg:col-span-2">
          <h2 className="text-sm font-semibold text-ink dark:text-slate-50">Headcount by department</h2>
          <div className="mt-4">
            <DepartmentChart employees={employees} />
          </div>
        </div>

        <div className="card p-5">
          <h2 className="text-sm font-semibold text-ink dark:text-slate-50">Recently joined</h2>
          <ul className="mt-4 space-y-3">
            {employees
              .filter((e) => e.joiningDate)
              .sort((a, b) => new Date(b.joiningDate!).getTime() - new Date(a.joiningDate!).getTime())
              .slice(0, 5)
              .map((emp) => (
                <li key={emp.id} className="flex items-center justify-between text-sm">
                  <div>
                    <p className="font-medium text-ink dark:text-slate-50">{emp.name}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">{emp.designation ?? '—'}</p>
                  </div>
                  <span className="badge-code">{emp.employeeCode}</span>
                </li>
              ))}
            {employees.length === 0 && <p className="text-sm text-slate-500">No employees yet.</p>}
          </ul>
        </div>
      </div>
    </div>
  );
}
