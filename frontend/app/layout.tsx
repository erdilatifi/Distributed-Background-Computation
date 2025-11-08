import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { Toaster } from 'sonner'
import '../styles/globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'CeleryDemo - Distributed Task Processing with FastAPI & Next.js',
  description: 'Real-time distributed computing platform built with FastAPI, Celery, Next.js, and Supabase. Process large computations with parallel workers and live progress tracking.',
  keywords: ['distributed computing', 'task processing', 'FastAPI', 'Celery', 'Next.js', 'Supabase', 'background jobs', 'parallel processing'],
  authors: [{ name: 'CeleryDemo' }],
  openGraph: {
    title: 'CeleryDemo - Distributed Task Processing',
    description: 'Real-time distributed computing platform with FastAPI, Celery, and Next.js',
    type: 'website',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        {children}
        <Toaster richColors position="top-right" />
      </body>
    </html>
  )
}
