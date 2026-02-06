from app.utils.logger import logger,log_exception
from app.utils.response_handler import api_response
from app.services.audit_service import create_audit_log
from app.services.company_service import delete_company
import uuid
from fastapi import HTTPException
from fastapi.encoders import jsonable_encoder

from app.utils.cache import cache_set, cache_get, cache_delete,cache_delete_pattern
from app.utils.cache_keys import create_cache_key,create_list_cache_key

from app.task.audit_task import create_audit_log_task

async def create_unit(cursor, connection, payload: dict,user):
    try:
        #unique name checking
        cursor.execute("SELECT 1 FROM unit WHERE name=%s LIMIT 1",(payload["name"],))
        name_exists = cursor.fetchone()
        if name_exists:
            raise HTTPException(status_code=409, detail="Unit name already exists")     #409 = Duplicate/Conflict issue
        
        #uniqe id checking
        while True:
            unit_id = str(uuid.uuid4())
            cursor.execute("SELECT 1 FROM unit WHERE id = %s LIMIT 1",(unit_id,))

            exists = cursor.fetchone()
            if exists:
                logger.info("uuid generating again Bcuz duplicate found!!")
            else:
                break

        # cursor.execute(...),[list] or (tuple) => both works
        cursor.execute("INSERT INTO unit (id, company_id, name,created_by,updated_at,updated_by) VALUES (%s, %s, %s,%s,now(),%s)",[unit_id, user["company_id"], payload["name"],user["id"],user["id"]])
        connection.commit()

        # No need to cache single unit key on unit creation
        await cache_delete_pattern("key_unit*")

        logger.info(f"Unit created with id: {unit_id} for company_id: {user['company_id']}")
        
        #Audit logs
        task = create_audit_log_task.delay(action="UNIT_CREATED",entity_id=unit_id,user_id=user["id"])
        print("\n\ntask id \n",task.id,"\n\n")
        return api_response(201, "Unit created successfully", data={"unit_id": unit_id})
    except HTTPException:
        raise
    except Exception as e:
        log_exception(e,f"Error creating unit for company_id: {user['company_id']}")
        return HTTPException(500, "Failed to create unit")
    
async def get_units(cursor):
    try:
        # create cache key
        cache_key = create_cache_key("units","list")

        #check cache
        cached_data = await cache_get(cache_key)

        if cached_data:
            return cached_data

        cursor.execute("SELECT * FROM unit")         #fetch all units
        units = cursor.fetchall()
        result = jsonable_encoder({"data": units})

        #save to cache
        await cache_set(cache_key,result)             #result = units conflict

        return api_response(status_code=200,message="Units fetched",data=result)
    except HTTPException:
        raise
    except Exception as e:
        log_exception(e,f"Failed to fetch units with error")
        raise HTTPException(500, "Internal server error")


async def get_unit_by_id(cursor,unit_id:str):
    try:

        # create cache key
        cache_key = create_cache_key("unit", unit_id)

        cached_data = await cache_get(cache_key)
        if cached_data:
            return cached_data

        # Get unit
        cursor.execute("SELECT id, name, is_archived FROM unit WHERE id = %s",(unit_id,))
        unit = cursor.fetchone()

        if not unit:
            raise HTTPException(status_code=404, detail="Unit not found")

        # Get docs
        cursor.execute("SELECT id, title,type FROM document WHERE unit_id = %s",(unit_id,))
        docs = cursor.fetchall()

        await cache_set(cache_key,unit)
        return {
        "id": unit["id"],
        "name": unit["name"],
        "Documents": docs
        }
        
    except HTTPException:
        raise
    except Exception as e:
        log_exception(e,f"failed to fetch Unit | {unit_id}")
        raise HTTPException(status_code=500, detail="Failed to fetch Unit: | {unit_id}")


async def archive_unit(cursor,connection,unit_id,user,cascade):
    """
           Requirement:
           - On Cascade all child docs should also be archived
           - On Non Cascade only unit should be archived
           - Only ADMIN can archive units
           """
    try:

        # create cache key
        cache_key = create_cache_key("unit", unit_id)

        await cache_delete(cache_key)
        await cache_delete_pattern("key_unit*")

        cursor.execute("UPDATE unit SET is_archived=1,updated_at=now(),updated_by=%s WHERE id=%s AND company_id=%s",(user["id"],unit_id, user["company_id"]))

        if cursor.rowcount == 0:
            logger.warning("Unit not found or already archived")
            raise HTTPException(404, "Unit not found or already archived")
        if cascade:
            cursor.execute("update document set is_archived=1 ,updated_at=now(),updated_by=%s where unit_id=%s",(user["id"],unit_id))
        connection.commit()
        logger.info(f"Unit archived with id: {unit_id} for company_id: {user['company_id']}")

        # Audit logs
        create_audit_log_task.delay( action="UNIT_ARCHIVED", entity_id=unit_id, user_id=user["id"])
        
        return api_response(200, "Unit archived")
    except HTTPException:
        raise
    except Exception as e:
        log_exception(e,f"Error archiving unit_id: {unit_id} for company_id: {user['company_id']}")
        raise HTTPException(500, "Internal server error")


async def unarchive_unit(cursor,connection,unit_id,user):
    try:
        # create cache key
        cache_key = create_cache_key("unit", unit_id)

        await cache_delete(cache_key)
        await cache_delete_pattern("key_unit*")

        cursor.execute(
            "UPDATE unit SET is_archived=0,updated_at=now(),updated_by=%s WHERE id=%s AND company_id=%s",(user["id"],unit_id, user["company_id"]))
        connection.commit()
        logger.info(f"Unit unarchived with id: {unit_id} for company_id: {user['company_id']}")

        if cursor.rowcount == 0:
            logger.warning(f"Unarchive failed, unit_id: {unit_id} not found for company_id: {user['company_id']}")  
            raise HTTPException(404, "Unit Not Found!!")

        #Audit logs
        create_audit_log_task.delay(action="UNIT_UNARCHIVED",entity_id=unit_id,user_id=user["id"])
        return api_response(200, "Unit unarchived") 
    except HTTPException:
        raise
    except Exception as e:
        log_exception(e,f"Error unarchiving unit_id: {unit_id} for company_id: {user['company_id']}")
        raise HTTPException(500, "Internal server error")
    
async def update_unit(cursor,connection,unit_id,payload,user):
    try:
        # create cache key
        cache_key = create_cache_key("unit", unit_id)

        await cache_delete(cache_key)
        await cache_delete_pattern("key_unit*")

        cursor.execute("SELECT id,is_archived FROM unit WHERE id=%s", (unit_id,))
        existing_unit = cursor.fetchone()
        
        
        if not existing_unit or existing_unit["is_archived"] == 1:
            raise HTTPException(status_code=404, detail="unit not found or unit is archived!!")
        
        #if "name" in payload and payload["name"] is not None:
        name = payload.get("name")
        if name is not None:    
            cursor.execute("SELECT 1 FROM unit WHERE name=%s AND id!=%s", (payload["name"], unit_id))        #check if thus"name" exists in db or not
            name_conflict = cursor.fetchone()
            if name_conflict:
                raise HTTPException(status_code=409, detail="unit name already taken")
            cursor.execute("UPDATE unit SET name=%s,updated_at=now(),updated_by=%s WHERE id=%s", (payload["name"],user["id"], unit_id))
        connection.commit()

        logger.info(f"unit updated with id={unit_id}")
        
        #Audit logs
        create_audit_log_task.delay(action="UNIT_UPDATED",entity_id=unit_id,user_id=user["id"])
        
        return api_response(status_code=201,message="unit updated")
    
    except HTTPException:
        raise
    except Exception as e:
        log_exception(e,f"Failed to update unit name")
        raise HTTPException(500,"Failed to update unit name")

async def delete_unit(cursor,connection,unit_id,user,confirm: bool = False):
    try:
        if confirm:
            # create cache key
            cache_key = create_cache_key("unit", unit_id)

            await cache_delete(cache_key)
            await cache_delete_pattern("key_unit*")

        cursor.execute("SELECT count(*) as total_unit FROM unit WHERE company_id=%s", (user["company_id"],))
        total_unit = cursor.fetchone()

        # Get company_id first
        if total_unit["total_unit"] <= 1:
            cursor.execute("SELECT company_id FROM unit WHERE id=%s", (unit_id,))
            row = cursor.fetchone()

            if not row:
                raise HTTPException(status_code=404, detail="Unit not found")

            company_id = row["company_id"]

        if not confirm:
            if total_unit["total_unit"] <= 1:
                return api_response(
                    200,
                    f"Deleting this last unit will  also delete unit's company . Please confirm.",
                    {"confirm_required": True}
                )
            return api_response(
                200,
                "Deleting this unit will remove all related data. Please confirm.",
                {"confirm_required": True}
            )

        cursor.execute("DELETE FROM unit WHERE id=%s ",(unit_id,))
        if cursor.rowcount == 0:
            raise HTTPException(status_code=404, detail="Unit not found || error during deletion")

        if total_unit["total_unit"] <= 1:
            delete_company(cursor, connection, company_id,confirm)
        connection.commit()

        # Audit logs
        create_audit_log_task.delay(action="UNIT_PERMANENTLY_DELETED", entity_id=unit_id, user_id=user["id"])
        logger.info(f"unit deleted successfully with id={unit_id}")
        return api_response(200, "unit deleted successfully", unit_id)

    except HTTPException:
        raise
    except Exception as e:
        log_exception(e, f"Failed to delete unit")
        connection.rollback()
        raise HTTPException(500, "Failed to delete unit")
