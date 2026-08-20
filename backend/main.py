# pyrefly: ignore [missing-import]
from fastapi import FastAPI, HTTPException, UploadFile, File, Form
# pyrefly: ignore [missing-import]
from fastapi.middleware.cors import CORSMiddleware
# pyrefly: ignore [missing-import]
from fastapi.responses import RedirectResponse
from models import GenerateRequest, BatchGenerateRequest, CrossSourceRequest
from ai_service import (
    extract_product_data,
    extract_text_from_image,
    generate_sample_text,
    compare_cross_sources,
)
from database import save_product, get_all_products, get_product_by_id
from accuracy_benchmark import run_accuracy_benchmark
import uuid
from datetime import datetime, timezone

app = FastAPI(
    title="CatalogIQ API",
    description="AI-Powered Product Intelligence for Industrial Commerce",
    version="1.1.0",
)

# ─── CORS ──────────────────────────────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ─── Routes ───────────────────────────────────────────────────────────────────

@app.get("/", include_in_schema=False)
def root():
    return RedirectResponse(url="/docs")


@app.get("/health")
def health():
    return {"status": "ok", "service": "CatalogIQ API", "version": "1.1.0"}


@app.post("/generate")
def generate(request: GenerateRequest):
    """
    Accept raw product text, run AI extraction & rule-based sanity checks,
    save to DynamoDB, and return enriched record.
    """
    try:
        ai_result = extract_product_data(request.raw_text, request.category)

        # Ensure user-selected category is always Confirmed at 100% confidence
        if request.category:
            ai_result["category"] = {
                "value": request.category,
                "source": "input_text",
                "confidence": 100,
                "reasoning": "Confirmed from user category selection",
            }

        record = {
            "id": str(uuid.uuid4()),
            "created_at": datetime.now(timezone.utc).isoformat(),
            "raw_input": request.raw_text,
            "input_category": request.category,
            **ai_result,
        }

        save_product(record)
        return record

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Generation failed: {str(e)}")


@app.post("/generate-batch")
def generate_batch(request: BatchGenerateRequest):
    """
    Accept an array of raw product text snippets, extract each item,
    save records to DynamoDB, and return array of structured results.
    """
    try:
        results = []
        for text in request.items:
            clean_text = text.strip()
            if not clean_text:
                continue

            ai_result = extract_product_data(clean_text, request.category)

            if request.category:
                ai_result["category"] = {
                    "value": request.category,
                    "source": "input_text",
                    "confidence": 100,
                    "reasoning": "Confirmed from user category selection",
                }

            record = {
                "id": str(uuid.uuid4()),
                "created_at": datetime.now(timezone.utc).isoformat(),
                "raw_input": clean_text,
                "input_category": request.category,
                **ai_result,
            }

            save_product(record)
            results.append(record)

        return {"count": len(results), "products": results}

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Batch generation failed: {str(e)}")


@app.post("/generate-cross-source")
def generate_cross_source(request: CrossSourceRequest):
    """
    Accept Source A and Source B for the same product, extract from both,
    compare field-by-field, flag discrepancies as 'conflict', and persist.
    """
    try:
        result_a = extract_product_data(request.source_a, request.category)
        result_b = extract_product_data(request.source_b, request.category)

        merged_result = compare_cross_sources(result_a, result_b, request.category)

        if request.category:
            merged_result["category"] = {
                "value": request.category,
                "source": "input_text",
                "confidence": 100,
                "reasoning": "Confirmed from user category selection",
            }

        record = {
            "id": str(uuid.uuid4()),
            "created_at": datetime.now(timezone.utc).isoformat(),
            "raw_input": f"--- SOURCE A ---\n{request.source_a}\n\n--- SOURCE B ---\n{request.source_b}",
            "input_category": request.category,
            "mode": "cross_source",
            **merged_result,
        }

        save_product(record)
        return record

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Cross-source analysis failed: {str(e)}")


@app.get("/accuracy-benchmark")
def get_accuracy_benchmark():
    """
    Evaluate actual extraction accuracy against the golden benchmark dataset.
    """
    try:
        return run_accuracy_benchmark()
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Benchmark calculation failed: {str(e)}")


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


@app.get("/sample")
def get_sample(category: str = "Ball Valve"):
    """
    Generate a dynamic realistic industrial product sample using GPT-4o-mini.
    """
    try:
        return generate_sample_text(category=category)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate sample: {str(e)}")


@app.post("/extract-image")
async def extract_image_endpoint(
    file: UploadFile = File(...),
    category: str = Form(default="industrial product"),
):
    """
    Accept an uploaded image (JPG/PNG/WEBP) and use GPT-4o Vision
    to extract visible product information as plain text.
    """
    allowed = {"image/jpeg", "image/png", "image/webp", "image/gif"}
    mime = file.content_type or "image/jpeg"
    if mime not in allowed:
        raise HTTPException(status_code=400, detail=f"Unsupported file type: {mime}")

    try:
        image_bytes = await file.read()
        extracted = extract_text_from_image(image_bytes, mime_type=mime, category=category)
        return {"extracted_text": extracted}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Image extraction failed: {str(e)}")


