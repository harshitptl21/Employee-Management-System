'use client';

import { useState, FormEvent, ReactNode } from 'react';
import { Employee, Role, EmployeeStatus } from '@/types';
import { getErrorMessage } from '@/lib/utils';

export interface EmployeeFormValues {
  name: string;
  email: string;
  password?: string;
  phone?: string;
  department?: string;
  designation?: string;
  salary?: string;
  joiningDate?: string;
  status?: EmployeeStatus;
  role?: Role;
}

interface EmployeeFormProps {
  initial?: Partial<Employee>;
  mode: 'create' | 'edit';
  isSuperAdmin: boolean; // only a Super Admin may assign HR Manager or Super Admin
  onSubmit: (values: EmployeeFormValues) => Promise<void>;
  submitLabel?: string;
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <label className="label-field">{label}</label>
      {children}
    </div>
  );
}

export function EmployeeForm({ initial, mode, isSuperAdmin, onSubmit, submitLabel }: EmployeeFormProps) {
  const [values, setValues] = useState<EmployeeFormValues>({
    name: initial?.name ?? '',
    email: initial?.email ?? '',
    password: '',
    phone: initial?.phone ?? '',
    department: initial?.department ?? '',
    designation: initial?.designation ?? '',
    salary: initial?.salary ?? '',
    joiningDate: initial?.joiningDate ? initial.joiningDate.slice(0, 10) : '',
    status: initial?.status ?? 'ACTIVE',
    role: initial?.role ?? 'EMPLOYEE',
  });
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  function set<K extends keyof EmployeeFormValues>(key: K, value: EmployeeFormValues[K]) {
    setValues((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const payload: EmployeeFormValues = { ...values };
      if (mode === 'edit' && !payload.password) delete payload.password;
      // Non-Super-Admins never submit a role value — avoids a false rejection when HR edits other fields.
      if (!isSuperAdmin) delete payload.role;
      await onSubmit(payload);
    } catch (err: any) {
      setError(getErrorMessage(err, 'Something went wrong. Please check the form.'));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="card space-y-5 p-6">
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <Field label="Full name">
          <input
            required
            className="input-field"
            value={values.name}
            onChange={(e) => set('name', e.target.value)}
          />
        </Field>

        <Field label="Email">
          <input
            required
            type="email"
            className="input-field"
            value={values.email}
            onChange={(e) => set('email', e.target.value)}
            disabled={mode === 'edit'}
          />
        </Field>

        {mode === 'create' && (
          <Field label="Temporary password">
            <input
              required
              type="password"
              minLength={8}
              className="input-field"
              value={values.password}
              onChange={(e) => set('password', e.target.value)}
            />
          </Field>
        )}

        <Field label="Phone">
          <input
            className="input-field"
            placeholder="+15551234567"
            value={values.phone}
            onChange={(e) => set('phone', e.target.value)}
          />
        </Field>

        <Field label="Department">
          <input
            className="input-field"
            value={values.department}
            onChange={(e) => set('department', e.target.value)}
          />
        </Field>

        <Field label="Designation">
          <input
            className="input-field"
            value={values.designation}
            onChange={(e) => set('designation', e.target.value)}
          />
        </Field>

        <Field label="Salary (USD)">
          <input
            type="number"
            min={0}
            className="input-field"
            value={values.salary}
            onChange={(e) => set('salary', e.target.value)}
          />
        </Field>

        <Field label="Joining date">
          <input
            type="date"
            className="input-field"
            value={values.joiningDate}
            onChange={(e) => set('joiningDate', e.target.value)}
          />
        </Field>

        <Field label="Status">
          <select
            className="input-field"
            value={values.status}
            onChange={(e) => set('status', e.target.value as EmployeeStatus)}
          >
            <option value="ACTIVE">Active</option>
            <option value="INACTIVE">Inactive</option>
          </select>
        </Field>

        {isSuperAdmin ? (
          <Field label="Role">
            <select
              className="input-field"
              value={values.role}
              onChange={(e) => set('role', e.target.value as Role)}
            >
              <option value="EMPLOYEE">Employee</option>
              <option value="HR_MANAGER">HR Manager</option>
              <option value="SUPER_ADMIN">Super Admin</option>
            </select>
          </Field>
        ) : (
          mode === 'edit' && (
            <Field label="Role">
              <input
                className="input-field bg-slate-50 text-slate-500 dark:bg-white/5 dark:text-slate-400"
                value={(values.role ?? 'EMPLOYEE').replace('_', ' ')}
                disabled
                title="Only a Super Admin can change an employee's role"
              />
            </Field>
          )
        )}
      </div>

      {error && <p className="rounded-badge bg-signal-red-bg px-3 py-2 text-sm text-signal-red">{error}</p>}

      <button type="submit" disabled={submitting} className="btn-primary">
        {submitting ? 'Saving…' : submitLabel ?? 'Save'}
      </button>
    </form>
  );
}
