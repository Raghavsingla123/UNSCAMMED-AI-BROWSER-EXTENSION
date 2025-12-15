// HTML Content Analysis Module
// Analyzes page content for phishing indicators

/**
 * Analyze HTML content for phishing indicators
 * @param {Document} document - The page DOM
 * @param {string} url - The page URL
 * @returns {Object} HTML analysis features
 */
function analyzeHTMLContent(document, url) {
  try {
    const urlObj = new URL(url);
    const currentHostname = urlObj.hostname;

    return {
      // Form analysis
      ...analyzeFormsSecurity(document, currentHostname),

      // Input field analysis
      ...analyzeInputFields(document),

      // Link analysis
      ...analyzeLinks(document, currentHostname),

      // Content analysis
      ...analyzePageContent(document, currentHostname),

      // Script analysis
      ...analyzeScripts(document, currentHostname),

      // Brand impersonation
      ...analyzeBrandIndicators(document),
    };

  } catch (error) {
    console.error('HTML analysis failed:', error);
    return createDefaultHTMLFeatures();
  }
}

// ============================================================
// FORM SECURITY ANALYSIS
// ============================================================

function analyzeFormsSecurity(document, currentHostname) {
  const forms = document.querySelectorAll('form');
  let hasLoginForm = false;
  let hasPasswordField = false;
  let hasExternalFormAction = false;
  let hasInsecureFormSubmission = false;
  let formCount = forms.length;

  forms.forEach(form => {
    const action = form.getAttribute('action') || '';
    const method = (form.getAttribute('method') || 'get').toLowerCase();

    // Check for password fields in form
    const passwordInputs = form.querySelectorAll('input[type="password"]');
    if (passwordInputs.length > 0) {
      hasPasswordField = true;
      hasLoginForm = true;
    }

    // Check for email/username fields (login indicators)
    const emailInputs = form.querySelectorAll('input[type="email"], input[name*="email"], input[name*="user"]');
    if (emailInputs.length > 0 && passwordInputs.length > 0) {
      hasLoginForm = true;
    }

    // Check if form submits to external domain
    if (action && action.startsWith('http')) {
      try {
        const actionUrl = new URL(action);
        if (actionUrl.hostname !== currentHostname) {
          hasExternalFormAction = true;
        }
      } catch (e) {
        // Invalid URL
      }
    }

    // Check if password form uses HTTP (not HTTPS)
    if (passwordInputs.length > 0 && !window.location.protocol.startsWith('https')) {
      hasInsecureFormSubmission = true;
    }
  });

  return {
    formCount,
    hasLoginForm,
    hasPasswordField,
    hasExternalFormAction,
    hasInsecureFormSubmission,
  };
}

// ============================================================
// INPUT FIELD ANALYSIS
// ============================================================

function analyzeInputFields(document) {
  const passwordInputs = document.querySelectorAll('input[type="password"]');
  const emailInputs = document.querySelectorAll('input[type="email"]');
  const creditCardInputs = document.querySelectorAll('input[name*="card"], input[autocomplete*="cc"]');
  const ssnInputs = document.querySelectorAll('input[name*="ssn"], input[name*="social"]');

  // Check for hidden fields with suspicious names
  const hiddenInputs = document.querySelectorAll('input[type="hidden"]');
  let hasSuspiciousHiddenFields = false;

  hiddenInputs.forEach(input => {
    const name = (input.name || '').toLowerCase();
    if (name.includes('redirect') || name.includes('return') || name.includes('callback')) {
      hasSuspiciousHiddenFields = true;
    }
  });

  return {
    passwordFieldCount: passwordInputs.length,
    emailFieldCount: emailInputs.length,
    hasCreditCardField: creditCardInputs.length > 0,
    hasSSNField: ssnInputs.length > 0,
    hasSuspiciousHiddenFields,
  };
}

// ============================================================
// LINK ANALYSIS
// ============================================================

function analyzeLinks(document, currentHostname) {
  const links = document.querySelectorAll('a[href]');
  let externalLinkCount = 0;
  let totalLinkCount = links.length;
  let hasMismatchedLinks = false;
  let suspiciousLinkCount = 0;

  links.forEach(link => {
    const href = link.href;
    const displayText = link.textContent.trim();

    try {
      const linkUrl = new URL(href);

      // Count external links
      if (linkUrl.hostname !== currentHostname) {
        externalLinkCount++;
      }

      // Check for mismatched display text (e.g., shows "paypal.com" but links to "evil.com")
      if (displayText.includes('.com') || displayText.includes('.org')) {
        const displayDomain = displayText.match(/([a-z0-9-]+\.(com|org|net|io))/i);
        if (displayDomain && displayDomain[0] !== linkUrl.hostname) {
          hasMismatchedLinks = true;
          suspiciousLinkCount++;
        }
      }

      // Check for suspicious link patterns
      if (href.includes('data:text/html') ||
          href.includes('javascript:') ||
          href.match(/bit\.ly|tinyurl|goo\.gl/)) {
        suspiciousLinkCount++;
      }

    } catch (e) {
      // Invalid URL
    }
  });

  const externalLinkRatio = totalLinkCount > 0 ? externalLinkCount / totalLinkCount : 0;

  return {
    totalLinkCount,
    externalLinkCount,
    externalLinkRatio,
    hasMismatchedLinks,
    suspiciousLinkCount,
    hasExcessiveExternalLinks: externalLinkRatio > 0.7,  // > 70% external
  };
}

// ============================================================
// PAGE CONTENT ANALYSIS
// ============================================================

function analyzePageContent(document, currentHostname) {
  const bodyText = document.body?.textContent || '';
  const title = document.title || '';

  // Check for urgency/scare tactics
  const urgencyKeywords = [
    'urgent', 'immediately', 'suspended', 'locked', 'expire',
    'verify now', 'act now', 'limited time', 'confirm identity',
    'unusual activity', 'security alert', 'account frozen'
  ];

  let urgencyScore = 0;
  urgencyKeywords.forEach(keyword => {
    if (bodyText.toLowerCase().includes(keyword)) {
      urgencyScore++;
    }
  });

  // Check for minimal content (lazy phishing pages)
  const contentLength = bodyText.trim().length;
  const hasMinimalContent = contentLength < 500;  // Less than 500 chars

  // Check for iframes (often used to hide content)
  const iframes = document.querySelectorAll('iframe');
  const hasHiddenIframes = Array.from(iframes).some(iframe => {
    const style = window.getComputedStyle(iframe);
    return style.display === 'none' || style.visibility === 'hidden';
  });

  // Check for suspicious copyright text
  const hasCopyrightMismatch = checkCopyrightMismatch(bodyText, currentHostname);

  return {
    urgencyScore,
    hasUrgentLanguage: urgencyScore >= 2,
    hasMinimalContent,
    iframeCount: iframes.length,
    hasHiddenIframes,
    hasCopyrightMismatch,
    contentLength,
  };
}

function checkCopyrightMismatch(text, hostname) {
  // Look for copyright text mentioning different companies
  const copyrightMatch = text.match(/©\s*\d{4}\s+([A-Za-z\s]+)/);
  if (copyrightMatch) {
    const copyrightOwner = copyrightMatch[1].toLowerCase();
    const brands = ['google', 'microsoft', 'apple', 'paypal', 'amazon', 'facebook'];

    for (const brand of brands) {
      if (copyrightOwner.includes(brand) && !hostname.includes(brand)) {
        return true;  // Claims to be "© 2024 Google" but hostname isn't google.com
      }
    }
  }
  return false;
}

// ============================================================
// SCRIPT ANALYSIS
// ============================================================

function analyzeScripts(document, currentHostname) {
  const scripts = document.querySelectorAll('script');
  let externalScriptCount = 0;
  let inlineScriptCount = 0;
  let hasSuspiciousScripts = false;

  scripts.forEach(script => {
    const src = script.src;
    const content = script.textContent || '';

    if (src) {
      externalScriptCount++;
      try {
        const scriptUrl = new URL(src);
        if (scriptUrl.hostname !== currentHostname) {
          // External script from different domain
        }
      } catch (e) {}
    } else {
      inlineScriptCount++;
    }

    // Check for suspicious script patterns
    const suspiciousPatterns = [
      'eval(',
      'document.write(',
      'window.location=',
      'btoa(',  // Base64 encoding
      'atob(',  // Base64 decoding
      '.submit()',
      'XMLHttpRequest',
      'fetch(',
    ];

    suspiciousPatterns.forEach(pattern => {
      if (content.includes(pattern)) {
        hasSuspiciousScripts = true;
      }
    });
  });

  return {
    scriptCount: scripts.length,
    externalScriptCount,
    inlineScriptCount,
    hasSuspiciousScripts,
  };
}

// ============================================================
// BRAND INDICATOR ANALYSIS
// ============================================================

function analyzeBrandIndicators(document) {
  const title = document.title.toLowerCase();
  const bodyText = document.body?.textContent.toLowerCase() || '';

  // Major brands to check
  const brands = [
    'paypal', 'google', 'microsoft', 'apple', 'amazon',
    'facebook', 'netflix', 'instagram', 'twitter', 'linkedin',
    'bank', 'chase', 'wells fargo', 'bank of america',
  ];

  const mentionedBrands = [];
  brands.forEach(brand => {
    if (title.includes(brand) || bodyText.includes(brand)) {
      mentionedBrands.push(brand);
    }
  });

  // Check for brand logo images
  const images = document.querySelectorAll('img');
  let hasBrandLogos = false;

  images.forEach(img => {
    const src = (img.src || '').toLowerCase();
    const alt = (img.alt || '').toLowerCase();

    brands.forEach(brand => {
      if (src.includes(brand) || alt.includes(brand)) {
        hasBrandLogos = true;
      }
    });
  });

  return {
    mentionedBrands,
    mentionsBrand: mentionedBrands.length > 0,
    hasBrandLogos,
    brandMentionCount: mentionedBrands.length,
  };
}

// ============================================================
// DEFAULT FEATURES
// ============================================================

function createDefaultHTMLFeatures() {
  return {
    formCount: 0,
    hasLoginForm: false,
    hasPasswordField: false,
    hasExternalFormAction: false,
    hasInsecureFormSubmission: false,
    passwordFieldCount: 0,
    emailFieldCount: 0,
    hasCreditCardField: false,
    hasSSNField: false,
    hasSuspiciousHiddenFields: false,
    totalLinkCount: 0,
    externalLinkCount: 0,
    externalLinkRatio: 0,
    hasMismatchedLinks: false,
    suspiciousLinkCount: 0,
    hasExcessiveExternalLinks: false,
    urgencyScore: 0,
    hasUrgentLanguage: false,
    hasMinimalContent: false,
    iframeCount: 0,
    hasHiddenIframes: false,
    hasCopyrightMismatch: false,
    contentLength: 0,
    scriptCount: 0,
    externalScriptCount: 0,
    inlineScriptCount: 0,
    hasSuspiciousScripts: false,
    mentionedBrands: [],
    mentionsBrand: false,
    hasBrandLogos: false,
    brandMentionCount: 0,
  };
}

// Export for use in Chrome extension
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { analyzeHTMLContent };
}

// Also support global access for Chrome extension
if (typeof self !== 'undefined') {
  self.analyzeHTMLContent = analyzeHTMLContent;
}
