import { parse } from 'csv-parse/sync';
import { Role, EmployeeStatus } from '@prisma/client';
import { prisma } from '@/config/db';
import { hashPassword } from '@/utils/password';

export interface CsvImportRow {
  name: string;
  email: string;
  phone?: string;
  department?: string;
  designation?: string;
  salary?: string;
  joiningDate?: string;
  status?: string;
}

export interface CsvImportResult {
  successCount: number;
  failedRows: { row: number; email?: string; error: string }[];
}

/** Header row: name,email,phone,department,designation,salary,joiningDate,status. Bad rows are skipped and reported, not fatal. */
export async function importEmployeesFromCsv(buffer: Buffer): Promise<CsvImportResult> {
  const records: CsvImportRow[] = parse(buffer, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
  });

  const result: CsvImportResult = { successCount: 0, failedRows: [] };
  const defaultPassword = 'Welcome@123';

  let rowIndex = 1;
  for (const record of records) {
    rowIndex += 1;
    try {
      if (!record.name || !record.email) {
        throw new Error('name and email are required');
      }
      const existing = await prisma.employee.findUnique({ where: { email: record.email } });
      if (existing) {
        throw new Error('email already exists');
      }

      const count = await prisma.employee.count();
      const employeeCode = `EMP-${String(count + 1).padStart(4, '0')}`;
      const hashed = await hashPassword(defaultPassword);

      await prisma.employee.create({
        data: {
          employeeCode,
          name: record.name,
          email: record.email,
          password: hashed,
          phone: record.phone,
          department: record.department,
          designation: record.designation,
          salary: record.salary ? Number(record.salary) : undefined,
          joiningDate: record.joiningDate ? new Date(record.joiningDate) : undefined,
          status:
            record.status && record.status.toUpperCase() === 'INACTIVE'
              ? EmployeeStatus.INACTIVE
              : EmployeeStatus.ACTIVE,
          role: Role.EMPLOYEE,
        },
      });

      result.successCount += 1;
    } catch (err) {
      result.failedRows.push({
        row: rowIndex,
        email: record.email,
        error: err instanceof Error ? err.message : 'Unknown error',
      });
    }
  }

  return result;
}
