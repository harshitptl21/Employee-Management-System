export type Role = 'SUPER_ADMIN' | 'HR_MANAGER' | 'EMPLOYEE';
export type EmployeeStatus = 'ACTIVE' | 'INACTIVE';

export interface Employee {
  id: string;
  employeeCode: string;
  name: string;
  email: string;
  phone: string | null;
  department: string | null;
  designation: string | null;
  salary: string | null;
  joiningDate: string | null;
  status: EmployeeStatus;
  role: Role;
  managerId: string | null;
  // Limited to id/name/employeeCode by the backend's select — never salary/email/etc.
  manager: { id: string; name: string; employeeCode: string } | null;
  profileImageUrl: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AuthUser {
  sub: string;
  role: Role;
  email: string;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface DashboardStats {
  totalEmployees: number;
  activeEmployees: number;
  inactiveEmployees: number;
  departmentCount: number;
}

export interface OrgNode {
  id: string;
  employeeCode: string;
  name: string;
  designation: string | null;
  department: string | null;
  reports: OrgNode[];
}
