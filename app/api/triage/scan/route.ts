import { getServerSession } from 'next-auth'
import { NextResponse } from 'next/server'
import { authOptions, AuthSession } from '@/lib/auth'
import { buildTriageReport } from '@/lib/triage-engine'

export async function GET() {
  const session = (await getServerSession(authOptions)) as AuthSession | null

  if (!session?.accessToken) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const limit = parseInt(process.env.TRIAGE_SCAN_LIMIT ?? '500', 10)

  try {
    const report = await buildTriageReport(session.accessToken, limit)
    return NextResponse.json(report)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Scan failed'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
