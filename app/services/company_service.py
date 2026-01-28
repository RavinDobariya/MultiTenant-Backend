from fastapi import HTTPException
from app.utils.logger import logger,log_exception
from fastapi.encoders import jsonable_encoder
from app.utils.response_handler import api_response  
import uuid

def create_company(cursor, connection, payload: dict):
    """
    Requirement:
    - Only ADMIN can create companies
    - Company name must be unique
    """
    try:
        cursor.execute("SELECT id FROM company WHERE name=%s", (payload["name"],))
        existing_company = cursor.fetchone()

        if existing_company:
            raise HTTPException(status_code=400, detail="Company name already exists")

        while True:
            company_id = str(uuid.uuid4())
            cursor.execute("SELECT 1 FROM company WHERE id = %s LIMIT 1",(company_id,))

            exists = cursor.fetchone()
            if exists:
                logger.info("uuid generating again Bcuz duplicate found!!")
            else:
                break
            
        cursor.execute("INSERT INTO company (id,name, created_at) VALUES (%s,%s, NOW())",[company_id,payload["name"]])
        connection.commit()

        logger.info(f"Company created with name={payload['name']}")
        return api_response(status_code=201,message="Company created")

    except HTTPException:
        raise 
    except Exception as e:
        log_exception(e,f"Failed to create company")
        raise HTTPException(status_code=500, detail="Failed to create company")


def list_companies(cursor): 
    try:
        cursor.execute("SELECT * FROM company;")
        companies = cursor.fetchall()
        companies = jsonable_encoder(companies)
        return companies
    
    except HTTPException:
        raise
    except Exception as e:
        log_exception(e,f"failed to List companies")
        raise HTTPException(status_code=500, detail="Failed to fetch companies")

def update_company(cursor, connection, company_id: str, payload: dict):
    """
    Requirement:
    - Only ADMIN can update companies
    - Company name must be unique
    """
    try:
        cursor.execute("SELECT id FROM company WHERE id=%s", (company_id,))
        existing_company = cursor.fetchone()
        
        if not existing_company:
            raise HTTPException(status_code=404, detail="Company not found")
        
        #if "name" in payload and payload["name"] is not None:
        name = payload.get("name")
        if name is not None:    
            cursor.execute("SELECT 1 FROM company WHERE name=%s AND id!=%s", (payload["name"], company_id))        #check if thus"name" exists in db or not
            name_conflict = cursor.fetchone()
            if name_conflict:
                raise HTTPException(status_code=409, detail="Company name already taken")
            cursor.execute("UPDATE company SET name=%s WHERE id=%s", (payload["name"], company_id))
        connection.commit()
        
        logger.info(f"Company updated with id={company_id}")
        return api_response(status_code=201,message="Company updated")
    
    except HTTPException:
        raise
    except Exception as e:
        log_exception(e,f"Update company failed")
        raise HTTPException(status_code=500, detail="Failed to update company")  