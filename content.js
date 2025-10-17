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
  
  // Perform enhanced security analysis for manual scans
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
    details: scanResult.details,
    scanTime: Date.now(),
    scanType: "manual"
  };
  
  return result;
}

// Perform local security check (placeholder implementation)
function performLocalSecurityCheck(url) {
  console.log('🔍 Running local security check for:', url);
  
  try {
    const urlObj = new URL(url);
    const domain = urlObj.hostname.toLowerCase();
    
    // Basic security checks
    const checks = {
      hasHttps: urlObj.protocol === 'https:',
      suspiciousDomain: checkSuspiciousDomain(domain),
      hasPhishingIndicators: checkPhishingIndicators(domain, url),
      isKnownSafe: checkKnownSafeDomains(domain)
    };
    
    // Determine threat level
    let threatLevel = "low";
    let isSecure = true;
    let details = "Domain appears safe, no threats detected";
    
    if (checks.suspiciousDomain || checks.hasPhishingIndicators) {
      threatLevel = "high";
      isSecure = false;
      details = "Potential phishing or malicious domain detected";
    } else if (!checks.hasHttps) {
      threatLevel = "medium";
      details = "Insecure connection (HTTP), data may be vulnerable";
    } else if (checks.isKnownSafe) {
      details = "Verified safe domain";
    }
    
    return {
      isSecure: isSecure,
      threatLevel: threatLevel,
      details: details,
      checks: checks
    };
    
  } catch (error) {
    console.error('❌ Security check error:', error);
    return {
      isSecure: false,
      threatLevel: "unknown",
      details: `Security check failed: ${error.message}`,
      checks: {}
    };
  }
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

// Check for suspicious domain patterns
function checkSuspiciousDomain(domain) {
  const suspiciousPatterns = [
    /[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}/, // IP addresses
    /[a-z0-9]+-[a-z0-9]+-[a-z0-9]+\.(tk|ml|ga|cf)/, // Suspicious TLDs with hyphens
    /(secure|login|account|verify|update).*\.(tk|ml|ga|cf|bit\.ly)/, // Phishing keywords
    /[a-z]{20,}/, // Very long domain names
  ];
  
  return suspiciousPatterns.some(pattern => pattern.test(domain));
}

// Check for phishing indicators
function checkPhishingIndicators(domain, url) {
  const phishingIndicators = [
    /paypal.*secure/, // Fake PayPal
    /amazon.*login/, // Fake Amazon
    /google.*verify/, // Fake Google
    /microsoft.*account/, // Fake Microsoft
    /apple.*id/, // Fake Apple ID
    /bank.*secure/, // Generic bank phishing
  ];
  
  const fullUrl = url.toLowerCase();
  return phishingIndicators.some(pattern => pattern.test(fullUrl));
}

// Check against known safe domains
function checkKnownSafeDomains(domain) {
  const safeDomains = [
    'google.com', 'youtube.com', 'facebook.com', 'amazon.com',
    'microsoft.com', 'apple.com', 'twitter.com', 'linkedin.com',
    'github.com', 'stackoverflow.com', 'wikipedia.org'
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
    const href = link.href.toLowerCase();
    if (checkSuspiciousDomain(new URL(href).hostname)) {
      hasSuspiciousLinks = true;
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