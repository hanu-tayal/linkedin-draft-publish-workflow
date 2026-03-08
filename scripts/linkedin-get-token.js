#!/usr/bin/env node
/**
 * One-time helper to get a LinkedIn access token for the local LinkedIn MCP path.
 * Run this, authorize in the browser, then add the token to .cursor/mcp.json.
 *
 * IMPORTANT: Click "Allow" within 15 seconds because LinkedIn codes expire quickly.
 *
 * Usage:
 *   $env:LINKEDIN_CLIENT_ID="your_client_id"
 *   $env:LINKEDIN_CLIENT_SECRET="your_client_secret"
 *   node scripts/linkedin-get-token.js
 */

const http = require('http');
const crypto = require('crypto');
const { execFileSync } = require('child_process');

const CLIENT_ID = process.env.LINKEDIN_CLIENT_ID;
const CLIENT_SECRET = process.env.LINKEDIN_CLIENT_SECRET;
const PORT = 50001;
const REDIRECT_URI = `http://localhost:${PORT}/callback`;
const SCOPES = 'openid profile email w_member_social';

if (!CLIENT_ID) {
  console.error('Error: Set LINKEDIN_CLIENT_ID in environment');
  console.error('Example: $env:LINKEDIN_CLIENT_ID="your_client_id"; node scripts/linkedin-get-token.js');
  process.exit(1);
}

if (!CLIENT_SECRET) {
  console.error('Error: Set LINKEDIN_CLIENT_SECRET in environment');
  console.error('Example: $env:LINKEDIN_CLIENT_SECRET="your_secret"; node scripts/linkedin-get-token.js');
  process.exit(1);
}

// Add to LinkedIn app Auth -> Redirect URLs: http://localhost:50001/callback

const state = crypto.randomBytes(16).toString('hex');

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://localhost:${PORT}`);
  if (url.pathname !== '/callback') {
    res.writeHead(404);
    res.end('Not found');
    return;
  }

  const params = Object.fromEntries(url.searchParams);
  const code = params.code;
  const error = params.error;

  if (error) {
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(`<h1>Error</h1><p>${error}: ${params.error_description || ''}</p>`);
    server.close();
    return;
  }

  if (params.state !== state) {
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end('<h1>Error</h1><p>State mismatch. Please try again.</p>');
    server.close();
    return;
  }

  if (!code) {
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end('<h1>Error</h1><p>No authorization code received.</p>');
    server.close();
    return;
  }

  try {
    const tokenRes = await fetch('https://www.linkedin.com/oauth/v2/accessToken', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        redirect_uri: REDIRECT_URI,
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET,
      }),
    });

    const data = await tokenRes.json();
    if (data.error) {
      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end(`<h1>Token Error</h1><pre>${JSON.stringify(data, null, 2)}</pre>`);
      server.close();
      return;
    }

    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(`
      <h1>Success!</h1>
      <p>Add this to .cursor/mcp.json env:</p>
      <pre>"LINKEDIN_ACCESS_TOKEN": "${data.access_token}"</pre>
      <p>Then restart Cursor.</p>
    `);

    console.log('\n=== ACCESS TOKEN (add to .cursor/mcp.json) ===');
    console.log(data.access_token);
    console.log('==============================================\n');
  } catch (err) {
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(`<h1>Error</h1><pre>${err.message}</pre>`);
    console.error(err);
  } finally {
    server.close();
  }
});

server.listen(PORT, () => {
  const authUrl = `https://www.linkedin.com/oauth/v2/authorization?` + new URLSearchParams({
    response_type: 'code',
    client_id: CLIENT_ID,
    redirect_uri: REDIRECT_URI,
    state,
    scope: SCOPES,
  });
  console.log('1. Add http://localhost:50001/callback to LinkedIn app Auth -> Redirect URLs');
  console.log('2. Click Allow within 15 seconds - codes expire fast!\n');
  console.log('Opening browser...\n');
  if (process.platform === 'darwin') {
    execFileSync('open', [authUrl]);
  } else if (process.platform === 'win32') {
    execFileSync('cmd', ['/c', 'start', '', authUrl]);
  } else {
    execFileSync('xdg-open', [authUrl]);
  }
});
