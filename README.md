# Gmail Triage

Automatically scan, categorize, and organize your Gmail inbox using Claude AI and MCP.

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/YOUR_USERNAME/gmail-triage&env=ANTHROPIC_API_KEY,GOOGLE_CLIENT_ID,GOOGLE_CLIENT_SECRET,NEXTAUTH_SECRET,NEXTAUTH_URL)

## How it works

1. **Scan** — Connect your Gmail account and scan your inbox
2. **Analyze** — Claude AI analyzes emails and recommends actions (unsubscribe, archive, keep)
3. **Triage** — Review and confirm recommendations before applying
4. **Organize** — Automatically apply changes to your inbox (labels, archive, unsubscribe)

> **BYOK** — All API calls use your own Anthropic API key. No data is stored on our servers.

## Quick Start

### 1. Set up Google OAuth2

- Go to [Google Cloud Console](https://console.cloud.google.com)
- Create a new project
- Enable the **Gmail API**
- Create an **OAuth2 Web credential**:
  - Authorized redirect URI: `http://localhost:3000/api/auth/callback/google`
- Copy your Client ID and Client Secret

### 2. Clone and run locally

```bash
git clone https://github.com/YOUR_USERNAME/gmail-triage.git
cd gmail-triage

# Copy environment template
cp .env.example .env.local

# Fill in your keys
# ANTHROPIC_API_KEY=sk-ant-...
# GOOGLE_CLIENT_ID=...
# GOOGLE_CLIENT_SECRET=...
# NEXTAUTH_SECRET=$(openssl rand -base64 32)

npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Deploy to Vercel

1. Push your repository to GitHub
2. Click the "Deploy with Vercel" button above
3. Set your environment variables (Anthropic key, Google OAuth credentials, NEXTAUTH_SECRET)
4. Deploy

## MCP Server (Claude Code)

This project includes an MCP server for use with Claude Code.

### Build

```bash
npm run build:mcp
```

### Configure in Claude Code

Add to `.claude/settings.json`:

```json
{
  "mcpServers": {
    "gmail-triage": {
      "command": "node",
      "args": ["/path/to/gmail-triage/dist/mcp/server.js"],
      "env": {
        "GOOGLE_CLIENT_ID": "your-client-id",
        "GOOGLE_CLIENT_SECRET": "your-client-secret",
        "ANTHROPIC_API_KEY": "sk-ant-..."
      }
    }
  }
}
```

## License

MIT
