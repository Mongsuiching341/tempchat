import { Link } from 'react-router-dom'

export default function RoomExpired({title,message } ) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4 text-center">
      <h2 className="text-2xl font-semibold text-slate-900">{title}</h2>
      <p className="mt-2 max-w-sm text-slate-500">
        {message}
      </p>
      <div className="mt-6 flex gap-3">
        <Link to="/create" className="rounded-xl bg-brand-600 px-5 py-2.5 font-medium text-white hover:bg-brand-700">
          Start a new room
        </Link>
        <Link to="/" className="rounded-xl border border-slate-300 px-5 py-2.5 font-medium text-slate-700 hover:bg-slate-50">
          Home
        </Link>
      </div>
    </div>
  )
}