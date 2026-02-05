from fastapi import APIRouter, Depends, Query, HTTPException, UploadFile,File
from fastapi.encoders import jsonable_encoder

from app.database.cursor_config import get_db
from app.middleware.auth_me import auth_role
from app.utils.response_handler import api_response
from app.schemas.document_schema import DocumentCreate, DocumentUpdate, Action,DownloadType
from app.services.document_service import (create_document, list_documents,get_document, update_document, approve_document, archive_document,upload_document,delete_document,download_document)
from app.utils.logger import logger


router = APIRouter(prefix="/documents", tags=["Documents"])

"""
    def check_role(user: dict, allowed_roles: list[str]):
    # user["role"] should be ADMIN / EDITOR / VIEWER
    if user["role"] not in allowed_roles:
        raise HTTPException(status_code=403, detail="Forbidden")
"""

@router.post("/create")
async def create_doc(payload: DocumentCreate, db=Depends(get_db), user=Depends(auth_role(["ADMIN", "EDITOR"]))):
    """
    unit_id: str \n
    title: str  \n
    description: Optional   \n
    type: ["POLICY", "MANUAL", "REPORT"]    \n
    """
    
    cursor, connection = db
    
    logger.info(f"create document request by user_id={user['id']}")
    return await create_document(cursor, connection, payload.model_dump(), user)

@router.get("/list")
async def get_documents(
    page: int = Query(default=1, ge=1),
    limit: int = Query(default=10, ge=1, le=100),
    unit_id: str | None = None,
    status: str | None = None,
    type: str | None = None,
    sort_by:str | None = None,
    sort_order:str | None ="desc",
    archived_docs:bool = False,
    db=Depends(get_db),
    user=Depends(auth_role(["ADMIN", "EDITOR", "USER"]))):
    cursor, connection = db

    data = await list_documents(cursor, user, page, limit, unit_id, status, sort_by,sort_order,archived_docs,type_=type,)
    return api_response(200,"all docs fetched",data)

@router.get("/{document_id}")
async def get_doc(document_id: str,db=Depends(get_db),user=Depends(auth_role(["ADMIN", "EDITOR", "USER"]))):
    cursor,connection = db
    return await get_document(cursor,user,document_id)

@router.patch("/{document_id}")
async def update_doc(document_id: str, payload: DocumentUpdate,action:Action,db=Depends(get_db), user=Depends(auth_role(["ADMIN", "EDITOR"]))):

    cursor, connection = db
    return await update_document(cursor, connection, payload.model_dump(), user, document_id,action)


@router.patch("/{document_id}/approve")
async def approve_doc(document_id: str, db=Depends(get_db), user=Depends(auth_role(["ADMIN"]))):

    cursor, connection = db
    return await approve_document(cursor, connection, user, document_id)


@router.patch("/{document_id}/archive")
async def archive_doc(document_id: str, db=Depends(get_db), user=Depends(auth_role(["ADMIN"]))):

    cursor, connection = db
    return await archive_document(cursor, connection, user, document_id)

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

@router.get("/download")
async def download_doc(document_id:str | None =None,db=Depends(get_db),downloadType:DownloadType="PDF"):#user=Depends(auth_role(["ADMIN", "EDITOR","USER"]))
    cursor,connection =db
    user="user"
    return download_document(cursor,user,document_id,downloadType)

@router.delete("/delete/{document_id}")
async def delete_doc(document_id: str, db=Depends(get_db), user=Depends(auth_role(["ADMIN"])),confirm:bool = False):

    cursor, connection = db
    return delete_document(cursor, connection, user, document_id,confirm)