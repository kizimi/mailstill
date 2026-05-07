---
name: gmail
description: Use when the user types /gmail to scan and triage their Gmail inbox via the gmail-triage MCP server
---

# Gmail Triage Skill

Triggered by: `/gmail`

## Steps

1. Call `mcp__gmail-triage__scan_inbox` with the user's Google access token
2. Present the triage report in three sections:
   - 🔴 Recommended Unsubscribe (senders to unsubscribe from)
   - 🟡 Recommended Archive (with suggested label names)
   - 🟢 Keep in Inbox
3. Ask the user to confirm or adjust any recommendations
4. Call `mcp__gmail-triage__apply_triage` with the approved instructions
5. Report: how many succeeded, how many failed

## Notes
- Never permanently delete — only move to Trash (recoverable for 30 days)
- If MCP server not running: `node /path/to/gmail-triage/dist/mcp/mcp/server.js`
