#---------------------------Utils--------------------------#
# config => loads settings from .env
# logger => application logger
# security => password hashing, JWT token creation

#--------------------------Services--------------------------#
# auth_service => signup, login, logout logic
# auth_role_service => manage roles and permissions

#--------------------------main app--------------------------#
# main.py => FastAPI app, routes

#-----------------------Database Models-----------------------#
# user_model => id, email, password_hash, role, company_id, created_at, updated_at
# company_model => id, name, created_at, updated_at
# unit model => id, company_id, name, is_archived created_at, updated_at
# document_model => id, unit_id, title, type, status, file_url, created_by, created_at
# audit_log_model => id, action, entity_id, user_id, created_at
# token_model => id, user_id, refresh_token, expires_at, created_at

#-----------------------Middleware-----------------------#
# access_middleware => role[admin,editor,viewer] based access control endpoints

#----------------------------routes----------------------------#
# auth_routes => signup, login, logout endpoints
# file_upload_routes => upload, get_document, list documents endpoints
# soft_deleted_routes => is_deleted flag
#we are doing this routes first... if this routes depends on routes like get compnies,post compnies then make those routes first...we have inserted table value using sql

#-------------------------Error Handling-------------------------#
# function to handle HTTP exceptions and logging

#-----------------------Query Repositories-----------------------#
# pagination
# filters: type, status, unit_id


