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

  if (status === 'loading') {
    return <div className="p-8 text-center text-gray-500">Loading...</div>
  }

  return (
    <main className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900">Gmail Triage</h1>
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-500">{session?.user?.email}</span>
          <button onClick={() => signOut()} className="text-sm text-gray-500 hover:text-gray-700">
            Sign out
          </button>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
        {!report && (
          <div className="text-center space-y-4">
            <p className="text-gray-600">
              Ready to clean your inbox? We'll scan your last 500 emails.
            </p>
            <button
              onClick={scan}
              disabled={scanning}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 transition"
            >
              {scanning ? 'Scanning...' : 'Scan My Inbox'}
            </button>
          </div>
        )}

        {report && (
          <>
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-500">
                Scanned {report.totalEmails} emails · {report.recommendations.length} senders analyzed
              </p>
              <button onClick={scan} disabled={scanning} className="text-sm text-blue-600 hover:underline">
                Rescan
              </button>
            </div>

            <TriageSection
              title="Recommended Unsubscribe"
              emoji="🔴"
              recommendations={sorted.unsubscribe}
              onMove={moveAction}
            />
            <TriageSection
              title="Recommended Archive"
              emoji="🟡"
              recommendations={sorted.archive}
              onMove={moveAction}
            />
            <TriageSection
              title="Keep in Inbox"
              emoji="🟢"
              recommendations={sorted.keep}
              onMove={moveAction}
            />

            {applyResult && (
              <div className="p-4 rounded-lg bg-green-50 border border-green-200 text-green-800 text-sm">
                Done! {applyResult.succeeded} senders processed.
                {applyResult.failed > 0 && ` ${applyResult.failed} failed — check manually.`}
              </div>
            )}

            <button
              onClick={apply}
              disabled={applying}
              className="w-full py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 transition"
            >
              {applying
                ? 'Applying...'
                : `Apply Triage (${sorted.unsubscribe.length + sorted.archive.length} actions)`}
            </button>
          </>
        )}
      </div>
    </main>
  )
}
