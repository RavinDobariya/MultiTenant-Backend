from pydantic import BaseModel, EmailStr, Field


class JoinRequestCreateRequest(BaseModel):
    company_name: str = Field(min_length=2, max_length=100)
    email: EmailStr
    password: str = Field(min_length=8, max_length=12)
    requested_role: str = "user"


class JoinRequestApproveRequest(BaseModel):
    role: str | None = None


class JoinRequestRejectRequest(BaseModel):
    rejection_reason: str | None = Field(default=None, max_length=255)
