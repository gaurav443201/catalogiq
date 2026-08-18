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

export default function HistoryPanel({ products, onSelect }) {
  if (!products || products.length === 0) return null

  return (
    <div className="card history-card">
      <div className="history-header">
        <span className="history-title">
          <span>🕒</span> Recent Analyses
        </span>
        <span className="history-count">{products.length} saved</span>
      </div>

      <div className="history-list">
        {products.slice(0, 5).map((p) => {
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
        })}
      </div>
    </div>
  )
}
