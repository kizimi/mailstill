# Gmail Triage

> AI-powered Gmail inbox cleaner. Scan → Review → Organize — all in one click.

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/kizimi/gmail-triage&env=ANTHROPIC_API_KEY,GOOGLE_CLIENT_ID,GOOGLE_CLIENT_SECRET,NEXTAUTH_SECRET,NEXTAUTH_URL&envDescription=See%20.env.example%20for%20details)

**Gmail Triage** uses Claude AI to analyze your inbox and recommend what to unsubscribe, archive, or keep — then lets you review and apply changes in bulk.

- 🔴 **Unsubscribe** — low open-rate newsletters you haven't read in weeks
- 🟡 **Archive** — automated notifications organized into smart labels
- 🟢 **Keep** — human emails and anything worth your attention

> **BYOK (Bring Your Own Key)** — Uses your own Anthropic API key and Google OAuth credentials. No data is stored on our servers. Hosting is free on Vercel.

---

## How It Works

```
Sign in with Google → Scan Inbox → Review AI Recommendations → Apply in Bulk
```

1. **Scan** — Fetches your last 500 emails (configurable) and groups them by sender
2. **Analyze** — Claude AI computes open rates, email frequency, and content type for each sender
3. **Review** — You see three sections (Unsubscribe / Archive / Keep), and can override any recommendation
4. **Apply** — Confirmed actions are executed: unsubscribe via `List-Unsubscribe` header, label + archive, or move to Trash

All deletes go to **Trash** (never permanent delete) — 30-day recovery window.

---

## Quick Start (Local)

### 1. Get Google OAuth2 credentials

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project (or use an existing one)
3. Enable the **Gmail API** under APIs & Services → Library
4. Go to APIs & Services → Credentials → Create Credentials → **OAuth 2.0 Client ID**
   - Application type: **Web application**
   - Authorized redirect URI: `http://localhost:3000/api/auth/callback/google`
5. Copy your **Client ID** and **Client Secret**

### 2. Get an Anthropic API key

Sign up at [console.anthropic.com](https://console.anthropic.com) and create an API key.

### 3. Clone and run

```bash
git clone https://github.com/kizimi/gmail-triage.git
cd gmail-triage
npm install

cp .env.example .env.local
```

Edit `.env.local`:

```env
ANTHROPIC_API_KEY=sk-ant-...
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-client-secret
NEXTAUTH_SECRET=  # run: openssl rand -base64 32
NEXTAUTH_URL=http://localhost:3000
```

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) and sign in with Google.

---

## Deploy to Vercel (Free)

1. Click the **Deploy with Vercel** button at the top of this page
2. Vercel will fork this repo to your account and prompt for env vars:
   - `ANTHROPIC_API_KEY` — your Anthropic key
   - `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` — from Google Cloud Console
   - `NEXTAUTH_SECRET` — any random 32-byte string (`openssl rand -base64 32`)
   - `NEXTAUTH_URL` — your Vercel deployment URL (e.g. `https://gmail-triage.vercel.app`)
3. Add your Vercel URL as an authorized redirect URI in Google Cloud Console:
   `https://your-app.vercel.app/api/auth/callback/google`

---

## MCP Server (Claude Code)

This project includes an MCP server so you can triage your inbox directly inside Claude Code.

### Build the MCP server

```bash
npm run build:mcp
```

### Add to Claude Code

In `.claude/settings.json`:

```json
{
  "mcpServers": {
    "gmail-triage": {
      "command": "node",
      "args": ["/absolute/path/to/gmail-triage/dist/mcp/server.js"],
      "env": {
        "ANTHROPIC_API_KEY": "sk-ant-...",
        "GOOGLE_CLIENT_ID": "your-client-id",
        "GOOGLE_CLIENT_SECRET": "your-client-secret"
      }
    }
  }
}
```

### Available tools

| Tool | Description |
|------|-------------|
| `scan_inbox` | Scan inbox and return triage recommendations (JSON) |
| `apply_triage` | Apply approved actions (unsubscribe / archive / keep) |

---

## Tech Stack

| Layer | Choice |
|-------|--------|
| Framework | Next.js 15 (App Router) |
| Language | TypeScript |
| Auth | NextAuth.js v4 + Google OAuth2 |
| AI | Claude API (`claude-sonnet-4-6`) |
| Styling | Tailwind CSS |
| Tests | Vitest |
| Deployment | Vercel |
| MCP | `@modelcontextprotocol/sdk` |

---

## Project Structure

```
gmail-triage/
├── app/
│   ├── api/
│   │   ├── auth/[...nextauth]/   # Google OAuth2
│   │   ├── triage/scan/          # Scan + AI analysis
│   │   └── triage/apply/         # Execute approved actions
│   ├── dashboard/                # Triage review UI
│   └── page.tsx                  # Landing page + Sign in
├── lib/
│   ├── types.ts                  # Shared TypeScript types
│   ├── auth.ts                   # NextAuth config
│   ├── gmail.ts                  # Gmail API wrapper
│   ├── triage-engine.ts          # Claude AI analysis
│   └── actions.ts                # Unsubscribe / label / trash
├── mcp/
│   └── server.ts                 # MCP Server
├── skills/
│   └── gmail/SKILL.md            # Claude Code /gmail skill
└── .env.example
```

---

## Cost Estimate

| Resource | Cost |
|----------|------|
| Vercel hosting | Free (open source) |
| Gmail API | Free |
| Claude API | ~$0.05–0.20 per triage session (paid by user) |

---

## License

MIT
