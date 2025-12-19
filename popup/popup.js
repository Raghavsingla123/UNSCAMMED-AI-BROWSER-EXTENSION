// UNSCAMMED.AI Popup Script
// Handles popup UI interactions and communication with background script

console.log('🛡️ UNSCAMMED.AI Popup loaded');

// DOM elements
let currentUrlElement;
let securityStatusElement;
let scanButton;
let totalScansElement;
let extensionStatusElement;

// Initialize popup when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  initializePopup();
});

// Initialize popup interface
function initializePopup() {
  console.log('🔧 Initializing popup interface');
  
  // Get DOM elements
  currentUrlElement = document.getElementById('currentUrl');
  securityStatusElement = document.getElementById('securityStatus');
  scanButton = document.getElementById('scanButton');
  totalScansElement = document.getElementById('totalScans');
  extensionStatusElement = document.getElementById('extensionStatus');
  
  // Set up event listeners
  scanButton.addEventListener('click', handleScanButtonClick);
  
  // Load initial data
  loadCurrentTabInfo();
  loadExtensionStatus();
}

// Load current tab information
async function loadCurrentTabInfo() {
  try {
    console.log('📋 Loading current tab info');
    
    // Query active tab
    const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
    
    if (tabs.length > 0) {
      const currentTab = tabs[0];
      const url = currentTab.url;
      
      // Display current URL
      displayCurrentUrl(url);
      
      // Check if we have recent scan data for this URL
      checkRecentScanData(url);
      
    } else {
      currentUrlElement.textContent = 'No active tab';
      updateSecurityStatus('unknown', 'Unable to detect current page');
    }
    
  } catch (error) {
    console.error('❌ Error loading tab info:', error);
    currentUrlElement.textContent = 'Error loading tab';
    updateSecurityStatus('error', 'Failed to load tab information');
  }
}

// Display current URL in popup
function displayCurrentUrl(url) {
  try {
    const urlObj = new URL(url);
    const domain = urlObj.hostname;
    
    // Show domain prominently, full URL in title
    currentUrlElement.textContent = domain;
    currentUrlElement.title = url;
    
    console.log('🌐 Current URL displayed:', domain);
    
  } catch (error) {
    // Handle non-standard URLs (chrome://, file://, etc.)
    currentUrlElement.textContent = url.length > 40 ? url.substring(0, 40) + '...' : url;
    currentUrlElement.title = url;
  }
}

// Check for recent scan data
async function checkRecentScanData(url) {
  try {
    // Show loading state
    updateSecurityStatus('pending', 'Checking security status...');

    // Get recent scan results from storage
    const result = await chrome.storage.local.get(['urlHistory']);
    const urlHistory = result.urlHistory || [];

    // Find recent scan for this URL (within last 5 minutes)
    const fiveMinutesAgo = Date.now() - (5 * 60 * 1000);
    const recentScans = urlHistory
      .filter(entry => entry.url === url && entry.visitTime > fiveMinutesAgo)
      .sort((a, b) => b.visitTime - a.visitTime);

    console.log('🔍 Found', recentScans.length, 'recent scans for this URL');

    // Try to find scan result for the most recent entries
    for (const recentScan of recentScans) {
      const scanResult = await chrome.storage.local.get([`scan_${recentScan.id}`]);
      const scanData = scanResult[`scan_${recentScan.id}`];

      if (scanData) {
        // Check if we have new risk scoring data
        if (scanData.riskScore !== undefined && scanData.riskLabel) {
          updateSecurityStatus(
            scanData.threatLevel,
            scanData.details,
            scanData.riskScore,
            scanData.riskLabel,
            scanData.riskReasons
          );
        } else {
          // Fallback to legacy format
          updateSecurityStatus(scanData.threatLevel, scanData.details);
        }
        console.log('📊 Recent scan data found:', scanData);
        return;
      }
    }

    // No recent scan data found, but URL was recently visited
    if (recentScans.length > 0) {
      updateSecurityStatus('pending', 'Scan in progress... Click to scan manually');
    } else {
      updateSecurityStatus('pending', 'Click to scan this site');
    }

  } catch (error) {
    console.error('❌ Error checking scan data:', error);
    updateSecurityStatus('unknown', 'Unable to check scan status');
  }
}

// Update security status display
function updateSecurityStatus(threatLevel, details, riskScore, riskLabel, riskReasons) {
  const securityIcon = securityStatusElement.querySelector('.security-icon');
  const securityText = securityStatusElement.querySelector('.security-text');

  // Remove existing status classes
  securityStatusElement.classList.remove('secure', 'warning', 'danger');

  // If we have new risk scoring data, use that
  if (riskScore !== undefined && riskLabel) {
    displayRiskScoringStatus(riskScore, riskLabel, riskReasons);
    return;
  }

  // Otherwise, fall back to legacy threat level display
  switch (threatLevel) {
    case 'low':
      securityStatusElement.classList.add('secure');
      securityIcon.textContent = '✅';
      securityText.textContent = details || 'Site appears secure';
      break;

    case 'medium':
      securityStatusElement.classList.add('warning');
      securityIcon.textContent = '⚠️';
      securityText.textContent = details || 'Potential security concerns';
      break;

    case 'high':
      securityStatusElement.classList.add('danger');
      securityIcon.textContent = '🚨';
      securityText.textContent = details || 'Security threat detected';
      break;

    case 'pending':
      securityIcon.textContent = '🔍';
      securityText.textContent = details || 'Ready to scan';
      break;

    default:
      securityIcon.textContent = '❓';
      securityText.textContent = details || 'Unknown status';
  }
}

// Display risk scoring status (new format)
function displayRiskScoringStatus(riskScore, riskLabel, riskReasons) {
  const securityIcon = securityStatusElement.querySelector('.security-icon');
  const securityText = securityStatusElement.querySelector('.security-text');

  // Apply appropriate class based on risk label
  switch (riskLabel) {
    case 'DANGEROUS':
      securityStatusElement.classList.add('danger');
      securityIcon.textContent = '🚨';
      securityText.innerHTML = `
        <strong>DANGEROUS</strong> (${riskScore}/100)
        <div style="font-size: 12px; margin-top: 4px; opacity: 0.9;">
          ${riskReasons && riskReasons.length > 0 ? riskReasons[0] : 'Multiple threats detected'}
        </div>
      `;
      break;

    case 'SUSPICIOUS':
      securityStatusElement.classList.add('warning');
      securityIcon.textContent = '⚠️';
      securityText.innerHTML = `
        <strong>SUSPICIOUS</strong> (${riskScore}/100)
        <div style="font-size: 12px; margin-top: 4px; opacity: 0.9;">
          ${riskReasons && riskReasons.length > 0 ? riskReasons[0] : 'Some concerns detected'}
        </div>
      `;
      break;

    case 'LIKELY_SAFE':
      securityStatusElement.classList.add('secure');
      securityIcon.textContent = '✅';
      securityText.innerHTML = `
        <strong>LIKELY SAFE</strong> (${riskScore}/100)
        <div style="font-size: 12px; margin-top: 4px; opacity: 0.9;">
          No significant threats detected
        </div>
      `;
      break;

    default:
      securityIcon.textContent = '❓';
      securityText.textContent = `Risk Score: ${riskScore}/100`;
  }

  // Add reasons list if available
  if (riskReasons && riskReasons.length > 1) {
    const reasonsList = document.createElement('details');
    reasonsList.style.cssText = 'margin-top: 8px; font-size: 12px; cursor: pointer;';
    reasonsList.innerHTML = `
      <summary style="font-weight: 600; opacity: 0.9;">
        View ${riskReasons.length} security concerns
      </summary>
      <ul style="margin: 4px 0 0 0; padding-left: 20px; opacity: 0.85;">
        ${riskReasons.slice(0, 5).map(reason => `<li style="margin: 2px 0;">${reason}</li>`).join('')}
        ${riskReasons.length > 5 ? `<li style="margin: 2px 0;">...and ${riskReasons.length - 5} more</li>` : ''}
      </ul>
    `;
    securityText.appendChild(reasonsList);
  }
}

// Load extension status and statistics
async function loadExtensionStatus() {
  try {
    console.log('📊 Loading extension status');

    // Request status from background script
    const response = await chrome.runtime.sendMessage({ type: "GET_SCAN_STATUS" });

    // Check for runtime errors (e.g., background script not available)
    if (chrome.runtime.lastError) {
      console.error('❌ Runtime error:', chrome.runtime.lastError.message);
      extensionStatusElement.textContent = 'Unavailable';
      extensionStatusElement.style.color = '#c00';
      return;
    }

    if (response && response.success) {
      const state = response.state;

      // Update total scans
      totalScansElement.textContent = state.totalScans || 0;

      // Update extension status
      extensionStatusElement.textContent = state.isActive ? 'Active' : 'Inactive';
      extensionStatusElement.style.color = state.isActive ? '#090' : '#c00';

      console.log('📊 Extension status loaded:', state);
    } else {
      console.warn('⚠️ Invalid response from background script');
      extensionStatusElement.textContent = 'Unknown';
      extensionStatusElement.style.color = '#f90';
    }

  } catch (error) {
    console.error('❌ Error loading extension status:', error);
    extensionStatusElement.textContent = 'Error';
    extensionStatusElement.style.color = '#c00';
  }
}

// Handle scan button click
async function handleScanButtonClick() {
  console.log('🔍 Scan button clicked');
  
  try {
    // Disable button and show scanning state
    setScanningState(true);
    
    // Get current active tab
    const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
    
    if (tabs.length === 0) {
      throw new Error('No active tab found');
    }
    
    const currentTab = tabs[0];
    const url = currentTab.url;
    
    // Check if URL is scannable
    if (!isScannable(url)) {
      updateSecurityStatus('unknown', 'Cannot scan this type of page');
      setScanningState(false);
      return;
    }
    
    // Send manual scan request to background script
    const response = await chrome.runtime.sendMessage({
      type: "MANUAL_SCAN",
      url: url,
      tabId: currentTab.id
    });
    
    if (response && response.success) {
      const result = response.result;

      // Check if we have new risk scoring data
      if (result.riskScore !== undefined && result.riskLabel) {
        updateSecurityStatus(
          result.threatLevel,
          result.details,
          result.riskScore,
          result.riskLabel,
          result.riskReasons
        );
      } else {
        // Fallback to legacy format
        updateSecurityStatus(result.threatLevel, result.details);
      }

      // Update scan count
      loadExtensionStatus();

      console.log('✅ Manual scan completed:', result);
    } else {
      throw new Error(response?.error || 'Scan failed');
    }
    
  } catch (error) {
    console.error('❌ Scan error:', error);
    updateSecurityStatus('error', `Scan failed: ${error.message}`);
  } finally {
    setScanningState(false);
  }
}

// Set scanning state UI
function setScanningState(isScanning) {
  if (isScanning) {
    scanButton.disabled = true;
    scanButton.classList.add('scanning');
    document.body.classList.add('scanning');
    
    // Update button text
    const buttonText = scanButton.querySelector('.button-text');
    buttonText.textContent = 'Scanning';
    
  } else {
    scanButton.disabled = false;
    scanButton.classList.remove('scanning');
    document.body.classList.remove('scanning');
    
    // Restore button text
    const buttonText = scanButton.querySelector('.button-text');
    buttonText.textContent = 'Scan This Site';
  }
}

// Check if URL is scannable
function isScannable(url) {
  // Cannot scan chrome:// pages, extension pages, etc.
  const unscannable = [
    'chrome://',
    'chrome-extension://',
    'moz-extension://',
    'edge://',
    'about:',
    'file://'
  ];
  
  return !unscannable.some(prefix => url.startsWith(prefix));
}

// Handle errors gracefully
window.addEventListener('error', (event) => {
  console.error('🚨 Popup error:', event.error);
});

// Handle unhandled promise rejections
window.addEventListener('unhandledrejection', (event) => {
  console.error('🚨 Unhandled promise rejection in popup:', event.reason);
});

console.log('🛡️ UNSCAMMED.AI Popup script ready');