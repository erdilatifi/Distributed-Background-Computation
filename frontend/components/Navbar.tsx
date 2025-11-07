'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { LogOut, LayoutDashboard, Zap, BookOpen, User, Menu, X, Sparkles, ChevronDown } from 'lucide-react'

export default function Navbar() {
  const [user, setUser] = useState<any>(null)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const router = useRouter()
  const pathname = usePathname()
  const supabase = createClient()

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user ?? null)
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })

    return () => subscription.unsubscribe()
  }, [supabase.auth])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/')
  }

  const navLinks = [
    { href: '/', label: 'Home', icon: Sparkles },
    ...(user ? [{ href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard }] : []),
    { href: '/docs', label: 'Docs', icon: BookOpen },
  ]

  return (
    <>
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        scrolled
          ? 'bg-slate-950/80 backdrop-blur-2xl shadow-2xl shadow-black/20 border-b border-white/5'
          : 'bg-transparent'
      }`}>
        {/* Animated gradient orbs */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-20 -left-20 w-60 h-60 bg-blue-500/20 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '4s' }} />
          <div className="absolute -top-20 -right-20 w-60 h-60 bg-purple-500/20 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '6s' }} />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-40 h-40 bg-pink-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '5s' }} />
        </div>

        {/* Shimmer effect line */}
        <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-blue-400/50 to-transparent">
          <div className="h-full w-1/3 bg-gradient-to-r from-transparent via-white/60 to-transparent animate-shimmer" />
        </div>

        <div className="container mx-auto px-4 md:px-6 relative">
          <div className="flex h-20 items-center justify-between">
            {/* Floating Logo */}
            <Link href="/" className="relative group">
              <div className="absolute -inset-3 bg-gradient-to-r from-blue-500/0 via-purple-500/30 to-pink-500/0 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-all duration-700 group-hover:animate-pulse" />

              <div className="relative flex items-center gap-3">
                {/* Logo with 3D effect */}
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 rounded-2xl blur-md opacity-70 group-hover:opacity-100 transition-all duration-300" />
                  <div className="relative h-12 w-12 rounded-2xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center border border-white/10 group-hover:border-white/20 transition-all duration-300 group-hover:scale-110 group-hover:rotate-6 transform-gpu">
                    <Zap className="h-6 w-6 text-transparent bg-gradient-to-br from-blue-400 via-purple-400 to-pink-400 bg-clip-text" fill="url(#logo-gradient)" />
                    <svg width="0" height="0">
                      <defs>
                        <linearGradient id="logo-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                          <stop offset="0%" stopColor="#60a5fa" />
                          <stop offset="50%" stopColor="#a78bfa" />
                          <stop offset="100%" stopColor="#f472b6" />
                        </linearGradient>
                      </defs>
                    </svg>
                  </div>
                </div>

                <div className="relative">
                  <span className="font-black text-2xl tracking-tight bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent group-hover:from-blue-300 group-hover:via-purple-300 group-hover:to-pink-300 transition-all duration-300">
                    CeleryDemo
                  </span>
                  {/* Floating underline */}
                  <div className="absolute -bottom-1 left-0 right-0 h-0.5 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 scale-x-0 group-hover:scale-x-100 transition-transform duration-500 rounded-full" />
                </div>
              </div>
            </Link>

            {/* Desktop Floating Navigation Pills */}
            <div className="hidden md:flex items-center gap-2">
              {navLinks.map((link, index) => {
                const Icon = link.icon
                const isActive = pathname === link.href
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`group relative px-5 py-2.5 rounded-2xl transition-all duration-300 transform-gpu ${
                      isActive
                        ? 'bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-pink-500/10 scale-105'
                        : 'hover:scale-105 hover:bg-white/5'
                    }`}
                    style={{
                      animationDelay: `${index * 100}ms`,
                      animation: scrolled ? 'slideDown 0.5s ease-out' : 'none'
                    }}
                  >
                    {isActive && (
                      <>
                        <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 via-purple-500/20 to-pink-500/20 rounded-2xl blur-lg" />
                        <div className="absolute inset-0 border border-white/10 rounded-2xl" />
                      </>
                    )}

                    <div className="relative flex items-center gap-2">
                      <Icon className={`h-4 w-4 transition-all duration-300 ${
                        isActive
                          ? 'text-blue-400 group-hover:rotate-12'
                          : 'text-slate-400 group-hover:text-white group-hover:scale-110'
                      }`} />
                      <span className={`text-sm font-bold transition-colors duration-300 ${
                        isActive
                          ? 'bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent'
                          : 'text-slate-400 group-hover:text-white'
                      }`}>
                        {link.label}
                      </span>
                    </div>

                    {!isActive && (
                      <div className="absolute inset-0 bg-gradient-to-r from-blue-500/0 via-purple-500/5 to-pink-500/0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    )}
                  </Link>
                )
              })}
            </div>

            {/* Desktop Auth Section */}
            <div className="hidden md:flex items-center gap-3">
              {user ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="relative group outline-none">
                      <div className="absolute -inset-1 bg-gradient-to-r from-blue-500/50 via-purple-500/50 to-pink-500/50 rounded-2xl blur-md opacity-0 group-hover:opacity-100 transition-all duration-300" />
                      <div className="relative flex items-center gap-3 px-4 py-2.5 rounded-2xl bg-gradient-to-r from-slate-900/90 to-slate-800/90 border border-white/10 backdrop-blur-sm hover:border-white/20 transition-all duration-300 group-hover:scale-105 transform-gpu cursor-pointer">
                        <div className="relative">
                          <div className="absolute inset-0 bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 rounded-full blur-sm opacity-70 animate-pulse" />
                          <div className="relative h-9 w-9 rounded-full bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 flex items-center justify-center ring-2 ring-white/10 group-hover:ring-white/20 transition-all duration-300">
                            <User className="h-4 w-4 text-white" />
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="flex flex-col">
                            <span className="text-xs text-slate-500 font-bold uppercase tracking-wider">Active</span>
                            <span className="text-sm text-white font-bold max-w-[140px] truncate">
                              {user?.email?.split('@')[0] || 'User'}
                            </span>
                          </div>
                          <ChevronDown className="h-4 w-4 text-slate-400 group-hover:text-white transition-colors duration-300" />
                        </div>
                      </div>
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent 
                    align="end" 
                    className="w-64 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 border-white/10 backdrop-blur-xl shadow-2xl shadow-black/50 mt-2"
                  >
                    <DropdownMenuLabel className="font-normal">
                      <div className="flex flex-col space-y-2 p-2">
                        <div className="flex items-center gap-3">
                          <div className="relative">
                            <div className="absolute inset-0 bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 rounded-full blur-sm opacity-70" />
                            <div className="relative h-12 w-12 rounded-full bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 flex items-center justify-center ring-2 ring-white/10">
                              <User className="h-6 w-6 text-white" />
                            </div>
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-bold text-white">Signed in as</p>
                            <p className="text-xs text-slate-400 truncate">{user?.email}</p>
                          </div>
                        </div>
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator className="bg-white/10" />
                    <DropdownMenuItem 
                      onClick={handleSignOut}
                      className="cursor-pointer focus:bg-red-500/10 focus:text-red-400 text-slate-300 hover:text-red-400 transition-colors duration-200"
                    >
                      <LogOut className="mr-2 h-4 w-4" />
                      <span className="font-semibold">Sign Out</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <>
                  <Button
                    variant="ghost"
                    size="sm"
                    asChild
                    className="relative px-5 py-2.5 rounded-2xl text-slate-300 hover:text-white border border-white/5 hover:border-white/20 transition-all duration-300 font-bold group overflow-hidden hover:scale-105 transform-gpu"
                  >
                    <Link href="/login">
                      <div className="absolute inset-0 bg-gradient-to-r from-blue-500/0 via-purple-500/5 to-pink-500/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                      <span className="relative">Sign In</span>
                    </Link>
                  </Button>

                  {/* Premium Floating CTA */}
                  <Button
                    size="sm"
                    asChild
                    className="relative px-6 py-2.5 rounded-2xl bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 hover:from-blue-600 hover:via-purple-600 hover:to-pink-600 text-white border-0 shadow-xl shadow-purple-500/50 hover:shadow-2xl hover:shadow-pink-500/50 transition-all duration-300 font-black group overflow-hidden hover:scale-110 transform-gpu"
                  >
                    <Link href="/register">
                      <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/30 to-white/0 translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-700" />
                      <Sparkles className="h-4 w-4 mr-2 relative animate-pulse" />
                      <span className="relative">Get Started</span>
                    </Link>
                  </Button>
                </>
              )}
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden relative p-2.5 rounded-2xl border border-white/10 hover:border-white/20 bg-slate-900/50 backdrop-blur-sm transition-all duration-300 group hover:scale-105 transform-gpu"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              {mobileMenuOpen ? (
                <X className="h-5 w-5 text-white relative" />
              ) : (
                <Menu className="h-5 w-5 text-white relative" />
              )}
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-xl"
            onClick={() => setMobileMenuOpen(false)}
          />

          <div className="absolute top-20 left-4 right-4 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-3xl border border-white/10 shadow-2xl shadow-black/50 overflow-hidden animate-in slide-in-from-top-5 duration-300">
            {/* Gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 via-purple-500/10 to-pink-500/10 pointer-events-none" />

            <div className="relative p-6 space-y-3">
              {navLinks.map((link, index) => {
                const Icon = link.icon
                const isActive = pathname === link.href
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center gap-3 p-4 rounded-2xl transition-all duration-300 group ${
                      isActive
                        ? 'bg-gradient-to-r from-blue-500/20 via-purple-500/20 to-pink-500/20 border border-white/10'
                        : 'hover:bg-white/5 border border-transparent hover:border-white/10'
                    }`}
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    <div className={`p-2 rounded-xl ${
                      isActive
                        ? 'bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500'
                        : 'bg-slate-800 group-hover:bg-slate-700'
                    } transition-all duration-300`}>
                      <Icon className="h-5 w-5 text-white" />
                    </div>
                    <span className={`font-bold transition-colors duration-300 ${
                      isActive
                        ? 'bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent'
                        : 'text-slate-300 group-hover:text-white'
                    }`}>
                      {link.label}
                    </span>
                  </Link>
                )
              })}

              <div className="h-px bg-gradient-to-r from-transparent via-white/10 to-transparent my-4" />

              {user ? (
                <>
                  <div className="flex items-center gap-3 p-4 rounded-2xl bg-slate-800/50 border border-white/5">
                    <div className="relative">
                      <div className="absolute inset-0 bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 rounded-full blur-sm opacity-70" />
                      <div className="relative h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 flex items-center justify-center">
                        <User className="h-5 w-5 text-white" />
                      </div>
                    </div>
                    <div className="flex-1">
                      <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">Signed in as</p>
                      <p className="text-sm text-white font-bold truncate">{user?.email || 'User'}</p>
                    </div>
                  </div>
                  <Button
                    onClick={() => {
                      handleSignOut()
                      setMobileMenuOpen(false)
                    }}
                    variant="ghost"
                    className="w-full justify-start gap-3 p-4 rounded-2xl text-red-400 hover:text-red-300 hover:bg-red-500/10 border border-transparent hover:border-red-500/20 transition-all duration-300 font-bold"
                  >
                    <LogOut className="h-5 w-5" />
                    Sign Out
                  </Button>
                </>
              ) : (
                <div className="space-y-3">
                  <Button
                    asChild
                    variant="ghost"
                    className="w-full justify-start gap-3 p-4 rounded-2xl text-slate-300 hover:text-white hover:bg-white/5 border border-white/5 hover:border-white/20 transition-all duration-300 font-bold"
                  >
                    <Link href="/login" onClick={() => setMobileMenuOpen(false)}>
                      Sign In
                    </Link>
                  </Button>
                  <Button
                    asChild
                    className="w-full justify-center gap-2 p-4 rounded-2xl bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 hover:from-blue-600 hover:via-purple-600 hover:to-pink-600 text-white border-0 shadow-xl shadow-purple-500/50 transition-all duration-300 font-black"
                  >
                    <Link href="/register" onClick={() => setMobileMenuOpen(false)}>
                      <Sparkles className="h-5 w-5 animate-pulse" />
                      Get Started
                    </Link>
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <style jsx global>{`
        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes shimmer {
          0% {
            transform: translateX(-100%);
          }
          100% {
            transform: translateX(300%);
          }
        }

        .animate-shimmer {
          animation: shimmer 3s infinite;
        }
      `}</style>
    </>
  )
}
