from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers.product_router import router as product_router
from app.config import settings
from app.logger import logger

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

logger.info("Starting FastAPI app...")
app.include_router(product_router)
