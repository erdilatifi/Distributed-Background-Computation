'use client'

import { useEffect, useState, FormEvent, useCallback, useMemo, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import Navbar from '@/components/Navbar'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Progress } from '@/components/ui/progress'
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from '@/components/ui/pagination'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Loader2, Play, CheckCircle2, XCircle, Clock, History, TrendingUp, Award, RotateCcw, Trash2, RefreshCw, AlertTriangle } from 'lucide-react'

type JobRequestPayload = {
  n: number
  chunks: number
}

type JobCreatedResponse = {
  job_id: string
  status: string
}

type JobStatusResponse = {
  job_id: string
  status: string
  progress: number
  completed_chunks: number
  total_chunks: number
  result?: number | null
  detail?: string | null
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000'
const POLL_INTERVAL_MS = 1000

export default function DashboardPage() {
  const router = useRouter()
  const supabase = createClient()
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  
  const [n, setN] = useState<string>('1000')
  const [chunks, setChunks] = useState<string>('4')
  const [nError, setNError] = useState<string | null>(null)
  const [chunksError, setChunksError] = useState<string | null>(null)
  const [jobId, setJobId] = useState<string | null>(null)
  const [status, setStatus] = useState<string>('idle')
  const [progress, setProgress] = useState<number>(0)
  const [completedChunks, setCompletedChunks] = useState<number>(0)
  const [totalChunks, setTotalChunks] = useState<number>(0)
  const [result, setResult] = useState<number | null>(null)
  const [detail, setDetail] = useState<string>('Submit a job to begin.')
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false)
  
  // Job history and stats
  const [jobHistory, setJobHistory] = useState<any[]>([])
  const [userStats, setUserStats] = useState<any>(null)
  const [loadingHistory, setLoadingHistory] = useState(true)
  const [historyError, setHistoryError] = useState<string | null>(null)
  const [statsError, setStatsError] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const jobsPerPage = 4

  const pollRef = useRef<NodeJS.Timeout | null>(null)

  // Fetch job history and stats
  const fetchJobHistory = useCallback(async () => {
    if (!user) {
      console.log('No user found, skipping job history fetch')
      return
    }
    
    console.log('Fetching job history for user:', user.id)
    setHistoryError(null)
    
    try {
      const { data, error } = await supabase
        .from('jobs')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
      
      if (error) {
        console.error('Supabase query error:', error)
        setHistoryError(`Database error: ${error.message}`)
        setJobHistory([])
      } else {
        console.log('Job history fetched successfully:', data?.length || 0, 'jobs')
        setJobHistory(data || [])
      }
    } catch (err: any) {
      console.error('Failed to fetch job history:', err)
      setHistoryError(`Failed to load history: ${err.message || 'Unknown error'}`)
      setJobHistory([])
    } finally {
      setLoadingHistory(false)
    }
  }, [user, supabase])

  const fetchUserStats = useCallback(async () => {
    if (!user) {
      console.log('No user found, skipping stats fetch')
      return
    }
    
    console.log('Fetching user stats for user:', user.id)
    setStatsError(null)
    
    try {
      const { data, error } = await supabase
        .from('jobs')
        .select('status, duration_ms, total_chunks')
        .eq('user_id', user.id)
      
      if (error) {
        console.error('Supabase stats query error:', error)
        setStatsError(`Database error: ${error.message}`)
        setUserStats(null)
        return
      }
      
      console.log('Stats data fetched:', data?.length || 0, 'jobs')
      
      const stats = {
        totalJobs: data?.length || 0,
        completedJobs: data?.filter(j => j.status === 'completed').length || 0,
        failedJobs: data?.filter(j => j.status === 'failed').length || 0,
        avgDuration: data && data.length > 0 ? data.reduce((acc, j) => acc + (j.duration_ms || 0), 0) / data.length : 0,
        totalChunks: data?.reduce((acc, j) => acc + (j.total_chunks || 0), 0) || 0
      }
      
      console.log('Computed stats:', stats)
      setUserStats(stats)
    } catch (err: any) {
      console.error('Failed to fetch stats:', err)
      setStatsError(`Failed to load stats: ${err.message || 'Unknown error'}`)
      setUserStats(null)
    }
  }, [user, supabase])

  useEffect(() => {
    const checkUser = async () => {
      console.log('Checking user authentication...')
      const { data: { user }, error } = await supabase.auth.getUser()
      
      if (error) {
        console.error('Auth error:', error)
      }
      
      if (!user) {
        console.log('No authenticated user, redirecting to login')
        router.push('/login')
      } else {
        console.log('User authenticated:', user.id, user.email)
        setUser(user)
        setLoading(false)
      }
    }
    checkUser()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      console.log('Auth state changed:', _event, session?.user?.email)
      if (!session) {
        router.push('/login')
      } else {
        setUser(session.user)
      }
    })

    return () => subscription.unsubscribe()
  }, [router, supabase])

  // Fetch history and stats when user is loaded
  useEffect(() => {
    if (user) {
      fetchJobHistory()
      fetchUserStats()
    }
  }, [user, fetchJobHistory, fetchUserStats])

  const resetState = () => {
    setStatus('pending')
    setProgress(0)
    setCompletedChunks(0)
    setTotalChunks(0)
    setResult(null)
    setDetail('Job submitted; waiting for workers.')
    setError(null)
  }

  const resetJobForm = () => {
    setJobId(null)
    setStatus('idle')
    setProgress(0)
    setCompletedChunks(0)
    setTotalChunks(0)
    setResult(null)
    setDetail('Submit a job to begin.')
    setError(null)
    setN(1_000)
    setChunks(4)
  }

  const refreshData = async () => {
    setLoadingHistory(true)
    await Promise.all([fetchJobHistory(), fetchUserStats()])
  }

  const clearAllHistory = async () => {
    if (!user) return
    
    try {
      setLoadingHistory(true)
      const { error } = await supabase
        .from('jobs')
        .delete()
        .eq('user_id', user.id)
      
      if (error) {
        console.error('Failed to clear history:', error)
        setHistoryError('Failed to clear history. Please try again.')
      } else {
        setJobHistory([])
        await fetchUserStats()
        setDeleteDialogOpen(false)
      }
    } catch (err) {
      console.error('Error clearing history:', err)
      setHistoryError('Failed to clear history. Please try again.')
    } finally {
      setLoadingHistory(false)
    }
  }

  const fetchJobStatus = useCallback(async (token: string) => {
    if (!jobId) return

    try {
      const response = await fetch(`${API_BASE_URL}/jobs/${jobId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      
      if (!response.ok) {
        throw new Error(`Failed to load job status (HTTP ${response.status})`)
      }
      
      const payload: JobStatusResponse = await response.json()
      
      if (payload.status === 'completed' || payload.status === 'failed') {
        setStatus(payload.status)
        setProgress(payload.progress)
        setCompletedChunks(payload.completed_chunks)
        setTotalChunks(payload.total_chunks)
        setResult(payload.result ?? null)
        setDetail(payload.detail ?? 'Job finished.')
        
        // Refresh history and stats when job completes
        fetchJobHistory()
        fetchUserStats()
        
        if (pollRef.current) {
          clearInterval(pollRef.current)
          pollRef.current = null
        }
      } else {
        setStatus(payload.status)
        setProgress(payload.progress)
        setCompletedChunks(payload.completed_chunks)
        setTotalChunks(payload.total_chunks)
        setDetail(payload.detail ?? 'Processing...')
      }
    } catch (err: any) {
      console.error('Error fetching job status:', err)
      setError(err.message)
      if (pollRef.current) {
        clearInterval(pollRef.current)
        pollRef.current = null
      }
    }
  }, [jobId, supabase, fetchJobHistory, fetchUserStats])

  useEffect(() => {
    if (!jobId || !user || ['completed', 'failed'].includes(status)) {
      if (pollRef.current) {
        clearInterval(pollRef.current)
        pollRef.current = null
      }
      return
    }

    const poll = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (session?.access_token) {
        await fetchJobStatus(session.access_token)
      }
    }

    pollRef.current = setInterval(poll, POLL_INTERVAL_MS)
    poll()

    return () => {
      if (pollRef.current) {
        clearInterval(pollRef.current)
        pollRef.current = null
      }
    }
  }, [jobId, user, status, fetchJobStatus, supabase])

  const progressPercentage = useMemo(() => Math.round(progress * 100), [progress])

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setIsSubmitting(true)
    setError(null)
    
    // Validate inputs before submission
    if (nError || chunksError) {
      setError('Please fix the validation errors before submitting.')
      setIsSubmitting(false)
      return
    }
    
    // Parse and validate the string values
    const nValue = parseInt(n, 10)
    const chunksValue = parseInt(chunks, 10)
    
    if (isNaN(nValue) || isNaN(chunksValue)) {
      setError('Please enter valid numbers.')
      setIsSubmitting(false)
      return
    }
    
    if (nValue < 1 || chunksValue < 1) {
      setError('Both values must be at least 1.')
      setIsSubmitting(false)
      return
    }
    
    resetState()

    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        setError('You must be logged in to submit a job.')
        setIsSubmitting(false)
        return
      }

      const payload: JobRequestPayload = { n: nValue, chunks: chunksValue }
      const response = await fetch(`${API_BASE_URL}/jobs`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify(payload)
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.detail || 'Failed to submit job')
      }

      const data: JobCreatedResponse = await response.json()
      setJobId(data.job_id)
      setStatus(data.status)
      setIsSubmitting(false)
      
      // Refresh history and stats immediately after job submission
      fetchJobHistory()
      fetchUserStats()
    } catch (err: any) {
      setError(err.message)
      setIsSubmitting(false)
    }
  }

  const getStatusIcon = (): JSX.Element => {
    switch (status) {
      case 'completed':
        return <CheckCircle2 className="h-5 w-5 text-emerald-400" />
      case 'failed':
        return <XCircle className="h-5 w-5 text-destructive" />
      case 'running':
        return <Loader2 className="h-5 w-5 text-primary animate-spin" />
      case 'pending':
        return <Clock className="h-5 w-5 text-amber-400" />
      default:
        return <Clock className="h-5 w-5 text-muted-foreground" />
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-950 relative overflow-hidden">
      {/* Subtle background effect */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-900/10 via-transparent to-transparent" />
      
      <div className="relative z-10">
        <Navbar />
        
        <main className="container mx-auto px-4 pt-24 pb-12">
          <div className="max-w-6xl mx-auto space-y-8">
            {/* Header */}
            <div className="text-center space-y-3 md:space-y-4">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-400 text-xs md:text-sm font-semibold">
                <Play className="w-3 h-3 md:w-4 md:h-4" />
                Real-time Processing
              </div>
              <h1 className="text-3xl sm:text-4xl md:text-6xl font-bold tracking-tight text-white">
                Dashboard
              </h1>
              <p className="text-sm md:text-lg text-slate-400 max-w-2xl mx-auto px-4">
                Submit jobs and track progress in real-time
              </p>
            </div>

          {/* Job Configuration Card */}
          <Card className="border-slate-800 bg-slate-900/50 backdrop-blur-sm">
            <CardHeader className="space-y-1 pb-4 md:pb-6">
              <CardTitle className="text-xl md:text-2xl font-bold text-white">Job Configuration</CardTitle>
              <CardDescription className="text-slate-400">
                Configure your distributed computation job parameters
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-4">
                  <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
                    <p className="text-sm text-blue-300">
                      <strong className="font-semibold">What this calculates:</strong> Sum of all integers from 1 to n
                    </p>
                    <p className="text-xs text-blue-200/70 mt-1">
                      Example: n=250 → 1+2+3+...+250 = <strong className="font-semibold">31,375</strong>
                    </p>
                  </div>

                  <div className="grid gap-6 sm:grid-cols-2">
                    <div className="space-y-3 group">
                      <Label htmlFor="n" className="text-sm font-semibold text-slate-300">Upper bound (n)</Label>
                      <Input
                        id="n"
                        type="text"
                        value={n}
                        onChange={(event) => {
                          const value = event.target.value
                          setN(value)
                          
                          // Validate input
                          if (value === '') {
                            setNError('Please enter a number')
                          } else if (!/^\d+$/.test(value)) {
                            setNError('Only positive integers are allowed')
                          } else if (parseInt(value, 10) < 1) {
                            setNError('Number must be at least 1')
                          } else if (parseInt(value, 10) > 1000000000) {
                            setNError('Number is too large (max: 1,000,000,000)')
                          } else {
                            setNError(null)
                          }
                        }}
                        placeholder="1000"
                        className={`h-12 bg-slate-950/50 border-slate-700/50 focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 transition-all duration-300 ${
                          nError ? 'border-red-500/50 focus:border-red-500/50 focus:ring-red-500/20' : ''
                        }`}
                      />
                      {nError ? (
                        <p className="text-xs text-red-400 mt-1 flex items-center gap-1">
                          <span className="inline-block">⚠️</span>
                          {nError}
                        </p>
                      ) : (
                        <p className="text-xs text-slate-400 mt-1">Calculate sum from 1 to this number</p>
                      )}
                    </div>

                    <div className="space-y-3 group">
                      <Label htmlFor="chunks" className="text-sm font-semibold text-slate-300">Chunks</Label>
                      <Input
                        id="chunks"
                        type="text"
                        value={chunks}
                        onChange={(event) => {
                          const value = event.target.value
                          setChunks(value)
                          
                          // Validate input
                          if (value === '') {
                            setChunksError('Please enter a number')
                          } else if (!/^\d+$/.test(value)) {
                            setChunksError('Only positive integers are allowed')
                          } else if (parseInt(value, 10) < 1) {
                            setChunksError('Number must be at least 1')
                          } else if (parseInt(value, 10) > 1024) {
                            setChunksError('Maximum 1024 chunks allowed')
                          } else {
                            setChunksError(null)
                          }
                        }}
                        placeholder="4"
                        className={`h-12 bg-slate-950/50 border-slate-700/50 focus:border-purple-500/50 focus:ring-2 focus:ring-purple-500/20 transition-all duration-300 ${
                          chunksError ? 'border-red-500/50 focus:border-red-500/50 focus:ring-red-500/20' : ''
                        }`}
                      />
                      {chunksError ? (
                        <p className="text-xs text-red-400 mt-1 flex items-center gap-1">
                          <span className="inline-block">⚠️</span>
                          {chunksError}
                        </p>
                      ) : (
                        <p className="text-xs text-slate-400 mt-1">Number of parallel workers to use</p>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-3">
                  <Button 
                    type="submit" 
                    disabled={isSubmitting || !!nError || !!chunksError || n === '' || chunks === ''} 
                    className="w-full sm:flex-1 h-12 md:h-14 bg-blue-600 hover:bg-blue-500 text-white font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    size="lg"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 md:h-5 md:w-5 animate-spin" />
                        <span className="text-sm md:text-base">Submitting...</span>
                      </>
                    ) : (
                      <>
                        <Play className="mr-2 h-4 w-4 md:h-5 md:w-5" />
                        <span className="text-sm md:text-base">Start Job</span>
                      </>
                    )}
                  </Button>
                  
                  {(jobId || status !== 'idle') && (
                    <Button 
                      type="button"
                      onClick={resetJobForm}
                      variant="outline"
                      className="w-full sm:w-auto h-12 md:h-14 border-slate-700 hover:border-orange-500 hover:bg-orange-500/10 hover:text-orange-400 transition-all"
                      size="lg"
                    >
                      <RotateCcw className="h-4 w-4 md:h-5 md:w-5 mr-2 sm:mr-0" />
                      <span className="sm:hidden">Reset</span>
                    </Button>
                  )}
                </div>
              </form>
            </CardContent>
          </Card>

          {/* Premium Progress Card */}
          <Card className="border-slate-800/50 bg-gradient-to-br from-slate-900/95 via-slate-900/80 to-slate-800/95 backdrop-blur-2xl shadow-2xl shadow-black/30 hover:shadow-purple-500/10 transition-all duration-500 animate-in fade-in slide-in-from-bottom-4 delay-300">
            <CardHeader className="pb-4 md:pb-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3 md:gap-4">
                  <div className={`relative p-2 md:p-3 rounded-xl transition-all duration-500 ${
                    status === 'completed' ? 'bg-gradient-to-br from-emerald-500/20 to-emerald-600/20 shadow-lg shadow-emerald-500/20' :
                    status === 'failed' ? 'bg-gradient-to-br from-red-500/20 to-red-600/20 shadow-lg shadow-red-500/20' :
                    status === 'running' ? 'bg-gradient-to-br from-blue-500/20 to-blue-600/20 shadow-lg shadow-blue-500/20 animate-pulse' :
                    'bg-gradient-to-br from-amber-500/20 to-amber-600/20 shadow-lg shadow-amber-500/20'
                  }`}>
                    <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-white/10 to-transparent" />
                    <div className="relative">{getStatusIcon()}</div>
                  </div>
                  <div>
                    <CardTitle className="text-2xl md:text-3xl font-bold">
                      <span className={`capitalize bg-gradient-to-r bg-clip-text text-transparent ${
                        status === 'completed' ? 'from-emerald-400 to-emerald-300' :
                        status === 'failed' ? 'from-red-400 to-red-300' :
                        status === 'running' ? 'from-blue-400 to-purple-400' :
                        'from-amber-400 to-amber-300'
                      }`}>{status}</span>
                    </CardTitle>
                    <p className="text-xs md:text-sm text-slate-400 mt-1 md:mt-1.5 font-medium">
                      {status === 'idle' ? 'Ready to process' :
                       status === 'pending' ? 'Queued for processing' :
                       status === 'running' ? 'Processing in progress' :
                       status === 'completed' ? 'Job completed successfully' :
                       'Job failed'}
                    </p>
                  </div>
                </div>
                <div className="text-left sm:text-right w-full sm:w-auto">
                  <div className="text-4xl md:text-5xl font-bold bg-gradient-to-br from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">{progressPercentage}%</div>
                  <div className="text-xs md:text-sm text-slate-400 mt-1 md:mt-2 font-medium">
                    {completedChunks}/{Math.max(totalChunks, 1)} chunks
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6 md:space-y-8">
              {/* Premium Progress Bar */}
              <div className="space-y-3 md:space-y-4">
                <div className="relative">
                  <Progress value={progressPercentage} className="h-4 md:h-5 bg-slate-950/80 border border-slate-800/50 shadow-inner" />
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-pink-500/10 rounded-full pointer-events-none" />
                </div>
                <div className="flex justify-between text-[10px] md:text-xs text-slate-500 font-medium px-1">
                  <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-blue-500" />Started</span>
                  <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-purple-500" />In Progress</span>
                  <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />Complete</span>
                </div>
              </div>

              {/* Details Card */}
              <Card className="bg-gradient-to-br from-slate-950/80 to-slate-900/80 border-slate-800/50 shadow-xl backdrop-blur-sm">
                <CardHeader className="pb-3 md:pb-4">
                  <CardTitle className="text-lg md:text-xl font-bold bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent">Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 md:space-y-4">
                  <p className="text-xs md:text-sm text-slate-300 leading-relaxed">{detail}</p>
                  {result !== null && (
                    <div className="pt-4 md:pt-6 mt-4 md:mt-6 border-t border-slate-700/50">
                      <div className="relative overflow-hidden rounded-lg md:rounded-2xl bg-gradient-to-br from-emerald-500/10 via-blue-500/10 to-purple-500/10 border border-emerald-500/20 p-4 md:p-6 shadow-2xl shadow-emerald-500/10">
                        <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent" />
                        <div className="relative space-y-2 md:space-y-3">
                          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                            <div className="flex-1">
                              <p className="text-xs md:text-sm text-emerald-400 font-semibold mb-1 md:mb-2 uppercase tracking-wide">Final Result</p>
                              <p className="text-3xl md:text-4xl lg:text-5xl font-bold bg-gradient-to-r from-emerald-400 via-blue-400 to-purple-400 bg-clip-text text-transparent break-all">
                                {result.toLocaleString()}
                              </p>
                              <p className="text-[10px] md:text-xs text-slate-400 mt-1 md:mt-2">
                                Sum of 1 to {n} = {n} × {parseInt(n, 10) + 1} ÷ 2 = {result.toLocaleString()}
                              </p>
                            </div>
                            <div className="relative hidden sm:block">
                              <div className="absolute inset-0 bg-emerald-500/20 rounded-full blur-xl" />
                              <CheckCircle2 className="relative w-12 h-12 md:w-16 md:h-16 text-emerald-400" />
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                  {jobId && (
                    <div className="pt-2 border-t border-slate-800">
                      <p className="text-xs text-muted-foreground">
                        Job ID: <span className="font-mono text-foreground">{jobId}</span>
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {error && (
                <Card className="border-red-500/30 bg-gradient-to-br from-red-500/10 to-red-600/10 backdrop-blur-sm shadow-lg shadow-red-500/10 animate-in fade-in slide-in-from-bottom-2">
                  <CardHeader>
                    <CardTitle className="text-red-400 flex items-center gap-2 font-bold">
                      <div className="p-2 rounded-lg bg-red-500/20">
                        <XCircle className="h-5 w-5" />
                      </div>
                      Something went wrong
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-red-300/90 leading-relaxed">{error}</p>
                  </CardContent>
                </Card>
              )}
            </CardContent>
          </Card>

          {/* User Statistics Cards */}
          {statsError && (
            <Card className="border-amber-500/30 bg-gradient-to-br from-amber-500/10 to-amber-600/10 backdrop-blur-sm shadow-lg shadow-amber-500/10">
              <CardContent className="pt-6">
                <p className="text-sm text-amber-300 flex items-center gap-2">
                  <XCircle className="h-4 w-4" />
                  {statsError}
                </p>
              </CardContent>
            </Card>
          )}
          {userStats && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-4 delay-500">
              <Card className="border-slate-800/50 bg-gradient-to-br from-blue-500/10 to-blue-600/10 backdrop-blur-xl shadow-xl hover:shadow-blue-500/20 transition-all duration-300">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-semibold text-slate-300 flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-blue-400" />
                    Total Jobs
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-4xl font-bold bg-gradient-to-r from-blue-400 to-blue-300 bg-clip-text text-transparent">
                    {userStats.totalJobs}
                  </div>
                  <p className="text-xs text-slate-400 mt-2">
                    {userStats.completedJobs} completed · {userStats.failedJobs} failed
                  </p>
                </CardContent>
              </Card>

              <Card className="border-slate-800/50 bg-gradient-to-br from-emerald-500/10 to-emerald-600/10 backdrop-blur-xl shadow-xl hover:shadow-emerald-500/20 transition-all duration-300">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-semibold text-slate-300 flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                    Success Rate
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-4xl font-bold bg-gradient-to-r from-emerald-400 to-emerald-300 bg-clip-text text-transparent">
                    {userStats.totalJobs > 0 ? Math.round((userStats.completedJobs / userStats.totalJobs) * 100) : 0}%
                  </div>
                  <p className="text-xs text-slate-400 mt-2">
                    {userStats.completedJobs} of {userStats.totalJobs} jobs
                  </p>
                </CardContent>
              </Card>

              <Card className="border-slate-800/50 bg-gradient-to-br from-purple-500/10 to-purple-600/10 backdrop-blur-xl shadow-xl hover:shadow-purple-500/20 transition-all duration-300">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-semibold text-slate-300 flex items-center gap-2">
                    <Award className="h-4 w-4 text-purple-400" />
                    Chunks Processed
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-4xl font-bold bg-gradient-to-r from-purple-400 to-purple-300 bg-clip-text text-transparent">
                    {userStats.totalChunks.toLocaleString()}
                  </div>
                  <p className="text-xs text-slate-400 mt-2">
                    Avg: {Math.round(userStats.avgDuration)}ms per job
                  </p>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Job History */}
          <Card className="border-slate-800 bg-slate-900/50">
            <CardHeader>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <CardTitle className="text-xl md:text-2xl font-bold text-white flex items-center gap-2">
                    <History className="h-5 w-5 md:h-6 md:w-6 text-blue-400" />
                    Job History
                  </CardTitle>
                  <CardDescription className="mt-1 text-sm">
                    Your recent jobs
                  </CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={refreshData}
                    variant="outline"
                    size="sm"
                    className="flex-1 sm:flex-none gap-2 border-slate-700 hover:border-blue-500 hover:bg-blue-500/10 rounded"
                  >
                    <RefreshCw className="h-4 w-4" />
                    <span className="text-xs md:text-sm">Refresh</span>
                  </Button>
                  {jobHistory.length > 0 && (
                    <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                      <DialogTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1 sm:flex-none gap-2 border-slate-700 hover:border-red-500 hover:bg-red-500/10 hover:text-red-400 rounded"
                        >
                          <Trash2 className="h-4 w-4" />
                          <span className="text-xs md:text-sm">Clear All</span>
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="sm:max-w-[425px] bg-slate-900 border-slate-700 rounded">
                        <DialogHeader>
                          <DialogTitle className="flex items-center gap-2 text-lg">
                            <div className="p-2 rounded bg-red-500/20">
                              <span className="text-red-400 text-lg">⚠️</span>
                            </div>
                            Delete All Job History
                          </DialogTitle>
                          <DialogDescription className="text-slate-400 pt-2 text-sm">
                            This will permanently remove all your job records and statistics. This action cannot be undone.
                          </DialogDescription>
                        </DialogHeader>
                        <DialogFooter className="gap-2 sm:gap-0 flex-col sm:flex-row">
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => setDeleteDialogOpen(false)}
                            className="border-slate-700 hover:bg-slate-800 rounded w-full sm:w-auto"
                          >
                            Cancel
                          </Button>
                          <Button
                            type="button"
                            onClick={clearAllHistory}
                            className="bg-red-600 hover:bg-red-500 text-white rounded w-full sm:w-auto"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete All
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {loadingHistory ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-blue-400" />
                </div>
              ) : historyError ? (
                <div className="text-center py-8">
                  <div className="p-4 rounded-lg bg-amber-500/10 border border-amber-500/30">
                    <XCircle className="h-8 w-8 mx-auto mb-2 text-amber-400" />
                    <p className="text-sm text-amber-300">{historyError}</p>
                    <p className="text-xs text-slate-400 mt-2">Check browser console for details</p>
                  </div>
                </div>
              ) : jobHistory.length === 0 ? (
                <div className="text-center py-8 text-slate-400">
                  <History className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>No jobs yet. Submit your first job above!</p>
                </div>
              ) : (
                <>
                  <div className="space-y-3">
                    {jobHistory.slice((currentPage - 1) * jobsPerPage, currentPage * jobsPerPage).map((job) => (
                      <div
                        key={job.id}
                        className="p-4 rounded-lg bg-slate-950/50 border border-slate-800/50 hover:border-slate-700/50 transition-all duration-300 group"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-lg ${
                              job.status === 'completed' ? 'bg-emerald-500/20' :
                              job.status === 'failed' ? 'bg-red-500/20' :
                              job.status === 'running' ? 'bg-blue-500/20' :
                              'bg-amber-500/20'
                            }`}>
                              {job.status === 'completed' ? <CheckCircle2 className="h-4 w-4 text-emerald-400" /> :
                               job.status === 'failed' ? <XCircle className="h-4 w-4 text-red-400" /> :
                               job.status === 'running' ? <Loader2 className="h-4 w-4 text-blue-400 animate-spin" /> :
                               <Clock className="h-4 w-4 text-amber-400" />}
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-semibold text-white">n={job.n.toLocaleString()}</span>
                                <span className="text-slate-500">·</span>
                                <span className="text-sm text-slate-400">{job.chunks} chunks</span>
                              </div>
                              <div className="text-xs text-slate-500 mt-1">
                                {new Date(job.created_at).toLocaleString()}
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className={`text-sm font-semibold capitalize ${
                              job.status === 'completed' ? 'text-emerald-400' :
                              job.status === 'failed' ? 'text-red-400' :
                              job.status === 'running' ? 'text-blue-400' :
                              'text-amber-400'
                            }`}>
                              {job.status}
                            </div>
                            {job.result && (
                              <div className="text-xs text-slate-400 mt-1">
                                Result: {job.result.toLocaleString()}
                              </div>
                            )}
                            {job.duration_ms && (
                              <div className="text-xs text-slate-500 mt-1">
                                {job.duration_ms}ms
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  {/* Pagination */}
                  {jobHistory.length > jobsPerPage && (
                    <div className="mt-6">
                      <Pagination>
                        <PaginationContent>
                          <PaginationItem>
                            <PaginationPrevious 
                              href="#"
                              onClick={(e) => {
                                e.preventDefault()
                                setCurrentPage(prev => Math.max(1, prev - 1))
                              }}
                              className={currentPage === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                            />
                          </PaginationItem>
                          
                          {Array.from({ length: Math.ceil(jobHistory.length / jobsPerPage) }, (_, i) => i + 1).map((page) => (
                            <PaginationItem key={page}>
                              <PaginationLink
                                href="#"
                                onClick={(e) => {
                                  e.preventDefault()
                                  setCurrentPage(page)
                                }}
                                isActive={currentPage === page}
                                className="cursor-pointer"
                              >
                                {page}
                              </PaginationLink>
                            </PaginationItem>
                          ))}
                          
                          <PaginationItem>
                            <PaginationNext 
                              href="#"
                              onClick={(e) => {
                                e.preventDefault()
                                setCurrentPage(prev => Math.min(Math.ceil(jobHistory.length / jobsPerPage), prev + 1))
                              }}
                              className={currentPage === Math.ceil(jobHistory.length / jobsPerPage) ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                            />
                          </PaginationItem>
                        </PaginationContent>
                      </Pagination>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
      </div>
    </div>
  )
}
