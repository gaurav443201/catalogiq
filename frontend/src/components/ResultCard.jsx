import { useState } from 'react'
import FieldRow from './FieldRow'

const FIELD_KEYS = [
  'product_name', 'category', 'brand', 'material',
  'size', 'connection_type', 'pressure_rating',
  'certifications', 'application', 'price_range',
]

function countBySource(result) {
  const counts = { confirmed: 0, inferred: 0, unknown: 0 }
  FIELD_KEYS.forEach((key) => {
    const source = result[key]?.source
    if (source === 'input_text') counts.confirmed++
    else if (source === 'ai_inferred') counts.inferred++
    else counts.unknown++
  })
  return counts
}

export default function ResultCard({ result, onCopy }) {
  const [showRaw, setShowRaw] = useState(false)
  const [isNew, setIsNew] = useState(true)

  if (!result) return null
  const counts = countBySource(result)

  const handleExport = () => {
    const blob = new Blob([JSON.stringify(result, null, 2)], {
      type: 'application/json',
    })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `catalogiq-${result.id?.slice(0, 8) || 'product'}.json`
    a.click()
    URL.revokeObjectURL(url)
    onCopy?.('Downloaded JSON file!')
  }

  const handleCopyAll = () => {
    const text = FIELD_KEYS.map(
      (k) => `${k}: ${result[k]?.value || '—'} (${result[k]?.source}, ${result[k]?.confidence}%)`
    ).join('\n')
    navigator.clipboard.writeText(text)
    onCopy?.('Copied all fields to clipboard!')
  }

  // Confidence score overall
  const avgConf = Math.round(
    FIELD_KEYS.reduce((sum, k) => sum + (result[k]?.confidence || 0), 0) / FIELD_KEYS.length
  )

  return (
    <div className={`card result-card ${isNew ? 'result-new' : ''}`} id="result-card"
      onAnimationEnd={() => setIsNew(false)}>

      {/* Header */}
      <div className="result-header">
        <span className="result-title">
          <span>✦</span> Extraction Result
        </span>
        <div className="result-actions">
          <button
            id="toggle-raw-btn"
            className="action-btn"
            onClick={() => setShowRaw(!showRaw)}
            title="Toggle raw JSON"
          >
            {showRaw ? '📋 Fields' : '{ } JSON'}
          </button>
          <button
            id="copy-all-btn"
            className="action-btn"
            onClick={handleCopyAll}
            title="Copy all fields"
          >
            ⎘ Copy
          </button>
          <button
            id="export-json-btn"
            className="action-btn action-btn-primary"
            onClick={handleExport}
            title="Export as JSON"
          >
            ↓ Export
          </button>
        </div>
      </div>

      {/* Stats strip */}
      <div className="stats-strip">
        <div className="stat-item">
          <span className="stat-dot confirmed" />
          <span className="stat-label">{counts.confirmed} Confirmed</span>
        </div>
        <div className="stat-divider" />
        <div className="stat-item">
          <span className="stat-dot inferred" />
          <span className="stat-label">{counts.inferred} AI Inferred</span>
        </div>
        <div className="stat-divider" />
        <div className="stat-item">
          <span className="stat-dot unknown" />
          <span className="stat-label">{counts.unknown} Unknown</span>
        </div>
        <div className="stat-divider" />
        <div className="stat-item">
          <span className="stat-label" style={{ color: 'var(--accent)' }}>
            ◎ {avgConf}% avg confidence
          </span>
        </div>
      </div>

      {/* Raw JSON view */}
      {showRaw ? (
        <pre className="raw-json">
          {JSON.stringify(
            Object.fromEntries(
              FIELD_KEYS.map((k) => [k, result[k]])
            ),
            null,
            2
          )}
        </pre>
      ) : (
        <div className="field-rows">
          {FIELD_KEYS.map((key) =>
            result[key] ? (
              <FieldRow key={key} fieldKey={key} data={result[key]} onCopy={onCopy} />
            ) : null
          )}
        </div>
      )}

      {/* Footer */}
      <div className="result-footer">
        <span className="result-id">ID: {result.id?.slice(0, 16)}…</span>
        <span className="result-time">
          {result.created_at
            ? new Date(result.created_at).toLocaleString('en-IN')
            : ''}
        </span>
      </div>
    </div>
  )
}
