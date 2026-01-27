from app.utils.logger import logger
from app.utils.response_handler import api_response
import uuid
from fastapi import HTTPException
from fastapi.encoders import jsonable_encoder

def create_unit(cursor, connection, payload: dict,user):
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
        cursor.execute("INSERT INTO unit (id, company_id, name) VALUES (%s, %s, %s)",[unit_id, user["company_id"], payload["name"]])   
        connection.commit()
        logger.info(f"Unit created with id: {unit_id} for company_id: {user['company_id']}")

        return api_response(201, "Unit created successfully", data={"unit_id": unit_id})
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error creating unit for company_id: {user['company_id']}, error: {str(e)}")
        return HTTPException(500, "Failed to create unit")
    
def get_units(cursor):
    try:
        cursor.execute("SELECT * FROM unit")         #fetch all units
        units = cursor.fetchall()
        result = jsonable_encoder({"data": units})
        return api_response(status_code=200,message="Units fetched",data=result)
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to fetch units with error: {str(e)}")
        raise HTTPException(500, "Internal server error")

def archive_unit(cursor,connection,unit_id,user):
    try:
        cursor.execute("UPDATE unit SET is_archived=1 WHERE id=%s AND company_id=%s",(unit_id, user["company_id"]))
        connection.commit()
        logger.info(f"Unit archived with id: {unit_id} for company_id: {user['company_id']}")

        if cursor.rowcount == 0:
            logger.warning("Unit not found or already archived")
            raise HTTPException(404, "Unit not found or already archived")
        return api_response(200, "Unit archived")
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error archiving unit_id: {unit_id} for company_id: {user['company_id']}, error: {str(e)}")
        raise HTTPException(500, "Internal server error")


def unarchive_unit(cursor,connection,unit_id,user):
    try:
        cursor.execute(
            "UPDATE unit SET is_archived=0 WHERE id=%s AND company_id=%s",(unit_id, user["company_id"]))
        connection.commit()
        logger.info(f"Unit unarchived with id: {unit_id} for company_id: {user['company_id']}")

        if cursor.rowcount == 0:
            logger.warning(f"Unarchive failed, unit_id: {unit_id} not found for company_id: {user['company_id']}")  
            raise HTTPException(404, "Unit not found")

        return api_response(200, "Unit unarchived") 
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error unarchiving unit_id: {unit_id} for company_id: {user['company_id']}, error: {str(e)}")
        raise HTTPException(500, "Internal server error")
    
def update_unit(cursor,connection,unit_id,payload):
    try:
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
            cursor.execute("UPDATE unit SET name=%s WHERE id=%s", (payload["name"], unit_id))
        connection.commit()
        
        logger.info(f"unit updated with id={unit_id}")
        return api_response(status_code=201,message="unit updated")
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(500,"Failed to update unit name")    