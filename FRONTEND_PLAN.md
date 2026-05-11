# Multi-Tenant Document Management Frontend Plan

## Project Context

This repository contains a FastAPI backend and an implemented React frontend for a multi-tenant document management system. The backend is mounted under `/api/...` and `app/main.py` is prepared to serve the React production build from `frontend/dist`.

The backend CORS configuration currently allows:

```txt
http://localhost:3000
http://127.0.0.1:3000
```

Because Vite defaults to port `5173`, configure the frontend dev server to run on port `3000`.

## Backend Summary

Main backend stack:

- FastAPI
- MySQL
- Redis cache
- Celery
- Cloudinary file upload
- JWT access tokens and server-side refresh-token session tracking

API base path:

```txt
/api
```

Most JSON endpoints return this shape:

```json
{
  "message": "success message",
  "data": {},
  "error": null
}
```

Some service routes may still return raw objects or streaming responses, so the frontend API client should normalize responses defensively.

## Auth Model

Auth uses bearer access tokens:

```txt
Authorization: Bearer <access_token>
```

Login returns:

```json
{
  "access_token": "...",
  "refresh_token": "...",
  "token_type": "bearer"
}
```

Important endpoints:

```txt
POST   /api/login
POST   /api/refresh
POST   /api/logout
GET    /api/me
GET    /api/admin
DELETE /api/delete?confirm=true
```

Public onboarding endpoints currently in active use:

```txt
POST   /api/signup-company
GET    /api/companies/discover?query=...
POST   /api/join-requests
GET    /api/join-requests              (admin only)
PATCH  /api/join-requests/{id}/approve (admin only)
PATCH  /api/join-requests/{id}/reject  (admin only)
```

Notes:

- `POST /api/signup` is intentionally blocked for direct tenant joining.
- Existing-company onboarding now requires an admin-approved join request.

Access token expiry is short, so the frontend should implement automatic refresh on `401`.

Recommended token storage for this project:

```txt
localStorage.access_token
localStorage.refresh_token
```

## Roles

Backend roles are:

```txt
admin
editor
user
```

Frontend should treat them case-insensitively.

Role permissions:

```txt
ADMIN:
  Full access.
  Can manage company, units, documents, approval/archive/delete, and audit logs.

EDITOR:
  Can create/update units and create/update/upload documents.
  Cannot approve/delete company-level resources.

USER:
  Read-only access for company, units, documents, and own audit logs.
```

## Main API Areas

### Companies

```txt
POST   /api/companies
GET    /api/companies
GET    /api/companies/get-your-company
PATCH  /api/companies/update
DELETE /api/companies/delete?confirm=true
GET    /api/companies/task/{task_id}
```

### Units

```txt
POST   /api/units
GET    /api/units
GET    /api/units/{unit_id}
PATCH  /api/units/{unit_id}
PATCH  /api/units/{unit_id}/archive?cascade=true
PATCH  /api/units/{unit_id}/unarchive
DELETE /api/units/{unit_id}?confirm=true
```

### Documents

```txt
POST   /api/documents/create
GET    /api/documents/list?page=1&limit=10
GET    /api/documents/list?unit_id=...&status=...&type=...&sort_by=created_at&sort_order=desc&archived_docs=false
GET    /api/documents/download?document_id=...&downloadType=PDF
GET    /api/documents/{document_id}
PATCH  /api/documents/{document_id}?action=METADATA
PATCH  /api/documents/{document_id}?action=ARCHIVE
PATCH  /api/documents/{document_id}?action=RESTORE
PATCH  /api/documents/{document_id}/approve
PATCH  /api/documents/{document_id}/archive
POST   /api/documents/upload/{document_id}
DELETE /api/documents/delete/{document_id}?confirm=true
```

Document fields:

```txt
unit_id
title
description
type: POLICY | MANUAL | REPORT
status: DRAFT | APPROVED | ARCHIVED
file_url
is_archived
created_at
updated_at
```

### Audit Logs

```txt
GET  /api/audit-logs/list?page=1&limit=20
GET  /api/audit-logs/list?action=...&user_id=...&entity_id=...
GET  /api/audit-logs/user-audits
POST /api/audit-logs/create
```

## Recent Backend Refactor Notes

Before frontend planning, several backend issues were patched:

- Standardized several company/unit/audit read endpoints to use `api_response(...)`.
- Moved `/api/documents/download` above `/api/documents/{document_id}` so it is not swallowed by the dynamic route.
- Made document download authenticated and tenant-scoped.
- Fixed document download and delete routes to `await` async service calls.
- Fixed document detail cache behavior so cached and uncached responses have the same envelope.
- Fixed `/api/seed-db` inserts for required document/audit/refresh-token foreign keys.
- Verified with `python -m compileall app`.

Live API/database tests were not run because they require the local MySQL/Redis/environment setup.

## Frontend Goal

Maintain and polish a professional, teacher-impressive SaaS-style frontend for the document management system.

The application should feel like a real operational dashboard, not a basic CRUD assignment. It should have polished navigation, clear role-aware controls, clean data tables, upload workflows, confirmations, loading states, empty states, and useful dashboard metrics.

## Landing Page Decision

Yes, include a landing page.

However, the landing page should not be the whole product. It should be a polished first impression and entry point into the app.

Landing page route:

```txt
/
```

Authenticated app route:

```txt
/app
```

Recommended landing page content:

- Product name: `DocuTenant` or `MultiTenant Docs`
- Hero section with a professional document-management visual
- Clear headline about secure multi-tenant document control
- Login and signup buttons
- Feature band:
  - Multi-tenant company/unit organization
  - Role-based document workflows
  - Upload, approve, archive, and audit documents
- Small workflow section:
  - Create company/unit
  - Upload document
  - Approve/archive
  - Track audit logs
- Footer with project/college attribution if desired

Landing page design should be modern and restrained. Avoid a generic template look. The actual app should remain the main experience.

## Recommended Frontend Stack

Use:

```txt
React + Vite
TypeScript
React Router
TanStack Query
Axios
Tailwind CSS
lucide-react
react-hook-form
zod
```

Optional:

```txt
sonner or react-hot-toast for notifications
```

## Frontend Folder Structure

```txt
frontend/
  index.html
  package.json
  vite.config.ts
  tailwind.config.js
  postcss.config.js
  src/
    main.tsx
    app/
      App.tsx
      router.tsx
    api/
      client.ts
      authApi.ts
      companyApi.ts
      unitApi.ts
      documentApi.ts
      auditApi.ts
    components/
      layout/
      ui/
      tables/
      forms/
    features/
      landing/
      auth/
      dashboard/
      companies/
      units/
      documents/
      audits/
      account/
    hooks/
    lib/
    types/
    styles/
      globals.css
```

## Main Routes

```txt
/                  Landing page
/login             Login
/signup            Signup
/app               Dashboard
/app/documents     Documents list
/app/documents/:id Document details
/app/units         Units
/app/company       Company
/app/audits        Audit logs
/app/account       Account
```

## Core Screens

### Landing Page

Purpose:

- Impress before login.
- Explain the system quickly.
- Provide login/signup entry points.

Important:

- Use a real or generated document/dashboard visual.
- Keep hero professional.
- Do not overdo marketing copy.

### Login

Required:

- Email/password
- Loading state
- Error state
- Redirect to `/app` after successful login
- Store access and refresh tokens
- Fetch `/api/me`

### Signup

Recommended:

- Email
- Password
- Role select for join requests
- Company search by name for existing-workspace requests
- Workspace name for first-company onboarding

Current behavior:

- `Create workspace` calls `POST /api/signup-company`
- `Join existing` searches companies and submits `POST /api/join-requests`
- Users cannot log in until a company admin approves the request

### App Shell

Use:

- Left sidebar
- Top bar
- Current company/user indicator
- Logout menu
- Responsive mobile sidebar

Navigation:

```txt
Dashboard
Documents
Units
Company
Audit Logs
Account
```

Show/hide items based on role where appropriate.

### Dashboard

Should include:

- Total documents
- Draft documents
- Approved documents
- Archived documents
- Total units
- Current company name
- Recent audit activity
- Quick actions:
  - New document
  - New unit
  - Upload file

### Documents Page

This is the most important product screen.

Required features:

- Table with document title, type, status, unit, created date, updated date
- Filters:
  - unit
  - status
  - type
  - archived
- Sort controls:
  - created_at
  - updated_at
  - title
  - status
  - type
- Pagination
- Create document modal
- Upload file action
- Approve action for admin
- Archive action for admin
- Delete action for admin
- Download/view PDF action
- Empty state
- Loading skeleton

### Document Detail

Required:

- Document metadata
- Status/type badges
- File/download action
- Edit metadata for draft documents
- Upload file for admin/editor
- Approve/archive buttons based on role

### Units Page

Required:

- List/table of units
- Create unit
- Edit unit
- Archive/unarchive
- Cascade archive checkbox
- Delete confirmation
- Unit detail link or expandable documents summary

### Company Page

Required:

- Current company details
- Users in company
- Units in company
- Admin-only rename company
- Admin-only delete company confirmation

### Audit Logs

Required:

- Admin sees full audit list
- User/editor sees own audit logs
- Filters for admin:
  - action
  - user_id
  - entity_id
- Table with timestamp, action, entity, user

### Account

Required:

- User email
- Role badge
- Company ID
- Logout
- Delete account confirmation

## UI/UX Direction

Design style:

- Professional SaaS dashboard
- Light theme
- Clean typography
- Compact but readable tables
- Subtle borders
- Status badges
- Clear empty states
- Responsive layout

Color direction:

```txt
Base: white / neutral gray
Primary: deep blue or teal
Success: green
Warning: amber
Danger: red
Status draft: gray/blue
Status approved: green
Status archived: amber or neutral
```

Avoid:

- Overly colorful template look
- Huge marketing-only homepage
- Decorative UI that gets in the way
- One-note purple/blue gradient-heavy theme

## API Client Plan

Create one Axios client:

```txt
src/api/client.ts
```

Responsibilities:

- Base URL from `VITE_API_BASE_URL`, default `/api`
- Attach bearer token
- Refresh access token on `401`
- Retry failed request once after refresh
- Clear tokens and redirect to `/login` if refresh fails
- Normalize backend response shape

Environment default:

```txt
VITE_API_BASE_URL=/api
```

During development, if frontend and backend run separately:

```txt
VITE_API_BASE_URL=http://localhost:8000/api
```

## Implementation Status

Completed implementation:

1. Frontend scaffold under `frontend/`
2. Router, auth context, protected routes, and Vite dev setup on port `3000`
3. Landing page
4. Login flow
5. Workspace creation onboarding
6. Existing-company join-request onboarding
7. Protected app shell
8. Dashboard
9. Documents list and detail flows
10. Units page
11. Company page
12. Audit logs
13. Account page
14. Frontend production build verification
15. In-app confirmation modals
16. Toast notifications
17. Skeleton loaders and retry/error states
18. Responsive cleanup for dense table and action layouts
19. End-to-end live onboarding and auth verification
20. Final integrated FastAPI-served frontend verification
21. Cloudinary-backed upload/download verification

## Notes For Next Session

Start by reading this file and then inspect `git status --short` before further changes, because the worktree may contain unrelated local edits.

## Current Frontend Progress

Frontend work is now functionally complete across the planned main routes.

Implemented stack in active use:

```txt
React
Vite
TypeScript
React Router
lucide-react
```

Important active frontend files now include:

```txt
frontend/src/app/App.tsx
frontend/src/context/AuthContext.tsx
frontend/src/components/ProtectedRoute.tsx
frontend/src/components/layout/AppShell.tsx
frontend/src/features/landing/LandingPage.tsx
frontend/src/features/auth/LoginPage.tsx
frontend/src/features/auth/SignupPage.tsx
frontend/src/features/dashboard/DashboardPage.tsx
frontend/src/features/documents/DocumentsPage.tsx
frontend/src/features/documents/DocumentDetailPage.tsx
frontend/src/features/units/UnitsPage.tsx
frontend/src/features/company/CompanyPage.tsx
frontend/src/features/audits/AuditLogsPage.tsx
frontend/src/features/account/AccountPage.tsx
frontend/src/api/client.ts
frontend/src/api/authApi.ts
frontend/src/api/companyApi.ts
frontend/src/api/unitApi.ts
frontend/src/api/documentApi.ts
frontend/src/api/auditApi.ts
frontend/src/lib/authStorage.ts
frontend/src/styles/globals.css
```

## Current Implemented Routes

```txt
/                  Landing page
/login             Login page
/signup            Signup / onboarding page
/app               Protected dashboard page
/app/documents     Protected documents workflow page
/app/documents/:id Protected document detail page
/app/units         Protected units page
/app/company       Protected company page
/app/audits        Protected audit logs page
/app/account       Protected account page
```

Unknown routes redirect to `/`.

## Landing Page Status

Implemented and acceptable as the current entry point.

Current direction:

- Dark professional SaaS/product style
- Full-width hero
- Animated dashboard preview
- Product sections and footer
- Login and signup entry points

## Login Status

Implemented:

- Email/password form
- Loading state
- Error state
- Calls `POST /api/login`
- Saves `access_token` and `refresh_token`
- Redirects to `/app`

Auth infrastructure also includes:

- Bearer token attachment
- `/api/me` bootstrap
- Refresh-token retry on `401`
- Protected routes
- Logout flow

## Signup / Onboarding Status

The original onboarding deadlock has been fixed.

Implemented:

- New company + first admin onboarding via `POST /api/signup-company`
- Existing-company onboarding via admin-approved join requests
- Signup page supports:
  - `Create workspace`
  - `Join existing`

Result:

- First-time users can create a company and its first admin directly
- Existing tenants can request access by company name search and wait for admin approval
- Direct existing-company self-signup is intentionally disabled

Current privacy posture:

- Public company search returns company names only
- Internal company IDs are not exposed through public onboarding search
- Frontend requires at least 3 characters before company discovery search

## App Shell and Dashboard Status

Implemented:

- Sidebar navigation
- Topbar with page title
- User and company indicators
- Logout action
- Responsive mobile sidebar
- Dashboard metrics
- Recent activity
- Recent documents

## Documents Status

Implemented on `/app/documents`:

- Live document listing
- Filters for status, type, unit, archived
- Sort controls
- Pagination
- Create document flow
- Upload file action
- Download file action
- Admin approve action
- Admin archive action
- Admin delete action
- Role-aware action visibility
- Loading / empty / inline feedback states

Implemented on `/app/documents/:id`:

- Document detail fetch
- Metadata view
- Draft metadata editing for admin/editor
- File actions
- Admin approve / restore
- Admin archive

## Units Status

Implemented:

- Company-scoped unit list
- Unit detail
- Create unit
- Rename unit
- Archive with cascade option
- Unarchive
- Admin delete
- Unit-linked document summary

## Company Status

Implemented:

- Current company summary
- Company users list
- Company units list
- Admin join-request review queue
- Admin approve / reject join requests
- Admin rename company
- Admin delete company

## Audit Logs Status

Implemented:

- Admin audit list
- Admin filters for action / user_id / entity_id
- Admin pagination
- User/editor own-audit view
- Role-aware dashboard audit fetch

## Account Status

Implemented:

- User email
- Role badge
- Company ID
- User ID
- Logout
- Delete account

## Backend Fixes Done During Frontend Work

Important backend corrections made while implementing frontend:

- Auth routes now preserve useful `HTTPException` messages
- Public company onboarding route added: `POST /api/signup-company`
- Direct existing-company signup is blocked in favor of join requests
- Public company discovery route added: `GET /api/companies/discover`
- Join-request workflow added:
  - `POST /api/join-requests`
  - `GET /api/join-requests`
  - `PATCH /api/join-requests/{id}/approve`
  - `PATCH /api/join-requests/{id}/reject`
- Alembic migration added for `join_request` table:
  - `d83b0f8f4d2a_add_join_request_table.py`
- Alembic migration added to expand `user.role` enum for `editor`:
  - `e4a1c7d9b2f1_expand_user_role_enum_for_editor.py`
- Document delete confirmation bug fixed
- Unit list is tenant-scoped
- Unit detail is tenant-scoped
- Unit detail cache key includes company context
- Dashboard audit fetch is role-aware through the frontend API layer
- User audit endpoint now returns empty state instead of `404`

## Remaining Frontend Work

There are no major frontend tasks left from this plan.

All originally planned frontend implementation, polish, and QA work is complete for the current scope.

## Known Issues / Follow-Up Notes

Still worth reviewing later:

- Some backend comments or old non-user-facing strings may still contain encoding artifacts
- Public company-name discovery is acceptable for the current build, but invite-code onboarding is the next privacy-hardening option if stricter tenant confidentiality is needed
- Several API routes return `201` for update-style operations where `200` might be more conventional; frontend currently tolerates the live contract, but backend response consistency is still worth normalizing later
- Real secrets are currently being tested through local environment values; keep `.env` out of version control and rotate credentials if they were exposed outside the local machine

## Verification Completed

Completed during implementation:

```powershell
cd frontend
npm run build
```

Completed backend syntax verification:

```powershell
python -m compileall app
```

Extended live environment verification completed on May 11, 2026:

- Confirmed local FastAPI API responds on `http://127.0.0.1:8000/api`
- Confirmed local frontend responds on `http://localhost:3000`
- Confirmed Redis is running locally on `127.0.0.1:6379`
- Confirmed backend health endpoint now passes:
  - `GET /api/health`
- Confirmed the app can run against an isolated QA MySQL instance on `127.0.0.1:3307`
- Confirmed and fixed multiple backend/bootstrap issues discovered during live QA:
  - backend startup hard-failed when `.env` was missing
- Confirmed FastAPI serves the built frontend correctly on:
  - `GET /`
  - `GET /app`
- Confirmed CORS is correct for the development frontend origin:
  - `Origin: http://localhost:3000`
  - preflight `OPTIONS /api/login` returned the expected allow-origin, methods, headers, and credentials settings
- Confirmed live onboarding flow works:
  - create workspace
  - admin login
  - `/api/me`
  - company discovery
  - join request creation
  - admin join-request list
  - admin approval
  - post-approval member login
  - member `/api/me`
- Confirmed pending join-request login is now rejected with a clear approval message:
  - `403 Forbidden`
  - `"Your join request is still pending admin approval."`
- Confirmed document upload/download works with configured Cloudinary credentials:
  - created unit and document
  - uploaded PDF through `POST /api/documents/upload/{document_id}`
  - verified persisted `file_url`
  - downloaded PDF through `GET /api/documents/download?document_id=...&downloadType=PDF`

## Final Status

Frontend plan scope is complete.

Main user-facing areas verified as working:

- Landing page
- Login
- Signup / workspace creation
- Existing-company join request flow
- Protected app shell
- Dashboard
- Documents list and detail pages
- Units page
- Company page
- Audit logs
- Account page
- Auth refresh handling
- FastAPI-served production frontend
- CORS for frontend development origin
- Cloudinary upload/download integration
  - Cloudinary config was mandatory at import time even for non-upload flows
  - database outages surfaced as raw `500` errors instead of a structured `503`
  - Alembic could not create a fresh database from scratch because there was no initial schema migration
  - Alembic migration `b4fcf7e5f35d` altered `user.company_id` before dropping the dependent FK

Live API paths verified successfully so far:

- `GET /api`
- `GET /api/health`
- `POST /api/signup-company`
- `POST /api/signup` correctly blocked for direct tenant joining
- `POST /api/login`
- `GET /api/me`
- `GET /api/companies/discover`
- `POST /api/join-requests`
- pending-user login blocked before approval
- `GET /api/join-requests`
- `PATCH /api/join-requests/{id}/approve`
- approved-user login
- `POST /api/refresh`
- `POST /api/logout`
- refresh token rejected after logout
- repeated logout returns `401`
- `GET /api/companies/get-your-company`
- `PATCH /api/companies/update`
- `POST /api/units`
- `GET /api/units`
- `GET /api/units/{unit_id}`
- `PATCH /api/units/{unit_id}`
- `PATCH /api/units/{unit_id}/archive?cascade=true`
- `PATCH /api/units/{unit_id}/unarchive`
- `DELETE /api/units/{unit_id}`

Verified live onboarding/company state:

- workspace creation succeeds for first admin
- admin login succeeds
- `/api/me` returns expected tenant-scoped user payload
- public company discovery returns company names only
- join request submission succeeds
- admin approval flow creates the user correctly
- approved editor can log in after approval
- company summary reflects renamed company and approved tenant users

Verified live units/company mutation state:

- admin company rename succeeds
- admin unit create succeeds
- editor unit create succeeds
- admin/editor unit list succeeds
- admin/user unit detail succeeds
- editor unit update succeeds
- admin unit archive succeeds
- admin unit unarchive succeeds
- admin unit delete confirmation response succeeds
- admin confirmed unit delete succeeds
- read-only user can list/detail units
- read-only user is blocked from create/update/delete unit actions

Role-enforcement issue found and fixed during units QA:

- editors were incorrectly allowed to archive/unarchive units
- fixed in:
  - `app/routes/unit_routes.py`
- verified live after the fix:
  - editor archive now returns `403`

Current QA environment notes:

- frontend dev server is running on `http://localhost:3000`
- FastAPI is running on `http://127.0.0.1:8000`
- Redis is running on `127.0.0.1:6379`
- isolated QA MySQL is running on `127.0.0.1:3307`
- local `.env` was set for QA to point the backend at the isolated MySQL instance

Additional live API verification completed on May 11, 2026:

- created a fresh QA tenant via `POST /api/signup-company`
- verified public company discovery still returns names only
- verified join-request submit/approve/login flow for:
  - `editor`
  - `user`
- verified document create/list/detail flow for:
  - `admin`
  - `editor`
  - `user` read access
- verified read-only user is blocked from document create
- verified editor can update draft document metadata
- verified document delete confirm probe and confirmed delete
- verified admin audit list works
- verified editor/user are blocked from admin audit list
- verified editor/user own-audit endpoints work
- verified delete-account confirm flow works far enough to block `/api/me`
- verified company delete confirm flow and final tenant cleanup work

New issues found during this QA pass:

- upload/download integration is still not fully verified in the current local env:
  - `POST /api/documents/upload/{document_id}` returns `500`
  - current message is `Error while uploading file`
  - current `.env` leaves `CLOUDINARY_*` unset, so true upload/download verification remains pending until Cloudinary is configured

Follow-up fixes verified live on May 11, 2026:

- fixed document action-role bypass:
  - editor now gets `403` on `PATCH /api/documents/{document_id}?action=ARCHIVE`
  - editor now gets `403` on `PATCH /api/documents/{document_id}?action=RESTORE`
- fixed deleted-user login regression:
  - after `DELETE /api/delete?confirm=true`, deleted user login now fails again
  - current response is `404 Invalid email`
- verified integrated frontend serving from FastAPI build output:
  - `GET /` returns `frontend/dist/index.html`
  - `GET /app` returns SPA fallback `frontend/dist/index.html`
  - built asset serving works from `/assets/...`

Code changes made during QA so far:

- added `.env.example`
- added initial Alembic migration:
  - `2f0d7e1a1b01_create_initial_schema.py`
- updated Alembic chain root:
  - `4e5a88235682_add_columns_to_company_table.py`
- fixed migration FK ordering:
  - `b4fcf7e5f35d_add_is_delete_column_to_user_table.py`
- improved DB connection failure handling:
  - `app/database/db_connection.py`
  - `app/utils/error_hanlder.py`
- relaxed dev startup requirements:
  - `app/utils/config.py`
  - `app/utils/cloudinary_files.py`
- fixed unit archive/unarchive permissions:
  - `app/routes/unit_routes.py`

The frontend dev server is expected to run on:

```txt
http://localhost:3000
```

If the dev server is not running in the next session, start it with:

```powershell
cd frontend
npm run dev
```

## Current Backend Contract Notes For Frontend

Current important contract details:

- New onboarding endpoint is `POST /api/signup-company`
- New onboarding payload requires:
  - `company_name`
  - `email`
  - `password`
- Existing-company direct signup is disabled
- Public company search endpoint is `GET /api/companies/discover?query=...`
  - frontend should require at least 3 characters before search
  - search results expose company names, not internal company IDs
- Join-request creation endpoint is `POST /api/join-requests`
  - payload requires:
    - `company_name`
    - `email`
    - `password`
    - `requested_role`
- Join-request admin review endpoints are:
  - `GET /api/join-requests`
  - `PATCH /api/join-requests/{id}/approve`
  - `PATCH /api/join-requests/{id}/reject`
- Signup password validation currently requires:
  - minimum length `8`
  - maximum length `12`
- Audit routes are role-sensitive:
  - `GET /api/audit-logs/list` is admin-only
  - `GET /api/audit-logs/user-audits` is for non-admin users
- Company detail is normalized in frontend API layer because backend returns:
  - `company id`
  - `company name`
  - `company users`
  - `company units`

## Current Status

As of May 11, 2026, the backend/API QA is mostly complete.

Verified working:

- onboarding via `POST /api/signup-company`
- company discovery via `GET /api/companies/discover`
- join-request submit / approve flow
- pending-user login blocked before approval
- approved editor/user login works
- auth login / refresh / logout behavior
- company fetch / rename / delete
- units create / list / detail / update / archive / unarchive / delete
- unit role enforcement:
  - read-only user blocked from write actions
  - editor blocked from archive/unarchive
- documents create / list / detail / metadata update / approve / archive / delete
- document role enforcement:
  - user blocked from create
  - editor blocked from admin-only archive/restore paths after fix
- delete-account flow:
  - deleted user blocked from `/api/me`
  - deleted user blocked from logging in again after fix
- audit routes:
  - admin list route works
  - non-admin users are blocked from admin list route
  - own-audit route works for non-admin users
- integrated FastAPI serving of built frontend:
  - `GET /`
  - `GET /app`
  - `GET /assets/...`

Still not fully verified:

- document upload with Cloudinary
- document download after a real uploaded file exists
- audit-log content correctness beyond basic route access
- manual frontend role/visibility/responsive behavior

## Remaining Work

Only these items are still left:

1. Cloudinary-backed document file verification
   - add real `CLOUDINARY_CLOUD_NAME`
   - add real `CLOUDINARY_API_KEY`
   - add real `CLOUDINARY_API_SECRET`
   - restart backend
   - verify:
     - `POST /api/documents/upload/{document_id}`
     - `GET /api/documents/download?document_id=...&downloadType=PDF`
   - confirm uploaded file can be downloaded successfully

2. Audit-log content verification
   - verify expected actions are recorded for:
     - join request approval
     - company update/delete
     - unit create/update/archive/unarchive/delete
     - document create/update/approve/archive/delete
     - account delete if applicable
   - verify `user_id`, `entity_id`, and ordering are correct
   - verify admin filters:
     - `action`
     - `user_id`
     - `entity_id`

3. Manual frontend verification
   - onboarding flow in browser
   - admin/editor/user role-based action visibility
   - documents page behavior
   - units page behavior
   - audits page behavior
   - account page behavior
   - responsive layout checks on smaller screens

## Next Session Starting Point

Start here next time:

1. Read this file.
2. Check whether Cloudinary credentials were added to `MultiTenant-Backend/.env`.
3. If Cloudinary credentials exist:
   - restart backend
   - run document upload/download QA first
4. After upload/download passes:
   - run audit-log content verification
5. Then do manual frontend checks if still needed

If Cloudinary credentials do not exist yet:

- skip upload/download
- continue with audit-log content verification
- then manual frontend verification

## Blockers

Current blocker:

- Cloudinary credentials are not configured in `MultiTenant-Backend/.env`
- because of that, upload/download end-to-end verification is intentionally incomplete

## Suggested Resume Prompt

Use this next session:

`Read MultiTenant-Backend/FRONTEND_PLAN.md and continue from the Remaining Work / Next Session Starting Point sections.`

## Later Frontend Slices

After QA:

1. Toast notifications
2. Confirmation modals
3. Skeleton loaders
4. Final responsive polish
5. Final integrated backend/frontend verification
