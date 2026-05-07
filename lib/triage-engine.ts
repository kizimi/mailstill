import Anthropic from '@anthropic-ai/sdk'
import { buildSenderStats } from '@/lib/gmail'
import type {
  GmailMessage,
  SenderStats,
  SenderRecommendation,
  TriageReport,
  TriageAction,
} from '@/lib/types'

export function computeSenderTriage(
  sender: SenderStats
): Omit<SenderRecommendation, 'sender'> {
  const { readRate, emailsPerWeek, listUnsubscribeHeader } = sender

  if (readRate < 0.05 && listUnsubscribeHeader) {
    return {
      action: 'unsubscribe',
      reason: `Open rate is only ${Math.round(readRate * 100)}% — you almost never read these. Unsubscribe link found.`,
    }
  }

  if (readRate < 0.2 && emailsPerWeek >= 1) {
    return {
      action: 'archive',
      labelName: 'Triage/Low-Priority',
      reason: `Low open rate (${Math.round(readRate * 100)}%) with ${emailsPerWeek.toFixed(1)} emails/week. Archiving to keep inbox clean.`,
    }
  }

  if (readRate >= 0.5) {
    return {
      action: 'keep',
      reason: `You read ${Math.round(readRate * 100)}% of these — keeping in inbox.`,
    }
  }

  return {
    action: 'archive',
    labelName: 'Triage/Review',
    reason: `Moderate open rate (${Math.round(readRate * 100)}%). Archiving for later review.`,
  }
}

export async function analyzeWithClaude(
  senderStats: SenderStats[]
): Promise<SenderRecommendation[]> {
  const client = new Anthropic()

  const prompt = `You are an email inbox organizer. Analyze these email senders and recommend an action for each.

For each sender, choose one of:
- "unsubscribe": newsletters/promotions the user clearly ignores (very low open rate)
- "archive": automated emails worth keeping but not in inbox (receipts, notifications, low-priority)
- "keep": real human emails or high-value content the user regularly reads

For "archive" senders, also suggest a Gmail label name (e.g. "Finance/Receipts", "Dev/GitHub", "Shopping/Orders").

Respond with a JSON array only, no other text. Each item: { "email": string, "action": "unsubscribe"|"archive"|"keep", "labelName": string|null, "reason": string }

Sender data:
${JSON.stringify(
  senderStats.map(s => ({
    email: s.email,
    name: s.name,
    totalCount: s.totalCount,
    readRate: Math.round(s.readRate * 100) + '%',
    emailsPerWeek: s.emailsPerWeek.toFixed(1),
    hasUnsubscribeLink: !!s.listUnsubscribeHeader,
    sampleSubjects: s.sampleSubjects,
  })),
  null,
  2
)}`

  try {
    const response = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 4096,
      messages: [{ role: 'user', content: prompt }],
    })

    const text = response.content[0].type === 'text' ? response.content[0].text : ''
    const jsonMatch = text.match(/\[[\s\S]*\]/)
    if (!jsonMatch) throw new Error('No JSON array in response')

    const parsed: Array<{
      email: string
      action: TriageAction
      labelName: string | null
      reason: string
    }> = JSON.parse(jsonMatch[0])

    return parsed.map(item => {
      const sender = senderStats.find(s => s.email === item.email)!
      return {
        sender,
        action: item.action,
        labelName: item.labelName ?? undefined,
        reason: item.reason,
      }
    })
  } catch {
    return senderStats.map(sender => ({
      sender,
      ...computeSenderTriage(sender),
    }))
  }
}

export async function buildTriageReport(
  accessToken: string,
  limit: number
): Promise<TriageReport> {
  const { fetchMessages } = await import('@/lib/gmail')
  const messages: GmailMessage[] = await fetchMessages(accessToken, limit)
  const senderStats = buildSenderStats(messages)
  const recommendations = await analyzeWithClaude(senderStats)

  return {
    scannedAt: new Date().toISOString(),
    totalEmails: messages.length,
    recommendations: recommendations.sort((a, b) => {
      const order: Record<TriageAction, number> = { unsubscribe: 0, archive: 1, keep: 2 }
      return order[a.action] - order[b.action]
    }),
  }
}
