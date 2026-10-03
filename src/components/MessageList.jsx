import { useEffect, useRef, useState } from 'react'
import FileMessage from './FileMessage.jsx'

export default function MessageList({
  items,
  currentUserId,
  onEditMessage,
  onDeleteMessage,
   onDeleteFile,
}) {
  const bottomRef = useRef(null)

  const [editingId, setEditingId] = useState(null)
  const [editText, setEditText] = useState('')

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [items.length])

  function startEditing(item) {
    setEditingId(item.id)
    setEditText(item.message_text)
  }

  async function saveEdit() {
    const newText = editText.trim()

    if (!newText) return

    const success = await onEditMessage(editingId, newText)

    if (success) {
      setEditingId(null)
      setEditText('')
    }
  }

  function cancelEdit() {
    setEditingId(null)
    setEditText('')
  }

  return (
    <div className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
      {items.length === 0 && (
        <p className="mt-10 text-center text-sm text-slate-400">
          No messages yet. Say hello!
        </p>
      )}

      {items.map((item) => {
        const isOwn =
          item.kind === 'message'
            ? item.sender_id === currentUserId
            : item.uploader_id === currentUserId

        const senderName =
          item.kind === 'message'
            ? item.sender_name
            : item.uploader_name

        return (
          <div
            key={`${item.kind}-${item.id}`}
            className={`flex flex-col ${
              isOwn ? 'items-end' : 'items-start'
            }`}
          >
            <span className="mb-0.5 text-xs text-slate-400">
              {senderName}
            </span>

            {item.kind === 'message' ? (
              <div className="flex flex-col items-end gap-1">
                {editingId === item.id ? (
                  <div className="flex items-center gap-2">
                    <input
                      value={editText}
                      onChange={(e) => setEditText(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          saveEdit()
                        }

                        if (e.key === 'Escape') {
                          cancelEdit()
                        }
                      }}
                      autoFocus
                      className="w-64 rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-blue-500"
                    />

                    <button
                      onClick={saveEdit}
                      className="text-xs font-medium text-green-600 hover:text-green-800"
                    >
                      Save
                    </button>

                    <button
                      onClick={cancelEdit}
                      className="text-xs font-medium text-slate-500 hover:text-slate-700"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <>
                    <div
                      className={`max-w-xs rounded-2xl px-4 py-2 text-sm sm:max-w-sm ${
                        isOwn
                          ? 'bg-brand-600 text-black'
                          : 'bg-white text-slate-900 ring-1 ring-slate-200'
                      }`}
                    >
                      {item.message_text}
                    </div>

                    {isOwn && (
                      <div className="flex gap-2">
                        <button
                          onClick={() => startEditing(item)}
                          className="text-xs text-slate-400 hover:text-blue-600"
                        >
                          Edit
                        </button>

                        <button
                          onClick={() => onDeleteMessage(item.id)}
                          className="text-xs text-slate-400 hover:text-red-600"
                        >
                          Delete
                        </button>
                      </div>
                    )}
                  </>
                )}
              </div>
            ) : (
             <div className="flex flex-col items-end gap-1">
    <FileMessage file={item} />

    {isOwn && (
      <button
        onClick={() => onDeleteFile(item)}
        className="text-xs text-slate-400 hover:text-red-600"
      >
        Delete
      </button>
    )}
  </div>
            )}
          </div>
        )
      })}

      <div ref={bottomRef} />
    </div>
  )
}