import os
import boto3
import io
import json
import base64
import requests
from datetime import datetime, timezone
from botocore.exceptions import BotoCoreError, ClientError
from fastapi import FastAPI, File, UploadFile, HTTPException, Form
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv
from uuid import uuid4

# Load environment variables
load_dotenv()

app = FastAPI()

# Get the MongoDB connection URL and DB name from environment
MONGODB_URL = os.getenv("MONGODB_URL")
DATABASE_NAME = os.getenv("DATABASE_NAME")
DATABASE_COLLECTION = os.getenv("DATABASE_COLLECTION", "products")
# S3 Config
S3_BUCKET = os.getenv("S3_BUCKET_NAME")
AWS_ACCESS_KEY_ID = os.getenv("AWS_ACCESS_KEY_ID")
AWS_SECRET_ACCESS_KEY = os.getenv("AWS_SECRET_ACCESS_KEY")
AWS_REGION = os.getenv("AWS_REGION", "us-east-1")
# OpenAI API Key
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")

# Initialize S3 client
s3_client = boto3.client(
    "s3",
    region_name=AWS_REGION,
    aws_access_key_id=AWS_ACCESS_KEY_ID,
    aws_secret_access_key=AWS_SECRET_ACCESS_KEY,
)
# Initialize MongoDB client
client = AsyncIOMotorClient(MONGODB_URL)
db = client[DATABASE_NAME]
products_collection = db[DATABASE_COLLECTION]


# Helper function to extract S3 key from URL
def extract_key_from_url(url: str) -> str:
    # Assuming the S3 key starts after the bucket name in the URL
    # Example: https://<bucket-name>.s3.amazonaws.com/<key>
    return url.split(f"{S3_BUCKET}/")[-1] if S3_BUCKET in url else url


# Allow mobile frontend access
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # For dev only!
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class Product(BaseModel):
    barcode: str
    name: str
    description: str


@app.get("/product/{barcode}")
async def get_product(barcode: str):
    product = await products_collection.find_one({"barcode": barcode})
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    print(f"Found product: {product}")
    if "s3_key" in product:
        signed_url = s3_client.generate_presigned_url(
            ClientMethod='get_object',
            Params={
                'Bucket': S3_BUCKET,
                'Key': product['s3_key']
            },
            ExpiresIn=3600
        )
        product["image_url"] = signed_url
        print(f"Generated signed URL: {signed_url}")

    product["_id"] = str(product["_id"])  # Convert ObjectId to string for JSON

    return product


@app.post("/add-product")
async def upload_image(
    barcode: str = Form(...),
    file: UploadFile = File(...),
):
    try:
        # ✅ Check if product already exists
        existing_product = await products_collection.find_one({"barcode": barcode})
        if existing_product:
            raise HTTPException(status_code=400, detail="Product with this barcode already exists.")

        # ✅ Prepare S3 key
        file_extension = os.path.splitext(file.filename)[1] or ".jpg"
        s3_key = f"products/{barcode}/{uuid4()}{file_extension}"

        # ✅ Read the file once into memory
        file_content = await file.read()

        # ✅ Upload to S3 from memory
        try:
            s3_client.upload_fileobj(
                Fileobj=io.BytesIO(file_content),
                Bucket=S3_BUCKET,
                Key=s3_key,
                ExtraArgs={"ContentType": file.content_type},
            )
        except (BotoCoreError, ClientError) as e:
            print("S3 upload failed", e)
            raise HTTPException(status_code=500, detail="Failed to upload to S3")

        # ✅ Prepare base64 string for OpenAI
        base64_image = base64.b64encode(file_content).decode('utf-8')

        # ✅ Read file contents for OpenAI (we need to reset pointer first)
        await file.seek(0)
        content = await file.read()
        base64_image = base64.b64encode(content).decode('utf-8')

        # ✅ Prepare OpenAI request
        headers = {
            "Content-Type": "application/json",
            "Authorization": f"Bearer {OPENAI_API_KEY}"
        }

        # Old prompt
        # prompt_text = "Extract the nutritional facts from the image into a structured dictionary. Output only the structured data without any additional text, line breaks, or spaces."
        # Prompt
        prompt_text = (
            "Extract the following from the product image and return as JSON:\n"
            "- product_name (string): The name of the product\n"
            "- brand (string): Brand name of the product\n"
            "- country_of_origin (string): The country where the product is made\n"
            "- nutritional_basis_unit (string): Specify whether the nutrition table is shown per '100g' or '100ml'. Output only '100g' or '100ml'.\n"
            "- nutritional_facts (dict): Extract ONLY the values from the per 100g (or 100ml) column. Ignore any values listed per portion, serving, or unit. The keys are:\n"
            "   - protein (string, in g)\n"
            "   - sugar (string, in g)\n"
            "   - energy (string, in kcal)\n"
            "   - saturates (string, in g)\n"
            "   - salt (string, in g)\n\n"
            "Output only valid JSON. All values with units (like 'g', 'kcal') must be quoted as strings.\n\n"
            "Example Output:\n"
            "{\n"
            "  \"product_name\": \"Example Product\",\n"
            "  \"brand\": \"Example Brand\",\n"
            "  \"country_of_origin\": \"Country\",\n"
            "  \"nutritional_basis_unit\": \"100g\",\n"
            "  \"nutritional_facts\": {\n"
            "    \"protein\": \"3.2g\",\n"
            "    \"sugar\": \"12.5g\",\n"
            "    \"energy\": \"250kcal\",\n"
            "    \"saturates\": \"1.1g\",\n"
            "    \"salt\": \"0.6g\"\n"
            "  }\n"
            "}"
        )

        payload = {
            "model": "gpt-4o-mini",
            "messages": [
                {
                    "role": "user",
                    "content": [
                        {
                            "type": "text",
                            "text": prompt_text
                        },
                        {
                            "type": "image_url",
                            "image_url": {
                                "url": f"data:image/jpeg;base64,{base64_image}"
                            }
                        }
                    ]
                }
            ],
            "max_tokens": 1000
        }

        openai_response = requests.post(
            "https://api.openai.com/v1/chat/completions",
            headers=headers,
            json=payload
        )
        print("OpenAI response status code:", openai_response.status_code)
        openai_response.raise_for_status()
        openai_data = openai_response.json()
        print("OpenAI response data:", openai_data)

        # Check if OpenAI response is valid
        try:
            content = openai_data['choices'][0]['message']['content']
            cleaned = extract_json_from_response(content)
            structured_data = json.loads(cleaned)
        except Exception as e:
            print("Failed to parse OpenAI response", e)
            structured_data = {"error": "Failed to parse OpenAI response", "raw": openai_data}

        product_document = {
            "barcode": barcode,
            "s3_key": s3_key,
            "product_name": structured_data.get("product_name", ""),
            "country_of_origin": structured_data.get("country_of_origin", ""),
            "brand": structured_data.get("brand", ""),
            "nutritional_facts": {
                "per": structured_data.get("nutritional_basis_unit", "100g"),
                **structured_data.get("nutritional_facts", {})
            },
            "validation_state": "pending",
            "status": "pending",
            "created_at": datetime.now(timezone.utc),
            "updated_at": datetime.now(timezone.utc)
        }

        result = await products_collection.insert_one(product_document)

        return {
            "message": "Product uploaded successfully",
            "product_id": str(result.inserted_id),
            "nutritional_facts": structured_data,
        }

    except HTTPException:
        raise  # re-raise HTTP exceptions as is

    except requests.RequestException as e:
        print("OpenAI API error", e)
        raise HTTPException(status_code=500, detail="Failed to process image with AI")

    except Exception as e:
        print("General error", e)
        raise HTTPException(status_code=500, detail="An error occurred during upload")


def extract_json_from_response(content: str) -> str:
    # Remove ```json and ``` if they exist
    content = content.strip()
    if content.startswith("```json"):
        content = content[7:]
    elif content.startswith("```"):
        content = content[3:]
    if content.endswith("```"):
        content = content[:-3]
    return content.strip()
