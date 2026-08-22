import re
from typing import Dict, Any, List


def parse_numeric(text: str) -> list:
    """Extract numeric values from string."""
    if not text:
        return []
    matches = re.findall(r"[-+]?(?:\d*\.\d+|\d+)", text.replace(",", ""))
    try:
        return [float(m) for m in matches]
    except Exception:
        return []


def validate_product_record(record: dict, category: str = "Ball Valve") -> dict:
    """
    Independent non-AI rule-based sanity check layer.
    Inspects extracted/inferred values against domain engineering boundaries.
    """
    category_lower = (category or "").lower()

    for field_key, field_data in record.items():
        if not isinstance(field_data, dict) or "value" not in field_data:
            continue

        val = str(field_data.get("value", ""))
        source = field_data.get("source", "unknown")
        confidence = field_data.get("confidence", 0)
        nums = parse_numeric(val)

        # ── 1. Pressure Rating Validation ──────────────────────────────────────
        if field_key == "pressure_rating":
            if "valve" in category_lower:
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
                if val and source == "ai_inferred" and val.lower() not in ["n/a", "none", "not applicable", ""]:
                    field_data["validation"] = "outside_expected_range"
                    field_data["confidence"] = 20
                    field_data["reasoning"] = "⚠️ [Rule Alert: Electric motors do not have standard fluid pressure ratings]"

        # ── 2. Size Validation ────────────────────────────────────────────────
        elif field_key == "size":
            if "valve" in category_lower:
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
                if min_price <= 0 or max_price > 500000:
                    if source == "ai_inferred":
                        field_data["validation"] = "outside_expected_range"
                        field_data["confidence"] = max(10, confidence - 25)
                        field_data["reasoning"] = (
                            f"{field_data.get('reasoning', '')} ⚠️ [Rule Alert: Price estimate {val} falls outside standard industrial catalog norms]"
                        ).strip()

    return record


def validate_unilog_content_rules(enriched_record: Dict[str, Any]) -> Dict[str, Any]:
    """
    Evaluates enriched Unilog record against UNILOG_INTERNAL_CONTENT_GUIDELINES.
    Checks:
    - INVOICE_DESC length <= 40 chars & all caps
    - MOBILE_DESC length 60-80 chars
    - Number/UOM spacing compliance
    - Fraction vs Decimal formatting
    - Brand trademark symbols & legal casing
    Returns audit status, compliance score, and list of violations / warnings.
    """
    violations: List[str] = []
    warnings: List[str] = []
    
    # 1. Invoice Description Check
    inv_desc = str(enriched_record.get("INVOICE_DESC", "")).strip()
    if not inv_desc:
        violations.append("INVOICE_DESC is missing.")
    else:
        if len(inv_desc) > 40:
            violations.append(f"INVOICE_DESC exceeds 40 characters ({len(inv_desc)} chars).")
        if inv_desc != inv_desc.upper():
            violations.append("INVOICE_DESC must be in ALL UPPERCASE.")
            
    # 2. Mobile Description Check
    mob_desc = str(enriched_record.get("MOBILE_DESC", "")).strip()
    if not mob_desc:
        violations.append("MOBILE_DESC is missing.")
    else:
        mob_len = len(mob_desc)
        if mob_len < 60 or mob_len > 80:
            warnings.append(f"MOBILE_DESC length is {mob_len} chars (target 60-80 chars).")

    # 3. Brand & Manufacturer Trademark Check
    brand_name = str(enriched_record.get("BRAND_NAME", "")).strip()
    if not brand_name or brand_name.lower() in ["-- unbranded --", "unbranded", "generic"]:
        warnings.append("BRAND_NAME contains placeholder or is empty.")
    elif "®" not in brand_name and "™" not in brand_name and brand_name not in ["Mueller Streamline"]:
        warnings.append(f"BRAND_NAME '{brand_name}' may be missing standard registered trademark (® / ™) symbol.")

    # 4. UOM Spacing Check across all descriptions & attributes
    combined_texts = f"{inv_desc} {mob_desc} {enriched_record.get('SHORT_DESC', '')} {enriched_record.get('LONG_DESC1', '')}"
    bad_uom_matches = re.findall(r'\b\d+(?:in|ft|mm|cm|V|A|dBA|kW|PSI|GPM|RPM|gal|oz|lb)\b', combined_texts)
    if bad_uom_matches:
        warnings.append(f"Found {len(bad_uom_matches)} instances missing space between number and unit: {', '.join(bad_uom_matches[:3])}")

    # 5. Decimal in Dimensions Check
    if re.search(r'\b\d+\.\d+\s*(?:in|")', combined_texts):
        warnings.append("Found un-converted decimal measurements in descriptions. Standard requires trade fractions (e.g. 50-1/4 in).")

    # Determine "Needs Human Review" flag
    needs_review = len(violations) > 0 or len(warnings) >= 2 or enriched_record.get("conflict_detected", False)
    
    # Calculate compliance percentage
    total_checks = 5
    passed_checks = total_checks - len(violations) - (0.5 * len(warnings))
    compliance_score = max(0.0, min(100.0, (passed_checks / total_checks) * 100.0))

    return {
        "needs_human_review": needs_review,
        "compliance_score": round(compliance_score, 1),
        "violations": violations,
        "warnings": warnings,
        "invoice_desc_len": len(inv_desc),
        "mobile_desc_len": len(mob_desc),
        "is_invoice_valid": len(inv_desc) <= 40 and inv_desc == inv_desc.upper() and bool(inv_desc),
        "is_mobile_valid": 60 <= len(mob_desc) <= 80
    }
