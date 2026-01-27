import uuid
from app.utils.logger import logger
from fastapi import HTTPException
from app.utils.response_handler import api_response

def create_audit_log(cursor, connection, action: str, entity_id: str, user_id: str):
    """
    Create audit logs synchronously during request (PDF requirement).
    Logs who did what action on which entity.
    """
    try:
        #audit_id = uuid.uuid4()            not best Bcuz it gives uuid <object> but works => string covertion automatically sometimes
        while True:
            audit_id = str(uuid.uuid4())

            cursor.execute("SELECT 1 FROM audit_log WHERE id = %s LIMIT 1",(audit_id,))

            exists = cursor.fetchone()
            if exists:
                logger.info("uuid generating again Bcuz duplicate found!!")
            else:
                break
        
        cursor.execute(
            """
            INSERT INTO audit_log (id, action, entity_id, user_id)
            VALUES (%s, %s, %s, %s)
            """,
            (audit_id, action, entity_id, user_id),
        )
        connection.commit()
        result = cursor.fetchone()

        logger.info(f"Audit log created action={action} entity_id={entity_id} user_id={user_id}")
        return api_response(status_code=201,message="Audit created",data=result)
        
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Audit log failed: {e}")
        raise HTTPException(500,detail="Failed to create audit logs")



def list_audit_logs_service(
    cursor,
    page: int,
    limit: int,
    action: str | None = None,
    user_id: str | None = None,
    entity_id: str | None = None,
):
    """
    Fetch audit logs with pagination + optional filters.
    (Route handles role access, service just returns data)
    """
    try:
        offset = (page - 1) * limit

        where = " WHERE 1=1 "       #Without worrying about whether there are any filter or not
        params = []

        if action:
            where += " AND action=%s "
            params.append(action)

        if user_id:
            where += " AND user_id=%s "
            params.append(user_id)

        if entity_id:
            where += " AND entity_id=%s "
            params.append(entity_id)

        # total count
        cursor.execute(
            f"SELECT COUNT(*) AS total FROM audit_log {where}",
            tuple(params),
        )
        total = cursor.fetchone()["total"]

        # data rows
        cursor.execute(
            f"""
            SELECT id, action, entity_id, user_id, created_at
            FROM audit_log
            {where}
            ORDER BY created_at DESC
            LIMIT %s OFFSET %s
            """,
            tuple(params + [limit, offset]),
        )
        rows = cursor.fetchall()

        return rows

    except HTTPException:
        raise

    except Exception as e:
        logger.error(f"Failed to fetch audit logs: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch audit logs")