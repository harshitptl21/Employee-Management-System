import { PrismaClient, Role, EmployeeStatus } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function hash(pw: string) {
  return bcrypt.hash(pw, 12);
}

async function main() {
  const adminEmail = process.env.SEED_SUPER_ADMIN_EMAIL ?? 'admin@ems.local';
  const adminPassword = process.env.SEED_SUPER_ADMIN_PASSWORD ?? 'ChangeMe123!';

  console.log('Seeding database...');

  const superAdmin = await prisma.employee.upsert({
    where: { email: adminEmail },
    update: {},
    create: {
      employeeCode: 'EMP-0001',
      name: 'System Administrator',
      email: adminEmail,
      password: await hash(adminPassword),
      department: 'Administration',
      designation: 'Super Admin',
      status: EmployeeStatus.ACTIVE,
      role: Role.SUPER_ADMIN,
      joiningDate: new Date(),
    },
  });

  const hrManager = await prisma.employee.upsert({
    where: { email: 'hr.manager@ems.local' },
    update: {},
    create: {
      employeeCode: 'EMP-0002',
      name: 'Priya Sharma',
      email: 'hr.manager@ems.local',
      password: await hash('Password@123'),
      department: 'Human Resources',
      designation: 'HR Manager',
      status: EmployeeStatus.ACTIVE,
      role: Role.HR_MANAGER,
      managerId: superAdmin.id,
      joiningDate: new Date('2023-01-15'),
      salary: 95000,
    },
  });

  const engManager = await prisma.employee.upsert({
    where: { email: 'eng.manager@ems.local' },
    update: {},
    create: {
      employeeCode: 'EMP-0003',
      name: 'Arjun Mehta',
      email: 'eng.manager@ems.local',
      password: await hash('Password@123'),
      department: 'Engineering',
      designation: 'Engineering Manager',
      status: EmployeeStatus.ACTIVE,
      role: Role.EMPLOYEE,
      managerId: superAdmin.id,
      joiningDate: new Date('2022-06-01'),
      salary: 120000,
    },
  });

  await prisma.employee.upsert({
    where: { email: 'jane.doe@ems.local' },
    update: {},
    create: {
      employeeCode: 'EMP-0004',
      name: 'Jane Doe',
      email: 'jane.doe@ems.local',
      password: await hash('Password@123'),
      department: 'Engineering',
      designation: 'Software Engineer',
      status: EmployeeStatus.ACTIVE,
      role: Role.EMPLOYEE,
      managerId: engManager.id,
      joiningDate: new Date('2023-09-10'),
      salary: 85000,
      phone: '+15550101',
    },
  });

  await prisma.employee.upsert({
    where: { email: 'john.smith@ems.local' },
    update: {},
    create: {
      employeeCode: 'EMP-0005',
      name: 'John Smith',
      email: 'john.smith@ems.local',
      password: await hash('Password@123'),
      department: 'Engineering',
      designation: 'QA Engineer',
      status: EmployeeStatus.INACTIVE,
      role: Role.EMPLOYEE,
      managerId: engManager.id,
      joiningDate: new Date('2024-02-20'),
      salary: 78000,
      phone: '+15550102',
    },
  });

  console.log('Seed complete:');
  console.log(`  Super Admin -> ${adminEmail} / ${adminPassword}`);
  console.log(`  HR Manager  -> hr.manager@ems.local / Password@123`);
  console.log(`  Employees   -> eng.manager@ems.local, jane.doe@ems.local, john.smith@ems.local / Password@123`);
  void hrManager;
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
