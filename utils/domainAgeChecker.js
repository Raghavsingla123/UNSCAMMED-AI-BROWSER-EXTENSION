// Domain Age Checker - Real WHOIS Lookup
// Uses free WHOIS APIs to get actual domain registration dates

console.log('📅 Domain Age Checker loaded - Real WHOIS integration');

// Default backend URL - can be overridden via chrome.storage or environment variable
const DEFAULT_BACKEND_URL = 'http://localhost:3000';

/**
 * Get backend URL from storage (Chrome) or environment (Node.js)
 */
async function getBackendUrl() {
  // Chrome extension context
  if (typeof chrome !== 'undefined' && chrome.storage) {
    return new Promise((resolve) => {
      chrome.storage.local.get(['apiBaseUrl'], (result) => {
        resolve(result.apiBaseUrl || DEFAULT_BACKEND_URL);
      });
    });
  }
  // Node.js context
  if (typeof process !== 'undefined' && process.env) {
    return process.env.BACKEND_URL || DEFAULT_BACKEND_URL;
  }
  return DEFAULT_BACKEND_URL;
}

/**
 * Create an abort signal with timeout (compatible with older environments)
 * Falls back to AbortController if AbortSignal.timeout is not available
 */
function createTimeoutSignal(timeoutMs) {
  // Use AbortSignal.timeout if available (Node 18+, modern browsers)
  if (typeof AbortSignal !== 'undefined' && typeof AbortSignal.timeout === 'function') {
    return AbortSignal.timeout(timeoutMs);
  }

  // Fallback for older environments
  const controller = new AbortController();
  setTimeout(() => controller.abort(), timeoutMs);
  return controller.signal;
}

/**
 * Get real domain age from WHOIS data via backend API
 * Calls backend server which handles WHOIS lookups with caching
 * @param {string} hostname - The domain to check
 * @returns {Promise<Object>} Domain age information
 */
async function getDomainAge(hostname) {
  try {
    console.log(`📡 Fetching domain age for: ${hostname}`);

    const backendUrl = await getBackendUrl();

    const response = await fetch(`${backendUrl}/api/domain-age?domain=${encodeURIComponent(hostname)}`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
      // Timeout after 10 seconds (with fallback for older environments)
      signal: createTimeoutSignal(10000)
    });

    if (!response.ok) {
      throw new Error(`Backend returned ${response.status}`);
    }

    const data = await response.json();

    if (data.success && data.domainAgeDays !== null) {
      const cacheStatus = data.cached ? '(cached)' : '(fresh)';
      console.log(`✅ Domain age found: ${data.domainAgeDays} days old ${cacheStatus}`);
      return data;
    }

    // Backend returned unsuccessful response
    console.warn('⚠️  Backend returned no domain age data');
    return estimateDomainAge(hostname);

  } catch (error) {
    console.error('❌ Domain age check failed:', error.message);
    // Gracefully degrade - return estimated age
    return estimateDomainAge(hostname);
  }
}

// ============================================================
// DEPRECATED: Old API functions (now handled by backend)
// Kept for reference only - not used anymore
// ============================================================

// API 1: WhoisJSON API (Free, no key required)
// DEPRECATED: Use backend API instead
async function checkWithWhoisJSON(domain) {
  try {
    const response = await fetch(`https://whoisjson.com/api/v1/whois?domain=${domain}`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
      timeout: 5000,
    });

    if (!response.ok) {
      throw new Error(`WhoisJSON returned ${response.status}`);
    }

    const data = await response.json();

    if (data.created_date || data.creation_date) {
      const creationDate = new Date(data.created_date || data.creation_date);
      return calculateAgeInfo(creationDate, domain, data);
    }

    throw new Error('No creation date in response');
  } catch (error) {
    throw error;
  }
}

// ============================================================
// API 2: IP-API (Free, includes domain info)
// ============================================================

async function checkWithIPAPI(domain) {
  try {
    // Note: This API might not have WHOIS for all domains
    const response = await fetch(`http://ip-api.com/json/${domain}?fields=hosting`, {
      method: 'GET',
      timeout: 5000,
    });

    if (!response.ok) {
      throw new Error(`IP-API returned ${response.status}`);
    }

    const data = await response.json();

    // IP-API doesn't always have creation dates, so this might fail
    throw new Error('IP-API doesnt provide WHOIS data');
  } catch (error) {
    throw error;
  }
}

// ============================================================
// API 3: RDAP (Registration Data Access Protocol)
// Official IANA protocol, free, no key needed
// ============================================================

async function checkWithRDAPAPI(domain) {
  try {
    // Get TLD to determine RDAP server
    const tld = domain.split('.').pop();
    const rdapServer = getRDAPServer(tld);

    if (!rdapServer) {
      throw new Error('No RDAP server for TLD');
    }

    const response = await fetch(`${rdapServer}/domain/${domain}`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
      timeout: 5000,
    });

    if (!response.ok) {
      throw new Error(`RDAP returned ${response.status}`);
    }

    const data = await response.json();

    // RDAP format uses events array
    if (data.events) {
      const creationEvent = data.events.find(e =>
        e.eventAction === 'registration' || e.eventAction === 'creation'
      );

      if (creationEvent && creationEvent.eventDate) {
        const creationDate = new Date(creationEvent.eventDate);
        return calculateAgeInfo(creationDate, domain, data);
      }
    }

    throw new Error('No creation date in RDAP response');
  } catch (error) {
    throw error;
  }
}

// ============================================================
// RDAP SERVER MAPPING
// ============================================================

function getRDAPServer(tld) {
  // Common RDAP servers by TLD
  const rdapServers = {
    'com': 'https://rdap.verisign.com/com/v1',
    'net': 'https://rdap.verisign.com/net/v1',
    'org': 'https://rdap.publicinterestregistry.org',
    'io': 'https://rdap.nic.io',
    'co': 'https://rdap.nic.co',
    'uk': 'https://rdap.nominet.uk',
    'dev': 'https://rdap.nic.google',
    'app': 'https://rdap.nic.google',
    'xyz': 'https://rdap.nic.xyz',
    // Add more as needed
  };

  return rdapServers[tld] || null;
}

// ============================================================
// CALCULATE AGE INFORMATION
// ============================================================

function calculateAgeInfo(creationDate, domain, rawData = {}) {
  const now = Date.now();
  const created = creationDate.getTime();
  const ageDays = Math.floor((now - created) / (1000 * 60 * 60 * 24));

  // Extract additional WHOIS info
  const registrar = rawData.registrar || rawData.registrarName || 'Unknown';
  const whoisPrivacy = checkWhoisPrivacy(rawData);

  return {
    creationDate: creationDate.toISOString(),
    domainAgeDays: ageDays,
    isVeryNew: ageDays < 7,       // < 7 days = CRITICAL
    isNew: ageDays < 30,          // < 30 days = HIGH RISK
    isYoung: ageDays < 365,       // < 1 year = MODERATE RISK
    isMature: ageDays >= 365,     // >= 1 year = LOWER RISK
    isOld: ageDays >= 1825,       // >= 5 years = VERY LOW RISK
    whoisPrivacyEnabled: whoisPrivacy,
    registrar: registrar,
    ageCategory: categorizeAge(ageDays),
    riskMultiplier: calculateRiskMultiplier(ageDays, whoisPrivacy),
  };
}

function checkWhoisPrivacy(data) {
  const privacyKeywords = ['privacy', 'protected', 'redacted', 'proxy', 'whois guard', 'private'];
  const registrar = (data.registrar || data.registrarName || '').toLowerCase();
  const adminName = (data.admin_contact?.name || data.registrant?.name || '').toLowerCase();

  return privacyKeywords.some(keyword =>
    registrar.includes(keyword) || adminName.includes(keyword)
  );
}

function categorizeAge(days) {
  if (days < 7) return 'VERY_NEW';
  if (days < 30) return 'NEW';
  if (days < 90) return 'RECENT';
  if (days < 365) return 'YOUNG';
  if (days < 1825) return 'MATURE';
  return 'OLD';
}

function calculateRiskMultiplier(days, hasPrivacy) {
  // Calculate risk multiplier based on age
  // Newer domains = higher multiplier
  let multiplier = 1.0;

  if (days < 7) multiplier = 3.0;        // 3x risk
  else if (days < 30) multiplier = 2.0;  // 2x risk
  else if (days < 90) multiplier = 1.5;  // 1.5x risk
  else if (days < 365) multiplier = 1.2; // 1.2x risk

  // Privacy protection on new domains increases risk
  if (hasPrivacy && days < 90) {
    multiplier *= 1.3;
  }

  return multiplier;
}

// ============================================================
// EXTRACT REGISTERED DOMAIN
// ============================================================

function extractRegisteredDomain(hostname) {
  const parts = hostname.split('.');

  // Handle special TLDs (co.uk, com.br, etc.)
  const specialTLDs = ['co.uk', 'com.br', 'co.in', 'com.au', 'co.jp'];
  const lastTwo = parts.slice(-2).join('.');

  if (specialTLDs.includes(lastTwo)) {
    return parts.slice(-3).join('.');
  }

  // Standard TLD (last two parts)
  return parts.slice(-2).join('.');
}

// ============================================================
// FALLBACK: ESTIMATE DOMAIN AGE
// ============================================================

function estimateDomainAge(hostname) {
  console.log('⚠️  Using estimated domain age (APIs unavailable)');

  // Known old domains (safe to assume old)
  const knownOldDomains = [
    'google.com', 'youtube.com', 'facebook.com', 'amazon.com',
    'microsoft.com', 'apple.com', 'twitter.com', 'linkedin.com',
    'github.com', 'stackoverflow.com', 'wikipedia.org', 'reddit.com',
    'netflix.com', 'spotify.com', 'dropbox.com', 'zoom.us',
    'instagram.com', 'whatsapp.com', 'telegram.org', 'discord.com',
  ];

  const isKnownOld = knownOldDomains.some(domain =>
    hostname === domain || hostname.endsWith('.' + domain)
  );

  if (isKnownOld) {
    return {
      creationDate: null,
      domainAgeDays: 3650, // Assume 10 years
      isVeryNew: false,
      isNew: false,
      isYoung: false,
      isMature: true,
      isOld: true,
      whoisPrivacyEnabled: false,
      registrar: 'Unknown',
      ageCategory: 'OLD',
      riskMultiplier: 1.0,
      isEstimated: true,
    };
  }

  // Unknown domain, can't estimate accurately
  return {
    creationDate: null,
    domainAgeDays: null,
    isVeryNew: false,  // Can't confirm
    isNew: false,      // Can't confirm
    isYoung: false,    // Can't confirm
    isMature: false,   // Can't confirm
    isOld: false,      // Can't confirm
    whoisPrivacyEnabled: undefined,
    registrar: 'Unknown',
    ageCategory: 'UNKNOWN',
    riskMultiplier: 1.2, // Slight risk increase for unknown age
    isEstimated: true,
    apiUnavailable: true,
  };
}

// ============================================================
// HELPER: Format age for display
// ============================================================

function formatDomainAge(ageInfo) {
  if (!ageInfo.domainAgeDays) {
    return 'Unknown age';
  }

  const days = ageInfo.domainAgeDays;

  if (days < 1) return 'Less than 1 day old';
  if (days === 1) return '1 day old';
  if (days < 7) return `${days} days old`;
  if (days < 30) return `${Math.floor(days / 7)} weeks old`;
  if (days < 365) return `${Math.floor(days / 30)} months old`;

  const years = Math.floor(days / 365);
  return years === 1 ? '1 year old' : `${years} years old`;
}

// Export for use in Chrome extension
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { getDomainAge, formatDomainAge };
}

// Global access for Chrome extension
if (typeof self !== 'undefined') {
  self.getDomainAge = getDomainAge;
  self.formatDomainAge = formatDomainAge;
}
