import { useEffect } from 'react'

export default function Toast({ message, type = 'success', onClose }) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose()
    }, 3000)

    return () => clearTimeout(timer)
  }, [message,onClose])

  if (!message) return null

  const styles = {
    success: 'bg-emerald-600',
    info: 'bg-slate-800',
    error: 'bg-red-600',
  }

  return (
    <div className="fixed right-5 top-5 z-50">
      <div
        className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-white shadow-lg ${styles[type]}`}
      >
        <span>{message}</span>

        <button
          onClick={onClose}
          className="text-white/80 hover:text-white"
        >
          ×
        </button>
      </div>
    </div>
  )
}