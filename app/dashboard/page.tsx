'use client'
import { useSession, signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState, useCallback } from 'react'
import TriageSection from './TriageSection'
import type { TriageReport, SenderRecommendation, TriageAction } from '@/lib/types'

export default function Dashboard() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [report, setReport] = useState<TriageReport | null>(null)
  const [overrides, setOverrides] = useState<Record<string, TriageAction>>({})
  const [scanning, setScanning] = useState(false)
  const [applying, setApplying] = useState(false)
  const [applyResult, setApplyResult] = useState<{ succeeded: number; failed: number } | null>(null)

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/')
  }, [status, router])

  const scan = useCallback(async () => {
    setScanning(true)
    setApplyResult(null)
    try {
      const res = await fetch('/api/triage/scan')
      const data: TriageReport = await res.json()
      setReport(data)
      setOverrides({})
    } finally {
      setScanning(false)
    }
  }, [])

  const moveAction = (senderEmail: string, toAction: TriageAction) => {
    setOverrides(prev => ({ ...prev, [senderEmail]: toAction }))
  }

  const getEffectiveAction = (rec: SenderRecommendation): TriageAction =>
    overrides[rec.sender.email] ?? rec.action

  const apply = async () => {
    if (!report) return
    setApplying(true)
    try {
      const instructions = report.recommendations
        .filter(r => getEffectiveAction(r) !== 'keep')
        .map(r => ({
          senderEmail: r.sender.email,
          action: getEffectiveAction(r),
          labelName: r.labelName,
        }))

      const unsubHeaders: Record<string, string> = {}
      for (const rec of report.recommendations) {
        if (rec.sender.listUnsubscribeHeader) {
          unsubHeaders[rec.sender.email] = rec.sender.listUnsubscribeHeader
        }
      }

      const res = await fetch('/api/triage/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ instructions, unsubHeaders }),
      })
      const result = await res.json()
      setApplyResult({ succeeded: result.succeeded.length, failed: result.failed.length })
    } finally {
      setApplying(false)
    }
  }

  const sorted = {
    unsubscribe: report?.recommendations.filter(r => getEffectiveAction(r) === 'unsubscribe') ?? [],
    archive: report?.recommendations.filter(r => getEffectiveAction(r) === 'archive') ?? [],
    keep: report?.recommendations.filter(r => getEffectiveAction(r) === 'keep') ?? [],
  }

  const totalActions = sorted.unsubscribe.length + sorted.archive.length

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-[#09090b] flex items-center justify-center">
        <div className="w-5 h-5 rounded-full border-2 border-zinc-700 border-t-zinc-300 animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#09090b] text-white">
      {/* nav */}
      <header className="border-b border-white/[0.06] px-6 py-4 flex items-center justify-between sticky top-0 bg-[#09090b]/80 backdrop-blur-sm z-10">
        <span className="font-semibold text-white tracking-tight">Mailstill</span>
        <div className="flex items-center gap-4">
          <span className="text-sm text-zinc-500">{session?.user?.email}</span>
          <button
            onClick={() => signOut()}
            className="text-sm text-zinc-500 hover:text-zinc-300 transition-colors"
          >
            Sign out
          </button>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-10 space-y-8">

        {/* scan prompt */}
        {!report && (
          <div className="relative rounded-2xl border border-white/[0.06] bg-white/[0.02] overflow-hidden p-8 text-center space-y-5">
            <div className="absolute inset-0 bg-gradient-to-br from-violet-600/5 to-transparent pointer-events-none" />
            <div className="relative space-y-2">
              <h2 className="text-2xl font-semibold text-white">Ready to distill your inbox?</h2>
              <p className="text-zinc-500 text-sm">
                We'll scan your last 500 emails and use Claude AI to surface what to cut.
              </p>
            </div>
            <button
              onClick={scan}
              disabled={scanning}
              className="relative inline-flex items-center gap-2 px-6 py-2.5 bg-white text-zinc-900 rounded-xl font-medium text-sm hover:bg-zinc-100 disabled:opacity-50 transition-all"
            >
              {scanning ? (
                <>
                  <span className="w-4 h-4 rounded-full border-2 border-zinc-400 border-t-zinc-800 animate-spin" />
                  Scanning…
                </>
              ) : (
                'Scan My Inbox'
              )}
            </button>
          </div>
        )}

        {/* results */}
        {report && (
          <>
            {/* stats bar */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 text-sm text-zinc-500">
                <span>{report.totalEmails} emails scanned</span>
                <span className="w-1 h-1 rounded-full bg-zinc-700" />
                <span>{report.recommendations.length} senders analyzed</span>
              </div>
              <button
                onClick={scan}
                disabled={scanning}
                className="text-sm text-zinc-500 hover:text-zinc-300 transition-colors disabled:opacity-50"
              >
                {scanning ? 'Scanning…' : 'Rescan'}
              </button>
            </div>

            <TriageSection
              title="Unsubscribe"
              color="red"
              recommendations={sorted.unsubscribe}
              onMove={moveAction}
            />
            <TriageSection
              title="Archive"
              color="amber"
              recommendations={sorted.archive}
              onMove={moveAction}
            />
            <TriageSection
              title="Keep"
              color="emerald"
              recommendations={sorted.keep}
              onMove={moveAction}
            />

            {applyResult && (
              <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm">
                <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0" />
                <span>
                  Done — {applyResult.succeeded} senders processed.
                  {applyResult.failed > 0 && ` ${applyResult.failed} failed, check manually.`}
                </span>
              </div>
            )}

            <button
              onClick={apply}
              disabled={applying || totalActions === 0}
              className="w-full py-3 rounded-xl font-medium text-sm bg-white text-zinc-900 hover:bg-zinc-100 disabled:opacity-40 transition-all"
            >
              {applying ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 rounded-full border-2 border-zinc-400 border-t-zinc-800 animate-spin" />
                  Applying…
                </span>
              ) : (
                `Apply ${totalActions} action${totalActions !== 1 ? 's' : ''}`
              )}
            </button>
          </>
        )}
      </div>
    </div>
  )
}
