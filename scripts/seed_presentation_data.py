#!/usr/bin/env python3
from __future__ import annotations

import sys
import uuid
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from app.database.db_connection import get_connection
from app.utils.security import hash_password


PASSWORD = "Pass1234"
SAMPLE_PDF_URL = "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf"

COMPANIES = [
    {
        "name": "Northwind Compliance Group",
        "users": [
            {"email": "admin@northwind.demo", "role": "admin"},
            {"email": "editor@northwind.demo", "role": "editor"},
            {"email": "user@northwind.demo", "role": "user"},
        ],
        "units": ["Human Resources", "Operations", "Finance"],
        "documents": [
            {
                "title": "Northwind Employee Handbook",
                "description": "Presentation-ready handbook for HR onboarding.",
                "type": "MANUAL",
                "status": "APPROVED",
                "unit": "Human Resources",
                "created_by": "editor@northwind.demo",
                "approved_by": "admin@northwind.demo",
                "file_url": SAMPLE_PDF_URL,
            },
            {
                "title": "Operations Safety Checklist",
                "description": "Draft checklist for plant walkthroughs.",
                "type": "POLICY",
                "status": "DRAFT",
                "unit": "Operations",
                "created_by": "editor@northwind.demo",
                "approved_by": None,
                "file_url": SAMPLE_PDF_URL,
            },
            {
                "title": "Quarterly Finance Review",
                "description": "Archived sample report for dashboard filtering demos.",
                "type": "REPORT",
                "status": "ARCHIVED",
                "unit": "Finance",
                "created_by": "admin@northwind.demo",
                "approved_by": "admin@northwind.demo",
                "file_url": SAMPLE_PDF_URL,
            },
        ],
        "join_requests": [
            {
                "email": "pending.hr@northwind.demo",
                "requested_role": "editor",
                "status": "PENDING",
                "reviewed_by": None,
                "approved_user_id": None,
                "rejection_reason": None,
            },
            {
                "email": "rejected.ops@northwind.demo",
                "requested_role": "user",
                "status": "REJECTED",
                "reviewed_by": "admin@northwind.demo",
                "approved_user_id": None,
                "rejection_reason": "Operations seats are currently full.",
            },
        ],
        "audit_actions": [
            ("COMPANY_UPDATED", "company"),
            ("UNIT_CREATED", "unit:Human Resources"),
            ("UNIT_CREATED", "unit:Operations"),
            ("UNIT_CREATED", "unit:Finance"),
            ("DOCUMENT_UPDATED", "doc:Northwind Employee Handbook"),
            ("DOCUMENT_ARCHIVED", "doc:Quarterly Finance Review"),
            ("JOIN_REQUEST_REJECTED", "join:rejected.ops@northwind.demo"),
        ],
    },
    {
        "name": "Summit Care Documentation",
        "users": [
            {"email": "admin@summit.demo", "role": "admin"},
            {"email": "editor@summit.demo", "role": "editor"},
            {"email": "user@summit.demo", "role": "user"},
        ],
        "units": ["Clinical Quality", "Facilities", "Procurement"],
        "documents": [
            {
                "title": "Clinical Quality Standard",
                "description": "Approved policy document for quality audits.",
                "type": "POLICY",
                "status": "APPROVED",
                "unit": "Clinical Quality",
                "created_by": "editor@summit.demo",
                "approved_by": "admin@summit.demo",
                "file_url": SAMPLE_PDF_URL,
            },
            {
                "title": "Facilities Maintenance Rotation",
                "description": "Working draft for maintenance scheduling.",
                "type": "MANUAL",
                "status": "DRAFT",
                "unit": "Facilities",
                "created_by": "editor@summit.demo",
                "approved_by": None,
                "file_url": SAMPLE_PDF_URL,
            },
            {
                "title": "Vendor Review Packet",
                "description": "Archived procurement report for document status demos.",
                "type": "REPORT",
                "status": "ARCHIVED",
                "unit": "Procurement",
                "created_by": "admin@summit.demo",
                "approved_by": "admin@summit.demo",
                "file_url": SAMPLE_PDF_URL,
            },
        ],
        "join_requests": [
            {
                "email": "pending.clinic@summit.demo",
                "requested_role": "user",
                "status": "PENDING",
                "reviewed_by": None,
                "approved_user_id": None,
                "rejection_reason": None,
            },
            {
                "email": "rejected.vendor@summit.demo",
                "requested_role": "editor",
                "status": "REJECTED",
                "reviewed_by": "admin@summit.demo",
                "approved_user_id": None,
                "rejection_reason": "Please apply again with the correct department sponsor.",
            },
        ],
        "audit_actions": [
            ("COMPANY_UPDATED", "company"),
            ("UNIT_CREATED", "unit:Clinical Quality"),
            ("UNIT_UPDATED", "unit:Facilities"),
            ("DOCUMENT_UPDATED", "doc:Facilities Maintenance Rotation"),
            ("DOCUMENT_ARCHIVED", "doc:Vendor Review Packet"),
            ("JOIN_REQUEST_REJECTED", "join:rejected.vendor@summit.demo"),
        ],
    },
]


def make_id() -> str:
    return str(uuid.uuid4())


def fetch_columns(cursor, table_name: str) -> set[str]:
    cursor.execute(f"SHOW COLUMNS FROM `{table_name}`")
    return {row["Field"] for row in cursor.fetchall()}


def insert_row(cursor, table_name: str, payload: dict):
    columns = ", ".join(f"`{key}`" for key in payload)
    placeholders = ", ".join(["%s"] * len(payload))
    cursor.execute(
        f"INSERT INTO `{table_name}` ({columns}) VALUES ({placeholders})",
        tuple(payload.values()),
    )


def delete_existing_demo_data(cursor, connection):
    company_names = [company["name"] for company in COMPANIES]
    demo_emails = []
    for company in COMPANIES:
        demo_emails.extend(user["email"] for user in company["users"])
        demo_emails.extend(request["email"] for request in company["join_requests"])

    placeholders = ", ".join(["%s"] * len(company_names))
    cursor.execute(
        f"SELECT id FROM company WHERE name IN ({placeholders})",
        tuple(company_names),
    )
    company_ids = [row["id"] for row in cursor.fetchall()]

    if company_ids:
        placeholders = ", ".join(["%s"] * len(company_ids))
        cursor.execute(
            f"SELECT id FROM unit WHERE company_id IN ({placeholders})",
            tuple(company_ids),
        )
        unit_ids = [row["id"] for row in cursor.fetchall()]

        cursor.execute(
            f"SELECT id FROM `user` WHERE company_id IN ({placeholders})",
            tuple(company_ids),
        )
        user_ids = [row["id"] for row in cursor.fetchall()]

        if user_ids:
            user_placeholders = ", ".join(["%s"] * len(user_ids))
            cursor.execute(
                f"DELETE FROM refresh_token WHERE user_id IN ({user_placeholders})",
                tuple(user_ids),
            )
            cursor.execute(
                f"DELETE FROM audit_log WHERE user_id IN ({user_placeholders})",
                tuple(user_ids),
            )

        cursor.execute(
            f"DELETE FROM join_request WHERE company_id IN ({placeholders})",
            tuple(company_ids),
        )

        if unit_ids:
            unit_placeholders = ", ".join(["%s"] * len(unit_ids))
            cursor.execute(
                f"DELETE FROM document WHERE unit_id IN ({unit_placeholders})",
                tuple(unit_ids),
            )
            cursor.execute(
                f"DELETE FROM unit WHERE id IN ({unit_placeholders})",
                tuple(unit_ids),
            )

        cursor.execute(
            f"DELETE FROM `user` WHERE company_id IN ({placeholders})",
            tuple(company_ids),
        )
        cursor.execute(
            f"DELETE FROM company WHERE id IN ({placeholders})",
            tuple(company_ids),
        )

    if demo_emails:
        placeholders = ", ".join(["%s"] * len(demo_emails))
        cursor.execute(
            f"DELETE FROM join_request WHERE email IN ({placeholders})",
            tuple(demo_emails),
        )

    connection.commit()


def build_company_row(company_columns: set[str], company_id: str, company_name: str, admin_id: str):
    row = {
        "id": company_id,
        "name": company_name,
    }
    if "created_at" in company_columns:
        row["created_at"] = "2026-05-01 09:00:00"
    if "created_by" in company_columns:
        row["created_by"] = admin_id
    if "updated_at" in company_columns:
        row["updated_at"] = "2026-05-10 11:15:00"
    if "updated_by" in company_columns:
        row["updated_by"] = admin_id
    return row


def build_unit_row(unit_columns: set[str], unit_id: str, company_id: str, unit_name: str, admin_id: str, archived: int = 0):
    row = {
        "id": unit_id,
        "company_id": company_id,
        "name": unit_name,
    }
    if "is_archived" in unit_columns:
        row["is_archived"] = archived
    if "created_at" in unit_columns:
        row["created_at"] = "2026-05-02 10:00:00"
    if "created_by" in unit_columns:
        row["created_by"] = admin_id
    if "updated_at" in unit_columns:
        row["updated_at"] = "2026-05-10 11:30:00"
    if "updated_by" in unit_columns:
        row["updated_by"] = admin_id
    return row


def build_user_row(user_columns: set[str], user_id: str, email: str, role: str, company_id: str, password_hash: str):
    row = {
        "id": user_id,
        "email": email,
        "password_hash": password_hash,
        "role": role,
        "company_id": company_id,
    }
    if "is_delete" in user_columns:
        row["is_delete"] = 0
    if "created_at" in user_columns:
        row["created_at"] = "2026-05-02 09:30:00"
    return row


def build_document_row(document_columns: set[str], document_id: str, unit_id: str, document: dict, created_by_id: str, approved_by_id: str | None, updated_by_id: str):
    archived = 1 if document["status"] == "ARCHIVED" else 0
    row = {
        "id": document_id,
        "unit_id": unit_id,
        "title": document["title"],
        "description": document["description"],
        "type": document["type"],
        "status": document["status"],
        "file_url": document["file_url"],
        "created_by": created_by_id,
    }
    if "created_at" in document_columns:
        row["created_at"] = "2026-05-03 10:15:00"
    if "approved_by" in document_columns:
        row["approved_by"] = approved_by_id
    if "updated_at" in document_columns:
        row["updated_at"] = "2026-05-10 12:20:00"
    if "updated_by" in document_columns:
        row["updated_by"] = updated_by_id
    if "is_archived" in document_columns:
        row["is_archived"] = archived
    if "archived_at" in document_columns:
        row["archived_at"] = "2026-05-09 16:45:00" if archived else None
    if "is_delete" in document_columns:
        row["is_delete"] = 0
    return row


def build_join_request_row(join_columns: set[str], request_id: str, company_id: str, join_request: dict, password_hash: str, reviewed_by_id: str | None, approved_user_id: str | None):
    row = {
        "id": request_id,
        "company_id": company_id,
        "email": join_request["email"],
        "password_hash": password_hash,
        "requested_role": join_request["requested_role"],
        "status": join_request["status"],
    }
    if "reviewed_by" in join_columns:
        row["reviewed_by"] = reviewed_by_id
    if "approved_user_id" in join_columns:
        row["approved_user_id"] = approved_user_id
    if "rejection_reason" in join_columns:
        row["rejection_reason"] = join_request["rejection_reason"]
    if "created_at" in join_columns:
        row["created_at"] = "2026-05-10 09:10:00"
    if "reviewed_at" in join_columns:
        row["reviewed_at"] = "2026-05-10 10:20:00" if join_request["status"] != "PENDING" else None
    return row


def insert_audit_row(audit_columns: set[str], cursor, action: str, entity_id: str, user_id: str, created_at: str):
    row = {
        "id": make_id(),
        "action": action,
        "entity_id": entity_id,
        "user_id": user_id,
    }
    if "is_delete" in audit_columns:
        row["is_delete"] = 0
    if "created_at" in audit_columns:
        row["created_at"] = created_at
    insert_row(cursor, "audit_log", row)


def main():
    connection = get_connection()
    cursor = connection.cursor(dictionary=True)

    company_columns = fetch_columns(cursor, "company")
    unit_columns = fetch_columns(cursor, "unit")
    user_columns = fetch_columns(cursor, "user")
    document_columns = fetch_columns(cursor, "document")
    join_columns = fetch_columns(cursor, "join_request")
    audit_columns = fetch_columns(cursor, "audit_log")

    delete_existing_demo_data(cursor, connection)

    password_hash = hash_password(PASSWORD)

    for company_index, company in enumerate(COMPANIES, start=1):
        company_id = make_id()
        admin_user = next(user for user in company["users"] if user["role"] == "admin")
        admin_id = make_id()

        email_to_user_id = {admin_user["email"]: admin_id}
        for user in company["users"]:
            if user["email"] not in email_to_user_id:
                email_to_user_id[user["email"]] = make_id()

        insert_row(
            cursor,
            "company",
            build_company_row(company_columns, company_id, company["name"], admin_id),
        )

        for user in company["users"]:
            insert_row(
                cursor,
                "user",
                build_user_row(
                    user_columns,
                    email_to_user_id[user["email"]],
                    user["email"],
                    user["role"],
                    company_id,
                    password_hash,
                ),
            )

        unit_name_to_id = {}
        for idx, unit_name in enumerate(company["units"], start=1):
            unit_id = make_id()
            unit_name_to_id[unit_name] = unit_id
            insert_row(
                cursor,
                "unit",
                build_unit_row(
                    unit_columns,
                    unit_id,
                    company_id,
                    unit_name,
                    admin_id,
                    archived=0,
                ),
            )

        document_title_to_id = {}
        for document in company["documents"]:
            document_id = make_id()
            document_title_to_id[document["title"]] = document_id
            insert_row(
                cursor,
                "document",
                build_document_row(
                    document_columns,
                    document_id,
                    unit_name_to_id[document["unit"]],
                    document,
                    email_to_user_id[document["created_by"]],
                    email_to_user_id[document["approved_by"]] if document["approved_by"] else None,
                    admin_id,
                ),
            )

        join_email_to_id = {}
        for join_request in company["join_requests"]:
            request_id = make_id()
            join_email_to_id[join_request["email"]] = request_id
            insert_row(
                cursor,
                "join_request",
                build_join_request_row(
                    join_columns,
                    request_id,
                    company_id,
                    join_request,
                    password_hash,
                    email_to_user_id.get(join_request["reviewed_by"]) if join_request["reviewed_by"] else None,
                    join_request["approved_user_id"],
                ),
            )

        audit_time_base = 8 + company_index
        for offset, (action, target) in enumerate(company["audit_actions"]):
            if target == "company":
                entity_id = company_id
            elif target.startswith("unit:"):
                entity_id = unit_name_to_id[target.split(":", 1)[1]]
            elif target.startswith("doc:"):
                entity_id = document_title_to_id[target.split(":", 1)[1]]
            elif target.startswith("join:"):
                entity_id = join_email_to_id[target.split(":", 1)[1]]
            else:
                raise ValueError(f"Unsupported audit target: {target}")

            created_at = f"2026-05-10 {audit_time_base + offset:02d}:00:00"
            insert_audit_row(audit_columns, cursor, action, entity_id, admin_id, created_at)

    connection.commit()
    cursor.close()
    connection.close()

    print("Presentation demo data seeded successfully.")
    print(f"Password for all demo logins: {PASSWORD}")


if __name__ == "__main__":
    main()
