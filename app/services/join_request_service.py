import uuid

from fastapi import HTTPException

from app.services.audit_service import create_audit_log
from app.utils.logger import logger, log_exception
from app.utils.security import hash_password

ALLOWED_ROLES = {"admin", "editor", "user"}
JOIN_REQUEST_STATUSES = {"PENDING", "APPROVED", "REJECTED"}


def _best_effort_audit(action: str, request_id: str, user_id: str):
    try:
        create_audit_log(
            action=action,
            entity_id=request_id,
            user_id=user_id,
        )
    except Exception as e:
        log_exception(e, f"Audit log side-effect failed action={action} request_id={request_id}")


def _generate_unique_id(cursor, table_name: str):
    while True:
        entity_id = str(uuid.uuid4())
        cursor.execute(f"SELECT 1 FROM {table_name} WHERE id = %s LIMIT 1", (entity_id,))
        if cursor.fetchone():
            logger.info(f"uuid generating again because duplicate found in {table_name}")
            continue
        return entity_id


def discover_companies(cursor, query: str | None = None):
    try:
        params: list[str | int] = []
        sql = """
            SELECT name
            FROM company
        """

        if query:
            sql += " WHERE LOWER(name) LIKE %s "
            params.append(f"%{query.strip().lower()}%")

        sql += " ORDER BY name ASC LIMIT %s "
        params.append(20)

        cursor.execute(sql, tuple(params))
        return cursor.fetchall()
    except HTTPException:
        raise
    except Exception as e:
        log_exception(e, "Failed to discover companies")
        raise HTTPException(status_code=500, detail="Failed to discover companies")


def create_join_request(cursor, connection, payload):
    try:
        requested_role = payload.requested_role.lower()
        if requested_role not in ALLOWED_ROLES:
            raise HTTPException(status_code=400, detail="Invalid role")

        cursor.execute("SELECT id, name FROM company WHERE name=%s", (payload.company_name,))
        company = cursor.fetchone()
        if not company:
            raise HTTPException(status_code=404, detail="Company not found")

        cursor.execute("SELECT 1 FROM `user` WHERE email=%s AND is_delete=0 LIMIT 1", (payload.email,))
        if cursor.fetchone():
            raise HTTPException(status_code=409, detail="Email already registered")

        cursor.execute(
            """
            SELECT id, status
            FROM join_request
            WHERE company_id=%s AND email=%s
            ORDER BY created_at DESC
            LIMIT 1
            """,
            (company["id"], payload.email),
        )
        existing_request = cursor.fetchone()
        if existing_request and existing_request["status"] == "PENDING":
            raise HTTPException(
                status_code=409,
                detail="A join request for this email is already pending review",
            )

        join_request_id = _generate_unique_id(cursor, "join_request")
        password_hash = hash_password(payload.password)
        cursor.execute(
            """
            INSERT INTO join_request (
                id, company_id, email, password_hash, requested_role, status
            )
            VALUES (%s, %s, %s, %s, %s, %s)
            """,
            (
                join_request_id,
                company["id"],
                payload.email,
                password_hash,
                requested_role,
                "PENDING",
            ),
        )
        connection.commit()
        logger.info(
            f"Join request created id={join_request_id} company_id={company['id']} email={payload.email}"
        )

        return {
            "id": join_request_id,
            "company_id": company["id"],
            "company_name": company["name"],
            "email": payload.email,
            "requested_role": requested_role,
            "status": "PENDING",
        }
    except HTTPException:
        connection.rollback()
        raise
    except Exception as e:
        connection.rollback()
        log_exception(e, f"Failed to create join request for email={payload.email}")
        raise HTTPException(status_code=500, detail="Failed to create join request")


def list_join_requests(cursor, user):
    try:
        cursor.execute(
            """
            SELECT
                jr.id,
                jr.company_id,
                jr.email,
                jr.requested_role,
                jr.status,
                jr.rejection_reason,
                jr.created_at,
                jr.reviewed_at,
                jr.approved_user_id,
                reviewer.email AS reviewed_by_email
            FROM join_request jr
            LEFT JOIN `user` reviewer ON reviewer.id = jr.reviewed_by
            WHERE jr.company_id=%s
            ORDER BY
                CASE jr.status
                    WHEN 'PENDING' THEN 0
                    WHEN 'APPROVED' THEN 1
                    ELSE 2
                END,
                jr.created_at DESC
            """,
            (user["company_id"],),
        )
        return cursor.fetchall()
    except HTTPException:
        raise
    except Exception as e:
        log_exception(e, f"Failed to list join requests for company_id={user['company_id']}")
        raise HTTPException(status_code=500, detail="Failed to fetch join requests")


def approve_join_request(cursor, connection, request_id: str, user, payload):
    try:
        cursor.execute(
            """
            SELECT id, company_id, email, password_hash, requested_role, status
            FROM join_request
            WHERE id=%s
            """,
            (request_id,),
        )
        join_request = cursor.fetchone()
        if not join_request or join_request["company_id"] != user["company_id"]:
            raise HTTPException(status_code=404, detail="Join request not found")

        if join_request["status"] != "PENDING":
            raise HTTPException(status_code=409, detail="Join request is no longer pending")

        approved_role = (payload.role or join_request["requested_role"]).lower()
        if approved_role not in ALLOWED_ROLES:
            raise HTTPException(status_code=400, detail="Invalid role")

        cursor.execute(
            "SELECT 1 FROM `user` WHERE email=%s AND is_delete=0 LIMIT 1",
            (join_request["email"],),
        )
        if cursor.fetchone():
            raise HTTPException(status_code=409, detail="Email already registered")

        user_id = _generate_unique_id(cursor, "user")
        cursor.execute(
            """
            INSERT INTO `user` (id, email, password_hash, role, company_id)
            VALUES (%s, %s, %s, %s, %s)
            """,
            (
                user_id,
                join_request["email"],
                join_request["password_hash"],
                approved_role,
                join_request["company_id"],
            ),
        )
        cursor.execute(
            """
            UPDATE join_request
            SET status=%s, reviewed_by=%s, reviewed_at=NOW(), approved_user_id=%s, rejection_reason=NULL
            WHERE id=%s
            """,
            ("APPROVED", user["id"], user_id, request_id),
        )
        connection.commit()

        _best_effort_audit("JOIN_REQUEST_APPROVED", request_id, user["id"])

        logger.info(f"Join request approved id={request_id} approved_user_id={user_id}")
        return {
            "join_request_id": request_id,
            "user_id": user_id,
            "email": join_request["email"],
            "role": approved_role,
            "status": "APPROVED",
        }
    except HTTPException:
        connection.rollback()
        raise
    except Exception as e:
        connection.rollback()
        log_exception(e, f"Failed to approve join request id={request_id}")
        raise HTTPException(status_code=500, detail="Failed to approve join request")


def reject_join_request(cursor, connection, request_id: str, user, payload):
    try:
        cursor.execute(
            "SELECT id, company_id, status FROM join_request WHERE id=%s",
            (request_id,),
        )
        join_request = cursor.fetchone()
        if not join_request or join_request["company_id"] != user["company_id"]:
            raise HTTPException(status_code=404, detail="Join request not found")

        if join_request["status"] != "PENDING":
            raise HTTPException(status_code=409, detail="Join request is no longer pending")

        cursor.execute(
            """
            UPDATE join_request
            SET status=%s, reviewed_by=%s, reviewed_at=NOW(), rejection_reason=%s
            WHERE id=%s
            """,
            ("REJECTED", user["id"], payload.rejection_reason, request_id),
        )
        connection.commit()

        _best_effort_audit("JOIN_REQUEST_REJECTED", request_id, user["id"])

        logger.info(f"Join request rejected id={request_id}")
        return {
            "join_request_id": request_id,
            "status": "REJECTED",
        }
    except HTTPException:
        connection.rollback()
        raise
    except Exception as e:
        connection.rollback()
        log_exception(e, f"Failed to reject join request id={request_id}")
        raise HTTPException(status_code=500, detail="Failed to reject join request")
