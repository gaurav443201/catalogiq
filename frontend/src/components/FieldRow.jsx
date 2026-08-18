import { useState } from 'react'

const SOURCE_CONFIG = {
  input_text: {
    label: 'Confirmed',
    className: 'confirmed',
    icon: '●',
  },
  ai_inferred: {
    label: 'AI Inferred',
    className: 'inferred',
    icon: '◆',
    tooltip: (field, confidence) =>
      `Not directly stated — AI inferred from category norms & domain knowledge. Confidence: ${confidence}%`,
  },
  unknown: {
    label: 'Unknown',
    className: 'unknown',
    icon: '○',
    tooltip: () => 'Could not be determined. Manual review recommended.',
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
  const config = SOURCE_CONFIG[data.source] || SOURCE_CONFIG.unknown
  const isEmpty = !data.value

  const handleCopyValue = () => {
    if (!data.value) return
    navigator.clipboard.writeText(data.value)
    setCopied(true)
    onCopy?.(`Copied "${data.value}"`)
    setTimeout(() => setCopied(false), 1500)
  }

  return (
    <div className="field-row" id={`field-row-${fieldKey}`}>
      <span className="field-label">{FIELD_LABELS[fieldKey] || fieldKey}</span>

      <span
        className={`field-value ${isEmpty ? 'empty' : 'copyable'}`}
        onClick={handleCopyValue}
        title={!isEmpty ? 'Click to copy' : ''}
      >
        {copied ? '✓ Copied!' : isEmpty ? '—' : data.value}
      </span>

      <div className="field-right">
        {data.source !== 'unknown' && (
          <div className="confidence-wrap">
            <div className="confidence-bar">
              <div
                className={`confidence-fill ${config.className}`}
                style={{ width: `${data.confidence}%` }}
              />
            </div>
            <span className="confidence-pct">{data.confidence}%</span>
          </div>
        )}

        <span className={`badge ${config.className}`}>
          {config.icon} {config.label}
        </span>

        {(data.source === 'ai_inferred' || data.source === 'unknown') && (
          <div
            className="tooltip-wrap"
            onMouseEnter={() => setTooltipVisible(true)}
            onMouseLeave={() => setTooltipVisible(false)}
          >
            <div
              className="tooltip-trigger"
              style={
                data.source === 'unknown'
                  ? {
                      background: 'rgba(255,71,87,0.2)',
                      border: '1px solid rgba(255,71,87,0.4)',
                      color: 'var(--unknown)',
                    }
                  : {}
              }
            >
              {data.source === 'unknown' ? '!' : '?'}
            </div>
            {tooltipVisible && (
              <div
                className="tooltip-box"
                style={
                  data.source === 'unknown'
                    ? { borderColor: 'rgba(255,71,87,0.3)' }
                    : {}
                }
              >
                {config.tooltip(fieldKey, data.confidence)}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
