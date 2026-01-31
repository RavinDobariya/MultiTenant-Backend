from fastapi import Request, HTTPException
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError


def register_exception_handlers(app):

    @app.exception_handler(HTTPException)
    async def http_exception_handler(request: Request, exc: HTTPException):
        error_map = {
            401: "UNAUTHORIZED",
            403: "FORBIDDEN",
            404: "RESOURCE_NOT_FOUND",
            422: "VALIDATION_ERROR",
            409: "INVALID_STATE_TRANSITION",
        }

        return JSONResponse(
            status_code=exc.status_code,
            content={
                "error": error_map.get(exc.status_code, "VALIDATION_ERROR"),
                "message": str(exc.detail),
            },
        )

    """
    API calls:
    raise HTTPException(status_code=404, detail="Unit not found")
    
    It Becomes:
    exc = HTTPException(status_code=404,detail="Unit not found")
    
    Access like:
    exc.status_code = 404
    exc.detail = "Unit not found"
    """

    @app.exception_handler(RequestValidationError)
    async def validation_exception_handler(request: Request, exc: RequestValidationError):
        return JSONResponse(
            status_code=422,
            content={
                "error": "VALIDATION_ERROR",
                "message": "Invalid request payload",
            },
        )
