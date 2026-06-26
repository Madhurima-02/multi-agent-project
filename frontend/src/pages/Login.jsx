import React, { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { GraduationCap, Lock, Mail, ArrowRight, AlertCircle, Info } from 'lucide-react'

function Login() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  // Redirect if already logged in
  useEffect(() => {
    const token = localStorage.getItem('token')
    if (token) {
      navigate('/')
    }
  }, [navigate])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.detail || 'Incorrect email or password. Please try again.')
      }

      // Store JWT token
      localStorage.setItem('token', data.access_token)
      
      // Redirect to Dashboard
      navigate('/')
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 px-4 py-12 relative overflow-hidden">
      {/* Background Decorative Glow Blobs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-600/10 rounded-full blur-[120px] animate-pulse-slow pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-cyan-600/10 rounded-full blur-[120px] animate-pulse-slow pointer-events-none" />

      <div className="w-full max-w-md z-10">
        {/* Logo Section */}
        <div className="flex flex-col items-center mb-8">
          <div className="p-4 bg-indigo-600/20 rounded-2xl border border-indigo-500/30 mb-3 shadow-lg shadow-indigo-500/10">
            <GraduationCap className="h-10 w-10 text-indigo-400" />
          </div>
          <h1 className="text-3xl font-extrabold tracking-wider bg-gradient-to-r from-indigo-400 via-indigo-200 to-cyan-400 bg-clip-text text-transparent">
            PLACEMENT AI
          </h1>
          <p className="text-slate-400 text-sm mt-1">Multi-Agent SDE Preparation Portal</p>
        </div>

        {/* Card Panel */}
        <div className="glass-panel p-8 rounded-3xl glow-card">
          <h2 className="text-2xl font-bold text-slate-100 mb-6">Welcome Back</h2>

          {error && (
            <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-200 text-sm flex items-start gap-2.5 animate-pulse-slow">
              <AlertCircle className="h-5 w-5 shrink-0 text-red-400 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Email Address</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-slate-400">
                  <Mail className="h-5 w-5" />
                </span>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="alex@developer.com"
                  className="w-full bg-slate-900/60 border border-slate-800 rounded-xl py-3 pl-11 pr-4 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors duration-200"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Password</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-slate-400">
                  <Lock className="h-5 w-5" />
                </span>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-slate-900/60 border border-slate-800 rounded-xl py-3 pl-11 pr-4 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors duration-200"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white rounded-xl py-3 text-sm font-semibold tracking-wider transition-all duration-200 shadow-lg shadow-indigo-600/20 active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center gap-2"
            >
              {loading ? 'Authenticating...' : 'Sign In'}
              {!loading && <ArrowRight className="h-4 w-4" />}
            </button>
          </form>

          {/* Seed User Assist Box */}
          <div className="mt-6 p-4 rounded-2xl bg-indigo-500/5 border border-indigo-500/10 text-xs text-slate-400">
            <div className="flex items-center gap-2 font-semibold text-indigo-400 mb-1.5">
              <Info className="h-4 w-4" />
              <span>Demo Account Available</span>
            </div>
            <p className="mb-1">Log in to view preloaded resume scans, solved problems, and interviews:</p>
            <div className="grid grid-cols-2 bg-slate-950/40 p-2 rounded-lg border border-slate-900 font-mono mt-1 text-[11px] text-slate-300">
              <div>Email:</div>
              <div className="text-indigo-300">alex@developer.com</div>
              <div>Password:</div>
              <div className="text-indigo-300">password123</div>
            </div>
          </div>

          <div className="mt-8 text-center text-sm text-slate-400 border-t border-slate-800/60 pt-6">
            New here?{' '}
            <Link to="/signup" className="text-indigo-400 hover:text-indigo-300 font-medium hover:underline transition-all">
              Create an Account
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Login
