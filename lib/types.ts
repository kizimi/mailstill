export interface GmailMessage {
  id: string
  threadId: string
  fromName: string
  fromEmail: string
  subject: string
  date: string
  isRead: boolean
  listUnsubscribeHeader?: string
}

export interface SenderStats {
  email: string
  name: string
  totalCount: number
  readCount: number
  readRate: number
  emailsPerWeek: number
  firstSeen: string
  lastSeen: string
  listUnsubscribeHeader?: string
  sampleSubjects: string[]
}

export type TriageAction = 'unsubscribe' | 'archive' | 'keep'

export interface SenderRecommendation {
  sender: SenderStats
  action: TriageAction
  labelName?: string
  reason: string
}

export interface TriageReport {
  scannedAt: string
  totalEmails: number
  recommendations: SenderRecommendation[]
}

export interface ApplyInstruction {
  senderEmail: string
  action: TriageAction
  labelName?: string
}

export interface ApplyResult {
  succeeded: string[]
  failed: Array<{ senderEmail: string; error: string }>
}
