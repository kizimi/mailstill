import {
  getMessageIdsBySender,
  ensureLabel,
  applyLabelAndArchive,
  moveToTrash,
} from '@/lib/gmail'
import type { ApplyInstruction, ApplyResult } from '@/lib/types'

export function parseUnsubscribeHeader(
  header: string | undefined
): { mailto?: string; url?: string } | null {
  if (!header) return null
  const mailtoMatch = header.match(/<mailto:([^>?]+)(?:\?[^>]*)?>/)
  const urlMatch = header.match(/<(https?:\/\/[^>]+)>/)
  if (!mailtoMatch && !urlMatch) return null
  return {
    mailto: mailtoMatch?.[1],
    url: urlMatch?.[1],
  }
}

export async function executeAction(
  accessToken: string,
  instruction: ApplyInstruction,
  senderUnsubHeader?: string
): Promise<void> {
  const { senderEmail, action, labelName } = instruction

  if (action === 'unsubscribe') {
    const parsed = parseUnsubscribeHeader(senderUnsubHeader)
    if (parsed?.url) {
      // Fire-and-forget GET to unsubscribe URL — best effort
      await fetch(parsed.url).catch(() => null)
    }
    const ids = await getMessageIdsBySender(accessToken, senderEmail)
    if (ids.length > 0) await moveToTrash(accessToken, ids)
    return
  }

  if (action === 'archive') {
    const label = labelName ?? 'Triage/Archived'
    const labelId = await ensureLabel(accessToken, label)
    const ids = await getMessageIdsBySender(accessToken, senderEmail)
    if (ids.length > 0) await applyLabelAndArchive(accessToken, ids, labelId)
    return
  }

  // action === 'keep': no-op
}

export async function executeAll(
  accessToken: string,
  instructions: ApplyInstruction[],
  unsubHeaders: Record<string, string>
): Promise<ApplyResult> {
  const result: ApplyResult = { succeeded: [], failed: [] }

  for (const instruction of instructions) {
    try {
      await executeAction(accessToken, instruction, unsubHeaders[instruction.senderEmail])
      result.succeeded.push(instruction.senderEmail)
    } catch (err) {
      result.failed.push({
        senderEmail: instruction.senderEmail,
        error: err instanceof Error ? err.message : 'Unknown error',
      })
    }
  }

  return result
}
