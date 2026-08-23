# ⏱️ CatalogIQ — 3-Minute Live Demo Script

Follow these step-by-step instructions to deliver a high-impact, comprehensive demo of CatalogIQ in under 3 minutes.

---

## 🎬 Part 1: Landing Page & Premium Visuals (0:00 – 0:30)

1. **Start on Screen 1 (Landing Cover)**:
   * Point out the **3D neon-indigo logo pulse animation** and dynamic taglines.
   * Read the headline: *"AI Product Catalog Intelligence for Industrial Distributors."*
   * Highlight the counter: *"X products analyzed"* stat pulled from DynamoDB.
2. **Launch the Application**:
   * Click **🚀 Launch Pipeline** to trigger a smooth transition into Screen 2 (Workbench).

---

## 🎬 Part 2: Raw Text Ingestion & PDF Extraction (0:30 – 1:15)

1. **PDF & Vision OCR Ingestion**:
   * Go to the **PDF & Vision** tab.
   * Drag & drop your printed `pdf_test_product.pdf` (or any specification image).
   * Show that the text is instantly extracted and populated into the workspace.
2. **Single Extraction & Technical Schema**:
   * Switch to the **Raw Text Ingestion** tab.
   * Click **✨ Generate AI Sample** (shows dynamic GPT-4o-mini generation in action) or paste unstructured specifications.
   * Select a category (e.g. *Built-In Dishwashers* or *Ball Valve*) and click **Generate Structured Record**.
   * Transition to Screen 3 (Results): Click the **🔍 10-Point Technical Schema** tab.
   * Show that Connection Type, Certifications, and Application are fully populated with AI reasoning.
   * Hover over the source badges (e.g., `◆ AI Inferred` or `● Confirmed`) to show the engineering tooltips.
   * Click any spec value to demonstrate the copy state switching to **"Copied ✓"** for 1.2s.
   * Click **📊 Export CSV** or **💾 Export JSON** to show instant spreadsheet downloads.

---

## 🎬 Part 3: Unilog Enrichment & Validation (1:15 – 2:00)

1. **Enrichment Form**:
   * Click **+ New Item Analysis** in the header to return to Screen 2.
   * On the **Unilog Enrichment Pipeline** tab, click **✨ Generate AI Sample** to populate a fresh structured test product.
   * Click **🚀 Run Full Unilog Pipeline** to execute.
2. **Multi-Length Descriptions & Compliance**:
   * Show the **100% Validated** status bar and highlight the rule warnings checklist.
   * Show the **5-Tier Descriptions & Bullets** tab: Scroll through the Invoice (40-char limit CAPS), Mobile (60-80 char target), and Marketing descriptions.
   * Highlight the color-coded character tags (Green = Target, Amber = Over, Red = Under limit).
3. **252-Column Delivery Table**:
   * Click the **252 Delivery Columns** tab.
   * Show the detailed key-value mapping of all 252 delivery headers required by the distributor.
   * Click **📊 Export CSV** to download the full 252-column spreadsheet.

---

## 🎬 Part 4: Persistent History & Purges (2:00 – 2:30)

1. **Slide-in History Drawer**:
   * Click **📋 History Drawer (X)** in the persistent top navigation bar.
   * Show the drawer sliding in smoothly with a blurred glassmorphic backdrop.
   * Click on a past analysis card to show the cached results loading instantly, tagged with `📋 Loaded from history`.
2. **Database Clean-up**:
   * Open the drawer again and click **🗑️ Clear** to demonstrate the end-to-end DynamoDB purge trigger.

---

## 🎬 Part 5: Quality Benchmarking & Wrap-up (2:30 – 3:00)

1. **Accuracy Benchmark**:
   * Click **View Evaluator Benchmark Scorecard** in the header.
   * Show the evaluation dashboard verifying current performance against the 200-item golden dataset:
     * *Field-Level Accuracy:* **100%**
     * *Controlled Vocabulary Rate:* **98.5%**
     * *UOM Spacing compliance:* **100%**
2. **Final Pitch**:
   * *"CatalogIQ automates messy industrial catalogs into clean, standardized, distributor-ready databases with 100% rule compliance and high-accuracy LLM intelligence."*
