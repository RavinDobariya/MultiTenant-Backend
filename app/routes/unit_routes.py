from fastapi import APIRouter, Depends, HTTPException
from app.database.cursor_config import get_db
from app.services.unit_service import create_unit, get_units, archive_unit, unarchive_unit, update_unit,get_unit_by_id,delete_unit
from app.middleware.auth_me import auth_role
from app.schemas.unit_schema import UnitCreateRequest
from fastapi.encoders import jsonable_encoder

from app.utils.logger import logger

router = APIRouter(tags=["Units"]) 

@router.post("/units")
def create_unit_route(payload: UnitCreateRequest, user=Depends(auth_role(["ADMIN","EDITOR"])), db=Depends(get_db)):
        cursor, connection = db
        logger.info(f"Attempting to create unit for company_id: {user['company_id']}")
        return create_unit(cursor,connection,payload.model_dump(),user)




@router.get("/units")
def get_units_routes(db=Depends(get_db),user=Depends(auth_role(["ADMIN","EDITOR","USER"]))):
        logger.info("Fetching all units at /units endpoint")
        cursor, connection = db
        return get_units(cursor)
        

@router.get("/{unit_id}")
def get_unit_by_id_route(unit_id: str,db=Depends(get_db),user=Depends(auth_role(["ADMIN", "EDITOR", "VIEWER"]))):
    cursor,connection = db
    data = get_unit_by_id(cursor,unit_id)
    return jsonable_encoder({"data": data})

      
@router.patch("/{unit_id}/archive")
def archive_unit_route(unit_id: str,cascade:bool=False, user=Depends(auth_role(["ADMIN","EDITOR"])), db=Depends(get_db)):
    """
    Requirement:
    - On Cascade all child docs should also be archived
    - On Non Cascade only unit should be archived
    - Only ADMIN can archive units
    """
    logger.info(f"Attempting to archive unit_id: {unit_id} for company_id: {user['company_id']}")
    cursor, connection = db
    return archive_unit(cursor,connection,unit_id,user,cascade)


@router.patch("/{unit_id}/unarchive")
def unarchive_unit_route(unit_id: str, user=Depends(auth_role(["ADMIN","EDITOR"])), db=Depends(get_db)):
    logger.info(f"Attempting to unarchive unit_id: {unit_id} for company_id: {user['company_id']}")
    cursor, connection = db
    return unarchive_unit(cursor, connection,unit_id,user)

@router.patch("/update/{unit_id}")
def update_unit_route(unit_id: str,payload: UnitCreateRequest,db=Depends(get_db),user=Depends(auth_role(["ADMIN","EDITOR"])),):
    cursor, connection = db
    return update_unit(cursor, connection, unit_id, payload.model_dump(),user)

@router.delete("/delete/{unit_id}")
def delete_unite_route(unit_id: str, user=Depends(auth_role(["ADMIN"])), db=Depends(get_db),confirm: bool = False):

    cursor, connection = db
    return delete_unit(cursor, connection, unit_id,user,confirm)
