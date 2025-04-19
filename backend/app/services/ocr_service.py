import re
import json
import boto3
import httpx
import base64
from app.logger import logger
from app.config import settings
from app.services import s3_service
from datetime import datetime, timezone
from app.utils.json_extractor import extract_json_from_response
from fastapi import HTTPException
from typing import List, Dict

# Initialize the Textract client
textract_client = boto3.client("textract", region_name="us-east-1")

# Nutrient label synonyms across languages
NUTRIENT_KEYWORDS = {
    "energy": ["energy", "énergie", "energia"],
    "protein": ["protein", "protéines", "eiweiß", "proteine"],
    "sugar": ["sugar", "sucres", "zucker", "zuccheri"],
    "saturates": ["saturates", "acides gras saturés", "gesättigte fettsäuren", "grassi saturi"],
    "salt": ["salt", "sel", "salz", "sale"]
}

async def analyze_image_with_textract(image_bytes: bytes, barcode: str, image_type: str = "back") -> dict:
    # Save the raw Textract output for future reference
    raw_key = f"products/{barcode}/textract_{image_type}_{datetime.utcnow().isoformat()}.json"

    if image_type == "front":
        return await extract_with_openai(image_bytes, barcode, raw_key)
    else:
        try:
            response = textract_client.analyze_document(
                Document={"Bytes": image_bytes},
                FeatureTypes=["TABLES", "FORMS"]
            )
        except Exception as e:
            logger.error(f"Textract failed: {e}")
            raise HTTPException(status_code=502, detail="Textract error")

        await s3_service.upload_file(
            barcode=barcode,
            filename=f"textract_{image_type}.json",
            content=json.dumps(response).encode("utf-8"),
            content_type="application/json",
            s3_key=raw_key
        )

        # Extract and process blocks
        blocks = response.get("Blocks", [])
        lines = [
            block.get("Text", "").strip().lower()
            for block in blocks
            if block.get("BlockType") in ("LINE", "CELL") and block.get("Text")
        ]

        return extract_nutrition_and_ingredients(lines)

async def extract_with_openai(image_bytes: bytes, barcode: str, s3_key: str) -> dict:
    base64_image = base64.b64encode(image_bytes).decode("utf-8")

    prompt_text = (
        "You will be shown an image of a front view of a product."
        "extract the following from the image and return as JSON:\n"
        "- product_name (string): The name of the product - try logos if not obvious\n"
        "- product_description (string): A short description of the product\n"
        "- brand (string): Brand name of the product\n"
        "- country_of_origin (string): The country where the product is made\n"
        "Output only valid JSON. Quote all values as strings."
    )

    payload = {
        "model": "gpt-4o",
        "messages": [
            {
                "role": "user",
                "content": [
                    {"type": "text", "text": prompt_text},
                    {"type": "image_url", "image_url": {"url": f"data:image/jpeg;base64,{base64_image}"}}
                ]
            }
        ],
        "max_tokens": 1000
    }

    headers = {
        "Authorization": f"Bearer {settings.OPENAI_API_KEY}",
        "Content-Type": "application/json"
    }

    timeout = httpx.Timeout(45.0)
    try:
        async with httpx.AsyncClient(timeout=timeout) as client:
            response = await client.post(
                "https://api.openai.com/v1/chat/completions",
                headers=headers,
                json=payload
            )
            response.raise_for_status()
            data = response.json()
    except httpx.ReadTimeout:
        logger.error("OpenAI API request timed out")
        raise HTTPException(status_code=504, detail="OpenAI API timeout")
    except httpx.HTTPError as e:
        logger.error(f"OpenAI API request failed: {e}")
        raise HTTPException(status_code=502, detail="OpenAI API error")

    content = data["choices"][0]["message"]["content"]
    logger.info(f"OpenAI response content: {content[:100]}...")

    # Optionally save the OpenAI raw response to S3
    await s3_service.upload_file(
        barcode=barcode,
        filename="openai_front_response.json",
        content=json.dumps(data).encode("utf-8"),
        content_type="application/json",
        s3_key=s3_key.replace("textract", "openai")
    )

    try:
        cleaned = extract_json_from_response(content)
        return json.loads(cleaned)
    except Exception as e:
        logger.error(f"Failed to parse OpenAI JSON: {e}")
        return {"error": "Invalid JSON returned from OpenAI"}


def extract_nutrition_and_ingredients(lines: list) -> dict:
    result = {
        "nutritional_basis_unit": "100g",
        "nutritional_facts": {},
        "ingredients": None,
        "country_of_origin": "unknown"
    }

    # Normalize lines
    lines = [line.strip().lower() for line in lines if line.strip()]

    nutrient_map = {
        "énergie": "energy",
        "energie": "energy",
        "matières grasses": "fat",
        "dont acides gras saturés": "saturates",
        "acides gras saturés": "saturates",
        "glucides": "carbohydrates",
        "dont sucres": "sugar",
        "fibres alimentaires": "fiber",
        "protéines": "protein",
        "proteines": "protein",
        "sel": "salt"
    }

    # Ingredients
    for i, line in enumerate(lines):
        if "ingrédient" in line or "ingredients" in line:
            ingredients = line.split(":", 1)[-1].strip()
            if i + 1 < len(lines) and ',' in lines[i + 1]:
                ingredients += ' ' + lines[i + 1].strip()
            result["ingredients"] = ingredients
            break

    # Nutrition
    nutrition_start = next((i for i, l in enumerate(lines) if "nutrition" in l), -1)
    if nutrition_start != -1:
        for i in range(nutrition_start, len(lines) - 2):
            label = lines[i]
            value = lines[i + 1]

            if "energie" in label:
                lookahead = lines[i + 1:i + 4]
                kcal = next((v for v in lookahead if "kcal" in v), None)
                kj = next((v for v in lookahead if "kj" in v), None)
                result["nutritional_facts"]["energy"] = kcal or kj
                continue

            for fr_key, en_key in nutrient_map.items():
                if fr_key in label:
                    if re.search(r"[\d,\.]+\s*(g|kj|kcal)", value):
                        result["nutritional_facts"][en_key] = value.replace(",", ".").strip()
                    break

    # Nutritional basis
    result["nutritional_basis_unit"] = next((l for l in lines if "100 g" in l or "100g" in l), "100g")

    # # Country
    # country_keywords = ["fr", "france", "français", "origine"]
    # result["country_of_origin"] = next((l for l in lines if any(k in l for k in country_keywords)), "unknown")

    return result

async def analyze_image_with_openai(image_bytes: bytes) -> dict:
    base64_image = base64.b64encode(image_bytes).decode("utf-8")

    # Old prompt
    # prompt_text = "Extract the nutritional facts from the image into a structured dictionary. Output only the structured data without any additional text, line breaks, or spaces."
    # Prompt
    prompt_text = (
        "You will be shown an image. First, check if it contains a clear and readable nutritional facts table from a product packaging."
        "If it does not, respond with: {\"error\": \"Image does not contain nutritional facts\"}. "
        "If it does, extract the following from the image and return as JSON:\n"
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
        "model": "gpt-4o",
        "messages": [
            {
                "role": "user",
                "content": [
                    {"type": "text", "text": prompt_text},
                    {"type": "image_url", "image_url": {"url": f"data:image/jpeg;base64,{base64_image}"}}
                ]
            }
        ],
        "max_tokens": 1000
    }

    headers = {
        "Authorization": f"Bearer {settings.OPENAI_API_KEY}",
        "Content-Type": "application/json"
    }

    # Log the payload for debugging
    logger.info("Sending image to OpenAI for analysis")

    timeout = httpx.Timeout(45.0)  # 45 seconds
    try:
        async with httpx.AsyncClient(timeout=timeout) as client:
            response = await client.post(
                "https://api.openai.com/v1/chat/completions",
                headers=headers,
                json=payload
            )
            response.raise_for_status()
            data = response.json()
    except httpx.ReadTimeout:
        logger.error("OpenAI API request timed out")
        raise HTTPException(status_code=504, detail="OpenAI API timeout")
    except httpx.HTTPError as e:
        logger.error(f"OpenAI API request failed: {e}")
        raise HTTPException(status_code=502, detail="OpenAI API error")

    content = data["choices"][0]["message"]["content"]
    cleaned = extract_json_from_response(content)

    logger.info(f"OpenAI response content: {content[:100]}...")
    return json.loads(cleaned)
