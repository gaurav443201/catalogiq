import { useEffect, useState } from 'react'

export default function Toast({ message, type = 'success', onDone }) {
  const [visible, setVisible] = useState(true)

  useEffect(() => {
    const t = setTimeout(() => {
      setVisible(false)
      setTimeout(onDone, 300)
    }, 3000)
    return () => clearTimeout(t)
  }, [onDone])

  const icons = { success: '✅', error: '⚠️', info: 'ℹ️' }

  return (
    <div className={`toast toast-${type} ${visible ? 'toast-in' : 'toast-out'}`}>
      <span className="toast-icon">{icons[type]}</span>
      <span className="toast-msg">{message}</span>
    </div>
  )
}
