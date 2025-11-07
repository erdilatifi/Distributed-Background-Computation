'use client'

import Navbar from '@/components/Navbar'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { BookOpen, Code, Zap, Server, Database, CheckCircle2, GitBranch, Shield, Rocket, Users, BarChart, Lock, RefreshCw, Layers, Terminal, FileCode } from 'lucide-react'

export default function DocsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 relative overflow-hidden">
      {/* Premium background effects */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-emerald-900/10 via-transparent to-transparent" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom,_var(--tw-gradient-stops))] from-blue-900/10 via-transparent to-transparent" />
      
      <div className="relative z-10">
        <Navbar />
        
        <main className="container mx-auto px-4 pt-24 pb-16">
        <div className="max-w-5xl mx-auto space-y-8">
          {/* Premium Header */}
          <div className="text-center space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-gradient-to-r from-emerald-500/10 via-blue-500/10 to-purple-500/10 border border-emerald-500/20 text-emerald-400 text-sm font-semibold mb-4 shadow-lg shadow-emerald-500/10 backdrop-blur-sm">
              <BookOpen className="w-4 h-4 animate-pulse" />
              Complete Documentation
            </div>
            <h1 className="text-6xl md:text-7xl font-bold tracking-tight">
              <span className="bg-gradient-to-r from-emerald-400 via-blue-400 to-purple-400 bg-clip-text text-transparent">
                Developer Docs
              </span>
            </h1>
            <p className="text-xl text-slate-300 max-w-3xl mx-auto leading-relaxed">
              Complete guide to building and deploying distributed task processing systems with FastAPI, Celery, Next.js, and Supabase
            </p>
          </div>

          {/* Tech Stack */}
          <Card className="border-slate-800 bg-slate-900/70 backdrop-blur">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5 text-blue-400" />
                Technology Stack
              </CardTitle>
              <CardDescription>
                Built with modern, production-ready technologies
              </CardDescription>
            </CardHeader>
            <CardContent className="grid md:grid-cols-2 gap-4">
              <div className="flex items-start gap-3 p-4 rounded-lg bg-slate-800/50 border border-slate-700/50">
                <Server className="h-5 w-5 text-blue-400 mt-1" />
                <div>
                  <h3 className="font-semibold text-white mb-1">Backend</h3>
                  <p className="text-sm text-slate-400">FastAPI + Python 3.11</p>
                  <p className="text-sm text-slate-400">Celery for distributed tasks</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-4 rounded-lg bg-slate-800/50 border border-slate-700/50">
                <Code className="h-5 w-5 text-purple-400 mt-1" />
                <div>
                  <h3 className="font-semibold text-white mb-1">Frontend</h3>
                  <p className="text-sm text-slate-400">Next.js 14 + React 18</p>
                  <p className="text-sm text-slate-400">TailwindCSS + shadcn/ui</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-4 rounded-lg bg-slate-800/50 border border-slate-700/50">
                <Database className="h-5 w-5 text-emerald-400 mt-1" />
                <div>
                  <h3 className="font-semibold text-white mb-1">Database</h3>
                  <p className="text-sm text-slate-400">Supabase (PostgreSQL)</p>
                  <p className="text-sm text-slate-400">Redis for message broker</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-4 rounded-lg bg-slate-800/50 border border-slate-700/50">
                <Zap className="h-5 w-5 text-amber-400 mt-1" />
                <div>
                  <h3 className="font-semibold text-white mb-1">Infrastructure</h3>
                  <p className="text-sm text-slate-400">Docker + Docker Compose</p>
                  <p className="text-sm text-slate-400">Containerized deployment</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Getting Started */}
          <Card className="border-slate-800 bg-slate-900/70 backdrop-blur">
            <CardHeader>
              <CardTitle>Getting Started</CardTitle>
              <CardDescription>
                Quick start guide to run the application locally
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <div className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-500/20 text-blue-400 text-sm font-semibold mt-0.5">
                    1
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-white mb-1">Clone the Repository</h4>
                    <pre className="bg-slate-950 p-3 rounded-lg text-sm text-slate-300 overflow-x-auto">
                      git clone &lt;repository-url&gt;{'\n'}cd python-project
                    </pre>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-500/20 text-blue-400 text-sm font-semibold mt-0.5">
                    2
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-white mb-1">Configure Environment</h4>
                    <pre className="bg-slate-950 p-3 rounded-lg text-sm text-slate-300 overflow-x-auto">
                      cp .env.example .env{'\n'}# Add your Supabase credentials
                    </pre>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-500/20 text-blue-400 text-sm font-semibold mt-0.5">
                    3
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-white mb-1">Start with Docker</h4>
                    <pre className="bg-slate-950 p-3 rounded-lg text-sm text-slate-300 overflow-x-auto">
                      docker compose up --build
                    </pre>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="flex items-center justify-center w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 text-sm font-semibold mt-0.5">
                    ✓
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-white mb-1">Access the Application</h4>
                    <div className="space-y-2 text-sm text-slate-300">
                      <p>• Frontend: <code className="bg-slate-950 px-2 py-1 rounded">http://localhost:3000</code></p>
                      <p>• Backend API: <code className="bg-slate-950 px-2 py-1 rounded">http://localhost:8000</code></p>
                      <p>• API Docs: <code className="bg-slate-950 px-2 py-1 rounded">http://localhost:8000/docs</code></p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* API Usage */}
          <Card className="border-slate-800 bg-slate-900/70 backdrop-blur">
            <CardHeader>
              <CardTitle>API Usage</CardTitle>
              <CardDescription>
                How to submit and monitor distributed computation jobs
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-semibold text-white mb-2">Submit a Job</h4>
                <pre className="bg-slate-950 p-4 rounded-lg text-sm text-slate-300 overflow-x-auto">
{`POST http://localhost:8000/jobs
Content-Type: application/json
Authorization: Bearer YOUR_JWT_TOKEN

{
  "n": 1000,
  "chunks": 4
}`}
                </pre>
              </div>

              <div>
                <h4 className="font-semibold text-white mb-2">Check Job Status</h4>
                <pre className="bg-slate-950 p-4 rounded-lg text-sm text-slate-300 overflow-x-auto">
{`GET http://localhost:8000/jobs/{job_id}
Authorization: Bearer YOUR_JWT_TOKEN`}
                </pre>
              </div>

              <div className="p-4 rounded-lg bg-blue-500/10 border border-blue-500/20">
                <p className="text-sm text-blue-300">
                  <strong>Tip:</strong> The dashboard provides a user-friendly interface to submit jobs and monitor their progress in real-time.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Features */}
          <Card className="border-slate-800 bg-slate-900/70 backdrop-blur">
            <CardHeader>
              <CardTitle>Key Features</CardTitle>
              <CardDescription>
                What makes this application powerful
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-4">
                {[
                  { icon: CheckCircle2, title: 'Distributed Processing', desc: 'Split large computations across multiple workers' },
                  { icon: CheckCircle2, title: 'Real-time Updates', desc: 'Live progress tracking with automatic polling' },
                  { icon: CheckCircle2, title: 'Secure Authentication', desc: 'Supabase-powered user authentication' },
                  { icon: CheckCircle2, title: 'Modern UI', desc: 'Beautiful, responsive interface with TailwindCSS' },
                  { icon: CheckCircle2, title: 'Docker Ready', desc: 'Fully containerized for easy deployment' },
                  { icon: CheckCircle2, title: 'API Documentation', desc: 'Interactive API docs with FastAPI' },
                ].map((feature, i) => (
                  <div key={i} className="flex items-start gap-3 p-3 rounded-lg hover:bg-slate-800/30 transition-colors">
                    <feature.icon className="h-5 w-5 text-emerald-400 mt-0.5" />
                    <div>
                      <h4 className="font-semibold text-white text-sm">{feature.title}</h4>
                      <p className="text-sm text-slate-400">{feature.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Architecture Overview */}
          <Card className="border-slate-800/50 bg-gradient-to-br from-slate-900/90 to-slate-800/90 backdrop-blur-xl shadow-2xl">
            <CardHeader>
              <CardTitle className="text-2xl font-bold bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent flex items-center gap-2">
                <Layers className="h-6 w-6 text-purple-400" />
                System Architecture
              </CardTitle>
              <CardDescription>
                Understanding the distributed architecture and data flow
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid md:grid-cols-3 gap-4">
                <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/20">
                  <Terminal className="h-8 w-8 text-blue-400 mb-3" />
                  <h4 className="font-bold text-white mb-2">Client Layer</h4>
                  <p className="text-sm text-slate-300">Next.js frontend with real-time updates and auth</p>
                </div>
                <div className="p-4 rounded-xl bg-purple-500/10 border border-purple-500/20">
                  <Server className="h-8 w-8 text-purple-400 mb-3" />
                  <h4 className="font-bold text-white mb-2">API Layer</h4>
                  <p className="text-sm text-slate-300">FastAPI REST endpoints with JWT authentication</p>
                </div>
                <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                  <RefreshCw className="h-8 w-8 text-emerald-400 mb-3" />
                  <h4 className="font-bold text-white mb-2">Worker Layer</h4>
                  <p className="text-sm text-slate-300">Celery workers processing distributed tasks</p>
                </div>
              </div>
              
              <div className="p-6 rounded-xl bg-slate-950/50 border border-slate-700/50">
                <h4 className="font-bold text-white mb-4 flex items-center gap-2">
                  <GitBranch className="h-5 w-5 text-blue-400" />
                  Request Flow
                </h4>
                <div className="space-y-3 text-sm text-slate-300">
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center text-xs font-bold mt-0.5">1</div>
                    <p><strong className="text-white">User submits job</strong> through Next.js dashboard with n and chunks parameters</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-purple-500/20 text-purple-400 flex items-center justify-center text-xs font-bold mt-0.5">2</div>
                    <p><strong className="text-white">FastAPI validates</strong> request, creates job record in Supabase, returns job_id</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-xs font-bold mt-0.5">3</div>
                    <p><strong className="text-white">Celery distributes</strong> chunks across workers via Redis message broker</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center text-xs font-bold mt-0.5">4</div>
                    <p><strong className="text-white">Workers process</strong> chunks in parallel, updating progress in real-time</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-pink-500/20 text-pink-400 flex items-center justify-center text-xs font-bold mt-0.5">5</div>
                    <p><strong className="text-white">Frontend polls</strong> API every second, displays live progress and results</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Security & Authentication */}
          <Card className="border-slate-800/50 bg-gradient-to-br from-slate-900/90 to-slate-800/90 backdrop-blur-xl shadow-2xl">
            <CardHeader>
              <CardTitle className="text-2xl font-bold bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent flex items-center gap-2">
                <Shield className="h-6 w-6 text-blue-400" />
                Security & Authentication
              </CardTitle>
              <CardDescription>
                Enterprise-grade security with Supabase Auth and RLS
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="p-4 rounded-lg bg-slate-950/50 border border-slate-700/50">
                  <Lock className="h-6 w-6 text-blue-400 mb-3" />
                  <h4 className="font-bold text-white mb-2">JWT Authentication</h4>
                  <ul className="space-y-2 text-sm text-slate-300">
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="h-4 w-4 text-emerald-400 mt-0.5" />
                      Supabase Auth with email/password
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="h-4 w-4 text-emerald-400 mt-0.5" />
                      Secure JWT tokens for API access
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="h-4 w-4 text-emerald-400 mt-0.5" />
                      Automatic token refresh
                    </li>
                  </ul>
                </div>
                <div className="p-4 rounded-lg bg-slate-950/50 border border-slate-700/50">
                  <Database className="h-6 w-6 text-purple-400 mb-3" />
                  <h4 className="font-bold text-white mb-2">Row Level Security</h4>
                  <ul className="space-y-2 text-sm text-slate-300">
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="h-4 w-4 text-emerald-400 mt-0.5" />
                      Users can only access their own jobs
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="h-4 w-4 text-emerald-400 mt-0.5" />
                      Database-level security policies
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="h-4 w-4 text-emerald-400 mt-0.5" />
                      Audit logs for compliance
                    </li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Advanced Features */}
          <Card className="border-slate-800/50 bg-gradient-to-br from-slate-900/90 to-slate-800/90 backdrop-blur-xl shadow-2xl">
            <CardHeader>
              <CardTitle className="text-2xl font-bold bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent flex items-center gap-2">
                <Rocket className="h-6 w-6 text-emerald-400" />
                Advanced Features
              </CardTitle>
              <CardDescription>
                Production-ready features for scalable applications
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <div className="flex items-start gap-3 p-3 rounded-lg bg-slate-950/50 border border-slate-700/50">
                    <BarChart className="h-5 w-5 text-blue-400 mt-1" />
                    <div>
                      <h4 className="font-semibold text-white mb-1">Real-time Progress</h4>
                      <p className="text-sm text-slate-400">Live updates with automatic polling and progress bars</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-3 rounded-lg bg-slate-950/50 border border-slate-700/50">
                    <Database className="h-5 w-5 text-purple-400 mt-1" />
                    <div>
                      <h4 className="font-semibold text-white mb-1">Result Caching</h4>
                      <p className="text-sm text-slate-400">Intelligent caching for repeated computations</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-3 rounded-lg bg-slate-950/50 border border-slate-700/50">
                    <Users className="h-5 w-5 text-emerald-400 mt-1" />
                    <div>
                      <h4 className="font-semibold text-white mb-1">User Profiles</h4>
                      <p className="text-sm text-slate-400">Job quotas, statistics, and usage tracking</p>
                    </div>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex items-start gap-3 p-3 rounded-lg bg-slate-950/50 border border-slate-700/50">
                    <RefreshCw className="h-5 w-5 text-amber-400 mt-1" />
                    <div>
                      <h4 className="font-semibold text-white mb-1">Auto Retry</h4>
                      <p className="text-sm text-slate-400">Automatic retry logic for failed chunks</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-3 rounded-lg bg-slate-950/50 border border-slate-700/50">
                    <FileCode className="h-5 w-5 text-pink-400 mt-1" />
                    <div>
                      <h4 className="font-semibold text-white mb-1">Job History</h4>
                      <p className="text-sm text-slate-400">Complete history with results and metrics</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-3 rounded-lg bg-slate-950/50 border border-slate-700/50">
                    <Shield className="h-5 w-5 text-red-400 mt-1" />
                    <div>
                      <h4 className="font-semibold text-white mb-1">Rate Limiting</h4>
                      <p className="text-sm text-slate-400">Per-user throttling and quota management</p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
      </div>
    </div>
  )
}
