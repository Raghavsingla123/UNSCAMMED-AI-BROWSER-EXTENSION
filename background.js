// UNSCAMMED.AI Background Service Worker
// Handles URL logging, navigation monitoring, and message routing

console.log('🛡️ UNSCAMMED.AI Background Service Worker initialized');

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
    version: "1.0.0",
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

  console.log('🛡️ Extension initialized with default settings');
}

// Listen for completed page navigations
chrome.webNavigation.onCompleted.addListener((details) => {
  // Only process main frame navigations (not iframes)
  if (details.frameId === 0) {
    console.log('🌐 Navigation completed:', details.url);
    
    // Log the visited URL
    logVisitedUrl(details.url, details.tabId);
    
    // Send URL to content script for scanning
    sendUrlToContentScript(details.tabId, details.url);
  }
});

// Log visited URL to storage
function logVisitedUrl(url, tabId) {
  const urlLog = {
    id: generateId(),
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
    console.log('📝 URL logged:', url);
  });
}

// Send URL to content script for security scanning
function sendUrlToContentScript(tabId, url) {
  const message = {
    type: "URL_SCAN",
    url: url,
    tabId: tabId,
    timestamp: Date.now()
  };

  // Send message to content script
  chrome.tabs.sendMessage(tabId, message, (response) => {
    if (chrome.runtime.lastError) {
      console.log('⚠️ Could not send message to content script:', chrome.runtime.lastError.message);
    } else if (response) {
      console.log('✅ Content script response:', response);
      handleScanResult(response);
    }
  });
}

// Handle scan results from content script
function handleScanResult(scanResult) {
  // Store scan result
  const result = {
    id: generateId(),
    url: scanResult.url,
    isSecure: scanResult.isSecure,
    threatLevel: scanResult.threatLevel,
    details: scanResult.details,
    scanTime: Date.now(),
    scanType: "automatic"
  };

  chrome.storage.local.set({ [`scan_${result.id}`]: result });
  
  // Update total scans counter
  chrome.storage.local.get(['extensionState'], (data) => {
    if (data.extensionState) {
      data.extensionState.totalScans += 1;
      chrome.storage.local.set({ extensionState: data.extensionState });
    }
  });

  console.log('🔍 Scan result stored:', result);
}

// Listen for messages from popup
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

// Perform manual security scan
async function performManualScan(tabId, url) {
  return new Promise((resolve, reject) => {
    const message = {
      type: "MANUAL_SCAN",
      url: url,
      tabId: tabId,
      timestamp: Date.now()
    };

    chrome.tabs.sendMessage(tabId, message, (response) => {
      if (chrome.runtime.lastError) {
        reject(new Error(chrome.runtime.lastError.message));
      } else if (response) {
        handleScanResult(response);
        resolve(response);
      } else {
        reject(new Error('No response from content script'));
      }
    });
  });
}

// Generate unique ID for logging
function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

// Error handling for unhandled promise rejections
self.addEventListener('unhandledrejection', (event) => {
  console.error('🚨 Unhandled promise rejection in background script:', event.reason);
});

console.log('🛡️ UNSCAMMED.AI Background Service Worker ready');