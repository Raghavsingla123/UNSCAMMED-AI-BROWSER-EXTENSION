# UNSCAMMED.AI Auto-Scan Behaviour Report

## Purpose of this document
This report captures, in plain language, what the UNSCAMMED.AI browser extension actually does when it "auto scans" a website, why users frequently see a reassuring **"Verified safe domain"** verdict even on fraudulent pages, and where the current data flow breaks down. Every section below links back to specific modules in the production bundle so you can cross-reference the behaviour with the code.

---

## 1. Components involved in an automatic scan

### 1.1 Background service worker (`background.js`)
* Boots on installation or browser start and seeds `chrome.storage.local` with:
  * `extensionState` (flags like `isActive`, a `totalScans` counter)【F:background.js†L7-L34】
  * `userSettings` (auto-scan toggle, alert level, etc.)【F:background.js†L16-L34】
* Subscribes to `chrome.webNavigation.onCompleted` for main-frame navigations, logging every page load through `logVisitedUrl` and immediately messaging the tab for a scan.【F:background.js†L36-L75】
* Persists each scan result under a **new random ID** (`scan_${result.id}`) and bumps the global `totalScans` counter.【F:background.js†L77-L119】

### 1.2 Content script (`content.js`)
* Injected into every page; performs a lightweight `performInitialScan` when the DOM is ready.【F:content.js†L1-L68】
* Responds to `URL_SCAN` messages by re-running the same local heuristic (`performLocalSecurityCheck`).【F:content.js†L70-L118】
* Responds to `MANUAL_SCAN` requests by layering extra DOM checks on top of the local heuristic (`performEnhancedSecurityCheck`).【F:content.js†L120-L186】

### 1.3 Popup (`popup/popup.js`)
* When opened, asks for the active tab, displays its domain, and looks for a recent history entry to decide what verdict to show.【F:popup/popup.js†L1-L105】
* Searches for a storage entry named `scan_${recentScan.id}` where `recentScan.id` comes from the history record written in `logVisitedUrl`.【F:popup/popup.js†L73-L104】
* Falls back to a "Click to scan" state if that key is missing; manual scans go through the background service worker again.【F:popup/popup.js†L73-L154】

---

## 2. Step-by-step life of an auto scan

1. **Navigation detected** – When you finish loading a page, `onCompleted` fires with the tab ID and URL.【F:background.js†L36-L53】
2. **Visit logged** – `logVisitedUrl` creates a history entry with:
   * a generated ID (e.g. `mb2a2h3cldz`),
   * the raw URL,
   * timestamp and tab ID,
   * initial status `"pending"`.【F:background.js†L55-L72】
3. **Scan request sent** – The worker calls `chrome.tabs.sendMessage` with `type: "URL_SCAN"` and the URL.【F:background.js†L74-L96】
4. **Heuristic executed** – The content script receives the message, runs `performLocalSecurityCheck(url)`, and returns a structure `{ isSecure, threatLevel, details, checks }`.【F:content.js†L90-L118】
5. **Result stored** – The worker wraps that response, **generates a new ID**, and stores it in local storage as `scan_<randomId>` with metadata (timestamp, scan type).【F:background.js†L99-L118】
6. **Counters updated** – `extensionState.totalScans` increments so the popup can show how many total scans have run across sessions.【F:background.js†L110-L118】

Because the history record and the stored scan record do not share the same ID, the popup fails to find `scan_${recentScan.id}` later, which is why it frequently reports "Click to scan this site" even though the background worker has already stored a verdict.【F:background.js†L55-L118】【F:popup/popup.js†L73-L104】

---

## 3. What the local heuristic actually checks

`performLocalSecurityCheck` in the content script is the only logic powering both automatic and manual scans (the latter simply augment it). Its behaviour is determined by the following tests：【F:content.js†L134-L186】

| Check | Implementation detail | Effect on verdict |
| --- | --- | --- |
| HTTPS detection | `hasHttps = (protocol === 'https:')` | Sites without HTTPS get a **medium** threat level but still return `isSecure: true`. |
| Suspicious domain pattern | `checkSuspiciousDomain` flags IP addresses, multi-hyphen domains on a short list of TLDs, or extremely long hostnames.【F:content.js†L188-L215】 | Any match forces **high** threat and `isSecure: false`. |
| Phishing keyword scan | `checkPhishingIndicators` looks for a handful of brand names combined with "secure", "login", etc. in the URL.【F:content.js†L217-L236】 | Any match forces **high** threat and `isSecure: false`. |
| Known safe whitelist | `checkKnownSafeDomains` whitelists 11 well-known services (Google, Amazon, etc.).【F:content.js†L238-L249】 | Matching domains override the default detail text with **"Verified safe domain"** regardless of other context. |

The default verdict pathway is:
* `threatLevel = "low"`
* `isSecure = true`
* `details = "Domain appears safe, no threats detected"`

Only the two red-flag checks flip it to high risk, and only the lack of HTTPS downgrades to medium risk. Any site that does not match those narrow patterns – including bespoke phishing domains – will therefore retain the default "safe" verdict. If that domain also happens to include or end with one of the whitelist entries, the message upgrades to "Verified safe domain," which is the message users are reporting.

> **Important:** The repository ships with a much richer scoring system in `utils/urlCheck.js` (`analyzeUrlSecurity`) that calculates composite threat scores across protocol, domain reputation, phishing indicators, suspicious URL paths, and known threat lists, but the content script never calls it.【F:utils/urlCheck.js†L1-L205】

---

## 4. What a manual scan adds

Manual scans trigger `performEnhancedSecurityCheck`, which simply starts with the same local heuristic result and then appends three DOM-based observations：【F:content.js†L150-L186】

1. **Page content phrases** – Looks for a short list of strings such as "urgent action required" in the page text.【F:content.js†L251-L270】
2. **Form security** – Flags any `<form>` whose `action` attribute does not start with HTTPS.【F:content.js†L272-L288】
3. **External link sweep** – Checks outbound links and reuses the same `checkSuspiciousDomain` heuristic on each destination.【F:content.js†L290-L310】

If either forms or links are suspicious, the threat level is bumped to **medium** and appended to the details string. There is no way for these DOM checks to produce a **high** threat verdict, nor do they adjust the `isSecure` flag unless the base heuristic already considered the site unsafe. Consequently, a phishing site that fails to match the URL keyword lists will continue to display as "Verified safe domain" after a manual scan.

---

## 5. Data persistence and why the popup rarely shows auto-scan results

* **History record** – `logVisitedUrl` saves `{ id, url, visitTime, tabId, scanStatus }` into an array under `urlHistory` and retains the 100 most recent entries.【F:background.js†L55-L72】
* **Scan record** – `handleScanResult` stores `{ id, url, isSecure, threatLevel, details, scanTime, scanType }` under a unique key `scan_<generatedId>`.【F:background.js†L99-L118】
* **Popup lookup** – The popup filters history for entries from the last five minutes that match the current URL, then tries to fetch `scan_${recentScan.id}` using the history entry's ID.【F:popup/popup.js†L73-L104】

Because `handleScanResult` does **not** re-use the history ID, the popup usually receives `undefined` and reverts to a "pending" message. Users therefore think auto scans are not running, even though the background worker has stored a result under a different key.

---

## 6. Root causes of the "always verified" experience

1. **Narrow heuristics** – Automatic checks only penalise obvious red flags. Most fraudulent domains avoid those patterns, so they default to the low-risk path.
2. **Aggressive whitelist messaging** – Any domain that matches or ends with one of the eleven hard-coded brands instantly displays "Verified safe domain," obscuring other signals.【F:content.js†L134-L186】【F:content.js†L238-L249】
3. **Unused advanced analyser** – The sophisticated scoring logic in `utils/urlCheck.js` is unused, so features such as cumulative scoring, suspicious parameter detection, and known threat lists never influence the verdict.【F:utils/urlCheck.js†L1-L205】
4. **Popup feedback gap** – Even when auto scans mark a site unsafe, the popup often fails to surface that result due to the ID mismatch described above.【F:background.js†L55-L118】【F:popup/popup.js†L73-L104】

---

## 7. Opportunities for remediation

While remediation is outside the scope of this report, the following technical gaps outline the necessary work:

* **Wire up scan IDs** – Pass the `urlLog.id` from `logVisitedUrl` through the scan pipeline so `handleScanResult` saves the verdict under the same identifier, allowing the popup to display automatic results.
* **Adopt `analyzeUrlSecurity`** – Replace `performLocalSecurityCheck` with the comprehensive analysis in `utils/urlCheck.js`, preserving the response shape expected by the background and popup scripts.
* **Refine whitelist handling** – Treat "known safe" as a confidence boost rather than an unconditional "verified" label, so other risk signals can override it.

Implementing those changes would allow the extension to deliver nuanced verdicts and show them reliably in the UI.

---

## 8. Key takeaways for non-technical stakeholders

* The extension *does* run an automatic check on every page load, but its logic is shallow and easily bypassed.
* The "Verified safe domain" badge is hard-coded for a small set of popular brands and triggers whenever a domain ends with one of those strings, even for impostor domains.
* A more powerful analyser already exists in the codebase but has not been integrated into the live scanning path.
* A storage mismatch prevents the popup from showing auto-scan outcomes, so users do not receive timely warnings even when a problem is detected.

Understanding these mechanics clarifies why scam sites often appear "safe" today and points directly to the fixes that will make the scanner trustworthy.
