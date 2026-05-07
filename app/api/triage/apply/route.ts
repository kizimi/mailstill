import { getServerSession } from 'next-auth'
import { NextRequest, NextResponse } from 'next/server'
import { authOptions, AuthSession } from '@/lib/auth'
import { executeAll } from '@/lib/actions'
import type { ApplyInstruction } from '@/lib/types'

interface ApplyRequestBody {
  instructions: ApplyInstruction[]
  unsubHeaders: Record<string, string>
}

export async function POST(req: NextRequest) {
  const session = (await getServerSession(authOptions)) as AuthSession | null

  if (!session?.accessToken) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body: ApplyRequestBody = await req.json()

  if (!Array.isArray(body.instructions)) {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  try {
    const result = await executeAll(
      session.accessToken,
      body.instructions,
      body.unsubHeaders ?? {}
    )
    return NextResponse.json(result)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Apply failed'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
