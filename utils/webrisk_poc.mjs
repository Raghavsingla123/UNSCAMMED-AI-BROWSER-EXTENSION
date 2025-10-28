// Usage: node utils/webrisk_poc.mjs https://example.com
// Requires: Service account JSON file at ./us-visa-scheduler-eb815f4e381b.json
// Exit codes: 0=safe, 1=error, 2=no credentials, 3=invalid URL, 4=timeout, 5=threats found

import { URL } from 'url';
import { createSign } from 'crypto';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Configuration
const TIMEOUT_MS = 10000; // 10s for token + API call
const API_ENDPOINT = 'https://webrisk.googleapis.com/v1/uris:search';
const TOKEN_ENDPOINT = 'https://oauth2.googleapis.com/token';
const THREAT_TYPES = ['MALWARE', 'SOCIAL_ENGINEERING', 'UNWANTED_SOFTWARE'];
const SCOPES = 'https://www.googleapis.com/auth/cloud-platform';

// Get current directory for relative path resolution
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Load service account credentials from JSON file
 */
function loadServiceAccount() {
  try {
    const credPath = join(__dirname, '..', 'us-visa-scheduler-eb815f4e381b.json');
    const credData = readFileSync(credPath, 'utf8');
    return JSON.parse(credData);
  } catch (err) {
    console.error('❌ Error: Could not load service account file');
    console.error(`   Expected: us-visa-scheduler-eb815f4e381b.json in project root`);
    process.exit(2);
  }
}

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
 * Exchange JWT for access token
 */
async function getAccessToken(serviceAccount) {
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
  return data.access_token;
}

/**
 * Main entry point
 */
async function main() {
  // 1. Load service account credentials
  const serviceAccount = loadServiceAccount();

  // 2. Validate CLI argument (target URL)
  const targetUrl = process.argv[2];
  if (!targetUrl) {
    console.error('❌ Error: Missing URL argument');
    console.error('Usage: node utils/webrisk_poc.mjs <url>');
    process.exit(3);
  }

  // Validate URL format
  try {
    new URL(targetUrl);
  } catch (err) {
    console.error(`❌ Error: Invalid URL format: ${targetUrl}`);
    process.exit(3);
  }

  // Setup timeout controller
  let timeoutId;
  const controller = new AbortController();

  try {
    // Set up global timeout
    timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

    // 3. Get OAuth2 access token
    const accessToken = await getAccessToken(serviceAccount);

    // 4. Build API request URL (threatTypes must be repeated, not comma-separated)
    const queryParams = new URLSearchParams();
    THREAT_TYPES.forEach(type => queryParams.append('threatTypes', type));
    queryParams.append('uri', targetUrl);
    const requestUrl = `${API_ENDPOINT}?${queryParams}`;

    // 5. Call Web Risk API with Bearer token
    const response = await fetch(requestUrl, {
      signal: controller.signal,
      headers: {
        'Accept': 'application/json',
        'Authorization': `Bearer ${accessToken}`
      }
    });

    clearTimeout(timeoutId);

    // Handle non-200 responses
    if (!response.ok) {
      const errorText = await response.text().catch(() => 'Unknown error');
      throw new Error(`API returned ${response.status}: ${errorText}`);
    }

    // Parse response
    const data = await response.json();

    // 6. Parse threats from various possible response shapes
    const threats = extractThreats(data);

    // 7. Output results
    if (threats.length === 0) {
      console.log(`✅ No threats found for ${targetUrl}`);
      console.log(JSON.stringify({ url: targetUrl, threats: [], source: 'webrisk' }));
      process.exit(0);
    } else {
      console.log(`🚨 Threats detected for ${targetUrl}: ${threats.join(', ')}`);
      console.log(JSON.stringify({ url: targetUrl, threats, source: 'webrisk' }));
      process.exit(5);
    }

  } catch (err) {
    if (timeoutId) clearTimeout(timeoutId);

    if (err.name === 'AbortError') {
      console.error('⚠️ Request timed out after 10s');
      process.exit(4);
    } else {
      console.error(`❌ Error: ${err.message}`);
      process.exit(1);
    }
  }
}

/**
 * Extract threat types from various possible API response shapes.
 * Defensively handles: matches[], threat, threatMatches, or empty responses.
 */
function extractThreats(data) {
  const threats = new Set();

  // Handle empty or minimal responses
  if (!data || typeof data !== 'object') {
    return [];
  }

  // Shape 1: { threat: { threatTypes: [...] } }
  if (data.threat && Array.isArray(data.threat.threatTypes)) {
    data.threat.threatTypes.forEach(t => threats.add(normalizeThreatType(t)));
  }

  // Shape 2: { matches: [{ threatType: "..." }, ...] }
  if (Array.isArray(data.matches)) {
    data.matches.forEach(match => {
      if (match.threatType) threats.add(normalizeThreatType(match.threatType));
    });
  }

  // Shape 3: { threatMatches: [{ threatType: "..." }, ...] }
  if (Array.isArray(data.threatMatches)) {
    data.threatMatches.forEach(match => {
      if (match.threatType) threats.add(normalizeThreatType(match.threatType));
    });
  }

  return Array.from(threats);
}

/**
 * Normalize threat type strings (remove prefixes, standardize casing)
 */
function normalizeThreatType(threatType) {
  if (!threatType) return 'UNKNOWN';
  // Remove common prefixes like "THREAT_TYPE_"
  return threatType.replace(/^THREAT_TYPE_/, '').toUpperCase();
}

// Execute
main();
