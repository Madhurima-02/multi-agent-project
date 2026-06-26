import React, { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { GraduationCap, Lock, Mail, User, Briefcase, ArrowRight, AlertCircle } from 'lucide-react'

function Signup() {
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [targetRole, setTargetRole] = useState('SDE Placement Target')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
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
    
    if (password !== confirmPassword) {
      setError("Passwords do not match.")
      return
    }

    setLoading(true)

    try {
      // 1. Submit Registration
      const registerRes = await fetch(`${import.meta.env.VITE_API_URL}/api/auth/signup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name, email, password, target_role: targetRole }),
      })

      const registerData = await registerRes.json()

      if (!registerRes.ok) {
        throw new Error(registerData.detail || 'Registration failed. Email might already be in use.')
      }

      // 2. Perform Auto-Login
      const loginRes = await fetch(`${import.meta.env.VITE_API_URL}/api/auth/signup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      })

      const loginData = await loginRes.json()

      if (loginRes.ok) {
        localStorage.setItem('token', loginData.access_token)
        navigate('/')
      } else {
        // Fallback to login screen
        navigate('/login')
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 px-4 py-12 relative overflow-hidden">
      {/* Background Decorative Glow Blobs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-600/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-cyan-600/10 rounded-full blur-[120px] pointer-events-none" />

      <div className="w-full max-w-md z-10">
        {/* Logo Section */}
        <div className="flex flex-col items-center mb-6">
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
          <h2 className="text-2xl font-bold text-slate-100 mb-6">Create Account</h2>

          {error && (
            <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-200 text-sm flex items-start gap-2.5">
              <AlertCircle className="h-5 w-5 shrink-0 text-red-400 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Full Name</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-slate-400">
                  <User className="h-5 w-5" />
                </span>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Alex Developer"
                  className="w-full bg-slate-900/60 border border-slate-800 rounded-xl py-3 pl-11 pr-4 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors duration-200"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Email Address</label>
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
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Placement Target Role</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-slate-400">
                  <Briefcase className="h-5 w-5" />
                </span>
                <select
                  value={targetRole}
                  onChange={(e) => setTargetRole(e.target.value)}
                  className="w-full bg-slate-900/60 border border-slate-800 rounded-xl py-3 pl-11 pr-4 text-sm text-slate-100 focus:outline-none focus:border-indigo-500 transition-colors duration-200 appearance-none cursor-pointer"
                >
                  <option value="SDE Placement Target">SDE Placement Target</option>
                  <option value="Frontend Engineer Target">Frontend Engineer Target</option>
                  <option value="Backend Engineer Target">Backend Engineer Target</option>
                  <option value="Fullstack SDE Target">Fullstack SDE Target</option>
                  <option value="Data Engineer Target">Data Engineer Target</option>
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-slate-400">
                  <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                    <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
                  </svg>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Password</label>
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

            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Confirm Password</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-slate-400">
                  <Lock className="h-5 w-5" />
                </span>
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-slate-900/60 border border-slate-800 rounded-xl py-3 pl-11 pr-4 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors duration-200"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-4 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white rounded-xl py-3 text-sm font-semibold tracking-wider transition-all duration-200 shadow-lg shadow-indigo-600/20 active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center gap-2"
            >
              {loading ? 'Registering...' : 'Sign Up'}
              {!loading && <ArrowRight className="h-4 w-4" />}
            </button>
          </form>

          <div className="mt-6 text-center text-sm text-slate-400 border-t border-slate-800/60 pt-4">
            Already have an account?{' '}
            <Link to="/login" className="text-indigo-400 hover:text-indigo-300 font-medium hover:underline transition-all">
              Sign In
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Signup
