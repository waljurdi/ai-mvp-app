from pydantic import BaseModel


class Product(BaseModel):
    barcode: str
    name: str
    description: str


class UploadResponse(BaseModel):
    message: str
    product_id: str
    nutritional_facts: dict
