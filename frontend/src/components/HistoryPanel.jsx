import { useState } from 'react'

export default function HistoryPanel({ products, onSelect, onClearAll }) {
  const [searchTerm, setSearchTerm] = useState('')
  const [confirmClear, setConfirmClear] = useState(false)

  if (!products || products.length === 0) return null

  const filtered = products.filter((p) => {
    const term = searchTerm.toLowerCase()
    const name = (p.product_name?.value || 'Unnamed Product').toLowerCase()
    const cat = (p.input_category || '').toLowerCase()
    return name.includes(term) || cat.includes(term)
  })

  return (
    <div className="card history-card">
      <div className="history-header">
        <div className="history-header-left">
          <span className="history-title">
            <span>🕒</span> Recent Analyses
          </span>
          <span className="history-count">{products.length} saved</span>
        </div>

        <div className="history-actions">
          {products.length > 3 && (
            <div className="history-search-wrap">
              <input
                type="text"
                placeholder="Search history…"
                className="history-search-input"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              {searchTerm && (
                <button
                  type="button"
                  className="history-search-clear"
                  onClick={() => setSearchTerm('')}
                >
                  ×
                </button>
              )}
            </div>
          )}

          {onClearAll && (
            confirmClear ? (
              <div className="clear-confirm-wrap">
                <span className="clear-confirm-text">Clear all?</span>
                <button
                  type="button"
                  className="action-btn clear-confirm-btn-yes"
                  onClick={() => {
                    onClearAll()
                    setConfirmClear(false)
                  }}
                >
                  Yes
                </button>
                <button
                  type="button"
                  className="action-btn"
                  onClick={() => setConfirmClear(false)}
                >
                  No
                </button>
              </div>
            ) : (
              <button
                type="button"
                className="action-btn history-clear-btn"
                onClick={() => setConfirmClear(true)}
                title="Clear all recent history"
              >
                🗑 Clear
              </button>
            )
          )}
        </div>
      </div>

      <div className="history-list">
        {filtered.length === 0 ? (
          <div className="history-empty">No products matched "{searchTerm}"</div>
        ) : (
          filtered.slice(0, 10).map((p) => {
            const name = p.product_name?.value || 'Unnamed Product'
            const date = p.created_at
              ? new Date(p.created_at).toLocaleTimeString('en-IN', {
                  hour: '2-digit', minute: '2-digit',
                })
              : ''
            const confirmed = Object.values(p).filter(
              (v) => v?.source === 'input_text'
            ).length
            const inferred = Object.values(p).filter(
              (v) => v?.source === 'ai_inferred'
            ).length

            return (
              <button
                key={p.id}
                className="history-item"
                onClick={() => onSelect(p)}
                id={`history-item-${p.id}`}
              >
                <div className="history-item-left">
                  <span className="history-item-name">{name}</span>
                  <span className="history-item-meta">
                    {p.input_category || 'Ball Valve'} · {date}
                  </span>
                </div>
                <div className="history-item-badges">
                  {confirmed > 0 && (
                    <span className="mini-badge confirmed">{confirmed}✓</span>
                  )}
                  {inferred > 0 && (
                    <span className="mini-badge inferred">{inferred}◆</span>
                  )}
                </div>
              </button>
            )
          })
        )}
      </div>
    </div>
  )
}
