import { useState, useRef, useEffect } from 'react'
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

const SAMPLES = [
  {
    label: 'Sample 1',
    text: 'XYZ Industrial 2" Ball Valve. Stainless steel body, suitable for high-pressure industrial applications. NPT threaded connections. Manufactured for use in oil & gas and chemical processing environments.',
    category: 'Ball Valve',
  },
  {
    label: 'Sample 2',
    text: 'ABB 15kW 3-phase AC induction motor, IE3 efficiency class. Frame size 160M, 1450 RPM, 400V/50Hz. IP55 enclosure, class F insulation. Suitable for pumps, fans, compressors.',
    category: 'Industrial Motor',
  },
  {
    label: 'Sample 3',
    text: 'Grundfos CM5-6 centrifugal pump, stainless steel impeller, 1.1 kW, max flow 5 m³/h, max head 62m. Flanged connection DN40. For clean water and non-aggressive liquids.',
    category: 'Pump',
  },
]

export default function InputPanel({ onGenerate, loading, apiUrl }) {
  const [text, setText] = useState('')
  const [category, setCategory] = useState('Ball Valve')
  const [open, setOpen] = useState(false)
  const [tab, setTab] = useState('text') // 'text' | 'file'
  const dropdownRef = useRef(null)

  const handleSubmit = () => {
    if (!text.trim()) return
    onGenerate(text.trim(), category)
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) handleSubmit()
  }

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

  const handleFileExtracted = (extractedText) => {
    setText(extractedText)
    setTab('text') // switch to text tab so user can review + hit Generate
  }

  return (
    <div className="card input-panel">
      {/* Header row */}
      <div className="input-panel-header">
        <div className="input-tabs">
          <button
            id="tab-text"
            className={`input-tab${tab === 'text' ? ' active' : ''}`}
            onClick={() => setTab('text')}
            type="button"
          >
            📝 Text
          </button>
          <button
            id="tab-file"
            className={`input-tab${tab === 'file' ? ' active' : ''}`}
            onClick={() => setTab('file')}
            type="button"
          >
            📁 File
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

      {/* Tab content */}
      {tab === 'text' ? (
        <>
          <div className="textarea-wrapper">
            <textarea
              id="product-textarea"
              className="product-textarea"
              placeholder={"Paste raw product text here — specs, descriptions, catalog snippets…\n\nPress Ctrl+Enter to generate."}
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={handleKeyDown}
              maxLength={2000}
            />
            <span className="char-count">{text.length}/2000</span>
          </div>

          <div className="input-actions">
            <div className="sample-btns">
              {SAMPLES.map((s) => (
                <button
                  key={s.label}
                  id={`sample-btn-${s.label.toLowerCase().replace(' ', '-')}`}
                  className="sample-btn"
                  onClick={() => { setText(s.text); setCategory(s.category) }}
                >
                  {s.label}
                </button>
              ))}
            </div>

            <button
              id="generate-btn"
              className="generate-btn"
              onClick={handleSubmit}
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
      ) : (
        <FileDropZone
          onExtracted={handleFileExtracted}
          category={category}
          apiUrl={apiUrl}
        />
      )}
    </div>
  )
}
