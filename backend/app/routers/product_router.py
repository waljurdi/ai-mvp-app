from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from app.services import s3_service, openai_service
from app.models.product_model import UploadResponse
from app.config import settings
from motor.motor_asyncio import AsyncIOMotorClient
from datetime import datetime, timezone
from app.logger import logger

router = APIRouter()

client = AsyncIOMotorClient(settings.MONGODB_URL)
db = client[settings.DATABASE_NAME]
products_collection = db[settings.DATABASE_COLLECTION]


@router.get("/product/{barcode}")
async def get_product(barcode: str):
    product = await products_collection.find_one({"barcode": barcode})
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    if "s3_key" in product:
        product["image_url"] = s3_service.generate_presigned_url(product["s3_key"])
    product["_id"] = str(product["_id"])

    logger.info(f"Returning product with barcode {barcode}")
    return product


@router.post("/add-product", response_model=UploadResponse)
async def upload_image(
    barcode: str = Form(...),
    file: UploadFile = File(...)
):
    existing = await products_collection.find_one({"barcode": barcode})
    if existing:
        logger.warning(f"Duplicate barcode detected: {barcode}")
        raise HTTPException(status_code=400, detail="Barcode already exists")

    file_content = await file.read()
    s3_key = await s3_service.upload_file(barcode, file.filename, file_content, file.content_type)
    structured_data = await openai_service.analyze_image(file_content)

    if "error" in structured_data:
        raise HTTPException(status_code=400, detail=structured_data["error"])

    product_doc = {
        "barcode": barcode,
        "s3_key": s3_key,
        "product_name": structured_data.get("product_name", ""),
        "brand": structured_data.get("brand", ""),
        "country_of_origin": structured_data.get("country_of_origin", ""),
        "nutritional_facts": {
            "per": structured_data.get("nutritional_basis_unit", "100g"),
            **structured_data.get("nutritional_facts", {})
        },
        "validation_state": "pending",
        "status": "pending",
        "created_at": datetime.now(timezone.utc),
        "updated_at": datetime.now(timezone.utc),
    }

    result = await products_collection.insert_one(product_doc)
    logger.info(f"Uploaded new product with barcode {barcode}")

    return UploadResponse(
        message="Product uploaded successfully",
        product_id=str(result.inserted_id),
        nutritional_facts=structured_data,
    )
