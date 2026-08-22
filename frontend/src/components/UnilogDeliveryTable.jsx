import React, { useState } from 'react'

export default function UnilogDeliveryTable({ deliveryRecord, onNotify }) {
  const [searchTerm, setSearchTerm] = useState('')
  const [activeFilter, setActiveFilter] = useState('all') // 'all' | 'populated' | 'attributes' | 'media'

  if (!deliveryRecord) return null

  // Flatten & extract key-value pairs
  const entries = Object.entries(deliveryRecord)

  const filteredEntries = entries.filter(([key, val]) => {
    const strVal = String(val || '')
    const matchesSearch = key.toLowerCase().includes(searchTerm.toLowerCase()) || strVal.toLowerCase().includes(searchTerm.toLowerCase())
    
    if (!matchesSearch) return false

    if (activeFilter === 'populated') {
      return strVal.trim().length > 0
    }
    if (activeFilter === 'attributes') {
      return key.startsWith('ATTRIBUTE_') && strVal.trim().length > 0
    }
    if (activeFilter === 'media') {
      return (key.includes('Image') || key.includes('Sheet') || key.includes('Manual') || key.includes('Drawing')) && strVal.trim().length > 0
    }
    return true
  })

  const exportDeliveryCsv = () => {
    const headers = ['Column Header', 'Delivery Value']
    const rows = entries.map(([k, v]) => {
      const escapedK = `"${k.replace(/"/g, '""')}"`
      const escapedV = `"${String(v || '').replace(/"/g, '""')}"`
      return `${escapedK},${escapedV}`
    })
    const csv = [headers.join(','), ...rows].join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `Unilog_Delivery_252_${deliveryRecord.SKU || 'Item'}.csv`
    a.click()
    URL.revokeObjectURL(url)
    onNotify?.('Downloaded 252-Column Unilog Delivery CSV!')
  }

  const populatedCount = entries.filter(([_, v]) => String(v || '').trim().length > 0).length

  return (
    <div className="card delivery-card" id="unilog-delivery-section">
      <div className="delivery-card-header">
        <div className="delivery-title-area">
          <span className="unilog-tag">252-Column Delivery Schema</span>
          <h3>Standardized Distributor Delivery Record</h3>
          <p className="delivery-desc">
            Exact structure conforming to <code>Unilog-Sample_200_Items-Input-vs-Output.xlsx</code> ({populatedCount} of {entries.length} fields populated).
          </p>
        </div>

        <div className="delivery-actions">
          <button className="btn btn-primary btn-sm" onClick={exportDeliveryCsv}>
            📥 Export Delivery CSV
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="delivery-toolbar">
        <div className="search-box">
          <span className="search-icon">🔍</span>
          <input
            type="text"
            placeholder="Search all 252 columns & attributes..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input-text-sm"
          />
          {searchTerm && (
            <button className="clear-btn" onClick={() => setSearchTerm('')}>✕</button>
          )}
        </div>

        <div className="filter-pill-group">
          <button
            className={`filter-pill ${activeFilter === 'all' ? 'active' : ''}`}
            onClick={() => setActiveFilter('all')}
          >
            All Columns ({entries.length})
          </button>
          <button
            className={`filter-pill ${activeFilter === 'populated' ? 'active' : ''}`}
            onClick={() => setActiveFilter('populated')}
          >
            Populated Only ({populatedCount})
          </button>
          <button
            className={`filter-pill ${activeFilter === 'attributes' ? 'active' : ''}`}
            onClick={() => setActiveFilter('attributes')}
          >
            LOV Attributes
          </button>
          <button
            className={`filter-pill ${activeFilter === 'media' ? 'active' : ''}`}
            onClick={() => setActiveFilter('media')}
          >
            Digital Assets & Docs
          </button>
        </div>
      </div>

      {/* Table Container */}
      <div className="delivery-table-container">
        <table className="delivery-table">
          <thead>
            <tr>
              <th style={{ width: '35%' }}>Standard Column Header (Delivery Format)</th>
              <th style={{ width: '65%' }}>Value / Enriched Content</th>
            </tr>
          </thead>
          <tbody>
            {filteredEntries.map(([colName, colVal], idx) => {
              const isFilled = String(colVal || '').trim().length > 0
              return (
                <tr key={idx} className={isFilled ? 'row-filled' : 'row-empty'}>
                  <td className="col-name-cell">
                    <code>{colName}</code>
                  </td>
                  <td className="col-val-cell">
                    {isFilled ? (
                      <span className="val-text">{String(colVal)}</span>
                    ) : (
                      <span className="val-empty">— empty —</span>
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
