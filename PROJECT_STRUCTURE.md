# UNSCAMMED AI - Clean Project Structure

## Overview
Dual-project Google Web Risk API implementation with cost optimization.

## Project Structure

```
UNSCAMMED AI BROWSER EXTENSION/
│
├── Core Server Files
│   ├── server-dual.js              # Main dual-project server (PORT 3000)
│   ├── package.json                # Dependencies and scripts
│   └── package-lock.json           # Locked dependencies
│
├── API Modules (lib/)
│   ├── webrisk-update-api.js       # Project A: Update API (computeDiff)
│   ├── webrisk-lookup-api.js       # Project B: Lookup API (uris:search)
│   └── api-guard.js                # Prevents cross-project contamination
│
├── Configuration
│   ├── .env                        # Environment variables (SECRET)
│   ├── .env.example                # Template for .env
│   └── secrets/
│       └── project-a-service-account.json  # Service account key (SECRET)
│
├── Chrome Extension
│   ├── manifest.json               # Extension manifest
│   ├── background.js               # Background service worker
│   ├── content.js                  # Content script
│   ├── popup/                      # Extension popup UI
│   │   ├── popup.html
│   │   ├── popup.css
│   │   └── popup.js
│   ├── icons/                      # Extension icons
│   └── utils/                      # Utility functions
│
├── Scripts
│   ├── setup-automated.sh          # Automated GCP project setup
│   ├── verify-api-usage.sh         # Verify which APIs are being used
│   ├── demo-dual-projects.sh       # Interactive demo script
│   └── test-dual-projects.js       # Comprehensive test suite
│
└── Documentation
    ├── README.md                   # Original project readme
    ├── DEMO_GUIDE.md               # Complete demonstration guide
    └── PROJECT_STRUCTURE.md        # This file
```

## Quick Start

### 1. Start the Server
```bash
npm start
```

### 2. Run Tests
```bash
npm test
```

### 3. Run Demo
```bash
./scripts/demo-dual-projects.sh
```

### 4. Verify API Usage
```bash
./verify-api-usage.sh
```

## Key Files Explained

### server-dual.js
Main server implementing hybrid dual-project strategy:
- Checks Project A local hash database first (FREE)
- Falls back to Project B Lookup API if needed (FREE < 10k/month)
- Runs on port 3000

### lib/webrisk-update-api.js
Project A client for Update API:
- Calls `threatLists.computeDiff` to download hash prefixes
- Maintains local database of 6,144 hashes
- Updates every ~30 minutes
- **Always FREE**

### lib/webrisk-lookup-api.js
Project B client for Lookup API:
- Calls `uris:search` for real-time URL verification
- Only used when URL not in local database
- **FREE for first 10,000 queries/month**

### lib/api-guard.js
Enforces method whitelisting:
- Project A can ONLY call: `computeDiff`, `hashes.search`
- Project B can ONLY call: `uris:search`
- Prevents accidental cross-contamination

## API Endpoints

### POST /scan
Scan a URL for threats
```bash
curl -X POST http://localhost:3000/scan \
  -H "Content-Type: application/json" \
  -d '{"url":"https://example.com"}'
```

### GET /stats/database
Get Project A hash database statistics
```bash
curl http://localhost:3000/stats/database
```

### GET /stats/usage
Get Project B Lookup API usage statistics
```bash
curl http://localhost:3000/stats/usage
```

### GET /health
Server health check
```bash
curl http://localhost:3000/health
```

## Environment Variables

Required in `.env`:
```bash
# Project A (Hash Database)
PROJECT_A_SERVICE_ACCOUNT_PATH=./secrets/project-a-service-account.json
PROJECT_A_PROJECT_ID=unscammed-hashdb-1761749611

# Project B (Lookup API)
PROJECT_B_API_KEY=your_api_key_here
PROJECT_B_PROJECT_ID=unscammed-lookup-1761749611

# Feature Flags
USE_DUAL_PROJECT_MODE=true
ENABLE_LOCAL_HASH_DB=true
ENABLE_API_GUARD=true
```

## Google Cloud Projects

### Project A: unscammed-hashdb-1761749611
- **API**: Web Risk Update API
- **Methods**: `threatLists.computeDiff`
- **Cost**: $0.00 (always free)
- **Console**: https://console.cloud.google.com/apis/dashboard?project=unscammed-hashdb-1761749611

### Project B: unscammed-lookup-1761749611
- **API**: Web Risk Lookup API
- **Methods**: `uris:search`
- **Cost**: $0.00 for first 10k queries/month
- **Console**: https://console.cloud.google.com/apis/dashboard?project=unscammed-lookup-1761749611

## Chrome Extension Integration

The extension connects to the server at `http://localhost:3000/scan`.

To use:
1. Start server: `npm start`
2. Load extension in Chrome (chrome://extensions)
3. Extension automatically scans URLs in real-time

## Testing

### Run Full Test Suite
```bash
npm test
```

Tests include:
- Configuration validation
- API Guard enforcement
- Project A hash database update
- Project B Lookup API
- Cost verification
- Usage statistics

### Manual Testing
```bash
# Test malicious URL (should hit Project A)
curl -X POST http://localhost:3000/scan \
  -H "Content-Type: application/json" \
  -d '{"url":"http://testsafebrowsing.appspot.com/s/malware.html"}'

# Test safe URL (should use Project B)
curl -X POST http://localhost:3000/scan \
  -H "Content-Type: application/json" \
  -d '{"url":"https://github.com"}'
```

## Cost Analysis

**Current Usage:**
- Project A: 6,144 hashes downloaded → $0.00
- Project B: 1/10,000 queries → $0.00
- **Total: $0.00**

**Projected for 50,000 scans/month:**
- 40,000 caught by Project A (80%) → $0.00
- 10,000 verified by Project B (20%) → $0.00
- **Total: $0.00/month**

## Files Removed (Cleanup)

The following redundant files were removed:
- `server.js` (old single-project server)
- `server.js.backup`
- `setup-dual-projects.sh` (replaced by setup-automated.sh)
- `fix-permissions.sh` (no longer needed)
- `DEMO_INSTRUCTIONS.md` (consolidated into DEMO_GUIDE.md)
- `IMPLEMENTATION_SUMMARY.md` (redundant)
- `QUICK_START.txt` (consolidated)
- `README-DUAL-PROJECT.md` (consolidated)
- `SETUP_INSTRUCTIONS.md` (consolidated)
- `WORKING_STATUS.md` (outdated)
- `scripts/check-billing.sh` (can use GCP console)
- `scripts/monthly-report.js` (use stats API instead)
- IDE folders: `.idea/`, `.trae/`, `.zencoder/`
- `venv/` (Python virtual environment)
- `docs/` (old documentation)
- `us-visa-scheduler-eb815f4e381b.json` (unrelated service account)

## Support

For issues or questions:
- See [DEMO_GUIDE.md](DEMO_GUIDE.md) for complete demonstration guide
- Check server logs for detailed API call information
- Verify API usage with `./verify-api-usage.sh`

---

**Status**: ✅ Production Ready
**Cost**: $0.00/month (up to 50k scans)
**Last Updated**: October 29, 2025
