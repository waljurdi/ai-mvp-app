from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from app.services import s3_service, ocr_service
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

    if "front_image" in product:
        product["image_url"] = s3_service.generate_presigned_url(product["front_image"])
    product["_id"] = str(product["_id"])

    logger.info(f"Returning product with barcode {barcode}")
    return product


@router.post("/add-product", response_model=UploadResponse)
async def upload_image(
    barcode: str = Form(...),
    front_image: UploadFile = File(...),
    back_image: UploadFile = File(...)
):
    existing = await products_collection.find_one({"barcode": barcode})
    if existing:
        logger.warning(f"Duplicate barcode detected: {barcode}")
        raise HTTPException(status_code=400, detail="Barcode already exists")

    # Upload front image
    front_bytes = await front_image.read()
    front_s3_key = await s3_service.upload_file(
        barcode,
        front_image.filename,
        front_bytes,
        front_image.content_type
    )

    # Upload back image
    back_bytes = await back_image.read()
    back_s3_key = await s3_service.upload_file(
        barcode,
        back_image.filename,
        back_bytes,
        back_image.content_type
    )

    # Extract data
    front_data = await ocr_service.analyze_image_with_textract(front_bytes, barcode, image_type="front")
    back_data = await ocr_service.analyze_image_with_textract(back_bytes, barcode, image_type="back")

    if "error" in front_data or "error" in back_data:
        logger.error(f"Textract error: {front_data.get('error') or back_data.get('error')}")

    product_doc = {
        "barcode": barcode,
        "front_image": front_s3_key,
        "back_image": back_s3_key,
        "product_name": front_data.get("product_name", ""),
        "product_description": front_data.get("product_description", ""),
        "brand": front_data.get("brand", ""),
        "country_of_origin": front_data.get("country_of_origin", ""),
        "nutritional_facts": {
            "per": back_data.get("nutritional_basis_unit", "100g"),
            **back_data.get("nutritional_facts", {})
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
        nutritional_facts=back_data.get("nutritional_facts", {}),
    )
