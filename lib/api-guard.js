// lib/api-guard.js
// API Guard: Validates Google Web Risk Lookup API calls
// Ensures proper method whitelisting for billing safety
import fs from 'fs';

const METHOD_WHITELIST = {
  lookup_api: [
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
 * Validate Lookup API call
 */
function validateLookupAPI(method) {
  return enforceMethodWhitelist('lookup_api', method);
}

// Backward compatibility aliases
function validateProjectB(method) {
  return validateLookupAPI(method);
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
    // fs is imported at top level
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
 * Check if a method is safe for Lookup API
 * Returns true if the method is whitelisted
 */
function isLookupAPISafe(method) {
  return METHOD_WHITELIST.lookup_api.includes(method);
}

// Backward compatibility
function isProjectBSafe(method) {
  return isLookupAPISafe(method);
}

/**
 * Get method whitelist (for display/debugging)
 */
function getWhitelist() {
  return METHOD_WHITELIST;
}

/**
 * Runtime configuration validation
 * Ensures environment is properly set up for Google Web Risk Lookup API
 */
function validateConfiguration() {
  const warnings = [];
  const errors = [];

  // Check Lookup API configuration (required)
  if (!process.env.PROJECT_B_API_KEY) {
    errors.push('❌ PROJECT_B_API_KEY not set (required for Web Risk scanning)');
  }

  if (!process.env.PROJECT_B_PROJECT_ID) {
    warnings.push('⚠️  PROJECT_B_PROJECT_ID not set (optional)');
  }

  // Display warnings
  if (warnings.length > 0) {
    warnings.forEach(w => console.warn('  ' + w));
  }

  // Fail if critical errors
  if (errors.length > 0) {
    console.error('🚨 Configuration validation failed:');
    errors.forEach(e => console.error('  ' + e));
    throw new Error('API configuration validation failed. Set PROJECT_B_API_KEY in .env file.');
  }

  console.log('✅ API Guard: Configuration validated');
  return true;
}

export {
  enforceMethodWhitelist,
  validateLookupAPI,
  validateProjectB, // Backward compatibility
  getViolations,
  clearViolations,
  isLookupAPISafe,
  isProjectBSafe, // Backward compatibility
  getWhitelist,
  validateConfiguration
};
