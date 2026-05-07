import { google } from 'googleapis'
import type { GmailMessage, SenderStats } from '@/lib/types'

export function parseFromHeader(from: string): { name: string; email: string } {
  const match = from.match(/^(.*?)\s*<(.+?)>$/)
  if (match) {
    return { name: match[1].trim() || match[2], email: match[2].toLowerCase() }
  }
  const email = from.trim().toLowerCase()
  return { name: email, email }
}

export function buildSenderStats(messages: GmailMessage[]): SenderStats[] {
  const map = new Map<string, { messages: GmailMessage[]; unsubHeader?: string }>()

  for (const msg of messages) {
    const key = msg.fromEmail.toLowerCase()
    if (!map.has(key)) map.set(key, { messages: [] })
    const entry = map.get(key)!
    entry.messages.push(msg)
    if (msg.listUnsubscribeHeader && !entry.unsubHeader) {
      entry.unsubHeader = msg.listUnsubscribeHeader
    }
  }

  return Array.from(map.entries()).map(([email, { messages: msgs, unsubHeader }]) => {
    const readCount = msgs.filter(m => m.isRead).length
    const dates = msgs.map(m => new Date(m.date).getTime()).sort((a, b) => a - b)
    const firstSeen = new Date(dates[0]).toISOString()
    const lastSeen = new Date(dates[dates.length - 1]).toISOString()
    const weekSpan = Math.max(
      1,
      (dates[dates.length - 1] - dates[0]) / (7 * 24 * 60 * 60 * 1000)
    )
    return {
      email,
      name: msgs[0].fromName,
      totalCount: msgs.length,
      readCount,
      readRate: readCount / msgs.length,
      emailsPerWeek: msgs.length / weekSpan,
      firstSeen,
      lastSeen,
      listUnsubscribeHeader: unsubHeader,
      sampleSubjects: msgs.slice(0, 3).map(m => m.subject),
    }
  })
}

function getGmailClient(accessToken: string) {
  const auth = new google.auth.OAuth2()
  auth.setCredentials({ access_token: accessToken })
  return google.gmail({ version: 'v1', auth })
}

function getHeader(
  headers: Array<{ name?: string | null; value?: string | null }>,
  name: string
): string {
  return headers.find(h => h.name?.toLowerCase() === name.toLowerCase())?.value ?? ''
}

export async function fetchMessages(
  accessToken: string,
  limit = 500
): Promise<GmailMessage[]> {
  const gmail = getGmailClient(accessToken)
  const listRes = await gmail.users.messages.list({
    userId: 'me',
    maxResults: limit,
    labelIds: ['INBOX'],
  })

  const messageIds = listRes.data.messages ?? []
  const results: GmailMessage[] = []
  const BATCH = 50

  for (let i = 0; i < messageIds.length; i += BATCH) {
    const batch = messageIds.slice(i, i + BATCH)
    const fetched = await Promise.all(
      batch.map(m =>
        gmail.users.messages.get({
          userId: 'me',
          id: m.id!,
          format: 'metadata',
          metadataHeaders: ['From', 'Subject', 'Date', 'List-Unsubscribe'],
        })
      )
    )
    for (const res of fetched) {
      const msg = res.data
      const headers = msg.payload?.headers ?? []
      const { name: fromName, email: fromEmail } = parseFromHeader(getHeader(headers, 'From'))
      const isRead = !(msg.labelIds ?? []).includes('UNREAD')
      results.push({
        id: msg.id!,
        threadId: msg.threadId!,
        fromName,
        fromEmail,
        subject: getHeader(headers, 'Subject'),
        date: getHeader(headers, 'Date'),
        isRead,
        listUnsubscribeHeader: getHeader(headers, 'List-Unsubscribe') || undefined,
      })
    }
  }
  return results
}

export async function ensureLabel(accessToken: string, name: string): Promise<string> {
  const gmail = getGmailClient(accessToken)
  const labelsRes = await gmail.users.labels.list({ userId: 'me' })
  const existing = labelsRes.data.labels?.find(l => l.name === name)
  if (existing?.id) return existing.id
  const created = await gmail.users.labels.create({
    userId: 'me',
    requestBody: { name, labelListVisibility: 'labelShow', messageListVisibility: 'show' },
  })
  return created.data.id!
}

export async function applyLabelAndArchive(
  accessToken: string,
  messageIds: string[],
  labelId: string
): Promise<void> {
  const gmail = getGmailClient(accessToken)
  const BATCH = 50
  for (let i = 0; i < messageIds.length; i += BATCH) {
    await gmail.users.messages.batchModify({
      userId: 'me',
      requestBody: {
        ids: messageIds.slice(i, i + BATCH),
        addLabelIds: [labelId],
        removeLabelIds: ['INBOX'],
      },
    })
  }
}

export async function moveToTrash(accessToken: string, messageIds: string[]): Promise<void> {
  const gmail = getGmailClient(accessToken)
  await Promise.all(
    messageIds.map(id => gmail.users.messages.trash({ userId: 'me', id }))
  )
}

export async function getMessageIdsBySender(
  accessToken: string,
  senderEmail: string
): Promise<string[]> {
  const gmail = getGmailClient(accessToken)
  const res = await gmail.users.messages.list({
    userId: 'me',
    q: `from:${senderEmail}`,
    maxResults: 500,
  })
  return (res.data.messages ?? []).map(m => m.id!)
}
