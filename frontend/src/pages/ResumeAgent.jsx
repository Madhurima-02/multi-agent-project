import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { 
  FileText, 
  Upload, 
  CheckCircle, 
  AlertCircle, 
  ArrowRight, 
  Sparkles,
  History
} from 'lucide-react'

function ResumeAgent() {
  const navigate = useNavigate()
  const [resumeText, setResumeText] = useState('')
  const [resumeName, setResumeName] = useState('My_Software_Engineer_Resume.pdf')
  const [history, setHistory] = useState([])
  const [loading, setLoading] = useState(false)
  const [analyzing, setAnalyzing] = useState(false)
  const [analysisResult, setAnalysisResult] = useState(null)

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) {
      navigate('/login')
      return
    }
    fetchHistory()
  }, [navigate])

  const fetchHistory = async () => {
    const token = localStorage.getItem('token')
    if (!token) {
      navigate('/login')
      return
    }
    try {
      setLoading(true)
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/resume/history`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      if (res.status === 401) {
        localStorage.removeItem('token')
        navigate('/login')
        return
      }
      if (res.ok) {
        const data = await res.json()
        setHistory(data)
        if (data.length > 0) {
          setAnalysisResult(data[0]) // Show the latest result by default
        }
      }
    } catch (err) {
      console.error("Error fetching history:", err)
    } finally {
      setLoading(false)
    }
  }

  // Pre-load template helpers for the user
  const loadTemplate = (type) => {
    if (type === 'junior') {
      setResumeName('Alex_Junior_Developer_Resume.pdf')
      setResumeText(
        "Alex Developer\n" +
        "Email: alex@example.com | GitHub: github.com/alexdev\n\n" +
        "OBJECTIVE\n" +
        "Aspiring developer seeking a junior engineer placement.\n\n" +
        "EDUCATION\n" +
        "B.Tech in Computer Science - GPA: 3.4/4.0 (Graduation 2026)\n\n" +
        "SKILLS\n" +
        "React, HTML, CSS, JavaScript, SQLite, Python, Git\n\n" +
        "PROJECTS\n" +
        "Personal Portfolio: Developed a React web app to showcase projects. Used Git for version control.\n" +
        "Simple Calculator: Made a calculator using basic Python scripting."
      )
    } else if (type === 'senior') {
      setResumeName('Jane_SDE_Intern_Resume.pdf')
      setResumeText(
        "Jane Developer\n" +
        "Email: jane@example.com | LinkedIn: linkedin.com/in/jane | GitHub: github.com/jane\n\n" +
        "SKILLS\n" +
        "React, TypeScript, Python, FastAPI, SQL, SQLite, Node.js, Docker, Kubernetes, Git, CI/CD\n\n" +
        "EXPERIENCE\n" +
        "Software Engineer Intern - Tech Corp (May 2025 - August 2025)\n" +
        "- Designed and implemented scalable REST APIs using FastAPI, decreasing API response times by 15%.\n" +
        "- Led migration of service database to SQLite, facilitating local testing mock workflows.\n" +
        "- Optimized client-side queries in React, improving render metrics across 5 web dashboards.\n\n" +
        "PROJECTS\n" +
        "Distributed Web Scraper: Built a robust parallel task scheduler utilizing Python and Docker."
      )
    }
  }

  const handleAnalyze = async (e) => {
    e.preventDefault()
    if (!resumeText.trim()) return

    const token = localStorage.getItem('token')
    if (!token) {
      navigate('/login')
      return
    }

    try {
      setAnalyzing(true)
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/resume/analyze`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          resume_name: resumeName,
          resume_text: resumeText
        })
      })
      if (res.status === 401) {
        localStorage.removeItem('token')
        navigate('/login')
        return
      }
      if (res.ok) {
        const result = await res.json()
        setAnalysisResult(result)
        // Refresh the sidebar history list
        fetchHistory()
      }
    } catch (err) {
      console.error("Error analyzing resume:", err)
    } finally {
      setAnalyzing(false)
    }
  }

  // Parse strings from API response
  const skillsList = analysisResult ? JSON.parse(analysisResult.extracted_skills) : []
  const suggestionsList = analysisResult ? JSON.parse(analysisResult.suggestions) : []

  return (
    <div className="space-y-8">
      {/* Header section */}
      <div>
        <h1 className="text-3xl font-extrabold text-white tracking-tight flex items-center">
          <FileText className="h-8 w-8 text-teal-400 mr-3" />
          Resume Review Agent
        </h1>
        <p className="text-slate-400 mt-1 leading-relaxed">
          Simulate a recruiting scan. The agent scores keywords, extracts skills, analyzes ATS compatibility, and highlights optimizations.
        </p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        {/* Left Form Panel: Input Text */}
        <div className="xl:col-span-2 space-y-6">
          <div className="glass-panel p-6 rounded-3xl space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-800">
              <h3 className="font-bold text-slate-200">Copy & Paste Resume Text</h3>
              <div className="flex space-x-2">
                <button 
                  onClick={() => loadTemplate('junior')}
                  className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 hover:bg-indigo-500/20 transition-all duration-200"
                >
                  Load Junior Template
                </button>
                <button 
                  onClick={() => loadTemplate('senior')}
                  className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-teal-500/10 text-teal-300 border border-teal-500/20 hover:bg-teal-500/20 transition-all duration-200"
                >
                  Load SDE Intern Template
                </button>
              </div>
            </div>

            <form onSubmit={handleAnalyze} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Simulated Filename</label>
                <input 
                  type="text" 
                  value={resumeName}
                  onChange={(e) => setResumeName(e.target.value)}
                  placeholder="e.g. My_Software_Resume.pdf"
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Resume Text Content</label>
                <textarea
                  value={resumeText}
                  onChange={(e) => setResumeText(e.target.value)}
                  placeholder="Paste your education, skills, experience, and project descriptions here..."
                  className="w-full h-80 bg-slate-900 border border-slate-800 rounded-xl p-4 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors font-mono resize-y"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={analyzing || !resumeText.trim()}
                className="w-full py-3.5 bg-gradient-to-r from-teal-500 to-indigo-600 hover:from-teal-600 hover:to-indigo-700 text-white font-semibold rounded-xl transition-all duration-200 flex items-center justify-center shadow-lg shadow-indigo-600/10 disabled:opacity-50"
              >
                {analyzing ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></div>
                    Parsing elements & mapping keywords...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4.5 w-4.5 mr-2" />
                    Run AI Review Scan
                  </>
                )}
              </button>
            </form>
          </div>
        </div>

        {/* Right Output Panel: Scores & Suggestions */}
        <div className="space-y-6">
          {analysisResult ? (
            <>
              {/* Scores Card */}
              <div className="glass-panel p-6 rounded-3xl relative overflow-hidden">
                <h3 className="font-bold text-slate-200 text-base mb-6 flex items-center">
                  <CheckCircle className="h-5 w-5 text-teal-400 mr-2" />
                  Latest Analysis Report
                </h3>

                {/* Score breakdown metrics */}
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div className="bg-slate-900/60 p-4 rounded-2xl border border-slate-800">
                    <span className="text-2xl font-extrabold text-teal-400">{analysisResult.score}%</span>
                    <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold mt-1">Overall</p>
                  </div>
                  <div className="bg-slate-900/60 p-4 rounded-2xl border border-slate-800">
                    <span className="text-2xl font-extrabold text-indigo-400">{analysisResult.ats_score}%</span>
                    <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold mt-1">ATS Match</p>
                  </div>
                  <div className="bg-slate-900/60 p-4 rounded-2xl border border-slate-800">
                    <span className="text-2xl font-extrabold text-cyan-400">{analysisResult.experience_score}%</span>
                    <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold mt-1">Impact</p>
                  </div>
                </div>

                {/* Extracted Skills tag bubble list */}
                <div className="mt-6">
                  <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">Extracted Tech Stack</span>
                  <div className="flex flex-wrap gap-1.5 mt-2.5">
                    {skillsList.map((skill, idx) => (
                      <span 
                        key={idx} 
                        className="px-2.5 py-1 text-xs font-semibold bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 rounded-lg"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Suggestions Card */}
              <div className="glass-panel p-6 rounded-3xl space-y-4">
                <h4 className="font-bold text-slate-200 text-sm flex items-center">
                  <AlertCircle className="h-4.5 w-4.5 text-teal-400 mr-2" />
                  Areas of Improvement
                </h4>

                <div className="space-y-3.5">
                  {suggestionsList.map((item, idx) => (
                    <div 
                      key={idx} 
                      className={`p-3.5 rounded-2xl border text-sm ${
                        item.impact === 'High' 
                          ? 'bg-red-500/5 border-red-500/20 text-slate-300' 
                          : 'bg-slate-900/50 border-slate-800 text-slate-300'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-xs text-slate-400 font-bold uppercase">{item.section}</span>
                        <span className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded-md ${
                          item.impact === 'High' ? 'bg-red-500/15 text-red-400' : 'bg-amber-500/15 text-amber-400'
                        }`}>
                          {item.impact} Impact
                        </span>
                      </div>
                      <p className="text-xs text-slate-300 leading-relaxed">{item.text}</p>
                    </div>
                  ))}
                </div>
              </div>
            </>
          ) : (
            <div className="glass-panel p-8 rounded-3xl text-center text-slate-400 flex flex-col items-center justify-center h-80">
              <Upload className="h-10 w-10 text-slate-600 mb-3" />
              <p className="text-sm font-medium">No resume analyzed yet.</p>
              <p className="text-xs text-slate-500 mt-1 max-w-xs">Paste your resume content in the left box and trigger the review scanner.</p>
            </div>
          )}

          {/* History Sidebar */}
          <div className="glass-panel p-6 rounded-3xl">
            <h3 className="font-bold text-slate-200 text-sm flex items-center mb-4 border-b border-slate-800 pb-3">
              <History className="h-4 w-4 text-teal-400 mr-2" />
              Upload & Scan History
            </h3>
            
            <div className="space-y-3 max-h-48 overflow-y-auto pr-1">
              {history.map((h) => (
                <div 
                  key={h.id}
                  onClick={() => setAnalysisResult(h)}
                  className={`p-3 rounded-xl border text-left cursor-pointer transition-colors duration-150 flex justify-between items-center
                    ${analysisResult?.id === h.id 
                      ? 'bg-teal-500/10 border-teal-500/30' 
                      : 'bg-slate-900/40 border-slate-850 hover:bg-slate-850'
                    }`}
                >
                  <div className="truncate max-w-[70%]">
                    <p className="text-xs font-semibold text-slate-300 truncate">{h.resume_name}</p>
                    <p className="text-[10px] text-slate-500 mt-0.5">{new Date(h.analyzed_at).toLocaleDateString()}</p>
                  </div>
                  <span className={`text-xs font-extrabold px-2 py-0.5 rounded-lg ${
                    h.score >= 80 ? 'bg-teal-500/10 text-teal-400' : 'bg-slate-800 text-slate-400'
                  }`}>
                    {h.score}%
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ResumeAgent
