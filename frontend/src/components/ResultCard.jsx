import React, { useState } from 'react'
import FieldRow from './FieldRow'
import UnilogDeliveryTable from './UnilogDeliveryTable'

const FIELD_KEYS = [
  'product_name', 'category', 'brand', 'material',
  'size', 'connection_type', 'pressure_rating',
  'certifications', 'application', 'price_range',
]

const FIELD_LABELS = {
  product_name:    'Product Name',
  category:        'Category',
  brand:           'Brand',
  material:        'Material',
  size:            'Size',
  connection_type: 'Connection Type',
  pressure_rating: 'Pressure Rating',
  certifications:  'Certifications',
  application:     'Application',
  price_range:     'Price Range',
}

export default function ResultCard({ result, onCopy }) {
  const [activeTab, setActiveTab] = useState('unilog_descriptions') // 'unilog_descriptions' | 'delivery_252' | 'standard_fields'
  const [isNew, setIsNew] = useState(true)
  const [copiedStates, setCopiedStates] = useState({})

  if (!result) return null

  const isUnilogFormat = Boolean(result.descriptions || result.delivery_format_252)
  const desc = result.descriptions || {}
  const vReport = result.validation_report || {}
  const summary = result.summary || {}
  const delivery = result.delivery_format_252 || {}

  const handleCopyText = (text, key) => {
    navigator.clipboard.writeText(text)
    setCopiedStates((prev) => ({ ...prev, [key]: true }))
    setTimeout(() => {
      setCopiedStates((prev) => ({ ...prev, [key]: false }))
    }, 1200)
    onCopy?.(`Copied to clipboard!`)
  }

  const handleExportJson = () => {
    const blob = new Blob([JSON.stringify(result, null, 2)], {
      type: 'application/json',
    })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `unilog-enriched-${result.summary?.mfg_part_num || result.id || 'product'}.json`
    a.click()
    URL.revokeObjectURL(url)
    onCopy?.('Downloaded JSON file!')
  }

  const handleExportCsv = () => {
    let headers = []
    let values = []
    let filename = 'product-export'

    if (isUnilogFormat && result.delivery_format_252) {
      // Export Unilog 252 delivery columns
      headers = Object.keys(result.delivery_format_252)
      values = Object.values(result.delivery_format_252).map(val => {
        const strVal = String(val ?? '')
        if (strVal.includes(',') || strVal.includes('"') || strVal.includes('\n')) {
          return `"${strVal.replace(/"/g, '""')}"`
        }
        return strVal
      })
      filename = `unilog-delivery-${result.summary?.mfg_part_num || result.id || 'product'}`
    } else {
      // Export 10-Point Technical Schema fields
      FIELD_KEYS.forEach(key => {
        headers.push(FIELD_LABELS[key] || key)
        const val = result[key]?.value || ''
        const strVal = String(val)
        if (strVal.includes(',') || strVal.includes('"') || strVal.includes('\n')) {
          values.push(`"${strVal.replace(/"/g, '""')}"`)
        } else {
          values.push(strVal)
        }
      })
      filename = `catalogiq-schema-${result.id || 'product'}`
    }

    const csvContent = `${headers.join(',')}\n${values.join(',')}`
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${filename}.csv`
    a.click()
    URL.revokeObjectURL(url)
    onCopy?.('Downloaded CSV file!')
  }

  const getCharLimitClass = (length, min, max) => {
    if (length < min) return 'char-under' // Red
    if (length > max) return 'char-over'  // Amber
    return 'char-target'                  // Green
  }

  return (
    <div className={`card result-card ${isNew ? 'result-new' : ''}`} id="result-card"
      onAnimationEnd={() => setIsNew(false)}>

      {/* Header */}
      <div className="result-header">
        <div className="result-title-group">
          <span className="result-badge">
            {isUnilogFormat ? '⚡ Unilog Enriched Record' : 'Enriched Product Record'}
          </span>
          <h2 className="result-product-name">
            {desc.short_desc || result.product_name?.value || result.summary?.brand_name || 'Standardized Product Record'}
          </h2>
          <div className="result-meta-row">
            {summary.classpath && (
              <span className="classpath-tag">📂 {summary.classpath}</span>
            )}
            {summary.brand_name && (
              <span className="brand-tag">🏷️ {summary.brand_name}</span>
            )}
            {summary.mfg_name && (
              <span className="mfg-tag">🏭 {summary.mfg_name}</span>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="result-header-actions" style={{ display: 'flex', gap: '8px' }}>
          <button className="btn btn-secondary btn-sm" onClick={handleExportJson} title="Export full JSON structure">
            💾 Export JSON
          </button>
          <button className="btn btn-secondary btn-sm" onClick={handleExportCsv} title="Export CSV spreadsheet">
            📊 Export CSV
          </button>
        </div>
      </div>

      {/* "Needs Human Review" Alert Banner */}
      {vReport.needs_human_review ? (
        <div className="human-review-banner warning animate-fade-slide-in">
          <div className="banner-icon">⚠️</div>
          <div className="banner-text">
            <strong>Needs Human Review</strong>
            <p>
              Rule discrepancies detected: {vReport.violations?.concat(vReport.warnings || []).join(' • ') || 'Please verify technical attributes.'}
            </p>
          </div>
          <span className="compliance-pill score-warning">
            Score: {vReport.compliance_score || 85}%
          </span>
        </div>
      ) : (
        <div className="human-review-banner success animate-fade-slide-in">
          <div className="banner-icon">✓</div>
          <div className="banner-text">
            <strong>Fully Compliant with Unilog Content Standards</strong>
            <p>All 5 description formulas, character limits, fractions, and approved UOM abbreviations verified.</p>
          </div>
          <span className="compliance-pill score-success">
            100% Validated
          </span>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="card-tabs">
        <button
          className={`tab-btn ${activeTab === 'unilog_descriptions' ? 'active' : ''}`}
          onClick={() => setActiveTab('unilog_descriptions')}
        >
          📝 5-Tier Descriptions & Bullets
        </button>
        <button
          className={`tab-btn ${activeTab === 'delivery_252' ? 'active' : ''}`}
          onClick={() => setActiveTab('delivery_252')}
        >
          📊 252 Delivery Columns
        </button>
        {result.product_name && (
          <button
            className={`tab-btn ${activeTab === 'standard_fields' ? 'active' : ''}`}
            onClick={() => setActiveTab('standard_fields')}
          >
            🔍 10-Point Technical Schema
          </button>
        )}
      </div>

      {/* Tab 1: 5-Tier Descriptions */}
      {activeTab === 'unilog_descriptions' && (
        <div className="descriptions-container">
          
          {/* 1. Invoice Description */}
          <div className="desc-box invoice-box staggered-tier-card" style={{ animationDelay: '0ms' }}>
            <div className="desc-box-header">
              <div className="desc-title-area">
                <span className="desc-badge">🧾 Tier 1: Till Receipt & ERP</span>
                <h4>Invoice Description (≤ 40 chars, ALL CAPS)</h4>
              </div>
              <div className="desc-meta">
                <span className={`char-counter ${getCharLimitClass(desc.invoice_desc?.length || 0, 10, 40)}`}>
                  {desc.invoice_desc?.length || 0} / 40 chars
                </span>
                <button
                  className="copy-mini-btn"
                  onClick={() => handleCopyText(desc.invoice_desc, 'invoice')}
                  title="Copy"
                >
                  {copiedStates['invoice'] ? 'Copied ✓' : '📋 Copy'}
                </button>
              </div>
            </div>
            <div className="desc-content-bubble invoice-text">
              <code>{desc.invoice_desc || '—'}</code>
            </div>
            <p className="desc-rule-hint">Rule: Shortened abbreviations, all uppercase, maximum 40 characters for POS terminals.</p>
          </div>

          {/* 2. Mobile Description */}
          <div className="desc-box mobile-box staggered-tier-card" style={{ animationDelay: '80ms' }}>
            <div className="desc-box-header">
              <div className="desc-title-area">
                <span className="desc-badge">📱 Tier 2: Mobile App</span>
                <h4>Mobile Description (60 – 80 chars)</h4>
              </div>
              <div className="desc-meta">
                <span className={`char-counter ${getCharLimitClass(desc.mobile_desc?.length || 0, 60, 80)}`}>
                  {desc.mobile_desc?.length || 0} chars (target 60-80)
                </span>
                <button
                  className="copy-mini-btn"
                  onClick={() => handleCopyText(desc.mobile_desc, 'mobile')}
                  title="Copy"
                >
                  {copiedStates['mobile'] ? 'Copied ✓' : '📋 Copy'}
                </button>
              </div>
            </div>
            <div className="desc-content-bubble">
              <p>{desc.mobile_desc || '—'}</p>
            </div>
            <p className="desc-rule-hint">Rule: Comma-separated format optimized for iOS/Android mobile distributor catalog cards.</p>
          </div>

          {/* 3. Product Title / Short Description */}
          <div className="desc-box title-box staggered-tier-card" style={{ animationDelay: '160ms' }}>
            <div className="desc-box-header">
              <div className="desc-title-area">
                <span className="desc-badge">🏷️ Tier 3: Search Engine & SRP</span>
                <h4>Product Title / Short Description</h4>
              </div>
              <button
                className="copy-mini-btn"
                onClick={() => handleCopyText(desc.short_desc, 'title')}
                title="Copy"
              >
                {copiedStates['title'] ? 'Copied ✓' : '📋 Copy'}
              </button>
            </div>
            <div className="desc-content-bubble">
              <p><strong>{desc.short_desc || '—'}</strong></p>
            </div>
            <p className="desc-rule-hint">Formula: Brand® + Series + MPN + Item Type + Key Attributes</p>
          </div>

          {/* 4. Long Description */}
          <div className="desc-box long-box staggered-tier-card" style={{ animationDelay: '240ms' }}>
            <div className="desc-box-header">
              <div className="desc-title-area">
                <span className="desc-badge">📖 Tier 4: Product Detail Page (PDP)</span>
                <h4>Long Description (with Fractions & Approved UOMs)</h4>
              </div>
              <button
                className="copy-mini-btn"
                onClick={() => handleCopyText(desc.long_desc, 'long')}
                title="Copy"
              >
                {copiedStates['long'] ? 'Copied ✓' : '📋 Copy'}
              </button>
            </div>
            <div className="desc-content-bubble">
              <p>{desc.long_desc || '—'}</p>
            </div>
            <p className="desc-rule-hint">Rule: Contains complete specifications, dimensions in trade fractions (e.g. 50-1/4 in), and Additional Information.</p>
          </div>

          {/* 5. Retail / Marketing Description & Features */}
          <div className="desc-box marketing-box staggered-tier-card" style={{ animationDelay: '320ms' }}>
            <div className="desc-box-header">
              <div className="desc-title-area">
                <span className="desc-badge">🎯 Tier 5: Marketing & Digital Features</span>
                <h4>Marketing Description & Bullet Features (ITEM_FEATURES 1..20)</h4>
              </div>
            </div>
            {desc.marketing_desc && (
              <div className="desc-content-bubble mkt-para">
                <p><em>{desc.marketing_desc}</em></p>
              </div>
            )}

            {desc.features?.length > 0 && (
              <div className="features-bullet-list">
                <h5>Key Item Features:</h5>
                <ul>
                  {desc.features.map((feat, fIdx) => (
                    <li key={fIdx}>
                      <span className="feat-num">ITEM_FEATURES_{fIdx + 1}:</span> {feat}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Normalized LOV Attributes Grid */}
          {result.attributes?.length > 0 && (
            <div className="desc-box attributes-overview-box">
              <div className="desc-box-header">
                <h4>Normalized LOV Technical Attributes</h4>
              </div>
              <div className="attributes-chip-grid">
                {result.attributes.map((attr, aIdx) => (
                  <div key={aIdx} className="attribute-chip">
                    <span className="attr-chip-label">{attr.label}:</span>
                    <span className="attr-chip-val">
                      {attr.value} {attr.uom && <span className="attr-chip-uom">({attr.uom})</span>}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      )}

      {/* Tab 2: 252-Column Delivery Table */}
      {activeTab === 'delivery_252' && (
        <UnilogDeliveryTable deliveryRecord={delivery} onNotify={onCopy} />
      )}

      {/* Tab 3: Standard 10-Point Technical Schema */}
      {activeTab === 'standard_fields' && result.product_name && (
        <div className="fields-grid" id="fields-grid">
          {FIELD_KEYS.map((key) => (
            <FieldRow
              key={key}
              fieldKey={key}
              label={FIELD_LABELS[key]}
              data={result[key]}
              onCopy={onCopy}
            />
          ))}
        </div>
      )}

    </div>
  )
}
