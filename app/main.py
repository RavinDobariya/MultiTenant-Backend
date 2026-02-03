from fastapi import FastAPI

from app.routes.audit_routes import router as audit_router
from app.routes.auth_me import router as auth_me_router
from app.routes.auth_routes import router as auth_router
from app.routes.company_routes import router as company_router
from app.routes.db_seed_router import router as db_seed_router
from app.routes.document_routes import router as document_router
from app.routes.health_routes import router as health_router
from app.routes.unit_routes import router as unit_router
from app.utils.config import settings
from app.utils.error_hanlder import register_exception_handlers
from app.utils.logger import logger

from app.middleware.rate_limiter import setup_rate_limit
from app.middleware.rate_limiter import limiter
app = FastAPI()

setup_rate_limit(app,limiter)
register_exception_handlers(app)

#print(f"Starting {settings.APP_NAME} in {settings.ENV} environment") 

app.include_router(db_seed_router)
app.include_router(health_router)
app.include_router(auth_router)
app.include_router(auth_me_router)
app.include_router(company_router)
app.include_router(unit_router)
app.include_router(document_router)
app.include_router(audit_router)

@app.get("/")
def root():
    logger.info(f"{settings.APP_NAME} is running in {settings.ENV} environment!!")
    return {"msg": "API is running"}          