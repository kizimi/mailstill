'use client'
import type { SenderRecommendation, TriageAction } from '@/lib/types'

const colorMap = {
  red:     { dot: 'bg-red-400',     badge: 'bg-red-500/10 text-red-400 border-red-500/20' },
  amber:   { dot: 'bg-amber-400',   badge: 'bg-amber-500/10 text-amber-400 border-amber-500/20' },
  emerald: { dot: 'bg-emerald-400', badge: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' },
}

interface Props {
  title: string
  color: 'red' | 'amber' | 'emerald'
  recommendations: SenderRecommendation[]
  onMove: (senderEmail: string, toAction: TriageAction) => void
}

export default function TriageSection({ title, color, recommendations, onMove }: Props) {
  if (recommendations.length === 0) return null

  const { dot, badge } = colorMap[color]

  return (
    <section className="space-y-3">
      <div className="flex items-center gap-2.5">
        <span className={`w-2 h-2 rounded-full shrink-0 ${dot}`} />
        <h2 className="text-sm font-medium text-zinc-300">{title}</h2>
        <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${badge}`}>
          {recommendations.length}
        </span>
      </div>

      <div className="space-y-1.5">
        {recommendations.map(rec => (
          <div
            key={rec.sender.email}
            className="group flex items-center justify-between px-4 py-3 rounded-xl bg-white/[0.03] border border-white/[0.06] hover:bg-white/[0.05] transition-colors"
          >
            <div className="min-w-0 space-y-0.5">
              <p className="text-sm font-medium text-zinc-200 truncate">{rec.sender.name}</p>
              <p className="text-xs text-zinc-500 truncate">{rec.sender.email}</p>
              <p className="text-xs text-zinc-600">{rec.reason}</p>
            </div>

            <div className="flex gap-1.5 ml-4 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
              {rec.action !== 'keep' && (
                <button
                  onClick={() => onMove(rec.sender.email, 'keep')}
                  className="text-xs px-2.5 py-1 rounded-lg border border-white/10 text-zinc-400 hover:text-zinc-200 hover:border-white/20 transition-colors"
                >
                  Keep
                </button>
              )}
              {rec.action !== 'archive' && (
                <button
                  onClick={() => onMove(rec.sender.email, 'archive')}
                  className="text-xs px-2.5 py-1 rounded-lg border border-white/10 text-zinc-400 hover:text-zinc-200 hover:border-white/20 transition-colors"
                >
                  Archive
                </button>
              )}
              {rec.action !== 'unsubscribe' && (
                <button
                  onClick={() => onMove(rec.sender.email, 'unsubscribe')}
                  className="text-xs px-2.5 py-1 rounded-lg border border-red-500/20 text-red-400 hover:bg-red-500/10 transition-colors"
                >
                  Unsub
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
