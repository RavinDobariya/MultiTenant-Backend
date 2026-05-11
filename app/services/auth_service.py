#inside password_hash = payload.password, hash passwrord pending

from fastapi import HTTPException, Depends
from app.utils.security import create_access_token, create_refresh_token, verify_password
from app.utils.logger import logger,log_exception
from app.utils.error_hanlder import register_exception_handlers
from app.utils.security import hash_password
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
import uuid

ALLOWED_ROLES = {"admin", "user","editor"}


def _generate_unique_id(cursor, table_name: str):
    while True:
        entity_id = str(uuid.uuid4())
        cursor.execute(f"SELECT 1 FROM {table_name} WHERE id = %s LIMIT 1", (entity_id,))
        exists = cursor.fetchone()
        if exists:
            logger.info(f"uuid generating again because duplicate found in {table_name}")
            continue
        return entity_id


def _get_company_column_meta(cursor):
    meta = {}
    for column_name in ("created_by", "updated_at", "updated_by"):
        cursor.execute(f"SHOW COLUMNS FROM company LIKE %s", (column_name,))
        row = cursor.fetchone()
        if row:
            meta[column_name] = row
    return meta


def _insert_company_record(cursor, company_id: str, company_name: str, user_id: str):
    company_columns = _get_company_column_meta(cursor)

    if not company_columns:
        cursor.execute(
            "INSERT INTO company (id, name, created_at) VALUES (%s, %s, NOW())",
            (company_id, company_name),
        )
        return False

    created_by_nullable = company_columns["created_by"]["Null"] == "YES"
    updated_by_nullable = company_columns["updated_by"]["Null"] == "YES"

    if created_by_nullable and updated_by_nullable:
        cursor.execute(
            """
            INSERT INTO company (id, name, created_at, created_by, updated_at, updated_by)
            VALUES (%s, %s, NOW(), NULL, NOW(), NULL)
            """,
            (company_id, company_name),
        )
        return True

    cursor.execute(
        """
        INSERT INTO company (id, name, created_at, created_by, updated_at, updated_by)
        VALUES (%s, %s, NOW(), %s, NOW(), %s)
        """,
        (company_id, company_name, user_id, user_id),
    )
    return False


def _sync_company_audit_fields(cursor, company_id: str, user_id: str):
    company_columns = _get_company_column_meta(cursor)
    if not company_columns:
        return

    cursor.execute(
        """
        UPDATE company
        SET created_by = %s, updated_at = NOW(), updated_by = %s
        WHERE id = %s
        """,
        (user_id, user_id, company_id),
    )


def auth_signup(cursor, conn, payload):
    try:
        logger.warning(
            f"Direct signup blocked for email={payload.email}, company_id={payload.company_id}"
        )
        raise HTTPException(
            status_code=403,
            detail="Direct company signup is disabled. Submit a join request and wait for admin approval.",
        )
    except HTTPException:
        raise
    except Exception as e:
        log_exception(e,f"Error during signup for email: {payload.email}")
        raise HTTPException(500, "Signup failed")


def auth_signup_company_admin(cursor, conn, payload):
    try:
        cursor.execute("SELECT 1 FROM `user` WHERE email=%s", [payload.email])
        if cursor.fetchone():
            logger.warning(f"Company onboarding attempt with existing email: {payload.email}")
            raise HTTPException(400, "Email already registered")

        cursor.execute("SELECT 1 FROM company WHERE name=%s", [payload.company_name])
        if cursor.fetchone():
            logger.warning(f"Company onboarding attempt with existing company name: {payload.company_name}")
            raise HTTPException(400, "Company name already exists")

        company_id = _generate_unique_id(cursor, "company")
        user_id = _generate_unique_id(cursor, "user")
        hashed_pass = hash_password(payload.password)

        needs_company_sync = _insert_company_record(
            cursor, company_id, payload.company_name, user_id
        )
        cursor.execute(
            """
            INSERT INTO `user` (id, email, password_hash, role, company_id)
            VALUES (%s, %s, %s, %s, %s)
            """,
            (user_id, payload.email, hashed_pass, "admin", company_id),
        )
        if needs_company_sync:
            _sync_company_audit_fields(cursor, company_id, user_id)
        conn.commit()

        logger.info(
            f"Company onboarding complete for company_id={company_id}, admin_email={payload.email}"
        )

        return {
            "company_id": company_id,
            "company_name": payload.company_name,
            "admin_user_id": user_id,
            "email": payload.email,
            "role": "admin",
        }
    except HTTPException:
        conn.rollback()
        raise
    except Exception as e:
        conn.rollback()
        log_exception(e, f"Error during company onboarding for email: {payload.email}")
        raise HTTPException(500, "Company onboarding failed")


def auth_login(cursor, conn, payload):
    try:
        cursor.execute(
            "SELECT id, email, password_hash, role, company_id FROM `user` WHERE email=%s AND is_delete=0",
            [payload.email],
        )
        user = cursor.fetchone()

        if not user:
            cursor.execute(
                """
                SELECT status
                FROM join_request
                WHERE email=%s
                ORDER BY created_at DESC
                LIMIT 1
                """,
                [payload.email],
            )
            join_request = cursor.fetchone()

            if join_request and join_request["status"] == "PENDING":
                logger.warning(f"Login attempt before join request approval: {payload.email}")
                raise HTTPException(
                    status_code=403,
                    detail="Your join request is still pending admin approval.",
                )

            if join_request and join_request["status"] == "REJECTED":
                logger.warning(f"Login attempt for rejected join request: {payload.email}")
                raise HTTPException(
                    status_code=403,
                    detail="Your join request was rejected. Submit a new request or contact an admin.",
                )

            logger.warning(f"Login attempt with invalid email: {payload.email}")
            raise HTTPException(status_code=404, detail="Invalid email")

        result = verify_password(payload.password,user["password_hash"])
        if not result:
            logger.warning(f"Login attempt with invalid password for email: {payload.email}")
            raise HTTPException(status_code=401, detail="Invalid password")

        access_token = create_access_token({   
            "user_id": user["id"],
            "email": user["email"],
            "role": user["role"],
            "company_id": user["company_id"]
        })
        refresh_token = create_refresh_token()
        
        cursor.execute(
            "INSERT INTO refresh_token (token, user_id) VALUES (%s, %s)",
            (refresh_token, user["id"])
        )
        conn.commit()
        logger.info(f"User logged in: user_id: {user['id']}, email: {payload.email}")

        return {"access_token": access_token,"refresh_token": refresh_token,"token_type": "bearer"}
    except HTTPException:
        raise
    except Exception as e:
        log_exception(e,f"Auth Login Failed | email={payload.email}")
        raise HTTPException(500, "Login failed")

def auth_refresh(cursor, conn, refresh_token: str):
    try:
        cursor.execute("SELECT token, user_id, is_revoked FROM refresh_token WHERE token=%s",[refresh_token])
        token = cursor.fetchone()

        if not token:
            logger.warning("Token refresh attempt with invalid refresh token")
            raise HTTPException(401, "Invalid refresh token")

        if token["is_revoked"] == 1:
            
            
            logger.warning("Token refresh attempt with revoked refresh token")
            raise HTTPException(401, "Refresh token revoked")

        #fetching user details
        cursor.execute("SELECT id, email, role, company_id FROM `user` WHERE id=%s",[token["user_id"]])
        user = cursor.fetchone()

        if not user:
            logger.warning(f"User not found for refresh token: {refresh_token}")
            raise HTTPException(401, "User not found")

        # create new access token
        new_access_token = create_access_token({
            "user_id": user["id"],
            "email": user["email"],
            "role": user["role"],
            "company_id": user["company_id"]
        })

        return {"access_token": new_access_token, "refresh_token": refresh_token, "token_type": "bearer"}
    except HTTPException:
        raise
    except Exception as e:
        log_exception(e,f"Error during token refresh error | {refresh_token}")
        raise HTTPException(500, "Token refresh failed")
    
def auth_logout(cursor, conn,user):
    try:
        user_id = user["id"]
        cursor.execute("SELECT is_revoked FROM refresh_token WHERE user_id=%s",[user_id])
        rows = cursor.fetchall()

        if not rows:
            logger.warning("Logout attempt with invalid refresh token")
            raise HTTPException(401, "Invalid refresh token")

        token_row = all(r["is_revoked"] == 1 for r in rows)
        
        if token_row:       #reovoke token =>1(True)
            logger.warning("Logout attempt with already revoked refresh token")
            raise HTTPException (status_code=401, detail="Already logged out")                        # already logged out

        cursor.execute("UPDATE refresh_token SET is_revoked=1 WHERE user_id=%s",[user_id])
        conn.commit()
        logger.info(f"User logged out successfully for {user}")
        
    except HTTPException:
        raise
    except Exception as e:
        log_exception(e,f"Error during logout | {user_id}")
        raise HTTPException(500, "Logout failed")


def delete_user(cursor, connection,user,confirm: bool ):
    try:
        if not confirm:
            return (
                "Deleting this document will remove all related data. Please confirm.",
                {"confirm_required": True}
            )
        cursor.execute("UPDATE `user` SET is_delete = 1  WHERE id=%s ",(user["id"],))
        cursor.execute("UPDATE refresh_token SET is_revoked=1 WHERE user_id=%s", (user["id"],))
        connection.commit()

        return { "message": f"User deleted successfully {user['id']}"}

    except HTTPException:
        raise
    except Exception as e:
        connection.rollback()
        log_exception(e,f"Delete document failed")
        raise HTTPException(status_code=500, detail="Failed to delete document")
