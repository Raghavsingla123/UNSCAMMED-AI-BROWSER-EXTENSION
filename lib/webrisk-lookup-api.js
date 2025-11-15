// lib/webrisk-lookup-api.js
// Project B: Lookup API Client (URL Scanning)
// CRITICAL: This module ONLY uses uris:search
// NEVER call computeDiff or hashes.search from this module

const PROJECT_B_API_KEY = process.env.PROJECT_B_API_KEY;
const LOOKUP_ENDPOINT = 'https://webrisk.googleapis.com/v1/uris:search';
const THREAT_TYPES = ['MALWARE', 'SOCIAL_ENGINEERING', 'UNWANTED_SOFTWARE'];

// Usage tracking for free tier monitoring
let usageStats = {
  monthlyQueries: 0,
  currentMonth: new Date().getMonth(),
  queryLog: []
};

/**
 * Lookup URL using Google Web Risk Lookup API
 * FREE TIER: 10,000 queries/month
 * CRITICAL: This keeps Project B in free tier ONLY if computeDiff is never called
 */
async function lookupUrl(url) {
  console.log(`[Project B] 🔍 Lookup API query: ${url}`);

  // Check if API key is set
  if (!PROJECT_B_API_KEY) {
    throw new Error('PROJECT_B_API_KEY not set in environment');
  }

  // Check free tier limit
  checkFreeTierLimit();

  try {
    // Build query parameters (threatTypes must be repeated, not comma-separated)
    const queryParams = new URLSearchParams();
    THREAT_TYPES.forEach(type => queryParams.append('threatTypes', type));
    queryParams.append('uri', url);
    queryParams.append('key', PROJECT_B_API_KEY);

    const requestUrl = `${LOOKUP_ENDPOINT}?${queryParams}`;

    console.log('[Project B] 📡 Calling uris:search (FREE TIER)');

    const response = await fetch(requestUrl, {
      method: 'GET',
      headers: {
        'Accept': 'application/json'
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Lookup API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();

    // Track usage
    trackUsage(url);

    const threats = extractThreats(data);

    console.log(`[Project B] ✅ Lookup complete: ${threats.length} threats found`);
    console.log(`[Project B] 💰 Cost: $0.00 (FREE TIER - ${usageStats.monthlyQueries}/10,000 used)`);

    return {
      url,
      threats,
      found: threats.length > 0,
      confidence: 'high',
      source: 'lookup-api-project-b',
      cost: 0, // Free tier
      usageStats: getUsageStats()
    };

  } catch (error) {
    console.error('[Project B] ❌ Lookup API failed:', error.message);
    throw error;
  }
}

/**
 * Extract threat types from Lookup API response
 * Handles various response shapes
 */
function extractThreats(data) {
  const threats = new Set();

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
 * Normalize threat type strings
 */
function normalizeThreatType(threatType) {
  if (!threatType) return 'UNKNOWN';
  // Remove common prefixes like "THREAT_TYPE_"
  return threatType.replace(/^THREAT_TYPE_/, '').toUpperCase();
}

/**
 * Check if approaching free tier limit
 */
function checkFreeTierLimit() {
  const currentMonth = new Date().getMonth();

  // Reset counter if new month
  if (currentMonth !== usageStats.currentMonth) {
    console.log('[Project B] 📅 New month detected, resetting usage counter');
    usageStats.monthlyQueries = 0;
    usageStats.currentMonth = currentMonth;
    usageStats.queryLog = [];
  }

  // Warn if approaching limit
  const limit = parseInt(process.env.MONTHLY_SCAN_LIMIT || '9000', 10);

  if (usageStats.monthlyQueries >= limit) {
    throw new Error(
      `❌ Monthly query limit reached (${usageStats.monthlyQueries}/${limit}). ` +
      `Increase MONTHLY_SCAN_LIMIT or wait for next month.`
    );
  }

  if (usageStats.monthlyQueries >= limit * 0.8) {
    console.warn(
      `[Project B] ⚠️  WARNING: ${usageStats.monthlyQueries}/${limit} queries used (80% of limit)`
    );
  }
}

/**
 * Track usage for monitoring
 */
function trackUsage(url) {
  usageStats.monthlyQueries++;
  usageStats.queryLog.push({
    url,
    timestamp: Date.now(),
    month: new Date().getMonth()
  });

  // Keep only last 1000 entries
  if (usageStats.queryLog.length > 1000) {
    usageStats.queryLog.shift();
  }
}

/**
 * Get current usage statistics
 */
function getUsageStats() {
  return {
    monthlyQueries: usageStats.monthlyQueries,
    currentMonth: usageStats.currentMonth,
    freeTrierLimit: 10000,
    percentageUsed: (usageStats.monthlyQueries / 10000 * 100).toFixed(2),
    remainingQueries: 10000 - usageStats.monthlyQueries,
    estimatedCost: 0 // Should always be $0 if in free tier
  };
}

/**
 * Reset usage stats (for testing)
 */
function resetUsageStats() {
  usageStats = {
    monthlyQueries: 0,
    currentMonth: new Date().getMonth(),
    queryLog: []
  };
  console.log('[Project B] 🔄 Usage stats reset');
}

export {
  lookupUrl,
  getUsageStats,
  resetUsageStats
};
