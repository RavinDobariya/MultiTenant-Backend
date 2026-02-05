from fastapi import APIRouter, Depends
from app.database.cursor_config import get_db
from app.services.company_service import create_company, list_companies, update_company, get_company_by_id,delete_company
from app.schemas.company_schema import CompanyCreate, CompanyUpdate
from app.middleware.auth_me import auth_role
from app.utils.logger import logger
from fastapi.encoders import jsonable_encoder

from app.celery_app import celery_app
from celery.result import AsyncResult

router = APIRouter(prefix="/companies", tags=["Companies"])
    

@router.post("")
def create_company_route(payload: CompanyCreate, db=Depends(get_db), user=Depends(auth_role("ADMIN")),):        #########
    cursor, connection = db                                             # yield cursor and connection [IN ORDER]
    logger.info(f"Create company request by admin user_id={user['id']}")
    return create_company(cursor, connection, payload.model_dump(),user)


@router.get("")
def list_companies_route(db=Depends(get_db),user=Depends(auth_role(["ADMIN", "EDITOR", "VIEWER"]))):
    cursor, connection = db
    data = list_companies(cursor)
    logger.info(f"List companies request by admin user_id={user['id']}")
    return jsonable_encoder({"data": data})

@router.get("/get-your-company")
def get_company_by_id_route(db=Depends(get_db),user=Depends(auth_role(["ADMIN", "EDITOR", "VIEWER"]))):
    cursor,connection = db
    data = get_company_by_id(cursor,user)
    logger.info(f"Get company by id request by admin user_id={user['id']}")
    return jsonable_encoder({"data": data})
    
@router.patch("/update")                                                                                  #########
def update_company_route(payload: CompanyUpdate,db=Depends(get_db),user=Depends(auth_role("ADMIN")),):
    cursor, connection = db
    logger.info(f"Update company request by admin user_id={user['id']}")
    return update_company(cursor, connection,  payload.model_dump(),user)

@router.delete("/delete")
def delete_unite_route(confirm: bool = False, user=Depends(auth_role(["ADMIN"])), db=Depends(get_db)):

    cursor, connection = db
    logger.info(f"Delete company request by admin user_id={user['id']}")
    return delete_company(cursor, connection, confirm,user)

@router.get("/task/{task_id}")
def get_task_status(task_id:str):

    result = AsyncResult(task_id,app=celery_app)        #Here app=celery_app is not mandatory

    return {
        "task_id": task_id,
        "status": result.status,           # PENDING / STARTED / SUCCESS / FAILURE
        "result": result.result            # Output or Error
    }