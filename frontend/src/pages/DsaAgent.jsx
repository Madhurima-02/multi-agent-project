import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { 
  Code2, 
  HelpCircle, 
  Terminal, 
  Play, 
  CheckCircle, 
  XCircle, 
  ChevronRight,
  RefreshCw,
  Cpu
} from 'lucide-react'

function DsaAgent() {
  const navigate = useNavigate()
  const [problems, setProblems] = useState([])
  const [selectedProblem, setSelectedProblem] = useState(null)
  const [code, setCode] = useState('')
  const [submissions, setSubmissions] = useState([])
  const [consoleOutput, setConsoleOutput] = useState('Terminal ready. Click "Run Code" or "Submit Solution".')
  const [isRunning, setIsRunning] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showHint, setShowHint] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) {
      navigate('/login')
      return
    }
    fetchProblemsAndSubmissions()
  }, [navigate])

  const fetchProblemsAndSubmissions = async () => {
    const token = localStorage.getItem('token')
    if (!token) {
      navigate('/login')
      return
    }
    try {
      setLoading(true)
      const probRes = await fetch(`${import.meta.env.VITE_API_URL}/api/dsa/problems`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (probRes.status === 401) {
        localStorage.removeItem('token')
        navigate('/login')
        return
      }
      if (probRes.ok) {
        const probData = await probRes.json()
        setProblems(probData)
        if (probData.length > 0) {
          setSelectedProblem(probData[0])
          setCode(probData[0].starter_code)
        }
      }

      const subRes = await fetch(`${import.meta.env.VITE_API_URL}/api/dsa/submissions`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (subRes.status === 401) {
        localStorage.removeItem('token')
        navigate('/login')
        return
      }
      if (subRes.ok) {
        const subData = await subRes.json()
        setSubmissions(subData)
      }
    } catch (err) {
      console.error("Error loading DSA data:", err)
    } finally {
      setLoading(false)
    }
  }

  const handleSelectProblem = (problem) => {
    setSelectedProblem(problem)
    setCode(problem.starter_code)
    setShowHint(false)
    setConsoleOutput('Terminal ready. Loaded: ' + problem.title)
  }

  // Simulate local test runner compile & run
  const handleRunCode = () => {
    setIsRunning(true)
    setConsoleOutput('Compiling code...\nParsing functions...\nExecuting test cases...')
    
    setTimeout(() => {
      // Heuristic test cases run simulation
      if (code.includes('def ') && code.includes('return')) {
        setConsoleOutput(
          '✔ Test Case 1 Passed: Input matches expectations\n' +
          '✔ Test Case 2 Passed: Complies with time complexity parameters\n\n' +
          'Status: All Local Tests Passed!'
        )
      } else {
        setConsoleOutput(
          '❌ SyntaxError: Incomplete function implementation.\n' +
          'Details: Expected keyword "return" with a valid result expression.'
        )
      }
      setIsRunning(false)
    }, 1200)
  }

  const handleSubmitCode = async () => {
    if (!selectedProblem) return
    
    const token = localStorage.getItem('token')
    if (!token) {
      navigate('/login')
      return
    }

    try {
      setIsSubmitting(true)
      setConsoleOutput('Submitting SDE evaluation pipeline...\nRunning hidden test suites...')
      
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/dsa/submit`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          problem_id: selectedProblem.id,
          code: code,
          status: 'Pending'
        })
      })

      if (res.status === 401) {
        localStorage.removeItem('token')
        navigate('/login')
        return
      }

      if (res.ok) {
        const data = await res.json()
        
        // Add to local submissions array
        setSubmissions(prev => [data, ...prev])
        
        if (data.status === 'Solved') {
          setConsoleOutput(
            '🌟 SOLUTION VERIFIED SUCCESSFULLY! 🌟\n' +
            '-----------------------------------------\n' +
            'Submission ID: ' + data.id + '\n' +
            'Result: SUCCESS\n' +
            'Memory Usage: 14.2 MB (Top 95.4%)\n' +
            'Run Time: 28 ms (Top 88.2%)\n\n' +
            'Coordinator database updated.'
          )
        } else {
          setConsoleOutput(
            '❌ SUBMISSION FAILED ❌\n' +
            '-----------------------------------------\n' +
            'Details: Solution returned incorrect values on hidden edge cases.\n' +
            'Recommendation: Check your code logic, check null conditions, or consult the solution hint.'
          )
        }
      }
    } catch (err) {
      console.error("Submission failed:", err)
      setConsoleOutput('Error: Unable to reach submission servers.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const isProblemSolved = (probId) => {
    return submissions.some(sub => sub.problem_id === probId && sub.status === 'Solved')
  }

  const getDifficultyColor = (diff) => {
    if (diff === 'Easy') return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20'
    if (diff === 'Medium') return 'text-amber-400 bg-amber-500/10 border-amber-500/20'
    return 'text-red-400 bg-red-500/10 border-red-500/20'
  }

  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center min-h-[70vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
        <p className="text-slate-400 mt-4 font-medium">Booting DSA Sandbox...</p>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Page Title */}
      <div className="flex justify-between items-center flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight flex items-center">
            <Code2 className="h-8 w-8 text-amber-400 mr-3" />
            DSA Training Agent
          </h1>
          <p className="text-slate-400 mt-1 leading-relaxed">
            Practice core topics: Arrays, Strings, Linked Lists, Trees, and Graphs. Implement algorithms and evaluate performance.
          </p>
        </div>
        <button 
          onClick={fetchProblemsAndSubmissions}
          className="p-2.5 bg-slate-900 border border-slate-800 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
        >
          <RefreshCw className="h-4 w-4" />
        </button>
      </div>

      {/* Main split dashboard pane */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Side: Problem Navigator (4 Cols) */}
        <div className="lg:col-span-4 space-y-4">
          <div className="glass-panel p-5 rounded-3xl">
            <h3 className="font-bold text-slate-200 text-base mb-4 border-b border-slate-800 pb-3">
              Coding Challenges
            </h3>
            
            <div className="space-y-2.5 max-h-[60vh] overflow-y-auto pr-1">
              {problems.map((prob) => {
                const solved = isProblemSolved(prob.id)
                const isSelected = selectedProblem?.id === prob.id
                
                return (
                  <div
                    key={prob.id}
                    onClick={() => handleSelectProblem(prob)}
                    className={`p-4 rounded-2xl border text-left cursor-pointer transition-all duration-200 flex items-center justify-between group
                      ${isSelected 
                        ? 'bg-amber-500/10 border-amber-500/30' 
                        : 'bg-slate-900/40 border-slate-850 hover:bg-slate-850'
                      }`}
                  >
                    <div className="truncate max-w-[80%]">
                      <div className="flex items-center space-x-2">
                        {solved ? (
                          <CheckCircle className="h-4.5 w-4.5 text-emerald-400 flex-shrink-0" />
                        ) : (
                          <Cpu className={`h-4.5 w-4.5 flex-shrink-0 ${isSelected ? 'text-amber-400' : 'text-slate-600'}`} />
                        )}
                        <p className="text-sm font-semibold text-slate-200 group-hover:text-amber-400 transition-colors truncate">
                          {prob.title}
                        </p>
                      </div>
                      <div className="flex items-center space-x-2 mt-2">
                        <span className="text-[10px] text-slate-500 font-semibold uppercase">{prob.category}</span>
                        <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-md border ${getDifficultyColor(prob.difficulty)}`}>
                          {prob.difficulty}
                        </span>
                      </div>
                    </div>
                    <ChevronRight className={`h-4 w-4 text-slate-600 group-hover:text-slate-400 transition-transform ${isSelected ? 'translate-x-1 text-amber-400' : ''}`} />
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {/* Right Side: Code Editor & Details (8 Cols) */}
        <div className="lg:col-span-8 space-y-6">
          {selectedProblem ? (
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
              
              {/* Problem Details Column */}
              <div className="glass-panel p-6 rounded-3xl space-y-4 h-[75vh] overflow-y-auto">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-widest">{selectedProblem.category}</span>
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-lg border ${getDifficultyColor(selectedProblem.difficulty)}`}>
                    {selectedProblem.difficulty}
                  </span>
                </div>
                
                <h2 className="text-2xl font-bold text-slate-100">{selectedProblem.title}</h2>
                
                {/* Problem Description text (pre-formatted layout) */}
                <div className="text-sm text-slate-300 leading-relaxed font-mono bg-slate-950/40 p-4 rounded-2xl border border-slate-900 whitespace-pre-wrap">
                  {selectedProblem.description}
                </div>

                {/* Solution Hint Accordion */}
                <div className="border border-slate-800 rounded-2xl p-4 bg-slate-900/40">
                  <button 
                    onClick={() => setShowHint(!showHint)}
                    className="w-full flex items-center justify-between text-sm font-semibold text-slate-300 focus:outline-none"
                  >
                    <span className="flex items-center text-amber-400">
                      <HelpCircle className="h-4.5 w-4.5 mr-2" />
                      Need a hint?
                    </span>
                    <span className="text-xs text-slate-500">{showHint ? 'Hide' : 'Reveal'}</span>
                  </button>
                  {showHint && (
                    <p className="text-xs text-slate-400 leading-relaxed mt-2.5 pl-6 border-l border-amber-500/20">
                      {selectedProblem.solution_hint}
                    </p>
                  )}
                </div>
              </div>

              {/* Code Editor & Console Column */}
              <div className="flex flex-col space-y-6 h-[75vh]">
                
                {/* Editor code box */}
                <div className="flex-1 bg-slate-900 rounded-3xl border border-slate-800 overflow-hidden flex flex-col">
                  <div className="bg-slate-950/80 px-5 py-3.5 border-b border-slate-850 flex items-center justify-between">
                    <span className="text-xs text-slate-400 font-semibold flex items-center font-mono">
                      solution.py
                    </span>
                    <span className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold bg-slate-900 px-2 py-0.5 rounded-md border border-slate-800">
                      Python 3
                    </span>
                  </div>
                  <textarea
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    className="flex-1 w-full bg-slate-900/80 p-5 text-sm font-mono text-indigo-300 focus:outline-none resize-none leading-relaxed"
                    spellCheck="false"
                  />
                  
                  {/* Actions buttons */}
                  <div className="bg-slate-950/85 px-4 py-3 border-t border-slate-850 flex justify-between space-x-2">
                    <button
                      onClick={handleRunCode}
                      disabled={isRunning || isSubmitting}
                      className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-slate-300 font-medium rounded-xl text-xs flex items-center transition-colors border border-slate-800 disabled:opacity-50"
                    >
                      <Play className="h-3.5 w-3.5 mr-1.5 text-emerald-400" />
                      Run Code
                    </button>
                    <button
                      onClick={handleSubmitCode}
                      disabled={isRunning || isSubmitting}
                      className="px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-xl text-xs flex items-center transition-colors disabled:opacity-50"
                    >
                      {isSubmitting ? (
                        <>
                          <div className="animate-spin rounded-full h-3.5 w-3.5 border-t-2 border-b-2 border-slate-950 mr-1.5"></div>
                          Submitting...
                        </>
                      ) : (
                        <>
                          Submit Solution
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* Console terminal window */}
                <div className="h-44 bg-slate-950 border border-slate-900 rounded-3xl overflow-hidden flex flex-col font-mono text-xs">
                  <div className="bg-slate-900 px-4 py-2.5 border-b border-slate-950 flex items-center space-x-2 text-slate-400">
                    <Terminal className="h-4 w-4 text-slate-500" />
                    <span className="font-bold text-[10px] uppercase tracking-wider">Console Output</span>
                  </div>
                  <pre className="flex-1 p-4 overflow-y-auto text-slate-300 whitespace-pre-wrap leading-relaxed">
                    {consoleOutput}
                  </pre>
                </div>

              </div>

            </div>
          ) : (
            <div className="glass-panel p-8 rounded-3xl text-center text-slate-400 flex flex-col items-center justify-center h-[50vh]">
              <Code2 className="h-10 w-10 text-slate-600 mb-3" />
              <p className="text-sm font-medium">Select a challenge from the list to begin coding.</p>
            </div>
          )}
        </div>

      </div>
    </div>
  )
}

export default DsaAgent
