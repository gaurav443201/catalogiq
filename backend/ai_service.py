# pyrefly: ignore [missing-import]
import os
import json
import base64
from openai import OpenAI
from dotenv import load_dotenv

load_dotenv()

# ─── Mock response (USE_MOCK=true protects $5 budget during dev) ──────────────
MOCK_RESPONSE = {
    "product_name":    {"value": "XYZ Industrial 2\" Ball Valve", "source": "input_text",  "confidence": 95},
    "category":        {"value": "Ball Valve",                    "source": "input_text",  "confidence": 98},
    "brand":           {"value": "XYZ Industrial",                "source": "input_text",  "confidence": 92},
    "material":        {"value": "Stainless Steel",               "source": "input_text",  "confidence": 97},
    "size":            {"value": "2 inch",                        "source": "input_text",  "confidence": 96},
    "connection_type": {"value": "NPT Threaded",                  "source": "input_text",  "confidence": 94},
    "pressure_rating": {"value": "High Pressure (est. Class 600)","source": "ai_inferred", "confidence": 62},
    "certifications":  {"value": "",                              "source": "unknown",     "confidence": 0},
    "application":     {"value": "Oil & Gas, Chemical Processing","source": "input_text",  "confidence": 93},
    "price_range":     {"value": "$150 - $400",                   "source": "ai_inferred", "confidence": 45},
}

# ─── System prompt (dynamic per category) ─────────────────────────────────────
def build_system_prompt(category: str) -> str:
    return f"""You are an industrial product data extraction AI.
Given raw product text, extract and/or infer the following fields for a {category} product.

For EACH field return exactly:
- "value": the extracted or inferred value (use empty string "" if unknown)
- "source": one of:
    "input_text"  -> value was directly stated in the input text
    "ai_inferred" -> value was inferred from context, category norms, or domain knowledge
    "unknown"     -> value could not be determined at all
- "confidence": integer
    90-100 for input_text  (high certainty, directly stated)
    40-70  for ai_inferred (honest inference, not overconfident)
    0      for unknown

Fields to extract:
product_name, category, brand, material, size, connection_type,
pressure_rating, certifications, application, price_range

Return ONLY a valid JSON object with exactly those 10 keys. No explanation, no markdown, no extra text."""


def extract_product_data(raw_text: str, category: str = "Ball Valve") -> dict:
    """
    Extract structured product data from raw text.
    Returns mock data if USE_MOCK=true (budget protection during dev).
    """
    if os.getenv("USE_MOCK", "true").lower() == "true":
        return MOCK_RESPONSE

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
    return json.loads(content)


def extract_text_from_image(image_bytes: bytes, mime_type: str = "image/jpeg", category: str = "industrial product") -> str:
    """
    Use GPT-4o Vision to extract raw product text from an uploaded image.
    Returns a plain-text string suitable for the /generate endpoint.
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
    Use GPT-4o-mini to dynamically generate a realistic, messy industrial product snippet
    with varying specifications each time.
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
        temperature=0.85, # high temperature ensures different samples every click
        max_tokens=250,
    )

    text = response.choices[0].message.content.strip().strip('"').strip("'")
    return {"category": category, "sample_text": text}

