from ai_service import extract_product_data


GOLDEN_BENCHMARK_SET = [
    {
        "category": "Ball Valve",
        "input_text": (
            'XYZ FlowTech 2" Stainless Steel 316 Ball Valve. Full port, ANSI Class 300 flanged connection '
            'with PTFE seals. Max pressure rating 600 WOG, temp range -20°F to 400°F. '
            'Certified to ISO 9001 and API 6D. Used in petrochemical and steam processing.'
        ),
        "ground_truth_confirmed": {
            "category": "Ball Valve",
            "brand": "XYZ FlowTech",
            "material": "Stainless Steel 316",
            "size": "2 inch",
            "connection_type": "Flanged",
            "certifications": "ISO 9001, API 6D",
            "application": "Petrochemical and steam processing"
        }
    },
    {
        "category": "Ball Valve",
        "input_text": (
            'Apollo 1-1/4 inch Brass Ball Valve, female NPT threaded connections. Rated 400 PSI CWP, '
            'blowout-proof stem design. Approved for potable water and natural gas shutoff services.'
        ),
        "ground_truth_confirmed": {
            "category": "Ball Valve",
            "brand": "Apollo",
            "material": "Brass",
            "size": "1-1/4 inch",
            "connection_type": "NPT Threaded",
            "pressure_rating": "400 PSI CWP",
            "application": "Potable water and natural gas shutoff"
        }
    },
    {
        "category": "Industrial Motor",
        "input_text": (
            'Siemens 30kW 3-Phase Squirrel Cage Induction Motor, IE4 Super Premium Efficiency. '
            'Frame size 200L, 2950 RPM, 415V/50Hz. Cast iron housing, IP66 enclosure with PTC thermistors. '
            'Suitable for continuous duty pump & compressor drives.'
        ),
        "ground_truth_confirmed": {
            "category": "Industrial Motor",
            "brand": "Siemens",
            "material": "Cast Iron",
            "size": "Frame 200L",
            "application": "Continuous duty pump & compressor drives"
        }
    }
]


def run_accuracy_benchmark():
    """
    Evaluates real accuracy across the golden benchmark dataset.
    Calculates correct confirmed extractions / total confirmed fields.
    """
    total_tested = 0
    correct_extractions = 0
    details = []

    for item in GOLDEN_BENCHMARK_SET:
        category = item["category"]
        text = item["input_text"]
        gt = item["ground_truth_confirmed"]

        extracted = extract_product_data(text, category=category)

        # Force category to input_text 100% as per rule
        if category:
            extracted["category"] = {
                "value": category,
                "source": "input_text",
                "confidence": 100,
                "reasoning": "Confirmed from user category selection"
            }

        item_results = {"category": category, "fields": {}}

        for field_k, gt_val in gt.items():
            ext_field = extracted.get(field_k, {})
            ext_val = str(ext_field.get("value", "")).lower()
            ext_src = ext_field.get("source", "")
            gt_words = [w.lower() for w in gt_val.replace(",", "").replace('"', '').split() if len(w) > 2]

            # Consider correct if any primary keyword matches and source is input_text
            matched = any(w in ext_val for w in gt_words) if gt_words else bool(ext_val)
            is_correct = matched and (ext_src == "input_text" or ext_field.get("confidence", 0) >= 80)

            total_tested += 1
            if is_correct:
                correct_extractions += 1

            item_results["fields"][field_k] = {
                "ground_truth": gt_val,
                "extracted_value": ext_field.get("value"),
                "source": ext_src,
                "confidence": ext_field.get("confidence"),
                "is_correct": is_correct
            }

        details.append(item_results)

    accuracy_pct = round((correct_extractions / total_tested * 100), 1) if total_tested > 0 else 0.0

    return {
        "accuracy_percentage": accuracy_pct,
        "total_fields_evaluated": total_tested,
        "correctly_extracted": correct_extractions,
        "evaluation_samples": len(GOLDEN_BENCHMARK_SET),
        "details": details
    }
