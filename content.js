// UNSCAMMED.AI Content Script
// Handles page-level security scanning and threat detection

console.log('🛡️ UNSCAMMED.AI Content Script loaded on:', window.location.href);

// Initialize content script
(function() {
  'use strict';
  
  // Log current page URL
  console.log('🌐 Page URL:', window.location.href);
  
  // Perform initial page scan
  performInitialScan();
  
  // Listen for messages from background script
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    console.log('📨 Message received:', request);
    
    if (request.type === "URL_SCAN") {
      handleUrlScan(request)
        .then(result => {
          sendResponse(result);
        })
        .catch(error => {
          sendResponse({
            type: "SCAN_RESULT",
            url: request.url,
            isSecure: false,
            threatLevel: "unknown",
            details: `Scan error: ${error.message}`
          });
        });
      
      return true; // Keep message channel open for async response
    }
    
    if (request.type === "MANUAL_SCAN") {
      handleManualScan(request)
        .then(result => {
          sendResponse(result);
        })
        .catch(error => {
          sendResponse({
            type: "SCAN_RESULT",
            url: request.url,
            isSecure: false,
            threatLevel: "unknown",
            details: `Manual scan error: ${error.message}`
          });
        });
      
      return true;
    }
  });
  
})();

// Perform initial security scan when page loads
function performInitialScan() {
  const currentUrl = window.location.href;
  console.log('🔍 Performing initial security scan for:', currentUrl);
  
  // Simulate local security check
  const scanResult = performLocalSecurityCheck(currentUrl);
  
  // Display scan result
  if (scanResult.threatLevel === "high") {
    showSecurityAlert(scanResult);
  } else {
    console.log('✅ Initial scan completed:', scanResult.details);
  }
}

// Handle URL scan request from background script
async function handleUrlScan(request) {
  console.log('🔍 Processing URL scan for:', request.url);
  
  // Perform security analysis
  const scanResult = performLocalSecurityCheck(request.url);
  
  // Add scan metadata
  const result = {
    type: "SCAN_RESULT",
    url: request.url,
    isSecure: scanResult.isSecure,
    threatLevel: scanResult.threatLevel,
    details: scanResult.details,
    scanTime: Date.now(),
    tabId: request.tabId
  };
  
  console.log('📊 Scan result:', result);
  return result;
}

// Handle manual scan request
async function handleManualScan(request) {
  console.log('🔍 Processing manual scan for:', request.url);

  // Show scanning indicator
  showScanningIndicator();

  try {
    // Call local API server for Google Web Risk scan
    const apiUrl = 'http://localhost:3000/scan';
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ url: request.url })
    });

    if (!response.ok) {
      throw new Error(`API server returned ${response.status}`);
    }

    const apiResult = await response.json();

    // Hide scanning indicator
    hideScanningIndicator();

    let scanResult;
    if (apiResult.success) {
      // Use Google Web Risk results
      scanResult = {
        isSecure: apiResult.isSecure,
        threatLevel: apiResult.threatLevel,
        details: apiResult.details + ' (Google Web Risk)',
        source: 'google-webrisk'
      };
    } else {
      throw new Error(apiResult.error || 'API scan failed');
    }

    // Show result to user
    showScanResult(scanResult);

    const result = {
      type: "SCAN_RESULT",
      url: request.url,
      isSecure: scanResult.isSecure,
      threatLevel: scanResult.threatLevel,
      details: scanResult.details,
      scanTime: Date.now(),
      scanType: "manual"
    };

    return result;

  } catch (error) {
    console.warn('⚠️ Google Web Risk API unavailable, falling back to local check:', error.message);

    // Fallback to local security check if API is unavailable
    const scanResult = performEnhancedSecurityCheck(request.url);

    // Hide scanning indicator
    hideScanningIndicator();

    // Show result to user
    showScanResult(scanResult);

    const result = {
      type: "SCAN_RESULT",
      url: request.url,
      isSecure: scanResult.isSecure,
      threatLevel: scanResult.threatLevel,
      details: scanResult.details + ' (Local check - API offline)',
      scanTime: Date.now(),
      scanType: "manual"
    };

    return result;
  }
}

// Perform comprehensive security check using advanced analyzer
function performLocalSecurityCheck(url) {
  console.log('🔍 Running comprehensive security check for:', url);

  try {
    const urlObj = new URL(url);
    const domain = urlObj.hostname.toLowerCase();
    const protocol = urlObj.protocol;
    const pathname = urlObj.pathname;

    // Comprehensive security analysis
    const protocolCheck = checkProtocolSecurity(protocol);
    const domainCheck = checkDomainReputation(domain);
    const phishingCheck = checkPhishingIndicators(domain, pathname, url);
    const patternCheck = checkSuspiciousPatterns(domain, url);
    const paramCheck = checkUrlParameters(urlObj.searchParams);
    const threatCheck = checkKnownThreats(domain);

    // Calculate total threat score
    let totalScore = 0;
    totalScore += protocolCheck.score || 0;
    totalScore += domainCheck.score || 0;
    totalScore += phishingCheck.score || 0;
    totalScore += patternCheck.score || 0;
    totalScore += paramCheck.score || 0;
    totalScore += threatCheck.score || 0;

    // Determine threat level based on score
    let threatLevel = "low";
    let isSecure = true;
    let details = "Site appears secure - no major threats detected";

    if (totalScore >= 5) {
      threatLevel = "high";
      isSecure = false;
      details = "Multiple security concerns detected - exercise caution";
    } else if (totalScore >= 2) {
      threatLevel = "medium";
      isSecure = true; // Medium threats are warnings, not necessarily insecure
      details = "Some security concerns detected - verify site authenticity";
    } else if (domainCheck.isKnownSafe) {
      details = "Known safe domain - no threats detected";
    }

    return {
      isSecure: isSecure,
      threatLevel: threatLevel,
      details: details,
      checks: {
        protocol: protocolCheck,
        domain: domainCheck,
        phishing: phishingCheck,
        patterns: patternCheck,
        parameters: paramCheck,
        threats: threatCheck
      },
      score: totalScore
    };

  } catch (error) {
    console.error('❌ Security check error:', error);
    return {
      isSecure: false,
      threatLevel: "unknown",
      details: `Security check failed: ${error.message}`,
      checks: {},
      score: 0
    };
  }
}

// Check protocol security
function checkProtocolSecurity(protocol) {
  const isSecure = protocol === 'https:';
  return {
    isSecure: isSecure,
    protocol: protocol,
    score: isSecure ? 0 : 2,
    details: isSecure ? 'Secure HTTPS connection' : 'Insecure HTTP connection'
  };
}

// Check domain reputation
function checkDomainReputation(domain) {
  const isIP = /^[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}$/.test(domain);
  const isKnownSafe = checkKnownSafeDomains(domain);
  const isSuspiciousTLD = /\.(tk|ml|ga|cf|bit\.ly)$/.test(domain);
  const hasExcessiveSubdomains = domain.split('.').length > 4;

  let score = 0;

  if (isIP) score += 3;
  if (isKnownSafe) score -= 2;
  if (isSuspiciousTLD) score += 2;
  if (hasExcessiveSubdomains) score += 1;

  return {
    isIP: isIP,
    isKnownSafe: isKnownSafe,
    isSuspiciousTLD: isSuspiciousTLD,
    score: Math.max(0, score),
    details: isKnownSafe ? 'Known safe domain' : (isIP ? 'Uses IP address' : 'Domain checked')
  };
}

// Enhanced phishing indicators check
function checkPhishingIndicators(domain, pathname, fullUrl) {
  const phishingPatterns = [
    /paypal.*secure/i, /amazon.*login/i, /google.*verify/i,
    /microsoft.*account/i, /apple.*id/i, /facebook.*security/i,
    /bank.*secure/i, /banking.*login/i, /account.*verify/i,
    /urgent.*action/i, /verify.*immediately/i, /suspended.*account/i
  ];

  const brandSpoofing = checkBrandSpoofing(domain);
  const urlLower = fullUrl.toLowerCase();

  let score = 0;
  const indicators = [];

  phishingPatterns.forEach(pattern => {
    if (pattern.test(urlLower)) {
      score += 3;
      indicators.push('Matches known phishing pattern');
    }
  });

  if (brandSpoofing) {
    score += 3;
    indicators.push('Potential brand spoofing');
  }

  return {
    score: Math.min(score, 5), // Cap at 5
    hasBrandSpoofing: brandSpoofing,
    indicators: indicators,
    details: indicators.length > 0 ? indicators.join(', ') : 'No phishing indicators'
  };
}

// Check brand spoofing
function checkBrandSpoofing(domain) {
  const brands = ['google', 'paypal', 'amazon', 'microsoft', 'apple', 'facebook', 'bank'];
  const domainLower = domain.toLowerCase();

  return brands.some(brand => {
    return domainLower.includes(brand) && !domainLower.endsWith(brand + '.com');
  });
}

// Check suspicious patterns
function checkSuspiciousPatterns(domain, url) {
  const longDomain = domain.length > 30;
  const manyHyphens = (domain.match(/-/g) || []).length > 3;
  const randomString = /[a-z0-9]{15,}/.test(domain);
  const suspiciousPath = /(admin|login|secure|verify|update|account|billing|payment|confirm)/i.test(url);

  let score = 0;
  if (longDomain) score += 1;
  if (manyHyphens) score += 2;
  if (randomString) score += 2;
  if (suspiciousPath) score += 1;

  return {
    score: score,
    longDomain: longDomain,
    manyHyphens: manyHyphens,
    randomString: randomString,
    suspiciousPath: suspiciousPath,
    details: score > 0 ? 'Suspicious patterns detected' : 'No suspicious patterns'
  };
}

// Check URL parameters
function checkUrlParameters(searchParams) {
  const suspiciousParams = ['redirect', 'return', 'continue', 'next', 'url', 'link'];
  let score = 0;

  for (const [key, value] of searchParams) {
    if (suspiciousParams.includes(key.toLowerCase())) {
      score += 1;
    }
    if (value.includes('http') || value.includes('https')) {
      score += 2;
    }
  }

  return {
    score: Math.min(score, 3),
    paramCount: searchParams.size,
    details: score > 0 ? 'Suspicious parameters detected' : 'Parameters normal'
  };
}

// Check known threats
function checkKnownThreats(domain) {
  // Placeholder for known malicious domains
  const knownMalicious = ['malware-example.com', 'phishing-test.net', 'scam-site.org'];
  const isMalicious = knownMalicious.includes(domain);

  return {
    isKnownThreat: isMalicious,
    score: isMalicious ? 5 : 0,
    details: isMalicious ? 'Domain flagged as malicious' : 'No known threats'
  };
}

// Enhanced security check for manual scans
function performEnhancedSecurityCheck(url) {
  console.log('🔍 Running enhanced security check for:', url);
  
  // Start with basic check
  const basicResult = performLocalSecurityCheck(url);
  
  // Add enhanced checks
  const enhancedChecks = {
    pageContent: analyzePageContent(),
    formSecurity: checkFormSecurity(),
    externalLinks: analyzeExternalLinks()
  };
  
  // Combine results
  let enhancedThreatLevel = basicResult.threatLevel;
  let enhancedDetails = basicResult.details;
  
  if (enhancedChecks.formSecurity.hasInsecureForms) {
    enhancedThreatLevel = "medium";
    enhancedDetails += " | Insecure forms detected";
  }
  
  if (enhancedChecks.externalLinks.hasSuspiciousLinks) {
    enhancedThreatLevel = "medium";
    enhancedDetails += " | Suspicious external links found";
  }
  
  return {
    isSecure: enhancedThreatLevel === "low",
    threatLevel: enhancedThreatLevel,
    details: enhancedDetails,
    checks: { ...basicResult.checks, ...enhancedChecks }
  };
}

// Check against known safe domains
function checkKnownSafeDomains(domain) {
  const safeDomains = [
    'google.com', 'youtube.com', 'facebook.com', 'amazon.com',
    'microsoft.com', 'apple.com', 'twitter.com', 'linkedin.com',
    'github.com', 'stackoverflow.com', 'wikipedia.org', 'reddit.com',
    'netflix.com', 'spotify.com', 'dropbox.com', 'zoom.us',
    'instagram.com', 'whatsapp.com', 'discord.com', 'slack.com'
  ];

  return safeDomains.some(safeDomain =>
    domain === safeDomain || domain.endsWith('.' + safeDomain)
  );
}

// Analyze page content for threats
function analyzePageContent() {
  const suspiciousText = [
    'urgent action required',
    'verify your account immediately',
    'suspended account',
    'click here to verify',
    'limited time offer'
  ];
  
  const pageText = document.body.textContent.toLowerCase();
  const hasSuspiciousContent = suspiciousText.some(text => pageText.includes(text));
  
  return {
    hasSuspiciousContent: hasSuspiciousContent,
    textAnalyzed: true
  };
}

// Check form security
function checkFormSecurity() {
  const forms = document.querySelectorAll('form');
  let hasInsecureForms = false;
  
  forms.forEach(form => {
    if (form.action && !form.action.startsWith('https://')) {
      hasInsecureForms = true;
    }
  });
  
  return {
    hasInsecureForms: hasInsecureForms,
    totalForms: forms.length
  };
}

// Analyze external links
function analyzeExternalLinks() {
  const links = document.querySelectorAll('a[href^="http"]');
  let hasSuspiciousLinks = false;

  links.forEach(link => {
    try {
      const href = link.href.toLowerCase();
      const linkDomain = new URL(href).hostname;

      // Check if link domain has suspicious patterns
      const patternCheck = checkSuspiciousPatterns(linkDomain, href);
      const phishingCheck = checkPhishingIndicators(linkDomain, '', href);

      if (patternCheck.score > 2 || phishingCheck.score > 2) {
        hasSuspiciousLinks = true;
      }
    } catch (e) {
      // Ignore invalid URLs
    }
  });

  return {
    hasSuspiciousLinks: hasSuspiciousLinks,
    totalExternalLinks: links.length
  };
}

// Show security alert for high-threat sites
function showSecurityAlert(scanResult) {
  console.warn('🚨 Security Alert:', scanResult.details);
  
  // Create alert element
  const alertDiv = document.createElement('div');
  alertDiv.id = 'unscammed-security-alert';
  alertDiv.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    background: #c00;
    color: white;
    padding: 10px;
    text-align: center;
    font-family: Arial, sans-serif;
    font-size: 14px;
    font-weight: bold;
    z-index: 999999;
    box-shadow: 0 2px 5px rgba(0,0,0,0.3);
  `;
  alertDiv.textContent = `🛡️ UNSCAMMED.AI: ${scanResult.details}`;
  
  // Add to page
  document.body.insertBefore(alertDiv, document.body.firstChild);
  
  // Auto-hide after 10 seconds
  setTimeout(() => {
    if (alertDiv.parentNode) {
      alertDiv.parentNode.removeChild(alertDiv);
    }
  }, 10000);
}

// Show scanning indicator
function showScanningIndicator() {
  const indicator = document.createElement('div');
  indicator.id = 'unscammed-scanning';
  indicator.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: #333;
    color: white;
    padding: 8px 12px;
    border-radius: 4px;
    font-family: Arial, sans-serif;
    font-size: 12px;
    z-index: 999999;
  `;
  indicator.textContent = '🛡️ Scanning...';
  document.body.appendChild(indicator);
}

// Hide scanning indicator
function hideScanningIndicator() {
  const indicator = document.getElementById('unscammed-scanning');
  if (indicator) {
    indicator.remove();
  }
}

// Show scan result to user
function showScanResult(scanResult) {
  const resultDiv = document.createElement('div');
  resultDiv.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: ${scanResult.threatLevel === 'high' ? '#c00' : scanResult.threatLevel === 'medium' ? '#f90' : '#090'};
    color: white;
    padding: 10px;
    border-radius: 4px;
    font-family: Arial, sans-serif;
    font-size: 12px;
    max-width: 300px;
    z-index: 999999;
  `;
  resultDiv.textContent = `🛡️ ${scanResult.details}`;
  
  document.body.appendChild(resultDiv);
  
  // Auto-hide after 5 seconds
  setTimeout(() => {
    if (resultDiv.parentNode) {
      resultDiv.parentNode.removeChild(resultDiv);
    }
  }, 5000);
}

console.log('🛡️ UNSCAMMED.AI Content Script ready');