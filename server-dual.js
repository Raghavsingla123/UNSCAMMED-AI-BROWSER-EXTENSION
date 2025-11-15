// server-dual.js
// UNSCAMMED.AI Dual-Project API Server
// Hybrid architecture: Project A (hash DB) + Project B (Lookup API)
// Cost optimization strategy for Google Web Risk API

import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// Load environment variables
dotenv.config();

// Import dual-project modules
import { updateLocalDatabase, checkLocalHash, getDatabaseStats } from './lib/webrisk-update-api.js';
import { lookupUrl, getUsageStats } from './lib/webrisk-lookup-api.js';
import { validateConfiguration, validateProjectA, validateProjectB } from './lib/api-guard.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Request logging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Validate configuration on startup
try {
  validateConfiguration();
  console.log('✅ Dual-project configuration validated');
} catch (error) {
  console.error('❌ Configuration validation failed:', error.message);
  process.exit(1);
}

// Initialize hash database on startup
let isInitialized = false;

async function initializeHashDatabase() {
  if (process.env.ENABLE_LOCAL_HASH_DB !== 'true') {
    console.log('ℹ️  Local hash database disabled');
    isInitialized = true;
    return;
  }

  try {
    console.log('🔄 Initializing local hash database (Project A)...');
    await updateLocalDatabase();
    isInitialized = true;
    console.log('✅ Hash database initialized');

    // Schedule periodic updates
    const updateInterval = parseInt(process.env.HASH_DB_UPDATE_INTERVAL_HOURS || '1', 10);
    setInterval(async () => {
      try {
        console.log('🔄 Scheduled hash database update...');
        await updateLocalDatabase();
      } catch (error) {
        console.error('❌ Scheduled update failed:', error.message);
      }
    }, updateInterval * 60 * 60 * 1000);

  } catch (error) {
    console.error('❌ Failed to initialize hash database:', error.message);
    console.warn('⚠️  Continuing without local hash database (will use Lookup API only)');
    isInitialized = true;
  }
}

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'UNSCAMMED.AI Dual-Project Web Risk API',
    mode: 'dual-project',
    initialized: isInitialized,
    timestamp: Date.now(),
    projects: {
      project_a: {
        name: 'Hash Database (Update API)',
        enabled: process.env.ENABLE_LOCAL_HASH_DB === 'true',
        methods: ['computeDiff', 'hashes.search'],
        cost: 'FREE (computeDiff) + $50/1000 (hashes.search - rarely used)'
      },
      project_b: {
        name: 'URL Lookup (Lookup API)',
        enabled: true,
        methods: ['uris:search'],
        cost: 'FREE tier (10,000/month)'
      }
    }
  });
});

// Scan endpoint - Hybrid strategy
app.post('/scan', async (req, res) => {
  const { url } = req.body;

  if (!url) {
    return res.status(400).json({
      success: false,
      error: 'URL is required'
    });
  }

  console.log(`\n🔍 ========== Scanning URL ==========`);
  console.log(`   URL: ${url}`);
  console.log(`   Strategy: Hybrid (Local DB → Lookup API)`);
  console.log(`=======================================\n`);

  try {
    let result;
    let strategy;

    // STRATEGY 1: Check local hash database first (Project A - FREE)
    if (process.env.ENABLE_LOCAL_HASH_DB === 'true' && isInitialized) {
      try {
        console.log('📊 Step 1: Checking local hash database (Project A)...');
        validateProjectA('threatLists.computeDiff'); // Just validates configuration

        const localResult = await checkLocalHash(url);

        if (localResult.found) {
          console.log('🚨 THREAT FOUND in local database!');

          result = {
            success: true,
            url,
            threats: localResult.threats,
            threatLevel: 'high',
            isSecure: false,
            details: `Threats detected: ${localResult.threats.join(', ')} (Local Hash Database)`,
            source: 'project-a-local-hash',
            confidence: localResult.confidence,
            cost: 0,
            timestamp: Date.now()
          };

          strategy = 'project_a_hit';
        } else {
          console.log('✅ No match in local database (likely safe)');
        }
      } catch (error) {
        console.warn(`⚠️  Local hash check failed: ${error.message}`);
        console.log('   Falling back to Lookup API...');
      }
    }

    // STRATEGY 2: If not found locally, use Lookup API (Project B - FREE up to 10k/month)
    if (!result) {
      try {
        console.log('📡 Step 2: Calling Lookup API (Project B)...');
        validateProjectB('uris:search');

        const lookupResult = await lookupUrl(url);

        const threatLevel = lookupResult.threats.length > 0
          ? (lookupResult.threats.includes('MALWARE') ? 'high' : 'medium')
          : 'low';

        result = {
          success: true,
          url,
          threats: lookupResult.threats,
          threatLevel,
          isSecure: lookupResult.threats.length === 0,
          details: lookupResult.threats.length === 0
            ? 'No threats detected by Google Web Risk'
            : `Threats detected: ${lookupResult.threats.join(', ')}`,
          source: 'project-b-lookup-api',
          confidence: lookupResult.confidence,
          cost: 0, // Free tier
          usageStats: lookupResult.usageStats,
          timestamp: Date.now()
        };

        strategy = 'project_b_lookup';

      } catch (error) {
        console.error('❌ Lookup API failed:', error.message);

        return res.status(500).json({
          success: false,
          error: `Scan failed: ${error.message}`,
          url,
          timestamp: Date.now()
        });
      }
    }

    // Log result summary
    console.log(`\n✅ ========== Scan Complete ==========`);
    console.log(`   URL: ${url}`);
    console.log(`   Threats: ${result.threats.length > 0 ? result.threats.join(', ') : 'None'}`);
    console.log(`   Strategy: ${strategy}`);
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

// Database stats endpoint
app.get('/stats/database', async (req, res) => {
  try {
    const stats = getDatabaseStats();
    res.json({
      success: true,
      ...stats
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Usage stats endpoint
app.get('/stats/usage', (req, res) => {
  try {
    const stats = getUsageStats();
    res.json({
      success: true,
      projectB: stats
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Manual database update endpoint
app.post('/admin/update-database', async (req, res) => {
  try {
    console.log('🔄 Manual database update requested...');
    validateProjectA('threatLists.computeDiff');

    const result = await updateLocalDatabase();

    res.json({
      success: true,
      ...result
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
  const dbStats = getDatabaseStats();

  const estimate = {
    monthly: {
      project_a: {
        computeDiff: 0, // FREE
        hashesSearch: 0, // We're not using this in current implementation
        total: 0
      },
      project_b: {
        urisSearch: 0, // FREE up to 10k/month
        queries: usageStats.monthlyQueries,
        freeTierRemaining: 10000 - usageStats.monthlyQueries
      },
      total: 0
    },
    projections: {
      at5kPerDay: {
        monthlyQueries: 150000,
        estimatedCost: 0, // Would need multiple Project B instances or paid tier
        warning: 'Exceeds free tier limit'
      }
    }
  };

  res.json({
    success: true,
    ...estimate
  });
});

// Start server
async function startServer() {
  // Initialize hash database
  await initializeHashDatabase();

  app.listen(PORT, () => {
    console.log('\n' + '='.repeat(60));
    console.log('🚀 UNSCAMMED.AI Dual-Project API Server');
    console.log('='.repeat(60));
    console.log(`📡 Server running: http://localhost:${PORT}`);
    console.log(`🏥 Health check: http://localhost:${PORT}/health`);
    console.log(`🔍 Scan endpoint: POST http://localhost:${PORT}/scan`);
    console.log('');
    console.log('📊 Project Architecture:');
    console.log('  ├─ Project A: Hash Database (Update API)');
    console.log('  │  └─ Methods: computeDiff (FREE)');
    console.log('  └─ Project B: URL Lookup (Lookup API)');
    console.log('     └─ Methods: uris:search (FREE tier: 10k/month)');
    console.log('');
    console.log('💰 Cost Strategy:');
    console.log('  • Local hash check: FREE');
    console.log('  • Lookup API fallback: FREE (under 10k/month)');
    console.log('  • Estimated monthly cost: $0-2');
    console.log('');
    console.log('⚠️  IMPORTANT: Monitor billing dashboard daily!');
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
