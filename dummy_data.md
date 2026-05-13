# Presentation Dummy Data

Use this file after running the presentation seed script:

```bash
python scripts/seed_presentation_data.py
```

All demo accounts use the same password:

```txt
Pass1234
```

## What Gets Seeded

- 2 companies
- 3 active members per company
- 3 units per company
- 3 documents per company
- audit logs for company, unit, document, and join-request activity
- pending and rejected join requests for admin review demos

## Company 1

### Northwind Compliance Group

#### Login Accounts

- Admin: `admin@northwind.demo`
- Editor: `editor@northwind.demo`
- User: `user@northwind.demo`

#### Units

- Human Resources
- Operations
- Finance

#### Documents

- `Northwind Employee Handbook`
  - Type: `MANUAL`
  - Status: `APPROVED`
- `Operations Safety Checklist`
  - Type: `POLICY`
  - Status: `DRAFT`
- `Quarterly Finance Review`
  - Type: `REPORT`
  - Status: `ARCHIVED`

#### Join Requests

- Pending: `pending.hr@northwind.demo`
  - Requested role: `editor`
- Rejected: `rejected.ops@northwind.demo`
  - Requested role: `user`

#### Demo Notes

- Admin can review join requests on the Company page.
- Editor can create and update units/documents.
- User is read-only.
- Audit logs show document and join-request actions.

## Company 2

### Summit Care Documentation

#### Login Accounts

- Admin: `admin@summit.demo`
- Editor: `editor@summit.demo`
- User: `user@summit.demo`

#### Units

- Clinical Quality
- Facilities
- Procurement

#### Documents

- `Clinical Quality Standard`
  - Type: `POLICY`
  - Status: `APPROVED`
- `Facilities Maintenance Rotation`
  - Type: `MANUAL`
  - Status: `DRAFT`
- `Vendor Review Packet`
  - Type: `REPORT`
  - Status: `ARCHIVED`

#### Join Requests

- Pending: `pending.clinic@summit.demo`
  - Requested role: `user`
- Rejected: `rejected.vendor@summit.demo`
  - Requested role: `editor`

#### Demo Notes

- Good tenant for showing role-aware dashboards and audit logs.
- Includes mixed document statuses for filter demos.

## Suggested Presentation Flow

1. Log in as `admin@northwind.demo`.
2. Show Dashboard metrics and recent activity.
3. Open Documents and filter by `DRAFT`, `APPROVED`, and `ARCHIVED`.
4. Open Company page and show pending/rejected join requests.
5. Log out and log in as `editor@northwind.demo` to show editor permissions.
6. Log out and log in as `user@northwind.demo` to show read-only behavior.
7. Repeat the same idea with `Summit Care Documentation` to show multi-tenant separation.

## Notes

- The script is designed for presentation/demo data, not production bootstrap data.
- It removes and recreates only the seeded presentation companies and their related records so it can be rerun safely.
