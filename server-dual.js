// server-dual.js
// UNSCAMMED.AI API Server
// Google Web Risk Lookup API + Domain Age Checker

import express from 'express';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// Load environment variables
dotenv.config();

// Import modules (Lookup API only - no hash database)
import { lookupUrl, getUsageStats } from './lib/webrisk-lookup-api.js';
import { validateConfiguration } from './lib/api-guard.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// CORS Configuration - Restrict to localhost and Chrome extension
const corsOptions = {
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps, curl, or same-origin)
    if (!origin) {
      return callback(null, true);
    }

    // Allow localhost for development
    if (origin.startsWith('http://localhost') || origin.startsWith('http://127.0.0.1')) {
      return callback(null, true);
    }

    // Allow Chrome extension origins
    if (origin.startsWith('chrome-extension://')) {
      return callback(null, true);
    }

    // Reject other origins
    callback(new Error('Not allowed by CORS'));
  },
  credentials: true
};

// Rate limiting configuration
const scanRateLimit = rateLimit({
  windowMs: 60 * 1000, // 1 minute window
  max: 60, // 60 requests per minute (1 per second average)
  message: {
    success: false,
    error: 'Too many scan requests. Please wait before trying again.',
    retryAfter: 60
  },
  standardHeaders: true,
  legacyHeaders: false,
});

const domainAgeRateLimit = rateLimit({
  windowMs: 60 * 1000, // 1 minute window
  max: 100, // 100 requests per minute
  message: {
    success: false,
    error: 'Too many domain age requests. Please wait before trying again.',
    retryAfter: 60
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Middleware
app.use(cors(corsOptions));
app.use(express.json());

// Request logging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Validate configuration on startup
try {
  validateConfiguration();
  console.log('✅ Configuration validated');
} catch (error) {
  console.error('❌ Configuration validation failed:', error.message);
  process.exit(1);
}

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'UNSCAMMED.AI API Server',
    timestamp: Date.now(),
    features: {
      webRisk: {
        name: 'Google Web Risk Lookup API',
        enabled: true,
        methods: ['uris:search'],
        cost: 'FREE tier (10,000/month)'
      },
      domainAge: {
        name: 'Domain Age Checker',
        enabled: true,
        apis: ['WhoisJSON', 'RDAP'],
        caching: '24 hours',
        cost: 'FREE (rate limited)'
      }
    }
  });
});

// Scan endpoint - Google Web Risk Lookup API only
app.post('/scan', scanRateLimit, async (req, res) => {
  const { url } = req.body;

  if (!url) {
    return res.status(400).json({
      success: false,
      error: 'URL is required'
    });
  }

  console.log(`\n🔍 ========== Scanning URL ==========`);
  console.log(`   URL: ${url}`);
  console.log(`=======================================\n`);

  try {
    console.log('📡 Calling Google Web Risk Lookup API...');

    const lookupResult = await lookupUrl(url);

    const threatLevel = lookupResult.threats.length > 0
      ? (lookupResult.threats.includes('MALWARE') ? 'high' : 'medium')
      : 'low';

    const result = {
      success: true,
      url,
      threats: lookupResult.threats,
      threatLevel,
      isSecure: lookupResult.threats.length === 0,
      details: lookupResult.threats.length === 0
        ? 'No threats detected by Google Web Risk'
        : `Threats detected: ${lookupResult.threats.join(', ')}`,
      source: 'google-web-risk-lookup-api',
      confidence: lookupResult.confidence,
      cost: 0, // Free tier (up to 10k/month)
      usageStats: lookupResult.usageStats,
      timestamp: Date.now()
    };

    // Log result summary
    console.log(`\n✅ ========== Scan Complete ==========`);
    console.log(`   URL: ${url}`);
    console.log(`   Threats: ${result.threats.length > 0 ? result.threats.join(', ') : 'None'}`);
    console.log(`   Cost: $${result.cost.toFixed(2)}`);
    console.log(`======================================\n`);

    res.json(result);

  } catch (error) {
    console.error(`❌ Scan failed: ${error.message}`);
    res.status(500).json({
      success: false,
      error: error.message,
      url,
      timestamp: Date.now()
    });
  }
});

// Web Risk usage stats endpoint
app.get('/stats/usage', (req, res) => {
  try {
    const stats = getUsageStats();
    res.json({
      success: true,
      webRiskLookup: stats
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Cost estimate endpoint
app.get('/stats/cost-estimate', (req, res) => {
  const usageStats = getUsageStats();

  const estimate = {
    current: {
      webRiskLookup: {
        queries: usageStats.monthlyQueries,
        freeTierLimit: 10000,
        freeTierRemaining: Math.max(0, 10000 - usageStats.monthlyQueries),
        cost: 0
      },
      domainAge: {
        queries: domainAgeStats.totalRequests,
        cacheHits: domainAgeStats.cacheHits,
        apiCalls: domainAgeStats.apiCalls.whoisjson + domainAgeStats.apiCalls.rdap,
        cost: 0
      },
      totalMonthlyCost: 0
    },
    projections: {
      at10kPerMonth: {
        webRiskQueries: 10000,
        estimatedCost: 0,
        status: 'Within free tier'
      },
      at50kPerMonth: {
        webRiskQueries: 50000,
        estimatedCost: '~$0-2 (depends on tier)',
        warning: 'Exceeds free tier - need paid plan or multiple projects'
      }
    }
  };

  res.json({
    success: true,
    ...estimate
  });
});

// ============================================================
// DOMAIN AGE API - WHOIS Lookup with Caching
// ============================================================

// Simple LRU Cache implementation with TTL
class LRUCache {
  constructor(maxSize = 1000, ttlMs = 24 * 60 * 60 * 1000) {
    this.maxSize = maxSize;
    this.ttlMs = ttlMs;
    this.cache = new Map();
  }

  get(key) {
    const entry = this.cache.get(key);
    if (!entry) return undefined;

    // Check TTL
    if (Date.now() - entry.timestamp > this.ttlMs) {
      this.cache.delete(key);
      return undefined;
    }

    // Move to end (most recently used)
    this.cache.delete(key);
    this.cache.set(key, entry);
    return entry;
  }

  set(key, data) {
    // Delete if exists (to update position)
    if (this.cache.has(key)) {
      this.cache.delete(key);
    }

    // Evict oldest entries if at capacity
    while (this.cache.size >= this.maxSize) {
      const oldestKey = this.cache.keys().next().value;
      this.cache.delete(oldestKey);
    }

    this.cache.set(key, {
      data,
      timestamp: Date.now()
    });
  }

  get size() {
    return this.cache.size;
  }

  // Clean expired entries periodically
  cleanExpired() {
    const now = Date.now();
    for (const [key, entry] of this.cache) {
      if (now - entry.timestamp > this.ttlMs) {
        this.cache.delete(key);
      }
    }
  }
}

// In-memory LRU cache for domain ages (max 1000 entries, 24-hour TTL)
// TODO: Upgrade to Redis for production scaling
const domainAgeCache = new LRUCache(1000, 24 * 60 * 60 * 1000);
const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

// Clean expired cache entries every hour
setInterval(() => {
  domainAgeCache.cleanExpired();
  console.log(`🧹 Cache cleanup complete. Current size: ${domainAgeCache.size}`);
}, 60 * 60 * 1000);

// Stats tracking
let domainAgeStats = {
  totalRequests: 0,
  cacheHits: 0,
  cacheMisses: 0,
  apiCalls: {
    whoisjson: 0,
    rdap: 0,
    failed: 0
  }
};

/**
 * Domain Age Lookup Endpoint
 * GET /api/domain-age?domain=example.com
 * Returns domain registration age from WHOIS data
 */
app.get('/api/domain-age', domainAgeRateLimit, async (req, res) => {
  const { domain } = req.query;

  if (!domain) {
    return res.status(400).json({
      success: false,
      error: 'Domain parameter is required'
    });
  }

  domainAgeStats.totalRequests++;

  try {
    // Extract registered domain (remove subdomains)
    const registeredDomain = extractRegisteredDomain(domain);

    console.log(`📅 Domain age request: ${domain} → ${registeredDomain}`);

    // Check cache first (LRU cache handles TTL internally)
    const cached = domainAgeCache.get(registeredDomain);
    if (cached) {
      domainAgeStats.cacheHits++;
      console.log(`✅ Cache HIT for ${registeredDomain}`);
      return res.json({
        success: true,
        ...cached.data,
        cached: true,
        cacheAge: Math.floor((Date.now() - cached.timestamp) / 1000 / 60) // minutes
      });
    }

    domainAgeStats.cacheMisses++;
    console.log(`⚠️  Cache MISS for ${registeredDomain} - fetching from WHOIS...`);

    // Try WHOIS APIs in sequence
    let domainAgeData = null;

    // Try WhoisJSON API first
    try {
      domainAgeData = await fetchFromWhoisJSON(registeredDomain);
      if (domainAgeData) {
        domainAgeStats.apiCalls.whoisjson++;
        console.log(`✅ Got data from WhoisJSON API`);
      }
    } catch (error) {
      console.warn(`⚠️  WhoisJSON failed: ${error.message}`);
    }

    // Try RDAP API as fallback
    if (!domainAgeData) {
      try {
        domainAgeData = await fetchFromRDAP(registeredDomain);
        if (domainAgeData) {
          domainAgeStats.apiCalls.rdap++;
          console.log(`✅ Got data from RDAP API`);
        }
      } catch (error) {
        console.warn(`⚠️  RDAP failed: ${error.message}`);
      }
    }

    // If all APIs failed, return estimated age
    if (!domainAgeData) {
      domainAgeStats.apiCalls.failed++;
      domainAgeData = estimateDomainAge(registeredDomain);
      console.log(`⚠️  All APIs failed - using estimated age`);
    }

    // Cache the result (LRU cache handles timestamp internally)
    domainAgeCache.set(registeredDomain, domainAgeData);

    res.json({
      success: true,
      ...domainAgeData,
      cached: false
    });

  } catch (error) {
    console.error(`❌ Domain age lookup failed: ${error.message}`);
    res.status(500).json({
      success: false,
      error: error.message,
      domain
    });
  }
});

// WhoisJSON API implementation
async function fetchFromWhoisJSON(domain) {
  const response = await fetch(`https://whoisjson.com/api/v1/whois?domain=${domain}`, {
    method: 'GET',
    headers: {
      'Accept': 'application/json',
      'User-Agent': 'UNSCAMMED.AI/1.0'
    },
    signal: AbortSignal.timeout(5000) // 5s timeout
  });

  if (!response.ok) {
    throw new Error(`WhoisJSON returned ${response.status}`);
  }

  const data = await response.json();

  if (data.created_date || data.creation_date) {
    const creationDate = new Date(data.created_date || data.creation_date);
    return calculateAgeInfo(creationDate, domain, data);
  }

  throw new Error('No creation date in WhoisJSON response');
}

// RDAP API implementation
async function fetchFromRDAP(domain) {
  const tld = domain.split('.').pop();
  const rdapServer = getRDAPServer(tld);

  if (!rdapServer) {
    throw new Error('No RDAP server for this TLD');
  }

  const response = await fetch(`${rdapServer}/domain/${domain}`, {
    method: 'GET',
    headers: {
      'Accept': 'application/json',
      'User-Agent': 'UNSCAMMED.AI/1.0'
    },
    signal: AbortSignal.timeout(5000) // 5s timeout
  });

  if (!response.ok) {
    throw new Error(`RDAP returned ${response.status}`);
  }

  const data = await response.json();

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
}

// RDAP server mapping
function getRDAPServer(tld) {
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
  };
  return rdapServers[tld] || null;
}

// Calculate age information from creation date
function calculateAgeInfo(creationDate, _domain, rawData = {}) {
  const now = Date.now();
  const created = creationDate.getTime();
  const ageDays = Math.floor((now - created) / (1000 * 60 * 60 * 24));

  const registrar = rawData.registrar || rawData.registrarName || 'Unknown';
  const whoisPrivacy = checkWhoisPrivacy(rawData);

  return {
    creationDate: creationDate.toISOString(),
    domainAgeDays: ageDays,
    isVeryNew: ageDays < 7,
    isNew: ageDays < 30,
    isYoung: ageDays < 365,
    isMature: ageDays >= 365,
    isOld: ageDays >= 1825,
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
  let multiplier = 1.0;
  if (days < 7) multiplier = 3.0;
  else if (days < 30) multiplier = 2.0;
  else if (days < 90) multiplier = 1.5;
  else if (days < 365) multiplier = 1.2;

  if (hasPrivacy && days < 90) {
    multiplier *= 1.3;
  }
  return multiplier;
}

function extractRegisteredDomain(hostname) {
  const parts = hostname.split('.');
  const specialTLDs = ['co.uk', 'com.br', 'co.in', 'com.au', 'co.jp'];
  const lastTwo = parts.slice(-2).join('.');

  if (specialTLDs.includes(lastTwo)) {
    return parts.slice(-3).join('.');
  }
  return parts.slice(-2).join('.');
}

function estimateDomainAge(hostname) {
  console.log('⚠️  Using estimated domain age (APIs unavailable)');

  const knownOldDomains = [
    'google.com', 'youtube.com', 'facebook.com', 'amazon.com',
    'microsoft.com', 'apple.com', 'twitter.com', 'linkedin.com',
    'github.com', 'stackoverflow.com', 'wikipedia.org', 'reddit.com',
  ];

  const isKnownOld = knownOldDomains.some(domain =>
    hostname === domain || hostname.endsWith('.' + domain)
  );

  if (isKnownOld) {
    return {
      creationDate: null,
      domainAgeDays: 3650,
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

  return {
    creationDate: null,
    domainAgeDays: null,
    isVeryNew: false,
    isNew: false,
    isYoung: false,
    isMature: false,
    isOld: false,
    whoisPrivacyEnabled: undefined,
    registrar: 'Unknown',
    ageCategory: 'UNKNOWN',
    riskMultiplier: 1.2,
    isEstimated: true,
    apiUnavailable: true,
  };
}

// Domain age stats endpoint
app.get('/stats/domain-age', (_req, res) => {
  const cacheHitRate = domainAgeStats.totalRequests > 0
    ? (domainAgeStats.cacheHits / domainAgeStats.totalRequests * 100).toFixed(1)
    : 0;

  res.json({
    success: true,
    stats: domainAgeStats,
    cache: {
      size: domainAgeCache.size,
      hitRate: `${cacheHitRate}%`,
      ttl: '24 hours'
    },
    upgrade: {
      current: 'Free WHOIS APIs (rate limited)',
      recommended: 'WhoisXML API ($99-199/month for production)',
      note: 'Cache reduces API calls by 90%+ after initial requests'
    }
  });
});

// Start server
function startServer() {
  app.listen(PORT, () => {
    console.log('\n' + '='.repeat(60));
    console.log('🚀 UNSCAMMED.AI API Server');
    console.log('='.repeat(60));
    console.log(`📡 Server: http://localhost:${PORT}`);
    console.log(`🏥 Health: http://localhost:${PORT}/health`);
    console.log('');
    console.log('📊 Available Endpoints:');
    console.log('  ├─ POST /scan - Google Web Risk URL scanning');
    console.log('  ├─ GET /api/domain-age?domain=example.com - Domain age lookup');
    console.log('  ├─ GET /stats/usage - Web Risk API usage statistics');
    console.log('  ├─ GET /stats/domain-age - Domain age API statistics');
    console.log('  └─ GET /stats/cost-estimate - Cost projections');
    console.log('');
    console.log('🔧 Architecture:');
    console.log('  ├─ Google Web Risk Lookup API (FREE: 10k/month)');
    console.log('  └─ Domain Age Checker (FREE: WhoisJSON + RDAP)');
    console.log('');
    console.log('💰 Current Cost: $0/month (free tier)');
    console.log('='.repeat(60) + '\n');
  });
}

// Error handling
process.on('uncaughtException', (error) => {
  console.error('🚨 Uncaught exception:', error);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('🚨 Unhandled rejection at:', promise, 'reason:', reason);
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down gracefully...');
  process.exit(0);
});

// Start the server
startServer();
