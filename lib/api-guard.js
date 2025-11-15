// lib/api-guard.js
// API Guard: Prevents accidental cross-project API calls
// Enforces strict method whitelisting to maintain billing isolation

const METHOD_WHITELIST = {
  project_a: [
    'threatLists.computeDiff',
    'hashes.search',
    'google.cloud.webrisk.v1.WebRiskService.ComputeThreatListDiff',
    'google.cloud.webrisk.v1.WebRiskService.SearchHashes'
  ],
  project_b: [
    'uris:search',
    'google.cloud.webrisk.v1.WebRiskService.SearchUris'
  ]
};

// Violation log
const violations = [];

/**
 * Enforce method whitelist for a project
 * Throws error if method is not allowed
 */
function enforceMethodWhitelist(project, method) {
  const allowed = METHOD_WHITELIST[project];

  if (!allowed) {
    const error = `🚨 API GUARD: Unknown project "${project}"`;
    logViolation(project, method, error);
    throw new Error(error);
  }

  if (!allowed.includes(method)) {
    const error =
      `🚨 API GUARD VIOLATION DETECTED!\n` +
      `   Project: ${project}\n` +
      `   Method: ${method}\n` +
      `   Allowed: ${allowed.join(', ')}\n` +
      `   ⚠️  This call would contaminate billing tier!`;

    logViolation(project, method, error);
    throw new Error(error);
  }

  console.log(`✅ API Guard: ${method} allowed for ${project}`);
}

/**
 * Validate Project A call (Update API only)
 */
function validateProjectA(method) {
  return enforceMethodWhitelist('project_a', method);
}

/**
 * Validate Project B call (Lookup API only)
 */
function validateProjectB(method) {
  return enforceMethodWhitelist('project_b', method);
}

/**
 * Log violation for auditing
 */
function logViolation(project, method, error) {
  const violation = {
    timestamp: new Date().toISOString(),
    project,
    method,
    error,
    stack: new Error().stack
  };

  violations.push(violation);

  // Keep only last 100 violations
  if (violations.length > 100) {
    violations.shift();
  }

  console.error('🚨 API GUARD VIOLATION LOGGED:', violation);

  // Write to violation log file
  if (process.env.LOG_ALL_API_CALLS === 'true') {
    writeViolationToFile(violation);
  }
}

/**
 * Write violation to log file
 */
function writeViolationToFile(violation) {
  try {
    const fs = require('fs');
    const logPath = './logs/api-violations.log';

    fs.mkdirSync('./logs', { recursive: true });
    fs.appendFileSync(logPath, JSON.stringify(violation) + '\n');
  } catch (error) {
    console.error('Failed to write violation log:', error.message);
  }
}

/**
 * Get all violations (for monitoring)
 */
function getViolations() {
  return violations;
}

/**
 * Clear violations (for testing)
 */
function clearViolations() {
  violations.length = 0;
  console.log('✅ API Guard: Violations cleared');
}

/**
 * Check if a method is safe for Project B
 * Returns true if calling this method won't move Project B to paid tier
 */
function isProjectBSafe(method) {
  return METHOD_WHITELIST.project_b.includes(method);
}

/**
 * Get method whitelist (for display/debugging)
 */
function getWhitelist() {
  return METHOD_WHITELIST;
}

/**
 * Runtime configuration validation
 * Ensures environment is properly set up for dual-project mode
 */
function validateConfiguration() {
  const errors = [];

  // Check Project A configuration
  if (!process.env.PROJECT_A_SERVICE_ACCOUNT_PATH) {
    errors.push('❌ PROJECT_A_SERVICE_ACCOUNT_PATH not set');
  }

  if (!process.env.PROJECT_A_PROJECT_ID) {
    errors.push('❌ PROJECT_A_PROJECT_ID not set');
  }

  // Check Project B configuration
  if (!process.env.PROJECT_B_API_KEY) {
    errors.push('❌ PROJECT_B_API_KEY not set');
  }

  if (!process.env.PROJECT_B_PROJECT_ID) {
    errors.push('❌ PROJECT_B_PROJECT_ID not set');
  }

  // Check dual project mode
  if (process.env.USE_DUAL_PROJECT_MODE !== 'true') {
    errors.push('⚠️  USE_DUAL_PROJECT_MODE is not set to "true"');
  }

  // Check API guard is enabled
  if (process.env.ENABLE_API_GUARD !== 'true') {
    errors.push('⚠️  ENABLE_API_GUARD is not set to "true"');
  }

  if (errors.length > 0) {
    console.error('🚨 Configuration validation failed:');
    errors.forEach(e => console.error('  ' + e));
    throw new Error('API Guard configuration validation failed. Check .env file.');
  }

  console.log('✅ API Guard: Configuration validated');
  return true;
}

export {
  enforceMethodWhitelist,
  validateProjectA,
  validateProjectB,
  getViolations,
  clearViolations,
  isProjectBSafe,
  getWhitelist,
  validateConfiguration
};
