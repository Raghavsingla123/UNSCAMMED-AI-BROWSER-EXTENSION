# UNSCAMMED.AI Browser Extension

UNSCAMMED.AI is a Manifest V3 Chrome extension that performs lightweight heuristics to highlight suspicious websites directly in the browser. It combines an always-on background service worker, a DOM-aware content script, and a popup dashboard to give immediate feedback about the page you are visiting—without sending browsing data to external services.

## Features
- **Automatic navigation scans** – the background service worker (`background.js`) records top-level navigations and asks the content script to rate the destination using simple rule-based checks.
- **In-page alerts** – the content script (`content.js`) shows dismissible banners when a domain exhibits high-risk traits such as phishing keywords, suspicious TLDs, or insecure forms.
- **Manual rescans** – the popup (`popup/popup.html`) lets you trigger an on-demand scan of the active tab and review the most recent threat assessment.
- **Local storage history** – recent URLs and scan metadata are cached in `chrome.storage.local` so the popup can display your total scan count and reuse fresh results.

## How it works
| Component | Responsibilities |
|-----------|------------------|
| `background.js` | Initializes default settings, listens to `webNavigation.onCompleted`, stores URL visit logs, and relays scan requests/responses between the popup and content script. |
| `content.js` | Runs heuristics (HTTPS check, suspicious domain patterns, phishing keywords, insecure forms, external links) to classify risk levels and renders toast-style UI for alerts and manual scan results. |
| `popup/` | Renders the extension popup UI, shows the active tab, threat status, and usage counters, and exposes a “Scan This Site” control. |
| `utils/urlCheck.js` | Houses reusable helpers for URL analysis (protocol, reputation, phishing indicators). These functions are currently internal utilities that can be imported into other scripts if needed. |

All analysis is performed client-side. The extension never transmits URLs or scan data to a remote server.

## Installation (Chrome)
1. Clone or download this repository.
   ```bash
   git clone https://github.com/your-username/UNSCAMMED-AI-BROWSER-EXTENSION.git
   cd UNSCAMMED-AI-BROWSER-EXTENSION
   ```
2. Open `chrome://extensions/`, enable **Developer mode**, and choose **Load unpacked**.
3. Select the project folder. You should now see the UNSCAMMED.AI shield icon in the toolbar.

## Usage
- Visit any webpage—the content script will evaluate it automatically. High-risk pages display a red alert banner at the top of the DOM for 10 seconds.
- Click the extension icon to open the popup. The panel shows the detected domain, the latest threat level, and aggregate scan statistics.
- Press **Scan This Site** in the popup to perform an enhanced scan (adds form, external link, and content heuristics). The popup updates its status once the content script responds.

### Supported URLs
The extension ignores browser/extension pages such as `chrome://`, `edge://`, and local `file://` paths because Chrome blocks content scripts on those schemes. Attempting to scan them results in an “unknown” status in the popup.

## Development Tips
- Enable the **Service Worker** logging view in `chrome://extensions/` to inspect `background.js` console output.
- Use the browser DevTools **Console** on any tab to view messages from `content.js` and the injected alert elements.
- Stored data (URL history and scan results) can be inspected from DevTools via `chrome.storage.local.get(null, console.log)`.
- When adjusting heuristics, update the helper functions in `content.js` or `utils/urlCheck.js` to keep risk scoring consistent.

## Project Structure
```
.
├── background.js         # Service worker: navigation tracking and storage
├── content.js            # Content script: heuristics and in-page UI
├── manifest.json         # Chrome extension manifest (MV3)
├── popup/
│   ├── popup.html        # Popup layout
│   ├── popup.css         # Popup styles
│   └── popup.js          # Popup behaviour and messaging
├── utils/
│   └── urlCheck.js       # URL analysis helpers (rule-based)
└── icons/                # Extension icons (SVG)
```

## Contributing
Bug reports and pull requests are welcome. Please open an issue describing the change you have in mind before submitting substantial updates.

## License
No license has been specified yet. If you intend to use this project beyond personal experimentation, please contact the maintainers or add an appropriate license file.
