import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { supabase } from '../lib/supabase.js'
import { ensureAnonymousSession, storeDisplayName } from '../lib/session.js'
import { generateRoomCode, minutesFromNowISO, EXPIRY_OPTIONS } from '../lib/roomUtils.js'

export default function CreateRoom() {
  const navigate = useNavigate()
  const [displayName, setDisplayName] = useState('')
  const [expiryMinutes, setExpiryMinutes] = useState(60)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleCreate(e) {
    e.preventDefault()
    if (!displayName.trim()) {
      setError('Pick a temporary display name first.')
      return
    }
    setLoading(true)
    setError('')

    try {
      const userId = await ensureAnonymousSession()
// console.log("userId from ensureAnonymousSession:", userId)
//   console.log("Session:", session)
// console.log("Session error:", sessionError)
// console.log("Session user ID:", session?.user?.id)
// console.log("Our userId:", userId)
      // Try a few times in case of a rare room_code collision.
      // let room = null
      // for (let attempt = 0; attempt < 5 && !room; attempt++) {
      //   const roomCode = generateRoomCode()
      //   const { data, error: insertError } = await supabase
      //     .from('rooms')
      //     .insert({
      //       room_code: roomCode,
      //       created_by: userId,
      //       expires_at: minutesFromNowISO(expiryMinutes),
      //       status: 'active',
      //     })
      //     .select()
      //     .single()

      //   if (!insertError) {
      //     room = data
      //   } else if (insertError.code !== '23505') {
      //     // Not a unique-violation on room_code -> real error, stop retrying.
      //     throw insertError
      //   }
      // }


        const roomCode = generateRoomCode()
      const { data: room, error: insertError } = await supabase
            .from('rooms')
            .insert({
             room_code: roomCode,
             created_by: userId,
             expires_at: minutesFromNowISO(expiryMinutes),
             status: 'active',
  })
  .select()
  .single()

  if (insertError) {
  throw insertError
}

      if (!room) throw new Error('Could not generate a free room code. Please try again.')

      const { error: memberError } = await supabase.from('room_members').insert({
        room_id: room.id,
        user_id: userId,
        display_name: displayName.trim(),
      })
      if (memberError) throw memberError

      storeDisplayName(room.room_code, displayName.trim())
      navigate(`/room/${room.room_code}`)
    } catch (err) {
      console.error(err)
      setError(err.message || 'Something went wrong creating the room.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4">
      <form onSubmit={handleCreate} className="w-full max-w-md rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
        <h2 className="text-2xl font-semibold text-slate-900">Create a room</h2>
        <p className="mt-1 text-sm text-slate-500">Set a temporary name and how long the room should last.</p>

        <label className="mt-6 block text-sm font-medium text-slate-700">
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

        <label className="mt-4 block text-sm font-medium text-slate-700">
          Room expires in
          <select
            value={expiryMinutes}
            onChange={(e) => setExpiryMinutes(Number(e.target.value))}
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
          >
            {EXPIRY_OPTIONS.map((opt) => (
              <option key={opt.minutes} value={opt.minutes}>{opt.label}</option>
            ))}
          </select>
        </label>

        {error && <p className="mt-3 text-sm text-red-600">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="mt-6 w-full cursor-pointer rounded-xl bg-indigo-600 px-6 py-3 font-medium text-white shadow-sm transition hover:bg-indigo-700 "
        >
          {loading ? 'Creating…' : 'Create room'}
        </button>

        <Link to="/" className="mt-4 block text-center text-sm text-slate-500 hover:text-slate-700">
          Back
        </Link>
      </form>
    </div>
  )
}