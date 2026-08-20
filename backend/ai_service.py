# pyrefly: ignore [missing-import]
import os
import json
import base64
from openai import OpenAI
from dotenv import load_dotenv
from validator import validate_product_record

load_dotenv()

# ─── Mock response (USE_MOCK=true protects $5 budget during dev) ──────────────
MOCK_RESPONSE = {
    "product_name":    {"value": "XYZ Industrial 2\" Ball Valve", "source": "input_text",  "confidence": 95, "reasoning": "Explicitly stated in the product description header"},
    "category":        {"value": "Ball Valve",                    "source": "input_text",  "confidence": 100, "reasoning": "Confirmed from user category selection"},
    "brand":           {"value": "XYZ Industrial",                "source": "input_text",  "confidence": 92, "reasoning": "Extracted from brand manufacturer name in text"},
    "material":        {"value": "Stainless Steel 316",           "source": "input_text",  "confidence": 97, "reasoning": "Directly mentioned as valve body material"},
    "size":            {"value": "2 inch",                        "source": "input_text",  "confidence": 96, "reasoning": "Specified as 2-inch diameter size in description"},
    "connection_type": {"value": "NPT Threaded",                  "source": "input_text",  "confidence": 94, "reasoning": "Directly noted as NPT threaded end connections"},
    "pressure_rating": {"value": "High Pressure (est. Class 600)","source": "ai_inferred", "confidence": 62, "reasoning": "Inferred from typical Class 600 rating for high-pressure stainless valves"},
    "certifications":  {"value": "API 6D, ISO 9001",              "source": "ai_inferred", "confidence": 55, "reasoning": "Inferred based on standard industrial oil & gas compliance norms"},
    "application":     {"value": "Oil & Gas, Chemical Processing","source": "input_text",  "confidence": 93, "reasoning": "Directly stated industrial application environments"},
    "price_range":     {"value": "$150 - $400",                   "source": "ai_inferred", "confidence": 45, "reasoning": "Estimated based on 2-inch stainless steel industrial valve market pricing"},
}

# ─── System prompt (dynamic per category with conflict detection & reasoning) ─
def build_system_prompt(category: str) -> str:
    return f"""You are an expert industrial product intelligence AI for {category} equipment.
Given raw product text, extract, validate, and infer the 10 technical fields listed below.

CRITICAL RULES:
1. Internal Contradiction / Conflict Detection:
   If the input text contradicts itself (e.g. mentions '2 inch' in one place and '3 inch' in another, or 'Brass' and 'Stainless Steel'), you MUST:
   - set "source": "conflict"
   - set "confidence": 0
   - format "value": e.g. "2 inch (also mentioned as 3 inch — please verify)"
   - provide "reasoning": "Contradictory values detected within source text"

2. Direct extraction:
   If directly stated in text without contradiction:
   - set "source": "input_text"
   - set "confidence": 90-100
   - provide "reasoning": 1 concise sentence explaining where it was stated.

3. AI Inference:
   If not explicitly stated but deduced from industry standards or category norms:
   - set "source": "ai_inferred"
   - set "confidence": 40-70 (honest inference, not overconfident)
   - provide "reasoning": 1 concise sentence explaining the engineering logic (e.g. "Inferred from typical pressure ratings for 2-inch stainless ball valves").

4. Unknown:
   If it cannot be determined or inferred safely:
   - set "source": "unknown"
   - set "confidence": 0
   - set "value": ""
   - provide "reasoning": "Not mentioned in source text"

Fields to extract (return exactly these 10 keys):
product_name, category, brand, material, size, connection_type,
pressure_rating, certifications, application, price_range

For EACH field return a JSON object with:
{{ "value": string, "source": string, "confidence": integer, "reasoning": string }}

Return ONLY a valid JSON object with exactly those 10 keys. No markdown, no commentary."""


def extract_product_data(raw_text: str, category: str = "Ball Valve") -> dict:
    """
    Extract structured product data from raw text, then apply rule-based validation.
    """
    if os.getenv("USE_MOCK", "true").lower() == "true":
        result = dict(MOCK_RESPONSE)
        # Apply validation check
        return validate_product_record(result, category)

    api_key = os.getenv("OPENAI_API_KEY")
    client = OpenAI(api_key=api_key)

    response = client.chat.completions.create(
        model="gpt-4o-mini",
        response_format={"type": "json_object"},
        messages=[
            {"role": "system", "content": build_system_prompt(category)},
            {
                "role": "user",
                "content": f"Raw product text:\n{raw_text}",
            },
        ],
        temperature=0.2,
    )

    content = response.choices[0].message.content
    data = json.loads(content)

    # Apply independent rule-based sanity check
    return validate_product_record(data, category)


def compare_cross_sources(data_a: dict, data_b: dict, category: str = "Ball Valve") -> dict:
    """
    Field-by-field cross-source validation comparing Source A and Source B.
    Where sources disagree on non-empty values, flags as 'conflict'.
    """
    keys = [
        "product_name", "category", "brand", "material", "size",
        "connection_type", "pressure_rating", "certifications",
        "application", "price_range"
    ]
    merged = {}

    for k in keys:
        fa = data_a.get(k, {"value": "", "source": "unknown", "confidence": 0, "reasoning": ""})
        fb = data_b.get(k, {"value": "", "source": "unknown", "confidence": 0, "reasoning": ""})

        va = (fa.get("value") or "").strip()
        vb = (fb.get("value") or "").strip()

        # Both present and conflicting
        if va and vb and va.lower() != vb.lower():
            merged[k] = {
                "value": f"Source A: '{va}' | Source B: '{vb}'",
                "source": "conflict",
                "confidence": 0,
                "reasoning": f"Cross-source disagreement between Source A ({va}) and Source B ({vb})",
                "validation": "cross_source_conflict"
            }
        # Only Source A has value
        elif va and not vb:
            merged[k] = {
                "value": va,
                "source": fa.get("source", "input_text"),
                "confidence": fa.get("confidence", 90),
                "reasoning": f"From Source A: {fa.get('reasoning', 'Extracted from Source A')}",
                "validation": fa.get("validation")
            }
        # Only Source B has value
        elif vb and not va:
            merged[k] = {
                "value": vb,
                "source": fb.get("source", "input_text"),
                "confidence": fb.get("confidence", 90),
                "reasoning": f"From Source B: {fb.get('reasoning', 'Extracted from Source B')}",
                "validation": fb.get("validation")
            }
        # Both agree or both empty
        else:
            merged[k] = {
                "value": va or vb,
                "source": fa.get("source") if fa.get("source") == "input_text" else fb.get("source", "unknown"),
                "confidence": max(fa.get("confidence", 0), fb.get("confidence", 0)),
                "reasoning": fa.get("reasoning") or fb.get("reasoning") or "Matched across both sources",
                "validation": fa.get("validation") or fb.get("validation")
            }

    return merged


def extract_text_from_image(image_bytes: bytes, mime_type: str = "image/jpeg", category: str = "industrial product") -> str:
    """
    Use GPT-4o Vision to extract raw product text from an uploaded image.
    """
    api_key = os.getenv("OPENAI_API_KEY")
    client = OpenAI(api_key=api_key)

    b64 = base64.standard_b64encode(image_bytes).decode("utf-8")
    data_url = f"data:{mime_type};base64,{b64}"

    response = client.chat.completions.create(
        model="gpt-4o",
        messages=[
            {
                "role": "user",
                "content": [
                    {
                        "type": "text",
                        "text": (
                            f"This is an image of an industrial {category} product or its catalog/datasheet. "
                            "Extract ALL visible product information — name, brand, model, specifications, "
                            "material, size, ratings, certifications, and any other technical details. "
                            "Return ONLY the raw extracted text as a plain paragraph. No JSON, no bullets, no explanation."
                        ),
                    },
                    {"type": "image_url", "image_url": {"url": data_url, "detail": "high"}},
                ],
            }
        ],
        max_tokens=600,
    )
    return response.choices[0].message.content.strip()


def generate_sample_text(category: str = "Ball Valve") -> dict:
    """
    Use GPT-4o-mini to dynamically generate a realistic, messy industrial product snippet.
    """
    api_key = os.getenv("OPENAI_API_KEY")
    client = OpenAI(api_key=api_key)

    prompt = f"""Generate a realistic raw catalog snippet or messy product description for an industrial '{category}'.
Include realistic specifications such as brand name, model number, materials, sizes/dimensions, pressure ratings, temperature limits, connection types, standards/certifications (e.g. ANSI, ISO, CE, NPT), and industrial applications.
Keep it between 2 to 4 sentences like an unformatted supplier catalog entry.
Return ONLY the raw product text. Do not include quotes, titles, markdown, or commentary."""

    response = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[
            {"role": "system", "content": "You are an expert industrial engineering catalog writer. You generate diverse, authentic industrial equipment descriptions with real-world technical specs."},
            {"role": "user", "content": prompt},
        ],
        temperature=0.85,
        max_tokens=250,
    )

    text = response.choices[0].message.content.strip().strip('"').strip("'")
    return {"category": category, "sample_text": text}


