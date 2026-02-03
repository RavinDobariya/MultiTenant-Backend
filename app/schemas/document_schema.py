from pydantic import BaseModel
from typing import Optional, Literal
from enum import Enum


class DocumentType(str, Enum):
    POLICY = "POLICY"
    MANUAL = "MANUAL"
    REPORT = "REPORT"           
DocumentStatus = Literal["DRAFT", "APPROVED", "ARCHIVED"]       #not used yet!!!!!!!!!!!

class Action(str,Enum):
    METADATA = "METADATA"
    ARCHIVE = "ARCHIVE"
    RESTORE = "RESTORE"

class DocumentCreate(BaseModel):
    unit_id: str
    title: str
    description: Optional[str] = None
    type: DocumentType
    


class DocumentUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    type: Optional[DocumentType] = None

class DownloadType(str,Enum):
    PDF = "PDF"
    AUDIO = "AUDIO"