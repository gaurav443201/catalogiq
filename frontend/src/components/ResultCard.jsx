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

export default function ResultCard({ result }) {
  if (!result) return null
  const counts = countBySource(result)

  return (
    <div className="card result-card" id="result-card">
      <div className="result-header">
        <span className="result-title">
          <span>✦</span>
          Extraction Result
        </span>

        <div className="result-meta">
          {counts.confirmed > 0 && (
            <span className="legend-item">
              <span className="legend-dot confirmed" />
              {counts.confirmed} Confirmed
            </span>
          )}
          {counts.inferred > 0 && (
            <span className="legend-item">
              <span className="legend-dot inferred" />
              {counts.inferred} AI Inferred
            </span>
          )}
          {counts.unknown > 0 && (
            <span className="legend-item">
              <span className="legend-dot unknown" />
              {counts.unknown} Unknown
            </span>
          )}
        </div>
      </div>

      <div className="field-rows">
        {FIELD_KEYS.map((key) =>
          result[key] ? (
            <FieldRow key={key} fieldKey={key} data={result[key]} />
          ) : null
        )}
      </div>
    </div>
  )
}
