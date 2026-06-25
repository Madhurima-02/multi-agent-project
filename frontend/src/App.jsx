import React from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import Sidebar from './components/Sidebar'
import Dashboard from './pages/Dashboard'
import ResumeAgent from './pages/ResumeAgent'
import DsaAgent from './pages/DsaAgent'
import InterviewAgent from './pages/InterviewAgent'
import CoordinatorAgent from './pages/CoordinatorAgent'
import Login from "./pages/Login"
import Signup from "./pages/Signup"

// Protected Route Component
function ProtectedRoute({ children }) {
  const token = localStorage.getItem('token')
  if (!token) {
    return <Navigate to="/login" replace />
  }
  return children
}

// Layout wrapper to conditionally show Sidebar and guard routes
function AppLayout() {
  const location = useLocation()
  const isAuthPage = location.pathname === '/login' || location.pathname === '/signup'

  // If on login/signup page, render without Sidebar structure
  if (isAuthPage) {
    return (
      <div className="flex min-h-screen bg-slate-950 text-slate-100 overflow-x-hidden">
        <main className="flex-1 min-h-screen flex flex-col">
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
          </Routes>
        </main>
      </div>
    )
  }

  // Otherwise, render dashboard views protected by authentication
  return (
    <div className="flex min-h-screen bg-slate-950 text-slate-100 overflow-x-hidden">
      {/* Sidebar Component */}
      <Sidebar />

      {/* Main Content Area */}
      <main className="flex-1 lg:pl-64 min-h-screen flex flex-col transition-all duration-300">
        <div className="flex-1 p-6 md:p-8 lg:p-10 max-w-7xl w-full mx-auto">
          <Routes>
            <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/resume" element={<ProtectedRoute><ResumeAgent /></ProtectedRoute>} />
            <Route path="/dsa" element={<ProtectedRoute><DsaAgent /></ProtectedRoute>} />
            <Route path="/interview" element={<ProtectedRoute><InterviewAgent /></ProtectedRoute>} />
            <Route path="/coordinator" element={<ProtectedRoute><CoordinatorAgent /></ProtectedRoute>} />
            {/* Fallback to Dashboard */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </main>
    </div>
  )
}

function App() {
  return (
    <Router>
      <AppLayout />
    </Router>
  )
}

export default App
