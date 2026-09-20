import { Routes, Route } from 'react-router-dom'
import HomePage from './pages/HomePage.jsx'
import CreateRoom from './pages/CreateRoom.jsx'
import JoinRoom from './pages/JoinRoom.jsx'
import ChatRoom from './pages/ChatRoom.jsx'

export default function App() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/create" element={<CreateRoom />} />
        <Route path="/join" element={<JoinRoom />} />
        <Route path="/join/:roomCode" element={<JoinRoom />} />
        <Route path="/room/:roomCode" element={<ChatRoom />} />
      </Routes>
    </div>
  )
}