from fastapi import APIRouter, Depends, Query
from fastapi.encoders import jsonable_encoder

from app.database.cursor_config import get_db
from app.middleware.auth_me import auth_role
from app.services.audit_service import list_audit_logs_service,create_audit_log
from app.utils.logger import logger
from app.schemas.audit_schema import AuditCreate
router = APIRouter(prefix="/audit-logs", tags=["Audit Logs"])


@router.get("")
def list_audit_logs(
    page: int = Query(default=1, ge=1),
    limit: int = Query(default=20, ge=1, le=100),
    action: str | None = None,
    user_id: str | None = None,
    entity_id: str | None = None,
    db=Depends(get_db),
    user=Depends(auth_role("ADMIN")),
):
    cursor, connection = db

    result = list_audit_logs_service(
        cursor=cursor,
        page=page,
        limit=limit,
        action=action,
        user_id=user_id,
        entity_id=entity_id,
    )

    logger.info(f"Audit logs fetched by admin user_id={user['id']}")
    return jsonable_encoder(result)


@router.post("/create")
def create_audit(
    payload: AuditCreate,
    db=Depends(get_db),
    user=Depends(auth_role("ADMIN")),
):
    cursor, connection = db

    result = create_audit_log(
        cursor=cursor,
        connection=connection,
        action=payload.action,
        entity_id=payload.entity_id,
        user_id=payload.user_id,
    )

    logger.info(f"Audit created by admin={user['id']}")
    return jsonable_encoder(result)