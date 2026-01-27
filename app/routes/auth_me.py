from fastapi import APIRouter, Depends
from app.middleware.auth_me import get_current_user,auth_role
from app.database.cursor_config import get_db
from app.utils.response_handler import api_response

router = APIRouter(tags=["Auth Me"])

@router.get("/me")
def auth_me(user=Depends(get_current_user)): 
    user = {
        "user_id": user["id"],
        "email": user["email"],
        "role": user["role"],
        "company_id": user["company_id"]
    }
    return api_response(200, "User info fetched", data=user)

@router.get("/admin")
def auth_me_admin(user=Depends(auth_role("ADMIN"))):
    user_data = {
        "user_id": user["id"],
        "email": user["email"],
        "role": user["role"],
        "company_id": user["company_id"]
    }
    return api_response(200, "Admin user info fetched", data=user_data)
