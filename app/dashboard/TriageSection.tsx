'use client'
import type { SenderRecommendation, TriageAction } from '@/lib/types'

interface Props {
  title: string
  emoji: string
  recommendations: SenderRecommendation[]
  onMove: (senderEmail: string, toAction: TriageAction) => void
}

export default function TriageSection({ title, emoji, recommendations, onMove }: Props) {
  if (recommendations.length === 0) return null

  return (
    <section className="space-y-2">
      <h2 className="text-lg font-semibold text-gray-800">
        {emoji} {title}{' '}
        <span className="text-gray-400 font-normal text-sm">({recommendations.length})</span>
      </h2>
      <div className="space-y-2">
        {recommendations.map(rec => (
          <div
            key={rec.sender.email}
            className="flex items-center justify-between bg-white border border-gray-200 rounded-lg px-4 py-3"
          >
            <div className="min-w-0">
              <p className="font-medium text-gray-900 truncate">{rec.sender.name}</p>
              <p className="text-sm text-gray-500 truncate">{rec.sender.email}</p>
              <p className="text-xs text-gray-400 mt-0.5">{rec.reason}</p>
            </div>
            <div className="flex gap-2 ml-4 shrink-0">
              {rec.action !== 'keep' && (
                <button
                  onClick={() => onMove(rec.sender.email, 'keep')}
                  className="text-xs px-2 py-1 rounded border border-gray-300 hover:bg-gray-50"
                >
                  Keep
                </button>
              )}
              {rec.action !== 'archive' && (
                <button
                  onClick={() => onMove(rec.sender.email, 'archive')}
                  className="text-xs px-2 py-1 rounded border border-gray-300 hover:bg-gray-50"
                >
                  Archive
                </button>
              )}
              {rec.action !== 'unsubscribe' && (
                <button
                  onClick={() => onMove(rec.sender.email, 'unsubscribe')}
                  className="text-xs px-2 py-1 rounded border border-red-200 text-red-600 hover:bg-red-50"
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
