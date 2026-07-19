'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';
import { Employee } from '@/types';
import { EmployeeForm, EmployeeFormValues } from '@/components/employees/EmployeeForm';
import { ManagerSelect } from '@/components/employees/ManagerSelect';
import { AvatarUpload } from '@/components/employees/AvatarUpload';
import { StatusBadge } from '@/components/employees/StatusBadge';
import { formatCurrency, formatDate, getErrorMessage } from '@/lib/utils';

export default function EmployeeDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { user, hasRole } = useAuth();

  const [employee, setEmployee] = useState<Employee | null>(null);
  const [reportees, setReportees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const isSelf = user?.sub === id;
  const isPrivileged = hasRole('SUPER_ADMIN', 'HR_MANAGER');
  const isSuperAdmin = hasRole('SUPER_ADMIN');
  const canView = isSelf || isPrivileged;

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get<{ data: Employee }>(`/employees/${id}`);
      setEmployee(res.data.data);

      if (isPrivileged) {
        const reporteesRes = await api.get<{ data: Employee[] }>(`/employees/${id}/reportees`);
        setReportees(reporteesRes.data.data);
      }
    } catch (err: any) {
      if (err?.response?.status === 404) setNotFound(true);
    } finally {
      setLoading(false);
    }
  }, [id, isPrivileged]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleUpdate(values: EmployeeFormValues) {
    // A blank field here means "clear it" — send null explicitly, not
    // undefined (which the backend treats as "leave unchanged").
    await api.put(`/employees/${id}`, {
      ...values,
      phone: values.phone || null,
      department: values.department || null,
      designation: values.designation || null,
      salary: values.salary ? Number(values.salary) : null,
      joiningDate: values.joiningDate || null,
    });
    await load();
  }

  async function handleSelfUpdate(phone: string, password: string) {
    // Phone follows the same "blank = clear" rule as the admin edit form.
    // Password is different: leaving it blank must NOT clear it, so it's
    // only included when the person actually typed a new one.
    const body: Record<string, string | null> = { phone: phone || null };
    if (password) body.password = password;
    await api.put(`/employees/${id}`, body);
    await load();
  }

  async function handleDelete() {
    if (!confirm('Soft-delete this employee? This deactivates their account.')) return;
    try {
      await api.delete(`/employees/${id}`);
      router.push('/employees');
    } catch (err) {
      alert(getErrorMessage(err, 'Unable to deactivate this employee.'));
    }
  }

  async function handleManagerChange(managerId: string) {
    await api.patch(`/employees/${id}/manager`, { managerId: managerId || null });
    await load();
  }

  if (!canView) {
    return <p className="text-sm text-signal-red">You do not have permission to view this profile.</p>;
  }
  if (loading) return <p className="text-sm text-slate-500">Loading…</p>;
  if (notFound || !employee) return <p className="text-sm text-signal-red">Employee not found.</p>;

  return (
    <div className="max-w-4xl space-y-6">
      <div className="card flex flex-wrap items-center justify-between gap-4 p-6">
        <div className="flex items-center gap-4">
          <AvatarUpload employee={employee} canEdit={canView} onUploaded={setEmployee} />
          <div>
            <h2 className="text-lg font-semibold text-ink dark:text-slate-50">{employee.name}</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              {employee.designation ?? '—'} · {employee.department ?? '—'}
            </p>
            <div className="mt-1 flex items-center gap-2">
              <span className="badge-code">{employee.employeeCode}</span>
              <StatusBadge status={employee.status} />
            </div>
          </div>
        </div>
        {isSuperAdmin && employee.role !== 'SUPER_ADMIN' && (
          <button onClick={handleDelete} className="btn-danger">
            Deactivate employee
          </button>
        )}
      </div>

      <dl className="card grid grid-cols-1 gap-4 p-6 sm:grid-cols-3">
        <Field label="Email" value={employee.email} />
        <Field label="Phone" value={employee.phone ?? '—'} />
        <Field label="Department" value={employee.department ?? '—'} />
        <Field label="Designation" value={employee.designation ?? '—'} />
        <Field label="Salary" value={formatCurrency(employee.salary)} mono />
        <Field label="Joining date" value={formatDate(employee.joiningDate)} />
        <Field label="Role" value={employee.role.replace('_', ' ')} />
        <Field label="Reporting manager" value={employee.manager?.name ?? 'None (top level)'} />
      </dl>

      {isPrivileged && (
        <div className="card p-6">
          <h3 className="text-sm font-semibold text-ink dark:text-slate-50">Edit employee</h3>
          <div className="mt-4">
            <EmployeeForm
              mode="edit"
              initial={employee}
              isSuperAdmin={isSuperAdmin}
              onSubmit={handleUpdate}
              submitLabel="Save changes"
            />
          </div>
        </div>
      )}

      {isSelf && !isPrivileged && <SelfEditCard employee={employee} onSubmit={handleSelfUpdate} />}

      {isSuperAdmin && (
        <div className="card p-6">
          <h3 className="text-sm font-semibold text-ink dark:text-slate-50">Reporting manager</h3>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            Only a Super Admin can reassign this employee&apos;s manager. Circular reporting is prevented
            automatically.
          </p>
          <div className="mt-3">
            <ManagerSelect
              employeeId={employee.id}
              currentManagerId={employee.managerId}
              onSubmit={handleManagerChange}
            />
          </div>
        </div>
      )}

      {isPrivileged && (
        <div className="card p-6">
          <h3 className="text-sm font-semibold text-ink dark:text-slate-50">Direct reports</h3>
          {reportees.length === 0 ? (
            <p className="mt-2 text-sm text-slate-500">No direct reports.</p>
          ) : (
            <ul className="mt-3 divide-y divide-line dark:divide-line-dark">
              {reportees.map((r) => (
                <li key={r.id} className="flex items-center justify-between py-2 text-sm">
                  <button
                    className="font-medium text-brand-600 hover:underline"
                    onClick={() => router.push(`/employees/${r.id}`)}
                  >
                    {r.name}
                  </button>
                  <span className="text-xs text-slate-500">{r.designation ?? '—'}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

function Field({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div>
      <dt className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
        {label}
      </dt>
      <dd className={mono ? 'mt-1 font-mono text-sm text-ink dark:text-slate-50' : 'mt-1 text-sm text-ink dark:text-slate-50'}>
        {value}
      </dd>
    </div>
  );
}

function SelfEditCard({
  employee,
  onSubmit,
}: {
  employee: Employee;
  onSubmit: (phone: string, password: string) => Promise<void>;
}) {
  const [phone, setPhone] = useState(employee.phone ?? '');
  const [password, setPassword] = useState('');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function submit() {
    setSaving(true);
    setMessage(null);
    try {
      await onSubmit(phone, password);
      setMessage('Profile updated.');
      setPassword('');
    } catch (err) {
      setMessage(getErrorMessage(err, 'Update failed.'));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="card p-6">
      <h3 className="text-sm font-semibold text-ink dark:text-slate-50">Update your profile</h3>
      <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
        As an employee, you can update your phone number and password. Other fields are managed by HR.
      </p>
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <div>
          <label className="label-field">Phone</label>
          <input className="input-field" value={phone} onChange={(e) => setPhone(e.target.value)} />
        </div>
        <div>
          <label className="label-field">New password</label>
          <input
            type="password"
            className="input-field"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
      </div>
      {message && <p className="mt-3 text-sm text-slate-600 dark:text-slate-400">{message}</p>}
      <button onClick={submit} disabled={saving} className="btn-primary mt-4">
        {saving ? 'Saving…' : 'Save changes'}
      </button>
    </div>
  );
}
