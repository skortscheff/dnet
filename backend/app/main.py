from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.health import router as health_router
from app.api.search import router as search_router
from app.bgp.router import router as bgp_router
from app.dns.router import router as dns_router
from app.ip.router import router as ip_router
from app.mail.router import router as mail_router
from app.core.config import settings

app = FastAPI(
    title="Internet Toolkit API",
    version="0.1.0",
    docs_url="/api/docs",
    redoc_url="/api/redoc",
    openapi_url="/api/openapi.json",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health_router, prefix="/api/v1")
app.include_router(search_router, prefix="/api/v1")
app.include_router(ip_router, prefix="/api/v1")
app.include_router(dns_router, prefix="/api/v1")
app.include_router(bgp_router, prefix="/api/v1")
app.include_router(mail_router, prefix="/api/v1")
