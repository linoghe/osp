#!/usr/bin/env node
const { google } = require('googleapis');
const http = require('http');
const { readFileSync, writeFileSync } = require('fs');
const { exec } = require('child_process');

const CREDENTIALS_PATH = '/Users/lino/.config/gcloud/sheets-mcp-oauth.json';
const TOKEN_PATH = '/Users/lino/.config/gcloud/sheets-mcp-token.json';
const SCOPES = [
  'https://www.googleapis.com/auth/spreadsheets',
  'https://www.googleapis.com/auth/drive.file'
];
const PORT = 3847;

async function main() {
  const creds = JSON.parse(readFileSync(CREDENTIALS_PATH, 'utf-8'));
  const { client_id, client_secret } = creds.installed;
  const redirect_uri = `http://localhost:${PORT}`;

  const oauth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uri);

  const authUrl = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
    prompt: 'consent'
  });

  console.log('\nOpening browser for Google authorization...\n');

  const server = http.createServer(async (req, res) => {
    const url = new URL(req.url, `http://localhost:${PORT}`);
    const code = url.searchParams.get('code');

    if (!code) {
      res.writeHead(400);
      res.end('No code received');
      return;
    }

    try {
      const { tokens } = await oauth2Client.getToken(code);
      writeFileSync(TOKEN_PATH, JSON.stringify(tokens, null, 2));
      console.log(`Token saved to ${TOKEN_PATH}`);
      console.log('\nDone! Restart the Google Sheets MCP server in Cursor.\n');

      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end('<h1>Authorized!</h1><p>You can close this tab and return to Cursor.</p>');
    } catch (err) {
      console.error('Error getting token:', err.message);
      res.writeHead(500);
      res.end('Error: ' + err.message);
    }

    server.close();
  });

  server.listen(PORT, () => {
    console.log(`Listening on http://localhost:${PORT}`);
    exec(`open "${authUrl}"`);
  });
}

main().catch(console.error);
