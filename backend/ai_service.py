# pyrefly: ignore [missing-import]
import os
import json
from openai import OpenAI
from dotenv import load_dotenv

load_dotenv()

client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

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

# ─── System prompt ─────────────────────────────────────────────────────────────
SYSTEM_PROMPT = """You are an industrial product data extraction AI.
Given raw product text, extract and/or infer the following fields for an industrial ball valve.

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

Return ONLY a valid JSON object with those 10 keys. No explanation, no markdown, no extra text."""


def extract_product_data(raw_text: str, category: str = "Ball Valve") -> dict:
    """
    Extract structured product data from raw text.
    Returns mock data if USE_MOCK=true (budget protection during dev).
    """
    if os.getenv("USE_MOCK", "true").lower() == "true":
        return MOCK_RESPONSE

    # OpenAI v1+ client (works with openai>=1.0.0 AND openai>=3.0.0)
    response = client.chat.completions.create(
        model="gpt-4o-mini",
        response_format={"type": "json_object"},
        messages=[
            {"role": "system", "content": SYSTEM_PROMPT},
            {
                "role": "user",
                "content": f"Category hint: {category}\n\nRaw product text:\n{raw_text}",
            },
        ],
        temperature=0.2,
    )

    return json.loads(response.choices[0].message.content)
