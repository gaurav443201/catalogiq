import { useState, useEffect } from 'react'

const SOURCE_CONFIG = {
  input_text: {
    label: 'Confirmed',
    className: 'confirmed',
    icon: '●',
    tooltip: (field, confidence, data) =>
      data?.reasoning || `Directly stated in source text or user selection. Confidence: ${confidence}%`,
  },
  ai_inferred: {
    label: 'AI Inferred',
    className: 'inferred',
    icon: '◆',
    tooltip: (field, confidence, data) =>
      data?.reasoning || `Not directly stated — AI inferred from category norms & domain knowledge. Confidence: ${confidence}%`,
  },
  conflict: {
    label: 'Conflict',
    className: 'conflict',
    icon: '▲',
    tooltip: (field, confidence, data) =>
      data?.reasoning || 'Contradictory values detected within source text or across input sources. Manual review required.',
  },
  unknown: {
    label: 'Unknown',
    className: 'unknown',
    icon: '○',
    tooltip: (field, confidence, data) =>
      data?.reasoning || 'Could not be determined from input. Manual engineering review recommended.',
  },
}

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

export default function FieldRow({ fieldKey, data, onCopy }) {
  const [tooltipVisible, setTooltipVisible] = useState(false)
  const [copied, setCopied] = useState(false)
  const [animatedWidth, setAnimatedWidth] = useState(0)

  // Safeguard against missing or undefined data structures
  const safeData = data || {
    value: '',
    source: 'unknown',
    confidence: 0,
    reasoning: 'Field data not populated in this analysis mode.'
  }

  const config = SOURCE_CONFIG[safeData.source] || SOURCE_CONFIG.unknown
  const isEmpty = !safeData.value
  const hasRuleWarning = safeData.validation === 'outside_expected_range'

  // Animate confidence bar from 0 to final target value on mount/update
  useEffect(() => {
    setAnimatedWidth(0)
    const timer = setTimeout(() => {
      setAnimatedWidth(safeData.confidence ?? 0)
    }, 40)
    return () => clearTimeout(timer)
  }, [safeData.confidence, safeData.source])

  const handleCopyValue = () => {
    if (!safeData.value) return
    navigator.clipboard.writeText(safeData.value)
    setCopied(true)
    onCopy?.(`Copied "${safeData.value}"`)
    setTimeout(() => setCopied(false), 1500)
  }

  return (
    <div className={`field-row${safeData.source === 'conflict' ? ' row-conflict' : ''}`} id={`field-row-${fieldKey}`}>
      <span className="field-label">{FIELD_LABELS[fieldKey] || fieldKey}</span>

      <span
        className={`field-value ${isEmpty ? 'empty' : 'copyable'}${safeData.source === 'conflict' ? ' text-conflict' : ''}`}
        onClick={handleCopyValue}
        title={!isEmpty ? 'Click to copy value' : ''}
      >
        {copied ? '✓ Copied!' : isEmpty ? '—' : safeData.value}
      </span>

      <div className="field-right">
        {hasRuleWarning && (
          <span
            className="rule-warning-tag"
            title="Non-AI rule-based sanity check: Value falls outside standard engineering range for this category."
          >
            ⚠️ Rule Check
          </span>
        )}

        {data.source !== 'unknown' && (
          <div className="confidence-wrap" title={`Confidence: ${data.confidence}%`}>
            <div className="confidence-bar">
              <div
                className={`confidence-fill ${config.className}`}
                style={{ width: `${animatedWidth}%` }}
              />
            </div>
            <span className="confidence-pct">{data.confidence}%</span>
          </div>
        )}

        <div
          className="badge-tooltip-wrap"
          onMouseEnter={() => setTooltipVisible(true)}
          onMouseLeave={() => setTooltipVisible(false)}
        >
          <span className={`badge ${config.className}`}>
            {config.icon} {config.label}
          </span>

          {tooltipVisible && (
            <div className={`tooltip-box ${config.className}`}>
              {hasRuleWarning && (
                <div className="tooltip-rule-alert">
                  ⚠️ <strong>Rule Check Alert:</strong> Non-AI validation flagged this value.
                </div>
              )}
              <div>{config.tooltip(fieldKey, data.confidence, data)}</div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}


