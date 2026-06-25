import React, { useState, useEffect } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { 
  LayoutDashboard, 
  FileText, 
  Code2, 
  MessageSquare, 
  BrainCircuit, 
  Menu, 
  X, 
  GraduationCap,
  LogOut
} from 'lucide-react'

function Sidebar() {
  const location = useLocation()
  const navigate = useNavigate()
  const [isOpen, setIsOpen] = useState(false)
  const [user, setUser] = useState({ name: 'Loading...', target_role: 'SDE Placement Target' })

  useEffect(() => {
    const fetchUserProfile = async () => {
      const token = localStorage.getItem('token')
      if (!token) {
        navigate('/login')
        return
      }
      try {
        const res = await fetch('/api/auth/me', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })
        if (res.ok) {
          const data = await res.json()
          setUser(data)
        } else if (res.status === 401) {
          localStorage.removeItem('token')
          navigate('/login')
        }
      } catch (err) {
        console.error("Error loading user profile:", err)
      }
    }
    fetchUserProfile()
  }, [navigate, location.pathname]) // Refresh on path changes to keep sync

  // Navigation Links definition
  const menuItems = [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard },
    { name: 'Resume Agent', path: '/resume', icon: FileText },
    { name: 'DSA Agent', path: '/dsa', icon: Code2 },
    { name: 'Interview Agent', path: '/interview', icon: MessageSquare },
    { name: 'AI Coordinator', path: '/coordinator', icon: BrainCircuit },
  ]

  const toggleSidebar = () => setIsOpen(!isOpen)

  const handleLogout = () => {
    localStorage.removeItem('token')
    navigate('/login')
  }

  return (
    <>
      {/* Mobile Top Header */}
      <header className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 flex items-center justify-between px-6 z-40">
        <div className="flex items-center space-x-2">
          <GraduationCap className="h-6 w-6 text-indigo-400" />
          <span className="font-bold text-lg tracking-wider bg-gradient-to-r from-indigo-400 to-cyan-400 bg-clip-text text-transparent">
            PLACEMENT AI
          </span>
        </div>
        <button 
          onClick={toggleSidebar}
          className="p-2 text-slate-400 hover:text-white rounded-md hover:bg-slate-800 focus:outline-none"
        >
          {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </header>

      {/* Sidebar Drawer Container */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 w-64 bg-slate-900 border-r border-slate-800/80 flex flex-col justify-between
        transform transition-transform duration-300 ease-in-out lg:translate-x-0
        ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        <div className="flex flex-col flex-1 overflow-y-auto">
          {/* Logo Section */}
          <div className="h-20 flex items-center justify-between px-6 border-b border-slate-800/60 shrink-0">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-indigo-600/20 rounded-lg border border-indigo-500/30">
                <GraduationCap className="h-6 w-6 text-indigo-400" />
              </div>
              <span className="font-bold text-lg tracking-wider bg-gradient-to-r from-indigo-400 to-cyan-400 bg-clip-text text-transparent">
                PLACEMENT AI
              </span>
            </div>
            {/* Close button for mobile screen drawer */}
            <button 
              onClick={toggleSidebar}
              className="lg:hidden p-1 text-slate-400 hover:text-white rounded-md"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Navigation Links */}
          <nav className="mt-6 px-4 space-y-1.5 flex-1">
            {menuItems.map((item) => {
              const Icon = item.icon
              const isActive = location.pathname === item.path
              
              return (
                <Link
                  key={item.name}
                  to={item.path}
                  onClick={() => setIsOpen(false)}
                  className={`
                    flex items-center space-x-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 group
                    ${isActive 
                      ? 'bg-gradient-to-r from-indigo-600 to-indigo-700 text-white shadow-md shadow-indigo-600/10 border-l-4 border-indigo-400' 
                      : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'
                    }
                  `}
                >
                  <Icon className={`h-5 w-5 transition-transform duration-200 group-hover:scale-110 ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-indigo-400'}`} />
                  <span>{item.name}</span>
                </Link>
              )
            })}
          </nav>
        </div>

        {/* Footer Active Profile & Logout inside Sidebar */}
        <div className="p-4 border-t border-slate-800/60 flex flex-col gap-3 shrink-0">
          <div className="glass-panel p-3 rounded-2xl border border-slate-800/80 text-center">
            <p className="text-[10px] text-slate-500 uppercase tracking-widest font-semibold">Active Profile</p>
            <p className="text-sm font-semibold text-slate-200 mt-1 truncate">{user.name}</p>
            <span className="inline-flex items-center px-2 py-0.5 mt-1.5 rounded-full text-[9px] font-semibold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 max-w-full truncate">
              {user.target_role || 'SDE Placement Target'}
            </span>
          </div>

          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/20 transition-all duration-200 cursor-pointer active:scale-95"
          >
            <LogOut className="h-4 w-4" />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Overlay to close sidebar on mobile tap */}
      {isOpen && (
        <div 
          onClick={toggleSidebar}
          className="lg:hidden fixed inset-0 z-40 bg-slate-950/80 backdrop-blur-sm"
        />
      )}
      
      {/* Spacer to push content down on mobile screen under floating header */}
      <div className="lg:hidden h-16" />
    </>
  )
}

export default Sidebar
