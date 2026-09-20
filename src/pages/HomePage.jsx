import { Link } from 'react-router-dom'

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4">
      <div className="w-full max-w-md text-center">
        <h1 className="text-4xl font-bold tracking-tight text-slate-900">TempChat</h1>
        <p className="mt-3 text-slate-600">
          Temporary chat rooms for short-term conversations. No accounts, no
          permanent history &mdash; messages and files disappear when the
          room expires.
        </p>

        <div className="mt-8 flex flex-col gap-3">
          <Link
            to="/create"
            className="rounded-xl bg-indigo-600 px-6 py-3 font-medium text-white shadow-sm transition hover:bg-indigo-700"
          >
            Create a room
          </Link>
          <Link
            to="/join"
            className="rounded-xl border border-slate-300 bg-white px-6 py-3 font-medium text-slate-700 shadow-sm transition hover:bg-slate-50"
          >
            Join a room
          </Link>
        </div>

        <p className="mt-8 text-xs text-slate-400">
          Temporary does not mean fully anonymous &mdash; avoid sharing
          sensitive personal information in any room.
        </p>
      </div>
    </div>
  )
}