import { useState, useEffect, useCallback, useRef } from 'react'
import axios from 'axios'
import logoImg from './assets/logo.jpg'
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
  const [screen, setScreen] = useState('landing') // 'landing' | 'input' | 'result'
  const [isHistoryOpen, setIsHistoryOpen] = useState(false)
  const [isHistoryItem, setIsHistoryItem] = useState(false)
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
    setIsHistoryItem(false)

    try {
      const response = await axios.post(`${API_URL}/enrich-unilog`, formData)
      setResult(response.data)
      setScreen('result')
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
    setIsHistoryItem(false)

    try {
      const response = await axios.post(`${API_URL}/generate`, {
        raw_text: text,
        category,
      })
      setResult(response.data)
      setScreen('result')
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
    setIsHistoryItem(false)

    try {
      const response = await axios.post(`${API_URL}/generate-batch`, {
        items,
        category,
      })
      setBatchResult(response.data)
      setScreen('result')
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
    setIsHistoryItem(false)

    try {
      const response = await axios.post(`${API_URL}/generate-cross-source`, {
        source_a: sourceA,
        source_b: sourceB,
        category,
      })
      setResult(response.data)
      setScreen('result')
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
    setIsHistoryItem(true)
    setScreen('result')
    addToast('Loaded from history', 'info')
    setTimeout(() => {
      resultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }, 80)
  }

  const handleClear = () => {
    setResult(null)
    setBatchResult(null)
    setError(null)
    setIsHistoryItem(false)
    setScreen('input')
  }

  const handleClearHistory = async () => {
    try {
      await axios.delete(`${API_URL}/products`)
      setHistory([])
      setTotalAnalyzed(0)
      addToast('History cleared successfully', 'info')
    } catch {
      addToast('Failed to clear database history', 'error')
    }
  }

  return (
    <div className={`app-container screen-${screen}`}>
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

      {/* ─── SCREEN 1: LANDING / COVER PAGE ────────────────────────────── */}
      {screen === 'landing' && (
        <div className="landing-cover-screen">
          <div className="landing-bg-drift"></div>
          <div className="landing-content">
            <div className="landing-logo-container">
              <img src={logoImg} className="landing-logo-img animate-logo-glow" alt="CatalogIQ Logo" />
              <h1 className="landing-logo-text">CatalogIQ</h1>
            </div>
            <p className="landing-tagline">
              Enterprise Product Content Enrichment Engine for Industrial Distributors — Built to Unilog Master Content & Delivery Standards.
            </p>
            {totalAnalyzed > 0 && (
              <div className="landing-stats">
                <span className="landing-stat-num">{totalAnalyzed}</span> products analyzed & standardized
              </div>
            )}
            <button className="landing-enter-btn" onClick={() => setScreen('input')}>
              🚀 Launch Pipeline
            </button>
          </div>
        </div>
      )}

      {/* ─── PERSISTENT TOP NAVIGATION BAR (Screen 2 & 3) ────────────────── */}
      {screen !== 'landing' && (
        <nav className="top-nav-bar animate-fade-slide-in">
          <div className="top-nav-container">
            <div className="logo-mini" onClick={() => setScreen('landing')}>
              <img src={logoImg} className="logo-icon-mini-img" alt="Logo" />
              <span className="logo-text-mini">CatalogIQ</span>
            </div>
            
            <div className="top-nav-actions">
              <button className="nav-btn btn-history" onClick={() => setIsHistoryOpen(true)}>
                🕒 History Drawer ({history.length})
              </button>
              {screen === 'result' && (
                <button className="nav-btn btn-new-analysis" onClick={handleClear}>
                  ＋ New Item Analysis
                </button>
              )}
            </div>
          </div>
        </nav>
      )}

      {/* Main content area */}
      {screen !== 'landing' && (
        <main className="app-main-content">
          {/* Error Banner */}
          {error && (
            <div className="error-banner" id="error-banner">
              ⚠️ {error}
            </div>
          )}

          {/* ─── SCREEN 2: PIPELINE INPUT INTERFACE ──────────────────────── */}
          {screen === 'input' && (
            <div className="input-screen-wrapper">
              <div className="screen-header">
                <h2>Product Data Ingestion Workbench</h2>
                <p className="screen-subtitle">Convert unformatted distributor files, nameplate images, or specification sheets into compliant Unilog data structures.</p>
              </div>
              <InputPanel
                onGenerate={handleGenerate}
                onGenerateBatch={handleGenerateBatch}
                onGenerateCrossSource={handleGenerateCrossSource}
                onEnrichUnilog={handleEnrichUnilog}
                loading={loading}
                apiUrl={API_URL}
                onOpenBenchmark={() => setShowBenchmarkModal(true)}
              />
            </div>
          )}

          {/* ─── SCREEN 3: ENRICHED PRODUCT RECORD (RESULT) ───────────────── */}
          {screen === 'result' && (
            <div className="result-screen-wrapper" ref={resultRef}>
              {isHistoryItem && (
                <div className="history-loaded-tag-container animate-fade-slide-in">
                  <span className="history-loaded-tag">📋 Loaded from history</span>
                </div>
              )}

              {/* Single / Cross-Source Result */}
              {result && (
                <ResultCard result={result} onCopy={(msg) => addToast(msg, 'info')} />
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
            </div>
          )}
        </main>
      )}

      {/* ─── SLIDE-IN HISTORY DRAWER (Applies across Screens 2 & 3) ──────── */}
      <div className={`drawer-backdrop ${isHistoryOpen ? 'open' : ''}`} onClick={() => setIsHistoryOpen(false)} />
      <div className={`drawer-container ${isHistoryOpen ? 'open' : ''}`}>
        <div className="drawer-header">
          <h3>🕒 Saved History</h3>
          <button className="drawer-close-btn" onClick={() => setIsHistoryOpen(false)}>×</button>
        </div>
        <div className="drawer-body">
          {history.length > 0 ? (
            <HistoryPanel
              products={history}
              onSelect={(p) => {
                handleHistorySelect(p)
                setIsHistoryOpen(false)
              }}
              onClearAll={handleClearHistory}
            />
          ) : (
            <div className="drawer-empty-state">
              <span className="empty-icon">📁</span>
              <p>No history items found yet.</p>
              <p className="empty-caption">Enrich or analyze a product to populate the history panel.</p>
            </div>
          )}
        </div>
      </div>

      {/* Accuracy Benchmark Evaluation Modal */}
      <BenchmarkEvaluationModal
        isOpen={showBenchmarkModal}
        onClose={() => setShowBenchmarkModal(false)}
        apiUrl={API_URL}
      />
    </div>
  );
}
