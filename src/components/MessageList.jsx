import { useEffect, useRef } from 'react'
import FileMessage from './FileMessage.jsx'

export default function MessageList({ items, currentUserId }) {
  const bottomRef = useRef(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [items.length])

  return (
    <div className="flex-1 space-y-3 overflow-y-auto px-4 py-4 ">
      {items.length === 0 && (
        <p className="mt-10 text-center text-sm text-slate-400">
          No messages yet. Say hello!
        </p>
      )}
      {items.map((item) => {
        const isOwn = item.kind === 'message'
          ? item.sender_id === currentUserId
          : item.uploader_id === currentUserId
        const senderName = item.kind === 'message' ? item.sender_name : item.uploader_name

        return (
          <div key={`${item.kind}-${item.id}`} className={`flex flex-col ${isOwn ? 'items-end' : 'items-start'}`}>
            <span className="mb-0.5 text-xs text-slate-400">{senderName}</span>
            {item.kind === 'message' ? (
              <div
                className={`max-w-xs rounded-2xl px-4 py-2 text-sm sm:max-w-sm ${
                  isOwn ? 'bg-brand-600 text-black' : 'bg-white text-slate-900 ring-1 ring-slate-200'
                }`}
              >
                {item.message_text}
              </div>
            ) : (
              <FileMessage file={item} />
            )}
          </div>
        )
      })}
      <div ref={bottomRef} />
    </div>
  )
}