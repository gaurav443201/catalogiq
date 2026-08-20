import re
from typing import Dict, Any


def parse_numeric(text: str) -> list:
    """Extract numeric values from string."""
    if not text:
        return []
    # Match integers and floats
    matches = re.findall(r"[-+]?(?:\d*\.\d+|\d+)", text.replace(",", ""))
    try:
        return [float(m) for m in matches]
    except Exception:
        return []


def validate_product_record(record: dict, category: str = "Ball Valve") -> dict:
    """
    Independent non-AI rule-based sanity check layer.
    Inspects extracted/inferred values against domain engineering boundaries.
    If an AI-inferred value falls outside plausible ranges, downgrades confidence
    and sets validation flag 'outside_expected_range'.
    """
    category_lower = (category or "").lower()

    for field_key, field_data in record.items():
        if not isinstance(field_data, dict) or "value" not in field_data:
            continue

        val = field_data.get("value", "")
        source = field_data.get("source", "unknown")
        confidence = field_data.get("confidence", 0)
        nums = parse_numeric(val)

        # ── 1. Pressure Rating Validation ──────────────────────────────────────
        if field_key == "pressure_rating":
            if "valve" in category_lower:
                # Plausible ball valve pressure: 10 PSI to 15,000 PSI
                if nums:
                    max_num = max(nums)
                    if max_num > 15000 or (max_num < 15 and "bar" not in val.lower() and "wog" not in val.lower() and "class" not in val.lower()):
                        if source == "ai_inferred":
                            field_data["validation"] = "outside_expected_range"
                            field_data["confidence"] = max(15, confidence - 30)
                            existing_reason = field_data.get("reasoning", "")
                            field_data["reasoning"] = (
                                f"{existing_reason} ⚠️ [Rule Alert: Pressure {val} exceeds typical industrial valve range (15-15,000 PSI)]"
                            ).strip()
            elif "motor" in category_lower:
                # Motors don't typically have pressure ratings
                if val and source == "ai_inferred" and val.lower() not in ["n/a", "none", "not applicable", ""]:
                    field_data["validation"] = "outside_expected_range"
                    field_data["confidence"] = 20
                    field_data["reasoning"] = "⚠️ [Rule Alert: Electric motors do not have standard fluid pressure ratings]"

        # ── 2. Size Validation ────────────────────────────────────────────────
        elif field_key == "size":
            if "valve" in category_lower:
                # Plausible industrial valve size: 0.125" to 48"
                if nums:
                    max_num = max(nums)
                    if (max_num > 60 and "mm" not in val.lower() and "dn" not in val.lower()) or max_num <= 0:
                        if source == "ai_inferred":
                            field_data["validation"] = "outside_expected_range"
                            field_data["confidence"] = max(15, confidence - 30)
                            field_data["reasoning"] = (
                                f"{field_data.get('reasoning', '')} ⚠️ [Rule Alert: Size {val} is outside typical industrial piping standards]"
                            ).strip()

        # ── 3. Price Range Sanity Check ───────────────────────────────────────
        elif field_key == "price_range":
            if nums:
                min_price = min(nums)
                max_price = max(nums)
                # Unrealistic extremes for standard commercial components
                if min_price <= 0 or max_price > 500000:
                    if source == "ai_inferred":
                        field_data["validation"] = "outside_expected_range"
                        field_data["confidence"] = max(10, confidence - 25)
                        field_data["reasoning"] = (
                            f"{field_data.get('reasoning', '')} ⚠️ [Rule Alert: Price estimate {val} falls outside standard industrial catalog norms]"
                        ).strip()

    return record
