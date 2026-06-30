import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="BSD Steel API")

# Configure CORS
origins = [
    os.getenv("FRONTEND_URL", "http://localhost:3000"),
    "http://localhost:3000",
    "https://bsdpoc-hcmn.vercel.app",
]

origin_regex = r"https://.*\.vercel\.app"

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_origin_regex=origin_regex,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

from app.api.auth import router as auth_router
app.include_router(auth_router, prefix="/api/auth", tags=["auth"])

from app.api.inventory import router as inventory_router
app.include_router(inventory_router, prefix="/api", tags=["inventory"])

from app.api.receivables import router as receivables_router
app.include_router(receivables_router, prefix="/api/receivables", tags=["receivables"])

@app.get("/api/health")
async def health_check():
    return {"status": "ok"}