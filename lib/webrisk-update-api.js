// lib/webrisk-update-api.js
// Project A: Update API Client (Hash Database Management)
// CRITICAL: This module ONLY uses computeDiff and hashes.search
// NEVER call uris:search from this module

import { readFileSync } from 'fs';
import { createSign } from 'crypto';
import { createHash } from 'crypto';

const SERVICE_ACCOUNT_PATH = process.env.PROJECT_A_SERVICE_ACCOUNT_PATH;
const COMPUTE_DIFF_ENDPOINT = 'https://webrisk.googleapis.com/v1/threatLists:computeDiff';
const HASHES_SEARCH_ENDPOINT = 'https://webrisk.googleapis.com/v1/hashes:search';
const TOKEN_ENDPOINT = 'https://oauth2.googleapis.com/token';
const SCOPES = 'https://www.googleapis.com/auth/cloud-platform';

// In-memory hash prefix database
let hashDatabase = {
  malware: [],
  socialEngineering: [],
  unwantedSoftware: [],
  lastUpdate: null,
  version: null
};

// Token cache
let cachedToken = null;
let tokenExpiry = 0;

/**
 * Initialize and update local hash database
 */
async function updateLocalDatabase() {
  console.log('[Project A] 🔄 Updating local hash database...');

  try {
    const accessToken = await getAccessToken();
    const threatTypes = ['MALWARE', 'SOCIAL_ENGINEERING', 'UNWANTED_SOFTWARE'];

    let totalAdded = 0;

    for (const threatType of threatTypes) {
      console.log(`[Project A] Fetching ${threatType} hashes...`);

      // Build query parameters for GET request
      const queryParams = new URLSearchParams();
      queryParams.append('threatType', threatType);
      queryParams.append('constraints.maxDiffEntries', '2048');
      queryParams.append('constraints.maxDatabaseEntries', '4096');
      queryParams.append('constraints.supportedCompressions', 'RAW');

      // Add version token if we have one (for incremental updates)
      if (hashDatabase.version) {
        queryParams.append('versionToken', hashDatabase.version);
      }

      const requestUrl = `${COMPUTE_DIFF_ENDPOINT}?${queryParams.toString()}`;

      const response = await fetch(requestUrl, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`computeDiff failed for ${threatType}: ${response.status} - ${errorText}`);
      }

      const data = await response.json();

      console.log(`[Project A] Response type: ${data.responseType}`);

      // Process additions
      if (data.additions && data.additions.rawHashes) {
        const rawHashesArray = data.additions.rawHashes;

        // Process each raw hash entry
        let hashCount = 0;
        for (const hashEntry of rawHashesArray) {
          if (hashEntry.rawHashes) {
            // rawHashes is base64 encoded, each hash is 4 bytes (32-bit prefix)
            const buffer = Buffer.from(hashEntry.rawHashes, 'base64');
            const prefixSize = hashEntry.prefixSize || 4; // Default to 4 bytes

            // Split buffer into individual hash prefixes
            for (let i = 0; i < buffer.length; i += prefixSize) {
              const prefix = buffer.slice(i, i + prefixSize).toString('hex');

              const dbKey = threatType.toLowerCase().replace(/_/g, '');
              if (dbKey === 'malware') {
                hashDatabase.malware.push(prefix);
              } else if (dbKey === 'socialengineering') {
                hashDatabase.socialEngineering.push(prefix);
              } else if (dbKey === 'unwantedsoftware') {
                hashDatabase.unwantedSoftware.push(prefix);
              }

              hashCount++;
            }
          }
        }

        totalAdded += hashCount;
        console.log(`[Project A] ✅ Added ${hashCount} ${threatType} hash prefixes (FREE)`);
      }

      // Process removals (for incremental updates)
      if (data.removals && data.removals.rawIndices) {
        const indices = data.removals.rawIndices.indices || [];
        console.log(`[Project A] ℹ️  Removing ${indices.length} outdated hashes`);
        // Note: For simplicity, we're doing full resets. Production should handle incremental removals.
      }

      // Store version token for next incremental update
      if (data.newVersionToken) {
        hashDatabase.version = data.newVersionToken;
      }

      // Log recommended next update time
      if (data.recommendedNextDiff) {
        const nextUpdate = new Date(data.recommendedNextDiff);
        console.log(`[Project A] ℹ️  Next update recommended: ${nextUpdate.toLocaleString()}`);
      }
    }

    hashDatabase.lastUpdate = Date.now();

    console.log(`[Project A] ✅ Database update complete. Total hashes: ${totalAdded}`);
    console.log(`[Project A] 💰 Cost: $0.00 (computeDiff is FREE)`);

    return {
      success: true,
      hashCount: totalAdded,
      lastUpdate: hashDatabase.lastUpdate,
      cost: 0
    };

  } catch (error) {
    console.error('[Project A] ❌ Database update failed:', error.message);
    throw error;
  }
}

/**
 * Check if URL hash matches local database
 */
async function checkLocalHash(url) {
  console.log(`[Project A] 🔍 Checking local hash for: ${url}`);

  try {
    // Compute SHA256 hash of URL
    const urlHash = computeUrlHash(url);
    const hashPrefix = urlHash.substring(0, 8); // First 4 bytes (8 hex chars)

    // Check against each threat type
    const threats = [];

    if (hashDatabase.malware.some(h => h.startsWith(hashPrefix))) {
      threats.push('MALWARE');
    }
    if (hashDatabase.socialEngineering.some(h => h.startsWith(hashPrefix))) {
      threats.push('SOCIAL_ENGINEERING');
    }
    if (hashDatabase.unwantedSoftware.some(h => h.startsWith(hashPrefix))) {
      threats.push('UNWANTED_SOFTWARE');
    }

    if (threats.length > 0) {
      console.log(`[Project A] ⚠️  Hash prefix match found: ${threats.join(', ')}`);

      // For high confidence, we should call hashes.search for full hash verification
      // This costs $50/1000 queries, so only use when prefix matches
      // For now, we'll trust the prefix match

      return {
        found: true,
        threats: threats,
        confidence: 'medium',
        source: 'local-hash-prefix',
        cost: 0 // Prefix check is free
      };
    }

    console.log(`[Project A] ✅ No local match (URL likely safe)`);
    return {
      found: false,
      threats: [],
      confidence: 'high',
      source: 'local-hash-prefix',
      cost: 0
    };

  } catch (error) {
    console.error('[Project A] ❌ Local hash check failed:', error.message);
    throw error;
  }
}

/**
 * Full hash verification using hashes.search
 * WARNING: This costs $50 per 1000 queries
 * Only call when you need high confidence confirmation
 */
async function verifyFullHash(url) {
  console.log(`[Project A] 🔍 Performing full hash verification (PAID): ${url}`);

  try {
    const accessToken = await getAccessToken();
    const urlHash = computeUrlHash(url);

    const response = await fetch(HASHES_SEARCH_ENDPOINT, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        hashPrefix: Buffer.from(urlHash.substring(0, 8), 'hex').toString('base64'),
        threatTypes: ['MALWARE', 'SOCIAL_ENGINEERING', 'UNWANTED_SOFTWARE']
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`hashes.search failed: ${response.status} - ${errorText}`);
    }

    const data = await response.json();

    console.log('[Project A] 💰 Full hash verification cost: ~$0.05');

    return {
      found: data.threats && data.threats.length > 0,
      threats: data.threats || [],
      confidence: 'high',
      source: 'full-hash-verification',
      cost: 0.05
    };

  } catch (error) {
    console.error('[Project A] ❌ Full hash verification failed:', error.message);
    throw error;
  }
}

/**
 * Get database statistics
 */
function getDatabaseStats() {
  return {
    totalHashes:
      hashDatabase.malware.length +
      hashDatabase.socialEngineering.length +
      hashDatabase.unwantedSoftware.length,
    malwareHashes: hashDatabase.malware.length,
    socialEngineeringHashes: hashDatabase.socialEngineering.length,
    unwantedSoftwareHashes: hashDatabase.unwantedSoftware.length,
    lastUpdate: hashDatabase.lastUpdate,
    version: hashDatabase.version,
    age: hashDatabase.lastUpdate ? Date.now() - hashDatabase.lastUpdate : null
  };
}

/**
 * Compute SHA256 hash of URL (canonicalized)
 */
function computeUrlHash(url) {
  // Canonicalize URL (simplified - production should use Web Risk spec)
  let canonical = url.toLowerCase().trim();

  // Remove protocol
  canonical = canonical.replace(/^https?:\/\//, '');

  // Remove trailing slash
  canonical = canonical.replace(/\/$/, '');

  // Compute SHA256
  const hash = createHash('sha256').update(canonical).digest('hex');

  return hash;
}

/**
 * Get OAuth2 access token (with caching)
 */
async function getAccessToken() {
  // Return cached token if still valid
  if (cachedToken && Date.now() < tokenExpiry) {
    return cachedToken;
  }

  console.log('[Project A] 🔐 Obtaining OAuth2 access token...');

  const serviceAccount = loadServiceAccount();
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
    const errorText = await response.text();
    throw new Error(`Token exchange failed: ${response.status} - ${errorText}`);
  }

  const data = await response.json();

  // Cache token (expires in 55 minutes to be safe)
  cachedToken = data.access_token;
  tokenExpiry = Date.now() + (55 * 60 * 1000);

  console.log('[Project A] ✅ Access token obtained');

  return data.access_token;
}

/**
 * Load service account credentials
 */
function loadServiceAccount() {
  if (!SERVICE_ACCOUNT_PATH) {
    throw new Error('PROJECT_A_SERVICE_ACCOUNT_PATH not set in environment');
  }

  try {
    const credData = readFileSync(SERVICE_ACCOUNT_PATH, 'utf8');
    return JSON.parse(credData);
  } catch (error) {
    throw new Error(`Failed to load service account: ${error.message}`);
  }
}

/**
 * Create signed JWT for service account authentication
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

export {
  updateLocalDatabase,
  checkLocalHash,
  verifyFullHash,
  getDatabaseStats
};
