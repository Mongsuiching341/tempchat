export default function UserList({ members }) {
  return (
    <aside className="hidden w-48 shrink-0 border-l border-slate-200 bg-white p-3 md:block">
      <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-400">Participants</h3>
      <ul className="mt-2 space-y-1.5">
        {members.map((m) => (
          <li key={m.id} className="flex items-center gap-2 text-sm text-slate-700">
            <span
              className={`h-2 w-2 rounded-full ${m.online ? 'bg-green-500' : 'bg-slate-300'}`}
              aria-hidden
            />
            <span className="truncate">{m.display_name}</span>
          </li>
        ))}
      </ul>
    </aside>
  )
}