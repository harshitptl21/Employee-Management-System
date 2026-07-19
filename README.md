# Employee Management System (EMS)

A production-style Employee Management System with secure authentication, role-based access control (RBAC), employee CRUD, organizational hierarchy management, search/filter/sort, and a responsive dashboard.
- ✅ Cloud deployment — https://employee-management-system-dha0.onrender.com
> Make sure that https://employee-management-system-backend-ku90.onrender.com/health is active.

**Live-in-repo stack**

| Layer          | Technology                                                                 |
|----------------|-----------------------------------------------------------------------------|
| Frontend       | Next.js 14 (App Router) · TypeScript · Tailwind CSS                        |
| Backend        | Node.js · Express.js · TypeScript                                          |
| Database       | PostgreSQL · Prisma ORM                                                    |
| Auth           | JWT (short-lived access token + rotating httpOnly refresh token) · bcrypt  |
| Containerization | Docker · Docker Compose                                                  |
| Testing        | Jest (backend unit tests)                                                  |

---

## Table of contents

1. [Features](#features)
2. [Architecture](#architecture)
3. [Project structure](#project-structure)
4. [Getting started](#getting-started)
   - [Option A — Docker Compose](#option-a--docker-compose-recommended)
   - [Option B — Run locally](#option-b--run-locally)
5. [Seed accounts](#seed-accounts)
6. [Environment variables](#environment-variables)
7. [Role vs. Department vs. Designation](#role-vs-department-vs-designation)
8. [Role-based access control matrix](#role-based-access-control-matrix)
9. [API documentation](#api-documentation)
10. [Organizational hierarchy rules](#organizational-hierarchy-rules)
11. [Testing](#testing)
12. [Design decisions & assumptions](#design-decisions--assumptions)
13. [Known limitations](#known-limitations)
14. [Sample Images](./img/)
---

## Features

- **Authentication** — login/logout, bcrypt password hashing, short-lived JWT access tokens with a rotating refresh token stored in an httpOnly cookie, protected routes on both frontend and backend, brute-force login rate limiting.
- **RBAC** — three roles (`SUPER_ADMIN`, `HR_MANAGER`, `EMPLOYEE`) enforced at the middleware layer on every route, not just in the UI.
- **Employee management** — full CRUD with employee code, contact info, department, designation, salary, joining date, status, role, reporting manager, and a profile photo upload (see below).
- **Organizational hierarchy** — assign/reassign a reporting manager, view the full org tree, view an employee's direct reports, and automatic **circular-reporting prevention**.
- **Search, filter, sort, pagination** — search by name/email, filter by department/role/status, sort by name or joining date, server-side pagination.
- **Validation** — Zod schemas validate every request on the backend (email format, phone format, non-negative salary, required fields); the React forms mirror the same constraints (`required`, `type`, `minLength`, etc.) on the frontend.
- **Bonus features implemented**
  - ✅ Pagination
  - ✅ Soft delete (employees are deactivated, not destroyed; direct reports are automatically re-parented to the deleted employee's manager)
  - ✅ CSV import (bulk-create employees from a CSV file, with per-row error reporting)
  - ✅ Dashboard charts (department headcount pie chart via Recharts)
  - ✅ Dark mode (persisted, system-preference aware)
  - ✅ Docker + Docker Compose (Postgres + backend + frontend)
  - ✅ Unit tests (Jest — password hashing, JWT, RBAC middleware, circular-reporting detection, validators)
  - ✅ Cloud deployment — https://employee-management-system-vitf.onrender.com

---

## Architecture

```
┌───────────────────┐         HTTPS / JSON         ┌──────────────────────┐        SQL         ┌──────────────┐
│   Next.js SPA     │ ───────────────────────────▶ │   Express REST API   │ ─────────────────▶ │  PostgreSQL  │
│ (React + Tailwind)│ ◀─────────────────────────── │ (TypeScript, Prisma) │ ◀───────────────── │              │
└───────────────────┘  Bearer JWT + refresh cookie └──────────────────────┘                    └──────────────┘
```

**Backend layering** (`backend/src`):

```
routes/       → wires URL + HTTP verb + middleware (auth, rbac, validation) to a controller
controllers/  → thin HTTP layer: parse request, call a service, shape the response
services/     → business logic (RBAC rule enforcement, cycle detection, pagination, etc.)
validators/   → Zod schemas — one source of truth for request validation
middleware/   → authenticate (JWT), authorize/authorizeSelfOrRoles (RBAC), validate, errorHandler
utils/        → jwt signing/verification, password hashing, ApiError, catchAsync
config/       → env loading, Prisma client singleton
```

This keeps controllers free of business logic and makes services independently unit-testable (see `tests/organization.service.test.ts`, which mocks Prisma entirely).

---

## Project structure

```
ems/
├── backend/
│   ├── src/
│   │   ├── app.ts, server.ts        # Express app + bootstrap
│   │   ├── config/                  # env.ts, db.ts (Prisma singleton)
│   │   ├── middleware/               # auth, rbac, validate, errorHandler
│   │   ├── controllers/              # auth, employee, organization
│   │   ├── services/                 # auth, employee, organization, csvImport, photo
│   │   ├── validators/               # zod schemas
│   │   ├── routes/                   # auth, employee, organization, dashboard
│   │   ├── utils/                    # ApiError, catchAsync, jwt, password
│   │   └── types/                    # shared TS types
│   ├── prisma/
│   │   ├── schema.prisma             # Employee + RefreshToken models
│   │   └── seed.ts                   # creates Super Admin + sample org
│   ├── uploads/                      # profile photos, <employeeId>.png (gitignored, Docker volume)
│   ├── tests/                        # Jest unit tests
│   ├── Dockerfile
│   └── .env.example
├── frontend/
│   ├── src/
│   │   ├── app/                      # Next.js App Router pages
│   │   │   ├── login/
│   │   │   └── (dashboard)/          # protected route group (sidebar shell)
│   │   │       ├── dashboard/
│   │   │       ├── employees/ [id] / new/
│   │   │       └── organization/
│   │   ├── components/               # ui, layout, employees, dashboard, organization
│   │   ├── hooks/                    # useAuth, useTheme (React contexts)
│   │   ├── lib/                      # api client (axios + refresh interceptor), utils
│   │   └── types/
│   ├── Dockerfile
│   └── .env.example
├── docker-compose.yml
├── .gitignore
└── README.md
```

---

## Getting started

### Option A — Docker Compose (recommended)

Requires Docker and Docker Compose.

```bash
git clone https://github.com/harshitptl21/Employee-Management-System
cd Employee-Management-System

# 1. Start Postgres + backend + frontend
docker compose up --build

# 2. In a second terminal, seed the database (Super Admin + sample employees)
docker compose exec backend npm run prisma:seed
```

- Frontend: http://localhost:3000
- Backend API: http://localhost:5000/api
- Health check: http://localhost:5000/health

### Option B — Run locally

Requires Node.js 20+, npm, and a running PostgreSQL instance.

```bash
# 1. Backend
cd backend
cp env.example .env        # edit DATABASE_URL to point at your Postgres instance
npm install
npx prisma generate
npx prisma migrate dev --name init
npm run prisma:seed
npm run dev                  # starts on http://localhost:5000

# 2. Frontend (in a second terminal)
cd frontend
cp env.example .env  # NEXT_PUBLIC_API_URL defaults to http://localhost:5000/api
npm install
npm run dev                  # starts on http://localhost:3000
```

---

## Seed accounts

Running `npm run prisma:seed` creates:

| Role         | Email                     | Password       |
|--------------|---------------------------|-----------------|
| Super Admin  | `admin@ems.local`         | `ChangeMe123!`  |
| HR Manager   | `hr.manager@ems.local`    | `Password@123`  |
| Employee     | `eng.manager@ems.local`   | `Password@123`  |
| Employee     | `jane.doe@ems.local`      | `Password@123`  |
| Employee     | `john.smith@ems.local`    | `Password@123`  |

(Credentials are also configurable via `SEED_SUPER_ADMIN_EMAIL` / `SEED_SUPER_ADMIN_PASSWORD` in `.env`.) **Change these before any real deployment.**

---

## Environment variables

### `backend/.env`

| Variable                  | Description                                              | Default (dev)                     |
|----------------------------|-----------------------------------------------------------|------------------------------------|
| `NODE_ENV`                 | `development` \| `production` \| `test`                   | `development`                      |
| `PORT`                     | API port                                                   | `5000`                             |
| `CLIENT_ORIGIN`            | Allowed CORS origin (the frontend URL)                     | `http://localhost:3000`            |
| `DATABASE_URL`             | PostgreSQL connection string                                | —                                   |
| `JWT_ACCESS_SECRET`        | Secret for signing access tokens                            | —                                   |
| `JWT_REFRESH_SECRET`       | Secret for signing refresh tokens                            | —                                   |
| `JWT_ACCESS_EXPIRES_IN`    | Access token TTL                                             | `15m`                              |
| `JWT_REFRESH_EXPIRES_IN`   | Refresh token TTL                                             | `7d`                               |
| `BCRYPT_SALT_ROUNDS`       | bcrypt cost factor                                            | `12`                               |
| `SEED_SUPER_ADMIN_EMAIL`   | Email used by the seed script                                 | `admin@ems.local`                  |
| `SEED_SUPER_ADMIN_PASSWORD`| Password used by the seed script                               | `ChangeMe123!`                     |

### `frontend/.env.local`

| Variable               | Description                | Default                          |
|--------------------------|-----------------------------|-----------------------------------|
| `NEXT_PUBLIC_API_URL`   | Base URL of the backend API  | `http://localhost:5000/api`       |

---

## Role vs. Department vs. Designation

These three fields look similar on the Employee form but control completely different things, and mixing them up is the most common source of confusion:

| Field | What it actually is | Example values | Effect on permissions |
|---|---|---|---|
| **Role** | The employee's *system access level* — a fixed enum (`SUPER_ADMIN`, `HR_MANAGER`, `EMPLOYEE`) | `HR_MANAGER` | **Directly controls what they can do** — see the RBAC matrix below. Only a Super Admin can set this, and only to `EMPLOYEE` if the setter is HR. |
| **Department** | The organizational/business unit they belong to — free text | `Human Resources`, `Engineering`, `Sales` | **None.** Purely descriptive/organizational. Used for filtering and the dashboard's department count — never checked by any permission logic. |
| **Designation** | Their job title — free text | `HR Manager`, `Software Engineer`, `Account Executive` | **None.** Purely descriptive. Shown on their profile and org chart card — never checked by any permission logic. |

**Concretely:** an employee can have Designation = `"HR Manager"` and Department = `"Human Resources"` while their system Role is still `EMPLOYEE` — meaning they show up with that job title everywhere in the UI, but can only view/edit their *own* profile, exactly like any other employee. The reverse is also possible: someone with system Role `HR_MANAGER` (full HR permissions across the app) could have Designation = `"People Ops Lead"` and Department = `"Operations"`. **The Role field is the only one of the three that the backend's RBAC middleware ever reads.**

## Role-based access control matrix

| Action                                   | Super Admin | HR Manager | Employee (self) |
|-------------------------------------------|:-----------:|:----------:|:----------------:|
| Login / logout                            | ✅          | ✅         | ✅               |
| View employee directory / search / filter | ✅          | ✅         | ❌ (own profile only) |
| View own profile                          | ✅          | ✅         | ✅               |
| View another employee's profile           | ✅          | ✅         | ❌               |
| Create employee                           | ✅          | ✅ (Employee role only) | ❌ |
| Assign `SUPER_ADMIN` role                 | ✅          | ❌         | ❌               |
| Assign `HR_MANAGER` role                  | ✅          | ❌         | ❌               |
| Edit any employee (all fields)            | ✅          | ✅ (cannot touch other Super Admins; cannot change anyone's role to HR Manager/Super Admin) | ❌ |
| Edit own profile (phone, photo, password only) | ✅ (as self) | ✅ (as self) | ✅          |
| Upload/change a profile photo             | ✅ (any)    | ✅ (any)   | ✅ (own only)    |
| Delete (soft-delete) an employee          | ✅          | ❌         | ❌               |
| View dashboard stats                      | ✅          | ✅         | ❌               |
| View org tree                             | ✅          | ✅         | ❌               |
| View an employee's direct reports         | ✅          | ✅         | ✅ (own reports only) |
| Reassign reporting manager                | ✅          | ❌         | ❌               |
| CSV import                                | ✅          | ✅         | ❌               |

This matrix is enforced by the `authorize()` / `authorizeSelfOrRoles()` middleware on every backend route (see `src/middleware/rbac.ts`) — the frontend's role checks are a UX convenience only, never the source of truth.

---

## API documentation

Base URL: `http://localhost:5000/api`

All authenticated endpoints require an `Authorization: Bearer <accessToken>` header. The refresh token is delivered as an httpOnly cookie on `/api/auth/*` and is never exposed to JavaScript.

Standard response envelope:

```json
{ "success": true, "data": { ... }, "message": "optional" }
```

Paginated list responses:

```json
{ "success": true, "data": [ ... ], "meta": { "total": 42, "page": 1, "limit": 10, "totalPages": 5 } }
```

Error responses:

```json
{ "success": false, "message": "Human-readable error", "details": [ /* optional validation errors */ ] }
```

Validation failures (`400` from a Zod schema) always include `details`, a per-field breakdown:

```json
{
  "success": false,
  "message": "Validation failed",
  "details": [{ "path": "body.phone", "message": "Invalid phone number" }]
}
```

The frontend's `getErrorMessage()` helper (`lib/utils.ts`) reads this `details` array and shows the specific field + reason (e.g. "phone: Invalid phone number") instead of the generic top-level `message` — every form on the frontend uses it rather than displaying `message` directly.

### Auth

#### `POST /api/auth/login`
Authenticates a user and returns an access token; sets the refresh token as an httpOnly cookie.

Request body:
```json
{ "email": "admin@ems.local", "password": "ChangeMe123!" }
```

Response `200`:
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "accessToken": "eyJhbGciOi...",
    "employee": { "id": "...", "employeeCode": "EMP-0001", "name": "System Administrator", "role": "SUPER_ADMIN", "...": "..." }
  }
}
```
Rate-limited to 20 attempts / 15 minutes per IP.

#### `POST /api/auth/refresh`
Exchanges the httpOnly refresh cookie for a new access token. No body required.

Response `200`: `{ "success": true, "data": { "accessToken": "..." } }`

#### `POST /api/auth/logout`
Revokes the current refresh token and clears the cookie.

#### `GET /api/auth/me`
Returns the decoded JWT payload for the current session. Requires `Authorization` header.

---

### Employees

#### `GET /api/employees`
*Roles: Super Admin, HR Manager.*

Query parameters (all optional):

| Param       | Type   | Notes                                   |
|-------------|--------|-------------------------------------------|
| `search`    | string | matches name or email (case-insensitive)  |
| `department`| string | exact match                                |
| `role`      | enum   | `SUPER_ADMIN` \| `HR_MANAGER` \| `EMPLOYEE` |
| `status`    | enum   | `ACTIVE` \| `INACTIVE`                     |
| `sortBy`    | enum   | `name` \| `joiningDate`                    |
| `sortOrder` | enum   | `asc` \| `desc`                            |
| `page`      | number | default `1`                                |
| `limit`     | number | default `10`, max `100`                    |

Example: `GET /api/employees?search=jane&department=Engineering&sortBy=joiningDate&sortOrder=desc&page=1&limit=10`

#### `GET /api/employees/:id`
*Roles: Super Admin, HR Manager, or the employee viewing their own record.*

#### `POST /api/employees`
*Roles: Super Admin, HR Manager (HR cannot set `role` to anything other than `EMPLOYEE`).*

Request body:
```json
{
  "name": "Jane Doe",
  "email": "jane.doe@company.com",
  "password": "TempPassw0rd!",
  "phone": "+15551234567",
  "department": "Engineering",
  "designation": "Software Engineer",
  "salary": 85000,
  "joiningDate": "2024-09-10",
  "status": "ACTIVE",
  "role": "EMPLOYEE",
  "managerId": "5b1c...-uuid"
}
```
Only `name`, `email`, and `password` are required. Response `201` returns the created employee (password excluded).

#### `PUT /api/employees/:id`
*Roles: Super Admin, HR Manager (full field access, subject to the RBAC matrix) — **or** the employee editing their own record with a restricted field set: `phone`, `profileImageUrl`, `password` only.* Attempting to change `managerId` here also runs the circular-reporting check.

For nullable fields (`phone`, `department`, `designation`, `salary`, `joiningDate`, `profileImageUrl`, `managerId`), the request body distinguishes three states:
- **Key omitted** — leave the field unchanged.
- **Key present, value `null`** — clear the field.
- **Key present, real value** — validate and update it (e.g. `phone` must still match a valid format; an empty string `""` is never valid — send `null` to clear it, not `""`).

#### `DELETE /api/employees/:id`
*Role: Super Admin only.* Soft-deletes the employee (`isDeleted = true`, `status = INACTIVE`); their direct reports are automatically re-parented to the deleted employee's own manager so the org tree stays connected. Super Admin accounts cannot be deleted.

#### `POST /api/employees/import`
*Roles: Super Admin, HR Manager.* Multipart form upload, field name `file`, CSV with header row:
```
name,email,phone,department,designation,salary,joiningDate,status
```
Rows with a missing name/email or a duplicate email are skipped and reported; imported employees get a default temporary password (`Welcome@123`) and the `EMPLOYEE` role. A ready-to-use example file is included at [`sample-data/sample-employees.csv`](./sample-data/sample-employees.csv) — it's also downloadable from the Employees page itself ("Download sample CSV" button next to "Import CSV"). Response:
```json
{ "success": true, "data": { "successCount": 8, "failedRows": [{ "row": 4, "email": "x@y.com", "error": "email already exists" }] } }
```

#### `GET /api/employees/:id/reportees`
*Roles: Super Admin, HR Manager, or self.* Returns the employee's direct reports.

#### `PATCH /api/employees/:id/manager`
*Role: Super Admin only.* Reassigns an employee's reporting manager.

```json
{ "managerId": "uuid-of-new-manager" }
```
Returns `400` if the assignment would create a circular reporting relationship, if the employee would report to themselves, or if `managerId` doesn't exist.

#### `POST /api/employees/:id/photo`
*Roles: Super Admin, HR Manager, or the employee uploading their own photo.* Multipart form upload, field name `photo`. Accepts PNG, JPEG, WEBP, or GIF (max 5MB).

The image is decoded, center-cropped to a 512×512 square, and re-encoded as PNG regardless of the original format — then saved to `<uploadsDir>/<employeeId>.png`. Re-uploading overwrites the same file, so there's never more than one photo per employee and no filename to track. The employee's `profileImageUrl` is set to the relative path `/uploads/<employeeId>.png`, served statically at that path (not under `/api`). Response `200` returns the updated employee record.

Returns `400` if the file isn't a valid, decodable image.

---

### Organization

#### `GET /api/organization/tree`
*Roles: Super Admin, HR Manager.* Returns the full org chart as a nested tree starting from all top-level (manager-less) employees:
```json
{
  "success": true,
  "data": [
    {
      "id": "...", "employeeCode": "EMP-0001", "name": "System Administrator",
      "designation": "Super Admin", "department": "Administration",
      "reports": [ { "id": "...", "name": "Priya Sharma", "reports": [ /* nested */ ] } ]
    }
  ]
}
```

---

### Dashboard

#### `GET /api/dashboard/stats`
*Roles: Super Admin, HR Manager.*
```json
{ "success": true, "data": { "totalEmployees": 42, "activeEmployees": 39, "inactiveEmployees": 3, "departmentCount": 6 } }
```

---

### Health

#### `GET /health`
Unauthenticated liveness check for load balancers / container orchestrators.

---

## Organizational hierarchy rules

- Every employee optionally has one `managerId` (self-referential relation in `Employee`).
- **Circular reporting is prevented** by `wouldCreateCycle()` (`src/services/organization.service.ts`): before any manager assignment, the service walks up the *proposed* manager's chain; if it ever reaches the employee being reassigned, the request is rejected with `400`. This is unit-tested against direct cycles, multi-level cycles, and normal valid reassignments (`tests/organization.service.test.ts`).
- An employee can never be set as their own manager (checked explicitly, independent of the cycle walk).
- The org tree endpoint builds the whole tree in a single query (`O(n)`) rather than recursively querying per node, so it stays fast even on large org charts.
- Soft-deleting a manager automatically re-parents their direct reports to *that manager's* manager, so no employee is ever left pointing at a deleted record.

---

## Testing

```bash
cd backend
npm test
```

Covers: bcrypt hashing round-trips, JWT sign/verify (including tampered-token rejection), the `authorize` / `authorizeSelfOrRoles` RBAC middleware (role-allowed, role-denied, self-access, unauthenticated), circular-reporting detection (direct cycle, multi-level cycle, valid reassignment, no-manager case) with Prisma fully mocked, and the Zod employee-validation schema (email, phone, salary, password length).

---

## Design decisions & assumptions

- **PostgreSQL + Prisma** was chosen over MongoDB because the domain is inherently relational (a self-referencing employee → manager tree, unique emails, foreign-key integrity on soft-delete re-parenting), and Prisma's typed client + migrations are a strong fit for a TypeScript backend.
- **Refresh tokens are stored server-side (hashed)**, not just signed and trusted, so logout actually revokes access rather than just deleting a client-side cookie.
- **Reassigning a reporting manager** (`PATCH /employees/:id/manager`) is restricted to Super Admin only, matching the spec's "Super Admin: assign roles/managers" line, even though `managerId` can also be *set* by HR/Super Admin at creation/edit time as part of onboarding a new hire.
- **Employee self-service edits** are handled by a separate, narrower Zod schema (`updateOwnProfileSchema`) and a separate service function (`updateOwnProfile`), rather than trusting the client to omit restricted fields — this is enforced server-side even if the frontend were bypassed.
- **Clearing a field vs. leaving it unchanged vs. an invalid value are three distinct states**, not two. `PUT /employees/:id` treats an omitted key as "unchanged," an explicit `null` as "clear this field," and a present-but-invalid value (like `phone: ""`) as a genuine validation error — it does **not** treat `""` as a synonym for "clear," because that would make an empty string simultaneously valid-when-clearing and invalid-everywhere-else for the same field, which is confusing to reason about from either side of the API. The Zod schemas are `.nullable()` (not just `.optional()`) on every nullable DB column for exactly this reason; `createEmployeeSchema` deliberately only has `.optional()` (no `.nullable()`) since there's no "existing value" to clear on creation.
- **CSV import** assigns a temporary shared password and the `EMPLOYEE` role to every imported row; production systems would typically follow up with an email invite / forced password reset flow, which is out of scope here.
- **Profile photos are named `<employeeId>.png` on disk** rather than a generated/random filename — the employee id is already unique and stable, so this gives a predictable, collision-free path (`/uploads/<id>.png`) without needing to store a filename in the database at all; re-uploading simply overwrites the same file. The upload is decoded and re-encoded with `sharp` (not saved as-is) so the stored file is *always* a real 512×512 PNG regardless of what format was uploaded — a `.png` extension on an unconverted JPEG would be a lie the browser would happily believe until it didn't. In Docker, `<uploadsDir>` is a named volume (`ems_uploads`) so photos survive container restarts/rebuilds.

## Known limitations

- Profile photos are stored on local disk (or a Docker named volume), not an object store like S3/Cloudinary — fine for a single-instance deployment, but a multi-instance/horizontally-scaled deployment would need shared or cloud storage instead.
- Email sending (welcome emails, password reset) is not implemented — the spec didn't require it, but it's the natural next step for the CSV import and password reset UX.
