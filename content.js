// UNSCAMMED.AI Content Script
// Handles page-level risk assessment display and user notifications

console.log('🛡️ UNSCAMMED.AI Content Script loaded on:', window.location.href);

// Initialize content script
(function() {
  'use strict';

  // Listen for messages from background script
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    console.log('📨 Message received:', request.type);

    if (request.type === "SHOW_RISK_ASSESSMENT") {
      // Display risk-based UI
      showRiskAssessment(request.risk, request.features, request.url);
      sendResponse({ success: true });
      return true;
    }

    if (request.type === "MANUAL_SCAN") {
      // Manual scan is now handled by background script
      // Just show scanning indicator
      showScanningIndicator();
      sendResponse({ success: true, message: 'Scan initiated' });
      return true;
    }
  });

})();

// ============================================================
// RISK ASSESSMENT DISPLAY
// ============================================================

/**
 * Display risk assessment based on score and label
 */
function showRiskAssessment(risk, features, url) {
  console.log(`🔍 Displaying risk assessment: ${risk.score}/100 (${risk.label})`);

  // Remove any existing risk displays
  removeExistingRiskDisplays();

  // Show appropriate UI based on risk level
  if (risk.label === 'DANGEROUS') {
    showDangerOverlay(risk, features, url);
  } else if (risk.label === 'SUSPICIOUS') {
    showWarningBanner(risk, features, url);
  }
  // LIKELY_SAFE sites don't show automatic warnings
}

/**
 * Show full-page danger overlay for DANGEROUS sites
 */
function showDangerOverlay(risk, features, url) {
  const overlay = document.createElement('div');
  overlay.id = 'unscammed-danger-overlay';
  overlay.style.cssText = `
    position: fixed;
    inset: 0;
    z-index: 2147483647;
    background: rgba(220, 38, 38, 0.97);
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    animation: fadeIn 0.3s ease-in;
  `;

  overlay.innerHTML = `
    <style>
      @keyframes fadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
      }
      #unscammed-danger-content {
        max-width: 600px;
        text-align: center;
        padding: 40px;
        animation: slideUp 0.4s ease-out;
      }
      @keyframes slideUp {
        from { transform: translateY(20px); opacity: 0; }
        to { transform: translateY(0); opacity: 1; }
      }
      #unscammed-danger-content h1 {
        margin: 0 0 16px 0;
        font-size: 36px;
        font-weight: 700;
      }
      #unscammed-danger-content .score {
        font-size: 48px;
        font-weight: 900;
        margin: 16px 0;
      }
      #unscammed-danger-content p {
        font-size: 18px;
        margin-bottom: 24px;
        opacity: 0.95;
        line-height: 1.5;
      }
      #unscammed-danger-content .reasons-box {
        background: rgba(0, 0, 0, 0.25);
        padding: 20px;
        border-radius: 8px;
        margin-bottom: 24px;
        text-align: left;
        max-height: 200px;
        overflow-y: auto;
      }
      #unscammed-danger-content .reasons-box h3 {
        margin: 0 0 12px 0;
        font-size: 16px;
        font-weight: 600;
      }
      #unscammed-danger-content .reasons-box ul {
        margin: 0;
        padding-left: 20px;
        list-style: none;
      }
      #unscammed-danger-content .reasons-box li {
        margin-bottom: 8px;
        padding-left: 8px;
        font-size: 14px;
        opacity: 0.95;
      }
      #unscammed-danger-content .buttons {
        display: flex;
        gap: 12px;
        justify-content: center;
        flex-wrap: wrap;
      }
      #unscammed-danger-content button {
        padding: 14px 32px;
        border-radius: 6px;
        font-size: 16px;
        font-weight: 600;
        cursor: pointer;
        border: none;
        transition: all 0.2s;
      }
      #unscammed-danger-content .btn-primary {
        background: white;
        color: #dc2626;
      }
      #unscammed-danger-content .btn-primary:hover {
        background: #f3f4f6;
        transform: scale(1.05);
      }
      #unscammed-danger-content .btn-secondary {
        background: rgba(255, 255, 255, 0.2);
        color: white;
        border: 1px solid rgba(255, 255, 255, 0.3);
      }
      #unscammed-danger-content .btn-secondary:hover {
        background: rgba(255, 255, 255, 0.3);
      }
      #unscammed-danger-content .footer {
        margin-top: 24px;
        font-size: 12px;
        opacity: 0.8;
      }
    </style>
    <div id="unscammed-danger-content">
      <div style="font-size: 80px; margin-bottom: 16px;">🚨</div>
      <h1>DANGER: Malicious Site Detected</h1>
      <div class="score">${risk.score}/100 Risk Score</div>
      <p>
        This website has been identified as <strong>DANGEROUS</strong>.
        Your personal information, passwords, and financial data are at risk if you proceed.
      </p>
      <div class="reasons-box">
        <h3>⚠️ Security Threats Detected (${risk.reasons.length}):</h3>
        <ul>
          ${risk.reasons.map(reason => `<li>${reason}</li>`).join('')}
        </ul>
      </div>
      <div class="buttons">
        <button class="btn-primary" onclick="window.history.back()">
          ← Go Back to Safety
        </button>
        <button class="btn-secondary" onclick="document.getElementById('unscammed-danger-overlay').remove()">
          Proceed Anyway (Not Recommended)
        </button>
      </div>
      <div class="footer">
        Protected by UNSCAMMED AI • Risk Analysis Engine v2.0
      </div>
    </div>
  `;

  document.body.appendChild(overlay);
  console.log('🚨 Danger overlay displayed');
}

/**
 * Show warning banner for SUSPICIOUS sites
 */
function showWarningBanner(risk, features, url) {
  const banner = document.createElement('div');
  banner.id = 'unscammed-warning-banner';
  banner.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    z-index: 2147483646;
    background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
    color: white;
    padding: 16px 20px;
    font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    animation: slideDown 0.4s ease-out;
  `;

  banner.innerHTML = `
    <style>
      @keyframes slideDown {
        from { transform: translateY(-100%); }
        to { transform: translateY(0); }
      }
      #unscammed-warning-content {
        max-width: 1200px;
        margin: 0 auto;
        display: flex;
        align-items: flex-start;
        gap: 16px;
      }
      #unscammed-warning-content .icon {
        font-size: 32px;
        flex-shrink: 0;
      }
      #unscammed-warning-content .message {
        flex: 1;
      }
      #unscammed-warning-content h3 {
        margin: 0 0 8px 0;
        font-size: 18px;
        font-weight: 700;
      }
      #unscammed-warning-content p {
        margin: 0 0 12px 0;
        font-size: 14px;
        opacity: 0.95;
        line-height: 1.4;
      }
      #unscammed-warning-content .score-badge {
        display: inline-block;
        background: rgba(0, 0, 0, 0.2);
        padding: 4px 12px;
        border-radius: 12px;
        font-size: 13px;
        font-weight: 600;
        margin-right: 8px;
      }
      #unscammed-warning-content details {
        cursor: pointer;
        margin-top: 8px;
      }
      #unscammed-warning-content summary {
        font-weight: 600;
        font-size: 13px;
        padding: 4px 0;
        user-select: none;
      }
      #unscammed-warning-content ul {
        margin: 8px 0 0 0;
        padding-left: 20px;
        font-size: 13px;
        opacity: 0.95;
      }
      #unscammed-warning-content li {
        margin-bottom: 4px;
      }
      #unscammed-warning-content .close-btn {
        background: rgba(255, 255, 255, 0.2);
        border: 1px solid rgba(255, 255, 255, 0.3);
        color: white;
        padding: 8px 20px;
        border-radius: 6px;
        cursor: pointer;
        font-size: 14px;
        font-weight: 600;
        transition: all 0.2s;
        flex-shrink: 0;
      }
      #unscammed-warning-content .close-btn:hover {
        background: rgba(255, 255, 255, 0.3);
      }
    </style>
    <div id="unscammed-warning-content">
      <div class="icon">⚠️</div>
      <div class="message">
        <h3>Warning: Suspicious Website</h3>
        <p>
          <span class="score-badge">${risk.score}/100 Risk Score</span>
          This website shows suspicious characteristics. Exercise extreme caution and do not enter sensitive information.
        </p>
        <details>
          <summary>▶ View ${risk.reasons.length} security concerns</summary>
          <ul>
            ${risk.reasons.map(reason => `<li>${reason}</li>`).join('')}
          </ul>
        </details>
      </div>
      <button class="close-btn" onclick="document.getElementById('unscammed-warning-banner').remove()">
        Dismiss
      </button>
    </div>
  `;

  document.body.insertBefore(banner, document.body.firstChild);
  console.log('⚠️ Warning banner displayed');
}

/**
 * Remove any existing risk displays
 */
function removeExistingRiskDisplays() {
  const existingOverlay = document.getElementById('unscammed-danger-overlay');
  const existingBanner = document.getElementById('unscammed-warning-banner');
  const existingAlert = document.getElementById('unscammed-security-alert');

  if (existingOverlay) existingOverlay.remove();
  if (existingBanner) existingBanner.remove();
  if (existingAlert) existingAlert.remove();
}

// ============================================================
// SCANNING INDICATOR
// ============================================================

function showScanningIndicator() {
  // Remove existing indicator
  const existing = document.getElementById('unscammed-scanning');
  if (existing) existing.remove();

  const indicator = document.createElement('div');
  indicator.id = 'unscammed-scanning';
  indicator.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: rgba(0, 0, 0, 0.85);
    color: white;
    padding: 12px 16px;
    border-radius: 8px;
    font-family: system-ui, -apple-system, sans-serif;
    font-size: 14px;
    z-index: 2147483645;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
    display: flex;
    align-items: center;
    gap: 8px;
  `;
  indicator.innerHTML = `
    <div style="width: 16px; height: 16px; border: 2px solid #fff; border-top-color: transparent; border-radius: 50%; animation: spin 0.8s linear infinite;"></div>
    <style>
      @keyframes spin {
        to { transform: rotate(360deg); }
      }
    </style>
    <span>Scanning for threats...</span>
  `;
  document.body.appendChild(indicator);

  // Auto-remove after 10 seconds (fallback)
  setTimeout(() => {
    const el = document.getElementById('unscammed-scanning');
    if (el) el.remove();
  }, 10000);
}

function hideScanningIndicator() {
  const indicator = document.getElementById('unscammed-scanning');
  if (indicator) {
    indicator.remove();
  }
}

// ============================================================
// MANUAL SCAN RESULT DISPLAY
// ============================================================

function showScanResult(risk, features) {
  hideScanningIndicator();

  const resultDiv = document.createElement('div');
  resultDiv.id = 'unscammed-scan-result';
  resultDiv.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: ${risk.label === 'DANGEROUS' ? '#dc2626' : risk.label === 'SUSPICIOUS' ? '#f59e0b' : '#10b981'};
    color: white;
    padding: 16px 20px;
    border-radius: 8px;
    font-family: system-ui, -apple-system, sans-serif;
    font-size: 14px;
    max-width: 350px;
    z-index: 2147483645;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
    animation: slideIn 0.3s ease-out;
  `;
  resultDiv.innerHTML = `
    <style>
      @keyframes slideIn {
        from { transform: translateX(100%); }
        to { transform: translateX(0); }
      }
    </style>
    <div style="font-weight: 700; font-size: 16px; margin-bottom: 8px;">
      ${risk.label === 'DANGEROUS' ? '🚨' : risk.label === 'SUSPICIOUS' ? '⚠️' : '✅'}
      Scan Complete
    </div>
    <div style="margin-bottom: 8px;">
      Risk Score: <strong>${risk.score}/100</strong> (${risk.label})
    </div>
    <div style="font-size: 13px; opacity: 0.95;">
      ${risk.reasons.length > 0 ? risk.reasons[0] : 'No significant threats detected'}
    </div>
  `;

  document.body.appendChild(resultDiv);

  // Auto-hide after 5 seconds
  setTimeout(() => {
    const el = document.getElementById('unscammed-scan-result');
    if (el) {
      el.style.animation = 'slideOut 0.3s ease-in';
      setTimeout(() => el.remove(), 300);
    }
  }, 5000);
}

console.log('🛡️ UNSCAMMED.AI Content Script ready with risk assessment display');
