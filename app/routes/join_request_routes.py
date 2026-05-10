from fastapi import APIRouter, Depends, Query
from fastapi.encoders import jsonable_encoder

from app.database.cursor_config import get_db
from app.middleware.auth_me import auth_role
from app.schemas.join_request_schema import (
    JoinRequestApproveRequest,
    JoinRequestCreateRequest,
    JoinRequestRejectRequest,
)
from app.services.join_request_service import (
    approve_join_request,
    create_join_request,
    discover_companies,
    list_join_requests,
    reject_join_request,
)
from app.utils.logger import logger
from app.utils.response_handler import api_response

router = APIRouter(tags=["Join Requests"])


@router.get("/companies/discover")
def discover_companies_route(query: str | None = Query(default=None, min_length=3), db=Depends(get_db)):
    cursor, _ = db
    data = discover_companies(cursor, query=query)
    logger.info("Public company discovery request")
    return api_response(200, "Companies discovered", data=jsonable_encoder(data))


@router.post("/join-requests")
def create_join_request_route(payload: JoinRequestCreateRequest, db=Depends(get_db)):
    cursor, connection = db
    logger.info(f"Join request create attempt for email={payload.email}")
    data = create_join_request(cursor, connection, payload)
    return api_response(201, "Join request submitted", data=data)


@router.get("/join-requests")
def list_join_requests_route(db=Depends(get_db), user=Depends(auth_role("ADMIN"))):
    cursor, _ = db
    data = list_join_requests(cursor, user)
    logger.info(f"Join request list fetched by admin user_id={user['id']}")
    return api_response(200, "Join requests fetched", data=jsonable_encoder(data))


@router.patch("/join-requests/{request_id}/approve")
def approve_join_request_route(
    request_id: str,
    payload: JoinRequestApproveRequest,
    db=Depends(get_db),
    user=Depends(auth_role("ADMIN")),
):
    cursor, connection = db
    logger.info(f"Join request approve attempt id={request_id} by user_id={user['id']}")
    data = approve_join_request(cursor, connection, request_id, user, payload)
    return api_response(200, "Join request approved", data=data)


@router.patch("/join-requests/{request_id}/reject")
def reject_join_request_route(
    request_id: str,
    payload: JoinRequestRejectRequest,
    db=Depends(get_db),
    user=Depends(auth_role("ADMIN")),
):
    cursor, connection = db
    logger.info(f"Join request reject attempt id={request_id} by user_id={user['id']}")
    data = reject_join_request(cursor, connection, request_id, user, payload)
    return api_response(200, "Join request rejected", data=data)
