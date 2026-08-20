import { useState, useRef, useEffect } from 'react'
import axios from 'axios'
import FileDropZone from './FileDropZone'

const CATEGORIES = [
  { value: 'Ball Valve',        icon: '🔧' },
  { value: 'Industrial Motor',  icon: '⚙️' },
  { value: 'Pump',              icon: '💧' },
  { value: 'Pressure Gauge',    icon: '🎯' },
  { value: 'Heat Exchanger',    icon: '🌡️' },
  { value: 'Bearing',           icon: '🔩' },
  { value: 'Sensor',            icon: '📡' },
  { value: 'Compressor',        icon: '🏭' },
]

const SAMPLE_BATCH_TEXT = `XYZ FlowTech 2" Stainless Steel 316 Ball Valve. Full port, ANSI Class 300 flanged connection with PTFE seals. Max pressure rating 600 WOG, temp range -20°F to 400°F. Certified to ISO 9001 and API 6D. Used in petrochemical and steam processing.
---
Apollo 1-1/4 inch Brass Ball Valve, female NPT threaded connections. Rated 400 PSI CWP, blowout-proof stem design. Approved for potable water and natural gas shutoff services.
---
Heavy-duty 4" Carbon Steel WCB Flanged Ball Valve, Class 150. Lever operated with locking device, firesafe certified to API 607. Ideal for oil refinery pipelines.`

const SAMPLE_CROSS_A = `FlowServe Series 5100 2" Ball Valve. High-performance 316 Stainless Steel construction with RTFE seats. Rated for 600 WOG service, 150 PSI saturated steam. NPT threaded connections with locking lever handle.`

const SAMPLE_CROSS_B = `FlowServe Series 5100 Ball Valve. 3-inch nominal pipe size with Brass body construction. Class 300 flanged ends, maximum pressure rating 400 PSI. Intended for general water and compressed air shutoff.`

const SAMPLE_INTERNAL_CONFLICT = `Heavy-Duty Industrial Ball Valve by Velan. 2-inch nominal size with stainless steel 316 body. Features 3-inch full bore design and rated for 600 WOG service. Note: Spec sheet also lists 800 PSI rating on page 4.`

export default function InputPanel({
  onGenerate,
  onGenerateBatch,
  onGenerateCrossSource,
  loading,
  apiUrl,
}) {
  const [tab, setTab] = useState('text') // 'text' | 'batch' | 'cross' | 'file'
  const [text, setText] = useState('')
  const [batchText, setBatchText] = useState('')
  const [sourceA, setSourceA] = useState('')
  const [sourceB, setSourceB] = useState('')
  const [category, setCategory] = useState('Ball Valve')
  const [open, setOpen] = useState(false)
  const [sampleLoading, setSampleLoading] = useState(false)
  const dropdownRef = useRef(null)
  const batchCsvRef = useRef(null)

  // Close dropdown when clicking outside
  useEffect(() => {
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const selected = CATEGORIES.find((c) => c.value === category) || CATEGORIES[0]

  // Submit handlers
  const handleSingleSubmit = () => {
    if (!text.trim()) return
    onGenerate(text.trim(), category)
  }

  const handleBatchSubmit = () => {
    const items = batchText
      .split('---')
      .map((s) => s.trim())
      .filter(Boolean)
    if (items.length === 0) return
    onGenerateBatch(items, category)
  }

  const handleCrossSubmit = () => {
    if (!sourceA.trim() || !sourceB.trim()) return
    onGenerateCrossSource(sourceA.trim(), sourceB.trim(), category)
  }

  // Dynamic AI sample generator for Single
  const handleGenerateSample = async () => {
    setSampleLoading(true)
    try {
      const res = await axios.get(`${apiUrl}/sample`, {
        params: { category },
        timeout: 8000,
      })
      if (res.data?.sample_text) {
        setText(res.data.sample_text)
        return
      }
      throw new Error('No sample text returned')
    } catch {
      setText(SAMPLE_BATCH_TEXT.split('---')[0].trim())
    } finally {
      setSampleLoading(false)
    }
  }

  const handleLoadConflictSample = () => {
    setText(SAMPLE_INTERNAL_CONFLICT)
  }

  // Batch CSV file upload parser
  const handleBatchCsvUpload = (e) => {
    const file = e.target.files[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (evt) => {
      const content = evt.target.result || ''
      const lines = content
        .split(/\r?\n/)
        .map((l) => l.trim())
        .filter((l) => l.length > 5)
      setBatchText(lines.join('\n---\n'))
    }
    reader.readAsText(file)
  }

  const handleFileExtracted = (extractedText) => {
    setText(extractedText)
    setTab('text')
  }

  const batchCount = batchText
    .split('---')
    .map((s) => s.trim())
    .filter(Boolean).length

  return (
    <div className="card input-panel">
      {/* Header row with tabs & Category dropdown */}
      <div className="input-panel-header">
        <div className="input-tabs">
          <button
            id="tab-text"
            className={`input-tab${tab === 'text' ? ' active' : ''}`}
            onClick={() => setTab('text')}
            type="button"
          >
            📝 Single
          </button>
          <button
            id="tab-batch"
            className={`input-tab${tab === 'batch' ? ' active' : ''}`}
            onClick={() => setTab('batch')}
            type="button"
          >
            📦 Batch Mode
          </button>
          <button
            id="tab-cross"
            className={`input-tab${tab === 'cross' ? ' active' : ''}`}
            onClick={() => setTab('cross')}
            type="button"
          >
            ⚖️ Cross-Source
          </button>
          <button
            id="tab-file"
            className={`input-tab${tab === 'file' ? ' active' : ''}`}
            onClick={() => setTab('file')}
            type="button"
          >
            📁 File Drop
          </button>
        </div>

        {/* Category dropdown */}
        <div className="custom-dropdown" ref={dropdownRef}>
          <button
            id="category-select"
            className={`dropdown-trigger${open ? ' open' : ''}`}
            onClick={() => setOpen((o) => !o)}
            type="button"
          >
            <span>{selected.icon} {selected.value}</span>
            <svg className="dropdown-caret" viewBox="0 0 20 20" fill="none">
              <path stroke="#9494b8" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M6 8l4 4 4-4"/>
            </svg>
          </button>

          {open && (
            <div className="dropdown-menu">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat.value}
                  className={`dropdown-item${cat.value === category ? ' active' : ''}`}
                  onClick={() => { setCategory(cat.value); setOpen(false) }}
                  type="button"
                >
                  {cat.icon} {cat.value}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── TAB 1: Single Text ────────────────────────────────────────── */}
      {tab === 'text' && (
        <>
          <div className="textarea-wrapper">
            <textarea
              id="product-textarea"
              className="product-textarea"
              placeholder={"Paste raw product text here — specs, catalog descriptions, unformatted technical blurbs…\n\nPress Ctrl+Enter to generate."}
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) handleSingleSubmit()
              }}
              maxLength={2500}
            />
            <span className="char-count">{text.length}/2500</span>
          </div>

          <div className="input-actions">
            <div className="sample-btns">
              <button
                id="dynamic-sample-btn"
                className="sample-btn ai-sample-btn"
                onClick={handleGenerateSample}
                disabled={sampleLoading || loading}
                type="button"
                title="Generate a unique realistic industrial sample using ChatGPT"
              >
                {sampleLoading ? (
                  <>
                    <div className="spinner-mini" />
                    Generating…
                  </>
                ) : (
                  <>
                    <span>🎲</span>
                    Try AI Sample
                  </>
                )}
              </button>

              <button
                type="button"
                className="sample-btn"
                onClick={handleLoadConflictSample}
                disabled={loading}
                title="Load a product blurb with internal contradiction to test Conflict detection"
              >
                <span>⚡</span> Contradiction Test
              </button>
            </div>

            <button
              id="generate-btn"
              className="generate-btn"
              onClick={handleSingleSubmit}
              disabled={loading || !text.trim()}
            >
              {loading ? (
                <>
                  <div className="spinner" />
                  Analyzing…
                </>
              ) : (
                <>
                  <span>✦</span>
                  Generate
                </>
              )}
            </button>
          </div>
        </>
      )}

      {/* ── TAB 2: Batch Mode ─────────────────────────────────────────── */}
      {tab === 'batch' && (
        <div className="batch-input-view">
          <div className="batch-instruction-strip">
            <span>ℹ️ Paste multiple product descriptions separated by <code>---</code> or upload a CSV.</span>
            <input
              ref={batchCsvRef}
              type="file"
              accept=".csv,.txt"
              style={{ display: 'none' }}
              onChange={handleBatchCsvUpload}
            />
            <button
              type="button"
              className="batch-upload-link"
              onClick={() => batchCsvRef.current?.click()}
            >
              📂 Upload CSV/TXT
            </button>
          </div>

          <div className="textarea-wrapper">
            <textarea
              id="batch-textarea"
              className="product-textarea"
              style={{ minHeight: '180px' }}
              placeholder={"Product 1 description...\n---\nProduct 2 description...\n---\nProduct 3 description..."}
              value={batchText}
              onChange={(e) => setBatchText(e.target.value)}
            />
            <span className="char-count">{batchCount} item{batchCount !== 1 ? 's' : ''} detected</span>
          </div>

          <div className="input-actions">
            <button
              type="button"
              className="sample-btn"
              onClick={() => setBatchText(SAMPLE_BATCH_TEXT)}
              disabled={loading}
            >
              <span>📋</span> Load 3-SKU Sample Batch
            </button>

            <button
              id="batch-generate-btn"
              className="generate-btn"
              onClick={handleBatchSubmit}
              disabled={loading || batchCount === 0}
            >
              {loading ? (
                <>
                  <div className="spinner" />
                  Processing Batch ({batchCount})…
                </>
              ) : (
                <>
                  <span>📦</span>
                  Process Batch ({batchCount})
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* ── TAB 3: Cross-Source Validation ───────────────────────────── */}
      {tab === 'cross' && (
        <div className="cross-source-view">
          <div className="cross-source-grid">
            <div className="cross-source-col">
              <label className="cross-label">📄 Source A (e.g. Supplier Catalog)</label>
              <textarea
                className="product-textarea cross-textarea"
                placeholder="Paste primary specification text here..."
                value={sourceA}
                onChange={(e) => setSourceA(e.target.value)}
              />
            </div>
            <div className="cross-source-col">
              <label className="cross-label">📑 Source B (e.g. Technical Datasheet)</label>
              <textarea
                className="product-textarea cross-textarea"
                placeholder="Paste secondary specification text to verify against Source A..."
                value={sourceB}
                onChange={(e) => setSourceB(e.target.value)}
              />
            </div>
          </div>

          <div className="input-actions">
            <button
              type="button"
              className="sample-btn"
              onClick={() => {
                setSourceA(SAMPLE_CROSS_A)
                setSourceB(SAMPLE_CROSS_B)
              }}
              disabled={loading}
              title="Load two conflicting supplier datasheets"
            >
              <span>⚖️</span> Load Conflict Sample
            </button>

            <button
              id="cross-generate-btn"
              className="generate-btn"
              onClick={handleCrossSubmit}
              disabled={loading || !sourceA.trim() || !sourceB.trim()}
            >
              {loading ? (
                <>
                  <div className="spinner" />
                  Comparing Sources…
                </>
              ) : (
                <>
                  <span>⚖️</span>
                  Compare & Extract
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* ── TAB 4: File Drop ─────────────────────────────────────────── */}
      {tab === 'file' && (
        <FileDropZone
          onExtracted={handleFileExtracted}
          category={category}
          apiUrl={apiUrl}
        />
      )}
    </div>
  )
}

