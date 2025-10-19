# UNSCAMMED.AI Browser Extension

UNSCAMMED.AI is a Manifest V3 Chrome extension that runs fully in the browser to flag potentially risky websites. A service worker tracks navigation events, a content script evaluates the active page with a set of heuristics, and the popup provides manual scan controls and recent telemetry. All logic executes locally—no browsing data leaves the device.

## Features
- **Automatic navigation scans** – the background service worker (`background.js`) listens to `chrome.webNavigation.onCompleted`, logs the navigation, and asks the content script to rate the destination.
- **Rule-based risk scoring** – the content script (`content.js`) checks HTTPS usage, suspicious TLDs, phishing keywords, brand spoofing, and other red flags to determine a risk level.
- **In-page alerts** – high-risk pages render a banner at the top of the DOM for ten seconds. Manual scans display toast-style status cards.
- **Manual rescans** – the popup (`popup/`) lets you run the enhanced scan path, which adds DOM inspections for insecure forms, suspicious text, and external links.
- **Local storage history** – URL visits and scan payloads are saved in `chrome.storage.local`. The background worker caps the history to the most recent 100 entries and increments a total scan counter for the popup display.

## How it works
| Component | Responsibilities |
|-----------|------------------|
| `background.js` | Initializes default settings, listens to `webNavigation.onCompleted`, stores URL visit logs, and relays scan requests/responses between the popup and content script. |
| `content.js` | Performs heuristic scans (HTTPS usage, suspicious TLDs, phishing and brand-spoofing keywords, known safe domains, insecure forms, suspicious external links) and renders in-page alerts. |
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
- Visit any webpage—the content script evaluates it automatically. If the heuristics classify the site as high risk, a red alert banner appears at the top of the page for 10 seconds.
- Click the extension icon to open the popup. The panel shows the active tab URL (via `chrome.tabs.query`), the most recent threat level, and counters pulled from `chrome.storage.local`.
- Press **Scan This Site** in the popup to perform an enhanced scan. The popup sends a `MANUAL_SCAN` message to the content script, which adds DOM analysis for forms, external links, and suspicious phrases before responding.

### Supported URLs
The extension ignores browser/extension pages such as `chrome://`, `edge://`, and local `file://` paths because Chrome blocks content scripts on those schemes. Attempting to scan them results in an “unknown” status in the popup.

## Development Tips
- Enable the **Service Worker** logging view in `chrome://extensions/` to inspect `background.js` console output.
- Use the browser DevTools **Console** on any tab to view messages from `content.js` and the injected alert elements.
- Stored data (URL history, total scan counter, and individual scan documents) can be inspected from DevTools via `chrome.storage.local.get(null, console.log)`.
- When adjusting heuristics, update the helper functions in `content.js` and `utils/urlCheck.js` so automatic and manual scans stay in sync.

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
