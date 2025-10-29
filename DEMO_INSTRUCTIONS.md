# UNSCAMMED.AI Demo Instructions
## Google Web Risk API Integration - Proof of Concept

This guide will help you demonstrate the working Google Web Risk API integration to your founders.

---

## 🚀 Quick Start (3 Steps)

### Step 1: Start the API Server

Open Terminal and run:

```bash
cd "/Users/raghavsingla/Documents/trae_projects/UNSCAMMED AI BROWSER EXTENSION"
node server.js
```

You should see:
```
✅ Service account loaded successfully
🚀 UNSCAMMED.AI API Server running on http://localhost:3000
🛡️ Using Google Web Risk API with service account
```

**Keep this terminal window open!** The server must be running for the extension to work.

---

### Step 2: Load Extension in Chrome

1. Open **Chrome** and go to: `chrome://extensions/`

2. Enable **"Developer mode"** (toggle in top-right corner)

3. Click **"Load unpacked"**

4. Navigate to and select the folder:
   ```
   /Users/raghavsingla/Documents/trae_projects/UNSCAMMED AI BROWSER EXTENSION
   ```

5. The **UNSCAMMED.AI** extension should now appear in your extensions list

---

### Step 3: Test the Extension

#### Test 1: Safe Website (Google)
1. Go to: **https://google.com**
2. Click the **UNSCAMMED.AI** extension icon in Chrome toolbar
3. Click **"Scan This Site"** button
4. **Expected Result:** ✅ "No threats detected by Google Web Risk"

#### Test 2: Malicious Website (Google's Test URL)
1. Go to: **http://testsafebrowsing.appspot.com/s/malware.html**
2. Click the **UNSCAMMED.AI** extension icon
3. Click **"Scan This Site"** button
4. **Expected Result:** 🚨 "Threats detected: MALWARE (Google Web Risk)"

#### Test 3: More Test URLs
- **Social Engineering:** http://testsafebrowsing.appspot.com/s/phishing.html
- **Unwanted Software:** http://testsafebrowsing.appspot.com/s/unwanted.html
- **Safe Site:** https://github.com

---

## 📊 What the Founders Will See

1. **Visual Popup Interface:**
   - Current site displayed
   - Security status indicator
   - "Scan This Site" button
   - Total scans counter

2. **Real-time Scanning:**
   - "Scanning..." indicator appears
   - Google Web Risk API is called
   - Results displayed within 1-2 seconds

3. **Color-Coded Results:**
   - 🟢 **Green**: No threats (safe)
   - 🟡 **Yellow**: Medium threats
   - 🔴 **Red**: High threats (malicious)

4. **On-Page Notifications:**
   - Small notification appears on the webpage showing scan results
   - Auto-dismisses after 5 seconds

---

## 🎯 Demo Script for Founders

**"Let me show you our Google Web Risk API integration working in real-time..."**

1. **Show the server running:**
   ```bash
   node server.js
   # Point out: "This is our local API server authenticating with Google Cloud"
   ```

2. **Scan a safe site (Google):**
   - Open google.com
   - Click extension icon
   - Click "Scan This Site"
   - **Say:** "See how it instantly verifies this is a safe site using Google's database"

3. **Scan a malicious site:**
   - Open http://testsafebrowsing.appspot.com/s/malware.html
   - Scan it
   - **Say:** "Watch how it detects this malicious URL in real-time. This is Google's official test URL for malware"

4. **Show the API logs in terminal:**
   - Switch back to terminal running server.js
   - **Say:** "You can see each scan request and the threat detection results logged here"

5. **Explain the architecture:**
   - "Extension → Local API Server → Google Cloud Web Risk API"
   - "We use OAuth2 service account authentication for enterprise-grade security"
   - "Response time under 2 seconds per scan"

---

## 🛠️ Technical Architecture

```
Chrome Extension (content.js)
         ↓
    fetch POST
         ↓
Local API Server (server.js:3000)
         ↓
   OAuth2 JWT Token
         ↓
Google Web Risk API
         ↓
   Threat Detection Results
         ↓
Display in Extension Popup
```

**Key Components:**

1. **`server.js`**: Express server handling Google Cloud authentication
2. **`content.js`**: Extension script that calls the API
3. **`popup.js`**: UI displaying scan results
4. **Service Account**: Google Cloud credentials for API access

---

## 📝 Troubleshooting

### Extension not working?
- **Check server is running:** Terminal should show "API Server running"
- **Reload extension:** Go to `chrome://extensions/` and click the refresh icon
- **Check browser console:** Right-click extension popup → Inspect → Check for errors

### API errors?
- **Service account:** Verify `us-visa-scheduler-eb815f4e381b.json` exists in project folder
- **API enabled:** Ensure Web Risk API is enabled in Google Cloud Console
- **Permissions:** Check service account has Web Risk API permissions

### Server won't start?
```bash
# Install dependencies
npm install

# Try again
node server.js
```

---

## 🎨 Customization for Demo

Want to impress the founders more? Try these:

### 1. Change the timeout
Edit `server.js` line 12 to make scans faster (but less reliable):
```javascript
const TIMEOUT_MS = 5000; // Faster scanning
```

### 2. Add logging
The terminal already shows all scans. Watch it during the demo!

### 3. Test multiple sites quickly
Create a test script:
```bash
# Test multiple URLs
curl -X POST http://localhost:3000/scan -H "Content-Type: application/json" -d '{"url":"https://google.com"}'
curl -X POST http://localhost:3000/scan -H "Content-Type: application/json" -d '{"url":"http://testsafebrowsing.appspot.com/s/malware.html"}'
```

---

## ✅ Success Checklist

Before the demo, verify:

- [ ] Server starts without errors
- [ ] Extension loads in Chrome
- [ ] Safe site scan shows "No threats"
- [ ] Malicious site scan shows "Threats detected"
- [ ] Results appear in 1-2 seconds
- [ ] Terminal logs show API calls
- [ ] On-page notifications appear

---

## 📞 Support

If you encounter issues:
1. Check the terminal for error messages
2. Check Chrome DevTools console (right-click extension → Inspect)
3. Verify Google Cloud API is enabled and service account has permissions

---

## 🚀 Next Steps After Demo

Once founders approve:

1. **Deploy to production:**
   - Move API server to cloud (AWS, GCP, Heroku)
   - Add HTTPS/SSL certificates
   - Set up monitoring and logging

2. **Enhance features:**
   - Auto-scan on every page load
   - Threat database caching
   - User notification preferences
   - Scan history and statistics

3. **Security hardening:**
   - API rate limiting
   - Request validation
   - Error handling improvements

---

**Good luck with your demo! 🎉**
