// UNSCAMMED.AI URL Check Utilities
// Domain analysis and security validation functions

console.log('🛡️ UNSCAMMED.AI URL Check utilities loaded');

/**
 * Main URL security analysis function
 * @param {string} url - The URL to analyze
 * @returns {Object} Security analysis result
 */
function analyzeUrlSecurity(url) {
  console.log('🔍 Analyzing URL security:', url);
  
  try {
    const urlObj = new URL(url);
    const domain = urlObj.hostname.toLowerCase();
    const protocol = urlObj.protocol;
    const pathname = urlObj.pathname;
    const searchParams = urlObj.searchParams;
    
    // Perform comprehensive security checks
    const analysis = {
      url: url,
      domain: domain,
      protocol: protocol,
      checks: {
        protocolSecurity: checkProtocolSecurity(protocol),
        domainReputation: checkDomainReputation(domain),
        phishingIndicators: checkPhishingIndicators(domain, pathname, url),
        suspiciousPatterns: checkSuspiciousPatterns(domain, url),
        urlParameters: checkUrlParameters(searchParams),
        domainAge: estimateDomainAge(domain),
        knownThreats: checkKnownThreats(domain)
      },
      timestamp: Date.now()
    };
    
    // Calculate overall threat level
    analysis.threatLevel = calculateThreatLevel(analysis.checks);
    analysis.isSecure = analysis.threatLevel === 'low';
    analysis.details = generateSecurityDetails(analysis);
    
    console.log('📊 URL analysis complete:', analysis);
    return analysis;
    
  } catch (error) {
    console.error('❌ URL analysis error:', error);
    return {
      url: url,
      isSecure: false,
      threatLevel: 'unknown',
      details: `Analysis failed: ${error.message}`,
      checks: {},
      timestamp: Date.now()
    };
  }
}

/**
 * Check protocol security (HTTPS vs HTTP)
 */
function checkProtocolSecurity(protocol) {
  const isSecure = protocol === 'https:';
  
  return {
    isSecure: isSecure,
    protocol: protocol,
    score: isSecure ? 0 : 2, // HTTP adds to threat score
    details: isSecure ? 'Secure HTTPS connection' : 'Insecure HTTP connection'
  };
}

/**
 * Check domain reputation and characteristics
 */
function checkDomainReputation(domain) {
  const checks = {
    isIP: /^[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}$/.test(domain),
    hasSubdomains: (domain.split('.').length > 2),
    isKnownSafe: isKnownSafeDomain(domain),
    isSuspiciousTLD: isSuspiciousTLD(domain),
    hasExcessiveSubdomains: (domain.split('.').length > 4),
    containsNumbers: /\d/.test(domain),
    hasHyphens: domain.includes('-')
  };
  
  let score = 0;
  let details = [];
  
  if (checks.isIP) {
    score += 3;
    details.push('Uses IP address instead of domain');
  }
  
  if (checks.isKnownSafe) {
    score -= 2; // Reduce threat score for known safe domains
    details.push('Known safe domain');
  }
  
  if (checks.isSuspiciousTLD) {
    score += 2;
    details.push('Suspicious top-level domain');
  }
  
  if (checks.hasExcessiveSubdomains) {
    score += 1;
    details.push('Excessive subdomains detected');
  }
  
  return {
    checks: checks,
    score: Math.max(0, score),
    details: details.length > 0 ? details.join(', ') : 'Domain appears normal'
  };
}

/**
 * Check for phishing indicators
 */
function checkPhishingIndicators(domain, pathname, fullUrl) {
  const phishingPatterns = [
    // Brand impersonation patterns
    /paypal.*secure/i,
    /amazon.*login/i,
    /google.*verify/i,
    /microsoft.*account/i,
    /apple.*id/i,
    /facebook.*security/i,
    /twitter.*verify/i,
    /instagram.*account/i,
    
    // Banking patterns
    /bank.*secure/i,
    /banking.*login/i,
    /account.*verify/i,
    /secure.*bank/i,
    
    // Generic phishing patterns
    /urgent.*action/i,
    /verify.*immediately/i,
    /suspended.*account/i,
    /security.*alert/i,
    /update.*payment/i
  ];
  
  const suspiciousKeywords = [
    'verify', 'urgent', 'suspended', 'limited', 'secure',
    'account', 'login', 'update', 'confirm', 'validate'
  ];
  
  let score = 0;
  let indicators = [];
  
  // Check domain and URL against phishing patterns
  const urlToCheck = fullUrl.toLowerCase();
  phishingPatterns.forEach(pattern => {
    if (pattern.test(urlToCheck)) {
      score += 3;
      indicators.push('Matches known phishing pattern');
    }
  });
  
  // Check for multiple suspicious keywords
  const keywordCount = suspiciousKeywords.filter(keyword => 
    urlToCheck.includes(keyword)
  ).length;
  
  if (keywordCount >= 3) {
    score += 2;
    indicators.push('Multiple suspicious keywords detected');
  }
  
  // Check for brand name spoofing
  if (checkBrandSpoofing(domain)) {
    score += 3;
    indicators.push('Potential brand spoofing detected');
  }
  
  return {
    score: score,
    indicators: indicators,
    details: indicators.length > 0 ? indicators.join(', ') : 'No phishing indicators detected'
  };
}

/**
 * Check for suspicious URL patterns
 */
function checkSuspiciousPatterns(domain, url) {
  const patterns = {
    longDomain: domain.length > 30,
    manyHyphens: (domain.match(/-/g) || []).length > 3,
    randomString: /[a-z0-9]{15,}/.test(domain),
    mixedCase: /[A-Z]/.test(domain) && /[a-z]/.test(domain),
    urlShortener: isUrlShortener(domain),
    suspiciousPath: checkSuspiciousPath(url)
  };
  
  let score = 0;
  let findings = [];
  
  if (patterns.longDomain) {
    score += 1;
    findings.push('Unusually long domain name');
  }
  
  if (patterns.manyHyphens) {
    score += 2;
    findings.push('Excessive hyphens in domain');
  }
  
  if (patterns.randomString) {
    score += 2;
    findings.push('Random character sequences detected');
  }
  
  if (patterns.urlShortener) {
    score += 1;
    findings.push('URL shortener service');
  }
  
  if (patterns.suspiciousPath) {
    score += 1;
    findings.push('Suspicious URL path detected');
  }
  
  return {
    patterns: patterns,
    score: score,
    details: findings.length > 0 ? findings.join(', ') : 'No suspicious patterns detected'
  };
}

/**
 * Check URL parameters for suspicious content
 */
function checkUrlParameters(searchParams) {
  const suspiciousParams = ['redirect', 'return', 'continue', 'next', 'url', 'link'];
  const suspiciousValues = ['http', 'https', 'ftp', 'javascript:', 'data:'];
  
  let score = 0;
  let findings = [];
  
  for (const [key, value] of searchParams) {
    // Check for redirect parameters
    if (suspiciousParams.includes(key.toLowerCase())) {
      score += 1;
      findings.push('Contains redirect parameters');
    }
    
    // Check for suspicious values
    const lowerValue = value.toLowerCase();
    if (suspiciousValues.some(sv => lowerValue.includes(sv))) {
      score += 2;
      findings.push('Suspicious parameter values detected');
    }
    
    // Check for encoded content
    if (value.includes('%') && value.length > 20) {
      score += 1;
      findings.push('Encoded parameters detected');
    }
  }
  
  return {
    paramCount: searchParams.size,
    score: score,
    details: findings.length > 0 ? findings.join(', ') : 'URL parameters appear normal'
  };
}

/**
 * Estimate domain age (placeholder implementation)
 */
function estimateDomainAge(domain) {
  // This is a placeholder - in a real implementation, you might:
  // - Check domain registration data
  // - Use a domain age API
  // - Maintain a database of known domains
  
  const knownOldDomains = [
    'google.com', 'microsoft.com', 'apple.com', 'amazon.com',
    'facebook.com', 'twitter.com', 'youtube.com', 'wikipedia.org'
  ];
  
  const isOldDomain = knownOldDomains.some(oldDomain => 
    domain === oldDomain || domain.endsWith('.' + oldDomain)
  );
  
  return {
    isEstimated: true,
    likelyOld: isOldDomain,
    score: isOldDomain ? -1 : 1, // Old domains reduce threat score
    details: isOldDomain ? 'Established domain' : 'Domain age unknown'
  };
}

/**
 * Check against known threat databases (placeholder)
 */
function checkKnownThreats(domain) {
  // Placeholder for known malicious domains
  const knownMalicious = [
    'malware-example.com',
    'phishing-test.net',
    'scam-site.org'
  ];
  
  const isMalicious = knownMalicious.includes(domain);
  
  return {
    isKnownThreat: isMalicious,
    score: isMalicious ? 5 : 0,
    details: isMalicious ? 'Domain flagged as malicious' : 'No known threats detected'
  };
}

/**
 * Calculate overall threat level based on all checks
 */
function calculateThreatLevel(checks) {
  let totalScore = 0;
  
  // Sum up all scores from different checks
  Object.values(checks).forEach(check => {
    if (check && typeof check.score === 'number') {
      totalScore += check.score;
    }
  });
  
  // Determine threat level based on total score
  if (totalScore >= 5) {
    return 'high';
  } else if (totalScore >= 2) {
    return 'medium';
  } else {
    return 'low';
  }
}

/**
 * Generate human-readable security details
 */
function generateSecurityDetails(analysis) {
  const { checks, threatLevel } = analysis;
  
  if (threatLevel === 'high') {
    return 'Multiple security concerns detected - exercise caution';
  } else if (threatLevel === 'medium') {
    return 'Some security concerns detected - verify site authenticity';
  } else {
    return 'Site appears secure - no major threats detected';
  }
}

/**
 * Helper function: Check if domain is a known safe domain
 */
function isKnownSafeDomain(domain) {
  const safeDomains = [
    'google.com', 'youtube.com', 'facebook.com', 'amazon.com',
    'microsoft.com', 'apple.com', 'twitter.com', 'linkedin.com',
    'github.com', 'stackoverflow.com', 'wikipedia.org', 'reddit.com',
    'netflix.com', 'spotify.com', 'dropbox.com', 'zoom.us'
  ];
  
  return safeDomains.some(safeDomain => 
    domain === safeDomain || domain.endsWith('.' + safeDomain)
  );
}

/**
 * Helper function: Check for suspicious TLDs
 */
function isSuspiciousTLD(domain) {
  const suspiciousTLDs = ['.tk', '.ml', '.ga', '.cf', '.bit.ly'];
  return suspiciousTLDs.some(tld => domain.endsWith(tld));
}

/**
 * Helper function: Check for brand spoofing
 */
function checkBrandSpoofing(domain) {
  const brands = ['google', 'paypal', 'amazon', 'microsoft', 'apple', 'facebook'];
  const domainLower = domain.toLowerCase();
  
  return brands.some(brand => {
    // Check for brand name with different TLD or extra characters
    return domainLower.includes(brand) && !domainLower.endsWith(brand + '.com');
  });
}

/**
 * Helper function: Check if domain is a URL shortener
 */
function isUrlShortener(domain) {
  const shorteners = [
    'bit.ly', 'tinyurl.com', 't.co', 'goo.gl', 'ow.ly',
    'short.link', 'tiny.cc', 'is.gd', 'buff.ly'
  ];
  
  return shorteners.includes(domain);
}

/**
 * Helper function: Check for suspicious URL paths
 */
function checkSuspiciousPath(url) {
  const suspiciousPaths = [
    '/admin', '/login', '/secure', '/verify', '/update',
    '/account', '/billing', '/payment', '/confirm'
  ];
  
  const urlLower = url.toLowerCase();
  return suspiciousPaths.some(path => urlLower.includes(path));
}

// Export functions for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    analyzeUrlSecurity,
    checkProtocolSecurity,
    checkDomainReputation,
    checkPhishingIndicators,
    isKnownSafeDomain
  };
}

console.log('🛡️ UNSCAMMED.AI URL Check utilities ready');