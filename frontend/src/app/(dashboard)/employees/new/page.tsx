'use client';

import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { api } from '@/lib/api';
import { EmployeeForm, EmployeeFormValues } from '@/components/employees/EmployeeForm';

export default function NewEmployeePage() {
  const { hasRole } = useAuth();
  const router = useRouter();

  async function handleCreate(values: EmployeeFormValues) {
    await api.post('/employees', {
      ...values,
      phone: values.phone || undefined,
      department: values.department || undefined,
      designation: values.designation || undefined,
      salary: values.salary ? Number(values.salary) : undefined,
      joiningDate: values.joiningDate || undefined,
    });
    router.push('/employees');
  }

  if (!hasRole('SUPER_ADMIN', 'HR_MANAGER')) {
    return <p className="text-sm text-signal-red">You do not have permission to add employees.</p>;
  }

  return (
    <div className="max-w-3xl">
      <EmployeeForm
        mode="create"
        isSuperAdmin={hasRole('SUPER_ADMIN')}
        onSubmit={handleCreate}
        submitLabel="Create employee"
      />
    </div>
  );
}
