from pathlib import Path

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles

from app.routes.audit_routes import router as audit_router
from app.routes.auth_me import router as auth_me_router
from app.routes.auth_routes import router as auth_router
from app.routes.company_routes import router as company_router
from app.routes.db_seed_router import router as db_seed_router
from app.routes.document_routes import router as document_router
from app.routes.health_routes import router as health_router
from app.routes.join_request_routes import router as join_request_router
from app.routes.unit_routes import router as unit_router
from app.utils.config import settings
from app.utils.error_hanlder import register_exception_handlers
from app.utils.logger import logger

from app.middleware.rate_limiter import setup_rate_limit
from app.middleware.rate_limiter import limiter
app = FastAPI()

setup_rate_limit(app,limiter)
register_exception_handlers(app)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

#print(f"Starting {settings.APP_NAME} in {settings.ENV} environment") 

app.include_router(db_seed_router, prefix="/api")
app.include_router(health_router, prefix="/api")
app.include_router(auth_router, prefix="/api")
app.include_router(auth_me_router, prefix="/api")
app.include_router(join_request_router, prefix="/api")
app.include_router(company_router, prefix="/api")
app.include_router(unit_router, prefix="/api")
app.include_router(document_router, prefix="/api")
app.include_router(audit_router, prefix="/api")

@app.get("/api")
def api_root():
    logger.info(f"{settings.APP_NAME} is running in {settings.ENV} environment!!")
    return {"msg": "API is running"}


frontend_dist = Path(__file__).resolve().parents[1] / "frontend" / "dist"
frontend_index = frontend_dist / "index.html"

if frontend_dist.exists() and frontend_index.exists():
    app.mount("/assets", StaticFiles(directory=frontend_dist / "assets"), name="frontend-assets")

    @app.get("/", include_in_schema=False)
    def serve_frontend_root():
        return FileResponse(frontend_index)

    @app.get("/{full_path:path}", include_in_schema=False)
    def serve_frontend_app(full_path: str):
        if full_path.startswith("api"):
            raise HTTPException(status_code=404, detail="API route not found")

        requested_file = frontend_dist / full_path
        if requested_file.is_file():
            return FileResponse(requested_file)

        return FileResponse(frontend_index)
else:
    @app.get("/")
    def root():
        return {"msg": "Frontend build not found. API is running at /api"}
