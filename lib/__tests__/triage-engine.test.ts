import { describe, it, expect } from 'vitest'
import { computeSenderTriage } from '@/lib/triage-engine'
import type { SenderStats } from '@/lib/types'

const makeSender = (overrides: Partial<SenderStats>): SenderStats => ({
  email: 'test@example.com',
  name: 'Test Sender',
  totalCount: 10,
  readCount: 1,
  readRate: 0.1,
  emailsPerWeek: 2,
  firstSeen: '2026-01-01T00:00:00.000Z',
  lastSeen: '2026-05-01T00:00:00.000Z',
  sampleSubjects: ['Hello', 'World'],
  ...overrides,
})

describe('computeSenderTriage', () => {
  it('recommends unsubscribe for very low read-rate sender with unsubscribe link', () => {
    const sender = makeSender({
      readRate: 0.02,
      emailsPerWeek: 3,
      listUnsubscribeHeader: '<mailto:unsub@example.com>',
    })
    expect(computeSenderTriage(sender).action).toBe('unsubscribe')
  })

  it('recommends keep for high read-rate sender', () => {
    const sender = makeSender({ readRate: 0.9, totalCount: 5 })
    expect(computeSenderTriage(sender).action).toBe('keep')
  })

  it('recommends archive for medium-frequency low-read sender without unsubscribe header', () => {
    const sender = makeSender({ readRate: 0.15, emailsPerWeek: 5, listUnsubscribeHeader: undefined })
    expect(computeSenderTriage(sender).action).toBe('archive')
  })

  it('always returns a non-empty reason string', () => {
    const result = computeSenderTriage(makeSender({}))
    expect(typeof result.reason).toBe('string')
    expect(result.reason.length).toBeGreaterThan(0)
  })
})
