#inside password_hash = payload.password, hash passwrord pending

from fastapi import HTTPException, Depends
from app.utils.security import create_access_token, create_refresh_token, verify_password
from app.utils.logger import logger,log_exception
from app.utils.error_hanlder import register_exception_handlers
from app.utils.security import hash_password
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
import uuid

ALLOWED_ROLES = {"admin", "user","editor"}


def auth_signup(cursor, conn, payload):
    try:
        # role validate
        if payload.role not in ALLOWED_ROLES:
            logger.warning(f"Signup attempt with invalid role: {payload.role}") 
            raise HTTPException(400, "Invalid role")
        
#0 False [], (),None,{} ,if not user

        # email exists?
        cursor.execute("SELECT 1 FROM `user` WHERE email=%s", [payload.email])
        if cursor.fetchone():
            logger.warning(f"Signup attempt with existing email: {payload.email}")  
            raise HTTPException(400, "Email already registered")

        # company exists?
        cursor.execute("SELECT 1 FROM company WHERE id=%s", [payload.company_id])
        if not cursor.fetchone():
            logger.warning(f"Signup attempt with non-existing company_id: {payload.company_id}")
            raise HTTPException(404, "Company not found")

        while True:
            user_id = str(uuid.uuid4()) # ex: U1A2B

            cursor.execute("SELECT 1 FROM user WHERE id = %s LIMIT 1",(user_id,))

            exists = cursor.fetchone()
            if exists:
                logger.info("uuid generating again Bcuz duplicate found!!")
            else:
                break
        
        hashed_pass =hash_password(payload.password)    
        cursor.execute(
            "INSERT INTO `user` (id, email, password_hash, role, company_id) VALUES (%s,%s,%s,%s,%s)",
            (user_id, payload.email, hashed_pass, payload.role, payload.company_id)
        )
        conn.commit()
        logger.info(f"User signed up with email: user_id: {user_id},{payload.email}")

        return {"id": user_id, "email": payload.email, "role": payload.role, "company_id": payload.company_id}
    except HTTPException:
        raise
    except Exception as e:
        log_exception(e,f"Error during signup for email: {payload.email}")
        raise HTTPException(500, "Signup failed")


def auth_login(cursor, conn, payload):
    try:
        cursor.execute( "SELECT id, email, password_hash, role, company_id FROM `user` WHERE email=%s",[payload.email])
        user = cursor.fetchone()

        if not user:
            logger.warning(f"Login attempt with invalid email: {payload.email}")
            raise HTTPException(status_code=404, detail="Invalid email")

        result = verify_password(payload.password,user["password_hash"])
        if not result:
            logger.warning(f"Login attempt with invalid password for email: {payload.email}")
            raise HTTPException(status_code=401, detail="Invalid password")

        access_token = create_access_token({   
            "user_id": user["id"],
            "email": user["email"],
            "role": user["role"],
            "company_id": user["company_id"]
        })
        refresh_token = create_refresh_token()
        
        cursor.execute(
            "INSERT INTO refresh_token (token, user_id) VALUES (%s, %s)",
            (refresh_token, user["id"])
        )
        conn.commit()
        logger.info(f"User logged in: user_id: {user['id']}, email: {payload.email}")

        return {"access_token": access_token,"refresh_token": refresh_token,"token_type": "bearer"}
    except HTTPException:
        raise
    except Exception as e:
        log_exception(e,f"Auth Login Failed | email={payload.email}")
        raise HTTPException(500, "Login failed")

def auth_refresh(cursor, conn, refresh_token: str):
    try:
        cursor.execute("SELECT token, user_id, is_revoked FROM refresh_token WHERE token=%s",[refresh_token])
        token = cursor.fetchone()

        if not token:
            logger.warning("Token refresh attempt with invalid refresh token")
            raise HTTPException(401, "Invalid refresh token")

        if token["is_revoked"] == 1:
            
            
            logger.warning("Token refresh attempt with revoked refresh token")
            raise HTTPException(401, "Refresh token revoked")

        #fetching user details
        cursor.execute("SELECT id, email, role, company_id FROM `user` WHERE id=%s",[token["user_id"]])
        user = cursor.fetchone()

        if not user:
            logger.warning(f"User not found for refresh token: {refresh_token}")
            raise HTTPException(401, "User not found")

        # create new access token
        new_access_token = create_access_token({
            "user_id": user["id"],
            "email": user["email"],
            "role": user["role"],
            "company_id": user["company_id"]
        })

        return {"access_token": new_access_token, "refresh_token": refresh_token, "token_type": "bearer"}
    except HTTPException:
        raise
    except Exception as e:
        log_exception(e,f"Error during token refresh error | {refresh_token}")
        raise HTTPException(500, "Token refresh failed")
    
def auth_logout(cursor, conn,user):
    try:
        user_id = user["id"]
        cursor.execute("SELECT is_revoked FROM refresh_token WHERE user_id=%s",[user_id])
        rows = cursor.fetchall()

        if not rows:
            logger.warning("Logout attempt with invalid refresh token")
            raise HTTPException(401, "Invalid refresh token")

        token_row = all(r["is_revoked"] == 1 for r in rows)
        
        if token_row:       #reovoke token =>1(True)
            logger.warning("Logout attempt with already revoked refresh token")
            raise HTTPException (status_code=401, detail="Already logged out")                        # already logged out

        cursor.execute("UPDATE refresh_token SET is_revoked=1 WHERE user_id=%s",[user_id])
        conn.commit()
        logger.info(f"User logged out successfully for {user}")
        
    except HTTPException:
        raise
    except Exception as e:
        log_exception(e,f"Error during logout | {user_id}")
        raise HTTPException(500, "Logout failed")


def delete_user(cursor, connection,user,confirm: bool ):
    try:
        if not confirm:
            return (
                "Deleting this document will remove all related data. Please confirm.",
                {"confirm_required": True}
            )
        cursor.execute("UPDATE `user` SET is_delete = 1  WHERE id=%s ",(user["id"],))
        connection.commit()

        return { "message": f"User deleted successfully {user['id']}"}

    except HTTPException:
        raise
    except Exception as e:
        connection.rollback()
        log_exception(e,f"Delete document failed")
        raise HTTPException(status_code=500, detail="Failed to delete document")
