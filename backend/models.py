from pydantic import BaseModel
from typing import Optional, List, Dict, Any


class FieldData(BaseModel):
    value: str
    source: str  # "input_text" | "ai_inferred" | "unknown" | "conflict"
    confidence: int
    reasoning: Optional[str] = ""
    validation: Optional[str] = None  # None | "outside_expected_range" | "passed"


class ProductRecord(BaseModel):
    id: Optional[str] = None
    created_at: Optional[str] = None
    input_category: Optional[str] = None
    raw_input: Optional[str] = None
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


class BatchGenerateRequest(BaseModel):
    items: List[str]
    category: Optional[str] = "Ball Valve"


class CrossSourceRequest(BaseModel):
    source_a: str
    source_b: str
    category: Optional[str] = "Ball Valve"
