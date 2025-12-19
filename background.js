// UNSCAMMED.AI Background Service Worker
// Handles URL logging, navigation monitoring, risk scoring, and message routing

console.log('🛡️ UNSCAMMED.AI Background Service Worker initialized');

// Import utility modules
importScripts(
  'utils/buildDomainFeatures.js',
  'utils/riskScoring.js',
  'utils/domainAgeChecker.js'
);

// Store HTML analysis results temporarily (URL → HTML features)
const htmlAnalysisCache = new Map();

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

// Backend API URL - configurable via storage, defaults to localhost for development
// In production, set this via chrome.storage.local.set({ apiBaseUrl: 'https://your-api.com' })
const DEFAULT_API_URL = 'http://localhost:3000';

async function getApiBaseUrl() {
  return new Promise((resolve) => {
    if (typeof chrome !== 'undefined' && chrome.storage) {
      chrome.storage.local.get(['apiBaseUrl'], (result) => {
        resolve(result.apiBaseUrl || DEFAULT_API_URL);
      });
    } else {
      resolve(DEFAULT_API_URL);
    }
  });
}

// Shared function to fetch Web Risk data from API
async function fetchWebRiskData(url) {
  try {
    const apiBaseUrl = await getApiBaseUrl();
    const apiUrl = `${apiBaseUrl}/scan`;
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

    // ═══════════════════════════════════════════════════════════
    // REVOLUTIONARY NEW FLOW: Sequential Intelligence Gathering
    // Step 1: URL → Step 2: Domain Age → Step 3: HTML → Step 4: Web Risk
    // ═══════════════════════════════════════════════════════════

    console.log('🚀 Starting comprehensive phishing detection...');
    console.log('═'.repeat(60));

    // STEP 1: Local URL Pattern Analysis (Cost: $0, Time: 1-5ms)
    console.log('🔍 STEP 1: Local URL Pattern Analysis...');
    const localFeatures = buildDomainFeatures(url, null);
    const localRiskAssessment = buildRiskScore(localFeatures);

    console.log(`📊 Local analysis: ${localRiskAssessment.score}/100 (${localRiskAssessment.label})`);
    console.log('📋 Key patterns detected:', {
      usesHttps: localFeatures.usesHttps,
      isFreeHostingService: localFeatures.isFreeHostingService,
      looksLikeBrand: localFeatures.looksLikeBrand,
      hasTyposquatting: localFeatures.hasTyposquatting,
      isRiskyTld: localFeatures.isRiskyTld,
      hasHomoglyphs: localFeatures.hasHomoglyphs,
      usesIpAddress: localFeatures.usesIpAddress,
      isUrlShortener: localFeatures.isUrlShortener,
    });
    console.log('📋 Risk reasons:', localRiskAssessment.reasons);
    console.log('═'.repeat(60));

    let webRiskData = null;
    let domainAgeData = null;
    let finalFeatures = localFeatures;
    let finalRiskAssessment = localRiskAssessment;

    // STEP 2: Domain Age Analysis - ALWAYS CHECK (Cost: ~$0.0001, Time: 100-500ms)
    console.log('📅 STEP 2: Domain Age Analysis (checking ALL sites)...');
    try {
      const urlObj = new URL(url);
      domainAgeData = await getDomainAge(urlObj.hostname);

      if (domainAgeData && domainAgeData.domainAgeDays !== null) {
        console.log(`✅ Domain age successfully retrieved!`);
        console.log(`📅 Domain age: ${domainAgeData.domainAgeDays} days old`);
        console.log(`📅 Age category: ${domainAgeData.ageCategory}`);
        console.log(`📅 Is very new (< 7 days): ${domainAgeData.isVeryNew}`);
        console.log(`📅 Is new (< 30 days): ${domainAgeData.isNew}`);
        console.log(`📅 Is young (< 1 year): ${domainAgeData.isYoung}`);
        console.log(`📅 WHOIS privacy: ${domainAgeData.whoisPrivacyEnabled}`);
        console.log(`📅 Creation date: ${domainAgeData.creationDate}`);

        // Merge domain age into features
        finalFeatures = {
          ...finalFeatures,
          ...domainAgeData
        };

        // Recalculate with domain age
        finalRiskAssessment = buildRiskScore(finalFeatures);
        console.log(`📊 Score after domain age: ${finalRiskAssessment.score}/100 (${finalRiskAssessment.label})`);
      } else {
        console.warn('⚠️  Domain age data was null or incomplete');
      }
    } catch (error) {
      console.warn('⚠️  Domain age check failed:', error.message);
    }
    console.log('═'.repeat(60));

    // STEP 3: Wait for HTML Content Analysis (Cost: $0, Timeout: 3 seconds)
    console.log('🔬 STEP 3: Waiting for HTML Content Analysis (timeout: 3s)...');

    // Function to wait for HTML analysis with timeout
    const waitForHtmlAnalysis = (url, timeoutMs) => {
      return new Promise((resolve) => {
        const startTime = Date.now();
        const checkInterval = 100; // Check every 100ms

        const checkForHtml = () => {
          const htmlAnalysis = htmlAnalysisCache.get(url);

          if (htmlAnalysis && htmlAnalysis.htmlFeatures) {
            // HTML analysis found!
            resolve(htmlAnalysis);
          } else if (Date.now() - startTime >= timeoutMs) {
            // Timeout reached
            console.log(`⏱️  HTML analysis timeout (${timeoutMs}ms) - proceeding without HTML data`);
            resolve(null);
          } else {
            // Keep waiting
            setTimeout(checkForHtml, checkInterval);
          }
        };

        checkForHtml();
      });
    };

    // Wait for HTML analysis (3 second timeout)
    const htmlAnalysis = await waitForHtmlAnalysis(url, 3000);

    if (htmlAnalysis && htmlAnalysis.htmlFeatures) {
      console.log('✅ HTML analysis received!');
      console.log(`🔬 Trust signal count: ${htmlAnalysis.htmlFeatures.trustSignalScore}/10`);
      console.log(`🔬 Overall trust score: ${htmlAnalysis.htmlFeatures.trustScore}/100`);
      console.log(`🔬 Suspicion signals: ${htmlAnalysis.htmlFeatures.suspicionScore || 0}`);

      // COMPREHENSIVE HTML FLAGS LOGGING
      console.log('🔬 HTML flags (ALL PROPERTIES):');
      console.log('  📝 Basic Detection:');
      console.log(`    - hasLoginForm: ${htmlAnalysis.htmlFeatures.hasLoginForm}`);
      console.log(`    - hasPasswordField: ${htmlAnalysis.htmlFeatures.hasPasswordField}`);
      console.log(`    - hasInsecureFormSubmission: ${htmlAnalysis.htmlFeatures.hasInsecureFormSubmission}`);
      console.log(`    - hasExternalFormAction: ${htmlAnalysis.htmlFeatures.hasExternalFormAction}`);

      console.log('  💳 Financial Harvesting Detection:');
      console.log(`    - hasFinancialHarvesting: ${htmlAnalysis.htmlFeatures.hasFinancialHarvesting}`);
      console.log(`    - hasCVVField: ${htmlAnalysis.htmlFeatures.hasCVVField}`);
      console.log(`    - hasBankAccountField: ${htmlAnalysis.htmlFeatures.hasBankAccountField}`);
      console.log(`    - hasCryptoField: ${htmlAnalysis.htmlFeatures.hasCryptoField}`);

      console.log('  🎣 Phishing Detection:');
      console.log(`    - has2FAPhishing: ${htmlAnalysis.htmlFeatures.has2FAPhishing}`);
      console.log(`    - hasOTPField: ${htmlAnalysis.htmlFeatures.hasOTPField}`);
      console.log(`    - hasBrandMismatch: ${htmlAnalysis.htmlFeatures.hasBrandMismatch}`);
      console.log(`    - hasHiddenIframes: ${htmlAnalysis.htmlFeatures.hasHiddenIframes}`);

      console.log('  ⏰ Urgency Tactics:');
      console.log(`    - hasUrgentLanguage: ${htmlAnalysis.htmlFeatures.hasUrgentLanguage}`);
      console.log(`    - hasCountdownTimer: ${htmlAnalysis.htmlFeatures.hasCountdownTimer}`);
      console.log(`    - hasFakeSecurityBadge: ${htmlAnalysis.htmlFeatures.hasFakeSecurityBadge}`);

      console.log('  🎯 Trust Classification:');
      console.log(`    - isLowTrust: ${htmlAnalysis.htmlFeatures.isLowTrust}`);
      console.log(`    - isMediumTrust: ${htmlAnalysis.htmlFeatures.isMediumTrust}`);
      console.log(`    - isHighTrust: ${htmlAnalysis.htmlFeatures.isHighTrust}`);

      // Merge HTML features
      finalFeatures = {
        ...finalFeatures,
        html: htmlAnalysis.htmlFeatures
      };

      // Recalculate with HTML features
      finalRiskAssessment = buildRiskScore(finalFeatures);
      console.log(`📊 Score after HTML analysis: ${finalRiskAssessment.score}/100 (${finalRiskAssessment.label})`);

      // DETAILED RISK REASONS LOGGING
      console.log('📋 DETAILED RISK REASONS:');
      if (finalRiskAssessment.reasons && finalRiskAssessment.reasons.length > 0) {
        finalRiskAssessment.reasons.forEach((reason, index) => {
          console.log(`  ${index + 1}. ${reason}`);
        });
      } else {
        console.log('  No specific risk reasons detected');
      }

      // Clean up cache entry
      htmlAnalysisCache.delete(url);
    } else {
      console.log('ℹ️  No HTML analysis available (timeout or content script not loaded)');
      console.log('💡 Proceeding with URL + Domain Age data only');
    }
    console.log('═'.repeat(60));

    // STEP 4: Decide whether to call Web Risk API (Threshold: score >= 25, aligned with SUSPICIOUS threshold)
    console.log('🌐 STEP 4: Web Risk API Decision...');
    console.log(`📊 Combined score (URL + Domain Age + HTML): ${finalRiskAssessment.score}/100`);

    // Call Web Risk API for any site that meets SUSPICIOUS threshold (25+)
    // This ensures all flagged sites get validated with Google's threat database
    if (finalRiskAssessment.score >= 25) {
      // Site looks SUSPICIOUS or higher - validate with Web Risk API
      console.log('⚠️  Site shows suspicious signals (score >= 25)');
      console.log('🌐 Calling Google Web Risk API for final validation...');

      try {
        webRiskData = await fetchWebRiskData(url);

        if (webRiskData) {
          // Re-analyze with Web Risk data included
          console.log('✅ Web Risk data received!');
          finalFeatures = buildDomainFeatures(url, webRiskData);

          // Preserve domain age and HTML data
          if (domainAgeData) {
            finalFeatures = { ...finalFeatures, ...domainAgeData };
          }
          if (htmlAnalysis && htmlAnalysis.htmlFeatures) {
            finalFeatures = { ...finalFeatures, html: htmlAnalysis.htmlFeatures };
          }

          finalRiskAssessment = buildRiskScore(finalFeatures);
          console.log(`📊 Final score with Web Risk: ${finalRiskAssessment.score}/100 (${finalRiskAssessment.label})`);
        }
      } catch (error) {
        console.warn('⚠️  Web Risk API call failed:', error.message);
      }
    } else {
      // Site appears safe or low-risk after all free checks - skip expensive API
      console.log('✅ Site appears safe or low-risk (score < 25)');
      console.log('💰 Skipping Web Risk API call (cost optimization)');
      console.log('💡 Final decision based on free checks only');
    }
    console.log('═'.repeat(60));

    // Summary of entire detection process
    console.log('📊 DETECTION SUMMARY:');
    console.log(`   URL Analysis Score:    ${localRiskAssessment.score}/100`);
    console.log(`   After Domain Age:      ${domainAgeData ? finalRiskAssessment.score : localRiskAssessment.score}/100`);
    console.log(`   After HTML Analysis:   ${finalRiskAssessment.score}/100`);
    console.log(`   Final Risk Label:      ${finalRiskAssessment.label}`);
    console.log(`   Web Risk API Called:   ${webRiskData ? 'YES' : 'NO'}`);
    console.log(`   Total Risk Reasons:    ${finalRiskAssessment.reasons.length}`);
    console.log('═'.repeat(60));

    // Create comprehensive result
    const result = {
      id: scanId,
      type: 'SCAN_RESULT',
      url: url,

      // Risk scoring
      riskScore: finalRiskAssessment.score,
      riskLabel: finalRiskAssessment.label,
      riskReasons: finalRiskAssessment.reasons,

      // Legacy fields for compatibility
      threats: finalFeatures.webRiskThreatTypes,
      threatLevel: mapRiskLabelToThreatLevel(finalRiskAssessment.label),
      isSecure: finalRiskAssessment.label === 'LIKELY_SAFE',
      details: generateDetailsMessage(finalRiskAssessment),

      // Domain features
      features: finalFeatures,

      // Domain age information (for display)
      domainAge: domainAgeData ? {
        ageDays: domainAgeData.domainAgeDays,
        ageCategory: domainAgeData.ageCategory,
        creationDate: domainAgeData.creationDate,
        isVeryNew: domainAgeData.isVeryNew,
        isNew: domainAgeData.isNew,
        whoisPrivacy: domainAgeData.whoisPrivacyEnabled
      } : null,
      domainAgeChecked: domainAgeData !== null,

      // Metadata
      source: webRiskData ? 'automatic-scan-with-webrisk' : 'automatic-scan-local-only',
      scanType: 'automatic',
      localScore: localRiskAssessment.score,
      webRiskCalled: webRiskData !== null,
      cost: 0,
      timestamp: Date.now()
    };

    console.log(`✅ Risk assessment complete: ${result.riskScore}/100 (${result.riskLabel}) [Web Risk API: ${result.webRiskCalled ? 'Called' : 'Skipped'}]`);

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

// Helper function to validate message sender
function isValidSender(sender) {
  // Allow messages from our own extension (content scripts, popup)
  if (sender.id === chrome.runtime.id) {
    return true;
  }
  // Allow messages from extension pages (no sender.id but has extension URL)
  if (sender.url && sender.url.startsWith(`chrome-extension://${chrome.runtime.id}`)) {
    return true;
  }
  return false;
}

// Listen for messages from popup and content scripts
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  // Validate sender for security
  if (!isValidSender(sender)) {
    console.warn('⚠️ Rejected message from untrusted sender:', sender);
    sendResponse({ success: false, error: 'Unauthorized sender' });
    return false;
  }

  // Handle HTML analysis from content script
  if (request.type === "HTML_ANALYSIS_COMPLETE") {
    console.log('🔬 HTML analysis received from content script');

    // Validate required fields and types
    if (!request.url || typeof request.url !== 'string') {
      console.warn('⚠️ Invalid HTML analysis message - missing or invalid url');
      sendResponse({ success: false, error: 'Invalid message format: url must be a string' });
      return false;
    }
    if (!request.htmlFeatures || typeof request.htmlFeatures !== 'object') {
      console.warn('⚠️ Invalid HTML analysis message - missing or invalid htmlFeatures');
      sendResponse({ success: false, error: 'Invalid message format: htmlFeatures must be an object' });
      return false;
    }

    // Store HTML features temporarily (will be merged during risk assessment)
    htmlAnalysisCache.set(request.url, {
      htmlFeatures: request.htmlFeatures,
      timestamp: Date.now()
    });

    // Clean old entries (keep last 100)
    if (htmlAnalysisCache.size > 100) {
      const firstKey = htmlAnalysisCache.keys().next().value;
      htmlAnalysisCache.delete(firstKey);
    }

    sendResponse({ success: true });
    return true;
  }

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
// Uses SAME sequential flow as automatic detection
async function performManualScan(tabId, url) {
  return new Promise(async (resolve, reject) => {
    try {
      // Generate scan ID
      const scanId = generateId();

      console.log('🔍 Starting manual scan (using new sequential flow)...');
      console.log('═'.repeat(60));

      // STEP 1: Local URL Pattern Analysis
      console.log('🔍 STEP 1: Local URL Pattern Analysis...');
      const localFeatures = buildDomainFeatures(url, null);
      const localRiskAssessment = buildRiskScore(localFeatures);

      console.log(`📊 Local analysis: ${localRiskAssessment.score}/100 (${localRiskAssessment.label})`);
      console.log('📋 Risk reasons:', localRiskAssessment.reasons);
      console.log('═'.repeat(60));

      let webRiskData = null;
      let webRiskError = null;
      let domainAgeData = null;
      let finalFeatures = localFeatures;
      let finalRiskAssessment = localRiskAssessment;

      // STEP 2: Domain Age Analysis - ALWAYS CHECK
      console.log('📅 STEP 2: Domain Age Analysis (checking ALL sites)...');
      try {
        const urlObj = new URL(url);
        domainAgeData = await getDomainAge(urlObj.hostname);

        if (domainAgeData && domainAgeData.domainAgeDays !== null) {
          console.log(`✅ Domain age: ${domainAgeData.domainAgeDays} days (${domainAgeData.ageCategory})`);

          // Merge domain age into features
          finalFeatures = { ...finalFeatures, ...domainAgeData };
          finalRiskAssessment = buildRiskScore(finalFeatures);
          console.log(`📊 Score after domain age: ${finalRiskAssessment.score}/100`);
        }
      } catch (error) {
        console.warn('⚠️  Domain age check failed:', error.message);
      }
      console.log('═'.repeat(60));

      // STEP 3: Wait for HTML Analysis (1 second timeout for manual scan)
      console.log('🔬 STEP 3: Waiting for HTML analysis (1s timeout)...');

      const waitForHtmlAnalysis = (url, timeoutMs) => {
        return new Promise((resolve) => {
          const startTime = Date.now();
          const checkInterval = 100;

          const checkForHtml = () => {
            const htmlAnalysis = htmlAnalysisCache.get(url);
            if (htmlAnalysis && htmlAnalysis.htmlFeatures) {
              resolve(htmlAnalysis);
            } else if (Date.now() - startTime >= timeoutMs) {
              resolve(null);
            } else {
              setTimeout(checkForHtml, checkInterval);
            }
          };
          checkForHtml();
        });
      };

      const htmlAnalysis = await waitForHtmlAnalysis(url, 1000);

      if (htmlAnalysis && htmlAnalysis.htmlFeatures) {
        console.log('✅ HTML analysis received!');
        finalFeatures = { ...finalFeatures, html: htmlAnalysis.htmlFeatures };
        finalRiskAssessment = buildRiskScore(finalFeatures);
        console.log(`📊 Score after HTML: ${finalRiskAssessment.score}/100`);
        htmlAnalysisCache.delete(url);
      } else {
        console.log('ℹ️  No HTML analysis available');
      }
      console.log('═'.repeat(60));

      // STEP 4: Web Risk API Decision (threshold: 25, aligned with SUSPICIOUS threshold)
      console.log('🌐 STEP 4: Web Risk API Decision...');
      console.log(`📊 Combined score: ${finalRiskAssessment.score}/100`);

      if (finalRiskAssessment.score >= 25) {
        console.log('⚠️  SUSPICIOUS - calling Web Risk API...');
        webRiskData = await fetchWebRiskData(url);
        webRiskError = webRiskData ? null : 'API unavailable';

        if (webRiskData) {
          console.log('✅ Web Risk data received!');
          finalFeatures = buildDomainFeatures(url, webRiskData);
          if (domainAgeData) finalFeatures = { ...finalFeatures, ...domainAgeData };
          if (htmlAnalysis) finalFeatures = { ...finalFeatures, html: htmlAnalysis.htmlFeatures };
          finalRiskAssessment = buildRiskScore(finalFeatures);
          console.log(`📊 Final score: ${finalRiskAssessment.score}/100`);
        }
      } else {
        console.log('✅ Score < 25 - skipping Web Risk API');
        webRiskError = 'Skipped (score < 25 threshold)';
      }
      console.log('═'.repeat(60));

      // Create comprehensive result
      const result = {
        id: scanId,
        type: 'SCAN_RESULT',
        url: url,

        // Risk scoring
        riskScore: finalRiskAssessment.score,
        riskLabel: finalRiskAssessment.label,
        riskReasons: finalRiskAssessment.reasons,

        // Legacy fields
        threats: finalFeatures.webRiskThreatTypes,
        threatLevel: mapRiskLabelToThreatLevel(finalRiskAssessment.label),
        isSecure: finalRiskAssessment.label === 'LIKELY_SAFE',
        details: generateDetailsMessage(finalRiskAssessment, webRiskError),

        // Domain features
        features: finalFeatures,

        // Domain age information (for display)
        domainAge: domainAgeData ? {
          ageDays: domainAgeData.domainAgeDays,
          ageCategory: domainAgeData.ageCategory,
          creationDate: domainAgeData.creationDate,
          isVeryNew: domainAgeData.isVeryNew,
          isNew: domainAgeData.isNew,
          whoisPrivacy: domainAgeData.whoisPrivacyEnabled
        } : null,
        domainAgeChecked: domainAgeData !== null,

        // Metadata
        source: webRiskData ? 'manual-scan-with-webrisk' : 'manual-scan-local-only',
        scanType: 'manual',
        localScore: localRiskAssessment.score,
        webRiskCalled: webRiskData !== null,
        cost: 0,
        timestamp: Date.now()
      };

      console.log(`✅ Manual scan complete: ${result.riskScore}/100 (${result.riskLabel}) [Web Risk API: ${result.webRiskCalled ? 'Called' : 'Skipped'}]`);

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
  return Date.now().toString(36) + Math.random().toString(36).slice(2);
}

// Error handling for unhandled promise rejections
self.addEventListener('unhandledrejection', (event) => {
  console.error('🚨 Unhandled promise rejection in background script:', event.reason);
});

console.log('🛡️ UNSCAMMED.AI Background Service Worker ready with risk scoring engine');
