# 🛡️ UNSCAMMED.AI - Complete Security Platform

[![Chrome Extension](https://img.shields.io/badge/Chrome-Extension-green.svg)](https://chrome.google.com/webstore)
[![Manifest V3](https://img.shields.io/badge/Manifest-V3-blue.svg)](https://developer.chrome.com/docs/extensions/mv3/)
[![Node.js](https://img.shields.io/badge/Node.js-v18+-brightgreen.svg)](https://nodejs.org/)
[![Google Web Risk](https://img.shields.io/badge/Google-Web%20Risk%20API-blue.svg)](https://cloud.google.com/web-risk)
[![License](https://img.shields.io/badge/License-MIT-red.svg)](LICENSE)

> **Browser Shield** - Real-time phishing detection and website security analysis powered by Google Web Risk API

UNSCAMMED.AI is a production-grade security platform combining a Chrome browser extension with a powerful backend API server. It provides real-time phishing detection and website security analysis using Google's Web Risk API with a cost-optimized dual-project architecture that keeps operational costs at $0 for up to 50,000 scans per month.

## 📋 Table of Contents

- [🎯 Overview](#-overview)
- [✨ Features](#-features)
- [🏗️ Architecture](#️-architecture)
- [🚀 Quick Start](#-quick-start)
- [📦 Installation](#-installation)
- [🧪 Testing Guide](#-testing-guide)
- [🔧 Technical Details](#-technical-details)
- [📁 Project Structure](#-project-structure)
- [🛠️ Development](#️-development)
- [🐛 Troubleshooting](#-troubleshooting)
- [🗺️ Roadmap](#️-roadmap)
- [🤝 Contributing](#-contributing)

## 🎯 Overview

UNSCAMMED.AI is a comprehensive security platform consisting of two integrated components:

1. **Chrome Extension** - Real-time browser protection with automatic URL monitoring
2. **Backend API Server** - Powered by Google Web Risk API with intelligent cost optimization

The platform targets everyday internet users who need protection from phishing attacks, malicious websites, and online scams while providing a seamless browsing experience.

### Key Benefits

- **Enterprise-Grade Protection**: Powered by Google's Web Risk API threat intelligence
- **Cost-Optimized Architecture**: Dual-project design keeps costs at $0 for 50k+ scans/month
- **Real-time Detection**: Automatic scanning with instant threat identification
- **Local Hash Database**: 6,144+ malicious URL hashes for instant offline detection
- **Smart Fallback**: Real-time API verification for unknown URLs
- **Privacy-First**: Minimal data transmission, maximum protection
- **Developer-Friendly**: Clean, maintainable code with comprehensive documentation

## ✨ Features

### 🔍 Core Security Features

- **Google Web Risk Integration**: Enterprise-grade threat detection using Google's database
- **Dual-Project Architecture**: Cost-optimized setup with two Google Cloud projects
- **Local Hash Database**: 6,144 malicious URL hash prefixes for instant detection
  - 2,048 MALWARE hashes
  - 2,048 SOCIAL_ENGINEERING hashes
  - 2,048 UNWANTED_SOFTWARE hashes
- **Automatic URL Monitoring**: Logs and analyzes every page navigation
- **Real-time Threat Detection**: Hybrid strategy (local → API fallback)
- **Manual Security Scans**: On-demand analysis via popup interface
- **Automatic Database Updates**: Hash database refreshes every 30 minutes

### 🎨 User Interface

- **Clean Popup Design**: Minimalistic interface with red accent branding
- **Security Dashboard**: Current website status and scan results
- **One-Click Scanning**: Manual scan trigger for enhanced analysis
- **Extension Statistics**: Track total scans and security events
- **Threat Indicators**: Visual alerts for detected threats

### 🔧 Backend API Features

- **REST API**: Express.js server with CORS support
- **POST /scan**: URL scanning with threat detection
- **GET /health**: Server health check and configuration status
- **GET /stats/database**: Local hash database statistics
- **GET /stats/usage**: API usage and cost tracking
- **GET /stats/cost-estimate**: Monthly cost projections
- **POST /admin/update-database**: Manual database refresh

### 💰 Cost Optimization

- **Project A (Hash Database)**: Uses Update API - 100% FREE
- **Project B (Lookup API)**: First 10,000 queries/month FREE
- **Smart Routing**: 80% of requests handled by free local database
- **API Guard**: Prevents cross-project contamination
- **Usage Monitoring**: Real-time tracking of API consumption

### 🔧 Technical Features

- **Manifest V3 Compliance**: Latest Chrome extension standards
- **Service Worker Architecture**: Efficient background processing
- **Message Passing System**: Seamless component communication
- **ES Modules**: Modern JavaScript with import/export
- **Environment Configuration**: Secure .env-based setup
- **Error Handling**: Comprehensive error management and logging
- **Token Caching**: Efficient OAuth2 authentication

## 🏗️ Architecture

### Complete System Overview

```
┌──────────────────────────────────────────────────────────────┐
│                    Chrome Extension                          │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐         │
│  │  Popup UI   │  │ Background  │  │  Content    │         │
│  │ (popup.html)│◄─┤Service Worke│◄─┤   Script    │         │
│  └─────────────┘  └──────┬──────┘  └─────────────┘         │
└─────────────────────────┼───────────────────────────────────┘
                          │ HTTP POST /scan
                          ▼
┌──────────────────────────────────────────────────────────────┐
│              Backend API Server (Express.js)                 │
│                    Port 3000                                 │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  Hybrid Scanning Strategy (server-dual.js)           │   │
│  │  Step 1: Check Local Hash DB → Step 2: Call API      │   │
│  └──────────────┬────────────────────────┬────────────────┘ │
│                 │                        │                   │
│                 ▼                        ▼                   │
│  ┌────────────────────────┐  ┌────────────────────────┐    │
│  │   Project A            │  │   Project B            │    │
│  │   Hash Database        │  │   Lookup API           │    │
│  │ (webrisk-update-api.js)│  │ (webrisk-lookup-api.js)│    │
│  │                        │  │                        │    │
│  │ • Local 6,144 hashes   │  │ • Real-time lookup     │    │
│  │ • Instant check        │  │ • Google verification  │    │
│  │ • Cost: $0 (FREE)      │  │ • Cost: $0 (<10k/mo)   │    │
│  └────────┬───────────────┘  └────────┬───────────────┘    │
└───────────┼──────────────────────────┼────────────────────┘
            │                          │
            ▼                          ▼
┌────────────────────────────────────────────────────────────┐
│              Google Cloud Platform                         │
│  ┌──────────────────────┐  ┌──────────────────────────┐   │
│  │  Project A           │  │  Project B               │   │
│  │  unscammed-hashdb-*  │  │  unscammed-lookup-*      │   │
│  │                      │  │                          │   │
│  │  Web Risk Update API │  │  Web Risk Lookup API     │   │
│  │  threatLists.        │  │  uris:search             │   │
│  │  computeDiff         │  │                          │   │
│  └──────────────────────┘  └──────────────────────────┘   │
└────────────────────────────────────────────────────────────┘
```

### Request Flow with Dual-Project Strategy

1. **User Navigation**: Browser navigates to a new page
2. **Extension Detection**: Service worker detects navigation event
3. **API Request**: Extension sends URL to backend server (POST /scan)
4. **Step 1 - Local Check**: Server checks Project A hash database
   - Compute SHA256 hash of URL
   - Check against 6,144 local hash prefixes
   - If match found → Return threat (Cost: $0, Speed: Instant)
5. **Step 2 - API Fallback**: If not found locally, call Project B
   - Make uris:search API call to Google
   - Get real-time verification
   - Return result (Cost: $0 for first 10k/month)
6. **Response**: Server returns threat status to extension
7. **UI Update**: Extension displays security status to user

## 🚀 Quick Start

### Prerequisites

- **Google Chrome browser** (version 88+)
- **Node.js** v18 or higher
- **Google Cloud Account** with two projects set up
- **API Keys** and service account credentials
- **Developer mode** enabled in Chrome extensions

### 5-Step Quick Setup

1. **Clone Repository**
   ```bash
   git clone https://github.com/your-username/UNSCAMMED-AI-BROWSER-EXTENSION.git
   cd UNSCAMMED-AI-BROWSER-EXTENSION
   ```

2. **Install Dependencies**
   ```bash
   npm install
   ```

3. **Configure Environment**
   ```bash
   # Copy the example environment file
   cp .env.example .env

   # Edit .env and add your Google Cloud credentials
   # - PROJECT_A_SERVICE_ACCOUNT_PATH
   # - PROJECT_A_PROJECT_ID
   # - PROJECT_B_API_KEY
   # - PROJECT_B_PROJECT_ID
   ```

4. **Start Backend Server**
   ```bash
   npm start
   ```
   Server will run on `http://localhost:3000`

5. **Load Chrome Extension**
   - Open Chrome and go to `chrome://extensions/`
   - Enable "Developer mode" (toggle in top-right)
   - Click "Load unpacked" and select the project folder
   - Look for the 🛡️ UNSCAMMED.AI icon in your toolbar

### Verify Installation

1. **Check Server Health**
   ```bash
   curl http://localhost:3000/health | jq
   ```

2. **Test URL Scanning**
   ```bash
   curl -X POST http://localhost:3000/scan \
     -H "Content-Type: application/json" \
     -d '{"url":"https://google.com"}' | jq
   ```

3. **Check Extension**
   - Visit any website
   - Click the extension icon to see security status
   - Try manual scanning with "Scan This Site" button

## 📦 Detailed Installation

### Part 1: Google Cloud Setup

1. **Create Two Google Cloud Projects**

   **Project A: Hash Database**
   ```bash
   # Create project for Update API
   gcloud projects create unscammed-hashdb-[UNIQUE-ID]
   gcloud config set project unscammed-hashdb-[UNIQUE-ID]

   # Enable Web Risk API
   gcloud services enable webrisk.googleapis.com

   # Create service account
   gcloud iam service-accounts create webrisk-updater \
     --display-name="Web Risk Update API"

   # Create and download key
   gcloud iam service-accounts keys create ./secrets/project-a-service-account.json \
     --iam-account=webrisk-updater@unscammed-hashdb-[UNIQUE-ID].iam.gserviceaccount.com

   # Grant permissions
   gcloud projects add-iam-policy-binding unscammed-hashdb-[UNIQUE-ID] \
     --member="serviceAccount:webrisk-updater@unscammed-hashdb-[UNIQUE-ID].iam.gserviceaccount.com" \
     --role="roles/webrisk.user"
   ```

   **Project B: Lookup API**
   ```bash
   # Create project for Lookup API
   gcloud projects create unscammed-lookup-[UNIQUE-ID]
   gcloud config set project unscammed-lookup-[UNIQUE-ID]

   # Enable Web Risk API
   gcloud services enable webrisk.googleapis.com

   # Create API key
   gcloud alpha services api-keys create \
     --display-name="Web Risk Lookup Key"

   # Get the API key (save this for .env file)
   gcloud alpha services api-keys list
   ```

2. **Automated Setup (Alternative)**
   ```bash
   # Use the automated setup script
   chmod +x setup-automated.sh
   ./setup-automated.sh
   ```

### Part 2: Backend Server Setup

1. **Install Node.js Dependencies**
   ```bash
   npm install
   ```

2. **Configure Environment Variables**
   ```bash
   # Copy example environment file
   cp .env.example .env

   # Edit .env with your values:
   # PROJECT_A_SERVICE_ACCOUNT_PATH=./secrets/project-a-service-account.json
   # PROJECT_A_PROJECT_ID=unscammed-hashdb-[YOUR-ID]
   # PROJECT_B_API_KEY=AIzaSy...your-api-key
   # PROJECT_B_PROJECT_ID=unscammed-lookup-[YOUR-ID]
   # USE_DUAL_PROJECT_MODE=true
   # ENABLE_LOCAL_HASH_DB=true
   # ENABLE_API_GUARD=true
   # PORT=3000
   ```

3. **Start the Server**
   ```bash
   npm start
   ```

   Expected output:
   ```
   ✅ Dual-project configuration validated
   🔄 Initializing local hash database (Project A)...
   [Project A] ✅ Added 2048 MALWARE hash prefixes (FREE)
   [Project A] ✅ Added 2048 SOCIAL_ENGINEERING hash prefixes (FREE)
   [Project A] ✅ Added 2048 UNWANTED_SOFTWARE hash prefixes (FREE)
   🚀 UNSCAMMED.AI Dual-Project API Server
   📡 Server running: http://localhost:3000
   ```

4. **Verify Server is Working**
   ```bash
   # Health check
   curl http://localhost:3000/health | jq

   # Database stats
   curl http://localhost:3000/stats/database | jq

   # Test scan
   curl -X POST http://localhost:3000/scan \
     -H "Content-Type: application/json" \
     -d '{"url":"https://google.com"}' | jq
   ```

### Part 3: Chrome Extension Installation

1. **Load Extension in Chrome**
   ```
   1. Open Chrome browser
   2. Navigate to chrome://extensions/
   3. Toggle "Developer mode" (top-right corner)
   4. Click "Load unpacked"
   5. Select the UNSCAMMED AI BROWSER EXTENSION folder
   6. Extension should appear in your extensions list
   ```

2. **Pin Extension** (Recommended)
   ```
   1. Click the puzzle piece icon in Chrome toolbar
   2. Find UNSCAMMED.AI in the list
   3. Click the pin icon to keep it visible
   ```

3. **Verify Extension Works**
   - Visit any website (e.g., google.com)
   - Click the 🛡️ UNSCAMMED.AI icon
   - You should see the security status
   - Try clicking "Scan This Site" button
   - Check browser console for scan logs

### Part 4: Testing the Complete System

Run the comprehensive test suite:

```bash
npm test
```

Or use the interactive demo:

```bash
./scripts/demo-dual-projects.sh
```

### Method 2: Chrome Web Store (Future)

*Coming soon - Extension will be available on the Chrome Web Store*

## 🧪 Testing Guide

### Basic Functionality Test

1. **Extension Loading Test**
   ```
   ✅ Extension loads without errors
   ✅ Icon appears in Chrome toolbar
   ✅ No console errors in chrome://extensions/
   ```

2. **URL Monitoring Test**
   ```
   1. Open Chrome DevTools (F12)
   2. Go to Console tab
   3. Visit any website (e.g., google.com)
   4. Look for: "🌐 Navigation completed: [URL]"
   5. Look for: "📝 URL logged: [URL]"
   ```

3. **Popup Interface Test**
   ```
   1. Click the 🛡️ UNSCAMMED.AI icon
   2. Popup should open showing:
      - "🛡️ UNSCAMMED.AI" title
      - Current website URL
      - "Scan This Site" button
      - Security status information
   ```

4. **Manual Scan Test**
   ```
   1. Open popup on any website
   2. Click "Scan This Site" button
   3. Button should show "Scanning..." state
   4. Results should appear within 2-3 seconds
   5. Check console for scan completion logs
   ```

### Advanced Testing

5. **Background-Content Messaging Test**
   ```
   1. Open DevTools on any webpage
   2. Navigate to a new page
   3. Check console for:
      - "🔍 Analyzing page: [URL]"
      - "✅ Security scan completed"
      - Message passing confirmations
   ```

6. **Storage Persistence Test**
   ```
   1. Visit several different websites
   2. Open popup and check scan history
   3. Restart Chrome
   4. Verify data persists across sessions
   ```

### Expected Console Output

```javascript
// Background Script Logs
🛡️ UNSCAMMED.AI Background Service Worker initialized
🛡️ Extension initialized with default settings
🌐 Navigation completed: https://example.com
📝 URL logged: https://example.com
✅ Content script response: {isSecure: true, threatLevel: "low"}

// Content Script Logs  
🔍 UNSCAMMED.AI Content Script loaded on: https://example.com
🔍 Analyzing page: https://example.com
✅ Security scan completed: {isSecure: true, threatLevel: "low"}
```

## 🔧 Technical Details

### Manifest V3 Configuration

```json
{
  "manifest_version": 3,
  "name": "UNSCAMMED.AI",
  "version": "1.0.0",
  "permissions": [
    "tabs",           // Access tab information
    "activeTab",      // Access current active tab
    "webNavigation",  // Monitor page navigation
    "storage"         // Local data storage
  ],
  "host_permissions": ["<all_urls>"]
}
```

### Component Details

#### 1. Background Service Worker (`background.js`)

**Purpose**: Central coordinator for extension functionality

**Key Functions**:
- `initializeExtension()`: Sets up default configuration
- `logVisitedUrl()`: Records navigation events
- `sendUrlToContentScript()`: Triggers security scans
- `handleScanResult()`: Processes scan results

**Chrome APIs Used**:
- `chrome.webNavigation.onCompleted`: Navigation monitoring
- `chrome.tabs.sendMessage`: Content script communication
- `chrome.storage.local`: Data persistence

#### 2. Content Script (`content.js`)

**Purpose**: Page-level security analysis and DOM interaction

**Key Functions**:
- `analyzeCurrentPage()`: Performs security checks
- `checkForPhishingIndicators()`: Identifies threats
- `displaySecurityAlert()`: Shows warnings to users

**Analysis Capabilities**:
- Domain reputation checking
- Suspicious URL pattern detection
- Page content analysis
- SSL certificate validation

#### 3. Popup Interface (`popup/`)

**Files**:
- `popup.html`: UI structure
- `popup.css`: Styling with red accent theme
- `popup.js`: User interaction logic

**Features**:
- Current website security status
- Manual scan trigger
- Extension statistics
- Settings access (future)

#### 4. Utility Functions (`utils/urlCheck.js`)

**Purpose**: Core security analysis algorithms

**Functions**:
- `analyzeDomain()`: Domain reputation analysis
- `checkPhishingPatterns()`: Pattern matching
- `validateSSL()`: Certificate verification
- `calculateThreatLevel()`: Risk assessment

### Data Storage Schema

```javascript
// Extension State
{
  isActive: boolean,
  version: string,
  lastUpdate: timestamp,
  totalScans: number
}

// URL Log Entry
{
  id: string,
  url: string,
  visitTime: timestamp,
  tabId: number,
  scanStatus: "pending" | "completed" | "failed"
}

// Security Scan Result
{
  id: string,
  url: string,
  isSecure: boolean,
  threatLevel: "low" | "medium" | "high",
  details: string,
  scanTime: timestamp,
  scanType: "automatic" | "manual"
}
```

### Message Passing API

```javascript
// Background → Content Script
{
  type: "URL_SCAN",
  url: string,
  tabId: number,
  timestamp: number
}

// Content Script → Background
{
  type: "SCAN_RESULT",
  url: string,
  isSecure: boolean,
  threatLevel: "low" | "medium" | "high",
  details: string
}

// Popup → Background
{
  type: "MANUAL_SCAN",
  url: string,
  tabId: number
}
```

## 📁 Project Structure

```
UNSCAMMED AI BROWSER EXTENSION/
│
├── 📄 Core Configuration
│   ├── package.json              # Node.js dependencies and scripts
│   ├── package-lock.json         # Locked dependency versions
│   ├── .env                      # Environment variables (SECRET - not in git)
│   ├── .env.example              # Template for environment setup
│   └── .gitignore                # Git ignore rules
│
├── 🖥️ Backend Server (Node.js + Express)
│   ├── server-dual.js            # Main dual-project API server
│   ├── 📁 lib/
│   │   ├── webrisk-update-api.js # Project A: Update API (Hash DB)
│   │   ├── webrisk-lookup-api.js # Project B: Lookup API
│   │   └── api-guard.js          # API contamination prevention
│   └── 📁 secrets/
│       └── project-a-service-account.json  # Service account key (SECRET)
│
├── 🌐 Chrome Extension
│   ├── manifest.json             # Extension manifest (Manifest V3)
│   ├── background.js             # Service worker (background processing)
│   ├── content.js                # Content script (page analysis)
│   ├── 📁 popup/
│   │   ├── popup.html           # Popup interface structure
│   │   ├── popup.css            # Styling (red accent theme)
│   │   └── popup.js             # Popup functionality
│   ├── 📁 utils/
│   │   └── urlCheck.js          # Security analysis utilities
│   └── 📁 icons/
│       ├── icon16.svg           # 16x16 extension icon
│       ├── icon48.svg           # 48x48 extension icon
│       └── icon128.svg          # 128x128 extension icon
│
├── 🛠️ Scripts & Automation
│   ├── setup-automated.sh        # Automated GCP project setup
│   ├── verify-api-usage.sh       # Verify API usage patterns
│   └── 📁 scripts/
│       ├── test-dual-projects.js # Comprehensive test suite
│       └── demo-dual-projects.sh # Interactive demonstration
│
└── 📚 Documentation
    ├── README.md                 # This file (main documentation)
    ├── DEMO_GUIDE.md             # Complete demonstration guide
    ├── PROJECT_STRUCTURE.md      # Project organization overview
    └── CHANGES.md                # Changelog (auto-generated)
```

### Key File Descriptions

| File | Purpose | Size | Key Features |
|------|---------|------|--------------|
| **Backend Server** |
| `server-dual.js` | Main API server with dual-project logic | ~12KB | Express.js, CORS, hybrid scanning |
| `lib/webrisk-update-api.js` | Project A: Hash database management | ~15KB | computeDiff, SHA256 hashing, 6144 hashes |
| `lib/webrisk-lookup-api.js` | Project B: Real-time URL lookup | ~8KB | uris:search, usage tracking |
| `lib/api-guard.js` | Prevents API contamination | ~5KB | Method whitelisting, validation |
| **Chrome Extension** |
| `manifest.json` | Extension configuration (V3) | ~1KB | Permissions, host access |
| `background.js` | Service worker | ~8KB | Navigation monitoring, API calls |
| `content.js` | Page analysis | ~6KB | DOM inspection, message passing |
| `popup.html` | User interface | ~2KB | Security status display |
| `popup.js` | UI interactions | ~5KB | Manual scan trigger |
| **Scripts** |
| `setup-automated.sh` | GCP project automation | ~3KB | Creates projects, enables APIs |
| `verify-api-usage.sh` | API usage verification | ~2KB | Checks which methods are called |
| `scripts/test-dual-projects.js` | Test suite | ~10KB | Comprehensive API testing |

## 🛠️ Development

### Available NPM Scripts

```bash
# Start the backend server
npm start

# Run comprehensive test suite
npm test

# Run Web Risk POC test
npm run test:poc

# Setup Google Cloud projects (automated)
npm run setup

# Check billing status
npm run check:billing

# Generate monthly usage report
npm run report:monthly
```

### Development Workflow

```bash
# 1. Start development server
npm start

# 2. Make changes to code
# - Edit backend: server-dual.js or lib/*.js
# - Edit extension: background.js, content.js, popup/*

# 3. For backend changes:
# - Restart server (Ctrl+C, then npm start)

# 4. For extension changes:
# - Go to chrome://extensions/
# - Click refresh icon on UNSCAMMED.AI extension
# - Test your changes

# 5. Run tests to verify
npm test

# 6. Check API usage patterns
./verify-api-usage.sh
```

### Useful Development Commands

```bash
# View server logs in real-time
npm start | grep -E "\\[Project|Cost|Threat"

# Test scanning a specific URL
curl -X POST http://localhost:3000/scan \
  -H "Content-Type: application/json" \
  -d '{"url":"YOUR_URL_HERE"}' | jq

# Check database statistics
curl http://localhost:3000/stats/database | jq

# Check API usage stats
curl http://localhost:3000/stats/usage | jq

# Force database update
curl -X POST http://localhost:3000/admin/update-database | jq

# Check cost estimates
curl http://localhost:3000/stats/cost-estimate | jq

# View server health
curl http://localhost:3000/health | jq
```

## 🔌 API Endpoints

The backend server exposes the following REST API endpoints:

### POST /scan
Scan a URL for security threats.

**Request:**
```json
{
  "url": "https://example.com"
}
```

**Response:**
```json
{
  "success": true,
  "url": "https://example.com",
  "threats": [],
  "threatLevel": "low",
  "isSecure": true,
  "details": "No threats detected by Google Web Risk",
  "source": "project-b-lookup-api",
  "confidence": "high",
  "cost": 0,
  "usageStats": {
    "monthlyQueries": 1,
    "freeTrierLimit": 10000,
    "percentageUsed": "0.01",
    "remainingQueries": 9999
  },
  "timestamp": 1234567890
}
```

### GET /health
Check server health and configuration.

**Response:**
```json
{
  "status": "ok",
  "service": "UNSCAMMED.AI Dual-Project Web Risk API",
  "mode": "dual-project",
  "initialized": true,
  "timestamp": 1234567890,
  "projects": {
    "project_a": {
      "name": "Hash Database (Update API)",
      "enabled": true,
      "methods": ["computeDiff", "hashes.search"],
      "cost": "FREE (computeDiff) + $50/1000 (hashes.search - rarely used)"
    },
    "project_b": {
      "name": "URL Lookup (Lookup API)",
      "enabled": true,
      "methods": ["uris:search"],
      "cost": "FREE tier (10,000/month)"
    }
  }
}
```

### GET /stats/database
Get local hash database statistics.

**Response:**
```json
{
  "success": true,
  "totalHashes": 6144,
  "malwareHashes": 2048,
  "socialEngineeringHashes": 2048,
  "unwantedSoftwareHashes": 2048,
  "lastUpdate": 1234567890,
  "version": "ChAIAxAGGAEiAzAwMSiAEDABENzWEhoCGAhbnwVf"
}
```

### GET /stats/usage
Get API usage statistics for Project B.

**Response:**
```json
{
  "success": true,
  "projectB": {
    "monthlyQueries": 1,
    "freeTrierLimit": 10000,
    "percentageUsed": "0.01",
    "remainingQueries": 9999,
    "estimatedCost": 0
  }
}
```

### GET /stats/cost-estimate
Get detailed cost projections.

**Response:**
```json
{
  "success": true,
  "monthly": {
    "project_a": {
      "computeDiff": 0,
      "hashesSearch": 0,
      "total": 0
    },
    "project_b": {
      "urisSearch": 0,
      "queries": 1,
      "freeTierRemaining": 9999
    },
    "total": 0
  },
  "projections": {
    "at5kPerDay": {
      "monthlyQueries": 150000,
      "estimatedCost": 0,
      "warning": "Exceeds free tier limit"
    }
  }
}
```

### POST /admin/update-database
Manually trigger hash database update (Project A).

**Response:**
```json
{
  "success": true,
  "totalHashes": 6144,
  "lastUpdate": 1234567890
}
```

### Code Style Guidelines

1. **JavaScript Standards**
   - Use ES2020+ features (ES Modules, async/await)
   - Consistent camelCase naming
   - Clear function documentation
   - Error handling for all async operations

2. **File Organization**
   - One main function per file
   - Clear separation of concerns
   - Minimal dependencies between components
   - ES Modules with import/export

3. **Backend Best Practices**
   - RESTful API design
   - Proper error handling and status codes
   - Request/response logging
   - Environment-based configuration

4. **Chrome Extension Best Practices**
   - Manifest V3 compliance
   - Efficient message passing
   - Proper permission usage
   - Local storage optimization

### Adding New Features

1. **Security Analysis Enhancement**
   ```javascript
   // Add new check to utils/urlCheck.js
   function checkNewThreatType(url, content) {
     // Implementation
     return { isSecure: boolean, details: string };
   }
   ```

2. **UI Components**
   ```html
   <!-- Add to popup/popup.html -->
   <div class="new-feature">
     <button id="new-action">New Action</button>
   </div>
   ```

3. **Background Processing**
   ```javascript
   // Add to background.js
   chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
     if (request.type === "NEW_FEATURE") {
       // Handle new feature
     }
   });
   ```

### Testing New Features

1. **Reload Extension**
   ```
   1. Go to chrome://extensions/
   2. Find UNSCAMMED.AI
   3. Click the refresh icon
   ```

2. **Check Console Logs**
   ```
   1. Open DevTools in background page
   2. Monitor for errors or warnings
   3. Test all user interactions
   ```

3. **Validate Functionality**
   ```
   1. Test on multiple websites
   2. Verify data persistence
   3. Check performance impact
   ```

## 🐛 Troubleshooting

### Common Issues

#### Extension Won't Load

**Problem**: Extension fails to load in Chrome
```
Symptoms:
- Error messages in chrome://extensions/
- Extension not appearing in toolbar
- Console errors during loading
```

**Solutions**:
1. Check manifest.json syntax
2. Verify all file paths are correct
3. Ensure no syntax errors in JavaScript files
4. Check Chrome version compatibility

#### Background Script Not Working

**Problem**: URL logging not happening
```
Symptoms:
- No console logs from background script
- Navigation events not detected
- Content script not receiving messages
```

**Solutions**:
1. Check service worker status in chrome://extensions/
2. Verify webNavigation permission in manifest
3. Restart Chrome completely
4. Check for JavaScript errors in background script

#### Content Script Issues

**Problem**: Page analysis not working
```
Symptoms:
- No security analysis on pages
- Console errors on web pages
- Message passing failures
```

**Solutions**:
1. Verify content script injection
2. Check host permissions in manifest
3. Test on different websites
4. Review content script console logs

#### Popup Not Opening

**Problem**: Extension popup doesn't appear
```
Symptoms:
- Clicking icon does nothing
- Popup appears blank
- JavaScript errors in popup
```

**Solutions**:
1. Check popup.html file path in manifest
2. Verify popup.js syntax
3. Test popup in isolation
4. Check for CSS conflicts

### Debug Mode

Enable detailed logging by adding to any script:

```javascript
// Enable debug mode
const DEBUG = true;

function debugLog(message, data = null) {
  if (DEBUG) {
    console.log(`🐛 DEBUG: ${message}`, data);
  }
}

// Usage
debugLog('Function called', { url: currentUrl, timestamp: Date.now() });
```

### Performance Monitoring

Monitor extension performance:

```javascript
// Add to background.js
function monitorPerformance() {
  const startTime = performance.now();
  
  // Your function here
  
  const endTime = performance.now();
  console.log(`⏱️ Operation took ${endTime - startTime} milliseconds`);
}
```

### Error Reporting

Implement error tracking:

```javascript
// Global error handler
window.addEventListener('error', (event) => {
  console.error('🚨 Extension Error:', {
    message: event.message,
    filename: event.filename,
    lineno: event.lineno,
    colno: event.colno,
    error: event.error
  });
});
```

## 🗺️ Roadmap

### Phase 1: Foundation ✅ COMPLETED
- ✅ Basic extension structure
- ✅ URL monitoring and logging
- ✅ Popup interface
- ✅ Local storage implementation
- ✅ **Backend API server with Express.js**
- ✅ **Google Web Risk API integration**
- ✅ **Dual-project cost optimization architecture**
- ✅ **Local hash database (6,144 hashes)**
- ✅ **API Guard for billing protection**
- ✅ **Comprehensive testing suite**

### Phase 2: Enhanced Security ✅ COMPLETED
- ✅ **Advanced phishing detection with Google Web Risk**
- ✅ **Real-time threat database (Google's)**
- ✅ **Hybrid scanning strategy (local + API)**
- ✅ **Automatic database updates**
- 🔄 Custom security rules (In Progress)
- 🔄 Whitelist/blacklist management (Planned)
- 🔄 Enhanced UI with threat details (Planned)

### Phase 3: Advanced Features (Current - Q1 2025)
- 🔄 **Production deployment on cloud platform**
- 🔄 **Chrome Web Store submission**
- 🔄 Multi-browser support (Firefox, Edge)
- 🔄 Enhanced reporting and analytics dashboard
- 🔄 User accounts and sync
- 🔄 Advanced settings panel
- 🔄 Dark mode UI

### Phase 4: AI Enhancement (Future - Q2 2025)
- 🔮 AI-powered content analysis
- 🔮 Natural language processing for phishing detection
- 🔮 Behavioral pattern recognition
- 🔮 Predictive threat modeling
- 🔮 Machine learning for local threat detection

### Phase 5: Enterprise Features (Future - Q3 2025)
- 🔮 Enterprise management console
- 🔮 Team collaboration features
- 🔮 Advanced API for third-party integrations
- 🔮 Custom deployment options
- 🔮 Mobile companion app
- 🔮 SIEM integration

### Recently Completed Features

| Feature | Status | Completed |
|---------|--------|-----------|
| Google Web Risk API integration | ✅ Done | January 2025 |
| Dual-project cost optimization | ✅ Done | January 2025 |
| Local hash database | ✅ Done | January 2025 |
| Backend API server | ✅ Done | January 2025 |
| API Guard protection | ✅ Done | January 2025 |
| Comprehensive test suite | ✅ Done | January 2025 |
| Demo and documentation | ✅ Done | January 2025 |

### Feature Requests

Current feature requests and their status:

| Feature | Priority | Status | ETA |
|---------|----------|--------|-----|
| Chrome Web Store submission | High | In Progress | Q1 2025 |
| Dark mode UI | Medium | Planned | Q1 2025 |
| Export scan history | Low | Planned | Q2 2025 |
| Custom alert sounds | Low | Considering | TBD |
| Firefox support | High | Planned | Q2 2025 |
| Advanced settings | Medium | Planned | Q1 2025 |
| Cloud deployment | High | In Progress | Q1 2025 |

## 🤝 Contributing

We welcome contributions to UNSCAMMED.AI! Here's how you can help:

### Getting Started

1. **Fork the Repository**
   ```bash
   git fork https://github.com/your-username/unscammed-ai-extension.git
   cd unscammed-ai-extension
   ```

2. **Create Feature Branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

3. **Make Changes**
   - Follow the code style guidelines
   - Add tests for new functionality
   - Update documentation as needed

4. **Test Thoroughly**
   - Load extension in Chrome
   - Test all affected functionality
   - Verify no regressions

5. **Submit Pull Request**
   - Clear description of changes
   - Reference any related issues
   - Include testing instructions

### Development Guidelines

- **Code Quality**: Maintain high code quality with clear comments
- **Testing**: All new features must include tests
- **Documentation**: Update README and inline docs
- **Performance**: Consider performance impact of changes
- **Security**: Security-related changes require extra review

### Areas for Contribution

- 🔍 **Security Analysis**: Improve threat detection algorithms
- 🎨 **UI/UX**: Enhance user interface and experience
- 📚 **Documentation**: Improve guides and documentation
- 🧪 **Testing**: Add comprehensive test coverage
- 🌐 **Localization**: Add support for multiple languages
- 🔧 **Performance**: Optimize extension performance

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Chrome Extension development community
- Security research community
- Open source contributors
- Beta testers and early adopters

## 📞 Support

- **Issues**: [GitHub Issues](https://github.com/your-username/unscammed-ai-extension/issues)
- **Discussions**: [GitHub Discussions](https://github.com/your-username/unscammed-ai-extension/discussions)
- **Email**: support@unscammed.ai
- **Documentation**: [Wiki](https://github.com/your-username/unscammed-ai-extension/wiki)

---

**Made with ❤️ for a safer internet**

*UNSCAMMED.AI - Protecting users from online threats, one website at a time.*