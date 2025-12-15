// Risk Scoring Engine (JavaScript version)
// Calculates risk scores (0-100) based on domain features

// Scoring constants
const HIGH_RISK_SCORES = {
  WEB_RISK_FLAGGED: 80,
  USES_IP_ADDRESS: 35,
  HOMOGLYPH_ATTACK: 30,
  VERY_NEW_DOMAIN: 30,
  BRAND_IMPERSONATION: 30,
  TYPO_DOMAIN: 25,
  CERT_DOMAIN_MISMATCH: 20,
};

const MEDIUM_RISK_SCORES = {
  FREE_HOSTING_SERVICE: 20,  // AGGRESSIVE: Free hosting heavily abused
  RISKY_TLD: 15,
  PUNYCODE: 15,
  SUSPICIOUS_SUBDOMAIN: 15,
  URL_SHORTENER: 15,
  NUMBER_SUBSTITUTION: 15,
  SUSPICIOUS_PORT: 12,
  EXCESSIVE_SUBDOMAINS: 12,
  SUSPICIOUS_PATH_PATTERNS: 10,
  HIGH_ABUSE_ASN: 10,
  WHOIS_PRIVACY_NEW_DOMAIN: 10,
  NO_HTTPS: 10,
};

const LOW_RISK_SCORES = {
  EXCESSIVE_SUBDOMAIN_DEPTH: 5,
  VERY_LONG_HOSTNAME: 5,
  MANY_DIGITS: 5,
  MANY_HYPHENS: 5,
  SUSPICIOUS_KEYWORDS: 5,
  COMBINED_WEAK_SIGNALS_BONUS: 15,  // INCREASED: More aggressive detection
};

const SCORE_THRESHOLDS = {
  DANGEROUS: 70,
  SUSPICIOUS: 25,  // LOWERED from 30 to 25 - VERY AGGRESSIVE
};

const FEATURE_THRESHOLDS = {
  SUBDOMAIN_DEPTH: 4,
  HOSTNAME_LENGTH: 50,
  DIGIT_COUNT: 3,
  HYPHEN_COUNT: 3,
  MIN_SUSPICIOUS_KEYWORDS: 2,
  NEW_DOMAIN_WHOIS_PRIVACY_DAYS: 30,
};

/**
 * Calculate risk score from domain features
 * @param {Object} domain - Domain features object
 * @returns {Object} Risk assessment with score, label, and reasons
 */
function buildRiskScore(domain) {
  let score = 0;
  const reasons = [];

  // Evaluate all risk categories
  score += evaluateHighRiskFlags(domain, reasons);
  score += evaluateMediumRiskFlags(domain, reasons);
  score += evaluateLowRiskFlags(domain, reasons);

  // REVOLUTIONARY: Smart combination detection
  score += evaluateSmartCombinations(domain, reasons);

  // REVOLUTIONARY: HTML Content Analysis (if available)
  score += evaluateHTMLFeatures(domain, reasons);

  // Cap score at 100
  score = Math.min(score, 100);

  // Determine label
  const label = determineRiskLabel(score);

  return {
    score,
    label,
    reasons,
  };
}

// REVOLUTIONARY: Smart Combination Detection
// Detects dangerous COMBINATIONS that are much worse than individual flags
function evaluateSmartCombinations(domain, reasons) {
  let score = 0;

  // COMBINATION 1: Brand/Gov impersonation on free hosting = INSTANT DANGEROUS
  if (domain.looksLikeBrand !== null && domain.isFreeHostingService) {
    score += 25;
    reasons.push(`🚨 CRITICAL: ${domain.looksLikeBrand} impersonation on free hosting service!`);
  }

  // COMBINATION 2: Government terms + free hosting = EXTREMELY SUSPICIOUS
  if (domain.isFreeHostingService) {
    const govKeywords = ['gov', 'tax', 'irs', 'elster', 'hmrc', 'treasury', 'federal', 'revenue'];
    const hasGovTerm = govKeywords.some(keyword => domain.hostname.toLowerCase().includes(keyword));
    if (hasGovTerm && domain.looksLikeBrand === null) {
      score += 20;
      reasons.push('🚨 Government-related terms on free hosting (high phishing risk)');
    }
  }

  // COMBINATION 3: Free hosting + login/account pages = VERY SUSPICIOUS
  if (domain.isFreeHostingService && domain.hasSuspiciousPathPatterns) {
    score += 15;
    reasons.push('⚠️ Free hosting with suspicious login/account pages');
  }

  // COMBINATION 4: Free hosting + brand keywords in URL = SUSPICIOUS
  if (domain.isFreeHostingService && domain.suspiciousKeywords.length >= 2) {
    score += 10;
    reasons.push('⚠️ Free hosting with multiple suspicious keywords');
  }

  // COMBINATION 5: URL shortener + suspicious keywords = LIKELY SCAM
  if (domain.isUrlShortener && domain.suspiciousKeywords.length >= 1) {
    score += 10;
    reasons.push('⚠️ URL shortener hiding suspicious content');
  }

  // COMBINATION 6: No HTTPS + free hosting + any brand mention = DANGEROUS
  if (!domain.usesHttps && domain.isFreeHostingService && domain.looksLikeBrand !== null) {
    score += 20;
    reasons.push('🚨 Unencrypted brand impersonation on free hosting');
  }

  // COMBINATION 7: Multiple weak signals on free hosting = AMPLIFIED RISK
  if (domain.isFreeHostingService && domain.combinedWeakSignals >= 2) {
    score += 10;
    reasons.push('⚠️ Multiple suspicious patterns on free hosting platform');
  }

  return score;
}

// REVOLUTIONARY: Context-Aware Bayesian HTML Content Analysis
// Uses trust score as prior probability to weight all signals
function evaluateHTMLFeatures(domain, reasons) {
  let score = 0;

  // Check if HTML analysis is available
  if (!domain.html) {
    return 0; // No HTML analysis available
  }

  const html = domain.html;

  // === BAYESIAN TRUST SCORE DOMINANCE ===
  // Trust score acts as prior probability that modulates ALL other signals
  // High trust = legitimate site, weak signals should be heavily discounted

  const trustScore = html.trustScore || 0;
  const isHighTrust = trustScore >= 7;    // Strong trust signals (Gmail, PayPal, etc.)
  const isMediumTrust = trustScore >= 4;  // Some trust signals
  const isLowTrust = trustScore < 4;      // Weak/no trust signals

  // Calculate trust multiplier for weak signals (Bayesian weighting)
  // High trust sites: weak signals count for almost nothing (0.05x)
  // Medium trust sites: weak signals count for less (0.4x)
  // Low trust sites: weak signals count fully (1.0x)
  let weakSignalMultiplier = 1.0;
  if (isHighTrust) {
    weakSignalMultiplier = 0.05;  // 95% discount for high trust sites
  } else if (isMediumTrust) {
    weakSignalMultiplier = 0.4;   // 60% discount for medium trust sites
  }

  // === CRITICAL HTML FLAGS (always count, but modulated by trust) ===
  // These are STRONG signals that even legitimate sites rarely have

  // NEW: Financial data harvesting - INSTANT DANGEROUS (but not on legitimate e-commerce)
  if (html.hasFinancialHarvesting && isLowTrust) {
    // Only flag complete harvesting on LOW trust sites (0-2 signals)
    // Medium/high trust sites are legitimate e-commerce with checkout forms
    score += 60;
    reasons.push('🚨 CRITICAL: Complete credit card harvesting detected (card + CVV + expiry)');
  } else if (html.hasCVVField && isLowTrust) {
    // CVV field alone is suspicious on LOW trust sites only
    score += 40;
    reasons.push('🚨 CRITICAL: CVV/Security code field detected (credential harvesting)');
  }

  // NEW: Identity theft attempt - INSTANT DANGEROUS
  if (html.hasIdentityTheftAttempt && isLowTrust) {
    score += 55;
    reasons.push('🚨 CRITICAL: Identity theft attempt (SSN/bank account requested)');
  }

  // NEW: 2FA/OTP phishing - Context-dependent danger
  // LOW trust: Definitely phishing (no legitimate site with 0-2 trust signals needs OTP)
  // MEDIUM trust: Could be legitimate 2FA login, only flag if brand mismatch
  // HIGH trust: Legitimate 2FA, only flag if brand mismatch
  if (html.has2FAPhishing && isLowTrust) {
    score += 70;
    reasons.push('🚨 CRITICAL: 2FA/OTP code phishing detected (NEVER legitimate!)');
  } else if (html.has2FAPhishing && isMediumTrust && html.hasBrandMismatch) {
    // Medium trust + brand mismatch = somewhat suspicious
    score += 15;
    reasons.push('ℹ️ 2FA field detected with brand mention (verify site legitimacy)');
  } else if (html.has2FAPhishing && isHighTrust && html.hasBrandMismatch) {
    // Even high trust sites with 2FA fields + brand mismatch = suspicious
    score += 25;
    reasons.push('⚠️ 2FA code field on site with brand mismatch (verify carefully)');
  }

  // NEW: Crypto fields - Context-dependent
  // LOW trust: Definitely scam (requesting private keys)
  // MEDIUM/HIGH trust: Could be legitimate (accepting crypto payments, crypto exchange)
  if (html.hasCryptoScam && isLowTrust) {
    score += 65;
    reasons.push('🚨 CRITICAL: Cryptocurrency wallet/private key requested (SCAM!)');
  } else if (html.hasCryptoScam && isMediumTrust) {
    // Medium trust might legitimately accept crypto payments
    score += 10;
    reasons.push('ℹ️ Cryptocurrency payment option detected');
  }

  // Insecure form submission (password on HTTP) - ALWAYS CRITICAL
  if (html.hasInsecureFormSubmission) {
    score += 40;
    reasons.push('🚨 CRITICAL: Password form on HTTP (unencrypted)');
  }

  // External form action (form submits to different domain) - ALWAYS CRITICAL
  if (html.hasExternalFormAction) {
    score += 35;
    reasons.push('🚨 CRITICAL: Form submits to external domain (credential harvesting)');
  }

  // Copyright mismatch - Context-dependent
  if (html.hasCopyrightMismatch && isLowTrust) {
    score += 30;
    reasons.push('🚨 Brand copyright mismatch detected');
  } else if (html.hasCopyrightMismatch && isMediumTrust) {
    score += 10;
    reasons.push('ℹ️ Copyright year mismatch detected');
  }

  // Brand mention mismatch - Context-dependent
  // Note: E-commerce sites often mention payment brands (Visa, PayPal) or partner brands
  if (html.hasBrandMismatch && isLowTrust) {
    score += 30;
    reasons.push(`🚨 Page mentions brand but domain doesn't match`);
  } else if (html.hasBrandMismatch && isMediumTrust) {
    score += 8;
    reasons.push(`ℹ️ Page mentions external brands (common for e-commerce)`);
  }

  // === CONTEXT-AWARE WEAK SIGNALS (modulated by trust) ===
  // These are WEAK signals that legitimate sites often have

  // Hidden iframes - ONLY suspicious on low trust sites
  // Medium/high trust sites (Gmail, e-commerce) legitimately use iframes for ads, widgets, etc.
  if (html.hasHiddenIframes && isLowTrust) {
    const iframeScore = Math.round(25 * weakSignalMultiplier);
    if (iframeScore > 0) {
      score += iframeScore;
      reasons.push('⚠️ Hidden iframes detected (suspicious)');
    }
  }

  // Urgent language - ONLY suspicious on low trust sites
  // High trust sites (Gmail, banks) have legitimate security warnings
  if (html.hasUrgentLanguage && isLowTrust) {
    const urgencyScore = Math.round(15 * weakSignalMultiplier);
    if (urgencyScore > 0) {
      score += urgencyScore;
      reasons.push(`⚠️ Urgency/scare tactics detected (${html.urgencyScore} patterns)`);
    }
  }

  // Generic content - ONLY suspicious on low trust sites
  // Many legitimate sites use templates
  if (html.hasGenericContent && isLowTrust) {
    const genericScore = Math.round(10 * weakSignalMultiplier);
    if (genericScore > 0) {
      score += genericScore;
      reasons.push('ℹ️ Generic template content detected');
    }
  }

  // === MEDIUM-STRENGTH SIGNALS (partially modulated) ===

  // Link text-href mismatch - Suspicious even on medium trust sites
  if (html.hasMismatchedLinks) {
    const mismatchMultiplier = isHighTrust ? 0.1 : 0.6;
    const linkScore = Math.round(25 * mismatchMultiplier);
    if (linkScore > 0) {
      score += linkScore;
      reasons.push('⚠️ Link display text doesn\'t match destination');
    }
  }

  // Login form - Only flag if combined with other issues
  if (html.hasLoginForm && isLowTrust) {
    score += 10;
    reasons.push('ℹ️ Login form detected on page');
  }

  // Password field - Only flag if combined with other issues
  if (html.hasPasswordField && isLowTrust) {
    score += 10;
    reasons.push('ℹ️ Password field detected');
  }

  // Missing CSRF token - Only flag on low trust sites
  if (html.hasMissingCSRFToken && html.hasPasswordField && isLowTrust) {
    score += 15;
    reasons.push('⚠️ Missing CSRF protection token');
  }

  // Suspicious form patterns - Modulated by trust
  if (html.suspiciousFormPatterns > 0) {
    const formScore = Math.round(html.suspiciousFormPatterns * 5 * weakSignalMultiplier);
    if (formScore > 0) {
      score += formScore;
      reasons.push(`⚠️ ${html.suspiciousFormPatterns} suspicious form patterns detected`);
    }
  }

  // Excessive external links - Only flag on low trust sites
  if (html.hasExcessiveExternalLinks && isLowTrust) {
    score += 12;
    reasons.push('⚠️ Excessive external links (>70%)');
  }

  // Spelling errors - Only flag on low trust sites
  if (html.hasSpellingErrors && isLowTrust) {
    score += 10;
    reasons.push('ℹ️ Spelling/grammar errors detected');
  }

  // NEW: Countdown timer - Suspicious urgency tactic
  if (html.hasCountdownTimer && isLowTrust) {
    score += 20;
    reasons.push('⚠️ Countdown timer detected (fake urgency tactic)');
  }

  // NEW: Popup/modal - Fake security warnings (only flag on low trust)
  // Medium/high trust sites legitimately use modals for newsletters, cookies, etc.
  if (html.hasPopupModal && (html.hasUrgentLanguage || html.hasLoginForm) && isLowTrust) {
    score += 15;
    reasons.push('⚠️ Suspicious popup/modal with login or urgency language');
  }

  // NEW: Fake security badge - Impersonating security companies
  if (html.hasFakeSecurityBadge && !isHighTrust) {
    score += 25;
    reasons.push('⚠️ Fake security badge detected (impersonating McAfee/Norton/Verisign)');
  }

  // Suspicious hidden redirect fields - Context-dependent
  if (html.hiddenRedirectFields > 0 && isLowTrust) {
    score += html.hiddenRedirectFields * 8;
    reasons.push(`⚠️ Hidden redirect fields detected`);
  } else if (html.hiddenRedirectFields > 0 && isMediumTrust) {
    score += html.hiddenRedirectFields * 3;
    reasons.push(`ℹ️ Hidden redirect fields detected (common in e-commerce)`);
  }

  // === TRUST SIGNAL ANALYSIS ===
  // Low trust score = missing legitimate site indicators
  if (html.isLowTrust && html.hasLoginForm) {
    score += 20;
    reasons.push('🚨 Login form with very low trust signals (no privacy policy, contact info, etc.)');
  } else if (html.isLowTrust && !html.hasLoginForm) {
    score += 10;
    reasons.push('⚠️ Low trust signals (missing privacy policy, terms, contact info)');
  }

  // === REVOLUTIONARY COMBINATIONS (HTML + URL) ===
  // These are STRONG signals even with trust modulation

  // New domain + login form + low trust = PHISHING KIT
  if (domain.isVeryNew && html.hasLoginForm && html.isLowTrust) {
    score += 30;
    reasons.push('🚨 CRITICAL: New domain + login form + no trust signals (phishing kit)');
  }

  // Brand impersonation + login form + low trust
  if (domain.looksLikeBrand && html.hasLoginForm && html.isLowTrust) {
    score += 25;
    reasons.push('🚨 CRITICAL: Brand impersonation with login form and no trust signals');
  }

  // Free hosting + login form + brand mention
  if (domain.isFreeHostingService && html.hasLoginForm && html.brandMismatchCount > 0) {
    score += 20;
    reasons.push('🚨 Free hosting with brand impersonation login page');
  }

  // Urgent language + new domain + login form (only if low trust)
  if (html.hasUrgentLanguage && domain.isNew && html.hasLoginForm && isLowTrust) {
    score += 20;
    reasons.push('🚨 Scare tactics on new domain with login form');
  }

  // === POSITIVE SIGNALS (reduce score for legitimate indicators) ===

  // High trust signal count - STRONG negative weight for legitimate sites
  if (html.trustSignalScore >= 7 && !html.hasBrandMismatch) {
    score -= 20;  // Increased from -15
    reasons.push('✅ Strong trust signals detected (privacy policy, contact info, etc.)');
  } else if (html.trustSignalScore >= 5 && !html.hasBrandMismatch) {
    score -= 10;
    reasons.push('✅ Moderate trust signals detected');
  }

  // Good input quality (proper HTML5 attributes)
  if (html.inputQualityScore >= 6 && html.hasLoginForm) {
    score -= 10;
    reasons.push('✅ Proper form validation attributes detected');
  }

  // High meta tag quality
  if (html.metaTagQuality >= 8) {
    score -= 5;
    reasons.push('✅ Professional meta tags detected');
  }

  return Math.max(0, score); // Never go negative
}

// High-risk flag evaluation
function evaluateHighRiskFlags(domain, reasons) {
  let score = 0;

  // Web Risk flagged
  if (domain.webRiskFlagged) {
    score += HIGH_RISK_SCORES.WEB_RISK_FLAGGED;

    if (domain.webRiskThreatTypes.length > 0) {
      const threatList = domain.webRiskThreatTypes.join(', ');
      reasons.push(`🚨 Flagged by Google Web Risk: ${threatList}`);
    } else {
      reasons.push('🚨 Flagged by Google Web Risk as potentially dangerous');
    }
  }

  // Very new domain
  if (domain.isVeryNew) {
    score += HIGH_RISK_SCORES.VERY_NEW_DOMAIN;
    reasons.push('⚠️ Domain is very new (< 7 days old)');
  }

  // Brand impersonation
  if (domain.looksLikeBrand !== null) {
    score += HIGH_RISK_SCORES.BRAND_IMPERSONATION;
    reasons.push(`⚠️ Domain appears to impersonate the brand: ${domain.looksLikeBrand}`);
  }

  // Typosquatting
  if (domain.isTypoDomain) {
    score += HIGH_RISK_SCORES.TYPO_DOMAIN;
    reasons.push('⚠️ Domain contains typographic trick (typosquatting)');
  }

  // Certificate mismatch
  if (domain.certDomainMismatch === true) {
    score += HIGH_RISK_SCORES.CERT_DOMAIN_MISMATCH;
    reasons.push('⚠️ SSL certificate does not match domain name');
  }

  // IP address instead of domain
  if (domain.usesIpAddress) {
    score += HIGH_RISK_SCORES.USES_IP_ADDRESS;
    reasons.push('🚨 URL uses IP address instead of domain name (common in phishing)');
  }

  // Homoglyph/Unicode attack
  if (domain.hasHomoglyphs) {
    score += HIGH_RISK_SCORES.HOMOGLYPH_ATTACK;
    reasons.push('🚨 Domain uses lookalike characters (homoglyph attack)');
  }

  return score;
}

// Medium-risk flag evaluation
function evaluateMediumRiskFlags(domain, reasons) {
  let score = 0;

  // Risky TLD
  if (domain.isRiskyTld) {
    score += MEDIUM_RISK_SCORES.RISKY_TLD;
    reasons.push(`⚠️ TLD (.${domain.tld}) is commonly abused for scams`);
  }

  // Punycode
  if (domain.isPunycode) {
    score += MEDIUM_RISK_SCORES.PUNYCODE;
    reasons.push('⚠️ Domain uses Punycode (IDN homoglyphs)');
  }

  // Suspicious subdomain pattern
  if (domain.hasSuspiciousSubdomain) {
    score += MEDIUM_RISK_SCORES.SUSPICIOUS_SUBDOMAIN;
    reasons.push('⚠️ Suspicious subdomain pattern detected (common in phishing)');
  }

  // Free hosting service (HEAVILY ABUSED)
  if (domain.isFreeHostingService) {
    score += MEDIUM_RISK_SCORES.FREE_HOSTING_SERVICE;
    reasons.push('⚠️ Free hosting service detected (frequently abused for phishing)');
  }

  // High abuse ASN
  if (domain.isHighAbuseAsn === true) {
    const asnInfo = domain.asnName ? ` (${domain.asnName})` : '';
    score += MEDIUM_RISK_SCORES.HIGH_ABUSE_ASN;
    reasons.push(`⚠️ Domain is hosted on a high-risk hosting provider${asnInfo}`);
  }

  // WHOIS privacy + new domain
  if (
    domain.whoisPrivacyEnabled === true &&
    domain.domainAgeDays !== null &&
    domain.domainAgeDays !== undefined &&
    domain.domainAgeDays < FEATURE_THRESHOLDS.NEW_DOMAIN_WHOIS_PRIVACY_DAYS
  ) {
    score += MEDIUM_RISK_SCORES.WHOIS_PRIVACY_NEW_DOMAIN;
    reasons.push('⚠️ Recently registered domain using WHOIS privacy');
  }

  // No HTTPS
  if (!domain.usesHttps) {
    score += MEDIUM_RISK_SCORES.NO_HTTPS;
    reasons.push('⚠️ Domain does not use HTTPS');
  }

  // URL Shortener
  if (domain.isUrlShortener) {
    score += MEDIUM_RISK_SCORES.URL_SHORTENER;
    reasons.push('⚠️ URL shortener detected (often hides malicious links)');
  }

  // Number substitution patterns
  if (domain.hasNumberSubstitution) {
    score += MEDIUM_RISK_SCORES.NUMBER_SUBSTITUTION;
    reasons.push('⚠️ Suspicious character substitution detected (e.g., g00gle)');
  }

  // Suspicious port
  if (domain.hasSuspiciousPort) {
    score += MEDIUM_RISK_SCORES.SUSPICIOUS_PORT;
    reasons.push('⚠️ Non-standard port detected');
  }

  // Excessive subdomains
  if (domain.hasExcessiveSubdomains) {
    score += MEDIUM_RISK_SCORES.EXCESSIVE_SUBDOMAINS;
    reasons.push('⚠️ Excessively long subdomain chain (common obfuscation tactic)');
  }

  // Suspicious path patterns
  if (domain.hasSuspiciousPathPatterns) {
    score += MEDIUM_RISK_SCORES.SUSPICIOUS_PATH_PATTERNS;
    reasons.push('⚠️ URL contains suspicious login/payment page patterns');
  }

  return score;
}

// Low-risk flag evaluation
function evaluateLowRiskFlags(domain, reasons) {
  let score = 0;

  // Excessive subdomain depth
  if (domain.subdomainDepth >= FEATURE_THRESHOLDS.SUBDOMAIN_DEPTH) {
    score += LOW_RISK_SCORES.EXCESSIVE_SUBDOMAIN_DEPTH;
    reasons.push('ℹ️ Excessively long subdomain chain');
  }

  // Very long hostname
  if (domain.hostnameLength > FEATURE_THRESHOLDS.HOSTNAME_LENGTH) {
    score += LOW_RISK_SCORES.VERY_LONG_HOSTNAME;
    reasons.push('ℹ️ Very long domain name');
  }

  // Many digits
  if (domain.digitCount > FEATURE_THRESHOLDS.DIGIT_COUNT) {
    score += LOW_RISK_SCORES.MANY_DIGITS;
    reasons.push(`ℹ️ Domain has many digits (${domain.digitCount})`);
  }

  // Many hyphens
  if (domain.hyphenCount > FEATURE_THRESHOLDS.HYPHEN_COUNT) {
    score += LOW_RISK_SCORES.MANY_HYPHENS;
    reasons.push(`ℹ️ Domain has many hyphens (${domain.hyphenCount})`);
  }

  // Suspicious keywords
  if (domain.suspiciousKeywords.length >= FEATURE_THRESHOLDS.MIN_SUSPICIOUS_KEYWORDS) {
    score += LOW_RISK_SCORES.SUSPICIOUS_KEYWORDS;
    const keywords = domain.suspiciousKeywords.join(', ');
    reasons.push(`ℹ️ Domain name contains suspicious keywords: ${keywords}`);
  }

  // Combined weak signals bonus (multiple weak indicators = stronger signal)
  if (domain.combinedWeakSignals >= 3) {
    score += LOW_RISK_SCORES.COMBINED_WEAK_SIGNALS_BONUS;
    reasons.push(`⚠️ Multiple suspicious indicators detected (${domain.combinedWeakSignals} patterns)`);
  } else if (domain.combinedWeakSignals === 2) {
    // Even 2 weak signals add bonus now (more aggressive)
    score += 5;
    reasons.push(`ℹ️ Two suspicious indicators detected (${domain.combinedWeakSignals} patterns)`);
  }

  return score;
}

// Determine risk label
function determineRiskLabel(score) {
  if (score >= SCORE_THRESHOLDS.DANGEROUS) {
    return 'DANGEROUS';
  }

  if (score >= SCORE_THRESHOLDS.SUSPICIOUS) {
    return 'SUSPICIOUS';
  }

  return 'LIKELY_SAFE';
}

// Helper: Get color for UI
function getRiskColor(label) {
  switch (label) {
    case 'DANGEROUS':
      return '#dc2626';
    case 'SUSPICIOUS':
      return '#f59e0b';
    case 'LIKELY_SAFE':
      return '#10b981';
    default:
      return '#6b7280';
  }
}

// Helper: Get description
function getRiskDescription(label) {
  switch (label) {
    case 'DANGEROUS':
      return 'This site is likely malicious. Do not proceed or enter any information.';
    case 'SUSPICIOUS':
      return 'This site shows suspicious characteristics. Exercise extreme caution.';
    case 'LIKELY_SAFE':
      return 'No significant threats detected. Standard web safety practices apply.';
    default:
      return 'Unknown risk level.';
  }
}

// Export for use in Chrome extension
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    buildRiskScore,
    getRiskColor,
    getRiskDescription,
  };
}
