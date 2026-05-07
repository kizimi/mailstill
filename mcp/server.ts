import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'
import { z } from 'zod'
import { buildTriageReport } from '../lib/triage-engine'
import { executeAll } from '../lib/actions'
import type { ApplyInstruction } from '../lib/types'

const server = new McpServer({
  name: 'gmail-triage',
  version: '1.0.0',
})

server.tool(
  'scan_inbox',
  'Scan Gmail inbox and return AI triage recommendations',
  {
    accessToken: z.string().describe('Google OAuth2 access token'),
    limit: z.number().optional().describe('Number of emails to scan (default: 500)'),
  },
  async ({ accessToken, limit }) => {
    const report = await buildTriageReport(accessToken, limit ?? 500)
    return { content: [{ type: 'text', text: JSON.stringify(report, null, 2) }] }
  }
)

server.tool(
  'apply_triage',
  'Execute approved triage actions (unsubscribe/archive/trash)',
  {
    accessToken: z.string().describe('Google OAuth2 access token'),
    instructions: z.array(
      z.object({
        senderEmail: z.string(),
        action: z.enum(['unsubscribe', 'archive', 'keep']),
        labelName: z.string().optional(),
      })
    ),
    unsubHeaders: z.record(z.string(), z.string()).optional().describe('Map of sender email to unsubscribe header value'),
  },
  async ({ accessToken, instructions, unsubHeaders }) => {
    const result = await executeAll(
      accessToken,
      instructions as ApplyInstruction[],
      (unsubHeaders ?? {}) as Record<string, string>
    )
    return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] }
  }
)

const transport = new StdioServerTransport()
server.connect(transport).catch(console.error)
