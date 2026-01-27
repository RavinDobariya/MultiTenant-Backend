from app.database.cursor_config import get_db
from fastapi import APIRouter, Depends
from app.utils.security import hash_password
from app.utils.logger import logger
from app.utils.response_handler import api_response
import uuid

router = APIRouter()


@router.post("/seed-db")
def seed_database(db=Depends(get_db)):
    cursor, connection = db
    """
    Seed DB only if empty.
    IDs:
    - company: C01, C02
    - unit: U01, U02
    - user: P01, P02, P03
    - document: D01
    - audit_log: A01
    - refresh_token.token: RT01
    """

    cursor.execute("SELECT COUNT(*) AS total FROM company")
    result = cursor.fetchone()["total"]  # same as result[total] for result = {"total": 5}
    # gives int value count

    if result > 0:
        logger.info("Seeding skipped: company table is not empty")
        return api_response(200, "Cannot seed database!! company Data exists ", result)

    logger.info("Seeding started...")

    # -------------------- Companies --------------------
    company1_id = str(uuid.uuid4())
    company2_id = str(uuid.uuid4())

    cursor.execute("INSERT INTO company (id, name) VALUES (%s, %s)", (company1_id, "company a"))
    cursor.execute("INSERT INTO company (id, name) VALUES (%s, %s)", (company2_id, "company b"))

    # -------------------- Units --------------------
    unit1_id = str(uuid.uuid4())
    unit2_id = str(uuid.uuid4())

    cursor.execute(
        "INSERT INTO unit (id, company_id, name, is_archived) VALUES (%s, %s, %s, %s)",
        (unit1_id, company1_id, "hr unit", 0),
    )
    cursor.execute(
        "INSERT INTO unit (id, company_id, name, is_archived) VALUES (%s, %s, %s, %s)",
        (unit2_id, company2_id, "finance unit", 0),
    )

    # -------------------- Users --------------------
    password_hash = hash_password("Admin@123")

    cursor.execute(
        "INSERT INTO user (id, email, password_hash, role, company_id) VALUES (%s, %s, %s, %s, %s)",
        (str(uuid.uuid4()), "admin@gmail.com", password_hash, "admin", company1_id),
    )

    cursor.execute(
        "INSERT INTO user (id, email, password_hash, role, company_id) VALUES (%s, %s, %s, %s, %s)",
        (str(uuid.uuid4()), "user1@gmail.com", password_hash, "user", company1_id),
    )

    cursor.execute(
        "INSERT INTO user (id, email, password_hash, role, company_id) VALUES (%s, %s, %s, %s, %s)",
        (str(uuid.uuid4()), "user2@gmail.com", password_hash, "user", company2_id),
    )

    # -------------------- Document (1 record) --------------------
    cursor.execute(
        """
        INSERT INTO document (
            unit_id,
            title, description, type, status,
            file_url, approved_by)
        VALUES (%s, %s, %s, %s, %s, %s, %s)
        """,
        (
            unit1_id,
            "leave policy",
            "basic leave policy document",
            "POLICY",  # enum must match exactly
            "DRAFT",
            "https://example.com/docs/leave-policy.pdf",
            None,
        ),
    )

    # -------------------- Audit log (1 record) --------------------
    cursor.execute(
        "INSERT INTO audit_log (id, action) VALUES (%s, %s)",
        (str(uuid.uuid4()), "DOCUMENT_UPLOAD"),
    )

    # -------------------- Refresh Token (1 record) --------------------
    cursor.execute(
        "INSERT INTO refresh_token (token, is_revoked) VALUES (%s, 0)",
        (str(uuid.uuid4()),),
    )

    connection.commit()
    logger.info("Seeding completed successfully!!")
    return api_response(201, "Data seeding completed")
