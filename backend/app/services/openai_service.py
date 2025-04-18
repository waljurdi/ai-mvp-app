import json
import base64
import httpx
from app.logger import logger
from app.config import settings
from app.utils.json_extractor import extract_json_from_response
from fastapi import HTTPException


async def analyze_image(image_bytes: bytes) -> dict:
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
