# CatalogIQ — Project Brief for AI Coding Agent

## Context
This is a hackathon project (UniHack, deadline 23 Aug 2026) solving the challenge: **"AI-Powered Product Intelligence for Industrial Commerce."**

Industrial companies have product info scattered across websites, catalogs, and technical documents. The goal is to transform limited/messy product info into rich, structured, validated, and explainable product data.

**Team:** Solo developer, building in 2 days.

---

## The Product: CatalogIQ

A tool where a user pastes in messy/incomplete product text, and the system:
1. Extracts known fields directly stated in the text
2. Infers missing fields using AI, with a confidence score
3. Labels every field with its source (confirmed vs. AI-inferred vs. unknown)
4. Displays the result in a clean, explainable UI

## Core Value Prop
Not just "AI fills in a form" — every field is **traceable and explainable**: the user can see whether a value came directly from their input or was inferred by AI, and how confident the AI is.

---

## Tech Stack

- **Backend:** Python + FastAPI
- **Frontend:** React
- **Database:** MongoDB Atlas (free tier)
- **AI:** OpenAI API, model `gpt-4o-mini`, using JSON mode / structured outputs
- **Deployment:** Backend → AWS Elastic Beanstalk. Frontend → AWS Amplify.
- **Budget constraint:** OpenAI API budget is $5 total — minimize redundant calls during development; use cached/mock responses once the JSON shape is confirmed.

---

## Data Schema

Focus on ONE product category to start: **industrial ball valves**. (Expand to a second category — e.g., industrial motors — only if time allows.)

```json
{
  "product_name": { "value": "", "source": "input_text | ai_inferred | unknown", "confidence": 0 },
  "category": { "value": "", "source": "", "confidence": 0 },
  "brand": { "value": "", "source": "", "confidence": 0 },
  "material": { "value": "", "source": "", "confidence": 0 },
  "size": { "value": "", "source": "", "confidence": 0 },
  "connection_type": { "value": "", "source": "", "confidence": 0 },
  "pressure_rating": { "value": "", "source": "", "confidence": 0 },
  "certifications": { "value": "", "source": "", "confidence": 0 },
  "application": { "value": "", "source": "", "confidence": 0 },
  "price_range": { "value": "", "source": "", "confidence": 0 }
}
```

Rules for the AI prompt:
- `source: "input_text"` + `confidence: 90-100` → value was directly stated in the input
- `source: "ai_inferred"` + `confidence: 40-70` → value was inferred based on category norms (should feel honest, not overconfident)
- `source: "unknown"` + `confidence: 0` → value could not be determined; flag for manual review

---

## API Endpoints Needed

1. `POST /generate` — accepts raw product text (+ optional category), calls OpenAI, returns the structured JSON schema above. Also saves the result to MongoDB.
2. `GET /products` — returns saved product records from MongoDB (for a simple history/list view, optional).
3. (Optional, only if time allows) `POST /generate-batch` — accepts an array of raw text inputs, returns an array of structured results.

---

## Frontend Screens

**Screen 1 — Input**
- Textarea for pasting raw product info
- Dropdown to select category (start with just "Ball Valve")
- "Generate" button with a loading state

**Screen 2 — Result Card**
- One row per field: label, value, colored badge
  - 🟢 Confirmed (input_text)
  - 🟡 AI-inferred (hover/tooltip shows reasoning if available)
  - 🔴 Unknown / needs review
- Confidence shown as a small percentage or bar next to AI-inferred fields

**Screen 3 — Batch Mode (optional, build only if core is solid and time remains)**
- Table view: rows = products, columns = fields
- Export as CSV/JSON button

---

## Sample Test Inputs (use these consistently while building — this is the "golden set")

**Input 1:**
```
XYZ Industrial 2" Ball Valve. Stainless steel body, suitable for high-pressure 
industrial applications. NPT threaded connections. Manufactured for use in 
oil & gas and chemical processing environments.
```

**Input 2:**
```
Brass ball valve, 1 inch, threaded ends. General purpose water and gas shutoff. 
Rated for residential and light commercial use.
```

**Input 3:**
```
Heavy-duty carbon steel ball valve, flanged connection, 4 inch diameter. 
Used in high-temperature steam applications. ANSI 300 rated.
```

---

## Build Order (do NOT build everything at once — build and test in this sequence)

1. FastAPI skeleton + MongoDB Atlas connection — verify with a simple test route
2. `/generate` endpoint with the OpenAI call — test with sample inputs until JSON output is stable and reliable
3. React skeleton: input box → calls backend → displays raw JSON (no styling yet) — confirm full loop works
4. Deploy both (Elastic Beanstalk + Amplify) — confirm they connect to each other in production, fix CORS/env var issues now
5. Build the styled result card UI (badges, tooltips, layout)
6. Polish: loading states, error handling (what shows if the API call fails?)
7. (Optional, time permitting) Batch mode + export
8. Final test on the deployed version using the golden set inputs

---

## What to explicitly SKIP (out of scope for this 2-day build)

- User authentication / accounts
- Real web scraping or file upload parsing (just accept pasted text)
- More than 1-2 product categories
- AWS DocumentDB (using MongoDB Atlas instead — simpler, same JSON-friendly model)
- Complex multi-step validation pipelines — keep the AI logic to one well-designed prompt call

---

## Pitch Framing (for the final submission/demo)

- **Problem:** Industrial companies manage scattered, incomplete product data across websites, catalogs, and technical documents — costly and slow to structure manually.
- **Solution:** CatalogIQ turns messy product text into structured, validated, explainable product records — showing exactly which fields are confirmed vs. AI-inferred, with confidence scores.
- **Why it matters:** Directly maps to the challenge's 4 expected outcomes — structured data generation, accuracy & consistency, AI validation & enrichment, and a scalable catalog engine (via batch mode).
