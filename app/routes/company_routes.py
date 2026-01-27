from fastapi import APIRouter, Depends
from app.database.cursor_config import get_db
from app.services.company_service import create_company, list_companies, update_company
from app.schemas.company_schema import CompanyCreate, CompanyUpdate
from app.middleware.auth_me import auth_role
from app.utils.response_handler import api_response
from app.utils.logger import logger
from fastapi.encoders import jsonable_encoder

router = APIRouter(prefix="/companies", tags=["Companies"])
    

@router.post("")
def create_company_route(payload: CompanyCreate, db=Depends(get_db), user=Depends(auth_role("ADMIN")),):
    cursor, connection = db                                             # yield cursor and connection [IN ORDER]
    logger.info(f"Create company request by admin user_id={user['id']}")
    return create_company(cursor, connection, payload.model_dump())


@router.get("")
def list_companies_route(db=Depends(get_db),user=Depends(auth_role(["ADMIN", "EDITOR", "VIEWER"])),):
    cursor, connection = db
    data = list_companies(cursor)
    return jsonable_encoder({"data": data})


@router.patch("/{company_id}")
def update_company_route(company_id: str,payload: CompanyUpdate,db=Depends(get_db),user=Depends(auth_role("ADMIN")),):
    cursor, connection = db
    return update_company(cursor, connection, company_id, payload.model_dump())
  