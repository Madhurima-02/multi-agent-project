import React, { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { 
  MessageSquare, 
  Send, 
  Award, 
  PlusCircle, 
  HelpCircle, 
  MessageCircle,
  Briefcase,
  BookOpen,
  CheckCircle,
  TrendingUp
} from 'lucide-react'

function InterviewAgent() {
  const navigate = useNavigate()
  const [sessions, setSessions] = useState([])
  const [activeSession, setActiveSession] = useState(null)
  const [messages, setMessages] = useState([])
  const [inputText, setInputText] = useState('')
  const [sessionType, setSessionType] = useState('Technical') // Technical or HR
  const [isStarting, setIsStarting] = useState(false)
  const [isSending, setIsSending] = useState(false)
  const [isConcluding, setIsConcluding] = useState(false)
  const [loading, setLoading] = useState(true)
  
  const chatBottomRef = useRef(null)

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) {
      navigate('/login')
      return
    }
    fetchSessions()
  }, [navigate])

  useEffect(() => {
    // Scroll chat window to bottom on new messages
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const fetchSessions = async () => {
    const token = localStorage.getItem('token')
    if (!token) {
      navigate('/login')
      return
    }
    try {
      setLoading(true)
      const res = await fetch('/api/interview/sessions', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (res.status === 401) {
        localStorage.removeItem('token')
        navigate('/login')
        return
      }
      if (res.ok) {
        const data = await res.json()
        setSessions(data)
        // If there is an active session (in progress), auto-select it
        const active = data.find(s => s.status === 'In Progress')
        if (active) {
          handleSelectSession(active)
        } else if (data.length > 0 && !activeSession) {
          handleSelectSession(data[0])
        }
      }
    } catch (err) {
      console.error("Error loading interview sessions:", err)
    } finally {
      setLoading(false)
    }
  }

  const handleSelectSession = (session) => {
    setActiveSession(session)
    setMessages(JSON.parse(session.messages))
  }

  const handleStartSession = async (e) => {
    e.preventDefault()
    const token = localStorage.getItem('token')
    if (!token) {
      navigate('/login')
      return
    }
    try {
      setIsStarting(true)
      const res = await fetch('/api/interview/session', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ session_type: sessionType })
      })
      if (res.status === 401) {
        localStorage.removeItem('token')
        navigate('/login')
        return
      }
      if (res.ok) {
        const data = await res.json()
        setActiveSession(data)
        setMessages(JSON.parse(data.messages))
        fetchSessions()
      }
    } catch (err) {
      console.error("Error creating session:", err)
    } finally {
      setIsStarting(false)
    }
  }

  const handleSendMessage = async (e) => {
    e.preventDefault()
    if (!inputText.trim() || !activeSession || isSending) return

    const token = localStorage.getItem('token')
    if (!token) {
      navigate('/login')
      return
    }

    const originalText = inputText
    setInputText('')
    setIsSending(true)

    // Optimistic UI update
    const optimisticMessages = [
      ...messages,
      { sender: 'candidate', text: originalText, timestamp: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) }
    ]
    setMessages(optimisticMessages)

    try {
      const res = await fetch(`/api/interview/session/${activeSession.id}/message`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ text: originalText })
      })
      if (res.status === 401) {
        localStorage.removeItem('token')
        navigate('/login')
        return
      }
      if (res.ok) {
        const updatedSession = await res.json()
        setActiveSession(updatedSession)
        setMessages(JSON.parse(updatedSession.messages))
      }
    } catch (err) {
      console.error("Error sending response:", err)
    } finally {
      setIsSending(false)
    }
  }

  const handleConcludeSession = async () => {
    if (!activeSession || isConcluding) return

    const token = localStorage.getItem('token')
    if (!token) {
      navigate('/login')
      return
    }

    try {
      setIsConcluding(true)
      const res = await fetch(`/api/interview/session/${activeSession.id}/conclude`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (res.status === 401) {
        localStorage.removeItem('token')
        navigate('/login')
        return
      }
      if (res.ok) {
        const data = await res.json()
        setActiveSession(data)
        setMessages(JSON.parse(data.messages))
        fetchSessions()
      }
    } catch (err) {
      console.error("Conclude failed:", err)
    } finally {
      setIsConcluding(false)
    }
  }

  const getSessionIcon = (type) => {
    return type === 'Technical' ? <BookOpen className="h-4.5 w-4.5" /> : <Briefcase className="h-4.5 w-4.5" />
  }

  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center min-h-[70vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
        <p className="text-slate-400 mt-4 font-medium">Entering Interview Suite...</p>
      </div>
    )
  }

  // Count candidate answers to track progress
  const answeredCount = messages.filter(m => m.sender === 'candidate').length
  const totalQuestions = 3
  const isRoundOver = activeSession?.status === 'Completed' || messages.some(m => m.text.includes('compiling your evaluation'))

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-extrabold text-white tracking-tight flex items-center">
          <MessageSquare className="h-8 w-8 text-purple-400 mr-3" />
          Mock Interview Agent
        </h1>
        <p className="text-slate-400 mt-1 leading-relaxed">
          Start mock technical (React, Python, SQL) or HR behavioral interview sessions. Answer questions and receive dynamic evaluation reports.
        </p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
        
        {/* Left Side: Sessions Directory / New Session Launcher (4 Cols) */}
        <div className="xl:col-span-4 space-y-6">
          {/* Create New Session Box */}
          <div className="glass-panel p-5 rounded-3xl">
            <h3 className="font-bold text-slate-200 text-base mb-4 flex items-center">
              <PlusCircle className="h-5 w-5 text-purple-400 mr-2" />
              Start New Simulation
            </h3>
            
            <form onSubmit={handleStartSession} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase mb-2">Round Category</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setSessionType('Technical')}
                    className={`py-3 rounded-2xl border text-sm font-semibold transition-all duration-200 flex flex-col items-center justify-center space-y-1.5
                      ${sessionType === 'Technical'
                        ? 'bg-purple-500/10 border-purple-500/30 text-purple-300'
                        : 'bg-slate-900/40 border-slate-800 text-slate-500 hover:text-slate-350'
                      }`}
                  >
                    <BookOpen className="h-5 w-5" />
                    <span>Technical SDE</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setSessionType('HR')}
                    className={`py-3 rounded-2xl border text-sm font-semibold transition-all duration-200 flex flex-col items-center justify-center space-y-1.5
                      ${sessionType === 'HR'
                        ? 'bg-purple-500/10 border-purple-500/30 text-purple-300'
                        : 'bg-slate-900/40 border-slate-800 text-slate-500 hover:text-slate-350'
                      }`}
                  >
                    <Briefcase className="h-5 w-5" />
                    <span>HR Behavioral</span>
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isStarting}
                className="w-full py-3.5 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-2xl transition-all duration-200 flex items-center justify-center shadow-lg shadow-purple-600/15"
              >
                {isStarting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></div>
                    Generating custom prompt...
                  </>
                ) : (
                  'Launch Mock Interview'
                )}
              </button>
            </form>
          </div>

          {/* Past Sessions List */}
          <div className="glass-panel p-5 rounded-3xl">
            <h3 className="font-bold text-slate-200 text-base mb-4">
              Session History
            </h3>
            
            <div className="space-y-2.5 max-h-[35vh] overflow-y-auto pr-1">
              {sessions.map((s) => (
                <div
                  key={s.id}
                  onClick={() => handleSelectSession(s)}
                  className={`p-3.5 rounded-2xl border text-left cursor-pointer transition-all duration-150 flex items-center justify-between
                    ${activeSession?.id === s.id 
                      ? 'bg-purple-500/10 border-purple-500/30' 
                      : 'bg-slate-900/40 border-slate-850 hover:bg-slate-850'
                    }`}
                >
                  <div className="truncate max-w-[70%]">
                    <div className="flex items-center space-x-2">
                      <span className={`p-1.5 rounded-lg ${s.session_type === 'Technical' ? 'bg-indigo-500/15 text-indigo-400' : 'bg-pink-500/15 text-pink-400'}`}>
                        {getSessionIcon(s.session_type)}
                      </span>
                      <p className="text-xs font-semibold text-slate-200 truncate">
                        {s.session_type} Round #{s.id}
                      </p>
                    </div>
                    <span className="text-[10px] text-slate-500 mt-1 block">
                      {s.status === 'Completed' ? 'Evaluated' : 'In Progress'}
                    </span>
                  </div>
                  
                  {s.status === 'Completed' ? (
                    <span className="text-xs font-extrabold text-purple-400 bg-purple-500/10 border border-purple-500/20 px-2 py-0.5 rounded-lg">
                      {s.score}%
                    </span>
                  ) : (
                    <span className="text-[9px] font-bold text-slate-500 bg-slate-800 px-1.5 py-0.5 rounded-md border border-slate-700">
                      Active
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Side: Active Chat Dialogue & Evaluation (8 Cols) */}
        <div className="xl:col-span-8 space-y-6">
          {activeSession ? (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-[75vh]">
              
              {/* Chat Dialogue Pane (8 Cols) */}
              <div className="lg:col-span-8 flex flex-col bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden h-full">
                
                {/* Chat Top Banner bar */}
                <div className="bg-slate-950/80 px-6 py-4 border-b border-slate-850 flex items-center justify-between">
                  <div className="flex items-center space-x-2.5">
                    <div className="h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse-slow" />
                    <div>
                      <span className="text-sm font-bold text-slate-200">{activeSession.session_type} Evaluator AI</span>
                      <p className="text-[10px] text-slate-500">Live conversation simulation</p>
                    </div>
                  </div>
                  
                  {activeSession.status === 'In Progress' && (
                    <span className="text-[10px] font-bold text-slate-400 bg-slate-900 border border-slate-800 px-2 py-1 rounded-lg">
                      Response {answeredCount} / {totalQuestions}
                    </span>
                  )}
                </div>

                {/* Messages Body */}
                <div className="flex-1 p-6 overflow-y-auto space-y-4">
                  {messages.map((m, idx) => {
                    const isInterviewer = m.sender === 'interviewer'
                    return (
                      <div 
                        key={idx} 
                        className={`flex ${isInterviewer ? 'justify-start' : 'justify-end'}`}
                      >
                        <div className={`
                          max-w-[85%] rounded-2xl px-4 py-3.5 text-sm leading-relaxed shadow-sm
                          ${isInterviewer 
                            ? 'bg-slate-950/80 text-slate-200 border border-slate-850 rounded-tl-none' 
                            : 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-tr-none'
                          }`}
                        >
                          <div className="text-[10px] text-slate-500 uppercase tracking-widest font-bold mb-1">
                            {isInterviewer ? 'Recruiter' : 'You'}
                          </div>
                          <p className="whitespace-pre-wrap">{m.text}</p>
                        </div>
                      </div>
                    )
                  })}
                  <div ref={chatBottomRef} />
                </div>

                {/* Input Text Form bar */}
                {activeSession.status === 'In Progress' ? (
                  <form onSubmit={handleSendMessage} className="bg-slate-950/85 p-4 border-t border-slate-850 flex space-x-2">
                    <input
                      type="text"
                      value={inputText}
                      onChange={(e) => setInputText(e.target.value)}
                      placeholder="Type your response to the interviewer..."
                      disabled={isSending || isRoundOver}
                      className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-purple-500 transition-colors"
                      required
                    />
                    
                    {isRoundOver ? (
                      <button
                        type="button"
                        onClick={handleConcludeSession}
                        disabled={isConcluding}
                        className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs flex items-center transition-colors shadow-lg shadow-emerald-600/10"
                      >
                        {isConcluding ? 'Analyzing...' : 'Complete Evaluation'}
                      </button>
                    ) : (
                      <button
                        type="submit"
                        disabled={isSending || !inputText.trim()}
                        className="p-3 bg-purple-600 hover:bg-purple-700 text-white rounded-xl transition-colors disabled:opacity-50"
                      >
                        <Send className="h-4 w-4" />
                      </button>
                    )}
                  </form>
                ) : (
                  <div className="bg-slate-950/80 p-4 border-t border-slate-850 text-center text-xs text-slate-500 font-semibold uppercase">
                    Session Completed and Locked
                  </div>
                )}

              </div>

              {/* Evaluation Report Column (4 Cols) */}
              <div className="lg:col-span-4 glass-panel p-5 rounded-3xl h-full overflow-y-auto space-y-5">
                <h3 className="font-bold text-slate-200 text-sm flex items-center border-b border-slate-800 pb-3">
                  <Award className="h-5 w-5 text-purple-400 mr-2" />
                  Round Evaluation
                </h3>
                
                {activeSession.status === 'Completed' ? (
                  <div className="space-y-5">
                    {/* Score badges */}
                    <div className="text-center bg-slate-950/40 border border-slate-850 p-4 rounded-2xl">
                      <span className="text-4xl font-extrabold text-purple-400">{activeSession.score}%</span>
                      <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mt-1.5">Aggregate score</p>
                    </div>

                    <div className="space-y-3">
                      <div>
                        <div className="flex justify-between text-xs font-semibold mb-1">
                          <span className="text-slate-400">Communication</span>
                          <span className="text-indigo-400">{activeSession.communication_score}%</span>
                        </div>
                        <div className="w-full bg-slate-800 rounded-full h-1.5">
                          <div 
                            className="bg-indigo-500 h-1.5 rounded-full transition-all duration-500" 
                            style={{ width: `${activeSession.communication_score}%` }}
                          />
                        </div>
                      </div>

                      <div>
                        <div className="flex justify-between text-xs font-semibold mb-1">
                          <span className="text-slate-400">Domain Knowledge</span>
                          <span className="text-pink-400">{activeSession.knowledge_score}%</span>
                        </div>
                        <div className="w-full bg-slate-800 rounded-full h-1.5">
                          <div 
                            className="bg-pink-500 h-1.5 rounded-full transition-all duration-500" 
                            style={{ width: `${activeSession.knowledge_score}%` }}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Feedback details */}
                    <div className="bg-slate-950/30 p-4 border border-slate-850 rounded-2xl space-y-2">
                      <span className="text-[10px] text-slate-400 font-extrabold uppercase">Interviewer Remarks</span>
                      <p className="text-xs text-slate-300 leading-relaxed italic">
                        "{activeSession.feedback}"
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="text-center text-slate-500 flex flex-col items-center justify-center h-80 px-2 space-y-2">
                    <MessageCircle className="h-8 w-8 text-slate-700" />
                    <p className="text-xs font-bold uppercase">Assessment Pending</p>
                    <p className="text-[11px] text-slate-500 leading-relaxed">
                      Complete all mock interview prompts to compile the performance metrics and recruiter insights.
                    </p>
                  </div>
                )}
              </div>

            </div>
          ) : (
            <div className="glass-panel p-8 rounded-3xl text-center text-slate-400 flex flex-col items-center justify-center h-[50vh]">
              <MessageSquare className="h-10 w-10 text-slate-600 mb-3" />
              <p className="text-sm font-medium">No active interview session.</p>
              <p className="text-xs text-slate-500 mt-1 max-w-xs">Select round parameters on the left pane and press start to begin simulated dialogues.</p>
            </div>
          )}
        </div>

      </div>
    </div>
  )
}

export default InterviewAgent
