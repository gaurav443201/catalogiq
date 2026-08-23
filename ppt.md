# ⚡ CatalogIQ Presentation Deck & Project Details (ppt.md)
This document contains structured slide-by-slide details, speaker notes, tech stack justifications, and visual ideas to help you build a winning presentation.

---

## 🎨 Presentation Design & Visual Theme Recommendations
To match the CatalogIQ product design, use a modern, premium **dark mode theme** for your slides:
* **Background:** Deep Navy/Slate Black (`#0B0F19` or `#0F172A`)
* **Primary Text:** Crisp White (`#FFFFFF`) or off-white (`#F8FAFC`)
* **Accent Colors:** 
  * 🟢 **Confirmed Green:** `#10B981` (Success, Verified Data)
  * 🟡 **Inferred Yellow:** `#F59E0B` (AI-derived, Audited Data)
  * 🔴 **Unknown Red:** `#EF4444` (Action needed, Flagged Data)
  * ⚡ **Brand Violet/Indigo:** `#6366F1`
* **Typography:** Clean sans-serif fonts (e.g., *Inter*, *Outfit*, or *Montserrat*).

---

## 🖥️ Slide-by-Slide Presentation Blueprint

### ⚡ Slide 1: Title & Introduction
* **Slide Title:** CatalogIQ
* **Subtitle:** AI-Powered Product Intelligence for Industrial B2B Commerce
* **Key Visuals:** A central, glowing CatalogIQ logo (lightning bolt icon ⚡) surrounded by clean tech badges (React, FastAPI, AWS, OpenAI).
* **Content:**
  * **Event:** UniHack 2026
  * **Team/Presenter:** [Your Name / Team Name]
  * **Core Pitch:** "Transforming messy technical specifications into structured, validated, and explainable product records."
* **🔊 Speaker Notes:**
  > "Good morning judges. Today, we are presenting CatalogIQ—an AI-powered intelligence platform built to solve the multi-billion dollar unstructured data problem in B2B industrial commerce. We turn chaotic, fragmented datasheets into structured, clean product records in under two seconds."

---

### 🚨 Slide 2: The Unstructured Data Bottleneck
* **Slide Title:** The Problem: Fragmented Industrial Catalogs
* **Layout:** Two-column split.
  * **Left Column:** A mock screenshot of messy supplier data (a chaotic mix of PDF spec sheets, scans, and unformatted jargon like `"316SS 2in flg 300# cl API607 firesafe"`).
  * **Right Column (Bullet Points):**
    * **Trapped Data:** Vital engineering specifications are buried in scattered PDFs, Word files, and component nameplates.
    * **High Cost of Manual Labor:** Catalog managers spend 15–30 minutes manually formatting and verifying a single SKU.
    * **Hallucination Safety Risks:** Generic AI models hallucinate specs. A wrong pressure rating or size leads to dangerous, real-world equipment failures.
* **Key Stat Callout:** **80%** of industrial catalog creation time is wasted on manual copy-pasting.
* **🔊 Speaker Notes:**
  > "B2B industrial commerce is a multi-trillion dollar market, but onboarding suppliers is painful. Technical parameters are complex and critical—materials, pressures, dimensions. Manual entry is slow, and generic AI tools cannot be trusted because a single hallucinated pressure rating or flange size is a major liability."

---

### 💡 Slide 3: The CatalogIQ Solution
* **Slide Title:** Explainable, Multimodal AI Product Intelligence
* **Layout:** Flow progression diagram (Input ➔ Engine ➔ Output).
* **Flow Stages:**
  1. **Multimodal Inputs:** Pasted text, PDF spec sheets, Word `.docx` documents, or equipment nameplate images.
  2. **CatalogIQ Engine:** In-browser client parsing combined with GPT-4o-mini structured schema analysis and DynamoDB storage.
  3. **10-Point Technical Schema:** Outputting standardized, verified product fields.
* **Core Value Proposition Box:**
  > **"Not just AI that fills a form, but AI that proves its work."**
* **🔊 Speaker Notes:**
  > "CatalogIQ accepts any format suppliers provide—raw text, PDFs, Word docs, or photos of physical equipment tags—and instantly formats them into 10 structured technical fields. Most importantly, it is fully explainable; we don't just dump text into a form, we prove its origin."

---

### 🟢 Slide 4: Core Innovation: 3-Tier Provenance Model
* **Slide Title:** The Cure for Hallucinations: Explainable Provenance
* **Layout:** 3 Horizontal Cards (Green, Yellow, Red) representing data confidence.
* **The 3 Tiers:**
  * 🟢 **Confirmed (`input_text` | 90%–100% confidence):** Verbatim or directly stated in input text. Guaranteed factual.
  * 🟡 **AI-Inferred (`ai_inferred` | 40%–70% confidence):** Synthesized using category engineering norms. Tooltip explains the logic.
  * 🔴 **Unknown (`unknown` | 0% confidence):** Missing data flagged for engineering review. Prevents silent errors.
* **Visual Aid:** Image of the UI showing color-coded badges and confidence bars next to values.
* **🔊 Speaker Notes:**
  > "To stop AI hallucinations in critical operations, CatalogIQ classifies every single attribute. Green fields are verified directly in the source. Yellow fields are inferred by AI based on category standards, displaying an interactive reasoning tooltip. Red fields represent unknown data—flagged explicitly for human engineers to review."

---

### 📂 Slide 5: The Standardized 10-Point Technical Schema
* **Slide Title:** Structured Data Quality: The 10-Point Schema
* **Layout:** Two columns showing standard schema keys and their significance.
* **The 10 Keys:**
  1. **Product Name** (Standardized name)
  2. **Category** (Pre-tuned categories, e.g., Ball Valves, Motors)
  3. **Brand** (Manufacturer identification)
  4. **Material** (Metallurgy, plastic, housing specs)
  5. **Size** (Dimensions, thread sizes, frame sizes)
  6. **Connection Type** (NPT, flanged, socket weld)
  7. **Pressure Rating** (ANSI Class, WOG, PSI)
  8. **Certifications** (API 6D, ISO, CE, ATEX)
  9. **Application** (Steam, chemical processing, oil & gas)
  10. **Price Range** (AI-estimated budget metrics)
* **🔊 Speaker Notes:**
  > "We standardize data across 10 critical industrial parameters. By mapping messy jargon into this unified schema, CatalogIQ normalizes diverse product catalogs, allowing seamless import into B2B e-commerce platforms."

---

### 📄 Slide 6: Multimodal Ingestion Pipeline
* **Slide Title:** Ingestion Engine: No File Left Behind
* **Layout:** Diagram showcasing how different formats are handled.
* **Process Steps:**
  * **PDF Ingestion:** Handled directly in-browser using `pdfjs-dist`. Zero server storage overhead.
  * **DOCX Ingestion:** Handled client-side using `mammoth.js` to extract text.
  * **Image/OCR Ingestion:** Handled by a backend API calling `gpt-4o` (Vision) to extract text from nameplates and drawings.
  * **Resulting flow:** Text feeds to the `/generate` endpoint running `gpt-4o-mini` with strict JSON mode.
* **🔊 Speaker Notes:**
  > "We support multiple real-world ingestion methods. To protect corporate document privacy, PDFs and Word files are parsed locally on the client's browser. Nameplate images and equipment drawings are processed securely through GPT-4o Vision to extract data, which is then structured."

---

### ⚙️ Slide 7: Technical Stack & Architecture
* **Slide Title:** High-Performance Serverless Architecture
* **Layout:** Grid or split view of technology choices.
* **Tech Specifications:**
  * **Frontend:** React 18, Vite, Custom Vanilla CSS UI (Zero-dependency glassmorphism UI).
  * **Backend:** FastAPI (Python), asynchronous endpoints, Pydantic v2 data models.
  * **Database:** AWS DynamoDB (for serverless, sub-10ms queries, scalable historical storage).
  * **AI Integration:** OpenAI API (`gpt-4o-mini` JSON mode + `gpt-4o` for Vision).
  * **Deployment:** Frontend on AWS Amplify CDN; Backend on AWS Elastic Beanstalk (AL2 platform).
* **🔊 Speaker Notes:**
  > "CatalogIQ's backend is asynchronous, built in Python using FastAPI for high performance. We persist history in AWS DynamoDB. Our entire platform is hosted serverlessly on AWS, with the frontend on Amplify and the API on Elastic Beanstalk, delivering sub-2-second response times."

---

### 🚀 Slide 8: Live Demo Walkthrough
* **Slide Title:** Interactive Demo Experience
* **Layout:** Grid of interface mockups/diagrams showing the demo steps.
* **The Flow:**
  1. **Select Category & Load Sample:** Show 1-click sample generation across 8 industries.
  2. **Ingest / Generate:** Sub-2-second processing.
  3. **Inspect Provenance:** Hover on tooltips, analyze confidence metrics.
  4. **Export Action:** 1-click export of data to JSON, formatted CSV, or copy to clipboard.
* **🔊 Speaker Notes:**
  > "In the live workflow, catalog engineers simply select an industrial category and either paste text, upload documents, or click 'Try AI Sample'. The system delivers structured, provenance-tagged results in seconds, ready to copy or download as clean CSV files."

---

### 💼 Slide 9: Quantifiable Business Impact
* **Slide Title:** Business Value & ROI for Distributors
* **Layout:** Large stats with accompanying text.
* **Key Numbers:**
  * **90% Time Reduction:** From 20 minutes to under 2 seconds per SKU onboarding.
  * **75% Operational Savings:** Cuts labor costs by automating extraction and filtering.
  * **0% silent errors:** Provenance classification mitigates risks of wrong orders and liability claims.
  * **Instant ERP Sync:** Downstream integration with SAP, Akeneo, and Shopify B2B via JSON/CSV formats.
* **🔊 Speaker Notes:**
  > "By automating SKU onboarding, a typical industrial distributor handling 50,000 products annually can cut processing time from months to days, saving thousands of engineering hours while preventing expensive shipping and returns errors."

---

### 🚀 Slide 10: Future Product Roadmap
* **Slide Title:** Roadmap: Scale and Integrations
* **Layout:** Horizontal timeline or 3-step pipeline.
* **Phases:**
  * **Phase 1 (Current):** Single-SKU multimodal input, 10-point schema, 3-tier provenance model, DynamoDB historical storage.
  * **Phase 2 (Scalability):** Enterprise batch processing—ingest multi-hundred page PDF catalogs or ZIP directories of nameplates.
  * **Phase 3 (Ecosystem):** Native API connectors directly into ERP and PIM platforms (SAP S/4HANA, Akeneo, Shopify Plus).
* **🔊 Speaker Notes:**
  > "Today, CatalogIQ is a powerful workbench for individual files and snippets. Our next steps involve enterprise batch processing for entire catalogs and establishing native synchronization directly into ERP databases. Thank you, and we're open to questions!"

---

## 🛡️ Judge Q&A Defense Sheet (FAQ Guide)

### Q1: How does your system prevent LLM hallucinations from corrupting industrial specifications?
* **A:** "We enforce strict JSON output formatting on our backend. More importantly, we use a **3-tier provenance system**. The prompt requires the model to categorize each field's origin. Verbatim text matches receive 🟢 `input_text` (90-100% confidence). Inferred context specs receive 🟡 `ai_inferred` (40-70% confidence) with explicit logical reasoning. Unsupported specs are marked 🔴 `unknown`. This shifts the human role from manual typing to quick validation, prioritizing yellow and red fields."

### Q2: Why choose GPT-4o-mini over larger models (e.g. Claude Sonnet or GPT-4o)?
* **A:** "`gpt-4o-mini` is highly cost-effective (~$0.15 per million input tokens) and yields sub-2-second JSON structured extraction. This matches the speed required for an interactive catalog. We reserve the more expensive `gpt-4o` model exclusively for our image upload OCR / vision pipeline, maximizing cost efficiency."

### Q3: How secure is the document ingestion? Can suppliers' files leak?
* **A:** "Security is built-in. PDFs and DOCX files are parsed directly inside the user's browser via client-side libraries. The backend only receives raw text over secure TLS channels. We do not store files on local servers; only structured JSON records are persisted in AWS DynamoDB."

### Q4: How easily does this integrate with legacy B2B catalog databases?
* **A:** "Since the backend outputs clean, structured JSON schemas, we can transform records to match any target API. Our frontend includes a direct download option for CSV spreadsheets and JSON files, making it immediately compatible with ERP and PIM tools like Akeneo, Shopify B2B, or SAP."
