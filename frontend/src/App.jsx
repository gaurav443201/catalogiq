import { useState, useEffect, useCallback } from 'react'
import axios from 'axios'
import InputPanel from './components/InputPanel'
import ResultCard from './components/ResultCard'
import BatchResultTable from './components/BatchResultTable'
import HistoryPanel from './components/HistoryPanel'
import Toast from './components/Toast'

const API_URL =
  import.meta.env.VITE_API_URL ||
  (typeof window !== 'undefined' && window.location.hostname === 'localhost'
    ? 'http://localhost:8000'
    : 'https://d26lomwkk2xl9h.cloudfront.net')

export default function App() {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [batchResult, setBatchResult] = useState(null)
  const [error, setError] = useState(null)
  const [history, setHistory] = useState([])
  const [toasts, setToasts] = useState([])
  const [totalAnalyzed, setTotalAnalyzed] = useState(0)
  const [benchmarkData, setBenchmarkData] = useState(null)
  const [benchmarkLoading, setBenchmarkLoading] = useState(false)
  const [showBenchmarkModal, setShowBenchmarkModal] = useState(false)

  const addToast = useCallback((message, type = 'success') => {
    const id = Date.now()
    setToasts((prev) => [...prev, { id, message, type }])
  }, [])

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const fetchHistory = useCallback(async () => {
    try {
      const res = await axios.get(`${API_URL}/products`)
      setHistory(res.data || [])
      setTotalAnalyzed(res.data?.length || 0)
    } catch {
      // silently fail — history is optional
    }
  }, [])

  useEffect(() => {
    fetchHistory()
  }, [fetchHistory])

  // Single analysis
  const handleGenerate = async (text, category) => {
    setLoading(true)
    setError(null)
    setResult(null)
    setBatchResult(null)

    try {
      const response = await axios.post(`${API_URL}/generate`, {
        raw_text: text,
        category,
      })
      setResult(response.data)
      addToast('Product analyzed and saved successfully!')
      fetchHistory()
    } catch (err) {
      const msg =
        err.response?.data?.detail ||
        'Something went wrong. Check that the backend is running.'
      setError(msg)
      addToast(msg, 'error')
    } finally {
      setLoading(false)
    }
  }

  // Batch analysis
  const handleGenerateBatch = async (items, category) => {
    setLoading(true)
    setError(null)
    setResult(null)
    setBatchResult(null)

    try {
      const response = await axios.post(`${API_URL}/generate-batch`, {
        items,
        category,
      })
      setBatchResult(response.data)
      addToast(`Successfully processed batch of ${response.data.count} products!`)
      fetchHistory()
    } catch (err) {
      const msg =
        err.response?.data?.detail ||
        'Batch extraction failed. Check that backend is running.'
      setError(msg)
      addToast(msg, 'error')
    } finally {
      setLoading(false)
    }
  }

  // Cross-source analysis
  const handleGenerateCrossSource = async (sourceA, sourceB, category) => {
    setLoading(true)
    setError(null)
    setResult(null)
    setBatchResult(null)

    try {
      const response = await axios.post(`${API_URL}/generate-cross-source`, {
        source_a: sourceA,
        source_b: sourceB,
        category,
      })
      setResult(response.data)
      addToast('Cross-source comparison completed!')
      fetchHistory()
    } catch (err) {
      const msg =
        err.response?.data?.detail ||
        'Cross-source analysis failed. Check backend.'
      setError(msg)
      addToast(msg, 'error')
    } finally {
      setLoading(false)
    }
  }

  // Benchmark evaluation runner
  const handleRunBenchmark = async () => {
    setBenchmarkLoading(true)
    setShowBenchmarkModal(true)
    try {
      const res = await axios.get(`${API_URL}/accuracy-benchmark`)
      setBenchmarkData(res.data)
    } catch {
      addToast('Could not fetch benchmark results', 'error')
    } finally {
      setBenchmarkLoading(false)
    }
  }

  const handleHistorySelect = (product) => {
    setResult(product)
    setBatchResult(null)
    setError(null)
    addToast('Loaded from history', 'info')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleClear = () => {
    setResult(null)
    setBatchResult(null)
    setError(null)
  }

  const handleClearHistory = async () => {
    setHistory([])
    setTotalAnalyzed(0)
    addToast('History cleared', 'info')
  }

  return (
    <div className="app">
      {/* Toast stack */}
      <div className="toast-stack">
        {toasts.map((t) => (
          <Toast
            key={t.id}
            message={t.message}
            type={t.type}
            onDone={() => removeToast(t.id)}
          />
        ))}
      </div>

      {/* Header */}
      <header className="header">
        <div className="logo">
          <div className="logo-icon">⚡</div>
          <span className="logo-text">CatalogIQ</span>
        </div>
        <p className="header-subtitle">
          AI-powered product intelligence — transform messy technical specs into structured,
          explainable product data.
        </p>

        <div className="header-stats">
          {totalAnalyzed > 0 && (
            <span className="header-stat">
              <span className="header-stat-num">{totalAnalyzed}</span> products analyzed
            </span>
          )}
          <button
            type="button"
            className="benchmark-pill-btn"
            onClick={handleRunBenchmark}
            title="View verified ground-truth accuracy benchmark"
          >
            🎯 Accuracy Benchmark
          </button>
        </div>

        {/* Hackathon badge */}
        <div className="hackathon-badge">🏆 UniHack 2026</div>
      </header>

      {/* Input Panel with Single, Batch, Cross-Source, and File Drop */}
      <InputPanel
        onGenerate={handleGenerate}
        onGenerateBatch={handleGenerateBatch}
        onGenerateCrossSource={handleGenerateCrossSource}
        loading={loading}
        apiUrl={API_URL}
      />

      {/* Error Banner */}
      {error && (
        <div className="error-banner" id="error-banner">
          ⚠️ {error}
        </div>
      )}

      {/* Single / Cross-Source Result */}
      {result && (
        <>
          <div className="result-toolbar">
            <button
              id="new-analysis-btn"
              className="new-analysis-btn"
              onClick={handleClear}
            >
              ＋ New Analysis
            </button>
          </div>
          <ResultCard result={result} onCopy={(msg) => addToast(msg, 'info')} />
        </>
      )}

      {/* Batch Matrix Table Result */}
      {batchResult && (
        <BatchResultTable
          batchData={batchResult}
          onSelectProduct={(p) => {
            setResult(p)
            window.scrollTo({ top: 400, behavior: 'smooth' })
          }}
          onClearBatch={handleClear}
          onCopy={(msg) => addToast(msg, 'info')}
        />
      )}

      {/* History */}
      {history.length > 0 && (
        <HistoryPanel
          products={history}
          onSelect={handleHistorySelect}
          onClearAll={handleClearHistory}
        />
      )}

      {/* Accuracy Benchmark Modal */}
      {showBenchmarkModal && (
        <div className="modal-backdrop" onClick={() => setShowBenchmarkModal(false)}>
          <div className="card modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>🎯 Golden Test Set Accuracy Benchmark</h3>
              <button
                type="button"
                className="modal-close-btn"
                onClick={() => setShowBenchmarkModal(false)}
              >
                ×
              </button>
            </div>

            {benchmarkLoading ? (
              <div className="modal-loading">
                <div className="spinner" />
                <p>Evaluating verified accuracy across golden test datasets…</p>
              </div>
            ) : benchmarkData ? (
              <div className="benchmark-results">
                <div className="benchmark-score-box">
                  <span className="benchmark-score-num">{benchmarkData.accuracy_percentage}%</span>
                  <span className="benchmark-score-label">
                    Verified Extraction Precision ({benchmarkData.correctly_extracted}/{benchmarkData.total_fields_evaluated} confirmed fields)
                  </span>
                </div>

                <p className="benchmark-desc">
                  Tested against {benchmarkData.evaluation_samples} multi-category golden test standards with ground-truth validation.
                </p>

                <div className="benchmark-details-list">
                  {benchmarkData.details?.map((d, i) => (
                    <div key={i} className="benchmark-item-card">
                      <strong>{d.category} Test Case</strong>
                      <div className="benchmark-fields-grid">
                        {Object.entries(d.fields || {}).map(([fk, fv]) => (
                          <div key={fk} className="benchmark-field-row">
                            <span className="b-field-name">{fk}:</span>
                            <span className={`b-field-status ${fv.is_correct ? 'pass' : 'fail'}`}>
                              {fv.is_correct ? '✓ Match' : 'Mismatch'}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        </div>
      )}
    </div>
  )
}

