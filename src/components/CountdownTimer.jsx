import { useEffect, useState } from 'react'
import { formatCountdown, isExpired } from '../lib/roomUtils.js'

export default function CountdownTimer({ expiresAt, onExpire }) {
  const [display, setDisplay] = useState(() => formatCountdown(expiresAt))

  useEffect(() => {
    const interval = setInterval(() => {
      if (isExpired(expiresAt)) {
        setDisplay('00:00:00')
        clearInterval(interval)
        onExpire?.()
        return
      }
      setDisplay(formatCountdown(expiresAt))
    }, 1000)
    return () => clearInterval(interval)
  }, [expiresAt, onExpire])

  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-3 py-1 text-sm font-medium tabular-nums text-slate-700">
      ⏳ {display}
    </span>
  )
}