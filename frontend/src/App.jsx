import { useState, useEffect, useCallback } from 'react'
import axios from 'axios'
import InputPanel from './components/InputPanel'
import ResultCard from './components/ResultCard'
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
  const [error, setError] = useState(null)
  const [history, setHistory] = useState([])
  const [toasts, setToasts] = useState([])
  const [totalAnalyzed, setTotalAnalyzed] = useState(0)

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

  const handleGenerate = async (text, category) => {
    setLoading(true)
    setError(null)
    setResult(null)

    try {
      const response = await axios.post(`${API_URL}/generate`, {
        raw_text: text,
        category,
      })
      setResult(response.data)
      addToast('Product analyzed and saved successfully!')
      fetchHistory() // refresh history
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

  const handleHistorySelect = (product) => {
    setResult(product)
    setError(null)
    addToast('Loaded from history', 'info')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleClear = () => {
    setResult(null)
    setError(null)
  }

  const handleClearHistory = async () => {
    // Optimistically clear UI
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
          AI-powered product intelligence — transform messy text into structured,
          explainable product data.
        </p>
        {totalAnalyzed > 0 && (
          <div className="header-stats">
            <span className="header-stat">
              <span className="header-stat-num">{totalAnalyzed}</span> products analyzed
            </span>
          </div>
        )}
        {/* Hackathon badge */}
        <div className="hackathon-badge">🏆 UniHack 2026</div>
      </header>

      {/* Input */}
      <InputPanel onGenerate={handleGenerate} loading={loading} apiUrl={API_URL} />

      {/* Error */}
      {error && (
        <div className="error-banner" id="error-banner">
          ⚠️ {error}
        </div>
      )}

      {/* Result */}
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

      {/* History */}
      {history.length > 0 && (
        <HistoryPanel products={history} onSelect={handleHistorySelect} onClearAll={handleClearHistory} />
      )}
    </div>
  )
}
