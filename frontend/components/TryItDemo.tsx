'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Loader2, Play, CheckCircle2, XCircle, Sparkles, AlertCircle } from 'lucide-react'
import { toast } from 'sonner'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000'

type JobStatus = {
  job_id: string
  status: string
  progress: number
  completed_chunks: number
  total_chunks: number
  result?: number | null
  detail?: string | null
}

export default function TryItDemo() {
  const [isRunning, setIsRunning] = useState(false)
  const [jobId, setJobId] = useState<string | null>(null)
  const [status, setStatus] = useState<string>('idle')
  const [progress, setProgress] = useState<number>(0)
  const [result, setResult] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [completedChunks, setCompletedChunks] = useState<number>(0)
  const [totalChunks, setTotalChunks] = useState<number>(4)
  const [isWarming, setIsWarming] = useState(false)
  const [apiHealthy, setApiHealthy] = useState(true)

  // Check API health on mount
  useEffect(() => {
    const checkHealth = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/healthz`, { 
          method: 'GET',
          signal: AbortSignal.timeout(5000)
        })
        setApiHealthy(response.ok)
        if (!response.ok) {
          setIsWarming(true)
        }
      } catch (err) {
        setApiHealthy(false)
        setIsWarming(true)
      }
    }
    checkHealth()
  }, [])

  const runDemo = async () => {
    setIsRunning(true)
    setError(null)
    setStatus('pending')
    setProgress(0)
    setResult(null)
    setCompletedChunks(0)
    setTotalChunks(4)

    try {
      // Show warming banner if API might be cold
      if (!apiHealthy) {
        setIsWarming(true)
      }

      const response = await fetch(`${API_BASE_URL}/v1/jobs/demo`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ n: 1000, chunks: 4 }),
      })

      if (response.status === 429) {
        const retryAfter = response.headers.get('Retry-After')
        toast.error('Rate limit exceeded', {
          description: retryAfter 
            ? `Please wait ${retryAfter} seconds before trying again`
            : 'You\'ve made too many requests. Please wait a moment.'
        })
        throw new Error('Rate limit exceeded')
      }

      if (!response.ok) {
        throw new Error('Failed to create job')
      }

      // If successful, API is warmed up
      if (response.ok) {
        setIsWarming(false)
        setApiHealthy(true)
      }

      const data = await response.json()
      setJobId(data.job_id)
      setStatus(data.status)

      const pollInterval = setInterval(async () => {
        try {
          const statusResponse = await fetch(`${API_BASE_URL}/v1/jobs/demo/${data.job_id}`)
          
          if (!statusResponse.ok) {
            throw new Error('Failed to fetch job status')
          }

          const statusData: JobStatus = await statusResponse.json()
          
          setStatus(statusData.status)
          setProgress(statusData.progress)
          setCompletedChunks(statusData.completed_chunks)
          setTotalChunks(statusData.total_chunks)

          if (statusData.status === 'completed') {
            setResult(statusData.result ?? null)
            setIsRunning(false)
            clearInterval(pollInterval)
          } else if (statusData.status === 'failed') {
            setError(statusData.detail || 'Job failed')
            setIsRunning(false)
            clearInterval(pollInterval)
          }
        } catch (err: any) {
          setError(err.message)
          setIsRunning(false)
          clearInterval(pollInterval)
        }
      }, 1000)

      setTimeout(() => {
        clearInterval(pollInterval)
        if (isRunning) {
          setError('Demo timed out')
          setIsRunning(false)
        }
      }, 60000)

    } catch (err: any) {
      setError(err.message)
      setIsRunning(false)
      setStatus('idle')
    }
  }

  const progressPercentage = Math.round(progress * 100)

  return (
    <Card className="border-slate-800/50 bg-gradient-to-br from-slate-900/95 to-slate-800/95 backdrop-blur-xl shadow-2xl">
      {isWarming && (
        <div className="bg-yellow-500/10 border-b border-yellow-500/20 px-4 py-3">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-yellow-400 flex-shrink-0" />
            <p className="text-xs text-yellow-300">
              <strong className="font-semibold">Warming up server...</strong> First request may take 30-60s on free tier. Please wait.
            </p>
          </div>
        </div>
      )}
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500/20 to-purple-500/20">
            <Sparkles className="h-5 w-5 text-blue-400" />
          </div>
          <div>
            <CardTitle className="text-xl md:text-2xl font-bold bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent">
              Try It Now
            </CardTitle>
            <CardDescription className="text-slate-400 mt-1">
              Run a sample computation without signing up
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="p-4 rounded-lg bg-blue-500/10 border border-blue-500/20">
          <p className="text-sm text-blue-300">
            <strong className="font-semibold">Demo:</strong> Calculate sum from 1 to 1000 using 4 parallel workers
          </p>
          <p className="text-xs text-blue-200/70 mt-1">
            Expected result: <strong className="font-semibold">500,500</strong>
          </p>
        </div>

        <Button
          onClick={runDemo}
          disabled={isRunning}
          className="w-full h-12 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-semibold"
        >
          {isRunning ? (
            <>
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              Running Demo...
            </>
          ) : (
            <>
              <Play className="mr-2 h-5 w-5" />
              Run Demo
            </>
          )}
        </Button>

        {status !== 'idle' && (
          <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {status === 'completed' ? (
                  <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                ) : status === 'failed' ? (
                  <XCircle className="h-5 w-5 text-red-400" />
                ) : (
                  <Loader2 className="h-5 w-5 text-blue-400 animate-spin" />
                )}
                <span className={`text-sm font-semibold capitalize ${
                  status === 'completed' ? 'text-emerald-400' :
                  status === 'failed' ? 'text-red-400' :
                  'text-blue-400'
                }`}>
                  {status}
                </span>
              </div>
              <span className="text-2xl font-bold text-white">{progressPercentage}%</span>
            </div>

            <div className="space-y-2">
              <Progress value={progressPercentage} className="h-3 bg-slate-950/80" />
              <div className="flex justify-between text-xs text-slate-400">
                <span>Chunks: {completedChunks}/{totalChunks}</span>
                <span>{progressPercentage}% complete</span>
              </div>
              {/* Visual chunk bars */}
              <div className="flex gap-1 mt-2">
                {Array.from({ length: totalChunks }).map((_, i) => (
                  <div
                    key={i}
                    className={`flex-1 h-2 rounded-full transition-all ${
                      i < completedChunks
                        ? 'bg-gradient-to-r from-emerald-500 to-blue-500'
                        : 'bg-slate-800'
                    }`}
                  />
                ))}
              </div>
            </div>

            {result !== null && (
              <div className="p-4 rounded-lg bg-gradient-to-br from-emerald-500/10 to-blue-500/10 border border-emerald-500/20">
                <p className="text-xs text-emerald-400 font-semibold mb-1 uppercase tracking-wide">Result</p>
                <p className="text-3xl font-bold bg-gradient-to-r from-emerald-400 to-blue-400 bg-clip-text text-transparent">
                  {result.toLocaleString()}
                </p>
              </div>
            )}

            {error && (
              <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20">
                <p className="text-sm text-red-300">{error}</p>
              </div>
            )}
          </div>
        )}

        <div className="pt-3 border-t border-slate-800">
          <p className="text-xs text-slate-500 text-center">
            Want to try larger computations? <a href="/register" className="text-blue-400 hover:text-blue-300 font-semibold">Sign up free</a>
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
