'use client'
import { signIn, useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

export default function Home() {
  const { status } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (status === 'authenticated') router.push('/dashboard')
  }, [status, router])

  return (
    <main className="min-h-screen bg-[#09090b] text-white flex flex-col items-center justify-center px-4 relative overflow-hidden">
      {/* background glow */}
      <div className="absolute top-[-20%] left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-violet-600/10 rounded-full blur-[120px] pointer-events-none" />

      <div className="relative z-10 max-w-lg w-full text-center space-y-8">
        {/* badge */}
        <div className="space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-white/10 bg-white/5 text-xs text-zinc-400 mb-2">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block" />
            Powered by Claude AI
          </div>
          <h1 className="text-5xl font-bold tracking-tight bg-gradient-to-br from-white via-white to-zinc-400 bg-clip-text text-transparent">
            Mailstill
          </h1>
          <p className="text-zinc-400 text-lg leading-relaxed">
            Distill your inbox to what matters.<br />
            Unsubscribe, archive, and organize — in minutes.
          </p>
        </div>

        {/* features */}
        <div className="grid gap-2 text-left">
          {[
            { dot: 'bg-red-400', label: 'Unsubscribe', desc: 'Low open-rate newsletters you never read' },
            { dot: 'bg-amber-400', label: 'Archive', desc: 'Notifications auto-sorted into smart labels' },
            { dot: 'bg-emerald-400', label: 'Keep', desc: 'Human emails front and center' },
          ].map(({ dot, label, desc }) => (
            <div key={label} className="flex items-start gap-3 px-4 py-3 rounded-xl bg-white/[0.03] border border-white/[0.06]">
              <span className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${dot}`} />
              <div>
                <span className="text-sm font-medium text-zinc-200">{label}</span>
                <span className="text-sm text-zinc-500 ml-2">{desc}</span>
              </div>
            </div>
          ))}
        </div>

        {/* sign in */}
        <div className="space-y-3">
          <button
            onClick={() => signIn('google', { callbackUrl: '/dashboard' })}
            disabled={status === 'loading'}
            className="w-full flex items-center justify-center gap-3 px-6 py-3 bg-white text-zinc-900 rounded-xl font-medium hover:bg-zinc-100 disabled:opacity-50 transition-all duration-150 shadow-lg shadow-white/5"
          >
            <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            {status === 'loading' ? 'Loading...' : 'Continue with Google'}
          </button>
          <p className="text-xs text-zinc-600">
            Uses your own API keys · No data stored on our servers
          </p>
        </div>
      </div>
    </main>
  )
}
