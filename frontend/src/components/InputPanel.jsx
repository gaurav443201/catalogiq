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

// Fallbacks for instant response or offline resilience
const FALLBACK_TEMPLATES = {
  'Ball Valve': [
    'XYZ FlowTech 2" Stainless Steel 316 Ball Valve. Full port, ANSI Class 300 flanged connection with PTFE seals. Max pressure rating 600 WOG, temp range -20°F to 400°F. Certified to ISO 9001 and API 6D. Used in petrochemical and steam processing.',
    'Apollo 1-1/4 inch Brass Ball Valve, female NPT threaded connections. Rated 400 PSI CWP, blowout-proof stem design. Approved for potable water and natural gas shutoff services.',
    'Heavy-duty 4" Carbon Steel WCB Flanged Ball Valve, Class 150. Lever operated with locking device, firesafe certified to API 607. Ideal for oil refinery pipelines.',
  ],
  'Industrial Motor': [
    'Siemens 30kW 3-Phase Squirrel Cage Induction Motor, IE4 Super Premium Efficiency. Frame size 200L, 2950 RPM, 415V/50Hz. Cast iron housing, IP66 enclosure with PTC thermistors. Suitable for continuous duty pump & compressor drives.',
    'ABB 7.5 HP TEFC Severe Duty AC Motor, 1750 RPM, 460V, NEMA Premium efficiency. Class H insulation, inverter ready with roller bearings for heavy belt loads.',
  ],
  'Pump': [
    'Grundfos CR32-4 Multi-Stage Centrifugal Pump, 15 kW motor, flow capacity 32 m³/h at 78m head. 316 Stainless Steel wetted parts, ANSI 2" suction/discharge. For boiler feed and reverse osmosis systems.',
    'KSB MegaCPK End Suction Chemical Process Pump, ductile iron casing with duplex stainless impeller. Handles corrosive slurries up to 180°C at 16 bar.',
  ],
  'Pressure Gauge': [
    'WIKA 232.50 4.5" Dial Industrial Pressure Gauge, 0-1000 PSI range. Stainless steel 316 case and bourdon tube, 1/2" NPT bottom mount. Glycerin liquid filled for vibration resistance, ASME B40.100 Grade 2A accuracy.',
  ],
  'Heat Exchanger': [
    'Alfa Laval T8 Plate Heat Exchanger, titanium plates with EPDM clip-on gaskets. Design pressure 16 bar, temp range -10°C to 150°C. 4-inch flanged ports for seawater cooling duties.',
  ],
  'Bearing': [
    'SKF 22218 EK Spherical Roller Bearing, tapered bore 90mm ID x 160mm OD x 40mm width. C3 internal radial clearance, dynamic load rating 345 kN. Engineered for vibrating screens and heavy mining gearboxes.',
  ],
  'Sensor': [
    'Endress+Hauser Cerabar PMP51 Digital Pressure Transmitter, 4-20mA HART output, piezoresistive measuring cell. 0 to 40 bar span, 316L diaphragm, ATEX Ex ia explosion proof rated for hazardous areas.',
  ],
  'Compressor': [
    'Atlas Copco GA 37+ Rotary Screw Air Compressor, 37 kW (50 HP) oil-injected, delivering 225 CFM at 125 PSI (8.5 bar). Integrated air dryer, Elektronikon touch controller, low noise acoustic canopy.',
  ],
}

export default function InputPanel({ onGenerate, loading, apiUrl }) {
  const [text, setText] = useState('')
  const [category, setCategory] = useState('Ball Valve')
  const [open, setOpen] = useState(false)
  const [tab, setTab] = useState('text') // 'text' | 'file'
  const [sampleLoading, setSampleLoading] = useState(false)
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
    setTab('text')
  }

  // Dynamic AI sample generator on click
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
      // Fallback: pick a random rich template for this category
      const pool = FALLBACK_TEMPLATES[category] || FALLBACK_TEMPLATES['Ball Valve']
      const randomItem = pool[Math.floor(Math.random() * pool.length)]
      setText(randomItem)
    } finally {
      setSampleLoading(false)
    }
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
              placeholder={"Paste raw product text here — specs, descriptions, catalog snippets…\n\nOr click '✨ Generate Sample' below for an AI sample.\nPress Ctrl+Enter to generate."}
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={handleKeyDown}
              maxLength={2000}
            />
            <span className="char-count">{text.length}/2000</span>
          </div>

          <div className="input-actions">
            {/* Single dynamic AI Sample button */}
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
                  Generating Sample…
                </>
              ) : (
                <>
                  <span>🎲</span>
                  Try AI Sample
                </>
              )}
            </button>

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
