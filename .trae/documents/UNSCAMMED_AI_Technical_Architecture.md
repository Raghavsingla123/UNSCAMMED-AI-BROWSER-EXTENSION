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

* **Frontend**: Vanilla JavaScript + HTML5 + CSS3

* **Extension Framework**: Chrome Manifest V3

* **Build System**: None (plain files for instant loading)

* **Storage**: Chrome Extension Storage API

* **Communication**: Chrome Message Passing API

## 3. Route Definitions

| Route             | Purpose                                                     |
| ----------------- | ----------------------------------------------------------- |
| popup/popup.html  | Main extension popup interface for user interaction         |
| background.js     | Service worker for background processing and API management |
| content.js        | Injected script for page-level security analysis            |
| utils/urlCheck.js | Utility functions for domain and security validation        |

## 4. API Definitions

### 4.1 Core API

**Chrome Extension APIs Used:**

```
chrome.webNavigation.onCompleted
```

Purpose: Monitor page navigation events
Parameters: Navigation details including URL, tab ID, frame ID

```
chrome.tabs.sendMessage
```

Purpose: Send security data from background to content script
Parameters: Tab ID, message object with URL and scan results

```
chrome.tabs.query
```

Purpose: Get active tab information for manual scans
Parameters: Query object to identify current active tab

**Internal Message API:**

Background to Content Script Communication:

```javascript
{
  type: "URL_SCAN",
  url: string,
  tabId: number,
  timestamp: number
}
```

Content Script Response:

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
```

Security Scan Results:

```javascript
// Security analysis results
const scanResult = {
  id: generateId(),
  url: "https://example.com",
  isSecure: true,
  threatLevel: "low",
  details: "Domain verified, no threats detected",
  scanTime: Date.now(),
  scanType: "automatic" // or "manual"
};

// Store scan results
chrome.storage.local.set({ [`scan_${scanResult.id}`]: scanResult });
```

User Settings:

```javascript
// User preferences and configuration
const userSettings = {
  autoScan: true,
  alertLevel: "medium", // low, medium, high
  logUrls: true,
  showNotifications: true,
  scanTimeout: 5000
};

// Initialize default settings
chrome.storage.local.set({ userSettings });
```

