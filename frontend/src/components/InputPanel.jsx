import { useState } from 'react'

const SAMPLES = [
  {
    label: 'Sample 1',
    text: 'XYZ Industrial 2" Ball Valve. Stainless steel body, suitable for high-pressure industrial applications. NPT threaded connections. Manufactured for use in oil & gas and chemical processing environments.',
  },
  {
    label: 'Sample 2',
    text: 'Brass ball valve, 1 inch, threaded ends. General purpose water and gas shutoff. Rated for residential and light commercial use.',
  },
  {
    label: 'Sample 3',
    text: 'Heavy-duty carbon steel ball valve, flanged connection, 4 inch diameter. Used in high-temperature steam applications. ANSI 300 rated.',
  },
]

export default function InputPanel({ onGenerate, loading }) {
  const [text, setText] = useState('')
  const [category, setCategory] = useState('Ball Valve')

  const handleSubmit = () => {
    if (!text.trim()) return
    onGenerate(text.trim(), category)
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) handleSubmit()
  }

  return (
    <div className="card input-panel">
      <div className="input-panel-header">
        <span className="panel-title">
          <span className="panel-title-icon">📋</span>
          Product Input
        </span>
        <select
          id="category-select"
          className="category-select"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
        >
          <option value="Ball Valve">🔧 Ball Valve</option>
          <option value="Industrial Motor">⚙️ Industrial Motor</option>
        </select>
      </div>

      <div className="textarea-wrapper">
        <textarea
          id="product-textarea"
          className="product-textarea"
          placeholder="Paste raw product text here — specs, descriptions, catalog snippets…&#10;&#10;Press Ctrl+Enter to generate."
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          maxLength={2000}
        />
        <span className="char-count">{text.length}/2000</span>
      </div>

      <div className="input-actions">
        <div className="sample-btns">
          {SAMPLES.map((s) => (
            <button
              key={s.label}
              id={`sample-btn-${s.label.toLowerCase().replace(' ', '-')}`}
              className="sample-btn"
              onClick={() => setText(s.text)}
            >
              {s.label}
            </button>
          ))}
        </div>

        <button
          id="generate-btn"
          className="generate-btn"
          onClick={handleSubmit}
          disabled={loading || !text.trim()}
        >
          {loading ? (
            <>
              <div className="spinner" />
              Analyzing…
            </>
          ) : (
            <>
              <span>✦</span>
              Generate
            </>
          )}
        </button>
      </div>
    </div>
  )
}
