from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from models import GenerateRequest
from ai_service import extract_product_data
from database import save_product, get_all_products, get_product_by_id
import uuid
from datetime import datetime, timezone

app = FastAPI(
    title="CatalogIQ API",
    description="AI-Powered Product Intelligence for Industrial Commerce",
    version="1.0.0",
)

# ─── CORS ──────────────────────────────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Tighten to Amplify domain after deployment
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ─── Routes ───────────────────────────────────────────────────────────────────

@app.get("/health")
def health():
    return {"status": "ok", "service": "CatalogIQ API"}


@app.post("/generate")
def generate(request: GenerateRequest):
    """
    Accept raw product text, run AI extraction, save to DynamoDB, return result.
    """
    try:
        # 1. Run AI extraction (or mock)
        ai_result = extract_product_data(request.raw_text, request.category)

        # 2. Build full record
        record = {
            "id": str(uuid.uuid4()),
            "created_at": datetime.now(timezone.utc).isoformat(),
            "raw_input": request.raw_text,
            "input_category": request.category,
            **ai_result,
        }

        # 3. Save to DynamoDB
        save_product(record)

        # 4. Return record
        return record

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Generation failed: {str(e)}")


@app.get("/products")
def products():
    """Return all saved product records, newest first."""
    try:
        return get_all_products()
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch products: {str(e)}")


@app.get("/products/{product_id}")
def product_detail(product_id: str):
    """Return a single product by ID."""
    item = get_product_by_id(product_id)
    if not item:
        raise HTTPException(status_code=404, detail="Product not found")
    return item
