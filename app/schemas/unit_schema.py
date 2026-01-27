from pydantic import BaseModel, Field


class UnitCreateRequest(BaseModel):
    name: str = Field(min_length=2, max_length=50)


class UnitResponse(BaseModel):
    id: str
    company_id: str
    name: str
    is_archived: int
    

