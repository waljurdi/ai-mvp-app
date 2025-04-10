import os
from fastapi import FastAPI
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

app = FastAPI()

# Get the MongoDB connection URL and DB name from environment
MONGODB_URL = os.getenv("MONGODB_URL")
DATABASE_NAME = os.getenv("DATABASE_NAME")

client = AsyncIOMotorClient(MONGODB_URL)
db = client[DATABASE_NAME]

# Allow mobile frontend access
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # For dev only!
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class InputData(BaseModel):
    message: str


@app.post("/echo")
def echo(data: InputData):
    return {"response": f"AI says: {data.message}"}


class Product(BaseModel):
    barcode: str
    name: str
    description: str


@app.get("/product/{barcode}")
async def get_product(barcode: str):
    product = await db.products.find_one({"barcode": barcode})
    if product:
        product["_id"] = str(product["_id"])
        return product
    return {"error": "Product not found"}
