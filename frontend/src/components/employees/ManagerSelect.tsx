'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { getErrorMessage } from '@/lib/utils';
import { Employee, PaginatedResponse } from '@/types';

interface ManagerSelectProps {
  employeeId: string;
  currentManagerId: string | null;
  onSubmit: (managerId: string) => Promise<void>;
}

export function ManagerSelect({ employeeId, currentManagerId, onSubmit }: ManagerSelectProps) {
  const [options, setOptions] = useState<Employee[]>([]);
  const [selected, setSelected] = useState(currentManagerId ?? '');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        // Excludes the employee themselves; the backend also prevents deeper cycles.
        const res = await api.get<PaginatedResponse<Employee>>('/employees', {
          params: { limit: 100, sortBy: 'name', sortOrder: 'asc' },
        });
        setOptions(res.data.data.filter((e) => e.id !== employeeId));
      } catch {
        setError('Unable to load employee list.');
      } finally {
        setLoading(false);
      }
    })();
  }, [employeeId]);

  useEffect(() => {
    setSelected(currentManagerId ?? '');
  }, [currentManagerId]);

  async function handleSave() {
    setSaving(true);
    setError(null);
    try {
      await onSubmit(selected);
    } catch (err: any) {
      setError(getErrorMessage(err, 'Unable to update reporting manager.'));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <div className="flex flex-wrap gap-2">
        <select
          className="input-field max-w-xs"
          value={selected}
          onChange={(e) => setSelected(e.target.value)}
          disabled={loading}
        >
          <option value="">None (top level)</option>
          {options.map((emp) => (
            <option key={emp.id} value={emp.id}>
              {emp.name} — {emp.designation ?? emp.department ?? emp.employeeCode}
            </option>
          ))}
        </select>
        <button
          className="btn-secondary"
          onClick={handleSave}
          disabled={saving || loading || selected === (currentManagerId ?? '')}
        >
          {saving ? 'Saving…' : 'Update'}
        </button>
      </div>
      {error && <p className="mt-2 text-sm text-signal-red">{error}</p>}
    </div>
  );
}
