import React, { useState, useRef, useEffect } from 'react'
import axios from 'axios'
import FileDropZone from './FileDropZone'

const UNILOG_SAMPLES = [
  {
    title: 'Frigidaire Dishwasher (Ground Truth Item #1)',
    tag: '200 Items Ground Truth',
    mfg_part_num: 'PDSH4816AF',
    part_desc: 'PDSH4816AF Dishwasher SS - Display Only',
    part_manuf: 'Appliance Dealers Cooperative (APPDE)',
    e1_brand: '-- Unbranded --',
    unilog_brand: '-- No Unilog Brand --',
    dib_brand: '-- No DIB Brand --',
    sku: '1515863',
  },
  {
    title: 'Whirlpool Eco Dishwasher (Ground Truth Item #2)',
    tag: '200 Items Ground Truth',
    mfg_part_num: 'WDTS7024RZ',
    part_desc: 'WDTS7024RZ Dishwasher SS - Display Only',
    part_manuf: 'Appliance Dealers Cooperative (APPDE)',
    e1_brand: '-- Unbranded --',
    unilog_brand: '-- No Unilog Brand --',
    dib_brand: '-- No DIB Brand --',
    sku: '1515867',
  },
  {
    title: 'Milwaukee 5" Cut-Off Disc',
    tag: 'Sample 1000 Dataset',
    mfg_part_num: '49-94-0013',
    part_desc: '49-94-0013 Milw 5"x.045"x7/8" Metal Cut Off Disc',
    part_manuf: 'Milwaukee Accessory (4031)',
    e1_brand: '-- Unbranded --',
    unilog_brand: '-- No Unilog Brand --',
    dib_brand: '-- No DIB Brand --',
    sku: '49940013',
  },
  {
    title: 'TimberTech Azek PVC Decking',
    tag: 'Sample 1000 Dataset',
    mfg_part_num: 'ADB15516CS',
    part_desc: '1x6-16\' Coastline Sq Edge - Vintage Azek PVC Decking',
    part_manuf: 'Parksite (6151)',
    e1_brand: 'TIMBERTECH',
    unilog_brand: '-- No Unilog Brand --',
    dib_brand: '-- No DIB Brand --',
    sku: 'ADB15516CS',
  },
  {
    title: 'Mueller Brass 3/8" Fitting',
    tag: 'Fittings LOV Spec',
    mfg_part_num: '3/8 CPLG BRS 150#',
    part_desc: '3/8 CPLG BRS 150# NPT Threaded Coupling',
    part_manuf: 'Mueller Streamline (MUELL)',
    e1_brand: '-- Unbranded --',
    unilog_brand: '-- No Unilog Brand --',
    dib_brand: '-- No DIB Brand --',
    sku: 'CPLG38BRS',
  }
]

const CATEGORIES = [
  { value: 'Built-In Dishwashers', icon: '🍽️' },
  { value: 'Ball Valve',           icon: '🔧' },
  { value: 'Cut-Off Wheels',       icon: '⚙️' },
  { value: 'PVC Decking',          icon: '🪵' },
  { value: 'Pipe Fittings',        icon: '🚰' },
  { value: 'Lighting Fixtures',    icon: '💡' },
  { value: 'Industrial Motor',     icon: '⚡' },
  { value: 'Pump',                 icon: '💧' },
]

export default function InputPanel({
  onGenerate,
  onGenerateBatch,
  onGenerateCrossSource,
  onEnrichUnilog,
  loading,
  apiUrl,
  onOpenBenchmark,
}) {
  const [tab, setTab] = useState('unilog') // 'unilog' | 'text' | 'batch' | 'cross' | 'file'
  
  // Unilog form state
  const [unilogForm, setUnilogForm] = useState({
    mfg_part_num: 'PDSH4816AF',
    part_desc: 'PDSH4816AF Dishwasher SS - Display Only',
    part_manuf: 'Appliance Dealers Cooperative (APPDE)',
    e1_brand: '-- Unbranded --',
    unilog_brand: '-- No Unilog Brand --',
    dib_brand: '-- No DIB Brand --',
    sku: '1515863',
  })

  const [text, setText] = useState('')
  const [batchText, setBatchText] = useState('')
  const [sourceA, setSourceA] = useState('')
  const [sourceB, setSourceB] = useState('')
  const [category, setCategory] = useState('Built-In Dishwashers')
  const [open, setOpen] = useState(false)
  const [sampleLoading, setSampleLoading] = useState(false)
  const [liveSampleLoading, setLiveSampleLoading] = useState(false)
  const dropdownRef = useRef(null)

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

  const handleGenerateAISample = async () => {
    setSampleLoading(true)
    try {
      const res = await axios.get(`${apiUrl}/sample?category=${encodeURIComponent(category)}`)
      if (res.data?.sample_text) {
        setText(res.data.sample_text)
      }
    } catch {
      setText(`Realistic raw catalog entry for ${category} with MPN-XYZ-123. Material: Stainless Steel. Connection: NPT threaded. Rating: 150# ANSI.`)
    } finally {
      setSampleLoading(false)
    }
  }

  const handleGenerateLiveUnilogSample = async () => {
    setLiveSampleLoading(true)
    try {
      const res = await axios.get(`${apiUrl}/unilog-sample-live?category=${encodeURIComponent(category)}`)
      if (res.data) {
        setUnilogForm({
          mfg_part_num: res.data.mfg_part_num || '',
          part_desc: res.data.part_desc || '',
          part_manuf: res.data.part_manuf || '',
          e1_brand: res.data.e1_brand || '-- Unbranded --',
          unilog_brand: res.data.unilog_brand || '-- No Unilog Brand --',
          dib_brand: res.data.dib_brand || '-- No DIB Brand --',
          sku: res.data.sku || '',
          dept: res.data.dept || '',
          item_class: res.data.item_class || '',
          fine: res.data.fine || '',
        })
      }
    } catch {
      setUnilogForm({
        mfg_part_num: 'MPN-AI-SAMPLE',
        part_desc: `AI Generated ${category} standard raw description`,
        part_manuf: 'AI Industrial Supplier',
        e1_brand: '-- Unbranded --',
        unilog_brand: '-- No Unilog Brand --',
        dib_brand: '-- No DIB Brand --',
        sku: '123456',
        dept: 'Industrial',
        item_class: category,
        fine: category,
      })
    } finally {
      setLiveSampleLoading(false)
    }
  }

  const handleLoadUnilogSample = (sample) => {
    setUnilogForm({
      mfg_part_num: sample.mfg_part_num,
      part_desc: sample.part_desc,
      part_manuf: sample.part_manuf,
      e1_brand: sample.e1_brand,
      unilog_brand: sample.unilog_brand,
      dib_brand: sample.dib_brand,
      sku: sample.sku,
    })
  }

  const handleUnilogSubmit = () => {
    if (!unilogForm.part_desc.trim()) return
    onEnrichUnilog?.(unilogForm)
  }

  const handleSingleSubmit = () => {
    if (!text.trim()) return
    onGenerate(text.trim(), category)
  }

  const handleBatchSubmit = () => {
    const items = batchText.split('---').map((s) => s.trim()).filter(Boolean)
    if (items.length === 0) return
    onGenerateBatch(items, category)
  }

  const handleCrossSubmit = () => {
    if (!sourceA.trim() || !sourceB.trim()) return
    onGenerateCrossSource(sourceA.trim(), sourceB.trim(), category)
  }

  return (
    <div className="card input-panel" id="input-panel">
      


      {/* Tabs */}
      <div className="tab-nav">
        <button
          className={`tab-link ${tab === 'unilog' ? 'active' : ''}`}
          onClick={() => setTab('unilog')}
        >
          ⚡ Unilog Enrichment Pipeline
        </button>
        <button
          className={`tab-link ${tab === 'text' ? 'active' : ''}`}
          onClick={() => setTab('text')}
        >
          📝 Raw Text Ingestion
        </button>
        <button
          className={`tab-link ${tab === 'batch' ? 'active' : ''}`}
          onClick={() => setTab('batch')}
        >
          📦 Batch 1,000 Ingestion
        </button>
        <button
          className={`tab-link ${tab === 'cross' ? 'active' : ''}`}
          onClick={() => setTab('cross')}
        >
          ⚖️ Cross-Source Discrepancy
        </button>
        <button
          className={`tab-link ${tab === 'file' ? 'active' : ''}`}
          onClick={() => setTab('file')}
        >
          📄 PDF & Vision
        </button>
      </div>

      {/* TAB 1: UNILOG ENRICHMENT PIPELINE */}
      {tab === 'unilog' && (
        <div className="tab-content">
          <div className="sample-chips-bar">
            <div className="input-panel-header">
              <span className="chips-label">🎯 1-Click Ground Truth Samples:</span>
              <button
                type="button"
                className="ai-sample-btn"
                onClick={handleGenerateLiveUnilogSample}
                disabled={liveSampleLoading}
              >
                {liveSampleLoading ? (
                  <>
                    <span className="spinner-mini"></span> Generating...
                  </>
                ) : (
                  '✨ Generate AI Sample'
                )}
              </button>
            </div>
            <div className="chips-scroll">
              {UNILOG_SAMPLES.map((sample, idx) => (
                <button
                  key={idx}
                  className="sample-pill-btn"
                  onClick={() => handleLoadUnilogSample(sample)}
                  title={`Load ${sample.title}`}
                >
                  <span className="pill-tag">{sample.tag}</span>
                  <span className="pill-name">{sample.mfg_part_num}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="unilog-input-form-grid">
            <div className="form-group full-width">
              <label>Part_Desc (Cryptic Raw Distributor Description) *</label>
              <input
                type="text"
                className="input-text"
                value={unilogForm.part_desc}
                onChange={(e) => setUnilogForm({ ...unilogForm, part_desc: e.target.value })}
                placeholder="e.g. PDSH4816AF Dishwasher SS - Display Only"
              />
            </div>

            <div className="form-group">
              <label>Mfg_Part_Num (MPN)</label>
              <input
                type="text"
                className="input-text"
                value={unilogForm.mfg_part_num}
                onChange={(e) => setUnilogForm({ ...unilogForm, mfg_part_num: e.target.value })}
                placeholder="e.g. PDSH4816AF"
              />
            </div>

            <div className="form-group">
              <label>Part_Manuf (Raw Supplier String)</label>
              <input
                type="text"
                className="input-text"
                value={unilogForm.part_manuf}
                onChange={(e) => setUnilogForm({ ...unilogForm, part_manuf: e.target.value })}
                placeholder="e.g. Appliance Dealers Cooperative (APPDE)"
              />
            </div>

            <div className="form-group">
              <label>Unilog_Brand (Raw / Placeholder)</label>
              <input
                type="text"
                className="input-text"
                value={unilogForm.unilog_brand}
                onChange={(e) => setUnilogForm({ ...unilogForm, unilog_brand: e.target.value })}
                placeholder="e.g. -- No Unilog Brand --"
              />
            </div>

            <div className="form-group">
              <label>DIB_Brand (Raw / Placeholder)</label>
              <input
                type="text"
                className="input-text"
                value={unilogForm.dib_brand}
                onChange={(e) => setUnilogForm({ ...unilogForm, dib_brand: e.target.value })}
                placeholder="e.g. -- No DIB Brand --"
              />
            </div>
          </div>

          <div className="input-footer">
            <div className="pipeline-steps-indicator">
              <span>1. Strip Placeholders</span> → 
              <span>2. UniCat Brand Resolution</span> → 
              <span>3. Fraction/UOM Standard</span> → 
              <span>4. 5-Tier Descriptions</span> → 
              <span>5. 252 Delivery Columns</span>
            </div>

            <button
              className="btn btn-primary"
              onClick={handleUnilogSubmit}
              disabled={loading || !unilogForm.part_desc.trim()}
            >
              {loading ? (
                <>
                  <span className="spinner"></span> Running Pipeline...
                </>
              ) : (
                '🚀 Run Full Unilog Pipeline'
              )}
            </button>
          </div>
        </div>
      )}

      {/* TAB 2: RAW TEXT */}
      {tab === 'text' && (
        <div className="tab-content">
          <div className="form-group">
            <div className="input-panel-header">
              <label>Raw Unstructured Product Text</label>
              <button
                type="button"
                className="ai-sample-btn"
                onClick={handleGenerateAISample}
                disabled={sampleLoading}
              >
                {sampleLoading ? (
                  <>
                    <span className="spinner-mini"></span> Generating...
                  </>
                ) : (
                  '✨ Generate AI Sample'
                )}
              </button>
            </div>
            <textarea
              className="textarea"
              rows={4}
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Paste raw unformatted specifications, datasheets, or product description..."
            />
          </div>

          <div className="input-footer">
            <div className="custom-dropdown" ref={dropdownRef}>
              <button
                type="button"
                className="dropdown-trigger"
                onClick={() => setOpen(!open)}
              >
                <span>{selected.icon}</span>
                <span>{selected.value}</span>
                <span className="arrow">{open ? '▲' : '▼'}</span>
              </button>
              {open && (
                <div className="dropdown-menu">
                  {CATEGORIES.map((c) => (
                    <div
                      key={c.value}
                      className={`dropdown-item ${c.value === category ? 'selected' : ''}`}
                      onClick={() => {
                        setCategory(c.value)
                        setOpen(false)
                      }}
                    >
                      <span>{c.icon}</span>
                      <span>{c.value}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <button
              className="btn btn-primary"
              onClick={handleSingleSubmit}
              disabled={loading || !text.trim()}
            >
              {loading ? (
                <>
                  <span className="spinner"></span> Extracting...
                </>
              ) : (
                'Generate Structured Record'
              )}
            </button>
          </div>
        </div>
      )}

      {/* TAB 3: BATCH */}
      {tab === 'batch' && (
        <div className="tab-content">
          <div className="form-group">
            <label>Batch Items (Separated by ---)</label>
            <textarea
              className="textarea"
              rows={5}
              value={batchText}
              onChange={(e) => setBatchText(e.target.value)}
              placeholder={`Item 1 text...\n---\nItem 2 text...\n---\nItem 3 text...`}
            />
          </div>
          <div className="input-footer">
            <button
              className="btn btn-primary"
              onClick={handleBatchSubmit}
              disabled={loading || !batchText.trim()}
            >
              {loading ? 'Processing Batch...' : 'Process All Items'}
            </button>
          </div>
        </div>
      )}

      {/* TAB 4: CROSS-SOURCE */}
      {tab === 'cross' && (
        <div className="tab-content">
          <div className="cross-source-grid">
            <div className="form-group">
              <label>Source A (Supplier Specsheet)</label>
              <textarea
                className="textarea"
                rows={4}
                value={sourceA}
                onChange={(e) => setSourceA(e.target.value)}
                placeholder="Paste primary specification text..."
              />
            </div>
            <div className="form-group">
              <label>Source B (Distributor / Secondary Catalog)</label>
              <textarea
                className="textarea"
                rows={4}
                value={sourceB}
                onChange={(e) => setSourceB(e.target.value)}
                placeholder="Paste comparison text with possible discrepancies..."
              />
            </div>
          </div>
          <div className="input-footer">
            <button
              className="btn btn-primary"
              onClick={handleCrossSubmit}
              disabled={loading || !sourceA.trim() || !sourceB.trim()}
            >
              {loading ? 'Auditing Sources...' : 'Detect Discrepancies'}
            </button>
          </div>
        </div>
      )}

      {/* TAB 5: FILE DROPZONE */}
      {tab === 'file' && (
        <div className="tab-content">
          <FileDropZone
            onTextExtracted={(extractedText) => {
              setTab('text')
              setText(extractedText)
            }}
            apiUrl={apiUrl}
            category={category}
          />
        </div>
      )}

    </div>
  )
}
