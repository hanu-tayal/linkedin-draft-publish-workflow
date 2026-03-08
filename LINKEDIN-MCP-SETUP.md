# LinkedIn MCP Setup Guide

This guide covers the local **LinkedIn MCP** path based on `@pegasusheavy/linkedin-mcp`.

Use this path for:
- extracting profile data into Cursor
- refreshing profile context in this repo
- local LinkedIn OAuth setup for the existing `linkedin-get-token.js` helper

Do not use this guide for the Rube posting path. That lives in `docs/linkedin-rube-mcp-setup.md`.

## Prerequisites

- Node.js 18+
- LinkedIn Developer App (free)

## Step 1: Create a LinkedIn App

1. Go to [LinkedIn Developers](https://www.linkedin.com/developers/)
2. Click **Create App** and fill in:
   - App name (e.g., "My Profile Extractor")
   - LinkedIn Page (create one if needed)
   - Privacy policy URL (can use a placeholder for personal use)
3. Note your **Client ID** and **Client Secret** from the app dashboard

## Step 2: Configure OAuth

### 2a. Add redirect URL (Auth tab)

1. In your app dashboard, click the **Auth** tab (left sidebar)
2. Scroll to **OAuth 2.0 settings** → **Authorized redirect URLs**
3. Click **Add redirect URL** and add:
   ```
   http://localhost:50001/callback
   ```
4. Save

### 2b. Add "Sign In with LinkedIn using OpenID Connect" (Products tab)

1. Click the **Products** tab in the left sidebar of your app
2. You’ll see a list of available products. Find **"Sign in with LinkedIn using OpenID Connect"**
3. Click **Request access** or **Add product** next to it
4. It’s an open permission, so it’s approved immediately (no review)
5. **Required:** Add **"Share on LinkedIn"** — the MCP requests the `w_member_social` scope, so this product is required (not optional)

## Step 3: Add Credentials to MCP Config

Edit `.cursor/mcp.json` and replace the placeholders with your LinkedIn app credentials:

```json
{
  "mcpServers": {
    "linkedin": {
      "command": "npx",
      "args": ["-y", "@pegasusheavy/linkedin-mcp"],
      "env": {
        "LINKEDIN_CLIENT_ID": "your_actual_client_id",
        "LINKEDIN_CLIENT_SECRET": "your_actual_client_secret",
        "LOG_LEVEL": "error"
      }
    }
  }
}
```

> **Note:** `LOG_LEVEL: "error"` prevents the server from writing `[INFO]` logs to stdout, which would otherwise corrupt MCP's JSON-RPC protocol and cause "is not valid JSON" errors.

> **Security:** The `.cursor/` folder is gitignored, so your credentials won't be committed.

## Step 4: Optional Token Helper

If you want to retrieve an access token manually before restarting Cursor, use:

```powershell
$env:LINKEDIN_CLIENT_ID="your_client_id"
$env:LINKEDIN_CLIENT_SECRET="your_client_secret"
node scripts/linkedin-get-token.js
```

This helper uses the same callback:

```text
http://localhost:50001/callback
```

## Step 5: Restart Cursor

Fully quit and restart Cursor for the MCP server to load.

## Step 6: First-Time Authorization

The first time you use a LinkedIn tool in chat:

1. A browser window opens to LinkedIn's authorization page
2. Sign in and approve the app
3. You're redirected back and the token is cached for the session

## What You Can Extract

Once connected, you can ask the AI to:

- **Get your profile** – Name, headline, summary, photo
- **List skills** – All skills on your profile
- **Get work experience** – Positions, companies, dates
- **Get education** – Schools, degrees, dates
- **Get certifications** – Professional certifications
- **Get publications** – Published works
- **Get languages** – Language proficiency

Example prompts:

- "Extract my LinkedIn profile info"
- "Get my work experience from LinkedIn"
- "List all my skills from LinkedIn"

## Troubleshooting

- **Can't find Products tab:** From [linkedin.com/developers](https://www.linkedin.com/developers/), click **My Apps** (top right), select your app, then look for **Products** in the left sidebar. It may appear as a tab or under a submenu. If you don’t see it, try the direct URL: `https://www.linkedin.com/developers/apps` → select your app → Products.
- **"Sign in with LinkedIn" not listed:** Ensure your app is fully created (name, privacy policy, logo). Some products only appear after the app is set up.
- **MCP not loading:** Check **Settings → Tools & MCP** for the LinkedIn server status
- **"appid/redirect uri/code verifier" or "authorization code expired":** Click Allow within 15 seconds (codes expire fast). Disable LinkedIn MCP before running the token script. Redirect URL must be exactly `http://localhost:50001/callback`.
- **Auth fails:** Ensure redirect URL is exactly `http://localhost:50001/callback`
- **"is not valid JSON" errors:** The server logs `[INFO]` to stdout by default, which breaks MCP's stdio protocol. Add `"LOG_LEVEL": "error"` to the `env` block in `mcp.json` so only stderr logging is used.
- **Logs:** Open **Output** panel (Ctrl+Shift+U) → select **MCP Logs**

## Related Files

- `scripts/linkedin-get-token.js`
- `profile/linkedin-profile-summary.md`
- `docs/linkedin-content-workflow.md`
- `docs/linkedin-rube-mcp-setup.md`

## Package

- [@pegasusheavy/linkedin-mcp](https://www.npmjs.com/package/@pegasusheavy/linkedin-mcp) on npm
- [Documentation](https://pegasusheavy.github.io/linkedin-mcp/)
