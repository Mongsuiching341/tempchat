import { useState } from 'react'
import CountdownTimer from './CountdownTimer.jsx'

export default function RoomHeader({ room, onExpire, memberCount, isOwner, onLeave, onEnd}) {
  const [copied, setCopied] = useState(false)

  function copyLink() {
    const url = `${window.location.origin}/join/${room.room_code}`
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    })
  }

  return (
    <div className="flex items-center justify-between border-b border-slate-200 bg-white px-4 py-3">
      <div>
        <p className="text-sm text-slate-500">Room</p>
        <p className="font-mono text-lg font-semibold tracking-widest text-slate-900">{room.room_code}</p>
      </div>
      <div className="flex items-center gap-3">
        <span className="hidden text-sm text-slate-500 sm:inline">{memberCount} in room</span>
        <CountdownTimer expiresAt={room.expires_at} onExpire={onExpire} />
        <button
          onClick={copyLink}
          className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-50"
        >
          {copied ? 'Copied!' : 'Copy link'}
        </button>
      </div>
      <div className="flex items-center gap-3">
        {/* existing CountdownTimer + Copy link button stay here */}
        {isOwner ? (
          <button
            onClick={onEnd}
            className="rounded-lg border border-red-300 px-3 py-1.5 text-sm text-red-600 hover:bg-red-50"
          >
            End room
          </button>
        ) : (
          <button
            onClick={onLeave}
            className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-50"
          >
            Leave room
          </button>
        )}
      </div>
    </div>
  )
}