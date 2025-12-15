// Revolutionary HTML Content Analysis Engine
// Implements state-of-the-art phishing detection techniques
// Goes far beyond traditional URL-only or basic HTML analysis

console.log('🔬 Advanced HTML Analyzer loaded - Revolutionary phishing detection');

/**
 * Master analysis function - orchestrates all detection modules
 * @param {Document} document - The page DOM
 * @param {string} url - The page URL
 * @returns {Object} Comprehensive analysis with 60+ features
 */
function analyzeHTMLContent(document, url) {
  try {
    const urlObj = new URL(url);
    const currentHostname = urlObj.hostname;
    const startTime = performance.now();

    const analysis = {
      // Core modules
      ...analyzeFormsSecurity(document, currentHostname, urlObj),
      ...analyzeInputFields(document, urlObj),
      ...analyzeLinks(document, currentHostname),
      ...analyzePageContent(document, currentHostname),
      ...analyzeScripts(document, currentHostname),

      // Revolutionary modules
      ...analyzeTrustSignals(document, currentHostname),
      ...analyzeFavicon(document, currentHostname),
      ...analyzeMetaTags(document, currentHostname),
      ...analyzeCSSFingerprint(document, currentHostname),
      ...analyzeResourceProvenance(document, currentHostname),
      ...analyzeLanguageQuality(document),
      ...analyzeCertificateIndicators(urlObj),
      ...analyzeBrandImpersonation(document, currentHostname),

      // Performance metrics
      analysisTime: performance.now() - startTime,
      timestamp: Date.now(),
    };

    // Calculate composite scores
    analysis.trustScore = calculateTrustScore(analysis);
    analysis.suspicionScore = calculateSuspicionScore(analysis);
    analysis.confidenceLevel = calculateConfidenceLevel(analysis);

    console.log(`✅ HTML analysis complete: ${analysis.analysisTime.toFixed(2)}ms`);

    return analysis;

  } catch (error) {
    console.error('❌ HTML analysis failed:', error);
    return createDefaultHTMLFeatures();
  }
}

// ============================================================
// MODULE 1: ADVANCED FORM SECURITY ANALYSIS
// ============================================================

function analyzeFormsSecurity(document, currentHostname, urlObj) {
  const forms = document.querySelectorAll('form');
  let hasLoginForm = false;
  let hasPasswordField = false;
  let hasExternalFormAction = false;
  let hasInsecureFormSubmission = false;
  let hasMissingCSRFToken = false;
  let hasAutocompleteOff = false;
  let formCount = forms.length;
  let suspiciousFormPatterns = 0;

  forms.forEach(form => {
    const action = form.getAttribute('action') || '';
    const method = (form.getAttribute('method') || 'get').toLowerCase();
    const target = form.getAttribute('target') || '';

    // Check for password fields in form
    const passwordInputs = form.querySelectorAll('input[type="password"]');
    const emailInputs = form.querySelectorAll('input[type="email"], input[name*="email"], input[name*="user"], input[name*="login"]');

    if (passwordInputs.length > 0) {
      hasPasswordField = true;

      // Check for login form indicators
      if (emailInputs.length > 0 || form.querySelector('input[name*="user"]')) {
        hasLoginForm = true;
      }

      // CRITICAL: Check if password form is on HTTP
      if (urlObj.protocol !== 'https:') {
        hasInsecureFormSubmission = true;
        suspiciousFormPatterns++;
      }

      // IMPORTANT: Check for CSRF token (legitimate sites have them)
      const csrfInputs = form.querySelectorAll('input[name*="csrf"], input[name*="token"], input[name="_token"]');
      if (csrfInputs.length === 0) {
        hasMissingCSRFToken = true;
        suspiciousFormPatterns++;
      }

      // Check for autocomplete="off" (phishing tactic to avoid browser warnings)
      if (form.getAttribute('autocomplete') === 'off') {
        hasAutocompleteOff = true;
        suspiciousFormPatterns++;
      }
    }

    // Check if form submits to external domain (MAJOR RED FLAG)
    if (action) {
      if (action.startsWith('http')) {
        try {
          const actionUrl = new URL(action, urlObj.href);
          if (actionUrl.hostname !== currentHostname) {
            hasExternalFormAction = true;
            suspiciousFormPatterns += 2; // High weight
          }
        } catch (e) {
          // Invalid URL in action
          suspiciousFormPatterns++;
        }
      } else if (action.startsWith('javascript:') || action.startsWith('data:')) {
        // JavaScript or data URI in form action (VERY SUSPICIOUS)
        suspiciousFormPatterns += 2;
      }
    }

    // Check for suspicious target attributes
    if (target === '_blank' && passwordInputs.length > 0) {
      // Login form opening in new tab is suspicious
      suspiciousFormPatterns++;
    }

    // Check for POST vs GET (GET with passwords is VERY suspicious)
    if (method === 'get' && passwordInputs.length > 0) {
      suspiciousFormPatterns += 2;
    }
  });

  return {
    formCount,
    hasLoginForm,
    hasPasswordField,
    hasExternalFormAction,
    hasInsecureFormSubmission,
    hasMissingCSRFToken,
    hasAutocompleteOff,
    suspiciousFormPatterns,
    formSecurityScore: Math.max(0, 10 - suspiciousFormPatterns * 2), // 0-10 scale
  };
}

// ============================================================
// MODULE 2: ADVANCED INPUT FIELD ANALYSIS
// ============================================================

function analyzeInputFields(document, urlObj) {
  const passwordInputs = document.querySelectorAll('input[type="password"]');
  const emailInputs = document.querySelectorAll('input[type="email"]');

  // ENHANCED: Credit card detection
  const creditCardInputs = document.querySelectorAll(
    'input[name*="card"], input[name*="cc"], input[name*="cardnumber"], input[name*="ccnumber"], ' +
    'input[autocomplete*="cc-"], input[inputmode="numeric"][maxlength="16"], input[placeholder*="card number"]'
  );

  // NEW: CVV/CVC detection (CRITICAL - often means credential harvesting)
  const cvvInputs = document.querySelectorAll(
    'input[name*="cvv"], input[name*="cvc"], input[name*="cid"], input[name*="security code"], ' +
    'input[autocomplete="cc-csc"], input[maxlength="3"][inputmode="numeric"], input[maxlength="4"][inputmode="numeric"]'
  );

  // NEW: Expiration date fields
  const expiryInputs = document.querySelectorAll(
    'input[name*="expir"], input[name*="exp-date"], input[autocomplete*="cc-exp"]'
  );

  // ENHANCED: SSN and government ID
  const ssnInputs = document.querySelectorAll(
    'input[name*="ssn"], input[name*="social"], input[name*="tax"], input[name*="taxid"], ' +
    'input[name*="national"], input[placeholder*="social security"]'
  );

  // NEW: Bank account numbers
  const bankAccountInputs = document.querySelectorAll(
    'input[name*="account"], input[name*="routing"], input[name*="iban"], input[name*="swift"], ' +
    'input[name*="bank"], input[autocomplete*="account"]'
  );

  // NEW: OTP/2FA code requests (SCAM RED FLAG - legitimate sites don't ask via forms)
  const otpInputs = document.querySelectorAll(
    'input[name*="otp"], input[name*="code"], input[name*="verification"], input[name*="2fa"], ' +
    'input[name*="token"], input[placeholder*="verification code"], input[placeholder*="enter code"]'
  );

  // NEW: Cryptocurrency wallet addresses
  const cryptoInputs = document.querySelectorAll(
    'input[name*="wallet"], input[name*="bitcoin"], input[name*="eth"], input[name*="crypto"], ' +
    'input[placeholder*="wallet"], input[name*="private key"], input[name*="seed phrase"]'
  );

  const phoneInputs = document.querySelectorAll('input[type="tel"], input[name*="phone"]');

  // Check for proper autocomplete attributes (legitimate sites use them)
  let hasProperAutocomplete = false;
  const allInputs = document.querySelectorAll('input');
  allInputs.forEach(input => {
    if (input.autocomplete && input.autocomplete !== 'off') {
      hasProperAutocomplete = true;
    }
  });

  // Check for hidden fields with suspicious names
  const hiddenInputs = document.querySelectorAll('input[type="hidden"]');
  let hasSuspiciousHiddenFields = false;
  let hiddenRedirectFields = 0;

  hiddenInputs.forEach(input => {
    const name = (input.name || '').toLowerCase();
    const value = (input.value || '').toLowerCase();

    if (name.includes('redirect') || name.includes('return') || name.includes('callback') ||
        name.includes('next') || name.includes('continue')) {
      hasSuspiciousHiddenFields = true;
      hiddenRedirectFields++;

      // Check if redirect goes to external site
      if (value.startsWith('http') && !value.includes(urlObj.hostname)) {
        hiddenRedirectFields += 2; // Higher weight
      }
    }
  });

  // Check for required fields (legitimate forms usually have required attributes)
  const requiredInputs = document.querySelectorAll('input[required]');
  const hasRequiredAttributes = requiredInputs.length > 0;

  // Check for pattern/validation attributes
  const inputsWithValidation = document.querySelectorAll('input[pattern], input[minlength], input[maxlength]');
  const hasValidationAttributes = inputsWithValidation.length > 0;

  // CRITICAL SCAM INDICATOR: Financial data harvesting
  const hasFinancialHarvesting = (
    creditCardInputs.length > 0 &&
    cvvInputs.length > 0 &&
    expiryInputs.length > 0
  );

  // CRITICAL SCAM INDICATOR: Identity theft attempt
  const hasIdentityTheftAttempt = (
    ssnInputs.length > 0 ||
    bankAccountInputs.length > 0
  );

  // CRITICAL SCAM INDICATOR: 2FA/OTP phishing
  const has2FAPhishing = otpInputs.length > 0;

  // CRITICAL SCAM INDICATOR: Crypto scam
  const hasCryptoScam = cryptoInputs.length > 0;

  return {
    passwordFieldCount: passwordInputs.length,
    emailFieldCount: emailInputs.length,
    hasCreditCardField: creditCardInputs.length > 0,
    hasCVVField: cvvInputs.length > 0, // NEW
    hasExpiryField: expiryInputs.length > 0, // NEW
    hasSSNField: ssnInputs.length > 0,
    hasBankAccountField: bankAccountInputs.length > 0, // NEW
    hasOTPField: otpInputs.length > 0, // NEW - CRITICAL
    hasCryptoField: cryptoInputs.length > 0, // NEW - CRITICAL
    hasPhoneField: phoneInputs.length > 0,
    hasSuspiciousHiddenFields,
    hiddenRedirectFields,
    hasProperAutocomplete,
    hasRequiredAttributes,
    hasValidationAttributes,
    // NEW: Critical scam indicators
    hasFinancialHarvesting, // All 3 credit card fields = credential harvesting
    hasIdentityTheftAttempt, // SSN or bank account = identity theft
    has2FAPhishing, // OTP/2FA codes = phishing
    hasCryptoScam, // Crypto wallet/private key = scam
    inputQualityScore: (hasProperAutocomplete ? 3 : 0) + (hasRequiredAttributes ? 3 : 0) + (hasValidationAttributes ? 2 : 0),
  };
}

// ============================================================
// MODULE 3: INTELLIGENT LINK ANALYSIS
// ============================================================

function analyzeLinks(document, currentHostname) {
  const links = document.querySelectorAll('a[href]');
  let externalLinkCount = 0;
  let totalLinkCount = links.length;
  let hasMismatchedLinks = false;
  let suspiciousLinkCount = 0;
  let javascriptLinks = 0;
  let dataUriLinks = 0;

  links.forEach(link => {
    const href = link.href;
    const displayText = link.textContent.trim().toLowerCase();

    try {
      const linkUrl = new URL(href);

      // Count external links
      if (linkUrl.hostname !== currentHostname) {
        externalLinkCount++;
      }

      // REVOLUTIONARY: Check for display text/href mismatch (MAJOR RED FLAG)
      // Example: Link says "paypal.com" but goes to "evil.com"
      const domainRegex = /([a-z0-9-]+\.(com|org|net|io|gov|edu|co\.uk))/gi;
      const displayDomains = displayText.match(domainRegex);

      if (displayDomains && displayDomains.length > 0) {
        const displayDomain = displayDomains[0].toLowerCase();
        if (!linkUrl.hostname.includes(displayDomain) && !displayDomain.includes(linkUrl.hostname)) {
          hasMismatchedLinks = true;
          suspiciousLinkCount += 2; // High weight
        }
      }

      // Check for URL shorteners in links
      const shorteners = ['bit.ly', 'tinyurl', 'goo.gl', 't.co', 'ow.ly', 'is.gd', 'buff.ly'];
      if (shorteners.some(s => linkUrl.hostname.includes(s))) {
        suspiciousLinkCount++;
      }

    } catch (e) {
      // Invalid or special href
      if (href.startsWith('javascript:')) {
        javascriptLinks++;
        suspiciousLinkCount++;
      } else if (href.startsWith('data:')) {
        dataUriLinks++;
        suspiciousLinkCount++;
      }
    }
  });

  const externalLinkRatio = totalLinkCount > 0 ? externalLinkCount / totalLinkCount : 0;

  return {
    totalLinkCount,
    externalLinkCount,
    externalLinkRatio,
    hasMismatchedLinks,
    suspiciousLinkCount,
    javascriptLinks,
    dataUriLinks,
    hasExcessiveExternalLinks: externalLinkRatio > 0.7,
  };
}

// ============================================================
// MODULE 4: SOPHISTICATED PAGE CONTENT ANALYSIS
// ============================================================

function analyzePageContent(document, currentHostname) {
  const bodyText = document.body?.textContent || '';
  const title = document.title || '';

  // ENHANCED: Urgency/scare tactic detection with MORE patterns
  const urgencyKeywords = [
    // Account threats
    { phrase: 'account suspended', weight: 3 },
    { phrase: 'account locked', weight: 3 },
    { phrase: 'account will be closed', weight: 3 },
    { phrase: 'account disabled', weight: 3 },
    { phrase: 'account terminated', weight: 3 },

    // Verification urgency
    { phrase: 'verify immediately', weight: 3 },
    { phrase: 'verify now', weight: 2 },
    { phrase: 'verify within 24', weight: 3 },
    { phrase: 'verify within 48', weight: 3 },
    { phrase: 'confirm identity', weight: 2 },
    { phrase: 'confirm your identity', weight: 2 },

    // Time pressure
    { phrase: 'urgent', weight: 2 },
    { phrase: 'immediately', weight: 2 },
    { phrase: 'expire', weight: 2 },
    { phrase: 'expires in', weight: 3 },
    { phrase: 'limited time', weight: 2 },
    { phrase: 'act now', weight: 2 },
    { phrase: 'act within', weight: 3 },
    { phrase: 'deadline', weight: 2 },
    { phrase: 'final notice', weight: 3 },
    { phrase: 'final warning', weight: 3 },
    { phrase: 'last chance', weight: 3 },

    // Security threats
    { phrase: 'unusual activity', weight: 2 },
    { phrase: 'suspicious activity', weight: 2 },
    { phrase: 'security alert', weight: 2 },
    { phrase: 'security breach', weight: 3 },
    { phrase: 'unauthorized access', weight: 3 },
    { phrase: 'fraud alert', weight: 2 },
    { phrase: 'action required', weight: 2 },

    // Financial urgency (NEW - critical for scams)
    { phrase: 'payment failed', weight: 3 },
    { phrase: 'payment declined', weight: 3 },
    { phrase: 'update payment', weight: 2 },
    { phrase: 'verify payment', weight: 2 },
    { phrase: 'billing problem', weight: 2 },
    { phrase: 'payment information', weight: 2 },
    { phrase: 'card expired', weight: 2 },
    { phrase: 'update billing', weight: 2 },

    // Legal/authority threats (NEW)
    { phrase: 'legal action', weight: 3 },
    { phrase: 'irs', weight: 2 },
    { phrase: 'tax refund', weight: 2 },
    { phrase: 'government', weight: 1 },
    { phrase: 'federal', weight: 1 },

    // Generic clickbait
    { phrase: 'click here', weight: 1 },
    { phrase: 'click now', weight: 2 },
    { phrase: 'download now', weight: 1 },
  ];

  let urgencyScore = 0;
  const foundUrgencyPhrases = [];
  const lowerText = bodyText.toLowerCase();

  urgencyKeywords.forEach(({ phrase, weight }) => {
    if (lowerText.includes(phrase)) {
      urgencyScore += weight;
      foundUrgencyPhrases.push(phrase);
    }
  });

  // Check for minimal content (lazy phishing pages)
  const contentLength = bodyText.trim().length;
  const hasMinimalContent = contentLength < 500;

  // Check for iframes (often used to hide/inject content)
  const iframes = document.querySelectorAll('iframe');
  const hasHiddenIframes = Array.from(iframes).some(iframe => {
    const style = window.getComputedStyle(iframe);
    return style.display === 'none' || style.visibility === 'hidden' ||
           style.opacity === '0' || iframe.offsetHeight === 0;
  });

  // Check for suspicious copyright text
  const hasCopyrightMismatch = checkCopyrightMismatch(bodyText, currentHostname);

  // REVOLUTIONARY: Check for grammar/spelling errors (indicator of rushed phishing)
  const spellingErrorIndicators = [
    'recieve', 'occured', 'seperate', 'untill', 'tommorrow',
    'definately', 'accomodate', 'ocassion', 'neccessary'
  ];

  let hasSpellingErrors = spellingErrorIndicators.some(error => lowerText.includes(error));

  // Check for generic/template content
  const genericPhrases = [
    'click here to verify',
    'dear customer',
    'dear user',
    'dear member',
    'valued customer',
  ];

  let genericContentCount = 0;
  genericPhrases.forEach(phrase => {
    if (lowerText.includes(phrase)) {
      genericContentCount++;
    }
  });

  // NEW: Countdown timer detection (common scam tactic)
  const hasCountdownTimer =
    lowerText.match(/\d+\s*(hour|minute|second|day)s?\s*(left|remaining)/i) ||
    lowerText.match(/expires?\s+in\s+\d+/i) ||
    document.querySelector('[class*="countdown"], [id*="countdown"], [class*="timer"], [id*="timer"]') !== null;

  // NEW: Popup/modal detection (fake security warnings)
  const hasPopupModal =
    document.querySelector('[role="dialog"], [role="alertdialog"], .modal, .popup, [class*="overlay"]') !== null;

  // NEW: Fake security badge detection
  const hasFakeSecurityBadge =
    lowerText.match(/verified\s+secure|100%\s+safe|ssl\s+protected|mcafee|norton|verisign/i) &&
    !document.querySelector('[href*="mcafee"], [href*="norton"], [href*="verisign"]'); // No actual link to security company

  return {
    urgencyScore,
    foundUrgencyPhrases,
    hasUrgentLanguage: urgencyScore >= 4, // Threshold
    hasMinimalContent,
    iframeCount: iframes.length,
    hasHiddenIframes,
    hasCopyrightMismatch,
    contentLength,
    hasSpellingErrors,
    genericContentCount,
    hasGenericContent: genericContentCount >= 2,
    // NEW: Advanced scam tactics
    hasCountdownTimer, // Fake urgency with timers
    hasPopupModal, // Fake security warnings
    hasFakeSecurityBadge, // Fake security seals
  };
}

function checkCopyrightMismatch(text, hostname) {
  const copyrightMatch = text.match(/©\s*\d{4}\s+([A-Za-z\s&]+)/);
  if (copyrightMatch) {
    const copyrightOwner = copyrightMatch[1].toLowerCase().trim();
    const brands = [
      'google', 'microsoft', 'apple', 'paypal', 'amazon',
      'facebook', 'meta', 'netflix', 'spotify', 'linkedin',
      'twitter', 'instagram', 'bank', 'chase', 'wells fargo'
    ];

    for (const brand of brands) {
      if (copyrightOwner.includes(brand) && !hostname.includes(brand)) {
        return true;
      }
    }
  }
  return false;
}

// ============================================================
// MODULE 5: SCRIPT ANALYSIS
// ============================================================

function analyzeScripts(document, currentHostname) {
  const scripts = document.querySelectorAll('script');
  let externalScriptCount = 0;
  let inlineScriptCount = 0;
  let hasSuspiciousScripts = false;
  const suspiciousPatterns = [];

  scripts.forEach(script => {
    const src = script.src;
    const content = script.textContent || '';

    if (src) {
      externalScriptCount++;
    } else if (content.trim()) {
      inlineScriptCount++;
    }

    // Check for suspicious patterns in scripts
    const dangerousPatterns = [
      { pattern: 'eval(', description: 'eval() execution', weight: 2 },
      { pattern: 'document.write(', description: 'DOM manipulation', weight: 1 },
      { pattern: 'window.location=', description: 'redirect', weight: 1 },
      { pattern: 'btoa(', description: 'base64 encoding', weight: 1 },
      { pattern: 'atob(', description: 'base64 decoding', weight: 1 },
      { pattern: '.submit()', description: 'auto-submit', weight: 2 },
      { pattern: 'addEventListener("submit"', description: 'form intercept', weight: 1 },
      { pattern: 'XMLHttpRequest', description: 'ajax request', weight: 1 },
      { pattern: 'setInterval', description: 'polling', weight: 1 },
    ];

    dangerousPatterns.forEach(({ pattern, description, weight }) => {
      if (content.includes(pattern)) {
        hasSuspiciousScripts = true;
        suspiciousPatterns.push({ pattern, description, weight });
      }
    });
  });

  return {
    scriptCount: scripts.length,
    externalScriptCount,
    inlineScriptCount,
    hasSuspiciousScripts,
    suspiciousPatterns,
    suspiciousScriptScore: suspiciousPatterns.reduce((sum, p) => sum + p.weight, 0),
  };
}

// ============================================================
// MODULE 6: REVOLUTIONARY TRUST SIGNAL ANALYSIS
// ============================================================

function analyzeTrustSignals(document, currentHostname) {
  const bodyText = document.body?.textContent.toLowerCase() || '';
  const links = Array.from(document.querySelectorAll('a')).map(a => ({
    href: a.href,
    text: a.textContent.toLowerCase()
  }));

  // Check for trust indicators that LEGITIMATE sites have
  const trustSignals = {
    hasPrivacyPolicy: false,
    hasTermsOfService: false,
    hasContactInfo: false,
    hasAboutPage: false,
    hasSocialMediaLinks: false,
    hasPhysicalAddress: false,
    hasPhoneNumber: false,
    hasEmailContact: false,
    hasCookieNotice: false,
    hasSecurityBadge: false,
  };

  // Privacy Policy
  links.forEach(({ href, text }) => {
    if (text.includes('privacy') || text.includes('policy') || href.includes('privacy')) {
      trustSignals.hasPrivacyPolicy = true;
    }
    if (text.includes('terms') || text.includes('service') || href.includes('terms')) {
      trustSignals.hasTermsOfService = true;
    }
    if (text.includes('contact') || text.includes('about') || href.includes('contact')) {
      trustSignals.hasContactInfo = true;
    }
    if (text.includes('about') || href.includes('about')) {
      trustSignals.hasAboutPage = true;
    }
  });

  // Social media links
  const socialPlatforms = ['facebook.com', 'twitter.com', 'linkedin.com', 'instagram.com', 'youtube.com'];
  links.forEach(({ href }) => {
    if (socialPlatforms.some(platform => href.includes(platform))) {
      trustSignals.hasSocialMediaLinks = true;
    }
  });

  // Physical address (regex for address patterns)
  const addressPattern = /\d+\s+[\w\s]+(?:street|st|avenue|ave|road|rd|boulevard|blvd|lane|ln|drive|dr)/i;
  if (addressPattern.test(bodyText)) {
    trustSignals.hasPhysicalAddress = true;
  }

  // Phone number
  const phonePattern = /(\+\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/;
  if (phonePattern.test(bodyText)) {
    trustSignals.hasPhoneNumber = true;
  }

  // Email contact
  const emailPattern = /[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/i;
  if (emailPattern.test(bodyText)) {
    trustSignals.hasEmailContact = true;
  }

  // Cookie notice
  if (bodyText.includes('cookie') && (bodyText.includes('accept') || bodyText.includes('consent'))) {
    trustSignals.hasCookieNotice = true;
  }

  // Security badges
  const securityBadges = ['norton', 'mcafee', 'verisign', 'trustwave', 'bbb', 'ssl', 'secure'];
  securityBadges.forEach(badge => {
    if (bodyText.includes(badge)) {
      trustSignals.hasSecurityBadge = true;
    }
  });

  // Calculate trust signal score (0-10 based on count of trust signals)
  const trustCount = Object.values(trustSignals).filter(Boolean).length;
  const trustSignalScore = trustCount; // 0-10 scale (raw count)

  // Trust level classification
  const isLowTrust = trustSignalScore < 3;     // 0-2 signals: Suspicious/scam sites
  const isMediumTrust = trustSignalScore >= 3 && trustSignalScore < 7; // 3-6 signals: Average sites
  const isHighTrust = trustSignalScore >= 7;   // 7-10 signals: Legitimate e-commerce/services

  return {
    ...trustSignals,
    trustCount,
    trustSignalScore,  // Raw 0-10 signal count
    isLowTrust,
    isMediumTrust,
    isHighTrust,
  };
}

// ============================================================
// MODULE 7: REVOLUTIONARY FAVICON BRAND VERIFICATION
// ============================================================

function analyzeFavicon(document, currentHostname) {
  const faviconLinks = document.querySelectorAll('link[rel*="icon"]');
  let hasFavicon = faviconLinks.length > 0;
  let faviconUrl = null;
  let faviconIsExternal = false;
  let faviconMatchesDomain = true;

  if (faviconLinks.length > 0) {
    try {
      const favicon = faviconLinks[0];
      faviconUrl = new URL(favicon.href, window.location.href);

      // Check if favicon is loaded from external domain (suspicious)
      if (faviconUrl.hostname !== currentHostname) {
        faviconIsExternal = true;
        faviconMatchesDomain = false;
      }

      // TODO: In future, we can download favicon and compare hash to known brands
      // For now, just check if favicon exists and where it's loaded from

    } catch (e) {
      // Invalid favicon URL
    }
  }

  return {
    hasFavicon,
    faviconUrl: faviconUrl?.href || null,
    faviconIsExternal,
    faviconMatchesDomain,
  };
}

// ============================================================
// MODULE 8: META TAG INTELLIGENCE
// ============================================================

function analyzeMetaTags(document, currentHostname) {
  const metaTags = document.querySelectorAll('meta');
  const ogTags = {};
  const twitterTags = {};
  let hasOpenGraph = false;
  let hasTwitterCards = false;
  let hasDescription = false;
  let hasKeywords = false;
  let descriptionQuality = 0;

  metaTags.forEach(meta => {
    const property = meta.getAttribute('property') || '';
    const name = meta.getAttribute('name') || '';
    const content = meta.getAttribute('content') || '';

    // Open Graph tags
    if (property.startsWith('og:')) {
      hasOpenGraph = true;
      ogTags[property] = content;
    }

    // Twitter Card tags
    if (name.startsWith('twitter:')) {
      hasTwitterCards = true;
      twitterTags[name] = content;
    }

    // Description
    if (name === 'description') {
      hasDescription = true;
      // Quality check: legitimate sites have detailed descriptions
      if (content.length > 50 && content.length < 300) {
        descriptionQuality = 10;
      } else if (content.length > 20) {
        descriptionQuality = 5;
      }
    }

    // Keywords (phishing sites often have generic keywords)
    if (name === 'keywords') {
      hasKeywords = true;
    }
  });

  return {
    hasOpenGraph,
    hasTwitterCards,
    hasDescription,
    hasKeywords,
    descriptionQuality,
    ogTags,
    twitterTags,
    metaTagQuality: (hasOpenGraph ? 3 : 0) + (hasDescription ? 3 : 0) + descriptionQuality,
  };
}

// ============================================================
// MODULE 9: CSS STRUCTURAL FINGERPRINTING
// ============================================================

function analyzeCSSFingerprint(document, currentHostname) {
  const stylesheets = document.querySelectorAll('link[rel="stylesheet"]');
  let externalStylesheets = 0;
  let inlineStyles = 0;
  let hasBootstrap = false;
  let hasTailwind = false;
  let hasCustomCSS = false;

  stylesheets.forEach(link => {
    try {
      const url = new URL(link.href);
      if (url.hostname !== currentHostname) {
        externalStylesheets++;
      }

      // Check for common CSS frameworks
      if (link.href.includes('bootstrap')) hasBootstrap = true;
      if (link.href.includes('tailwind')) hasTailwind = true;
    } catch (e) {}
  });

  // Count inline styles
  inlineStyles = document.querySelectorAll('style').length;

  // Check for custom CSS (legitimate sites usually have custom styling)
  hasCustomCSS = stylesheets.length > 0 || inlineStyles > 0;

  // Count elements with inline style attributes (suspicious if too many)
  const elementsWithInlineStyle = document.querySelectorAll('[style]').length;

  return {
    externalStylesheets,
    inlineStyles,
    hasBootstrap,
    hasTailwind,
    hasCustomCSS,
    elementsWithInlineStyle,
    hasExcessiveInlineStyles: elementsWithInlineStyle > 50,
  };
}

// ============================================================
// MODULE 10: RESOURCE PROVENANCE ANALYSIS
// ============================================================

function analyzeResourceProvenance(document, currentHostname) {
  const images = document.querySelectorAll('img');
  let externalImages = 0;
  let totalImages = images.length;
  let imagesFromCDN = 0;
  let imagesFromSuspiciousHosts = 0;

  const trustedCDNs = ['cloudflare', 'cloudinary', 'imgix', 'akamai', 'fastly', 'amazonaws', 'googleusercontent'];
  const suspiciousHosts = ['.tk', '.ml', '.ga', '.cf', '.gq'];

  images.forEach(img => {
    try {
      if (img.src) {
        const url = new URL(img.src);
        if (url.hostname !== currentHostname) {
          externalImages++;

          if (trustedCDNs.some(cdn => url.hostname.includes(cdn))) {
            imagesFromCDN++;
          }

          if (suspiciousHosts.some(host => url.hostname.endsWith(host))) {
            imagesFromSuspiciousHosts++;
          }
        }
      }
    } catch (e) {}
  });

  const externalImageRatio = totalImages > 0 ? externalImages / totalImages : 0;

  return {
    totalImages,
    externalImages,
    externalImageRatio,
    imagesFromCDN,
    imagesFromSuspiciousHosts,
    hasExcessiveExternalImages: externalImageRatio > 0.8 && totalImages > 5,
  };
}

// ============================================================
// MODULE 11: LANGUAGE QUALITY ANALYSIS
// ============================================================

function analyzeLanguageQuality(document) {
  const bodyText = document.body?.textContent || '';
  const title = document.title || '';

  // Check for excessive punctuation (!!!!, ????, etc.)
  const excessivePunctuation = /[!?]{3,}/.test(bodyText) || /[!?]{3,}/.test(title);

  // Check for ALL CAPS (shouting)
  const words = bodyText.split(/\s+/);
  const capsWords = words.filter(w => w.length > 3 && w === w.toUpperCase());
  const capsRatio = words.length > 0 ? capsWords.length / words.length : 0;

  // Check for mixed/weird spacing
  const weirdSpacing = /\s{3,}/.test(bodyText);

  return {
    excessivePunctuation,
    capsRatio,
    hasExcessiveCaps: capsRatio > 0.1,
    weirdSpacing,
    languageQualityScore: (excessivePunctuation ? -2 : 0) + (capsRatio > 0.1 ? -2 : 0) + (weirdSpacing ? -1 : 0),
  };
}

// ============================================================
// MODULE 12: CERTIFICATE INDICATORS
// ============================================================

function analyzeCertificateIndicators(urlObj) {
  const isHTTPS = urlObj.protocol === 'https:';
  const hasNonStandardPort = urlObj.port && urlObj.port !== '80' && urlObj.port !== '443';

  return {
    isHTTPS,
    hasNonStandardPort,
    port: urlObj.port || (isHTTPS ? '443' : '80'),
  };
}

// ============================================================
// MODULE 13: BRAND IMPERSONATION DETECTION
// ============================================================

function analyzeBrandImpersonation(document, currentHostname) {
  const title = document.title.toLowerCase();
  const bodyText = document.body?.textContent.toLowerCase() || '';
  const combinedText = title + ' ' + bodyText;

  const majorBrands = [
    { name: 'PayPal', keywords: ['paypal'], domains: ['paypal.com'] },
    { name: 'Google', keywords: ['google', 'gmail'], domains: ['google.com', 'gmail.com'] },
    { name: 'Microsoft', keywords: ['microsoft', 'outlook', 'office 365'], domains: ['microsoft.com', 'outlook.com', 'office.com'] },
    { name: 'Apple', keywords: ['apple', 'icloud', 'itunes'], domains: ['apple.com', 'icloud.com'] },
    { name: 'Amazon', keywords: ['amazon', 'aws'], domains: ['amazon.com', 'aws.amazon.com'] },
    { name: 'Facebook', keywords: ['facebook', 'meta'], domains: ['facebook.com', 'meta.com'] },
    { name: 'Netflix', keywords: ['netflix'], domains: ['netflix.com'] },
    { name: 'Bank', keywords: ['bank', 'chase', 'wells fargo', 'bank of america'], domains: ['chase.com', 'wellsfargo.com', 'bankofamerica.com'] },
  ];

  const mentionedBrands = [];
  const brandMismatches = [];

  majorBrands.forEach(brand => {
    const mentioned = brand.keywords.some(keyword => combinedText.includes(keyword));

    if (mentioned) {
      mentionedBrands.push(brand.name);

      // Check if domain matches (be more lenient with legitimate domains)
      const domainMatches = brand.domains.some(domain => {
        // Exact match
        if (currentHostname === domain) return true;

        // Subdomain match (www.google.com matches google.com)
        if (currentHostname.endsWith('.' + domain)) return true;

        // Domain without subdomain (google.com matches www.google.com)
        if (domain.startsWith('www.') && currentHostname === domain.substring(4)) return true;

        return false;
      });

      // IMPORTANT: Only flag as mismatch if:
      // 1. Domain doesn't match AND
      // 2. The brand mention isn't just generic (e.g., "search with Google")
      // For now, be conservative and only flag clear mismatches
      if (!domainMatches) {
        // Extra check: If this is a well-known legitimate site, don't flag it
        const knownLegitDomains = [
          'google.com', 'youtube.com', 'gmail.com',
          'facebook.com', 'instagram.com', 'whatsapp.com',
          'amazon.com', 'aws.amazon.com',
          'microsoft.com', 'office.com', 'outlook.com',
          'apple.com', 'icloud.com',
          'paypal.com',
          'netflix.com',
          'twitter.com', 'x.com'
        ];

        const isKnownLegit = knownLegitDomains.some(legit =>
          currentHostname === legit || currentHostname.endsWith('.' + legit)
        );

        if (!isKnownLegit) {
          brandMismatches.push(brand.name);
        }
      }
    }
  });

  return {
    mentionedBrands,
    brandMismatches,
    hasBrandMismatch: brandMismatches.length > 0,
    brandMismatchCount: brandMismatches.length,
  };
}

// ============================================================
// SCORING FUNCTIONS
// ============================================================

function calculateTrustScore(analysis) {
  // 0-100 scale, higher = more trustworthy
  let score = 50; // Start neutral

  // Trust signals (positive)
  score += analysis.trustSignalScore * 3; // 0-30 points (using raw 0-10 signal count)
  score += analysis.formSecurityScore * 2; // 0-20 points
  score += analysis.inputQualityScore; // 0-8 points
  score += analysis.metaTagQuality; // 0-10+ points
  score += analysis.descriptionQuality; // 0-10 points

  if (analysis.hasFavicon && analysis.faviconMatchesDomain) score += 5;
  if (analysis.hasCustomCSS) score += 5;
  if (analysis.isHTTPS) score += 10;

  // Negative indicators
  if (analysis.hasBrandMismatch) score -= 30;
  if (analysis.hasInsecureFormSubmission) score -= 40;
  if (analysis.hasExternalFormAction) score -= 35;
  if (analysis.isLowTrust) score -= 20;
  if (analysis.hasUrgentLanguage) score -= 15;
  if (analysis.hasMismatchedLinks) score -= 25;
  if (analysis.hasCopyrightMismatch) score -= 20;
  if (analysis.hasSpellingErrors) score -= 10;
  if (analysis.hasGenericContent) score -= 10;

  return Math.max(0, Math.min(100, score));
}

function calculateSuspicionScore(analysis) {
  // 0-100 scale, higher = more suspicious
  let score = 0;

  // Major red flags
  if (analysis.hasInsecureFormSubmission) score += 40;
  if (analysis.hasExternalFormAction) score += 35;
  if (analysis.hasBrandMismatch) score += 30;
  if (analysis.hasMismatchedLinks) score += 25;
  if (analysis.hasCopyrightMismatch) score += 20;

  // Medium flags
  if (analysis.hasUrgentLanguage) score += 15;
  if (analysis.hasLoginForm && analysis.isLowTrust) score += 15;
  if (analysis.hasMissingCSRFToken && analysis.hasPasswordField) score += 12;
  if (analysis.hasGenericContent) score += 10;
  if (analysis.hasSpellingErrors) score += 10;
  if (analysis.hasHiddenIframes) score += 10;

  // Accumulative flags
  score += analysis.suspiciousFormPatterns * 5;
  score += analysis.suspiciousLinkCount * 3;
  score += analysis.suspiciousScriptScore * 2;
  score += analysis.hiddenRedirectFields * 5;
  score += analysis.brandMismatchCount * 15;

  return Math.min(100, score);
}

function calculateConfidenceLevel(analysis) {
  // How confident are we in our assessment?
  // Based on how many signals we have
  let confidence = 0;

  if (analysis.formCount > 0) confidence += 10;
  if (analysis.totalLinkCount > 5) confidence += 10;
  if (analysis.scriptCount > 0) confidence += 10;
  if (analysis.trustCount > 0) confidence += 15;
  if (analysis.contentLength > 500) confidence += 15;
  if (analysis.hasDescription) confidence += 10;
  if (analysis.totalImages > 3) confidence += 10;
  if (analysis.hasCustomCSS) confidence += 10;
  if (analysis.mentionedBrands.length > 0) confidence += 10;

  return Math.min(100, confidence);
}

// ============================================================
// DEFAULT FEATURES
// ============================================================

function createDefaultHTMLFeatures() {
  return {
    // All features set to safe defaults
    formCount: 0,
    hasLoginForm: false,
    hasPasswordField: false,
    trustScore: 50,
    suspicionScore: 0,
    confidenceLevel: 0,
    analysisTime: 0,
  };
}

// Export for use in Chrome extension
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { analyzeHTMLContent };
}

// Global access for Chrome extension service worker
if (typeof self !== 'undefined') {
  self.analyzeHTMLContent = analyzeHTMLContent;
}
