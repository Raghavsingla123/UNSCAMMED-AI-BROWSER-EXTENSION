// UNSCAMMED.AI Background Service Worker
// Handles URL logging, navigation monitoring, risk scoring, and message routing

console.log('🛡️ UNSCAMMED.AI Background Service Worker initialized');

// Import utility modules
importScripts('utils/buildDomainFeatures.js', 'utils/riskScoring.js');

// Initialize extension state on startup
chrome.runtime.onStartup.addListener(() => {
  initializeExtension();
});

chrome.runtime.onInstalled.addListener(() => {
  initializeExtension();
});

// Initialize extension configuration and state
function initializeExtension() {
  const extensionState = {
    isActive: true,
    version: "2.0.0",  // Updated version for risk scoring integration
    lastUpdate: Date.now(),
    totalScans: 0
  };

  const userSettings = {
    autoScan: true,
    alertLevel: "medium",
    logUrls: true,
    showNotifications: true,
    scanTimeout: 5000
  };

  // Store initial configuration
  chrome.storage.local.set({
    extensionState: extensionState,
    userSettings: userSettings
  });

  console.log('🛡️ Extension initialized with risk scoring engine');
}

// Shared function to fetch Web Risk data from API
async function fetchWebRiskData(url) {
  try {
    const apiUrl = 'http://localhost:3000/scan';
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ url: url })
    });

    if (!response.ok) {
      throw new Error(`API server returned ${response.status}`);
    }

    const apiResult = await response.json();

    if (apiResult.success) {
      console.log('✅ Google Web Risk scan complete:', apiResult.threats.length > 0 ? apiResult.threats : 'No threats');
      return {
        threats: apiResult.threats || [],
        threatTypes: apiResult.threats || [],
        source: apiResult.source
      };
    } else {
      throw new Error(apiResult.error || 'API scan failed');
    }

  } catch (error) {
    console.warn('⚠️ Google Web Risk API unavailable:', error.message);
    console.log('   → Continuing with local-only risk assessment');
    return null;
  }
}

// Listen for completed page navigations
chrome.webNavigation.onCompleted.addListener((details) => {
  // Only process main frame navigations (not iframes)
  if (details.frameId === 0) {
    console.log('🌐 Navigation completed:', details.url);

    // Perform automatic risk assessment
    performAutomaticRiskAssessment(details.url, details.tabId);
  }
});

// Perform automatic risk assessment on navigation
async function performAutomaticRiskAssessment(url, tabId) {
  try {
    // Generate scan ID for tracking
    const scanId = generateId();

    // Log the visited URL
    logVisitedUrl(url, tabId, scanId);

    // Call Google Web Risk API for automatic protection
    console.log('📡 Calling Google Web Risk API...');
    const webRiskData = await fetchWebRiskData(url);

    // Extract domain features (merge Web Risk results)
    console.log('🔍 Extracting domain features...');
    const domainFeatures = buildDomainFeatures(url, webRiskData);

    // Calculate risk score
    console.log('📊 Calculating risk score...');
    const riskAssessment = buildRiskScore(domainFeatures);

    // Create comprehensive result
    const result = {
      id: scanId,
      type: 'SCAN_RESULT',
      url: url,

      // NEW: Risk scoring
      riskScore: riskAssessment.score,
      riskLabel: riskAssessment.label,
      riskReasons: riskAssessment.reasons,

      // Legacy fields for compatibility
      threats: domainFeatures.webRiskThreatTypes,
      threatLevel: mapRiskLabelToThreatLevel(riskAssessment.label),
      isSecure: riskAssessment.label === 'LIKELY_SAFE',
      details: generateDetailsMessage(riskAssessment),

      // Domain features
      features: domainFeatures,

      // Metadata
      source: webRiskData ? 'automatic-scan-with-webrisk' : 'automatic-scan-local',
      scanType: 'automatic',
      cost: 0,
      timestamp: Date.now()
    };

    console.log(`✅ Risk assessment complete: ${result.riskScore}/100 (${result.riskLabel})`);

    // Store scan result
    handleScanResult(result, scanId);

    // Send to content script if risk is concerning
    if (result.riskLabel === 'DANGEROUS' || result.riskLabel === 'SUSPICIOUS') {
      sendRiskAssessmentToContent(tabId, result);
    }

  } catch (error) {
    console.error('❌ Automatic risk assessment failed:', error);
  }
}

// Log visited URL to storage
function logVisitedUrl(url, tabId, scanId) {
  const urlLog = {
    id: scanId,
    url: url,
    visitTime: Date.now(),
    tabId: tabId,
    scanStatus: "pending"
  };

  // Get existing URL history and add new entry
  chrome.storage.local.get(['urlHistory'], (result) => {
    const history = result.urlHistory || [];
    history.push(urlLog);

    // Keep only last 100 entries to prevent storage bloat
    if (history.length > 100) {
      history.splice(0, history.length - 100);
    }

    chrome.storage.local.set({ urlHistory: history });
    console.log('📝 URL logged:', url, 'with ID:', scanId);
  });
}

// Send risk assessment to content script
function sendRiskAssessmentToContent(tabId, result) {
  const message = {
    type: "SHOW_RISK_ASSESSMENT",
    risk: {
      score: result.riskScore,
      label: result.riskLabel,
      reasons: result.riskReasons
    },
    features: result.features,
    url: result.url
  };

  chrome.tabs.sendMessage(tabId, message, (response) => {
    if (chrome.runtime.lastError) {
      console.log('⚠️ Could not send risk assessment to content script:', chrome.runtime.lastError.message);
    } else if (response) {
      console.log('✅ Risk assessment delivered to content script');
    }
  });
}

// Handle scan results from any source
function handleScanResult(scanResult, scanId) {
  // Use provided scanId or generate one for manual scans
  const resultId = scanId || generateId();

  // Store comprehensive scan result
  const result = {
    id: resultId,
    url: scanResult.url,

    // Risk scoring
    riskScore: scanResult.riskScore,
    riskLabel: scanResult.riskLabel,
    riskReasons: scanResult.riskReasons,

    // Legacy fields
    isSecure: scanResult.isSecure,
    threatLevel: scanResult.threatLevel,
    threats: scanResult.threats,
    details: scanResult.details,

    // Metadata
    features: scanResult.features,
    scanTime: Date.now(),
    scanType: scanResult.scanType || "automatic"
  };

  chrome.storage.local.set({ [`scan_${result.id}`]: result });

  // Update total scans counter
  chrome.storage.local.get(['extensionState'], (data) => {
    if (data.extensionState) {
      data.extensionState.totalScans += 1;
      chrome.storage.local.set({ extensionState: data.extensionState });
    }
  });

  console.log('🔍 Scan result stored with ID:', result.id);
}

// Listen for messages from popup and content scripts
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === "MANUAL_SCAN") {
    console.log('🔍 Manual scan requested for:', request.url);

    // Trigger manual scan
    performManualScan(request.tabId, request.url)
      .then(result => {
        sendResponse({ success: true, result: result });
      })
      .catch(error => {
        sendResponse({ success: false, error: error.message });
      });

    return true; // Keep message channel open for async response
  }

  if (request.type === "GET_SCAN_STATUS") {
    // Return current scan status for popup
    chrome.storage.local.get(['extensionState'], (data) => {
      sendResponse({
        success: true,
        state: data.extensionState || { isActive: true, totalScans: 0 }
      });
    });

    return true;
  }
});

// Perform manual security scan with full risk assessment
async function performManualScan(tabId, url) {
  return new Promise(async (resolve, reject) => {
    try {
      // Generate scan ID
      const scanId = generateId();

      console.log('🔍 Starting manual scan...');

      // Step 1: Call Google Web Risk API (using shared function)
      const webRiskData = await fetchWebRiskData(url);
      const webRiskError = webRiskData ? null : 'API unavailable';

      // Step 2: Extract domain features (merge Web Risk results)
      console.log('🔍 Extracting domain features...');
      const domainFeatures = buildDomainFeatures(url, webRiskData);

      // Step 3: Calculate comprehensive risk score
      console.log('📊 Calculating risk score...');
      const riskAssessment = buildRiskScore(domainFeatures);

      // Step 4: Create comprehensive result
      const result = {
        id: scanId,
        type: 'SCAN_RESULT',
        url: url,

        // Risk scoring
        riskScore: riskAssessment.score,
        riskLabel: riskAssessment.label,
        riskReasons: riskAssessment.reasons,

        // Legacy fields
        threats: domainFeatures.webRiskThreatTypes,
        threatLevel: mapRiskLabelToThreatLevel(riskAssessment.label),
        isSecure: riskAssessment.label === 'LIKELY_SAFE',
        details: generateDetailsMessage(riskAssessment, webRiskError),

        // Domain features
        features: domainFeatures,

        // Metadata
        source: webRiskData ? 'manual-scan-with-webrisk' : 'manual-scan-local',
        scanType: 'manual',
        cost: 0,
        timestamp: Date.now()
      };

      console.log(`✅ Manual scan complete: ${result.riskScore}/100 (${result.riskLabel})`);

      // Store scan result
      handleScanResult(result, scanId);

      // Send to content script for display
      sendRiskAssessmentToContent(tabId, result);

      // Return result to popup
      resolve(result);

    } catch (error) {
      console.error('❌ Manual scan failed:', error);
      reject(error);
    }
  });
}

// Helper: Map risk label to legacy threat level
function mapRiskLabelToThreatLevel(riskLabel) {
  switch (riskLabel) {
    case 'DANGEROUS':
      return 'high';
    case 'SUSPICIOUS':
      return 'medium';
    case 'LIKELY_SAFE':
      return 'low';
    default:
      return 'unknown';
  }
}

// Helper: Generate details message
function generateDetailsMessage(riskAssessment, webRiskError) {
  if (riskAssessment.label === 'DANGEROUS') {
    return `⚠️ DANGEROUS SITE (Score: ${riskAssessment.score}/100) - ${riskAssessment.reasons.length} security concerns detected`;
  } else if (riskAssessment.label === 'SUSPICIOUS') {
    return `⚠️ SUSPICIOUS SITE (Score: ${riskAssessment.score}/100) - ${riskAssessment.reasons.length} security concerns detected`;
  } else {
    const message = `✅ LIKELY SAFE (Score: ${riskAssessment.score}/100) - No major threats detected`;
    if (webRiskError) {
      return message + ' (Web Risk API unavailable)';
    }
    return message;
  }
}

// Generate unique ID for logging
function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

// Error handling for unhandled promise rejections
self.addEventListener('unhandledrejection', (event) => {
  console.error('🚨 Unhandled promise rejection in background script:', event.reason);
});

console.log('🛡️ UNSCAMMED.AI Background Service Worker ready with risk scoring engine');
