import { useState } from 'react'

export default function UserList({
  members,
  userId,
  onNameChange,
}) {
  const [editing, setEditing] = useState(false)
  const [name, setName] = useState('')

  const currentMember = members.find(
    (m) => m.user_id === userId
  )

  function startEditing() {
    setName(currentMember?.display_name || '')
    setEditing(true)
  }

  async function saveName() {
    const newName = name.trim()

    if (!newName) return

    if (newName === currentMember?.display_name) {
      setEditing(false)
      return
    }

    const success = await onNameChange(newName)

    if (success) {
      setEditing(false)
    }
  }

  return (
    <aside className="hidden w-48 shrink-0 border-l border-slate-200 bg-white p-3 md:block">
      <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-400">
        Participants
      </h3>

      <ul className="mt-2 space-y-1.5">
        {members.map((m) => {
          const isCurrentUser = m.user_id === userId

          return (
            <li
              key={m.id}
              className="flex items-center gap-2 text-sm text-slate-700"
            >
              <span
                className={`h-2 w-2 shrink-0 rounded-full ${
                  m.online
                    ? 'bg-green-500'
                    : 'bg-slate-300'
                }`}
                aria-hidden
              />

              <span className="truncate">
                {m.display_name}
              </span>

              {isCurrentUser && !editing && (
                <button
                  onClick={startEditing}
                  className="ml-auto shrink-0 text-xs text-blue-600 hover:text-blue-800"
                >
                  Edit
                </button>
              )}

              {isCurrentUser && editing && (
                <div className="ml-auto flex items-center gap-1">
                  <input
                    value={name}
                    onChange={(e) =>
                      setName(e.target.value)
                    }
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        saveName()
                      }

                      if (e.key === 'Escape') {
                        setEditing(false)
                      }
                    }}
                    autoFocus
                    className="w-20 rounded border border-slate-300 px-1.5 py-1 text-xs outline-none focus:border-blue-500"
                  />

                  <button
                    onClick={saveName}
                    className="text-xs text-green-600 hover:text-green-800"
                  >
                    ✓
                  </button>
                </div>
              )}
            </li>
          )
        })}
      </ul>
    </aside>
  )
}