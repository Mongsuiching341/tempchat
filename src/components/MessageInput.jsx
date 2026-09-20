import { useRef, useState } from 'react'
import { supabase } from '../lib/supabase.js'
import { ALLOWED_FILE_TYPES, MAX_FILE_SIZE_BYTES } from '../lib/roomUtils.js'

export default function MessageInput({ room, userId, displayName }) {
  const [text, setText] = useState('')
  const [sending, setSending] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [dragOver, setDragOver] = useState(false)
  const [error, setError] = useState('')
  const fileInputRef = useRef(null)

  async function sendMessage(e) {
    e.preventDefault()
    const trimmed = text.trim()
    if (!trimmed || sending) return
    setSending(true)
    setError('')
    try {
      const { error: sendError } = await supabase.from('messages').insert({
        room_id: room.id,
        sender_id: userId,
        sender_name: displayName,
        message_text: trimmed,
        message_type: 'text',
      })
      if (sendError) throw sendError
      setText('')
    } catch (err) {
      console.error(err)
      setError('Message failed to send.')
    } finally {
      setSending(false)
    }
  }

  async function uploadFile(file) {
    if (!file) return
    if (!ALLOWED_FILE_TYPES.includes(file.type)) {
      setError('That file type is not allowed.')
      return
    }
    if (file.size > MAX_FILE_SIZE_BYTES) {
      setError('File is too large (max 10MB).')
      return
    }

    setUploading(true)
    setError('')
    try {
      const path = `${room.id}/${crypto.randomUUID()}-${file.name}`
      const { error: uploadError } = await supabase.storage
        .from('room-files')
        .upload(path, file, { upsert: false })
      if (uploadError) throw uploadError

      const { error: insertError } = await supabase.from('files').insert({
        room_id: room.id,
        uploader_id: userId,
        uploader_name: displayName,
        file_name: file.name,
        storage_path: path,
        file_type: file.type,
        file_size: file.size,
      })
      if (insertError) throw insertError
    } catch (err) {
      console.error(err)
      setError('File upload failed.')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div
      className={`border-t border-slate-200 bg-white p-3 ${dragOver ? 'bg-brand-50' : ''}`}
      onDragOver={(e) => {
        e.preventDefault()
        setDragOver(true)
      }}
      onDragLeave={() => setDragOver(false)}
      onDrop={(e) => {
        e.preventDefault()
        setDragOver(false)
        uploadFile(e.dataTransfer.files?.[0])
      }}
    >
      {error && <p className="mb-2 text-xs text-red-600">{error}</p>}
      <form onSubmit={sendMessage} className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="rounded-lg border border-slate-300 px-3 py-2 text-slate-600 hover:bg-slate-50 disabled:opacity-50"
          title="Attach a file"
        > 
          {uploading ? '↺' : '📎'}
        </button>
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          onChange={(e) => uploadFile(e.target.files?.[0])}
        />
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Type a message… (or drag a file in)"
          className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
        />
        <button
          type="submit"
          disabled={sending || !text.trim()}
          className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
        >
          Send
        </button>
      </form>
    </div>
  )
}