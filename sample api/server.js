const express = require('express');
const cors = require('cors');
const https = require('https');
const tls = require('tls');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// In-memory storage for analysis history
let analysisHistory = [];

// ═══════════════════════════════════════════════════════════════════════════
// SAFE WEBSITES DATABASE (Whitelist)
// If domain is in this list, skip all checks and mark as SAFE
// ═══════════════════════════════════════════════════════════════════════════

const SAFE_WEBSITES_DATABASE = [
    // User's verified safe domains
    'zulily.com',
    'www.zulily.com',
    'shoesale.com',
    'www.shoesale.com',
    'cashifygcmart.com',
    'wardira.com',
    'meetmilfy.com',
    'freesale.com',
    'www.freesale.com',
    'wickedlyhydrated.gravanto.com',
    'gravanto.com',
    'biancakatehouston.com',
    'stylevoostore.com',
];

// Function to check if domain is in safe database
function isInSafeDatabase(hostname) {
    const hostLower = hostname.toLowerCase().replace(/^www\./, '');

    for (const safeDomain of SAFE_WEBSITES_DATABASE) {
        const safeLower = safeDomain.toLowerCase().replace(/^www\./, '');

        // Exact match
        if (hostLower === safeLower) {
            return true;
        }

        // Subdomain match (e.g., shop.zulily.com matches zulily.com)
        if (hostLower.endsWith('.' + safeLower)) {
            return true;
        }
    }

    return false;
}

// ═══════════════════════════════════════════════════════════════════════════
// SCORING CONSTANTS (same as extension)
// ═══════════════════════════════════════════════════════════════════════════

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
    FREE_HOSTING_SERVICE: 20,
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
    INVALID_SSL_CERT: 15,
    EXPIRED_SSL_CERT: 20,
};

const LOW_RISK_SCORES = {
    EXCESSIVE_SUBDOMAIN_DEPTH: 5,
    VERY_LONG_HOSTNAME: 5,
    MANY_DIGITS: 5,
    MANY_HYPHENS: 5,
    SUSPICIOUS_KEYWORDS: 5,
    COMBINED_WEAK_SIGNALS_BONUS: 15,
};

const SCORE_THRESHOLDS = {
    DANGEROUS: 70,
    SUSPICIOUS: 25,
};

const FEATURE_THRESHOLDS = {
    SUBDOMAIN_DEPTH: 4,
    HOSTNAME_LENGTH: 50,
    DIGIT_COUNT: 3,
    HYPHEN_COUNT: 3,
    MIN_SUSPICIOUS_KEYWORDS: 2,
    NEW_DOMAIN_WHOIS_PRIVACY_DAYS: 30,
};

// ═══════════════════════════════════════════════════════════════════════════
// DOMAIN FEATURE EXTRACTION (from buildDomainFeatures.js)
// ═══════════════════════════════════════════════════════════════════════════

function buildDomainFeatures(url) {
    try {
        const urlObj = new URL(url);
        const hostname = urlObj.hostname.toLowerCase();

        const basicInfo = extractBasicInfo(urlObj, hostname);
        const structure = analyzeStructure(hostname);
        const patterns = detectPatterns(hostname, url);
        const advanced = detectAdvancedThreats(urlObj, hostname, url);
        const security = analyzeSecurityFeatures(urlObj);

        return {
            url,
            hostname,
            registeredDomain: basicInfo.registeredDomain,
            tld: basicInfo.tld,
            subdomainDepth: structure.subdomainDepth,
            hostnameLength: hostname.length,
            digitCount: structure.digitCount,
            hyphenCount: structure.hyphenCount,
            hasSuspiciousSubdomain: structure.hasSuspiciousSubdomain,
            looksLikeBrand: patterns.looksLikeBrand,
            isTypoDomain: patterns.isTypoDomain,
            isPunycode: patterns.isPunycode,
            isRiskyTld: patterns.isRiskyTld,
            suspiciousKeywords: patterns.suspiciousKeywords,
            usesIpAddress: advanced.usesIpAddress,
            hasHomoglyphs: advanced.hasHomoglyphs,
            isUrlShortener: advanced.isUrlShortener,
            isFreeHostingService: advanced.isFreeHostingService,
            hasSuspiciousPort: advanced.hasSuspiciousPort,
            hasExcessiveSubdomains: advanced.hasExcessiveSubdomains,
            hasNumberSubstitution: advanced.hasNumberSubstitution,
            hasSuspiciousPathPatterns: advanced.hasSuspiciousPathPatterns,
            combinedWeakSignals: advanced.combinedWeakSignals,
            usesHttps: security.usesHttps,
            // These will be filled by additional checks
            domainAgeDays: null,
            isVeryNew: false,
            isNew: false,
            isYoung: false,
            creationDate: null,
            whoisPrivacyEnabled: false,
            sslValid: null,
            sslExpired: null,
            sslDaysUntilExpiry: null,
            certDomainMismatch: null,
        };
    } catch (error) {
        console.error('Error extracting domain features:', error);
        return createDefaultFeatures(url);
    }
}

function extractBasicInfo(urlObj, hostname) {
    const parts = hostname.split('.');
    const tld = parts[parts.length - 1];
    let registeredDomain = hostname;
    if (parts.length >= 2) {
        registeredDomain = `${parts[parts.length - 2]}.${parts[parts.length - 1]}`;
    }
    return { registeredDomain, tld };
}

function analyzeStructure(hostname) {
    const parts = hostname.split('.');
    const subdomainDepth = Math.max(0, parts.length - 2);
    const digitCount = (hostname.match(/\d/g) || []).length;
    const hyphenCount = (hostname.match(/-/g) || []).length;
    const hasSuspiciousSubdomain = detectSuspiciousSubdomain(hostname);
    return { subdomainDepth, digitCount, hyphenCount, hasSuspiciousSubdomain };
}

function detectSuspiciousSubdomain(hostname) {
    const suspiciousPatterns = [
        /^ww\d+\./,
        /^www\d+\./,
        /^login[-.]/,
        /^account[-.]/,
        /^secure[-.]/,
        /^verify[-.]/,
        /^update[-.]/,
        /^signin[-.]/,
        /^auth[-.]/,
        /^pay[-.]/,
        /^billing[-.]/,
        /^support[-.]/,
        /^service[-.]/,
        /^help[-.]/,
        /^client[-.]/
    ];
    return suspiciousPatterns.some(pattern => pattern.test(hostname));
}

function detectPatterns(hostname, fullUrl) {
    return {
        looksLikeBrand: detectBrandImpersonation(hostname),
        isTypoDomain: detectTyposquatting(hostname),
        isPunycode: hostname.startsWith('xn--'),
        isRiskyTld: detectRiskyTld(hostname),
        suspiciousKeywords: detectSuspiciousKeywords(fullUrl),
    };
}

function matchesAsWord(hostname, pattern) {
    if (pattern.includes('-')) {
        return hostname.includes(pattern);
    }
    const segments = hostname.split(/[.\-_]/);
    for (const segment of segments) {
        if (segment === pattern) return true;
        if (segment.startsWith(pattern) && segment.length <= pattern.length + 6) return true;
        if (segment.endsWith(pattern) && segment.length <= pattern.length + 6) return true;
    }
    if (/[0-9]/.test(pattern) && hostname.includes(pattern)) return true;
    return false;
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
            legitDomains: ['google.com', 'gmail.com', 'google.co', 'google.ca', 'google.de', 'google.co.uk']
        },
        {
            name: 'PayPal',
            patterns: ['paypal', 'paypai', 'paypa1', 'pay-pal', 'paypa11'],
            legitDomains: ['paypal.com', 'paypal.me']
        },
        {
            name: 'Amazon',
            patterns: ['amazon', 'amaz0n', 'arnazon', 'amazom'],
            legitDomains: ['amazon.com', 'amazon.co.uk', 'amazon.ca', 'amazon.de', 'amazon.in', 'amazonaws.com']
        },
        {
            name: 'Microsoft',
            patterns: ['microsoft', 'micros0ft', 'microsft'],
            legitDomains: ['microsoft.com', 'outlook.com', 'hotmail.com', 'live.com', 'azure.com', 'office.com']
        },
        {
            name: 'Facebook/Meta',
            patterns: ['facebook', 'facebo0k', 'faceb00k'],
            legitDomains: ['facebook.com', 'fb.com', 'meta.com', 'messenger.com', 'instagram.com']
        },
        {
            name: 'Netflix',
            patterns: ['netflix', 'netfl1x', 'netfix'],
            legitDomains: ['netflix.com']
        },
        {
            name: 'WhatsApp',
            patterns: ['whatsapp', 'whatsap', 'whats-app'],
            legitDomains: ['whatsapp.com', 'whatsapp.net']
        },
        {
            name: 'Cryptocurrency',
            patterns: ['metamask', 'coinbase', 'binance'],
            legitDomains: ['metamask.io', 'coinbase.com', 'binance.com', 'binance.us']
        },
        {
            name: 'Banking',
            patterns: ['chase', 'wellsfargo', 'bankofamerica', 'citibank'],
            legitDomains: ['chase.com', 'wellsfargo.com', 'bankofamerica.com', 'citi.com']
        }
    ];

    const hostLower = hostname.toLowerCase();

    for (const brand of brands) {
        const isLegit = brand.legitDomains.some(legitDomain => {
            return hostLower === legitDomain || hostLower.endsWith('.' + legitDomain);
        });
        if (isLegit) continue;

        for (const pattern of brand.patterns) {
            if (matchesAsWord(hostLower, pattern)) {
                return brand.name;
            }
        }
    }
    return null;
}

function detectTyposquatting(hostname) {
    const typoPatterns = [
        /g[o]{3,}gle\.com/,
        /g0[o0]gle\.com/,
        /paypa1\.com/,
        /amaz0n\.com/,
        /faceb[o0]{2}k\.com/,
        /micros0ft\.com/,
        /app1e\.com/,
    ];
    const legitimateDomains = [
        'google.com', 'paypal.com', 'amazon.com',
        'facebook.com', 'microsoft.com', 'apple.com'
    ];
    if (legitimateDomains.some(domain => hostname === domain || hostname.endsWith('.' + domain))) {
        return false;
    }
    return typoPatterns.some(pattern => pattern.test(hostname));
}

function detectRiskyTld(hostname) {
    const riskyTlds = [
        '.tk', '.ml', '.ga', '.cf', '.gq',
        '.xyz', '.top', '.work', '.click', '.link', '.online', '.site', '.live',
        '.space', '.tech', '.store', '.club', '.fun', '.icu',
        '.zip', '.mov', '.app',
        '.loan', '.win', '.bid', '.trade', '.download',
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
        if (urlLower.includes(keyword)) found.push(keyword);
    }
    return found;
}

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

    // IP Address
    const ipPattern = /^(\d{1,3}\.){3}\d{1,3}$/;
    if (ipPattern.test(hostname)) {
        threats.usesIpAddress = true;
        threats.combinedWeakSignals++;
    }

    // Homoglyphs
    const homoglyphPatterns = [
        /[а-яА-ЯёЁ]/,
        /[αβγδεζηθικλμνξοπρστυφχψωΑΒΓΔΕΖΗΘΙΚΛΜΝΞΟΠΡΣΤΥΦΧΨΩ]/,
        /[\u0430\u0435\u043E\u0440\u0441\u0443\u0445]/,
    ];
    const domainWithoutTld = hostname.split('.').slice(0, -1).join('.');
    if (homoglyphPatterns.some(pattern => pattern.test(domainWithoutTld))) {
        threats.hasHomoglyphs = true;
        threats.combinedWeakSignals++;
    }

    // URL Shorteners
    const urlShorteners = [
        'bit.ly', 'tinyurl.com', 'goo.gl', 't.co', 'ow.ly', 'is.gd',
        'buff.ly', 'adf.ly', 'bit.do', 'short.link', 'tiny.cc',
        'rb.gy', 'cutt.ly', 'shorturl.at', 't.ly', 'cli.gs'
    ];
    if (urlShorteners.some(shortener => hostname.includes(shortener))) {
        threats.isUrlShortener = true;
        threats.combinedWeakSignals++;
    }

    // Free Hosting Services
    const freeHostingPatterns = [
        '.pages.dev', '.vercel.app', '.netlify.app', '.herokuapp.com',
        '.github.io', '.gitlab.io', '.repl.co', '.glitch.me',
        '.web.app', '.firebaseapp.com', '.azurewebsites.net',
        '.cloudfront.net', '.s3.amazonaws.com', '.wixsite.com',
        '.wordpress.com', '.blogspot.com', '.weebly.com',
        '.000webhostapp.com', '.freehosting.com', '.rf.gd',
        '.surge.sh', '.now.sh', '.onrender.com'
    ];
    if (freeHostingPatterns.some(pattern => hostname.endsWith(pattern))) {
        threats.isFreeHostingService = true;
        threats.combinedWeakSignals++;
    }

    // Suspicious ports
    const port = urlObj.port;
    if (port && port !== '80' && port !== '443' && port !== '') {
        threats.hasSuspiciousPort = true;
        threats.combinedWeakSignals++;
    }

    // Excessive subdomains
    const parts = hostname.split('.');
    if (parts.length > 5) {
        threats.hasExcessiveSubdomains = true;
        threats.combinedWeakSignals++;
    }

    // Number substitution
    const legitimateDomains = [
        'google.com', 'yahoo.com', 'zoom.com', 'booking.com', 'paypal.com',
        'facebook.com', 'apple.com', 'microsoft.com', 'amazon.com'
    ];
    const isLegitimate = legitimateDomains.some(domain =>
        hostname === domain || hostname.endsWith('.' + domain)
    );
    if (!isLegitimate) {
        const numberSubstitutions = [
            /[o0]{2,}/gi, /[il1]{2,}/gi, /[sz2]{2,}/gi,
            /[o0]o/gi, /[il1]l/gi,
        ];
        if (numberSubstitutions.some(pattern => pattern.test(hostname))) {
            threats.hasNumberSubstitution = true;
            threats.combinedWeakSignals++;
        }
    }

    // Suspicious path patterns
    const suspiciousPathPatterns = [
        /\/login[\/\?]/i, /\/signin[\/\?]/i, /\/account[\/\?]/i,
        /\/verify[\/\?]/i, /\/secure[\/\?]/i, /\/update[\/\?]/i,
        /\/confirm[\/\?]/i, /\/banking[\/\?]/i,
        /\/(wallet|billing|payment)[\/\?]/i,
        /\.php\?[^=]+=.*pass/i,
        /\?redirect=/i, /\?return=/i, /\?next=/i,
    ];
    if (suspiciousPathPatterns.some(pattern => pattern.test(fullUrl))) {
        threats.hasSuspiciousPathPatterns = true;
        threats.combinedWeakSignals++;
    }

    return threats;
}

function analyzeSecurityFeatures(urlObj) {
    return {
        usesHttps: urlObj.protocol === 'https:',
    };
}

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
        usesHttps: false,
        domainAgeDays: null,
        isVeryNew: false,
        isNew: false,
        isYoung: false,
        creationDate: null,
        whoisPrivacyEnabled: false,
        sslValid: null,
        sslExpired: null,
        sslDaysUntilExpiry: null,
        certDomainMismatch: null,
    };
}

// ═══════════════════════════════════════════════════════════════════════════
// DOMAIN AGE CHECK (WHOIS via free API)
// ═══════════════════════════════════════════════════════════════════════════

async function getDomainAge(hostname) {
    return new Promise((resolve) => {
        // Use a free WHOIS API
        const apiUrl = `https://api.api-ninjas.com/v1/whois?domain=${hostname}`;

        const req = https.get(apiUrl, {
            headers: {
                'X-Api-Key': 'demo' // Free tier / demo key
            },
            timeout: 5000
        }, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    const json = JSON.parse(data);
                    if (json.creation_date) {
                        const creationDate = new Date(json.creation_date);
                        const now = new Date();
                        const ageDays = Math.floor((now - creationDate) / (1000 * 60 * 60 * 24));

                        resolve({
                            domainAgeDays: ageDays,
                            creationDate: json.creation_date,
                            isVeryNew: ageDays < 7,
                            isNew: ageDays < 30,
                            isYoung: ageDays < 365,
                            whoisPrivacyEnabled: false
                        });
                    } else {
                        resolve(null);
                    }
                } catch (e) {
                    resolve(null);
                }
            });
        });

        req.on('error', () => resolve(null));
        req.on('timeout', () => {
            req.destroy();
            resolve(null);
        });
    });
}

// Fallback: Known old domains (for demo when API fails)
function getKnownDomainAge(hostname) {
    const knownOldDomains = [
        'google.com', 'youtube.com', 'facebook.com', 'amazon.com',
        'microsoft.com', 'apple.com', 'twitter.com', 'linkedin.com',
        'github.com', 'stackoverflow.com', 'wikipedia.org', 'reddit.com',
        'netflix.com', 'spotify.com', 'dropbox.com', 'zoom.us',
        'paypal.com', 'ebay.com', 'instagram.com', 'whatsapp.com'
    ];

    const isKnownOld = knownOldDomains.some(domain =>
        hostname === domain || hostname.endsWith('.' + domain)
    );

    if (isKnownOld) {
        return {
            domainAgeDays: 3650,
            creationDate: '2010-01-01',
            isVeryNew: false,
            isNew: false,
            isYoung: false,
            whoisPrivacyEnabled: false
        };
    }
    return null;
}

// ═══════════════════════════════════════════════════════════════════════════
// SSL CERTIFICATE CHECK
// ═══════════════════════════════════════════════════════════════════════════

async function checkSSLCertificate(hostname) {
    return new Promise((resolve) => {
        const options = {
            host: hostname,
            port: 443,
            servername: hostname,
            timeout: 5000,
            rejectUnauthorized: false // Allow checking invalid certs
        };

        const socket = tls.connect(options, () => {
            try {
                const cert = socket.getPeerCertificate();
                const authorized = socket.authorized;

                if (cert && cert.valid_to) {
                    const expiryDate = new Date(cert.valid_to);
                    const now = new Date();
                    const daysUntilExpiry = Math.floor((expiryDate - now) / (1000 * 60 * 60 * 24));

                    // Check if cert matches domain
                    let certDomainMismatch = true;
                    if (cert.subject && cert.subject.CN) {
                        const cn = cert.subject.CN.toLowerCase();
                        if (cn === hostname || hostname.endsWith(cn.replace('*.', ''))) {
                            certDomainMismatch = false;
                        }
                    }
                    if (cert.subjectaltname) {
                        const altNames = cert.subjectaltname.split(', ').map(n => n.replace('DNS:', '').toLowerCase());
                        for (const alt of altNames) {
                            if (alt === hostname || (alt.startsWith('*.') && hostname.endsWith(alt.slice(1)))) {
                                certDomainMismatch = false;
                                break;
                            }
                        }
                    }

                    socket.end();
                    resolve({
                        sslValid: authorized,
                        sslExpired: daysUntilExpiry < 0,
                        sslDaysUntilExpiry: daysUntilExpiry,
                        certDomainMismatch: certDomainMismatch,
                        certIssuer: cert.issuer ? cert.issuer.O : null
                    });
                } else {
                    socket.end();
                    resolve(null);
                }
            } catch (e) {
                socket.end();
                resolve(null);
            }
        });

        socket.on('error', () => {
            resolve({ sslValid: false, sslExpired: null, sslDaysUntilExpiry: null, certDomainMismatch: null });
        });

        socket.on('timeout', () => {
            socket.destroy();
            resolve(null);
        });
    });
}

// ═══════════════════════════════════════════════════════════════════════════
// GOOGLE WEB RISK API CHECK
// ═══════════════════════════════════════════════════════════════════════════

// Known malicious/phishing domains for demo (simulated Web Risk database)
const KNOWN_MALICIOUS_DOMAINS = [
    // Phishing examples
    'secure-paypal-verify.com',
    'amazon-security-alert.com',
    'apple-id-locked.com',
    'microsoft-account-verify.com',
    'netflix-billing-update.com',
    'google-security-check.com',
    // Malware examples
    'download-free-software.xyz',
    'crack-software-free.top',
    'free-antivirus-scan.click',
    // Social engineering
    'you-won-prize.com',
    'claim-your-reward.xyz',
    'urgent-action-required.com',
];

// Patterns that indicate malicious intent (for demo simulation)
const MALICIOUS_PATTERNS = [
    /paypal.*verify/i,
    /amazon.*security/i,
    /apple.*locked/i,
    /microsoft.*verify/i,
    /google.*security/i,
    /bank.*update/i,
    /account.*suspended/i,
    /verify.*identity/i,
    /urgent.*action/i,
    /claim.*reward/i,
    /won.*prize/i,
    /free.*download.*crack/i,
];

async function checkWebRisk(url, hostname) {
    return new Promise((resolve) => {
        console.log('   🌐 Checking Web Risk database...');

        // Simulate API latency
        setTimeout(() => {
            const threats = [];
            const urlLower = url.toLowerCase();
            const hostLower = hostname.toLowerCase();

            // Check against known malicious domains
            for (const domain of KNOWN_MALICIOUS_DOMAINS) {
                if (hostLower.includes(domain) || hostLower === domain) {
                    threats.push('SOCIAL_ENGINEERING');
                    break;
                }
            }

            // Check against malicious patterns
            for (const pattern of MALICIOUS_PATTERNS) {
                if (pattern.test(urlLower) || pattern.test(hostLower)) {
                    if (!threats.includes('SOCIAL_ENGINEERING')) {
                        threats.push('SOCIAL_ENGINEERING');
                    }
                    break;
                }
            }

            // Additional threat type detection
            if (/malware|virus|trojan|crack|keygen/i.test(urlLower)) {
                threats.push('MALWARE');
            }

            if (/phish|spoof|fake/i.test(urlLower)) {
                threats.push('PHISHING');
            }

            if (threats.length > 0) {
                console.log(`   🚨 Web Risk threats found: ${threats.join(', ')}`);
                resolve({
                    webRiskFlagged: true,
                    webRiskThreatTypes: threats,
                    source: 'simulated-web-risk-api'
                });
            } else {
                console.log('   ✅ No Web Risk threats found');
                resolve({
                    webRiskFlagged: false,
                    webRiskThreatTypes: [],
                    source: 'simulated-web-risk-api'
                });
            }
        }, 100); // Simulate 100ms API latency
    });
}

// ═══════════════════════════════════════════════════════════════════════════
// RISK SCORING ENGINE (from riskScoring.js)
// ═══════════════════════════════════════════════════════════════════════════

function buildRiskScore(features) {
    let score = 0;
    const reasons = [];

    score += evaluateHighRiskFlags(features, reasons);
    score += evaluateMediumRiskFlags(features, reasons);
    score += evaluateLowRiskFlags(features, reasons);
    score += evaluateSmartCombinations(features, reasons);

    score = Math.min(score, 100);
    const label = determineRiskLabel(score);

    return { score, label, reasons };
}

function evaluateHighRiskFlags(features, reasons) {
    let score = 0;

    // Web Risk API flagged (highest priority)
    if (features.webRiskFlagged) {
        score += HIGH_RISK_SCORES.WEB_RISK_FLAGGED;
        if (features.webRiskThreatTypes && features.webRiskThreatTypes.length > 0) {
            reasons.push(`🚨 Flagged by Web Risk API: ${features.webRiskThreatTypes.join(', ')}`);
        } else {
            reasons.push('🚨 Flagged by Web Risk API as potentially dangerous');
        }
    }

    if (features.isVeryNew) {
        score += HIGH_RISK_SCORES.VERY_NEW_DOMAIN;
        reasons.push('⚠️ Domain is very new (< 7 days old)');
    }

    if (features.looksLikeBrand !== null) {
        score += HIGH_RISK_SCORES.BRAND_IMPERSONATION;
        reasons.push(`⚠️ Domain appears to impersonate: ${features.looksLikeBrand}`);
    }

    if (features.isTypoDomain) {
        score += HIGH_RISK_SCORES.TYPO_DOMAIN;
        reasons.push('⚠️ Domain contains typographic trick (typosquatting)');
    }

    if (features.certDomainMismatch === true) {
        score += HIGH_RISK_SCORES.CERT_DOMAIN_MISMATCH;
        reasons.push('⚠️ SSL certificate does not match domain name');
    }

    if (features.usesIpAddress) {
        score += HIGH_RISK_SCORES.USES_IP_ADDRESS;
        reasons.push('🚨 URL uses IP address instead of domain name');
    }

    if (features.hasHomoglyphs) {
        score += HIGH_RISK_SCORES.HOMOGLYPH_ATTACK;
        reasons.push('🚨 Domain uses lookalike characters (homoglyph attack)');
    }

    return score;
}

function evaluateMediumRiskFlags(features, reasons) {
    let score = 0;

    if (features.isRiskyTld) {
        score += MEDIUM_RISK_SCORES.RISKY_TLD;
        reasons.push(`⚠️ TLD (.${features.tld}) is commonly abused for scams`);
    }

    if (features.isPunycode) {
        score += MEDIUM_RISK_SCORES.PUNYCODE;
        reasons.push('⚠️ Domain uses Punycode (IDN homoglyphs)');
    }

    if (features.hasSuspiciousSubdomain) {
        score += MEDIUM_RISK_SCORES.SUSPICIOUS_SUBDOMAIN;
        reasons.push('⚠️ Suspicious subdomain pattern detected');
    }

    if (features.isFreeHostingService) {
        score += MEDIUM_RISK_SCORES.FREE_HOSTING_SERVICE;
        reasons.push('⚠️ Free hosting service (frequently abused for phishing)');
    }

    if (!features.usesHttps) {
        score += MEDIUM_RISK_SCORES.NO_HTTPS;
        reasons.push('⚠️ Site does not use HTTPS');
    }

    if (features.isUrlShortener) {
        score += MEDIUM_RISK_SCORES.URL_SHORTENER;
        reasons.push('⚠️ URL shortener detected (often hides malicious links)');
    }

    if (features.hasNumberSubstitution) {
        score += MEDIUM_RISK_SCORES.NUMBER_SUBSTITUTION;
        reasons.push('⚠️ Suspicious character substitution (e.g., g00gle)');
    }

    if (features.hasSuspiciousPort) {
        score += MEDIUM_RISK_SCORES.SUSPICIOUS_PORT;
        reasons.push('⚠️ Non-standard port detected');
    }

    if (features.hasExcessiveSubdomains) {
        score += MEDIUM_RISK_SCORES.EXCESSIVE_SUBDOMAINS;
        reasons.push('⚠️ Excessively long subdomain chain');
    }

    if (features.hasSuspiciousPathPatterns) {
        score += MEDIUM_RISK_SCORES.SUSPICIOUS_PATH_PATTERNS;
        reasons.push('⚠️ URL contains suspicious login/payment patterns');
    }

    if (features.sslExpired === true) {
        score += MEDIUM_RISK_SCORES.EXPIRED_SSL_CERT;
        reasons.push('🚨 SSL certificate is expired');
    } else if (features.sslValid === false) {
        score += MEDIUM_RISK_SCORES.INVALID_SSL_CERT;
        reasons.push('⚠️ SSL certificate is invalid');
    }

    if (features.isNew && !features.isVeryNew) {
        score += 15;
        reasons.push('⚠️ Domain is new (< 30 days old)');
    }

    return score;
}

function evaluateLowRiskFlags(features, reasons) {
    let score = 0;

    if (features.subdomainDepth >= FEATURE_THRESHOLDS.SUBDOMAIN_DEPTH) {
        score += LOW_RISK_SCORES.EXCESSIVE_SUBDOMAIN_DEPTH;
        reasons.push('ℹ️ Deep subdomain chain');
    }

    if (features.hostnameLength > FEATURE_THRESHOLDS.HOSTNAME_LENGTH) {
        score += LOW_RISK_SCORES.VERY_LONG_HOSTNAME;
        reasons.push('ℹ️ Very long domain name');
    }

    if (features.digitCount > FEATURE_THRESHOLDS.DIGIT_COUNT) {
        score += LOW_RISK_SCORES.MANY_DIGITS;
        reasons.push(`ℹ️ Domain has many digits (${features.digitCount})`);
    }

    if (features.hyphenCount > FEATURE_THRESHOLDS.HYPHEN_COUNT) {
        score += LOW_RISK_SCORES.MANY_HYPHENS;
        reasons.push(`ℹ️ Domain has many hyphens (${features.hyphenCount})`);
    }

    if (features.suspiciousKeywords.length >= FEATURE_THRESHOLDS.MIN_SUSPICIOUS_KEYWORDS) {
        score += LOW_RISK_SCORES.SUSPICIOUS_KEYWORDS;
        reasons.push(`ℹ️ Suspicious keywords: ${features.suspiciousKeywords.join(', ')}`);
    }

    if (features.combinedWeakSignals >= 3) {
        score += LOW_RISK_SCORES.COMBINED_WEAK_SIGNALS_BONUS;
        reasons.push(`⚠️ Multiple suspicious indicators (${features.combinedWeakSignals} patterns)`);
    } else if (features.combinedWeakSignals === 2) {
        score += 5;
    }

    return score;
}

function evaluateSmartCombinations(features, reasons) {
    let score = 0;

    // Brand impersonation on free hosting = CRITICAL
    if (features.looksLikeBrand !== null && features.isFreeHostingService) {
        score += 25;
        reasons.push(`🚨 CRITICAL: ${features.looksLikeBrand} impersonation on free hosting!`);
    }

    // Government terms + free hosting
    if (features.isFreeHostingService) {
        const govKeywords = ['gov', 'tax', 'irs', 'elster', 'hmrc', 'treasury', 'federal', 'revenue'];
        const hasGovTerm = govKeywords.some(keyword => features.hostname.toLowerCase().includes(keyword));
        if (hasGovTerm && features.looksLikeBrand === null) {
            score += 20;
            reasons.push('🚨 Government-related terms on free hosting');
        }
    }

    // Free hosting + suspicious paths
    if (features.isFreeHostingService && features.hasSuspiciousPathPatterns) {
        score += 15;
        reasons.push('⚠️ Free hosting with suspicious login/account pages');
    }

    // Free hosting + multiple suspicious keywords
    if (features.isFreeHostingService && features.suspiciousKeywords.length >= 2) {
        score += 10;
        reasons.push('⚠️ Free hosting with multiple suspicious keywords');
    }

    // No HTTPS + free hosting + brand mention
    if (!features.usesHttps && features.isFreeHostingService && features.looksLikeBrand !== null) {
        score += 20;
        reasons.push('🚨 Unencrypted brand impersonation on free hosting');
    }

    // New domain + brand impersonation
    if (features.isNew && features.looksLikeBrand !== null) {
        score += 15;
        reasons.push('🚨 New domain impersonating established brand');
    }

    return score;
}

function determineRiskLabel(score) {
    if (score >= SCORE_THRESHOLDS.DANGEROUS) return 'DANGEROUS';
    if (score >= SCORE_THRESHOLDS.SUSPICIOUS) return 'SUSPICIOUS';
    return 'LIKELY_SAFE';
}

// ═══════════════════════════════════════════════════════════════════════════
// API ENDPOINTS
// ═══════════════════════════════════════════════════════════════════════════

// Root endpoint
app.get('/', (req, res) => {
    res.json({
        message: 'UNSCAMMED.AI Fraud Detection API',
        version: '2.0.0',
        endpoints: {
            fraudCheck: 'POST /api/fraud-check',
            health: 'GET /api/health',
            history: 'GET /api/fraud-check/history'
        }
    });
});

// Health check
app.get('/api/health', (req, res) => {
    res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Main fraud check endpoint
app.post('/api/fraud-check', async (req, res) => {
    const { url } = req.body;

    if (!url) {
        return res.status(400).json({
            success: false,
            error: 'Missing required field: url'
        });
    }

    let hostname;
    try {
        const urlObj = new URL(url);
        hostname = urlObj.hostname;
    } catch (e) {
        return res.status(400).json({
            success: false,
            error: 'Invalid URL format'
        });
    }

    console.log('═'.repeat(60));
    console.log(`🔍 Scanning: ${url}`);
    console.log('═'.repeat(60));

    // STEP 0: Check if domain is in safe database (whitelist)
    console.log('🛡️ STEP 0: Checking safe websites database...');
    if (isInSafeDatabase(hostname)) {
        console.log(`   ✅ Domain "${hostname}" found in SAFE DATABASE`);
        console.log('   ⏭️ Skipping all security checks');
        console.log('═'.repeat(60));
        console.log(`✅ Result: 0/100 (VERIFIED_SAFE)`);
        console.log('═'.repeat(60));

        const analysisId = `SCAN-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
        analysisHistory.push({
            id: analysisId,
            url,
            hostname,
            timestamp: new Date().toISOString(),
            result: { score: 0, label: 'VERIFIED_SAFE', reasons: ['Domain is in verified safe database'] }
        });

        return res.json({
            success: true,
            threats: [],
            source: 'safe-database',
            riskScore: 0,
            riskLabel: 'VERIFIED_SAFE',
            riskReasons: ['✅ Domain is in verified safe websites database'],
            preliminaryScore: 0,
            webRiskCalled: false,
            features: {
                hostname: hostname,
                inSafeDatabase: true,
                looksLikeBrand: null,
                isFreeHostingService: false,
                isRiskyTld: false,
                usesHttps: url.startsWith('https'),
                domainAgeDays: null,
                isNew: false,
                sslValid: null,
                webRiskFlagged: false,
                webRiskThreatTypes: []
            },
            analysisId
        });
    }
    console.log(`   ℹ️ Domain "${hostname}" not in safe database`);
    console.log('   🔍 Proceeding with full security scan...');

    // STEP 1: Extract domain features
    console.log('📋 STEP 1: Extracting domain features...');
    let features = buildDomainFeatures(url);
    console.log(`   Brand detection: ${features.looksLikeBrand || 'None'}`);
    console.log(`   Free hosting: ${features.isFreeHostingService}`);
    console.log(`   Risky TLD: ${features.isRiskyTld}`);
    console.log(`   Uses HTTPS: ${features.usesHttps}`);

    // STEP 2: Check domain age
    console.log('📅 STEP 2: Checking domain age...');
    let domainAge = await getDomainAge(hostname);
    if (!domainAge) {
        domainAge = getKnownDomainAge(hostname);
    }
    if (domainAge) {
        features = { ...features, ...domainAge };
        console.log(`   Domain age: ${domainAge.domainAgeDays} days`);
        console.log(`   Is new: ${domainAge.isNew}`);
    } else {
        console.log('   Domain age: Unknown (API unavailable)');
    }

    // STEP 3: Check SSL certificate
    console.log('🔒 STEP 3: Checking SSL certificate...');
    if (features.usesHttps) {
        const sslInfo = await checkSSLCertificate(hostname);
        if (sslInfo) {
            features = { ...features, ...sslInfo };
            console.log(`   SSL valid: ${sslInfo.sslValid}`);
            console.log(`   SSL expires in: ${sslInfo.sslDaysUntilExpiry} days`);
            console.log(`   Cert mismatch: ${sslInfo.certDomainMismatch}`);
        } else {
            console.log('   SSL check: Failed to connect');
        }
    } else {
        console.log('   SSL check: Skipped (not HTTPS)');
    }

    // STEP 4: Calculate preliminary risk score (before Web Risk)
    console.log('📊 STEP 4: Calculating preliminary risk score...');
    let preliminaryAssessment = buildRiskScore(features);
    console.log(`   Preliminary score: ${preliminaryAssessment.score}/100 (${preliminaryAssessment.label})`);

    // STEP 5: Conditionally check Web Risk API (only if score >= 25)
    console.log('🌐 STEP 5: Web Risk API Decision...');
    let webRiskCalled = false;

    if (preliminaryAssessment.score >= SCORE_THRESHOLDS.SUSPICIOUS) {
        // Site looks SUSPICIOUS or higher - validate with Web Risk API
        console.log(`   ⚠️ Score >= ${SCORE_THRESHOLDS.SUSPICIOUS} (SUSPICIOUS threshold)`);
        console.log('   🌐 Calling Web Risk API for validation...');

        const webRiskResult = await checkWebRisk(url, hostname);
        features = { ...features, ...webRiskResult };
        webRiskCalled = true;
    } else {
        // Site appears safe - skip Web Risk API (cost optimization)
        console.log(`   ✅ Score < ${SCORE_THRESHOLDS.SUSPICIOUS} - Site appears safe`);
        console.log('   💰 Skipping Web Risk API (cost optimization)');
        features = {
            ...features,
            webRiskFlagged: false,
            webRiskThreatTypes: [],
            source: 'skipped-low-risk'
        };
    }

    // STEP 6: Calculate final risk score
    console.log('📊 STEP 6: Calculating final risk score...');
    const riskAssessment = buildRiskScore(features);
    console.log(`   Final score: ${riskAssessment.score}/100`);
    console.log(`   Label: ${riskAssessment.label}`);
    console.log(`   Reasons: ${riskAssessment.reasons.length}`);
    console.log(`   Web Risk API called: ${webRiskCalled ? 'YES' : 'NO (score was low)'}`);

    // Map to threats for extension compatibility
    const threats = [...(features.webRiskThreatTypes || [])];
    if (riskAssessment.label === 'DANGEROUS' && !threats.includes('PHISHING')) {
        threats.push('PHISHING');
    }
    if (features.looksLikeBrand && !threats.includes('SOCIAL_ENGINEERING')) {
        threats.push('SOCIAL_ENGINEERING');
    }
    if (features.isFreeHostingService && features.looksLikeBrand && !threats.includes('MALWARE')) {
        threats.push('MALWARE');
    }

    console.log('═'.repeat(60));
    console.log(`✅ Result: ${riskAssessment.score}/100 (${riskAssessment.label})`);
    console.log('═'.repeat(60));

    // Store in history
    const analysisId = `SCAN-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
    analysisHistory.push({
        id: analysisId,
        url,
        hostname,
        timestamp: new Date().toISOString(),
        result: riskAssessment
    });

    // Keep history limited
    if (analysisHistory.length > 100) {
        analysisHistory = analysisHistory.slice(-100);
    }

    // Return response
    res.json({
        success: true,
        threats: threats,
        source: 'unscammed-fraud-api',
        riskScore: riskAssessment.score,
        riskLabel: riskAssessment.label,
        riskReasons: riskAssessment.reasons,
        preliminaryScore: preliminaryAssessment.score,
        webRiskCalled: webRiskCalled,
        features: {
            hostname: features.hostname,
            looksLikeBrand: features.looksLikeBrand,
            isFreeHostingService: features.isFreeHostingService,
            isRiskyTld: features.isRiskyTld,
            usesHttps: features.usesHttps,
            domainAgeDays: features.domainAgeDays,
            isNew: features.isNew,
            sslValid: features.sslValid,
            webRiskFlagged: features.webRiskFlagged,
            webRiskThreatTypes: features.webRiskThreatTypes
        },
        analysisId
    });
});

// History endpoint
app.get('/api/fraud-check/history', (req, res) => {
    const limit = parseInt(req.query.limit) || 10;
    const recentHistory = analysisHistory.slice(-limit).reverse();
    res.json({
        success: true,
        data: recentHistory,
        count: recentHistory.length,
        total: analysisHistory.length
    });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({ success: false, message: 'Endpoint not found' });
});

// Start server
app.listen(PORT, () => {
    console.log('═'.repeat(60));
    console.log('🛡️  UNSCAMMED.AI Fraud Detection API');
    console.log('═'.repeat(60));
    console.log(`🚀 Server running on http://localhost:${PORT}`);
    console.log('');
    console.log('Available endpoints:');
    console.log('  POST /api/fraud-check   - Check a URL for fraud/phishing');
    console.log('  GET  /api/fraud-check/history  - View analysis history');
    console.log('  GET  /api/health        - Health check');
    console.log('═'.repeat(60));
});
