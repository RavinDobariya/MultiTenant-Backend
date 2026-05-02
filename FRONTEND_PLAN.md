# Multi-Tenant Document Management Frontend Plan

## Project Context

This repository currently contains a FastAPI backend for a multi-tenant document management system. The backend is mounted under `/api/...` and `app/main.py` is already prepared to serve a React production build from `frontend/dist` when that folder exists.

There is no frontend source directory yet. The intended frontend should be created under:

```txt
frontend/
```

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
POST   /api/signup
POST   /api/login
POST   /api/refresh
POST   /api/logout
GET    /api/me
GET    /api/admin
DELETE /api/delete?confirm=true
```

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

Build a professional, teacher-impressive SaaS-style frontend for the document management system.

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

Signup currently requires an existing `company_id`, so make that clear in the form.

Recommended:

- Email
- Password
- Role select
- Company ID

Alternative later:

- Admin-only user creation screen inside the app.

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

## Implementation Order

1. Create `frontend` with Vite React TypeScript.
2. Configure Tailwind, router, query client, Axios, and Vite port `3000`.
3. Build landing page.
4. Build auth pages and auth context.
5. Build protected routes and app shell.
6. Build dashboard.
7. Build documents list and document actions.
8. Build document detail.
9. Build units page.
10. Build company page.
11. Build audit logs.
12. Build account page.
13. Add final polish:
    - toasts
    - skeletons
    - empty states
    - confirmation dialogs
    - responsive mobile layout
14. Run frontend build.
15. Verify FastAPI serves `frontend/dist`.

## Notes For Next Session

Start by reading this file.

Then inspect current git status because the backend had pre-existing uncommitted changes before frontend work began.

Suggested first command:

```powershell
git status --short
```

Then create the frontend app under `frontend/` and keep the backend API base at `/api`.

## Current Frontend Progress

Frontend work has started under:

```txt
frontend/
```

Installed stack so far:

```txt
React
Vite
TypeScript
React Router
lucide-react
```

The frontend has been scaffolded and builds successfully.

Important files created so far:

```txt
frontend/package.json
frontend/package-lock.json
frontend/vite.config.ts
frontend/index.html
frontend/src/main.tsx
frontend/src/app/App.tsx
frontend/src/styles/globals.css
frontend/src/features/landing/LandingPage.tsx
frontend/src/features/auth/LoginPage.tsx
frontend/src/api/client.ts
frontend/src/api/authApi.ts
frontend/src/lib/authStorage.ts
frontend/src/vite-env.d.ts
```

`.gitignore` was updated to ignore:

```txt
frontend/node_modules/
frontend/dist/
frontend/*.log
```

## Current Implemented Routes

```txt
/        Landing page
/login   Login page
/signup  Placeholder page
/app     Placeholder dashboard page
```

Unknown routes redirect to `/`.

## Landing Page Status

The landing page went through several review iterations.

Current approved direction:

- Dark professional SaaS/product style.
- Larger header.
- Full-width hero.
- Animated dashboard preview.
- Product story sections.
- Capability panel.
- Architecture/value cards.
- Role-based section.
- CTA section.
- Footer.

The user disliked the first light/simple version and asked for:

- Dark theme.
- Less empty space.
- Less childish/basic visual style.
- More professional tone.
- Cool but professional animations.
- Longer landing page with footer.

The current landing page is acceptable enough to move forward unless the user asks for more changes.

## Login Page Status

The `/login` route has been implemented.

Features:

- Dark split-screen login UI.
- Product/security story panel.
- Email/password form.
- Loading state.
- Error state.
- Calls `POST /api/login`.
- Saves `access_token` and `refresh_token` to localStorage.
- Redirects to `/app` on success.

Minimal API files implemented:

```txt
frontend/src/api/client.ts
frontend/src/api/authApi.ts
frontend/src/lib/authStorage.ts
```

Current token storage keys:

```txt
access_token
refresh_token
```

Important limitation:

The login API client is intentionally minimal. It does not yet implement:

- Authorization header injection.
- `/api/me`.
- Refresh-token retry on `401`.
- Full auth context.
- Protected route guard.

Those should be added in the next app-shell slice.

## Verification Completed

The frontend dependency install completed successfully:

```powershell
cd frontend
npm install
```

Production build has passed multiple times:

```powershell
npm run build
```

The dev server has run on:

```txt
http://localhost:3000
```

Verified routes:

```txt
http://localhost:3000
http://localhost:3000/login
```

Both returned HTTP `200` during the session.

If the dev server is not running in the next session, start it with:

```powershell
cd frontend
npm run dev
```

## Next Session Priority

The user asked to continue one slice at a time. Do not build the full app all at once.

Next recommended slice:

```txt
Protected app shell + dashboard overview at /app
```

Scope for next slice:

1. Add auth storage helpers:
   - get access token
   - get refresh token
   - check if authenticated
2. Extend API client:
   - attach `Authorization: Bearer <access_token>`
   - support authenticated requests
3. Add `/api/me` API function.
4. Build a simple auth bootstrap:
   - if token exists, fetch `/me`
   - if `/me` fails, clear tokens and send user to `/login`
5. Replace `/app` placeholder with app shell:
   - left sidebar
   - topbar
   - user/role/company display
   - logout button
6. Build dashboard overview only:
   - company/user summary
   - document status cards using placeholder data initially, or live document list if backend is running
   - quick action cards for documents, units, audits
   - no full document CRUD yet

Suggested app routes for that slice:

```txt
/app              Dashboard overview
/app/documents    Placeholder
/app/units        Placeholder
/app/company      Placeholder
/app/audits       Placeholder
/app/account      Placeholder
```

Important design instruction:

Keep the dark professional style established by the landing/login pages. The user is sensitive to layouts that look too simple, childish, centered, or empty. Use dense but clean SaaS dashboard composition.

## Later Frontend Slices

After app shell review:

1. Documents list page with filters/table/pagination.
2. Document create/upload flow.
3. Document detail page.
4. Units page.
5. Company page.
6. Audit logs page.
7. Signup page or admin user creation flow.
8. Full token refresh interceptor and auth hardening if not completed earlier.
