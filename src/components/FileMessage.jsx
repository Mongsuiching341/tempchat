import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase.js'

const IMAGE_TYPES = ['image/png', 'image/jpeg', 'image/gif', 'image/webp']

export default function FileMessage({ file }) {
  const [url, setUrl] = useState(null)
  const [error, setError] = useState(false)

  useEffect(() => {
    let cancelled = false
    supabase.storage
      .from('room-files')
      .createSignedUrl(file.storage_path, 60 * 10) // valid 10 minutes
      .then(({ data, error: signError }) => {
        if (cancelled) return
        if (signError) {
          setError(true)
          return
        }
        setUrl(data.signedUrl)
      })
    return () => {
      cancelled = true
    }
  }, [file.storage_path])

  const isImage = IMAGE_TYPES.includes(file.file_type)

  if (error) {
    return <p className="text-sm text-red-500">Could not load file (it may have expired).</p>
  }

  return (
    <div className="max-w-xs rounded-lg border border-slate-200 bg-white p-2">
      {isImage && url ? (
        <a href={url} target="_blank" rel="noreferrer">
          <img src={url} alt={file.file_name} className="max-h-56 rounded-md object-cover" />
        </a>
      ) : (
        <a
          href={url || '#'}
          target="_blank"
          rel="noreferrer"
          className="flex items-center gap-2 text-sm text-brand-700 hover:underline"
        >
          📎 {file.file_name}
        </a>
      )}
      <p className="mt-1 text-xs text-slate-400">{formatBytes(file.file_size)}</p>
    </div>
  )
}

function formatBytes(bytes) {
  if (!bytes) return ''
  const units = ['B', 'KB', 'MB', 'GB']
  let value = bytes
  let unitIndex = 0
  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024
    unitIndex++
  }
  return `${value.toFixed(1)} ${units[unitIndex]}`
}