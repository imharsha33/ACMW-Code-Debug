from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from starlette.exceptions import HTTPException as StarletteHTTPException

from app.config import settings
from app.routers import (
    auth,
    users,
    questions,
    assessments,
    code_execution,
    submissions,
    events,
    results,
    dashboard,
)

app = FastAPI(
    title=settings.PROJECT_NAME,
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    docs_url="/docs",
    redoc_url="/redoc",
    description="Coding & Debugging Club Platform — Backend Phase 2 API",
    version="2.0.0",
)

from fastapi.middleware.gzip import GZipMiddleware

# Add GZip compression for high concurrency API payloads
app.add_middleware(GZipMiddleware, minimum_size=1000)

# Set up CORS with 24h preflight caching for 200+ concurrent students
if settings.CORS_ORIGINS:
    origins = settings.CORS_ORIGINS if isinstance(settings.CORS_ORIGINS, list) else [settings.CORS_ORIGINS]
    is_wildcard = "*" in origins or origins == ["*"]
    app.add_middleware(
        CORSMiddleware,
        allow_origins=origins,
        allow_credentials=not is_wildcard,
        allow_methods=["*"],
        allow_headers=["*"],
        max_age=86400,
    )


from fastapi.encoders import jsonable_encoder

# Exception Handlers
@app.exception_handler(StarletteHTTPException)
async def http_exception_handler(request: Request, exc: StarletteHTTPException):
    return JSONResponse(
        status_code=exc.status_code,
        content={"detail": exc.detail, "status_code": exc.status_code},
    )

@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={
            "detail": "Validation error in request payload",
            "errors": jsonable_encoder(exc.errors()),
            "status_code": 422,
        },
    )


@app.exception_handler(Exception)
async def generic_exception_handler(request: Request, exc: Exception):
    # Do not expose internal stack traces to client
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={"detail": "An internal server error occurred", "status_code": 500},
    )

# Include Routers under /api
api_prefix = settings.API_V1_STR
app.include_router(auth.router, prefix=api_prefix)
app.include_router(users.router, prefix=api_prefix)
app.include_router(questions.router, prefix=api_prefix)
app.include_router(assessments.router, prefix=api_prefix)
app.include_router(code_execution.router, prefix=api_prefix)
app.include_router(submissions.router, prefix=api_prefix)
app.include_router(events.router, prefix=api_prefix)
app.include_router(results.router, prefix=api_prefix)
app.include_router(dashboard.router, prefix=api_prefix)

@app.get("/")
def root():
    return {
        "message": f"Welcome to {settings.PROJECT_NAME}",
        "docs": "/docs",
        "redoc": "/redoc",
    }

@app.get("/healthz")
def health_check():
    return {"status": "ok"}
