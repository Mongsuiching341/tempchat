import { useState } from 'react'
import { useNavigate, useParams, Link } from 'react-router-dom'
import { supabase } from '../lib/supabase.js'
import { ensureAnonymousSession, storeDisplayName } from '../lib/session.js'
import { isExpired } from '../lib/roomUtils.js'

export default function JoinRoom() {
  const navigate = useNavigate()
  const { roomCode: routeRoomCode } = useParams()
  const [roomCode, setRoomCode] = useState(routeRoomCode || '')
  const [displayName, setDisplayName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleJoin(e) {
    e.preventDefault()
    const code = roomCode.trim().toUpperCase()
    if (!code) {
      setError('Enter a room code.')
      return
    }
    if (!displayName.trim()) {
      setError('Pick a temporary display name.')
      return
    }

    setLoading(true)
    setError('')
    try {
      const userId = await ensureAnonymousSession()

      const { data: room, error: roomError } = await supabase
        .from('rooms')
        .select('id, room_code, expires_at, status')
        .eq('room_code', code)
        .maybeSingle()

      if (roomError) throw roomError
      if (!room) throw new Error('No room found with that code.')
      if (room.status !== 'active' || isExpired(room.expires_at)) {
        throw new Error('This room has expired.')
      }

      // Upsert so re-joining with the same browser doesn't create duplicate rows.
      const { error: memberError } = await supabase
        .from('room_members')
        .upsert(
          {
            room_id: room.id,
            user_id: userId,
            display_name: displayName.trim(),
            // last_seen: new Date().toISOString(),
          },
          { onConflict: 'room_id,user_id' }
        )
      if (memberError) throw memberError

      storeDisplayName(room.room_code, displayName.trim())
      navigate(`/room/${room.room_code}`)
    } catch (err) {
      console.error(err)
      setError(err.message || 'Could not join that room.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4">
      <form onSubmit={handleJoin} className="w-full max-w-md rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
        <h2 className="text-2xl font-semibold text-slate-900">Join a room</h2>
        <p className="mt-1 text-sm text-slate-500">Enter the room code and pick a temporary name.</p>

        <label className="mt-6 block text-sm font-medium text-slate-700">
          Room code
          <input
            type="text"
            value={roomCode}
            onChange={(e) => setRoomCode(e.target.value)}
            placeholder="e.g. 7K4PQR"
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 uppercase tracking-widest text-slate-900 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
          />
        </label>

        <label className="mt-4 block text-sm font-medium text-slate-700">
          Temporary display name
          <input
            type="text"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            maxLength={32}
            placeholder="e.g. QuietFalcon"
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
          />
        </label>

        {error && <p className="mt-3 text-sm text-red-600">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="mt-6 w-full rounded-xl bg-brand-600 px-6 py-3 font-medium text-black shadow-sm transition hover:bg-brand-700 disabled:opacity-50"
        >
          {loading ? 'Joining…' : 'Join room'}
        </button>

        <Link to="/" className="mt-4 block text-center text-sm text-slate-500 hover:text-slate-700">
          Back
        </Link>
      </form>
    </div>
  )
}