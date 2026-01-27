from pydantic import BaseModel
from typing import Optional


class CompanyCreate(BaseModel):
    name: str


class CompanyUpdate(BaseModel):
    name: Optional[str] = None

class CompanyResponse(BaseModel):
    id: int
    name: str
