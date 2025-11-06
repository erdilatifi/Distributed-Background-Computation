import Head from "next/head"
import { FormEvent, useCallback, useEffect, useMemo, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import { Loader2, Play, CheckCircle2, XCircle, Clock } from "lucide-react"

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

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000"
const POLL_INTERVAL_MS = 1000

export default function HomePage() {
  const [n, setN] = useState<number>(1_000)
  const [chunks, setChunks] = useState<number>(4)
  const [jobId, setJobId] = useState<string | null>(null)
  const [status, setStatus] = useState<string>("idle")
  const [progress, setProgress] = useState<number>(0)
  const [completedChunks, setCompletedChunks] = useState<number>(0)
  const [totalChunks, setTotalChunks] = useState<number>(0)
  const [result, setResult] = useState<number | null>(null)
  const [detail, setDetail] = useState<string>("Submit a job to begin.")
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false)

  const pollRef = useRef<NodeJS.Timeout | null>(null)

  const resetState = () => {
    setStatus("pending")
    setProgress(0)
    setCompletedChunks(0)
    setTotalChunks(0)
    setResult(null)
    setDetail("Job submitted; waiting for workers.")
    setError(null)
  }

  const fetchJobStatus = useCallback(async () => {
    if (!jobId) {
      return
    }
    try {
      const response = await fetch(`${API_BASE_URL}/jobs/${jobId}`)
      if (!response.ok) {
        throw new Error(`Failed to load job status (HTTP ${response.status})`)
      }
      const payload: JobStatusResponse = await response.json()
      setStatus(payload.status)
      setProgress(payload.progress)
      setCompletedChunks(payload.completed_chunks)
      setTotalChunks(payload.total_chunks)
      setResult(payload.result ?? null)
      setDetail(
        payload.detail ??
          (payload.status === "completed"
            ? "Job completed successfully."
            : "Processing job..."),
      )

      if (payload.status === "failed") {
        setError(payload.detail ?? "Job failed. Check worker logs for details.")
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unexpected error while polling job status.",
      )
    }
  }, [jobId])

  useEffect(() => {
    if (!jobId || ["completed", "failed"].includes(status)) {
      if (pollRef.current) {
        clearInterval(pollRef.current)
        pollRef.current = null
      }
      return
    }

    pollRef.current = setInterval(fetchJobStatus, POLL_INTERVAL_MS)
    fetchJobStatus()

    return () => {
      if (pollRef.current) {
        clearInterval(pollRef.current)
        pollRef.current = null
      }
    }
  }, [jobId, status, fetchJobStatus])

  const progressPercentage = useMemo(() => Math.round(progress * 100), [progress])

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setIsSubmitting(true)
    resetState()

    const payload: JobRequestPayload = {
      n: Math.max(1, Math.floor(n)),
      chunks: Math.max(1, Math.floor(chunks)),
    }

    try {
      const response = await fetch(`${API_BASE_URL}/jobs`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        throw new Error(`Unable to create job (HTTP ${response.status})`)
      }

      const body: JobCreatedResponse = await response.json()
      setJobId(body.job_id)
      setDetail("Job queued. Polling for progress...")
      setStatus(body.status)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to create job.")
      setStatus("failed")
    } finally {
      setIsSubmitting(false)
    }
  }

  const getStatusIcon = (): JSX.Element => {
    switch (status) {
      case "completed":
        return <CheckCircle2 className="h-5 w-5 text-emerald-400" /> as JSX.Element
      case "failed":
        return <XCircle className="h-5 w-5 text-destructive" /> as JSX.Element
      case "running":
        return <Loader2 className="h-5 w-5 text-primary animate-spin" /> as JSX.Element
      case "pending":
        return <Clock className="h-5 w-5 text-amber-400" /> as JSX.Element
      default:
        return <Clock className="h-5 w-5 text-muted-foreground" /> as JSX.Element
    }
  }

  return (
    <>
      <Head>
        <title>Distributed Sum Demo</title>
        <meta
          name="description"
          content="Distributed computation demo using FastAPI, Celery, and Redis."
        />
      </Head>
      <main className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 px-6 py-12">
        <div className="w-full max-w-4xl space-y-6">
          <div className="text-center space-y-2">
            <h1 className="text-4xl font-bold tracking-tight text-white sm:text-5xl">
              Distributed Background Computation
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Submit a range sum job that will be split into Celery tasks. Follow progress in
              real-time while workers crunch the numbers.
            </p>
          </div>

          <Card className="border-slate-800 bg-slate-900/70 backdrop-blur">
            <CardHeader>
              <CardTitle>Job Configuration</CardTitle>
              <CardDescription>
                Configure your distributed computation job parameters
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="n">Upper bound (n)</Label>
                    <Input
                      id="n"
                      type="number"
                      min={1}
                      value={n}
                      onChange={(event) => setN(Number(event.target.value))}
                      placeholder="1000"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="chunks">Chunks</Label>
                    <Input
                      id="chunks"
                      type="number"
                      min={1}
                      value={chunks}
                      onChange={(event) => setChunks(Number(event.target.value))}
                      placeholder="4"
                      required
                    />
                  </div>
                </div>

                <Button type="submit" disabled={isSubmitting} className="w-full" size="lg">
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    <>
                      <Play className="mr-2 h-4 w-4" />
                      Start Job
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>

          <Card className="border-slate-800 bg-slate-900/70 backdrop-blur">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {getStatusIcon()}
                  <CardTitle className="text-xl">
                    Status: <span className="capitalize">{status}</span>
                  </CardTitle>
                </div>
                <div className="text-sm text-muted-foreground">
                  Chunks {completedChunks}/{Math.max(totalChunks, 1)}
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Progress</span>
                  <span className="font-semibold">{progressPercentage}%</span>
                </div>
                <Progress value={progressPercentage} className="h-3" />
              </div>

              <Card className="bg-slate-950/50 border-slate-800">
                <CardHeader>
                  <CardTitle className="text-lg">Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-sm text-muted-foreground">{detail}</p>
                  {result !== null && (
                    <div className="pt-2 border-t border-slate-800">
                      <p className="text-base font-medium text-emerald-400">
                        Result: <span className="font-bold text-xl">{result.toLocaleString()}</span>
                      </p>
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
                <Card className="border-destructive/50 bg-destructive/10">
                  <CardHeader>
                    <CardTitle className="text-destructive flex items-center gap-2">
                      <XCircle className="h-5 w-5" />
                      Something went wrong
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-destructive-foreground">{error}</p>
                  </CardContent>
                </Card>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </>
  )
}
