import { useState, useEffect, useCallback, useRef } from 'react'
import axios from 'axios'
import InputPanel from './components/InputPanel'
import ResultCard from './components/ResultCard'
import BatchResultTable from './components/BatchResultTable'
import HistoryPanel from './components/HistoryPanel'
import Toast from './components/Toast'
import BenchmarkEvaluationModal from './components/BenchmarkEvaluationModal'

const API_URL =
  import.meta.env.VITE_API_URL ||
  (typeof window !== 'undefined' && window.location.hostname === 'localhost'
    ? 'http://localhost:8000'
    : 'https://d26lomwkk2xl9h.cloudfront.net')

export default function App() {
  const resultRef = useRef(null)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [batchResult, setBatchResult] = useState(null)
  const [error, setError] = useState(null)
  const [history, setHistory] = useState([])
  const [toasts, setToasts] = useState([])
  const [totalAnalyzed, setTotalAnalyzed] = useState(0)
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

  // Unilog Enrichment Pipeline
  const handleEnrichUnilog = async (formData) => {
    setLoading(true)
    setError(null)
    setResult(null)
    setBatchResult(null)

    try {
      const response = await axios.post(`${API_URL}/enrich-unilog`, formData)
      setResult(response.data)
      addToast('Product successfully enriched into 5 descriptions & 252 delivery columns!')
      setTimeout(() => {
        resultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }, 100)
    } catch (err) {
      const msg =
        err.response?.data?.detail ||
        'Unilog enrichment failed. Check backend connection.'
      setError(msg)
      addToast(msg, 'error')
    } finally {
      setLoading(false)
    }
  }

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
      setTimeout(() => {
        resultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }, 100)
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
      setTimeout(() => {
        resultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }, 100)
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

  const handleHistorySelect = (product) => {
    setResult(product)
    setBatchResult(null)
    setError(null)
    addToast('Loaded from history', 'info')
    setTimeout(() => {
      resultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }, 80)
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
          Enterprise Product Content Enrichment Engine for Industrial Distributors — Built to Unilog Master Content & Delivery Standards.
        </p>

        <div className="header-stats">
          <button
            className="btn btn-outline-light btn-sm"
            onClick={() => setShowBenchmarkModal(true)}
          >
            🏆 Evaluator Accuracy Scorecard
          </button>
          {totalAnalyzed > 0 && (
            <span className="header-stat">
              <span className="header-stat-num">{totalAnalyzed}</span> products analyzed
            </span>
          )}
        </div>
      </header>

      {/* Input Panel with Unilog Pipeline, Single, Batch, Cross-Source, and File Drop */}
      <InputPanel
        onGenerate={handleGenerate}
        onGenerateBatch={handleGenerateBatch}
        onGenerateCrossSource={handleGenerateCrossSource}
        onEnrichUnilog={handleEnrichUnilog}
        loading={loading}
        apiUrl={API_URL}
        onOpenBenchmark={() => setShowBenchmarkModal(true)}
      />

      {/* Error Banner */}
      {error && (
        <div className="error-banner" id="error-banner">
          ⚠️ {error}
        </div>
      )}

      {/* Result Card (5-Tier Descriptions + 252 Delivery Schema + 10-Point Technical Specs) */}
      {result && (
        <div ref={resultRef}>
          <div className="result-toolbar">
            <button
              id="new-analysis-btn"
              className="new-analysis-btn"
              onClick={handleClear}
            >
              ＋ New Item Analysis
            </button>
          </div>
          <ResultCard result={result} onCopy={(msg) => addToast(msg, 'info')} />
        </div>
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

      {/* Accuracy Benchmark Evaluation Modal */}
      <BenchmarkEvaluationModal
        isOpen={showBenchmarkModal}
        onClose={() => setShowBenchmarkModal(false)}
        apiUrl={API_URL}
      />
    </div>
  )
}
