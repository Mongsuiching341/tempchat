import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { supabase } from '../lib/supabase.js'
import { ensureAnonymousSession, getStoredDisplayName,storeDisplayName } from '../lib/session.js'
import { isExpired } from '../lib/roomUtils.js'
import RoomHeader from '../components/RoomHeader.jsx'
import MessageList from '../components/MessageList.jsx'
import MessageInput from '../components/MessageInput.jsx'
import RoomExpired from '../components/RoomExpired.jsx'
import UserList from '../components/UserList.jsx'
import Toast from '../components/Toast.jsx'

export default function ChatRoom() {
  const { roomCode } = useParams()
  const navigate = useNavigate()

  const [endedByOwner, setEndedByOwner] = useState(false)
const [ending, setEnding] = useState(false)
  const [userId, setUserId] = useState(null)
  const [room, setRoom] = useState(null)
  const [items, setItems] = useState([]) // merged messages + files, sorted by created_at
  const [members, setMembers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [expired, setExpired] = useState(false)
  const [toast, setToast] = useState('')
const isOwner = !!(room && userId && room.created_by === userId)

  const channelRef = useRef(null)
  const lifecycleChannelRef = useRef(null)

  const displayName = useMemo(() => getStoredDisplayName(roomCode), [roomCode])

  useEffect(() => {
    let cancelled = false

    async function bootstrap() {
      try {
        const uid = await ensureAnonymousSession()
        if (cancelled) return
        setUserId(uid)

        const { data: roomRow, error: roomError } = await supabase
          .from('rooms')
          .select('id, room_code, created_by, expires_at, status, created_at')
          .eq('room_code', roomCode)
          .maybeSingle()

        if (roomError) throw roomError
        if (!roomRow) {
          setError('Room not found.')
          setLoading(false)
          return
        }
        if (roomRow.status !== 'active' || isExpired(roomRow.expires_at)) {
          setExpired(true)
          setLoading(false)
          return
        }
        if (cancelled) return
        setRoom(roomRow)

        // If we've never joined (e.g. opened link fresh with no stored name), send to Join screen.
        if (!displayName) {
          navigate(`/join/${roomCode}`)
          return
        }

        const [{ data: msgs, error: msgErr }, { data: files, error: fileErr }, { data: mems, error: memErr }] =
          await Promise.all([
            supabase.from('messages').select('*').eq('room_id', roomRow.id).order('created_at'),
            supabase.from('files').select('*').eq('room_id', roomRow.id).order('created_at'),
            supabase.from('room_members').select('*').eq('room_id', roomRow.id).order('created_at'),
          ])
        if (msgErr) throw msgErr
        if (fileErr) throw fileErr
        if (memErr) throw memErr
        if (cancelled) return

        const merged = mergeItems(msgs || [], files || [])
        setItems(merged)
        setMembers(mems || [])
        setLoading(false)

        subscribeRealtime(roomRow.id)
        // subscribePresence(roomRow.id, uid)
      } catch (err) {
        console.error(err)
        if (!cancelled) {
          setError(err.message || 'Failed to load room.')
          setLoading(false)
        }
      }
    }

    bootstrap()

    return () => {
      cancelled = true
      if (channelRef.current) supabase.removeChannel(channelRef.current)
      
      if (lifecycleChannelRef.current) supabase.removeChannel(lifecycleChannelRef.current)
      // if (presenceChannelRef.current) supabase.removeChannel(presenceChannelRef.current)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomCode])


  function subscribeRealtime(roomId) {
    const channel = supabase
      .channel(`room-${roomId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages', filter: `room_id=eq.${roomId}` },
        (payload) =>{console.log('REALTIME MESSAGE RECEIVED:', payload)
          setItems((prev) => mergeItems([payload.new], [], prev))
          
        } 
      ).on(
  'postgres_changes',
  {
    event: 'UPDATE',
    schema: 'public',
    table: 'messages',
  },
  (payload) => {
    console.log('MESSAGE UPDATED:', payload)

    if (
      String(payload.new.room_id) !== String(roomId)
    ) {
      return
    }

    setItems((prev) =>
      prev.map((item) =>
        item.kind === 'message' &&
        item.id === payload.new.id
          ? {
              ...item,
              ...payload.new,
              message_text: payload.new.message_text,
            }
          : item
      )
    )
  }
).on(
  'postgres_changes',
  {
    event: 'DELETE',
    schema: 'public',
    table: 'messages',
  },
  (payload) => {
    console.log('MESSAGE DELETED:', payload)

    setItems((prev) =>
      prev.filter(
        (item) =>
          !(
            item.kind === 'message' &&
            item.id === payload.old.id
          )
      )
    )
  }
)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'files', filter: `room_id=eq.${roomId}` },
        (payload) => setItems((prev) => mergeItems([], [payload.new], prev))
      )
      .on(
  'postgres_changes',
  {
    event: 'DELETE',
    schema: 'public',
    table: 'files',
  },
  (payload) => {
    console.log('FILE DELETED:', payload)

    setItems((prev) =>
      prev.filter(
        (item) =>
          !(
            item.kind === 'file' &&
            item.id === payload.old.id
          )
      )
    )
  }
)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'room_members', filter: `room_id=eq.${roomId}` },
        (payload) =>{
setMembers((prev) => [...prev, payload.new])
 setToast(`${payload.new.display_name} joined the room`)
        } 
        
      ).on(
  'postgres_changes',
  {
    event: 'UPDATE',
    schema: 'public',
    table: 'room_members',
  },
  (payload) => {
    console.log('MEMBER UPDATED:', payload)

    if (
      String(payload.new.room_id) !== String(roomId)
    ) {
      return
    }

    setMembers((prev) =>
      prev.map((member) =>
        member.id === payload.new.id
          ? {
              ...member,
              ...payload.new,
            }
          : member
      )
    )

   
  }
)
      .on(
  'postgres_changes',
  {
    event: 'DELETE',
    schema: 'public',
    table: 'room_members',
  
  },
  (payload) => {
    console.log('MEMBER LEFT:', payload)

    setMembers((prev) => {
      const leavingMember = prev.find(
        (member) => member.id === payload.old.id
      )

      // Show leave toast
      if (leavingMember) {
        setToast(
          `${leavingMember.display_name || 'Someone'} left the room`
        )
      }

      // Remove member from UserList
      return prev.filter(
        (member) => member.id !== payload.old.id
      )
    })
  }
)

    .subscribe((status) => {
  console.log('Realtime status:', status)
})

const roomLifecycleChannel = supabase
    .channel(`room-lifecycle-${roomId}`)
    .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'rooms', filter: `id=eq.${roomId}` },
      () => setEndedByOwner(true))
    .subscribe((status) => console.log('Realtime status (lifecycle):', status))


    channelRef.current = channel
    lifecycleChannelRef.current = roomLifecycleChannel
  }


  async function handleLeaveRoom() {
  if (!room || !userId) return
  try {
    await supabase.from('room_members').delete().eq('room_id', room.id).eq('user_id', userId)
  } catch (err) {
    console.error(err)
  } finally {
    navigate('/')
  }
}

async function handleEndRoom() {
  if (!room || !userId || ending) return
  const confirmed = window.confirm('End this room for everyone? Messages and files will be deleted permanently.')
  if (!confirmed) return

  setEnding(true)
  try {
    // Storage objects aren't covered by "on delete cascade" — remove them
    // first, then delete the room row (cascades to room_members/messages/files).
    const { data: objects, error: listError } = await supabase.storage
      .from('room-files')
      .list(room.id)
    if (!listError && objects?.length > 0) {
      const paths = objects.map((o) => `${room.id}/${o.name}`)
      await supabase.storage.from('room-files').remove(paths)
    }

    const { error: deleteError } = await supabase.from('rooms').delete().eq('id', room.id)
    if (deleteError) throw deleteError

    navigate('/')
  } catch (err) {
    console.error(err)
    setError(err.message || 'Failed to end the room.')
    setEnding(false)
  }
}

async function handleEditMessage(messageId, newText) {
  const { error } = await supabase
    .from('messages')
    .update({
      message_text: newText,
    })
    .eq('id', messageId)
    .eq('sender_id', userId)

  if (error) {
    console.error('Edit message error:', error)
    setToast('Failed to edit message')
    return false
  }

  setToast('Message edited successfully')

  return true
}

async function handleDeleteMessage(messageId) {
  const { error } = await supabase
    .from('messages')
    .delete()
    .eq('id', messageId)
    .eq('sender_id', userId)

  if (error) {
    console.error('Delete message error:', error)
    setToast('Failed to delete message')
    return
  }

  setToast('Message deleted')
}

async function handleDeleteFile(file) {
  if (!file || !userId) return false

  // Delete from Storage
  const { error: storageError } = await supabase
    .storage
    .from('room-files')
    .remove([file.storage_path])

  if (storageError) {
    console.error('Storage delete error:', storageError)
    setToast('Failed to delete file')
    return false
  }

  // Delete database record
  const { error: dbError } = await supabase
    .from('files')
    .delete()
    .eq('id', file.id)
    .eq('uploader_id', userId)

  if (dbError) {
    console.error('Database delete error:', dbError)
    setToast('Failed to delete file record')
    return false
  }

  setToast('File deleted')
  return true
}

async function handleNameChange(newName) {
  if (!room || !userId) return false

  const { error } = await supabase
    .from('room_members')
    .update({
      display_name: newName,
    })
    .eq('room_id', room.id)
    .eq('user_id', userId)

  if (error) {
    console.error('Name update error:', error)
    setToast('Failed to update name')
    return false
  }

  storeDisplayName(roomCode, newName)

  setToast('Name updated successfully')

  return true
}


  function handleExpire() {
    setExpired(true)
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center text-slate-500">
        Loading room…
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center px-4 text-center">
        <p className="text-slate-700">{error}</p>
        <button onClick={() => navigate('/')} className="mt-4 text-brand-600 underline">
          Back home
        </button>
      </div>
    )
  }

  if (endedByOwner) {
  return (
    <RoomExpired
      title="This room was ended"
      message="The room owner ended this room. Its messages and files have been deleted."
    />
  )
}


  if (expired) {
    return <RoomExpired />
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-full sm:max-w-3xl flex-col">
     <RoomHeader room={room} onExpire={handleExpire} memberCount={members.length} isOwner={isOwner} onLeave={handleLeaveRoom} onEnd={handleEndRoom} />
       <Toast
  message={toast}
  onClose={() => setToast('')}
/>
      <div className="flex flex-1  sm:overflow-hidden">
        <div className="flex flex-1 flex-col">
       <MessageList
  items={items}
  currentUserId={userId}
  onEditMessage={handleEditMessage}
  onDeleteMessage={handleDeleteMessage}
  onDeleteFile={handleDeleteFile}
/>
          <MessageInput room={room} userId={userId} displayName={displayName} />
        </div>
        <UserList
  members={members}
  userId={userId}
  onNameChange={handleNameChange}
/>
      </div>

    </div>
  )
}

function mergeItems(newMessages, newFiles, base = []) {
  const messageItems = newMessages.map((m) => ({ kind: 'message', ...m }))
  const fileItems = newFiles.map((f) => ({ kind: 'file', ...f }))
  const merged = [...base, ...messageItems, ...fileItems]
  const deduped = Array.from(new Map(merged.map((i) => [`${i.kind}-${i.id}`, i])).values())
  deduped.sort((a, b) => new Date(a.created_at) - new Date(b.created_at))
  return deduped
}