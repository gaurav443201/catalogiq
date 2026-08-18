from pydantic import BaseModel
from typing import Optional


class FieldData(BaseModel):
    value: str
    source: str  # "input_text" | "ai_inferred" | "unknown"
    confidence: int


class ProductRecord(BaseModel):
    product_name: FieldData
    category: FieldData
    brand: FieldData
    material: FieldData
    size: FieldData
    connection_type: FieldData
    pressure_rating: FieldData
    certifications: FieldData
    application: FieldData
    price_range: FieldData


class GenerateRequest(BaseModel):
    raw_text: str
    category: Optional[str] = "Ball Valve"
