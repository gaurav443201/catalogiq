import { useState, useRef, useCallback } from 'react'

const ACCEPTED = {
  'application/pdf': { label: 'PDF', icon: '📄' },
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': { label: 'DOCX', icon: '📝' },
  'image/jpeg': { label: 'JPG', icon: '🖼️' },
  'image/png': { label: 'PNG', icon: '🖼️' },
  'image/webp': { label: 'WEBP', icon: '🖼️' },
}

async function extractPdf(file) {
  const pdfjsLib = await import('pdfjs-dist')
  pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
    'pdfjs-dist/build/pdf.worker.min.mjs',
    import.meta.url
  ).toString()

  const arrayBuffer = await file.arrayBuffer()
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise
  const pages = []
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i)
    const content = await page.getTextContent()
    pages.push(content.items.map((s) => s.str).join(' '))
  }
  return pages.join('\n\n').trim()
}

async function extractDocx(file) {
  const mammoth = await import('mammoth')
  const arrayBuffer = await file.arrayBuffer()
  const result = await mammoth.extractRawText({ arrayBuffer })
  return result.value.trim()
}

async function extractImage(file, category, apiUrl) {
  const formData = new FormData()
  formData.append('file', file)
  formData.append('category', category)
  const res = await fetch(`${apiUrl}/extract-image`, { method: 'POST', body: formData })
  if (!res.ok) throw new Error('Image extraction failed')
  const data = await res.json()
  return data.extracted_text
}

export default function FileDropZone({ onTextExtracted, onExtracted, category, apiUrl }) {
  const [dragging, setDragging] = useState(false)
  const [status, setStatus] = useState('idle') // idle | parsing | done | error
  const [fileName, setFileName] = useState('')
  const [errorMsg, setErrorMsg] = useState('')
  const inputRef = useRef(null)

  const processFile = useCallback(async (file) => {
    const mime = file.type
    if (!ACCEPTED[mime]) {
      setStatus('error')
      setErrorMsg(`Unsupported file type: ${file.name}`)
      return
    }
    setFileName(file.name)
    setStatus('parsing')
    setErrorMsg('')

    try {
      let text = ''
      if (mime === 'application/pdf') {
        text = await extractPdf(file)
      } else if (mime === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
        text = await extractDocx(file)
      } else {
        text = await extractImage(file, category, apiUrl)
      }

      if (!text) throw new Error('No text could be extracted from this file.')
      setStatus('done')
      if (onTextExtracted) {
        onTextExtracted(text)
      } else if (onExtracted) {
        onExtracted(text)
      }
    } catch (e) {
      setStatus('error')
      setErrorMsg(e.message || 'Extraction failed')
    }
  }, [category, apiUrl, onTextExtracted, onExtracted])

  const onDrop = useCallback((e) => {
    e.preventDefault()
    setDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) processFile(file)
  }, [processFile])

  const onFileChange = (e) => {
    const file = e.target.files[0]
    if (file) processFile(file)
  }

  return (
    <div
      className={`drop-zone${dragging ? ' dragging' : ''}${status === 'done' ? ' done' : ''}${status === 'error' ? ' error' : ''}`}
      onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
      onDragLeave={() => setDragging(false)}
      onDrop={onDrop}
      onClick={() => inputRef.current?.click()}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && inputRef.current?.click()}
    >
      <input
        ref={inputRef}
        type="file"
        accept=".pdf,.docx,image/jpeg,image/png,image/webp"
        style={{ display: 'none' }}
        onChange={onFileChange}
      />

      {status === 'idle' && (
        <>
          <div className="drop-zone-icons">
            <span title="PDF">📄</span>
            <span title="DOCX">📝</span>
            <span title="Image">🖼️</span>
          </div>
          <p className="drop-zone-title">
            {dragging ? 'Release to upload' : 'Drag & drop a file here'}
          </p>
          <p className="drop-zone-sub">PDF · DOCX · JPG · PNG · WEBP</p>
          <span className="drop-zone-browse">or browse files</span>
        </>
      )}

      {status === 'parsing' && (
        <>
          <div className="drop-spinner" />
          <p className="drop-zone-title">Extracting text from</p>
          <p className="drop-zone-filename">{fileName}</p>
          <p className="drop-zone-sub">This may take a moment for images…</p>
        </>
      )}

      {status === 'done' && (
        <>
          <span className="drop-success-icon">✅</span>
          <p className="drop-zone-title">Text extracted!</p>
          <p className="drop-zone-filename">{fileName}</p>
          <p className="drop-zone-sub">Switched to text tab — hit Generate ✦</p>
        </>
      )}

      {status === 'error' && (
        <>
          <span className="drop-success-icon">❌</span>
          <p className="drop-zone-title">Extraction failed</p>
          <p className="drop-zone-sub">{errorMsg}</p>
          <span className="drop-zone-browse">Try another file</span>
        </>
      )}
    </div>
  )
}
