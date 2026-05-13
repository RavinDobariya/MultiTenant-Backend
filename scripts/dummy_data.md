# Presentation Seed Summary

Run the seed first:

```bash
python scripts/seed_presentation_data.py
```

All demo logins use:

```txt
Pass1234
```

## Seeded Companies

### Northwind Compliance Group

- Admin: `admin@northwind.demo`
- Editor: `editor@northwind.demo`
- User: `user@northwind.demo`
- Units: `Human Resources`, `Operations`, `Finance`
- Documents: `Northwind Employee Handbook`, `Operations Safety Checklist`, `Quarterly Finance Review`
- Join requests: `pending.hr@northwind.demo`, `rejected.ops@northwind.demo`

### Summit Care Documentation

- Admin: `admin@summit.demo`
- Editor: `editor@summit.demo`
- User: `user@summit.demo`
- Units: `Clinical Quality`, `Facilities`, `Procurement`
- Documents: `Clinical Quality Standard`, `Facilities Maintenance Rotation`, `Vendor Review Packet`
- Join requests: `pending.clinic@summit.demo`, `rejected.vendor@summit.demo`

## What To Show In Demo

1. Log in as one of the admin accounts.
2. Open Dashboard and show metrics plus recent activity.
3. Open Documents and filter by status.
4. Open Company and review join requests.
5. Log out and log in as editor/user to show role-based access.
6. Switch to the second company to show tenant separation.

## Notes

- The seed script is presentation data only.
- It recreates the demo companies and related records so you can rerun it safely for demos.
