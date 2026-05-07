import { describe, it, expect } from 'vitest'
import { parseUnsubscribeHeader } from '@/lib/actions'

describe('parseUnsubscribeHeader', () => {
  it('extracts both mailto and url', () => {
    const header = '<mailto:unsub@example.com?subject=unsubscribe>, <https://example.com/unsub>'
    const result = parseUnsubscribeHeader(header)
    expect(result?.mailto).toBe('unsub@example.com')
    expect(result?.url).toBe('https://example.com/unsub')
  })

  it('handles mailto-only header', () => {
    const result = parseUnsubscribeHeader('<mailto:unsub@example.com>')
    expect(result?.mailto).toBe('unsub@example.com')
    expect(result?.url).toBeUndefined()
  })

  it('handles url-only header', () => {
    const result = parseUnsubscribeHeader('<https://example.com/unsub>')
    expect(result?.url).toBe('https://example.com/unsub')
    expect(result?.mailto).toBeUndefined()
  })

  it('returns null for empty or undefined input', () => {
    expect(parseUnsubscribeHeader('')).toBeNull()
    expect(parseUnsubscribeHeader(undefined)).toBeNull()
  })
})
