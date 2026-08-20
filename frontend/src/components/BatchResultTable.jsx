import { useState } from 'react'

const FIELD_KEYS = [
  'product_name', 'category', 'brand', 'material',
  'size', 'connection_type', 'pressure_rating',
  'certifications', 'application', 'price_range',
]

const FIELD_LABELS = {
  product_name:    'Product',
  category:        'Category',
  brand:           'Brand',
  material:        'Material',
  size:            'Size',
  connection_type: 'Connection',
  pressure_rating: 'Pressure',
  certifications:  'Certifications',
  application:     'Application',
  price_range:     'Price Range',
}

export default function BatchResultTable({ batchData, onSelectProduct, onClearBatch, onCopy }) {
  const [hoveredCell, setHoveredCell] = useState(null) // { rowIdx, colKey }

  if (!batchData || !batchData.products || batchData.products.length === 0) return null

  const { products } = batchData

  // Summary metrics
  let totalConfirmed = 0
  let totalInferred = 0
  let totalConflicts = 0
  let totalFields = 0

  products.forEach((p) => {
    FIELD_KEYS.forEach((k) => {
      totalFields++
      const src = p[k]?.source
      if (src === 'input_text') totalConfirmed++
      else if (src === 'ai_inferred') totalInferred++
      else if (src === 'conflict') totalConflicts++
    })
  })

  const confirmedPct = Math.round((totalConfirmed / totalFields) * 100) || 0

  const handleExportCsv = () => {
    const headers = ['Product #', ...FIELD_KEYS.map((k) => FIELD_LABELS[k])]
    const rows = products.map((p, idx) => {
      const vals = FIELD_KEYS.map((k) => {
        const val = p[k]?.value || ''
        const src = p[k]?.source || 'unknown'
        const conf = p[k]?.confidence ?? 0
        return `"${val.replace(/"/g, '""')} [${src}, ${conf}%]"`
      })
      return [`"Product ${idx + 1}"`, ...vals].join(',')
    })

    const csvContent = [headers.join(','), ...rows].join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `catalogiq-batch-${products.length}-products.csv`
    a.click()
    URL.revokeObjectURL(url)
    onCopy?.(`Exported ${products.length} products to CSV!`)
  }

  const handleExportJson = () => {
    const blob = new Blob([JSON.stringify(products, null, 2)], {
      type: 'application/json',
    })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `catalogiq-batch-${products.length}-products.json`
    a.click()
    URL.revokeObjectURL(url)
    onCopy?.(`Exported ${products.length} products to JSON!`)
  }

  return (
    <div className="card batch-table-card" id="batch-table-container">
      {/* Header */}
      <div className="batch-header">
        <div className="batch-header-left">
          <span className="batch-title">
            <span>📦</span> Batch Intelligence Matrix
          </span>
          <span className="batch-count">{products.length} Products Processed</span>
        </div>

        <div className="batch-actions">
          <button
            type="button"
            className="action-btn"
            onClick={handleExportCsv}
            title="Export all rows to CSV spreadsheet"
          >
            📊 Export CSV
          </button>
          <button
            type="button"
            className="action-btn action-btn-primary"
            onClick={handleExportJson}
            title="Export all rows to structured JSON"
          >
            ↓ Export JSON
          </button>
          {onClearBatch && (
            <button
              type="button"
              className="action-btn"
              onClick={onClearBatch}
              title="Clear batch results"
            >
              × Clear
            </button>
          )}
        </div>
      </div>

      {/* Summary stats strip */}
      <div className="stats-strip batch-stats">
        <div className="stat-item">
          <span className="stat-dot confirmed" />
          <span className="stat-label">{totalConfirmed} Confirmed ({confirmedPct}%)</span>
        </div>
        <div className="stat-divider" />
        <div className="stat-item">
          <span className="stat-dot inferred" />
          <span className="stat-label">{totalInferred} Inferred</span>
        </div>
        {totalConflicts > 0 && (
          <>
            <div className="stat-divider" />
            <div className="stat-item">
              <span className="stat-dot conflict" />
              <span className="stat-label" style={{ color: 'var(--conflict)', fontWeight: 600 }}>
                ▲ {totalConflicts} Conflict{totalConflicts > 1 ? 's' : ''}
              </span>
            </div>
          </>
        )}
      </div>

      {/* Table */}
      <div className="batch-table-scroll">
        <table className="batch-table">
          <thead>
            <tr>
              <th style={{ width: '40px' }}>#</th>
              {FIELD_KEYS.map((k) => (
                <th key={k}>{FIELD_LABELS[k]}</th>
              ))}
              <th style={{ width: '70px', textAlign: 'center' }}>Inspect</th>
            </tr>
          </thead>
          <tbody>
            {products.map((prod, rowIdx) => (
              <tr key={prod.id || rowIdx} className="batch-row">
                <td className="batch-index">{rowIdx + 1}</td>

                {FIELD_KEYS.map((k) => {
                  const field = prod[k] || { value: '', source: 'unknown', confidence: 0 }
                  const val = field.value || '—'
                  const src = field.source || 'unknown'
                  const isHovered =
                    hoveredCell?.rowIdx === rowIdx && hoveredCell?.colKey === k

                  return (
                    <td
                      key={k}
                      className={`batch-cell ${src}`}
                      onMouseEnter={() => setHoveredCell({ rowIdx, colKey: k })}
                      onMouseLeave={() => setHoveredCell(null)}
                    >
                      <div className="batch-cell-content">
                        <span className={`cell-dot ${src}`} />
                        <span className="cell-value" title={val}>
                          {val}
                        </span>
                        {src !== 'unknown' && (
                          <span className="cell-conf">{field.confidence}%</span>
                        )}
                      </div>

                      {/* Cell tooltip on hover */}
                      {isHovered && (
                        <div className={`batch-cell-tooltip ${src}`}>
                          <div className="tooltip-title">
                            <strong>{FIELD_LABELS[k]}:</strong> {val}
                          </div>
                          <div className="tooltip-meta">
                            Source: <em>{src}</em> · Confidence: {field.confidence}%
                          </div>
                          {field.reasoning && (
                            <div className="tooltip-reasoning">{field.reasoning}</div>
                          )}
                        </div>
                      )}
                    </td>
                  )
                })}

                <td style={{ textAlign: 'center' }}>
                  <button
                    type="button"
                    className="batch-inspect-btn"
                    onClick={() => onSelectProduct?.(prod)}
                    title="View full detail card for this product"
                  >
                    ✦ View
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
