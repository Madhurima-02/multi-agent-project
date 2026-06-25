import React, { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { 
  Award, 
  BookOpen, 
  FileText, 
  MessageSquare, 
  CheckCircle2, 
  Circle, 
  ArrowRight,
  TrendingUp,
  ShieldAlert,
  BrainCircuit
} from 'lucide-react'

function Dashboard() {
  const navigate = useNavigate()
  const [user, setUser] = useState(null)
  const [roadmap, setRoadmap] = useState(null)
  const [resumeScore, setResumeScore] = useState(null)
  const [dsaCount, setDsaCount] = useState(0)
  const [interviewScore, setInterviewScore] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    async function fetchDashboardData() {
      const token = localStorage.getItem('token')
      if (!token) {
        navigate('/login')
        return
      }

      const headers = {
        'Authorization': `Bearer ${token}`
      }

      try {
        setLoading(true)
        setError(null)
        
        // 0. Fetch Current User Details
        const meRes = await fetch('/api/auth/me', { headers })
        if (meRes.status === 401) {
          localStorage.removeItem('token')
          navigate('/login')
          return
        }
        if (meRes.ok) {
          const meData = await meRes.json()
          setUser(meData)
        }
        
        // 1. Fetch Coordinator Roadmap details
        const roadmapRes = await fetch('/api/coordinator/roadmap', { headers })
        if (roadmapRes.status === 401) {
          localStorage.removeItem('token')
          navigate('/login')
          return
        }
        if (roadmapRes.ok) {
          const roadmapData = await roadmapRes.json()
          setRoadmap(roadmapData)
        }
        
        // 2. Fetch Resume History
        const resumeRes = await fetch('/api/resume/history', { headers })
        if (resumeRes.ok) {
          const resumeData = await resumeRes.json()
          if (resumeData.length > 0) {
            setResumeScore(resumeData[0].score) // Latest resume score
          }
        }
        
        // 3. Fetch DSA Submissions
        const dsaRes = await fetch('/api/dsa/submissions', { headers })
        if (dsaRes.ok) {
          const dsaData = await dsaRes.json()
          const solved = dsaData.filter(sub => sub.status === 'Solved').length
          setDsaCount(solved)
        }
        
        // 4. Fetch Interview Sessions
        const interviewRes = await fetch('/api/interview/sessions', { headers })
        if (interviewRes.ok) {
          const interviewData = await interviewRes.json()
          const completed = interviewData.filter(s => s.status === 'Completed')
          if (completed.length > 0) {
            const totalScore = completed.reduce((sum, s) => sum + (s.score || 0), 0)
            setInterviewScore(Math.round(totalScore / completed.length))
          }
        }
      } catch (err) {
        console.error("Error fetching dashboard data:", err)
        setError("Could not connect to the placement backend server. Please verify the FastAPI server is running.")
      } finally {
        setLoading(false)
      }
    }

    fetchDashboardData()
  }, [navigate])

  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center min-h-[70vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
        <p className="text-slate-400 mt-4 font-medium">Aggregating placement records...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center min-h-[70vh] text-center px-4">
        <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl max-w-md">
          <ShieldAlert className="h-12 w-12 text-red-400 mx-auto mb-3" />
          <h3 className="font-bold text-lg text-slate-200">Connection Failed</h3>
          <p className="text-slate-400 text-sm mt-1">{error}</p>
          <div className="mt-4 p-2 bg-slate-900 rounded-xl text-left font-mono text-xs text-slate-400 border border-slate-800">
            $ cd backend<br />
            $ pip install fastapi uvicorn sqlalchemy<br />
            $ uvicorn main:app --reload
          </div>
        </div>
      </div>
    )
  }

  // Parse roadmap checklist steps if available
  const steps = roadmap ? JSON.parse(roadmap.roadmap_steps) : []

  return (
    <div className="space-y-8">
      {/* Welcome & Banner section */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-indigo-900/60 to-slate-900 border border-indigo-500/10 p-6 md:p-8">
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/5 rounded-full blur-3xl -z-10" />
        <div className="absolute bottom-0 left-20 w-80 h-80 bg-cyan-500/5 rounded-full blur-3xl -z-10" />
        
        <div className="max-w-2xl">
          <span className="px-3 py-1 rounded-full text-xs font-semibold bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
            Cohort 2026 Active
          </span>
          <h1 className="text-3xl md:text-4xl font-extrabold text-white mt-3 tracking-tight">
            Welcome back, <span className="bg-gradient-to-r from-indigo-400 to-cyan-400 bg-clip-text text-transparent">{user?.name || 'Alex'}</span>!
          </h1>
          <p className="text-slate-300 mt-2 leading-relaxed">
            Your Placement Coordinator Agent has evaluated your profile. Check your readiness details and action items below to proceed.
          </p>
        </div>
      </div>

      {/* Main Grid: Readiness Meter & Quick Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Readiness Meter Card */}
        <div className="glass-panel p-6 rounded-3xl flex flex-col items-center justify-center text-center relative overflow-hidden group">
          <div className="absolute top-0 left-0 w-2 h-full bg-indigo-500" />
          <h3 className="font-bold text-slate-200 text-lg">Overall Placement Readiness</h3>
          
          <div className="relative flex items-center justify-center my-6">
            {/* SVG Progress Circle */}
            <svg className="w-36 h-36 transform -rotate-90">
              <circle
                cx="72"
                cy="72"
                r="64"
                className="stroke-slate-800"
                strokeWidth="10"
                fill="transparent"
              />
              <circle
                cx="72"
                cy="72"
                r="64"
                className="stroke-indigo-500 transition-all duration-1000 ease-out"
                strokeWidth="10"
                fill="transparent"
                strokeDasharray={2 * Math.PI * 64}
                strokeDashoffset={2 * Math.PI * 64 * (1 - (roadmap?.overall_readiness || 0) / 100)}
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute text-center">
              <span className="text-4xl font-extrabold text-white">{roadmap?.overall_readiness || 0}%</span>
              <p className="text-[10px] text-indigo-400 font-semibold tracking-wider uppercase mt-0.5">Readiness</p>
            </div>
          </div>
          
          <p className="text-sm text-slate-400 px-4 leading-relaxed italic">
            "{roadmap?.coordinator_advice || 'Preparing recommendations...'}"
          </p>
        </div>

        {/* Analytics Mini Cards (2 Columns) */}
        <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Resume Score */}
          <div className="glass-panel p-6 rounded-3xl flex flex-col justify-between hover:scale-[1.02] transition-transform duration-300">
            <div className="flex justify-between items-start">
              <div className="p-3 bg-teal-500/10 rounded-2xl border border-teal-500/20">
                <FileText className="h-6 w-6 text-teal-400" />
              </div>
              <span className="text-xs text-slate-500 font-medium">Resume Score</span>
            </div>
            <div className="mt-6">
              <p className="text-4xl font-bold text-slate-100">{resumeScore !== null ? `${resumeScore}%` : 'N/A'}</p>
              <p className="text-xs text-slate-400 mt-1">
                {resumeScore ? (resumeScore >= 80 ? 'ATS Optimized' : 'Needs tuning') : 'No resume uploaded'}
              </p>
            </div>
            <Link to="/resume" className="mt-4 text-xs text-teal-400 font-semibold flex items-center hover:underline">
              Analyze Resume <ArrowRight className="h-3.5 w-3.5 ml-1" />
            </Link>
          </div>

          {/* DSA Solved Count */}
          <div className="glass-panel p-6 rounded-3xl flex flex-col justify-between hover:scale-[1.02] transition-transform duration-300">
            <div className="flex justify-between items-start">
              <div className="p-3 bg-amber-500/10 rounded-2xl border border-amber-500/20">
                <BookOpen className="h-6 w-6 text-amber-400" />
              </div>
              <span className="text-xs text-slate-500 font-medium">DSA Problems</span>
            </div>
            <div className="mt-6">
              <p className="text-4xl font-bold text-slate-100">{dsaCount} Solved</p>
              <p className="text-xs text-slate-400 mt-1">Targeting 5+ core topics</p>
            </div>
            <Link to="/dsa" className="mt-4 text-xs text-amber-400 font-semibold flex items-center hover:underline">
              Solve Challenges <ArrowRight className="h-3.5 w-3.5 ml-1" />
            </Link>
          </div>

          {/* Mock Interview Score */}
          <div className="glass-panel p-6 rounded-3xl flex flex-col justify-between hover:scale-[1.02] transition-transform duration-300">
            <div className="flex justify-between items-start">
              <div className="p-3 bg-purple-500/10 rounded-2xl border border-purple-500/20">
                <MessageSquare className="h-6 w-6 text-purple-400" />
              </div>
              <span className="text-xs text-slate-500 font-medium">Interview Avg</span>
            </div>
            <div className="mt-6">
              <p className="text-4xl font-bold text-slate-100">{interviewScore !== null ? `${interviewScore}%` : 'N/A'}</p>
              <p className="text-xs text-slate-400 mt-1">
                {interviewScore ? (interviewScore >= 80 ? 'Placement Ready' : 'Keep practicing') : 'No mock rounds run'}
              </p>
            </div>
            <Link to="/interview" className="mt-4 text-xs text-purple-400 font-semibold flex items-center hover:underline">
              Mock Interview <ArrowRight className="h-3.5 w-3.5 ml-1" />
            </Link>
          </div>
        </div>
      </div>

      {/* Checklist & Next Steps Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Roadmap Checklist */}
        <div className="lg:col-span-2 glass-panel p-6 rounded-3xl">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-4">
            <h3 className="font-bold text-slate-200 text-lg flex items-center">
              <Award className="h-5 w-5 text-indigo-400 mr-2" />
              Your Preparation Roadmap
            </h3>
            <span className="text-xs text-slate-400 font-medium">{steps.filter(s => s.status === 'Completed').length} / {steps.length} Tasks Completed</span>
          </div>

          <div className="space-y-3.5">
            {steps.map((step) => (
              <div 
                key={step.id} 
                className={`flex items-center justify-between p-3.5 rounded-2xl border transition-all duration-200 
                  ${step.status === 'Completed' 
                    ? 'bg-emerald-950/10 border-emerald-500/20 text-slate-300' 
                    : step.status === 'In Progress'
                      ? 'bg-indigo-950/10 border-indigo-500/20 text-slate-200'
                      : 'bg-slate-900/40 border-slate-800/80 text-slate-400'
                  }`}
              >
                <div className="flex items-center space-x-3">
                  {step.status === 'Completed' ? (
                    <CheckCircle2 className="h-5 w-5 text-emerald-400 flex-shrink-0" />
                  ) : (
                    <Circle className={`h-5 w-5 flex-shrink-0 ${step.status === 'In Progress' ? 'text-indigo-400' : 'text-slate-600'}`} />
                  )}
                  <span className={`text-sm font-medium ${step.status === 'Completed' ? 'line-through text-slate-500' : ''}`}>
                    {step.title}
                  </span>
                </div>
                <span className={`text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full border
                  ${step.status === 'Completed'
                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                    : step.status === 'In Progress'
                      ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20'
                      : 'bg-slate-800 text-slate-500 border-slate-700'
                  }`}
                >
                  {step.agent}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* AI coordinator nudge box */}
        <div className="glass-panel p-6 rounded-3xl flex flex-col justify-between relative overflow-hidden bg-slate-900/60">
          <div>
            <div className="flex items-center space-x-2.5 text-indigo-400 mb-4">
              <BrainCircuit className="h-5 w-5" />
              <h4 className="font-bold text-slate-200">Orchestrator Consultation</h4>
            </div>
            <p className="text-sm text-slate-400 leading-relaxed mb-4">
              The AI Coordinator analyzes progress across all placement checkpoints. You can consult directly to reconfigure targets, mock interview questions, or ask placement fitness questions.
            </p>
            <div className="p-3 bg-slate-950/50 rounded-2xl border border-slate-800 text-xs text-slate-400 space-y-1.5">
              <p>💡 <strong>Try asking:</strong></p>
              <p className="italic">"Am I ready for placements?"</p>
              <p className="italic">"How is my DSA progress looking?"</p>
            </div>
          </div>
          <Link 
            to="/coordinator" 
            className="mt-6 w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-center rounded-2xl transition-colors duration-200 flex items-center justify-center text-sm shadow-lg shadow-indigo-600/10"
          >
            Consult Coordinator <ArrowRight className="h-4 w-4 ml-1.5" />
          </Link>
        </div>
      </div>
    </div>
  )
}

export default Dashboard
