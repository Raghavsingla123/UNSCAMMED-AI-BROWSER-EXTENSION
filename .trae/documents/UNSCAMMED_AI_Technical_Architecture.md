# UNSCAMMED.AI Chrome Extension – Technical Architecture

## 1. Architecture Design

```mermaid
graph TD
    A[User Navigation] -->|webNavigation.onCompleted| B[Background Service Worker]
    B -->|chrome.tabs.sendMessage| C[Content Script]
    C -->|SCAN_RESULT| B
    C -->|DOM Updates| D[Web Page]
    E[Popup UI] -->|MANUAL_SCAN| B
    B -->|chrome.storage.local| F[(Local Storage)]
    C -->|Uses helpers| G[utils/urlCheck.js]
    E -->|GET_SCAN_STATUS| B
    E -->|chrome.tabs.query| H[Active Tab]
```

## 2. Technology Description

- **Language / UI**: Vanilla JavaScript, HTML5, CSS3 (no bundler)
- **Extension Framework**: Chrome Manifest V3 with a service worker background script
- **Storage**: `chrome.storage.local` for visit history, scan counters, and results
- **Messaging**: `chrome.runtime.sendMessage`, `chrome.runtime.onMessage`, and `chrome.tabs.sendMessage`
- **Navigation Hooks**: `chrome.webNavigation.onCompleted` for top-level page loads

## 3. Module Responsibilities

| File | Role |
|------|------|
| `manifest.json` | Declares MV3 entry points, permissions (`webNavigation`, `storage`, `activeTab`), and popup assets. |
| `background.js` | Initializes default state, logs navigation events, forwards scan requests to the content script, stores scan outcomes, and answers popup queries. |
| `content.js` | Runs heuristic checks (HTTPS usage, suspicious domains, phishing keywords, brand spoofing, DOM form/link/content analysis) and renders banners/toasts. |
| `popup/` | Presents the active tab status, total scan count, and manual scan button; dispatches popup events via runtime messaging. |
| `utils/urlCheck.js` | Provides reusable URL inspection helpers (protocol security, domain reputation, phishing indicators) shared by other scripts when bundled. |

## 4. Integration Points

### 4.1 Chrome APIs

| API | Usage |
|-----|-------|
| `chrome.webNavigation.onCompleted` | Triggers automatic scans after the main frame finishes loading. |
| `chrome.tabs.sendMessage` | Sends `URL_SCAN` and `MANUAL_SCAN` requests to the content script and receives responses. |
| `chrome.runtime.onMessage` | Handles popup requests (`MANUAL_SCAN`, `GET_SCAN_STATUS`) inside the background worker. |
| `chrome.tabs.query` | Fetches the active tab URL for popup display. |
| `chrome.storage.local` | Persists extension state (`extensionState`), user settings (`userSettings`), visit history (`urlHistory`), and individual scan documents (`scan_<id>`). |

### 4.2 Message Contracts

Background ➜ Content (`URL_SCAN`):
```javascript
{
  type: "URL_SCAN",
  url: string,
  tabId: number,
  timestamp: number
}
```

Content ➜ Background (`SCAN_RESULT`):
```javascript
{
  type: "SCAN_RESULT",
  url: string,
  isSecure: boolean,
  threatLevel: "low" | "medium" | "high" | "unknown",
  details: string,
  scanTime: number,
  tabId?: number,
  scanType?: "manual"
}
```

Popup ➜ Background (`MANUAL_SCAN`):
```javascript
{
  type: "MANUAL_SCAN",
  url: string,
  tabId: number,
  timestamp: number
}
```

Background ➜ Popup (`GET_SCAN_STATUS` response):
```javascript
{
  success: true,
  state: {
    isActive: boolean,
    totalScans: number,
    version?: string,
    lastUpdate?: number
  }
}
```

## 5. Runtime Interaction Diagram

```mermaid
sequenceDiagram
    participant User
    participant Popup
    participant Background
    participant Content
    participant Storage

    User->>Browser: Navigate to site
    Browser->>Background: webNavigation.onCompleted
    Background->>Content: URL_SCAN message
    Content->>Background: SCAN_RESULT
    Background->>Storage: Persist visit + result
    User->>Popup: Click extension icon
    Popup->>Background: GET_SCAN_STATUS
    Background->>Popup: Extension state + counters
    User->>Popup: Click "Scan This Site"
    Popup->>Background: MANUAL_SCAN
    Background->>Content: MANUAL_SCAN
    Content->>Background: Enhanced SCAN_RESULT
    Background->>Storage: Persist manual result + increment counter
    Background->>Popup: Manual scan response
```

## 6. Data Model

### 6.1 Stored Structures

```mermaid
erDiagram
    EXTENSION_STATE {
        boolean isActive
        string version
        number lastUpdate
        number totalScans
    }

    USER_SETTINGS {
        boolean autoScan
        string alertLevel
        boolean logUrls
        boolean showNotifications
        number scanTimeout
    }

    URL_HISTORY {
        string id
        string url
        number visitTime
        number tabId
        string scanStatus
    }

    SCAN_RESULT {
        string id
        string url
        string threatLevel
        boolean isSecure
        string details
        timestamp scanTime
    }
    
    USER_SETTINGS {
        string id PK
        boolean autoScan
        string alertLevel
        boolean logUrls
    }
    
    EXTENSION_STATE ||--o{ URL_LOG : tracks
    URL_LOG ||--|| SECURITY_SCAN : generates
    EXTENSION_STATE ||--|| USER_SETTINGS : configures
```

### 6.2 Data Definition Language

**Chrome Extension Storage Schema:**

Extension State Storage:
```javascript
// Extension configuration and state
const extensionState = {
  isActive: true,
  version: "1.0.0",
  lastUpdate: Date.now(),
  totalScans: 0
};

// Store in chrome.storage.local
chrome.storage.local.set({ extensionState });
```

URL Logging Storage:
```javascript
// URL visit tracking
const urlLog = {
  id: generateId(),
  url: "https://example.com",
  visitTime: Date.now(),
  tabId: 123,
  scanStatus: "completed",
  threatLevel: "low"
};

// Store in chrome.storage.local with array management
chrome.storage.local.get(['urlHistory'], (result) => {
  const history = result.urlHistory || [];
  history.push(urlLog);
  chrome.storage.local.set({ urlHistory: history });
});

chrome.storage.local.set({ [`scan_${result.id}`]: result });

chrome.storage.local.get(['extensionState'], ({ extensionState }) => {
  if (extensionState) {
    extensionState.totalScans += 1;
    chrome.storage.local.set({ extensionState });
  }
});
```

