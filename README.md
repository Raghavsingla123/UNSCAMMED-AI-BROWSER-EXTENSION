# 🛡️ UNSCAMMED.AI Chrome Extension

[![Chrome Extension](https://img.shields.io/badge/Chrome-Extension-green.svg)](https://chrome.google.com/webstore)
[![Manifest V3](https://img.shields.io/badge/Manifest-V3-blue.svg)](https://developer.chrome.com/docs/extensions/mv3/)
[![JavaScript](https://img.shields.io/badge/JavaScript-Vanilla-yellow.svg)](https://developer.mozilla.org/en-US/docs/Web/JavaScript)
[![License](https://img.shields.io/badge/License-MIT-red.svg)](LICENSE)

> **Browser Shield** - Real-time phishing detection and website security analysis

UNSCAMMED.AI is a production-grade Chrome browser extension designed to provide real-time phishing detection and website security analysis. The extension serves as a foundational security layer that monitors user browsing activity and provides instant feedback on potentially malicious websites.

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

UNSCAMMED.AI targets everyday internet users who need protection from phishing attacks, malicious websites, and online scams. It provides a seamless browsing experience while maintaining robust security monitoring in the background.

### Key Benefits

- **Real-time Protection**: Automatic scanning of every website you visit
- **Instant Feedback**: Immediate security status in your browser
- **Privacy-First**: All analysis happens locally in your browser
- **Lightweight**: No external dependencies or heavy frameworks
- **Developer-Friendly**: Clean, maintainable code structure

## ✨ Features

### 🔍 Core Security Features

- **Automatic URL Monitoring**: Logs and analyzes every page navigation
- **Real-time Threat Detection**: Identifies phishing and malicious websites
- **Manual Security Scans**: On-demand analysis via popup interface
- **Domain Reputation Analysis**: Evaluates website trustworthiness
- **Security Status Display**: Visual indicators for website safety

### 🎨 User Interface

- **Clean Popup Design**: Minimalistic interface with red accent branding
- **Security Dashboard**: Current website status and scan results
- **One-Click Scanning**: Manual scan trigger for enhanced analysis
- **Extension Statistics**: Track total scans and security events

### 🔧 Technical Features

- **Manifest V3 Compliance**: Latest Chrome extension standards
- **Service Worker Architecture**: Efficient background processing
- **Message Passing System**: Seamless component communication
- **Local Storage**: Secure data persistence without external servers
- **Error Handling**: Robust error management and logging

## 🏗️ Architecture

### System Overview

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Popup UI      │    │  Background     │    │  Content        │
│   (popup.html)  │◄──►│  Service Worker │◄──►│  Script         │
│                 │    │  (background.js)│    │  (content.js)   │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Chrome APIs   │    │  Local Storage  │    │   Web Page      │
│   (tabs, etc.)  │    │   (security     │    │   (DOM access)  │
│                 │    │    data)        │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### Component Interaction Flow

1. **User Navigation**: Browser navigates to a new page
2. **Background Detection**: Service worker detects navigation event
3. **URL Logging**: Background script logs the visited URL
4. **Content Injection**: Content script analyzes the page
5. **Security Analysis**: Utils perform domain and content checks
6. **Result Storage**: Scan results stored in local storage
7. **UI Update**: Popup displays current security status

## 🚀 Quick Start

### Prerequisites

- Google Chrome browser (version 88+)
- Developer mode enabled in Chrome extensions

### 3-Step Installation

1. **Download Extension**
   ```bash
   git clone https://github.com/your-username/unscammed-ai-extension.git
   cd unscammed-ai-extension
   ```

2. **Load in Chrome**
   - Open Chrome and go to `chrome://extensions/`
   - Enable "Developer mode" (toggle in top-right)
   - Click "Load unpacked" and select the project folder

3. **Verify Installation**
   - Look for the 🛡️ UNSCAMMED.AI icon in your toolbar
   - Visit any website to trigger automatic scanning
   - Click the extension icon to open the popup

## 📦 Installation

### Method 1: Load Unpacked (Development)

1. **Enable Developer Mode**
   ```
   1. Open Chrome
   2. Navigate to chrome://extensions/
   3. Toggle "Developer mode" in the top-right corner
   ```

2. **Load Extension**
   ```
   1. Click "Load unpacked"
   2. Select the UNSCAMMED AI BROWSER EXTENSION folder
   3. Extension should appear in your extensions list
   ```

3. **Pin Extension** (Optional)
   ```
   1. Click the puzzle piece icon in Chrome toolbar
   2. Find UNSCAMMED.AI in the list
   3. Click the pin icon to keep it visible
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
├── 📄 manifest.json              # Extension configuration
├── 🔧 background.js              # Service worker (background processing)
├── 📜 content.js                 # Content script (page analysis)
├── 📁 popup/
│   ├── 🎨 popup.html            # Popup interface structure
│   ├── 🎨 popup.css             # Styling (red accent theme)
│   └── ⚡ popup.js              # Popup functionality
├── 📁 utils/
│   └── 🔍 urlCheck.js           # Security analysis utilities
├── 📁 icons/
│   ├── 🖼️ icon16.svg            # 16x16 extension icon
│   ├── 🖼️ icon48.svg            # 48x48 extension icon
│   └── 🖼️ icon128.svg           # 128x128 extension icon
├── 📁 .trae/
│   └── 📁 documents/
│       ├── 📋 UNSCAMMED_AI_Product_Requirements.md
│       └── 🏗️ UNSCAMMED_AI_Technical_Architecture.md
└── 📖 README.md                  # This file
```

### File Descriptions

| File | Purpose | Size | Dependencies |
|------|---------|------|--------------|
| `manifest.json` | Extension configuration and permissions | ~1KB | None |
| `background.js` | Service worker for background processing | ~8KB | Chrome APIs |
| `content.js` | Page analysis and security scanning | ~6KB | utils/urlCheck.js |
| `popup.html` | User interface structure | ~2KB | popup.css, popup.js |
| `popup.css` | Styling and visual design | ~3KB | None |
| `popup.js` | User interaction and messaging | ~5KB | Chrome APIs |
| `utils/urlCheck.js` | Security analysis algorithms | ~4KB | None |

## 🛠️ Development

### Development Commands

Since this extension uses vanilla JavaScript without build tools, development is straightforward:

```bash
# View project structure
show structure

# Open specific files for editing
open manifest.json
open background.js
open popup/popup.html

# Rebuild extension (if needed)
rebuild

# Test extension functionality
test extension
```

### Code Style Guidelines

1. **JavaScript Standards**
   - Use ES2020+ features
   - Consistent camelCase naming
   - Clear function documentation
   - Error handling for all async operations

2. **File Organization**
   - One main function per file
   - Clear separation of concerns
   - Minimal dependencies between components

3. **Chrome Extension Best Practices**
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

### Phase 1: Foundation (Current)
- ✅ Basic extension structure
- ✅ URL monitoring and logging
- ✅ Simple security analysis
- ✅ Popup interface
- ✅ Local storage implementation

### Phase 2: Enhanced Security (Next)
- 🔄 Advanced phishing detection algorithms
- 🔄 Machine learning integration
- 🔄 Real-time threat database
- 🔄 Custom security rules
- 🔄 Whitelist/blacklist management

### Phase 3: AI Integration (Future)
- 🔮 AI-powered threat analysis
- 🔮 Natural language processing for content analysis
- 🔮 Behavioral pattern recognition
- 🔮 Predictive threat modeling
- 🔮 Cloud-based intelligence (optional)

### Phase 4: Advanced Features (Future)
- 🔮 Multi-browser support
- 🔮 Enterprise management console
- 🔮 API for third-party integrations
- 🔮 Advanced reporting and analytics
- 🔮 Mobile companion app

### Feature Requests

Current feature requests and their status:

| Feature | Priority | Status | ETA |
|---------|----------|--------|-----|
| Dark mode UI | Medium | Planned | Q2 2024 |
| Export scan history | Low | Planned | Q3 2024 |
| Custom alert sounds | Low | Considering | TBD |
| Firefox support | High | Planned | Q2 2024 |
| Advanced settings | Medium | In Progress | Q1 2024 |

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