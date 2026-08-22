# pyrefly: ignore [missing-import]
from fastapi import FastAPI, HTTPException, UploadFile, File, Form
# pyrefly: ignore [missing-import]
from fastapi.middleware.cors import CORSMiddleware
# pyrefly: ignore [missing-import]
from fastapi.responses import RedirectResponse, JSONResponse
from models import (
    GenerateRequest,
    BatchGenerateRequest,
    CrossSourceRequest,
    UnilogEnrichRequest,
    UnilogBatchRequest,
)
from ai_service import (
    extract_product_data,
    extract_text_from_image,
    generate_sample_text,
    compare_cross_sources,
    enrich_unilog_item,
)
from database import save_product, get_all_products, get_product_by_id
from accuracy_benchmark import run_accuracy_benchmark, run_unilog_ground_truth_benchmark
import uuid
from datetime import datetime, timezone

app = FastAPI(
    title="CatalogIQ API",
    description="AI-Powered Product Intelligence for Industrial Commerce & Unilog Content Enrichment",
    version="2.0.0",
)

# ─── CORS ──────────────────────────────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ─── Unilog Curated Test Samples (From 200-Item Ground Truth & 1000-Item Sets) ──
UNILOG_CURATED_SAMPLES = [
    {
        "name": "Frigidaire Dishwasher (Ground Truth Item #1)",
        "mfg_part_num": "PDSH4816AF",
        "part_desc": "PDSH4816AF Dishwasher SS - Display Only",
        "part_manuf": "Appliance Dealers Cooperative (APPDE)",
        "e1_brand": "-- Unbranded --",
        "unilog_brand": "-- No Unilog Brand --",
        "dib_brand": "-- No DIB Brand --",
        "sku": "1515863",
        "dept": "Appliances",
        "item_class": "Large Appliances",
        "fine": "Dishwashers"
    },
    {
        "name": "Whirlpool Eco Dishwasher (Ground Truth Item #2)",
        "mfg_part_num": "WDTS7024RZ",
        "part_desc": "WDTS7024RZ Dishwasher SS - Display Only",
        "part_manuf": "Appliance Dealers Cooperative (APPDE)",
        "e1_brand": "-- Unbranded --",
        "unilog_brand": "-- No Unilog Brand --",
        "dib_brand": "-- No DIB Brand --",
        "sku": "1515867",
        "dept": "Appliances",
        "item_class": "Large Appliances",
        "fine": "Dishwashers"
    },
    {
        "name": "Milwaukee 5\" Cut Off Disc (Sample 1000)",
        "mfg_part_num": "49-94-0013",
        "part_desc": "49-94-0013 Milw 5\"x.045\"x7/8\" Metal Cut Off Disc",
        "part_manuf": "Milwaukee Accessory (4031)",
        "e1_brand": "-- Unbranded --",
        "unilog_brand": "-- No Unilog Brand --",
        "dib_brand": "-- No DIB Brand --",
        "sku": "49940013",
        "dept": "Tools",
        "item_class": "Cutting Accessories",
        "fine": "Cut Off Wheels"
    },
    {
        "name": "TimberTech Azek PVC Decking (Sample 1000)",
        "mfg_part_num": "ADB15516CS",
        "part_desc": "1x6-16' Coastline Sq Edge - Vintage Azek PVC Decking",
        "part_manuf": "Parksite (6151)",
        "e1_brand": "TIMBERTECH",
        "unilog_brand": "-- No Unilog Brand --",
        "dib_brand": "-- No DIB Brand --",
        "sku": "ADB15516CS",
        "dept": "Building Materials",
        "item_class": "Decking",
        "fine": "PVC Decking"
    },
    {
        "name": "Mueller Brass Fitting (Sample 1000 / Fittings LOV)",
        "mfg_part_num": "3/8 CPLG BRS 150#",
        "part_desc": "3/8 CPLG BRS 150# NPT Threaded Coupling",
        "part_manuf": "Mueller Streamline (MUELL)",
        "e1_brand": "-- Unbranded --",
        "unilog_brand": "-- No Unilog Brand --",
        "dib_brand": "-- No DIB Brand --",
        "sku": "CPLG38BRS",
        "dept": "Plumbing",
        "item_class": "Fittings",
        "fine": "Couplings"
    }
]


# ─── Routes ───────────────────────────────────────────────────────────────────

@app.get("/", include_in_schema=False)
def root():
    return RedirectResponse(url="/docs")


@app.get("/health")
def health():
    return {"status": "ok", "service": "CatalogIQ API", "version": "2.0.0"}


# ─── Unilog Pipeline Endpoints ────────────────────────────────────────────────

@app.post("/enrich-unilog")
def enrich_unilog_endpoint(request: UnilogEnrichRequest):
    """
    Enriches a raw catalog item into the full Unilog 252-column delivery format,
    building all 5 description lengths and validating against internal content guidelines.
    Saves the enriched structured item in the products history database.
    """
    try:
        result = enrich_unilog_item(
            mfg_part_num=request.mfg_part_num or "",
            part_desc=request.part_desc,
            part_manuf=request.part_manuf or "",
            e1_brand=request.e1_brand or "",
            unilog_brand=request.unilog_brand or "",
            dib_brand=request.dib_brand or "",
            sku=request.sku or "",
            dept=request.dept or "",
            item_class=request.item_class or "",
            fine=request.fine or ""
        )
        
        # Build standard record to save in DynamoDB (supporting both list and full result details views)
        attributes = result.get("attributes", [])
        
        db_record = {
            "id": str(uuid.uuid4()),
            "created_at": datetime.now(timezone.utc).isoformat(),
            "input_category": request.item_class or "Unilog Enrichment",
            "raw_input": request.part_desc,
            
            # Standard dashboard listing parameters
            "product_name": {
                "value": result["descriptions"]["short_desc"] or request.mfg_part_num or "Unnamed Product",
                "source": "input_text",
                "confidence": 100
            },
            "category": {
                "value": result["summary"]["classpath"] or request.item_class or "Unilog Item",
                "source": "ai_inferred",
                "confidence": int(result["summary"].get("brand_confidence", 100))
            },
            "brand": {
                "value": result["summary"]["brand_name"] or "-- Unbranded --",
                "source": "ai_inferred",
                "confidence": int(result["summary"].get("brand_confidence", 100))
            },
            "material": {
                "value": next((a["value"] for a in attributes if a["label"] == "Material"), "Standard Grade"),
                "source": "ai_inferred",
                "confidence": 90
            },
            "size": {
                "value": next((a["value"] for a in attributes if a["label"] in ("Size", "Primary Specification")), "—"),
                "source": "ai_inferred",
                "confidence": 90
            },
            "connection_type": {
                "value": next((a["value"] for a in attributes if a["label"] == "Connection Type"), "—"),
                "source": "ai_inferred",
                "confidence": 90
            },
            "pressure_rating": {
                "value": next((a["value"] for a in attributes if a["label"] == "Pressure Rating"), "—"),
                "source": "ai_inferred",
                "confidence": 90
            },
            "certifications": {
                "value": result.get("descriptions", {}).get("standards") or result.get("validation_report", {}).get("standards") or "—",
                "source": "ai_inferred",
                "confidence": 90
            },
            "application": {
                "value": request.dept or "—",
                "source": "input_text",
                "confidence": 100
            },
            "price_range": {
                "value": "—",
                "source": "unknown",
                "confidence": 0
            },
            
            # Unilog Result Schema parameters
            "summary": result["summary"],
            "descriptions": result["descriptions"],
            "validation_report": result["validation_report"],
            "attributes": result["attributes"],
            "delivery_format_252": result["delivery_format_252"],
        }
        
        save_product(db_record)
        return db_record
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Unilog enrichment failed: {str(e)}")


@app.post("/enrich-batch-unilog")
def enrich_batch_unilog_endpoint(request: UnilogBatchRequest):
    """
    Batch processes an array of raw Unilog items and returns structured results with 252 delivery columns.
    """
    try:
        results = []
        for item in request.items:
            res = enrich_unilog_item(
                mfg_part_num=item.mfg_part_num or "",
                part_desc=item.part_desc,
                part_manuf=item.part_manuf or "",
                e1_brand=item.e1_brand or "",
                unilog_brand=item.unilog_brand or "",
                dib_brand=item.dib_brand or "",
                sku=item.sku or "",
                dept=item.dept or "",
                item_class=item.item_class or "",
                fine=item.fine or ""
            )
            results.append(res)
        return {"count": len(results), "items": results}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Batch Unilog enrichment failed: {str(e)}")


@app.get("/unilog-samples")
def get_unilog_samples():
    """Return pre-loaded ground-truth test items for 1-click evaluator testing."""
    return {"samples": UNILOG_CURATED_SAMPLES}


@app.get("/unilog-sample-live")
def get_unilog_sample_live(category: str = "Ball Valve"):
    """Generate a live AI structured catalog item using GPT-4o-mini."""
    try:
        from ai_service import generate_live_unilog_sample
        return generate_live_unilog_sample(category=category)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate live unilog sample: {str(e)}")


@app.get("/unilog-benchmark")
@app.get("/accuracy-benchmark")
def get_unilog_benchmark():
    """
    Evaluates pipeline accuracy against the 200-item Unilog ground-truth benchmark.
    Returns field accuracy %, character limit compliance %, vocabulary rate %, and fraction accuracy %.
    """
    try:
        return run_unilog_ground_truth_benchmark()
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Benchmark evaluation failed: {str(e)}")


# ─── Standard Workbench Endpoints ─────────────────────────────────────────────

@app.post("/generate")
def generate(request: GenerateRequest):
    try:
        ai_result = extract_product_data(request.raw_text, request.category)

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


@app.get("/products")
def products():
    try:
        return get_all_products()
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch products: {str(e)}")


@app.delete("/products")
def clear_all_products():
    """Clear all product records from DynamoDB."""
    try:
        from database import table
        response = table.scan(ProjectionExpression="id")
        items = response.get("Items", [])
        for item in items:
            table.delete_item(Key={"id": item["id"]})
        return {"status": "success", "message": f"Cleared {len(items)} items"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to clear products: {str(e)}")


@app.get("/products/{product_id}")
def product_detail(product_id: str):
    item = get_product_by_id(product_id)
    if not item:
        raise HTTPException(status_code=404, detail="Product not found")
    return item


@app.get("/sample")
def get_sample(category: str = "Ball Valve"):
    try:
        return generate_sample_text(category=category)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate sample: {str(e)}")


@app.post("/extract-image")
async def extract_image_endpoint(
    file: UploadFile = File(...),
    category: str = Form(default="industrial product"),
):
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
