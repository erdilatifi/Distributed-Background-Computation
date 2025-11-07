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
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? 'bg-slate-950/95 backdrop-blur-sm border-b border-slate-800'
          : 'bg-transparent'
      }`}>

        <div className="container mx-auto px-4 md:px-6 relative">
          <div className="flex h-20 items-center justify-between">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-3 group">
              <div className="h-10 w-10 rounded bg-blue-600 flex items-center justify-center group-hover:bg-blue-500 transition-colors">
                <Zap className="h-6 w-6 text-white" />
              </div>
              <span className="font-bold text-xl text-white group-hover:text-blue-400 transition-colors">
                CeleryDemo
              </span>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-1">
              {navLinks.map((link) => {
                const Icon = link.icon
                const isActive = pathname === link.href
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`flex items-center gap-2 px-4 py-2 rounded transition-colors ${
                      isActive
                        ? 'bg-blue-600 text-white'
                        : 'text-slate-400 hover:text-white hover:bg-slate-800'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    <span className="text-sm font-medium">{link.label}</span>
                  </Link>
                )
              })}
            </div>

            {/* Desktop Auth Section */}
            <div className="hidden md:flex items-center gap-3">
              {user ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="flex items-center gap-2 px-3 py-2 rounded bg-slate-800 hover:bg-slate-700 border border-slate-700 transition-colors outline-none">
                      <div className="h-7 w-7 rounded-full bg-blue-600 flex items-center justify-center">
                        <User className="h-4 w-4 text-white" />
                      </div>
                      <span className="text-sm text-white font-medium max-w-[100px] truncate">
                        {user?.email?.split('@')[0] || 'User'}
                      </span>
                      <ChevronDown className="h-3 w-3 text-slate-400" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent 
                    align="end" 
                    className="w-48 bg-slate-900 border-slate-700 rounded mt-1 p-1"
                  >
                    <div className="px-3 py-2 border-b border-slate-700">
                      <p className="text-xs text-slate-500">Signed in as</p>
                      <p className="text-sm text-white truncate">{user?.email}</p>
                    </div>
                    <DropdownMenuItem 
                      onClick={handleSignOut}
                      className="cursor-pointer text-slate-300 hover:text-red-400 hover:bg-slate-800 rounded m-1"
                    >
                      <LogOut className="mr-2 h-4 w-4" />
                      <span>Sign Out</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <>
                  <Button
                    variant="ghost"
                    size="sm"
                    asChild
                    className="text-slate-300 hover:text-white hover:bg-slate-800"
                  >
                    <Link href="/login">Sign In</Link>
                  </Button>

                  <Button
                    size="sm"
                    asChild
                    className="bg-blue-600 hover:bg-blue-500 text-white"
                  >
                    <Link href="/register">
                      <Sparkles className="h-4 w-4 mr-2" />
                      Get Started
                    </Link>
                  </Button>
                </>
              )}
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded bg-slate-800 hover:bg-slate-700 transition-colors"
            >
              {mobileMenuOpen ? (
                <X className="h-5 w-5 text-white" />
              ) : (
                <Menu className="h-5 w-5 text-white" />
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

          <div className="absolute top-20 left-4 right-4 bg-slate-900 rounded-2xl border border-slate-700 shadow-xl overflow-hidden">
            {/* Mobile menu content */}

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
