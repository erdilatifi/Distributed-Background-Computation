import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Zap, Shield, BarChart3, Rocket, CheckCircle2, ArrowRight, Users, Database, Sparkles, TrendingUp, Code2, Globe, Layers, Terminal } from 'lucide-react'
import Navbar from '@/components/Navbar'

export default function Home() {
  return (
    <div className="min-h-screen bg-slate-950 relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-900/10 via-transparent to-transparent" />

      <div className="relative z-10">
        <Navbar/>

        <section className="container mx-auto px-4 py-20 md:py-32">
          <div className="max-w-6xl mx-auto">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div className="space-y-8 animate-in fade-in slide-in-from-left duration-700">
                <div className="inline-block">
                  <span className="inline-flex items-center px-3 py-1.5 rounded text-xs md:text-sm font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/30">
                    <Sparkles className="w-3 h-3 md:w-4 md:h-4 mr-2" />
                    Production Ready
                  </span>
                </div>

                <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight leading-tight">
                  <span className="text-white">Distributed</span>
                  <br />
                  <span className="text-blue-400">
                    Computing
                  </span>
                  <br />
                  <span className="text-white">Made Simple</span>
                </h1>

                <p className="text-base md:text-lg lg:text-xl text-slate-300 leading-relaxed">
                  Build scalable background job processing with <span className="text-white font-semibold">real-time updates</span> and <span className="text-white font-semibold">enterprise authentication</span>.
                </p>

                <div className="flex flex-col sm:flex-row gap-3 pt-4">
                  <Button size="lg" asChild className="h-12 md:h-14 text-base md:text-lg px-6 md:px-8 bg-blue-600 hover:bg-blue-500 rounded group">
                    <Link href="/register">
                      Get Started Free
                      <ArrowRight className="ml-2 h-4 w-4 md:h-5 md:w-5 group-hover:translate-x-1 transition-transform" />
                    </Link>
                  </Button>
                  <Button size="lg" variant="outline" asChild className="h-12 md:h-14 text-base md:text-lg px-6 md:px-8 border-slate-700 hover:border-slate-600 hover:bg-slate-800 rounded">
                    <Link href="/login">
                      Sign In
                    </Link>
                  </Button>
                </div>

                <div className="flex flex-wrap items-center gap-4 md:gap-6 text-xs md:text-sm text-slate-400 pt-2">
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                    <span>No credit card</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                    <span>Free tier</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                    <span>Open source</span>
                  </div>
                </div>
              </div>

              <div className="relative hidden lg:block">
                <div className="relative bg-slate-900/50 backdrop-blur-sm rounded border border-slate-800 overflow-hidden">
                  <div className="bg-slate-800 px-4 py-3 flex items-center gap-2 border-b border-slate-700">
                    <div className="flex gap-2">
                      <div className="w-3 h-3 rounded-full bg-red-500/80" />
                      <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
                      <div className="w-3 h-3 rounded-full bg-green-500/80" />
                    </div>
                    <span className="text-xs text-slate-500 ml-2">app.py</span>
                  </div>
                  <div className="p-4 md:p-6 font-mono text-xs md:text-sm space-y-2">
                    <div className="text-slate-500"># Start a background task</div>
                    <div className="flex gap-2">
                      <span className="text-purple-400">task</span>
                      <span className="text-slate-300">=</span>
                      <span className="text-blue-400">process_data</span>
                      <span className="text-slate-300">.</span>
                      <span className="text-yellow-400">delay</span>
                      <span className="text-slate-300">(</span>
                      <span className="text-green-400">&quot;large_dataset&quot;</span>
                      <span className="text-slate-300">)</span>
                    </div>
                    <div className="h-4" />
                    <div className="text-slate-500"># Real-time progress updates</div>
                    <div className="flex gap-2">
                      <span className="text-purple-400">status</span>
                      <span className="text-slate-300">=</span>
                      <span className="text-blue-400">task</span>
                      <span className="text-slate-300">.</span>
                      <span className="text-yellow-400">get_status</span>
                      <span className="text-slate-300">()</span>
                    </div>
                    <div className="flex gap-2 pl-4">
                      <span className="text-slate-500">{`// { progress: 75%, state: 'PROCESSING' }`}</span>
                    </div>
                    <div className="h-4" />
                    <div className="flex items-center gap-2 text-emerald-400">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Task completed successfully</span>
                    </div>
                  </div>
                  <div className="absolute -bottom-4 -right-4 w-32 h-32 bg-blue-500/20 rounded-full blur-3xl" />
                  <div className="absolute -top-4 -left-4 w-32 h-32 bg-cyan-500/20 rounded-full blur-3xl" />
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="container mx-auto px-4 py-16">
          <div className="max-w-6xl mx-auto">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {[
                { icon: TrendingUp, value: 'High', label: 'Availability', color: 'from-blue-500/10 to-blue-600/10 border-blue-500/20' },
                { icon: Zap, value: 'Fast', label: 'Response Times', color: 'from-cyan-500/10 to-cyan-600/10 border-cyan-500/20' },
                { icon: Users, value: 'Production', label: 'Ready Platform', color: 'from-emerald-500/10 to-emerald-600/10 border-emerald-500/20' },
                { icon: Database, value: 'Enterprise', label: 'Grade Security', color: 'from-teal-500/10 to-teal-600/10 border-teal-500/20' },
              ].map((stat, i) => (
                <div key={i} className={`text-center p-6 rounded-2xl bg-gradient-to-br ${stat.color} border backdrop-blur-sm hover:scale-105 transition-transform duration-300`}>
                  <stat.icon className="h-8 w-8 text-blue-400 mx-auto mb-3" />
                  <div className="text-2xl md:text-3xl font-bold text-white mb-2">{stat.value}</div>
                  <div className="text-sm text-slate-400 font-medium">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="container mx-auto px-4 py-24">
          <div className="text-center mb-20">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-sm font-semibold mb-6">
              <Rocket className="w-4 h-4" />
              Powerful Features
            </div>
            <h2 className="text-4xl md:text-6xl font-bold mb-6">
              <span className="bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
                Everything You Need
              </span>
            </h2>
            <p className="text-xl text-slate-300 max-w-3xl mx-auto leading-relaxed">
              Built with modern technologies and best practices for production workloads
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-7xl mx-auto">
            {[
              { icon: Zap, title: 'Real-Time Updates', desc: 'Live progress tracking with automatic updates. Monitor your jobs as they process.' },
              { icon: Shield, title: 'Secure by Default', desc: 'Row-level security, JWT authentication, and rate limiting built-in.' },
              { icon: BarChart3, title: 'Monitoring & Analytics', desc: 'Track job performance, errors, and system health in real-time.' },
              { icon: Rocket, title: 'Scalable Architecture', desc: 'Horizontal scaling with Celery workers and Redis for high throughput.' },
              { icon: CheckCircle2, title: 'Production Ready', desc: 'Docker setup, health checks, error handling, and comprehensive testing.' },
              { icon: Code2, title: 'Type Safe', desc: 'Full TypeScript support with Pydantic models for end-to-end type safety.' },
            ].map((feature, i) => (
              <Card key={i} className="border-slate-800 bg-slate-900/50 backdrop-blur hover:bg-slate-800/50 transition-all duration-300 hover:scale-105 hover:shadow-xl hover:shadow-blue-500/10 group">
                <CardHeader>
                  <div className="relative w-fit">
                    <feature.icon className="h-12 w-12 text-blue-400 mb-4 group-hover:scale-110 transition-transform duration-300" />
                    <div className="absolute inset-0 bg-blue-500/20 blur-xl group-hover:blur-2xl transition-all" />
                  </div>
                  <CardTitle className="text-xl group-hover:text-white transition-colors">{feature.title}</CardTitle>
                  <CardDescription className="text-base leading-relaxed">
                    {feature.desc}
                  </CardDescription>
                </CardHeader>
              </Card>
            ))}
          </div>
        </section>

        <section className="container mx-auto px-4 py-24 bg-gradient-to-b from-transparent via-slate-900/30 to-transparent">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-teal-500/10 border border-teal-500/20 text-teal-400 text-sm font-semibold mb-6">
                <Terminal className="w-4 h-4" />
                Tech Stack
              </div>
              <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
                Built with the Best Tools
              </h2>
              <p className="text-lg text-slate-400">
                Modern, scalable, and maintainable architecture
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-8">
              <Card className="border-slate-800 bg-gradient-to-br from-slate-900/80 to-slate-900/40 backdrop-blur-xl hover:border-blue-500/30 transition-all duration-300">
                <CardHeader>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-blue-500/10 rounded-lg">
                      <Database className="h-6 w-6 text-blue-400" />
                    </div>
                    <CardTitle className="text-2xl">Backend</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {[
                    'FastAPI - Modern Python API framework',
                    'Celery - Distributed task queue',
                    'Redis - Fast in-memory data store',
                    'Supabase - PostgreSQL + Auth + Realtime'
                  ].map((tech, i) => (
                    <div key={i} className="flex items-center gap-3 p-3 rounded-lg bg-slate-800/50 hover:bg-slate-800 transition-colors">
                      <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
                      <span className="text-slate-300">{tech}</span>
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card className="border-slate-800 bg-gradient-to-br from-slate-900/80 to-slate-900/40 backdrop-blur-xl hover:border-cyan-500/30 transition-all duration-300">
                <CardHeader>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-cyan-500/10 rounded-lg">
                      <Globe className="h-6 w-6 text-cyan-400" />
                    </div>
                    <CardTitle className="text-2xl">Frontend</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {[
                    'Next.js 14 - React framework with App Router',
                    'TypeScript - Type-safe development',
                    'Tailwind CSS - Utility-first styling',
                    'shadcn/ui - Beautiful components'
                  ].map((tech, i) => (
                    <div key={i} className="flex items-center gap-3 p-3 rounded-lg bg-slate-800/50 hover:bg-slate-800 transition-colors">
                      <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
                      <span className="text-slate-300">{tech}</span>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        <section className="container mx-auto px-4 py-24">
          <div className="max-w-5xl mx-auto">
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-blue-600/20 via-cyan-600/20 to-teal-600/20 border border-blue-500/30 p-12 md:p-16 text-center backdrop-blur-xl">
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-blue-500/10 via-transparent to-transparent" />
              <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/20 rounded-full blur-3xl" />
              <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-500/20 rounded-full blur-3xl" />

              <div className="relative z-10 space-y-8">
                <div className="inline-block">
                  <span className="inline-flex items-center px-4 py-2 rounded-full text-sm font-semibold bg-white/10 text-white border border-white/20 backdrop-blur-sm">
                    <Sparkles className="w-4 h-4 mr-2" />
                    Start Building Today
                  </span>
                </div>

                <h2 className="text-4xl md:text-5xl font-bold text-white leading-tight">
                  Ready to Scale Your
                  <br />
                  Background Processing?
                </h2>

                <p className="text-xl text-slate-200 max-w-2xl mx-auto">
                  Create your account and start building distributed systems in minutes. No credit card required.
                </p>

                <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
                  <Button size="lg" asChild className="h-14 text-lg px-10 bg-white text-slate-900 hover:bg-slate-100 shadow-2xl hover:scale-105 transition-all duration-300 group">
                    <Link href="/register">
                      Get Started Free
                      <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                    </Link>
                  </Button>
                  <Button size="lg" variant="outline" asChild className="h-14 text-lg px-10 border-white/30 text-white hover:bg-white/10 backdrop-blur-sm">
                    <Link href="/docs">
                      View Documentation
                    </Link>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </section>

        <footer className="border-t border-slate-800/50 backdrop-blur-xl bg-slate-950/50 py-12 mt-20">
          <div className="container mx-auto px-4">
            <div className="flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="flex items-center gap-2">
                <Layers className="h-6 w-6 text-blue-500" />
                <span className="text-lg font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
                  CeleryDemo
                </span>
              </div>
              <p className="text-slate-500 text-center">
                Built with FastAPI, Celery, Next.js, and Supabase
              </p>
              <div className="flex items-center gap-4">
                <Link href="/login" className="text-slate-400 hover:text-white transition-colors">
                  Sign In
                </Link>
                <Link href="/register" className="text-slate-400 hover:text-white transition-colors">
                  Register
                </Link>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </div>
  )
}
