import { useState } from 'react'
import axios from 'axios'
import InputPanel from './components/InputPanel'
import ResultCard from './components/ResultCard'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

export default function App() {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)

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
    } catch (err) {
      const msg =
        err.response?.data?.detail ||
        'Something went wrong. Check that the backend is running.'
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="app">
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
      </header>

      {/* Input */}
      <InputPanel onGenerate={handleGenerate} loading={loading} />

      {/* Error */}
      {error && (
        <div className="error-banner" id="error-banner">
          ⚠️ {error}
        </div>
      )}

      {/* Result */}
      {result && <ResultCard result={result} />}
    </div>
  )
}
