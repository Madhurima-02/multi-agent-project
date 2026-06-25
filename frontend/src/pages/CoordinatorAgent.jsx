import React, { useState, useEffect, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { 
  BrainCircuit, 
  Send, 
  ArrowRight, 
  TrendingUp, 
  Sparkles,
  MapPin,
  CheckCircle,
  HelpCircle,
  Play
} from 'lucide-react'

function CoordinatorAgent() {
  const navigate = useNavigate()
  
  const [roadmap, setRoadmap] = useState(null)
  const [chatMessages, setChatMessages] = useState([
    {
      sender: 'coordinator',
      text: "Hello! I am your AI Placement Coordinator. I keep track of your performance across DSA, Resumes, and Mock Interviews. Ask me anything about your placement readiness or SDE benchmarks!",
      action: null
    }
  ])
  const [inputText, setInputText] = useState('')
  const [isSending, setIsSending] = useState(false)
  const [loading, setLoading] = useState(true)
  
  const chatEndRef = useRef(null)

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) {
      navigate('/login')
      return
    }
    fetchRoadmap()
  }, [navigate])

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [chatMessages])

  const fetchRoadmap = async () => {
    const token = localStorage.getItem('token')
    if (!token) {
      navigate('/login')
      return
    }
    try {
      setLoading(true)
      const res = await fetch('/api/coordinator/roadmap', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (res.status === 401) {
        localStorage.removeItem('token')
        navigate('/login')
        return
      }
      if (res.ok) {
        const data = await res.json()
        setRoadmap(data)
      }
    } catch (err) {
      console.error("Error loading coordinator roadmap:", err)
    } finally {
      setLoading(false)
    }
  }

  const handleSendMessage = async (e) => {
    e.preventDefault()
    if (!inputText.trim() || isSending) return

    const originalMsg = inputText
    setInputText('')
    setIsSending(true)

    // Append candidate message
    const updatedMessages = [
      ...chatMessages,
      { sender: 'candidate', text: originalMsg }
    ]
    setChatMessages(updatedMessages)

    const token = localStorage.getItem('token')
    if (!token) {
      navigate('/login')
      return
    }
    try {
      const res = await fetch('/api/coordinator/chat', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ message: originalMsg })
      })
      if (res.status === 401) {
        localStorage.removeItem('token')
        navigate('/login')
        return
      }

      if (res.ok) {
        const data = await res.json()
        setChatMessages(prev => [
          ...prev,
          { 
            sender: 'coordinator', 
            text: data.reply,
            action: data.suggested_action
          }
        ])
        
        // Refresh roadmap readiness details in case chat completed something
        fetchRoadmap()
      }
    } catch (err) {
      console.error("Coordinator chat failed:", err)
    } finally {
      setIsSending(false)
    }
  }

  const getActionLabel = (path) => {
    if (path === '/resume') return 'Go to Resume Agent'
    if (path === '/dsa') return 'Solve DSA Coding'
    if (path === '/interview') return 'Launch Mock Interview'
    return 'Go to Module'
  }

  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center min-h-[70vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
        <p className="text-slate-400 mt-4 font-medium">Connecting Coordinator Nodes...</p>
      </div>
    )
  }

  const steps = roadmap ? JSON.parse(roadmap.roadmap_steps) : []

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-extrabold text-white tracking-tight flex items-center">
          <BrainCircuit className="h-8 w-8 text-indigo-400 mr-3" />
          AI Coordinator Orchestrator
        </h1>
        <p className="text-slate-400 mt-1 leading-relaxed">
          The central coordinator orchestrates placement milestones, cross-analyzing Resume scores, DSA status, and interview feedback.
        </p>
      </div>

      {/* Main layout divide: Roadmap checklist on left, Chat conversation on right */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
        
        {/* Left: Interactive Progress Roadmap flowchart (5 Cols) */}
        <div className="xl:col-span-5 space-y-6">
          <div className="glass-panel p-6 rounded-3xl relative overflow-hidden">
            <h3 className="font-bold text-slate-200 text-lg flex items-center border-b border-slate-800 pb-4 mb-5">
              <Sparkles className="h-5 w-5 text-indigo-400 mr-2" />
              Customized Preparation Path
            </h3>

            {/* Path flowchart */}
            <div className="relative border-l border-slate-800 ml-4 pl-6 space-y-8">
              {steps.map((step, idx) => (
                <div key={step.id} className="relative">
                  {/* Bullet indicator */}
                  <span className={`absolute -left-[31px] top-1.5 p-1 rounded-full border
                    ${step.status === 'Completed'
                      ? 'bg-emerald-500 text-slate-950 border-emerald-500/20'
                      : step.status === 'In Progress'
                        ? 'bg-indigo-600 text-white border-indigo-500'
                        : 'bg-slate-900 text-slate-500 border-slate-800'
                    }`}
                  >
                    <CheckCircle className="h-3 w-3" />
                  </span>

                  <div>
                    <span className="text-[10px] text-slate-500 uppercase tracking-widest font-bold font-mono">
                      Checkpoint {idx + 1} • {step.agent}
                    </span>
                    <h4 className={`font-semibold text-sm mt-1 
                      ${step.status === 'Completed' ? 'text-slate-500 line-through' : 'text-slate-200'}`}
                    >
                      {step.title}
                    </h4>
                    
                    {step.status === 'In Progress' && (
                      <span className="inline-flex items-center mt-2 px-2.5 py-0.5 rounded-md text-[10px] font-semibold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                        Active Step
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
            
            {/* Overall readiness status inside flowchart */}
            <div className="mt-8 pt-5 border-t border-slate-800 flex justify-between items-center flex-wrap gap-4">
              <div>
                <span className="text-xs text-slate-500 font-bold uppercase tracking-wider">Placement Readiness</span>
                <p className="text-2xl font-black text-slate-200 mt-1">{roadmap?.overall_readiness}%</p>
              </div>
              <div className="flex-1 max-w-[50%] bg-slate-800 h-2 rounded-full overflow-hidden">
                <div 
                  className="bg-indigo-500 h-full transition-all duration-1000 ease-out"
                  style={{ width: `${roadmap?.overall_readiness || 0}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Right: AI Coordinator chat portal (7 Cols) */}
        <div className="xl:col-span-7 flex flex-col bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden h-[70vh]">
          
          {/* Chat header */}
          <div className="bg-slate-950/80 px-6 py-4 border-b border-slate-850 flex items-center justify-between">
            <div className="flex items-center space-x-2.5">
              <div className="p-2 bg-indigo-600/10 rounded-xl border border-indigo-500/20">
                <BrainCircuit className="h-5 w-5 text-indigo-400" />
              </div>
              <div>
                <span className="text-sm font-bold text-slate-200">AI Coordinator System</span>
                <p className="text-[10px] text-slate-500 font-medium">Aggregating DSA, resume scores & interview details</p>
              </div>
            </div>
          </div>

          {/* Messages view list */}
          <div className="flex-1 p-6 overflow-y-auto space-y-4">
            {chatMessages.map((msg, idx) => {
              const isCoordinator = msg.sender === 'coordinator'
              
              return (
                <div key={idx} className={`flex ${isCoordinator ? 'justify-start' : 'justify-end'}`}>
                  <div className={`
                    max-w-[85%] rounded-2xl px-4 py-3.5 text-sm leading-relaxed shadow-sm
                    ${isCoordinator 
                      ? 'bg-slate-950/80 text-slate-200 border border-slate-850 rounded-tl-none' 
                      : 'bg-gradient-to-r from-indigo-600 to-indigo-700 text-white rounded-tr-none'
                    }`}
                  >
                    <div className="text-[10px] text-slate-500 uppercase tracking-widest font-bold mb-1">
                      {isCoordinator ? 'Coordinator Agent' : 'You'}
                    </div>
                    <p className="whitespace-pre-wrap">{msg.text}</p>
                    
                    {/* Render action redirection button if present */}
                    {isCoordinator && msg.action && (
                      <div className="mt-3">
                        <button
                          onClick={() => navigate(msg.action)}
                          className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs flex items-center transition-colors shadow-md shadow-indigo-600/10"
                        >
                          {getActionLabel(msg.action)}
                          <ArrowRight className="h-3.5 w-3.5 ml-1.5" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
            <div ref={chatEndRef} />
          </div>

          {/* Chat prompt form */}
          <form onSubmit={handleSendMessage} className="bg-slate-950/85 p-4 border-t border-slate-850 flex space-x-2">
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Ask: 'Am I ready for Google?', 'What is my resume status?'..."
              disabled={isSending}
              className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
              required
            />
            <button
              type="submit"
              disabled={isSending || !inputText.trim()}
              className="p-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl transition-colors disabled:opacity-50"
            >
              <Send className="h-4 w-4" />
            </button>
          </form>

        </div>

      </div>
    </div>
  )
}

export default CoordinatorAgent
