# UNSCAMMED.AI Chrome Extension - Technical Architecture Document

## 1. Architecture Design

```mermaid
graph TD
    A[Chrome Browser] --> B[Extension Popup UI]
    A --> C[Background Service Worker]
    A --> D[Content Scripts]
    
    C --> E[Chrome APIs]
    C --> F[Local Storage]
    C --> D
    D --> G[Page DOM]
    
    H[Utils Module] --> C
    H --> D
    
    subgraph "Extension Components"
        B
        C
        D
        H
    end
    
    subgraph "Browser APIs"
        E
        F
    end
    
    subgraph "Web Page"
        G
    end
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
  threatLevel: "low" | "medium" | "high",
  details: string
}
```

## 5. Server Architecture Diagram

```mermaid
graph TD
    A[Popup UI Layer] --> B[Background Service Worker]
    B --> C[Content Script Layer]
    C --> D[Utils Processing Layer]
    D --> E[Chrome Storage Layer]
    
    B --> F[Chrome APIs Layer]
    F --> G[Browser Navigation Events]
    F --> H[Tab Management]
    F --> I[Storage Management]
    
    subgraph "Extension Architecture"
        A
        B
        C
        D
    end
    
    subgraph "Browser Platform"
        E
        F
        G
        H
        I
    end
```

## 6. Data Model

### 6.1 Data Model Definition

```mermaid
erDiagram
    EXTENSION_STATE {
        string extensionId PK
        boolean isActive
        timestamp lastUpdate
        string version
    }
    
    URL_LOG {
        string id PK
        string url
        timestamp visitTime
        number tabId
        string scanStatus
    }
    
    SECURITY_SCAN {
        string id PK
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

### 6.2 Storage Keys

- `extensionState`: `{ isActive, version, lastUpdate, totalScans }` – created during installation/startup and updated when scans finish.
- `userSettings`: `{ autoScan, alertLevel, logUrls, showNotifications, scanTimeout }` – defaults stored on install; not yet exposed in the UI.
- `urlHistory`: `Array<URL_HISTORY>` – appended for each main-frame navigation, truncated to the most recent 100 records.
- `scan_<generatedId>`: `SCAN_RESULT` objects persisted per scan (automatic or manual).

Example persistence flow:
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

