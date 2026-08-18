import { useState } from 'react'

const SOURCE_CONFIG = {
  input_text: {
    label: 'Confirmed',
    className: 'confirmed',
    icon: '●',
    tooltip: null,
  },
  ai_inferred: {
    label: 'AI Inferred',
    className: 'inferred',
    icon: '◆',
    tooltip: (field, confidence) =>
      `This field was not directly stated in the input. AI inferred it based on category norms and domain knowledge. Confidence: ${confidence}%`,
  },
  unknown: {
    label: 'Unknown',
    className: 'unknown',
    icon: '○',
    tooltip: () => 'Could not be determined from the input. Manual review recommended.',
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

export default function FieldRow({ fieldKey, data }) {
  const [tooltipVisible, setTooltipVisible] = useState(false)
  const config = SOURCE_CONFIG[data.source] || SOURCE_CONFIG.unknown
  const isEmpty = !data.value

  return (
    <div className="field-row" id={`field-row-${fieldKey}`}>
      <span className="field-label">{FIELD_LABELS[fieldKey] || fieldKey}</span>

      <span className={`field-value ${isEmpty ? 'empty' : ''}`}>
        {isEmpty ? '—' : data.value}
      </span>

      <div className="field-right">
        {/* Confidence bar — only for non-unknown */}
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

        {/* Badge */}
        <span className={`badge ${config.className}`}>
          {config.icon} {config.label}
        </span>

        {/* Tooltip trigger for ai_inferred */}
        {data.source === 'ai_inferred' && (
          <div
            className="tooltip-wrap"
            onMouseEnter={() => setTooltipVisible(true)}
            onMouseLeave={() => setTooltipVisible(false)}
          >
            <div className="tooltip-trigger">?</div>
            {tooltipVisible && (
              <div className="tooltip-box">
                {config.tooltip(fieldKey, data.confidence)}
              </div>
            )}
          </div>
        )}

        {/* Tooltip for unknown */}
        {data.source === 'unknown' && (
          <div
            className="tooltip-wrap"
            onMouseEnter={() => setTooltipVisible(true)}
            onMouseLeave={() => setTooltipVisible(false)}
          >
            <div className="tooltip-trigger" style={{
              background: 'rgba(255,71,87,0.2)',
              border: '1px solid rgba(255,71,87,0.4)',
              color: 'var(--unknown)',
            }}>!</div>
            {tooltipVisible && (
              <div className="tooltip-box" style={{ borderColor: 'rgba(255,71,87,0.3)' }}>
                {config.tooltip(fieldKey, data.confidence)}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
