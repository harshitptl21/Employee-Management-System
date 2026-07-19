'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';
import { Employee, PaginatedResponse } from '@/types';
import { StatusBadge } from '@/components/employees/StatusBadge';
import { formatCurrency, formatDate, getErrorMessage } from '@/lib/utils';

const DEBOUNCE_MS = 350;

export default function EmployeesPage() {
  const { hasRole, user } = useAuth();
  const router = useRouter();

  const [employees, setEmployees] = useState<Employee[]>([]);
  const [meta, setMeta] = useState({ total: 0, page: 1, limit: 10, totalPages: 1 });
  const [search, setSearch] = useState('');
  const [department, setDepartment] = useState('');
  const [status, setStatus] = useState('');
  const [role, setRole] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'joiningDate'>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Employees can only see their own profile — redirect them there.
  useEffect(() => {
    if (user && !hasRole('SUPER_ADMIN', 'HR_MANAGER')) {
      router.replace(`/employees/${user.sub}`);
    }
  }, [user, hasRole, router]);

  const fetchEmployees = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get<PaginatedResponse<Employee>>('/employees', {
        params: {
          search: search || undefined,
          department: department || undefined,
          status: status || undefined,
          role: role || undefined,
          sortBy,
          sortOrder,
          page,
          limit: 10,
        },
      });
      setEmployees(res.data.data);
      setMeta(res.data.meta);
    } catch (err) {
      setError(getErrorMessage(err, 'Unable to load employees.'));
    } finally {
      setLoading(false);
    }
  }, [search, department, status, role, sortBy, sortOrder, page]);

  useEffect(() => {
    const t = setTimeout(fetchEmployees, DEBOUNCE_MS);
    return () => clearTimeout(t);
  }, [fetchEmployees]);

  function toggleSort(field: 'name' | 'joiningDate') {
    if (sortBy === field) {
      setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
    setPage(1);
  }

  async function handleImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const formData = new FormData();
    formData.append('file', file);
    try {
      const res = await api.post('/employees/import', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      const { successCount, failedRows } = res.data.data;
      alert(
        `Imported ${successCount} employee(s).` +
          (failedRows.length ? ` ${failedRows.length} row(s) failed — check console for details.` : ''),
      );
      if (failedRows.length) console.warn('CSV import failures:', failedRows);
      fetchEmployees();
    } catch (err) {
      alert(getErrorMessage(err, 'CSV import failed.'));
    } finally {
      e.target.value = '';
    }
  }

  if (user && !hasRole('SUPER_ADMIN', 'HR_MANAGER')) return null;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-1 flex-wrap gap-2">
          <input
            className="input-field w-full sm:w-auto sm:max-w-xs"
            placeholder="Search by name or email…"
            value={search}
            onChange={(e) => {
              setPage(1);
              setSearch(e.target.value);
            }}
          />
          <input
            className="input-field w-full sm:w-auto sm:max-w-[160px]"
            placeholder="Department"
            value={department}
            onChange={(e) => {
              setPage(1);
              setDepartment(e.target.value);
            }}
          />
          <select
            className="input-field w-full sm:w-auto sm:max-w-[140px]"
            value={status}
            onChange={(e) => {
              setPage(1);
              setStatus(e.target.value);
            }}
          >
            <option value="">All statuses</option>
            <option value="ACTIVE">Active</option>
            <option value="INACTIVE">Inactive</option>
          </select>
          <select
            className="input-field w-full sm:w-auto sm:max-w-[160px]"
            value={role}
            onChange={(e) => {
              setPage(1);
              setRole(e.target.value);
            }}
          >
            <option value="">All roles</option>
            <option value="SUPER_ADMIN">Super Admin</option>
            <option value="HR_MANAGER">HR Manager</option>
            <option value="EMPLOYEE">Employee</option>
          </select>
        </div>
        <div className="flex flex-wrap gap-2">
          <a href="/sample-employees.csv" download className="btn-secondary">
            Download sample CSV
          </a>
          <label className="btn-secondary cursor-pointer">
            Import CSV
            <input type="file" accept=".csv" className="hidden" onChange={handleImport} />
          </label>
          <Link href="/employees/new" className="btn-primary">
            + Add Employee
          </Link>
        </div>
      </div>

      <div className="card overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-line text-xs uppercase tracking-wide text-slate-500 dark:border-line-dark dark:text-slate-400">
              <th className="px-4 py-3 font-medium">
                <button onClick={() => toggleSort('name')} className="flex items-center gap-1">
                  Name {sortBy === 'name' && (sortOrder === 'asc' ? '↑' : '↓')}
                </button>
              </th>
              <th className="hidden px-4 py-3 font-medium md:table-cell">Department</th>
              <th className="hidden px-4 py-3 font-medium lg:table-cell">Designation</th>
              <th className="hidden px-4 py-3 font-medium xl:table-cell">Reports To</th>
              <th className="hidden px-4 py-3 font-medium sm:table-cell">Salary</th>
              <th className="hidden px-4 py-3 font-medium md:table-cell">
                <button onClick={() => toggleSort('joiningDate')} className="flex items-center gap-1">
                  Joined {sortBy === 'joiningDate' && (sortOrder === 'asc' ? '↑' : '↓')}
                </button>
              </th>
              <th className="px-4 py-3 font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-slate-500">
                  Loading…
                </td>
              </tr>
            )}
            {!loading && error && (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-signal-red">
                  {error}
                </td>
              </tr>
            )}
            {!loading && !error && employees.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-slate-500">
                  No employees match these filters.
                </td>
              </tr>
            )}
            {!loading &&
              !error &&
              employees.map((emp) => (
                <tr
                  key={emp.id}
                  onClick={() => router.push(`/employees/${emp.id}`)}
                  className="cursor-pointer border-b border-line last:border-0 hover:bg-slate-50 dark:border-line-dark dark:hover:bg-white/5"
                >
                  <td className="px-4 py-3">
                    <p className="font-medium text-ink dark:text-slate-50">{emp.name}</p>
                    <p className="badge-code mt-1">{emp.employeeCode}</p>
                    {/* Compact secondary info shown only when its dedicated column is hidden */}
                    <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 sm:hidden">
                      {formatCurrency(emp.salary)}
                    </p>
                  </td>
                  <td className="hidden px-4 py-3 text-slate-600 dark:text-slate-400 md:table-cell">
                    {emp.department ?? '—'}
                  </td>
                  <td className="hidden px-4 py-3 text-slate-600 dark:text-slate-400 lg:table-cell">
                    {emp.designation ?? '—'}
                  </td>
                  <td className="hidden px-4 py-3 text-slate-600 dark:text-slate-400 xl:table-cell">
                    {emp.manager?.name ?? '—'}
                  </td>
                  <td className="hidden px-4 py-3 font-mono text-xs text-slate-600 dark:text-slate-400 sm:table-cell">
                    {formatCurrency(emp.salary)}
                  </td>
                  <td className="hidden px-4 py-3 text-slate-600 dark:text-slate-400 md:table-cell">
                    {formatDate(emp.joiningDate)}
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={emp.status} />
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between text-sm text-slate-600 dark:text-slate-400">
        <span>
          Page {meta.page} of {meta.totalPages} · {meta.total} total
        </span>
        <div className="flex gap-2">
          <button
            className="btn-secondary"
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            Previous
          </button>
          <button
            className="btn-secondary"
            disabled={page >= meta.totalPages}
            onClick={() => setPage((p) => p + 1)}
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}
