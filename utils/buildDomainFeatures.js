// Domain Feature Extraction Module (JavaScript version)
// Extracts comprehensive domain features for risk scoring analysis

/**
 * Extract comprehensive domain features from a URL
 * @param {string} url - The URL to analyze
 * @param {Object} webRiskData - Optional Web Risk API results
 * @returns {Object} Complete domain features object
 */
function buildDomainFeatures(url, webRiskData) {
  try {
    const urlObj = new URL(url);
    const hostname = urlObj.hostname.toLowerCase();

    // Extract all feature categories
    const basicInfo = extractBasicInfo(urlObj, hostname);
    const structure = analyzeStructure(hostname);
    const patterns = detectPatterns(hostname, url);
    const advanced = detectAdvancedThreats(urlObj, hostname, url);
    const ageInfo = estimateDomainAge(hostname);
    const security = analyzeSecurityFeatures(urlObj);
    const network = analyzeNetwork(hostname);
    const webRisk = mergeWebRiskData(webRiskData);

    // Combine all features
    return {
      // Basic info
      url,
      hostname,
      registeredDomain: basicInfo.registeredDomain,
      tld: basicInfo.tld,

      // Structural
      subdomainDepth: structure.subdomainDepth,
      hostnameLength: hostname.length,
      digitCount: structure.digitCount,
      hyphenCount: structure.hyphenCount,
      hasSuspiciousSubdomain: structure.hasSuspiciousSubdomain,

      // Patterns
      looksLikeBrand: patterns.looksLikeBrand,
      isTypoDomain: patterns.isTypoDomain,
      isPunycode: patterns.isPunycode,
      isRiskyTld: patterns.isRiskyTld,
      suspiciousKeywords: patterns.suspiciousKeywords,

      // Advanced threats
      usesIpAddress: advanced.usesIpAddress,
      hasHomoglyphs: advanced.hasHomoglyphs,
      isUrlShortener: advanced.isUrlShortener,
      isFreeHostingService: advanced.isFreeHostingService,
      hasSuspiciousPort: advanced.hasSuspiciousPort,
      hasExcessiveSubdomains: advanced.hasExcessiveSubdomains,
      hasNumberSubstitution: advanced.hasNumberSubstitution,
      hasSuspiciousPathPatterns: advanced.hasSuspiciousPathPatterns,
      combinedWeakSignals: advanced.combinedWeakSignals,

      // Domain age
      creationDate: ageInfo.creationDate,
      domainAgeDays: ageInfo.domainAgeDays,
      isVeryNew: ageInfo.isVeryNew,
      isNew: ageInfo.isNew,
      isYoung: ageInfo.isYoung,
      whoisPrivacyEnabled: ageInfo.whoisPrivacyEnabled,

      // Security
      usesHttps: security.usesHttps,
      hasValidCert: security.hasValidCert,
      certIssuer: security.certIssuer,
      certExpiryDays: security.certExpiryDays,
      certDomainMismatch: security.certDomainMismatch,

      // Network
      ipAddress: network.ipAddress,
      ipCountry: network.ipCountry,
      asnName: network.asnName,
      isHighAbuseAsn: network.isHighAbuseAsn,

      // Web Risk
      webRiskFlagged: webRisk.webRiskFlagged,
      webRiskThreatTypes: webRisk.webRiskThreatTypes,
    };

  } catch (error) {
    console.error('Error extracting domain features:', error);
    return createDefaultFeatures(url);
  }
}

// Basic information extraction
function extractBasicInfo(urlObj, hostname) {
  const parts = hostname.split('.');
  const tld = parts[parts.length - 1];

  let registeredDomain = hostname;
  if (parts.length >= 2) {
    registeredDomain = `${parts[parts.length - 2]}.${parts[parts.length - 1]}`;
  }

  return { registeredDomain, tld };
}

// Structural analysis
function analyzeStructure(hostname) {
  const parts = hostname.split('.');
  const subdomainDepth = Math.max(0, parts.length - 2);
  const digitCount = (hostname.match(/\d/g) || []).length;
  const hyphenCount = (hostname.match(/-/g) || []).length;

  // Check for suspicious subdomain patterns
  const hasSuspiciousSubdomain = detectSuspiciousSubdomain(hostname);

  return {
    subdomainDepth,
    digitCount,
    hyphenCount,
    hasSuspiciousSubdomain
  };
}

// Detect suspicious subdomain patterns
function detectSuspiciousSubdomain(hostname) {
  const suspiciousPatterns = [
    /^ww\d+\./,              // ww25., ww1., www2., etc.
    /^www\d+\./,             // www1., www2., etc.
    /^login[-.]/,            // login., login-, etc.
    /^account[-.]/,          // account., account-, etc.
    /^secure[-.]/,           // secure., secure-, etc.
    /^verify[-.]/,           // verify., verify-, etc.
    /^update[-.]/,           // update., update-, etc.
    /^signin[-.]/,           // signin., signin-, etc.
    /^auth[-.]/,             // auth., auth-, etc.
    /^pay[-.]/,              // pay., pay-, etc.
    /^billing[-.]/,          // billing., billing-, etc.
    /^support[-.]/,          // support., support-, etc.
    /^service[-.]/,          // service., service-, etc.
    /^help[-.]/,             // help., help-, etc.
    /^client[-.]/            // client., client-, etc.
  ];

  return suspiciousPatterns.some(pattern => pattern.test(hostname));
}

// Pattern detection
function detectPatterns(hostname, fullUrl) {
  return {
    looksLikeBrand: detectBrandImpersonation(hostname),
    isTypoDomain: detectTyposquatting(hostname),
    isPunycode: hostname.startsWith('xn--'),
    isRiskyTld: detectRiskyTld(hostname),
    suspiciousKeywords: detectSuspiciousKeywords(fullUrl),
  };
}

function detectBrandImpersonation(hostname) {
  const brands = [
    {
      name: 'Apple/iCloud',
      patterns: ['icloud', 'appleid', 'apple-id', 'applestore', 'app1e', 'icl0ud', 'i-cloud'],
      legitDomains: ['icloud.com', 'apple.com', 'appleid.apple.com']
    },
    {
      name: 'Google',
      patterns: ['google', 'googel', 'gooogle', 'goog1e', 'g00gle'],
      legitDomains: ['google.com', 'gmail.com', 'google.co', 'google.ca']
    },
    {
      name: 'PayPal',
      patterns: ['paypal', 'paypai', 'paypa1', 'pay-pal', 'paypa11'],
      legitDomains: ['paypal.com']
    },
    {
      name: 'Amazon',
      patterns: ['amazon', 'amaz0n', 'arnazon', 'amazom'],
      legitDomains: ['amazon.com', 'amazon.co.uk', 'amazon.ca']
    },
    {
      name: 'Microsoft',
      patterns: ['microsoft', 'micros0ft', 'microsft', 'outlook', 'hotmail'],
      legitDomains: ['microsoft.com', 'outlook.com', 'hotmail.com', 'live.com']
    },
    {
      name: 'Facebook/Meta',
      patterns: ['facebook', 'facebo0k', 'fb-', 'meta-'],
      legitDomains: ['facebook.com', 'fb.com', 'meta.com']
    },
    {
      name: 'Netflix',
      patterns: ['netflix', 'netfl1x', 'netfix'],
      legitDomains: ['netflix.com']
    },
    {
      name: 'Bank',
      patterns: ['bank-', '-bank', 'banking', 'chase-', 'wellsfargo', 'bankofamerica'],
      legitDomains: []
    },
    {
      name: 'WhatsApp',
      patterns: ['whatsapp', 'whatsap', 'whats-app'],
      legitDomains: ['whatsapp.com']
    },
    {
      name: 'Government/Tax Authority',
      patterns: [
        'elster', 'irs', 'tax-', '-tax', 'taxes', 'hmrc', 'cra-', 'ato-',
        'gov-', '-gov', 'govt-', 'government', 'federal', 'state-',
        'treasury', 'revenue', 'finanz', 'fiscal'
      ],
      legitDomains: [
        'irs.gov', 'gov.uk', 'canada.ca', 'ato.gov.au', 'elster.de',
        'gouvernement.fr', 'gobierno.es', 'bundesfinanzministerium.de'
      ]
    },
    {
      name: 'Cryptocurrency',
      patterns: [
        'metamask', 'coinbase', 'binance', 'crypto-', '-crypto',
        'wallet-', 'blockchain-', 'bitcoin', 'ethereum', 'defi'
      ],
      legitDomains: ['metamask.io', 'coinbase.com', 'binance.com']
    }
  ];

  const hostLower = hostname.toLowerCase();

  for (const brand of brands) {
    for (const pattern of brand.patterns) {
      if (hostLower.includes(pattern)) {
        // Check if it's actually a legitimate domain
        const isLegit = brand.legitDomains.some(legitDomain => {
          return hostLower === legitDomain || hostLower.endsWith('.' + legitDomain);
        });

        if (!isLegit) {
          return brand.name;
        }
      }
    }
  }

  return null;
}

function detectTyposquatting(hostname) {
  // Check for ACTUAL typosquatting, not legitimate domains
  // Only match suspicious variations, not the real domains

  const typoPatterns = [
    /g[o]{3,}gle\.com/,      // gooogle.com (3+ o's) - NOT google.com
    /g0[o0]gle\.com/,        // g00gle.com, g0ogle.com - NOT google.com
    /paypa1\.com/,           // paypal with number 1 - NOT paypal.com
    /amaz0n\.com/,           // amazon with 0 - NOT amazon.com
    /faceb[o0]{2}k\.com/,    // facebo0k.com - NOT facebook.com
    /micros0ft\.com/,        // microsoft with 0
    /app1e\.com/,            // apple with 1
  ];

  // IMPORTANT: Don't match legitimate domains
  const legitimateDomains = [
    'google.com', 'paypal.com', 'amazon.com',
    'facebook.com', 'microsoft.com', 'apple.com'
  ];

  // If it's a legitimate domain (with any subdomain), it's NOT typosquatting
  if (legitimateDomains.some(domain => hostname === domain || hostname.endsWith('.' + domain))) {
    return false;
  }

  return typoPatterns.some(pattern => pattern.test(hostname));
}

function detectRiskyTld(hostname) {
  const riskyTlds = [
    // Free TLDs heavily abused for phishing
    '.tk', '.ml', '.ga', '.cf', '.gq',

    // New generic TLDs often used for scams
    '.xyz', '.top', '.work', '.click', '.link', '.online', '.site', '.live',
    '.space', '.tech', '.store', '.club', '.fun', '.icu',

    // Confusing/dangerous TLDs
    '.zip', '.mov', '.app',

    // Financial scam TLDs
    '.loan', '.win', '.bid', '.trade', '.download',

    // Adult/gambling often used for malware
    '.xxx', '.webcam', '.cam', '.sexy'
  ];

  return riskyTlds.some(tld => hostname.endsWith(tld));
}

function detectSuspiciousKeywords(fullUrl) {
  const keywords = [
    'verify', 'urgent', 'suspended', 'limited', 'secure',
    'account', 'login', 'signin', 'update', 'confirm',
    'validate', 'alert', 'warning', 'billing', 'payment',
  ];

  const urlLower = fullUrl.toLowerCase();
  const found = [];

  for (const keyword of keywords) {
    if (urlLower.includes(keyword)) {
      found.push(keyword);
    }
  }

  return found;
}

// Advanced threat detection (comprehensive)
function detectAdvancedThreats(urlObj, hostname, fullUrl) {
  const threats = {
    usesIpAddress: false,
    hasHomoglyphs: false,
    isUrlShortener: false,
    isFreeHostingService: false,
    hasSuspiciousPort: false,
    hasExcessiveSubdomains: false,
    hasNumberSubstitution: false,
    hasSuspiciousPathPatterns: false,
    combinedWeakSignals: 0
  };

  // 1. IP Address instead of domain (HIGH RISK)
  const ipPattern = /^(\d{1,3}\.){3}\d{1,3}$/;
  if (ipPattern.test(hostname)) {
    threats.usesIpAddress = true;
    threats.combinedWeakSignals++;
  }

  // 2. Homoglyph/Unicode attacks (lookalike characters)
  const homoglyphPatterns = [
    /[а-яА-Я]/,  // Cyrillic characters
    /[α-ωΑ-Ω]/,  // Greek characters
    /[\u0080-\u024F]/,  // Latin Extended
    /[\u1E00-\u1EFF]/,  // Latin Extended Additional
  ];
  if (homoglyphPatterns.some(pattern => pattern.test(hostname))) {
    threats.hasHomoglyphs = true;
    threats.combinedWeakSignals++;
  }

  // 3. URL Shorteners (often hide malicious links)
  const urlShorteners = [
    'bit.ly', 'tinyurl.com', 'goo.gl', 't.co', 'ow.ly', 'is.gd',
    'buff.ly', 'adf.ly', 'bit.do', 'short.link', 'tiny.cc',
    'rb.gy', 'cutt.ly', 'shorturl.at', 't.ly', 'cli.gs'
  ];
  if (urlShorteners.some(shortener => hostname.includes(shortener))) {
    threats.isUrlShortener = true;
    threats.combinedWeakSignals++;
  }

  // 4. Free Hosting Services (HEAVILY abused for phishing)
  const freeHostingPatterns = [
    '.pages.dev',        // Cloudflare Pages - HEAVILY abused
    '.vercel.app',       // Vercel - frequently abused
    '.netlify.app',      // Netlify - frequently abused
    '.herokuapp.com',    // Heroku - frequently abused
    '.github.io',        // GitHub Pages - occasionally abused
    '.gitlab.io',        // GitLab Pages - occasionally abused
    '.repl.co',          // Replit - frequently abused
    '.glitch.me',        // Glitch - frequently abused
    '.web.app',          // Firebase - frequently abused
    '.firebaseapp.com',  // Firebase - frequently abused
    '.azurewebsites.net', // Azure - occasionally abused
    '.cloudfront.net',   // CloudFront - occasionally abused
    '.s3.amazonaws.com', // S3 - occasionally abused
    '.wixsite.com',      // Wix - occasionally abused
    '.wordpress.com',    // WordPress - occasionally abused (not .org)
    '.blogspot.com',     // Blogger - occasionally abused
    '.weebly.com',       // Weebly - occasionally abused
    '.000webhostapp.com', // Free hosting - heavily abused
    '.freehosting.com',  // Free hosting - heavily abused
    '.rf.gd',            // Free hosting - heavily abused
    '.surge.sh',         // Surge - occasionally abused
    '.now.sh',           // Zeit Now - occasionally abused
    '.onrender.com'      // Render - occasionally abused
  ];

  // Check if hostname ends with any free hosting pattern
  if (freeHostingPatterns.some(pattern => hostname.endsWith(pattern))) {
    threats.isFreeHostingService = true;
    threats.combinedWeakSignals++;
  }

  // 5. Suspicious ports (not 80/443)
  const port = urlObj.port;
  if (port && port !== '80' && port !== '443' && port !== '') {
    threats.hasSuspiciousPort = true;
    threats.combinedWeakSignals++;
  }

  // 6. Excessive subdomains (>4 levels)
  const parts = hostname.split('.');
  if (parts.length > 5) {  // More than domain.tld + 3 subdomains
    threats.hasExcessiveSubdomains = true;
    threats.combinedWeakSignals++;
  }

  // 7. Number substitution patterns (g00gle, micr0soft, etc.)
  // IMPORTANT: Don't flag legitimate domains with natural letter repetitions
  const legitimateDomainsForSubstitution = [
    'google.com', 'yahoo.com', 'zoom.com', 'booking.com', 'paypal.com',
    'facebook.com', 'messenger.com', 'apple.com', 'support.com', 'reddit.com',
    'twitter.com', 'linkedin.com', 'microsoft.com', 'amazon.com'
  ];

  // If it's a legitimate domain (with any subdomain), skip number substitution check
  const isLegitimateForSubstitution = legitimateDomainsForSubstitution.some(domain =>
    hostname === domain || hostname.endsWith('.' + domain)
  );

  if (!isLegitimateForSubstitution) {
    const numberSubstitutions = [
      /[o0]{2,}/gi,  // Multiple o's or 0's
      /[il1]{2,}/gi,  // Multiple i/l/1's
      /[sz2]{2,}/gi,  // s/z/2 confusion
      /[o0]o/gi,  // 0o or o0 patterns
      /[il1]l/gi,  // 1l or l1 patterns
    ];
    if (numberSubstitutions.some(pattern => pattern.test(hostname))) {
      threats.hasNumberSubstitution = true;
      threats.combinedWeakSignals++;
    }
  }

  // 8. Suspicious path patterns
  const suspiciousPathPatterns = [
    /\/login[\/\?]/i,
    /\/signin[\/\?]/i,
    /\/account[\/\?]/i,
    /\/verify[\/\?]/i,
    /\/secure[\/\?]/i,
    /\/update[\/\?]/i,
    /\/confirm[\/\?]/i,
    /\/banking[\/\?]/i,
    /\/(wallet|billing|payment)[\/\?]/i,
    /\.php\?[^=]+=.*pass/i,  // .php?id=password patterns
    /\?redirect=/i,  // Redirect parameters
    /\?return=/i,
    /\?next=/i,
    /data:text\/html/i,  // Data URIs
  ];
  if (suspiciousPathPatterns.some(pattern => pattern.test(fullUrl))) {
    threats.hasSuspiciousPathPatterns = true;
    threats.combinedWeakSignals++;
  }

  return threats;
}

// Domain age estimation
function estimateDomainAge(hostname) {
  const knownOldDomains = [
    'google.com', 'youtube.com', 'facebook.com', 'amazon.com',
    'microsoft.com', 'apple.com', 'twitter.com', 'linkedin.com',
    'github.com', 'stackoverflow.com', 'wikipedia.org', 'reddit.com',
    'netflix.com', 'spotify.com', 'dropbox.com', 'zoom.us',
  ];

  const isKnownOld = knownOldDomains.some(domain =>
    hostname === domain || hostname.endsWith('.' + domain)
  );

  if (isKnownOld) {
    return {
      creationDate: null,
      domainAgeDays: 3650,
      isVeryNew: false,
      isNew: false,
      isYoung: false,
      whoisPrivacyEnabled: false,
    };
  }

  return {
    creationDate: null,
    domainAgeDays: null,
    isVeryNew: false,
    isNew: false,
    isYoung: false,
    whoisPrivacyEnabled: undefined,
  };
}

// Security analysis
function analyzeSecurityFeatures(urlObj) {
  const usesHttps = urlObj.protocol === 'https:';

  return {
    usesHttps,
    hasValidCert: usesHttps ? true : undefined,
    certIssuer: undefined,
    certExpiryDays: undefined,
    certDomainMismatch: undefined,
  };
}

// Network analysis
function analyzeNetwork(hostname) {
  const isIP = /^[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}$/.test(hostname);

  return {
    ipAddress: isIP ? hostname : undefined,
    ipCountry: undefined,
    asnName: undefined,
    isHighAbuseAsn: undefined,
  };
}

// Merge Web Risk data
function mergeWebRiskData(webRiskData) {
  if (!webRiskData) {
    return {
      webRiskFlagged: false,
      webRiskThreatTypes: [],
    };
  }

  const threats = webRiskData.threats || webRiskData.threatTypes || [];

  return {
    webRiskFlagged: threats.length > 0,
    webRiskThreatTypes: threats,
  };
}

// Default features on error
function createDefaultFeatures(url) {
  return {
    url,
    hostname: '',
    registeredDomain: '',
    tld: '',
    subdomainDepth: 0,
    hostnameLength: 0,
    digitCount: 0,
    hyphenCount: 0,
    hasSuspiciousSubdomain: false,
    looksLikeBrand: null,
    isTypoDomain: false,
    isPunycode: false,
    isRiskyTld: false,
    suspiciousKeywords: [],
    usesIpAddress: false,
    hasHomoglyphs: false,
    isUrlShortener: false,
    isFreeHostingService: false,
    hasSuspiciousPort: false,
    hasExcessiveSubdomains: false,
    hasNumberSubstitution: false,
    hasSuspiciousPathPatterns: false,
    combinedWeakSignals: 0,
    creationDate: null,
    domainAgeDays: null,
    isVeryNew: false,
    isNew: false,
    isYoung: false,
    whoisPrivacyEnabled: undefined,
    usesHttps: false,
    hasValidCert: undefined,
    certIssuer: null,
    certExpiryDays: null,
    certDomainMismatch: undefined,
    ipAddress: null,
    ipCountry: null,
    asnName: null,
    isHighAbuseAsn: undefined,
    webRiskFlagged: false,
    webRiskThreatTypes: [],
  };
}

// Export for use in Chrome extension and Node.js
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { buildDomainFeatures };
}

// Also support global access for Chrome extension service worker
if (typeof self !== 'undefined') {
  self.buildDomainFeatures = buildDomainFeatures;
}
