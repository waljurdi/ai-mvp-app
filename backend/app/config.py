import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()


class Settings:
    MONGODB_URL = os.getenv("MONGODB_URL")
    DATABASE_NAME = os.getenv("DATABASE_NAME")
    DATABASE_COLLECTION = os.getenv("DATABASE_COLLECTION", "products")
    S3_BUCKET = os.getenv("S3_BUCKET_NAME")
    AWS_ACCESS_KEY_ID = os.getenv("AWS_ACCESS_KEY_ID")
    AWS_SECRET_ACCESS_KEY = os.getenv("AWS_SECRET_ACCESS_KEY")
    AWS_REGION = os.getenv("AWS_REGION", "us-east-1")
    OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
    ALLOWED_ORIGINS = ["*"]  # Change in production


settings = Settings()
