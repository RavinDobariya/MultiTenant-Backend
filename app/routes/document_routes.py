from fastapi import APIRouter, Depends, Query, HTTPException, UploadFile,File
from fastapi.encoders import jsonable_encoder

from app.database.cursor_config import get_db
from app.middleware.auth_me import auth_role
from app.utils.response_handler import api_response
from app.schemas.document_schema import DocumentCreate, DocumentUpdate
from app.services.document_service import (create_document, list_documents, update_document, approve_document, archive_document,upload_document)
from app.utils.logger import logger


router = APIRouter(prefix="/documents", tags=["Documents"])

"""
    def check_role(user: dict, allowed_roles: list[str]):
    # user["role"] should be ADMIN / EDITOR / VIEWER
    if user["role"] not in allowed_roles:
        raise HTTPException(status_code=403, detail="Forbidden")
"""

@router.post("/create")
def create_doc(payload: DocumentCreate, db=Depends(get_db), user=Depends(auth_role(["ADMIN", "EDITOR"]))):
    """
    unit_id: str \n
    title: str  \n
    description: Optional   \n
    type: ["POLICY", "MANUAL", "REPORT"]    \n
    """
    
    cursor, connection = db
    
    logger.info(f"create document request by user_id={user['id']}")
    return create_document(cursor, connection, payload.model_dump(), user)

@router.get("/list")
def get_documents(
    page: int = Query(default=1, ge=1),
    limit: int = Query(default=10, ge=1, le=100),
    unit_id: str | None = None,
    status: str | None = None,
    type: str | None = None,
    sort_by:str | None = None,
    sort_order:str | None ="desc",
    db=Depends(get_db),
    user=Depends(auth_role(["ADMIN", "EDITOR", "VIEWER"])),
):
    cursor, connection = db
    data = list_documents(cursor, user, page, limit, unit_id, status, sort_by,sort_order,type_=type,)
    return api_response(200,"all docs fetched",data)


@router.patch("/{document_id}")
def update_doc(document_id: str, payload: DocumentUpdate, db=Depends(get_db), user=Depends(auth_role(["ADMIN", "EDITOR"]))):

    cursor, connection = db
    return update_document(cursor, connection, payload.model_dump(), user, document_id)


@router.patch("/{document_id}/approve")
def approve_doc(document_id: str, db=Depends(get_db), user=Depends(auth_role(["ADMIN"]))):

    cursor, connection = db
    return approve_document(cursor, connection, user, document_id)


@router.patch("/{document_id}/archive")
def archive_doc(document_id: str, db=Depends(get_db), user=Depends(auth_role(["ADMIN"]))):

    cursor, connection = db
    return archive_document(cursor, connection, user, document_id)

@router.post("/upload/{document_id}")
async def upload_doc(                   
    document_id: str,                   #File(...) => take file from multipart form-data
    file: UploadFile = File(...),       # ... means required field
    db=Depends(get_db),
    user= Depends(auth_role(["ADMIN", "EDITOR"]))  
):
    cursor,connection =db
    file_url = await upload_document(document_id,file,cursor,connection,user)


    return file_url 