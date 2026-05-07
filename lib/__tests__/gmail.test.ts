import { describe, it, expect } from 'vitest'
import { buildSenderStats, parseFromHeader } from '@/lib/gmail'
import type { GmailMessage } from '@/lib/types'

describe('parseFromHeader', () => {
  it('parses "Name <email>" format', () => {
    const result = parseFromHeader('Alan Chen <alan@example.com>')
    expect(result).toEqual({ name: 'Alan Chen', email: 'alan@example.com' })
  })

  it('handles plain email with no name', () => {
    const result = parseFromHeader('alan@example.com')
    expect(result).toEqual({ name: 'alan@example.com', email: 'alan@example.com' })
  })
})

describe('buildSenderStats', () => {
  it('computes read rate correctly', () => {
    const messages: GmailMessage[] = [
      { id: '1', threadId: 't1', fromName: 'Newsletter', fromEmail: 'news@sub.com',
        subject: 'Weekly', date: '2026-05-01', isRead: true },
      { id: '2', threadId: 't2', fromName: 'Newsletter', fromEmail: 'news@sub.com',
        subject: 'Weekly', date: '2026-05-07', isRead: false },
    ]
    const stats = buildSenderStats(messages)
    const sender = stats.find(s => s.email === 'news@sub.com')!
    expect(sender.readRate).toBe(0.5)
    expect(sender.totalCount).toBe(2)
    expect(sender.readCount).toBe(1)
  })

  it('collects up to 3 sample subjects', () => {
    const messages: GmailMessage[] = Array.from({ length: 5 }, (_, i) => ({
      id: String(i), threadId: `t${i}`, fromName: 'Test', fromEmail: 'test@x.com',
      subject: `Subject ${i}`, date: '2026-05-01', isRead: true,
    }))
    const stats = buildSenderStats(messages)
    expect(stats[0].sampleSubjects.length).toBe(3)
  })
})
