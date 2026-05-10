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

Remaining implementation/polish:

1. Replace native confirm dialogs with in-app confirmation modals
2. Replace inline success/error banners with toast notifications
3. Add skeleton loaders where pages still use basic spinners
4. Final responsive cleanup for dense action rows and tables
5. End-to-end live integration testing with real local services
6. Final integrated check that FastAPI serves `frontend/dist` correctly

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

There are no major placeholder pages left.

Remaining work is now mostly polish / QA:

1. Replace native browser confirm dialogs with in-app confirmation modals
2. Replace inline success banners with toast notifications
3. Add skeleton loaders where pages still use basic spinners
4. Final responsive cleanup for dense table/action layouts
5. Cross-page UX consistency pass:
   - spacing
   - copy tone
   - empty states
   - mutation feedback
6. Live onboarding QA for join requests and admin approval flow
7. Final integrated backend/frontend verification against real local services

## Known Issues / Follow-Up Notes

Still worth reviewing later:

- Some backend comments or old non-user-facing strings may still contain encoding artifacts
- Dense action rows on smaller screens should be manually tested
- The current frontend uses inline success/error feedback instead of a toast system
- Public company-name discovery is acceptable for the current build, but invite-code onboarding is the next privacy-hardening option if stricter tenant confidentiality is needed
- Several API routes return `201` for update-style operations where `200` might be more conventional; frontend currently tolerates the live contract, but backend response consistency is still worth normalizing later

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

Partially completed live environment verification on May 10, 2026:

- Confirmed local FastAPI API responds on `http://127.0.0.1:8000/api`
- Confirmed local frontend responds on `http://localhost:3000`
- Confirmed required local services were running during the check:
  - MySQL
  - Redis
  - Uvicorn
- Confirmed and fixed two live schema/runtime issues discovered during real API testing:
  - missing `join_request` table before running Alembic upgrade
  - missing `editor` value in live `user.role` enum before running the follow-up Alembic upgrade

Live API paths verified successfully before the test run was intentionally stopped:

- `GET /api`
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
- `GET /api/companies/get-your-company`
- `PATCH /api/companies/update`
- unit create/list/detail/update flow reached live API successfully before the broader run was stopped

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

## Testing Still Needed

High-value testing still pending:

1. Continue the interrupted live API verification pass:
   - complete unit archive / unarchive / delete checks
   - complete document create / upload / download / approve / archive / restore / delete checks
   - complete audit-log endpoint checks
   - complete logout / delete-account flow checks
   - complete company cleanup / delete flow check at end of test tenant lifecycle

2. Manual onboarding test:
   - create workspace
   - login as first admin
   - search company by name from a second browser/session
   - submit join request
   - approve request from admin company page
   - verify login works only after approval

3. Manual role test:
   - admin
   - editor
   - user
   - verify action visibility and forbidden operations

4. Manual documents flow test:
   - create document
   - upload file
   - approve
   - archive
   - delete

5. Manual responsive test:
   - documents page
   - units page
   - audits page
   - auth pages

6. Manual privacy check:
   - public company search only returns names
   - internal company IDs are not shown during join flow
   - pending users cannot log in before approval

7. Live environment integration test with real MySQL / Redis / Cloudinary setup
   - include Cloudinary upload/download verification with a real uploaded file
   - note any response-shape inconsistencies or unexpected status codes during the pass

8. Final check that FastAPI serves `frontend/dist` correctly in integrated mode

## Later Frontend Slices

After QA:

1. Toast notifications
2. Confirmation modals
3. Skeleton loaders
4. Final responsive polish
5. Final integrated backend/frontend verification
