import os
import boto3
import tempfile
import json
import base64
import requests
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
    product = await products_collection.find_one({"barcode": barcode})
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

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

    product["_id"] = str(product["_id"])  # Convert ObjectId to string for JSON

    return product


@app.post("/upload-image")
async def upload_image(
    barcode: str = Form(...),
    file: UploadFile = File(...),
):
    try:
        # 1. Save temp image file
        with tempfile.NamedTemporaryFile(delete=False, suffix=os.path.splitext(file.filename)[1]) as tmp:
            temp_image_path = tmp.name
            content = await file.read()
            tmp.write(content)

        # 2. Upload to S3
        file_extension = os.path.splitext(file.filename)[1]
        s3_key = f"products/{barcode}/{uuid4()}{file_extension}"

        # Rewind file for upload
        with open(temp_image_path, "rb") as upload_file:
            s3_client.upload_fileobj(upload_file, S3_BUCKET, s3_key, ExtraArgs={"ContentType": file.content_type})

        # Generate a presigned URL for the uploaded file
        s3_url = s3_client.generate_presigned_url(
            ClientMethod='get_object',
            Params={
                'Bucket': S3_BUCKET,
                'Key': s3_key
            },
            ExpiresIn=3600  # URL valid for 1 hour
        )

        # 3. Encode image for OpenAI API
        base64_image = base64.b64encode(content).decode('utf-8')

        headers = {
            "Content-Type": "application/json",
            "Authorization": f"Bearer {OPENAI_API_KEY}"
        }

        payload = {
            "model": "gpt-4o-mini",
            "messages": [
                {
                    "role": "user",
                    "content": [
                        {
                            "type": "text",
                            "text": "Extract the nutritional facts from the image into a structured dictionary. Output only the structured data without any additional text, line breaks, or spaces."
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

        openai_response = requests.post("https://api.openai.com/v1/chat/completions", headers=headers, json=payload)
        openai_response.raise_for_status()

        openai_data = openai_response.json()
        try:
            structured_data = json.loads(openai_data['choices'][0]['message']['content'])
        except Exception as e:
            print("Failed to parse OpenAI response", e)
            structured_data = {"error": "Failed to parse OpenAI response", "raw": openai_data}

        # 4. Store in MongoDB
        product_document = {
            "barcode": barcode,
            "image_url": s3_url,
            "nutritional_facts": structured_data,
        }

        result = await products_collection.insert_one(product_document)

        return {
            "message": "Product uploaded successfully",
            "product_id": str(result.inserted_id),
            "image_url": s3_url,
            "nutritional_facts": structured_data,
        }

    except (BotoCoreError, ClientError) as e:
        print("S3 upload failed", e)
        raise HTTPException(status_code=500, detail="Failed to upload to S3")

    except requests.RequestException as e:
        print("OpenAI API error", e)
        raise HTTPException(status_code=500, detail="Failed to process image with AI")

    except Exception as e:
        print("General error", e)
        raise HTTPException(status_code=500, detail="An error occurred during upload")

    finally:
        # Clean up the temporary file
        if os.path.exists(temp_image_path):
            os.remove(temp_image_path)
