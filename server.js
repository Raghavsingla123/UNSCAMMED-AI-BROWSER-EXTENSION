// UNSCAMMED.AI Local API Server
// Provides Google Web Risk API integration for the Chrome extension
// Usage: node server.js

import express from 'express';
import cors from 'cors';
import { createSign } from 'crypto';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = 3000;

// Configuration
const API_ENDPOINT = 'https://webrisk.googleapis.com/v1/uris:search';
const TOKEN_ENDPOINT = 'https://oauth2.googleapis.com/token';
const THREAT_TYPES = ['MALWARE', 'SOCIAL_ENGINEERING', 'UNWANTED_SOFTWARE'];
const SCOPES = 'https://www.googleapis.com/auth/cloud-platform';

// Middleware
app.use(cors()); // Allow Chrome extension to call this server
app.use(express.json());

// Load service account credentials
let serviceAccount;
try {
  const credPath = join(__dirname, 'us-visa-scheduler-eb815f4e381b.json');
  const credData = readFileSync(credPath, 'utf8');
  serviceAccount = JSON.parse(credData);
  console.log('✅ Service account loaded successfully');
} catch (err) {
  console.error('❌ Failed to load service account:', err.message);
  process.exit(1);
}

// Token cache
let cachedToken = null;
let tokenExpiry = 0;

/**
 * Create a signed JWT for service account authentication
 */
function createJWT(serviceAccount) {
  const now = Math.floor(Date.now() / 1000);
  const expiry = now + 3600; // 1 hour

  const header = {
    alg: 'RS256',
    typ: 'JWT'
  };

  const payload = {
    iss: serviceAccount.client_email,
    scope: SCOPES,
    aud: TOKEN_ENDPOINT,
    iat: now,
    exp: expiry
  };

  const base64Header = Buffer.from(JSON.stringify(header)).toString('base64url');
  const base64Payload = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const signatureInput = `${base64Header}.${base64Payload}`;

  const sign = createSign('RSA-SHA256');
  sign.update(signatureInput);
  sign.end();

  const signature = sign.sign(serviceAccount.private_key, 'base64url');
  return `${signatureInput}.${signature}`;
}

/**
 * Get access token (with caching)
 */
async function getAccessToken() {
  // Return cached token if still valid
  if (cachedToken && Date.now() < tokenExpiry) {
    return cachedToken;
  }

  const jwt = createJWT(serviceAccount);

  const response = await fetch(TOKEN_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: jwt
    })
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => 'Unknown error');
    throw new Error(`Token exchange failed (${response.status}): ${errorText}`);
  }

  const data = await response.json();

  // Cache token (expires in 55 minutes to be safe)
  cachedToken = data.access_token;
  tokenExpiry = Date.now() + (55 * 60 * 1000);

  return data.access_token;
}

/**
 * Extract threat types from API response
 */
function extractThreats(data) {
  const threats = new Set();

  if (!data || typeof data !== 'object') {
    return [];
  }

  // Handle various response shapes
  if (data.threat && Array.isArray(data.threat.threatTypes)) {
    data.threat.threatTypes.forEach(t => threats.add(normalizeThreatType(t)));
  }

  if (Array.isArray(data.matches)) {
    data.matches.forEach(match => {
      if (match.threatType) threats.add(normalizeThreatType(match.threatType));
    });
  }

  if (Array.isArray(data.threatMatches)) {
    data.threatMatches.forEach(match => {
      if (match.threatType) threats.add(normalizeThreatType(match.threatType));
    });
  }

  return Array.from(threats);
}

/**
 * Normalize threat type strings
 */
function normalizeThreatType(threatType) {
  if (!threatType) return 'UNKNOWN';
  return threatType.replace(/^THREAT_TYPE_/, '').toUpperCase();
}

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'UNSCAMMED.AI Web Risk API',
    timestamp: Date.now()
  });
});

// Scan endpoint
app.post('/scan', async (req, res) => {
  const { url } = req.body;

  if (!url) {
    return res.status(400).json({
      success: false,
      error: 'URL is required'
    });
  }

  console.log(`🔍 Scanning URL: ${url}`);

  try {
    // Get access token
    const accessToken = await getAccessToken();

    // Build API request
    const queryParams = new URLSearchParams();
    THREAT_TYPES.forEach(type => queryParams.append('threatTypes', type));
    queryParams.append('uri', url);
    const requestUrl = `${API_ENDPOINT}?${queryParams}`;

    // Call Web Risk API
    const response = await fetch(requestUrl, {
      headers: {
        'Accept': 'application/json',
        'Authorization': `Bearer ${accessToken}`
      }
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => 'Unknown error');
      throw new Error(`API returned ${response.status}: ${errorText}`);
    }

    const data = await response.json();
    const threats = extractThreats(data);

    // Determine threat level for extension
    let threatLevel = 'low';
    if (threats.length > 0) {
      threatLevel = threats.includes('MALWARE') ? 'high' : 'medium';
    }

    const result = {
      success: true,
      url: url,
      threats: threats,
      threatLevel: threatLevel,
      isSecure: threats.length === 0,
      details: threats.length === 0
        ? 'No threats detected by Google Web Risk'
        : `Threats detected: ${threats.join(', ')}`,
      source: 'google-webrisk',
      timestamp: Date.now()
    };

    console.log(`✅ Scan complete: ${url} - Threats: ${threats.length > 0 ? threats.join(', ') : 'None'}`);
    res.json(result);

  } catch (error) {
    console.error(`❌ Scan failed: ${error.message}`);
    res.status(500).json({
      success: false,
      error: error.message,
      url: url,
      timestamp: Date.now()
    });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 UNSCAMMED.AI API Server running on http://localhost:${PORT}`);
  console.log(`📡 Health check: http://localhost:${PORT}/health`);
  console.log(`🔍 Scan endpoint: POST http://localhost:${PORT}/scan`);
  console.log(`🛡️ Using Google Web Risk API with service account`);
});
