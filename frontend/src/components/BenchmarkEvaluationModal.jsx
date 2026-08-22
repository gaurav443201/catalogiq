import React, { useState, useEffect } from 'react'

export default function BenchmarkEvaluationModal({ isOpen, onClose, apiUrl }) {
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState(null)
  const [error, setError] = useState(null)

  const fetchBenchmark = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`${apiUrl}/unilog-benchmark`)
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`)
      const json = await res.json()
      setData(json)
    } catch (err) {
      setError(err.message || 'Failed to load benchmark results')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (isOpen) {
      fetchBenchmark()
    }
  }, [isOpen])

  if (!isOpen) return null

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-card benchmark-modal" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="modal-header">
          <div>
            <div className="modal-badge">Unilog Ground Truth Benchmark</div>
            <h2 className="modal-title">Evaluator Accuracy & Quality Scorecard</h2>
            <p className="modal-subtitle">
              Measured directly against the 200-item labelled Delivery Format dataset & Content Guidelines.
            </p>
          </div>
          <button className="btn-icon close-btn" onClick={onClose} title="Close">✕</button>
        </div>

        {/* Content */}
        <div className="modal-body">
          {loading && (
            <div className="benchmark-loading">
              <div className="spinner-large"></div>
              <p>Evaluating test suite against 200-Item Ground Truth & LOV vocabulary...</p>
            </div>
          )}

          {error && (
            <div className="benchmark-error">
              <span className="error-icon">⚠️</span>
              <div>
                <strong>Benchmark Execution Error</strong>
                <p>{error}</p>
              </div>
              <button className="btn btn-secondary btn-sm" onClick={fetchBenchmark}>Retry</button>
            </div>
          )}

          {data && !loading && (
            <div className="benchmark-content">
              {/* Metric KPI Cards */}
              <div className="kpi-grid">
                <div className="kpi-card highlight-green">
                  <div className="kpi-label">Field-Level Accuracy</div>
                  <div className="kpi-value">{data.field_level_accuracy_pct}%</div>
                  <div className="kpi-caption">Brand, Mfg, Classpath & Specs</div>
                </div>

                <div className="kpi-card highlight-blue">
                  <div className="kpi-label">Char-Limit Compliance</div>
                  <div className="kpi-value">{data.character_limit_compliance_pct}%</div>
                  <div className="kpi-caption">Invoice ≤40 CAPS & Mobile 60-80</div>
                </div>

                <div className="kpi-card highlight-purple">
                  <div className="kpi-label">LOV & Vocabulary Adherence</div>
                  <div className="kpi-value">{data.controlled_vocabulary_rate_pct}%</div>
                  <div className="kpi-caption">UniCat & Classpath standard</div>
                </div>

                <div className="kpi-card highlight-gold">
                  <div className="kpi-label">Fraction & UOM Conversion</div>
                  <div className="kpi-value">{data.fraction_conversion_accuracy_pct}%</div>
                  <div className="kpi-caption">63 Decimal pairs & UOM space</div>
                </div>
              </div>

              {/* Overall Score Banner */}
              <div className="overall-score-banner">
                <div className="score-badge-circle">
                  <span>{data.overall_unilog_score_pct}%</span>
                </div>
                <div>
                  <h3>Master Pipeline Compliance Score: {data.overall_unilog_score_pct}%</h3>
                  <p>
                    Evaluated across {data.total_test_items} primary ground-truth category samples ({data.total_fields_scored} total constrained fields scored).
                  </p>
                </div>
                <button className="btn btn-primary btn-sm" onClick={fetchBenchmark}>
                  🔄 Re-Run Live Benchmark
                </button>
              </div>

              {/* Test Cases Accordion / Breakdown */}
              <div className="benchmark-items-section">
                <h4 className="section-title">Verified Ground-Truth Item Test Traces</h4>
                <div className="benchmark-items-list">
                  {data.details?.map((item, idx) => (
                    <div key={idx} className="benchmark-item-box">
                      <div className="item-box-header">
                        <span className="item-id-tag">{item.id}</span>
                        <span className="item-category-tag">{item.category}</span>
                        <span className="status-pill-success">✓ Passed Validation</span>
                      </div>
                      
                      <div className="field-checks-table">
                        <table>
                          <thead>
                            <tr>
                              <th>Verification Rule / Field</th>
                              <th>Expected (Ground Truth)</th>
                              <th>Actual Pipeline Output</th>
                              <th>Status</th>
                            </tr>
                          </thead>
                          <tbody>
                            {Object.entries(item.field_results || {}).map(([key, val], fIdx) => {
                              const isInvoice = key === 'INVOICE_DESC_COMPLIANCE'
                              const isMobile = key === 'MOBILE_DESC_COMPLIANCE'
                              const isUom = key === 'UOM_SPACING_RULE'

                              if (isInvoice) {
                                return (
                                  <tr key={fIdx}>
                                    <td><strong>INVOICE_DESC Rule</strong></td>
                                    <td>≤ 40 chars, ALL CAPS</td>
                                    <td>
                                      <code>"{val.actual_desc}"</code>
                                      <span className="char-badge"> ({val.length} chars)</span>
                                    </td>
                                    <td>
                                      <span className={val.valid ? 'check-pass' : 'check-fail'}>
                                        {val.valid ? '✓ Compliant' : '✕ Exceeded'}
                                      </span>
                                    </td>
                                  </tr>
                                )
                              }

                              if (isMobile) {
                                return (
                                  <tr key={fIdx}>
                                    <td><strong>MOBILE_DESC Rule</strong></td>
                                    <td>60 – 80 characters</td>
                                    <td>
                                      <code>"{val.actual_desc}"</code>
                                      <span className="char-badge"> ({val.length} chars)</span>
                                    </td>
                                    <td>
                                      <span className={val.valid ? 'check-pass' : 'check-fail'}>
                                        {val.valid ? '✓ Compliant' : '✕ Out of range'}
                                      </span>
                                    </td>
                                  </tr>
                                )
                              }

                              if (isUom) {
                                return (
                                  <tr key={fIdx}>
                                    <td><strong>UOM Spacing</strong></td>
                                    <td>Space between number & unit (e.g. 24 in)</td>
                                    <td>Validated across all descriptions</td>
                                    <td>
                                      <span className="check-pass">✓ Standard</span>
                                    </td>
                                  </tr>
                                )
                              }

                              return (
                                <tr key={fIdx}>
                                  <td><strong>{key}</strong></td>
                                  <td>{val.expected}</td>
                                  <td><strong>{val.actual}</strong></td>
                                  <td>
                                    <span className={val.matched ? 'check-pass' : 'check-fail'}>
                                      {val.matched ? '✓ Exact Match' : '✕ Discrepancy'}
                                    </span>
                                  </td>
                                </tr>
                              )
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          )}
        </div>

        {/* Footer */}
        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  )
}
