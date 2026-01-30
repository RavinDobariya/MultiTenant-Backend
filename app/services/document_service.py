import uuid
from fastapi import HTTPException, UploadFile
from app.utils.logger import logger,log_exception
from app.utils.cloudinary_files import upload_file_to_cloudinary
from app.utils.response_handler import api_response
from app.services.audit_service import create_audit_log
from fastapi.encoders import jsonable_encoder
ALLOWED_TYPES = {
    "application/pdf",
    "application/vnd.ms-excel",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    }

MAX_FILE_SIZE = 10 * 1024 * 1024  # 10MB

def create_document(cursor, connection, payload, user: dict):
    """
    Requirement:
    - Only ADMIN/EDITOR can upload documents
    - Unit must be in same company
    - Archived unit cannot accept new documents
    - Document created with status=DRAFT
    """
    try:
        cursor.execute("SELECT id, is_archived FROM unit WHERE id=%s AND company_id=%s", (payload["unit_id"], user["company_id"]))
        unit = cursor.fetchone()

        if not unit:
            raise HTTPException(status_code=404, detail="Unit not found")

        if unit["is_archived"] == 1:
            raise HTTPException(status_code=400, detail="Archived unit cannot accept new documents")
        while True:
            doc_id = str(uuid.uuid4())
            cursor.execute("SELECT 1 FROM company WHERE id = %s LIMIT 1",(doc_id,))

            exists = cursor.fetchone()
            if exists:
                logger.info("uuid generating again Bcuz duplicate found!!")
            else:
                break

        cursor.execute(
            "INSERT INTO document (id, unit_id, title, description, type, status, created_by,updated_at,updated_by) VALUES ( %s,%s, %s, %s, %s, 'DRAFT', %s,now(),%s)",
            (
                doc_id,
                payload["unit_id"],
                payload["title"],                   # required return error if not provided
                payload.get("description"),         # optional return None if not provided
                payload["type"],
                user["id"],
                user["id"]
            ),
        )
        connection.commit()

        logger.info(f"Document uploaded doc_id={doc_id} by user_id={user['id']}")
        
        #Audit logs
        create_audit_log(cursor,connection,action="Document Created",entity_id=doc_id,user_id=user["id"])
        
        return api_response(201, "Document created", doc_id)

    except HTTPException:
        raise 
    except Exception as e:
        log_exception(e,f"failed to Create document")
        raise HTTPException(status_code=500, detail="Failed to upload document")

def list_documents(cursor, user: dict, page: int, limit: int, unit_id=None, status=None,sort_by=None,sort_order=None, type_=None):
    """
    Requirement:
    - Pagination: ?page=1&limit=10 
    - Filtering: type, status, unit_id
    - Must return only documents from user's company
    """
    try:                
        offset = (page - 1) * limit         
        #page=1 => offset=0     (skip zero records, get first 10 records)
        #page=3 => offset=20    (skip first 20 records, get next 10 records)

        where = " WHERE u.company_id = %s "
        params = [user["company_id"]]

        if unit_id is not None:
            where += " AND d.unit_id = %s "
            params.append(unit_id)

        if status is not None:
            where += " AND d.status = %s "
            params.append(status)

        if type_ is not None:
            where += " AND d.type = %s "
            params.append(type_)
        
        sort_fields = {
            "created_at": "d.created_at",
            "updated_at": "d.updated_at",
            "title": "d.title",
            "status": "d.status",
            "type": "d.type"
        }
        sort_column = "d.created_at"
        if sort_by:
            sort_by = sort_by.lower()
            if sort_by not in sort_fields:
                raise HTTPException(status_code=400, detail="Invalid sort_by field")
            sort_column = sort_fields[sort_by]
            
        sort_order = (sort_order or "desc").lower()
        if sort_order not in ["asc", "desc"]:
            raise HTTPException(status_code=400, detail="Invalid sort_order")

        order_by = f" ORDER BY {sort_column} {sort_order.upper()} "     #d.type ASC || d.status ASC
        
        # total count
        cursor.execute(f"SELECT COUNT(*) AS total FROM document d JOIN unit u ON u.id = d.unit_id {where}", tuple(params),)
        results = cursor.fetchone()
        total_count = results["total"]

        # data
        cursor.execute(
            f"""
            SELECT d.id, d.unit_id, d.title, d.description, d.type, d.status,
                   d.file_url, d.created_by, d.created_at, d.approved_by, d.updated_at
            FROM document d
            JOIN unit u ON u.id = d.unit_id
            {where}
            {order_by}
            LIMIT %s OFFSET %s                                             
            """,
            tuple(params + [limit, offset]),
        )
        rows = cursor.fetchall()
        data = {
            "page": page,
            "limit": limit,
            "total results": total_count,
            "sort_by": sort_by or "created_at",
            "sort_order": sort_order,
            "data": rows
            }
        return jsonable_encoder(data)

    except HTTPException:
        raise
    except Exception as e:
        log_exception(e,f"failed to list document")
        raise HTTPException(status_code=500, detail="Failed to fetch documents")


def update_document(cursor, connection, payload: dict, user: dict, document_id: str):
    """
    Requirement:
    - Only ADMIN/EDITOR can update documents
    - Only DRAFT document can be updated
    - Must belong to same company
    """
    try:
        cursor.execute(                             
            """
            SELECT d.id, d.status 
            FROM document d
            JOIN unit u ON u.id = d.unit_id 
            WHERE d.id=%s AND u.company_id=%s
            """,
            (document_id, user["company_id"]),
        )
        doc = cursor.fetchone()

        if not doc:
            raise HTTPException(status_code=404, detail="Document not found")

        if doc["status"] != "DRAFT":
            raise HTTPException(status_code=400, detail="Only DRAFT document can be updated")

        fields = []         #keys only
        values = []         #values only

        for key in ["title", "description", "type", "file_url"]:
            if payload.get(key) is not None:
                fields.append(f"{key}=%s")          #["title=%s", "description=%s"]
                values.append(payload[key])         #[value1, value2]

        if not fields:
            raise HTTPException(status_code=400, detail="No fields to update")

        values.extend([user["id"],document_id])

        cursor.execute(                                                                         #{', '.join(fields) => title=%s, description=%s
            f"UPDATE document SET {', '.join(fields)},updated_at=now(),updated_by=%s WHERE id=%s",                             #####################
            values,             #list[values] => ["New Title", "new.pdf", "doc_id_123"] 
                                #tuple(values) => ("New Title", "new.pdf", "doc_id_123") both works
        )
        connection.commit()

        logger.info(f"Document updated doc_id={document_id} by user_id={user['id']}")
        
        #Audit logs
        create_audit_log(cursor,connection,action="Document Updated",entity_id=document_id,user_id=user["id"])
        return api_response(201, "Document updated",document_id)

    except HTTPException:
        raise
    except Exception as e:
        log_exception(e,f"failed to Update document")
        raise HTTPException(status_code=500, detail="Failed to update document")


def approve_document(cursor, connection, user: dict, document_id: str):
    """
    Requirement:
    - Only ADMIN can approve
    - Valid transition: DRAFT -> APPROVED
    """
    try:
        cursor.execute(                                     # Approve this document only if it belongs to the current user's company and is currently in DRAFT status.

            """
            UPDATE document d
            JOIN unit u ON u.id = d.unit_id
            SET d.status='APPROVED', d.approved_by=%s,d.updated_at=now(),d.updated_by=%s
            WHERE d.id=%s AND u.company_id=%s AND d.status='DRAFT'
            """,
            (user["id"],user["id"],document_id, user["company_id"]),
        )

        if cursor.rowcount == 0:
            raise HTTPException(status_code=400, detail="Invalid state transition")

        connection.commit()

        logger.info(f"Document approved doc_id={document_id} by user_id={user['id']}")
        
        #Audit logs
        create_audit_log(cursor,connection,action="Document Approved",entity_id=document_id,user_id=user["id"])
        return api_response(200, "Document approved",(document_id,user['id']))

    except HTTPException:
        raise
    except Exception as e:
        log_exception(e,f"Approve document failed")
        raise HTTPException(status_code=500, detail="Failed to approve document")


def archive_document(cursor, connection, user: dict, document_id: str):
    """
    Requirement:
    - Delete documents = soft delete (draft || approved -> archived)
    - Valid transition: APPROVED -> ARCHIVED (and DRAFT -> ARCHIVED also ok)
    """
    try:                                            #document → unit → company  => doc doesnt have company_id directly
                                                    #Archive this document only if it belongs to the current users company and it is not already archived.
        cursor.execute( 
            """                                     
            UPDATE document d 
            JOIN unit u ON u.id = d.unit_id 
            SET d.status='ARCHIVED' ,d.updated_at=now(),d.updated_by=%s
            WHERE d.id=%s 
            AND u.company_id=%s 
            AND d.status!='ARCHIVED'
            """,
            (user["id"],document_id, user["company_id"]),
        )

        if cursor.rowcount == 0:
            raise HTTPException(status_code=404, detail="Document not found / already archived")

        connection.commit()

        logger.info(f"Document archived doc_id={document_id} by user_id={user['id']}")
        
        #Audit logs
        create_audit_log(cursor,connection,action="Document Archived",entity_id=document_id,user_id=user["id"])
        
        return api_response(201, "Document archived",(document_id,user["id"]))

    except HTTPException:
        raise
    except Exception as e:
        log_exception(e,f"Archive document failed")
        raise HTTPException(status_code=500, detail="Failed to archive document")


async def upload_document(document_id,file: UploadFile,cursor,connection,user):
    try:
        # validate type
        if file.content_type not in ALLOWED_TYPES:          #file.content_type → "application/pdf" (MIME type)
            raise HTTPException(status_code=400,detail=f"Invalid file type: {file.content_type}")

        file_bytes = await file.read()

        # validate size
        if len(file_bytes) > MAX_FILE_SIZE:
            raise HTTPException(status_code=413,detail="File too large (max 10MB allowed)")

        file_url =  upload_file_to_cloudinary(
            file_bytes=file_bytes,
            filename=file.filename or "file_x",
            content_type=file.content_type
        )
        if not file_url:
            raise HTTPException(500,f"file_url did not generated {file_url}")

        cursor.execute(
            """
            UPDATE document d
            JOIN unit u ON u.id = d.unit_id
            SET d.file_url = %s,d.updated_at=now(),d.updated_by=%s
            WHERE d.id = %s AND u.company_id = %s
            """,
            (file_url,user["id"], document_id, user["company_id"])
        )
        if cursor.rowcount == 0:
            raise HTTPException(status_code=404, detail="document not found!!")
        
        connection.commit()
        
        #Audit logs
        create_audit_log(cursor,connection,action="Document Uploaded",entity_id=document_id,user_id=user["id"])
        
        return api_response(201, "File uploaded successfully",file_url)
    
    except HTTPException:
        raise
    except Exception as e:
        log_exception(e,f"failed to upload an file")
        raise HTTPException(500,"Error while uploading file")
