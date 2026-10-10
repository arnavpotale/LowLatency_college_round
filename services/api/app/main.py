from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.database.session import init_db
from app.api import api_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize database tables on startup
    init_db()
    yield
    # Cleanup on shutdown if needed


app = FastAPI(
    title="Second Opinion — AI Answer Verification Platform",
    description=(
        "Backend API for verifying AI-generated answers against primary source documents, "
        "detecting hallucinations, contradictions, numerical mismatches, and safety risks."
    ),
    version=settings.app_version,
    lifespan=lifespan
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include primary API routes
app.include_router(api_router, prefix="/api")


@app.get("/", tags=["Root"])
def root():
    return {
        "name": "Second Opinion API",
        "version": settings.app_version,
        "docs_url": "/docs",
        "health_url": "/api/health",
        "mock_mode": settings.enable_mock_verification
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host=settings.host, port=settings.port, reload=settings.debug)
