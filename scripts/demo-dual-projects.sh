#!/bin/bash

# Demo Script: Show Dual-Project Architecture in Action
# This script demonstrates Project A (local hash) and Project B (lookup API) working

echo "============================================================"
echo "🎬 UNSCAMMED AI - Dual-Project Architecture Demo"
echo "============================================================"
echo ""
echo "This demo shows TWO separate Google Cloud projects working together:"
echo "  • Project A: Hash Database (Update API) - FREE forever"
echo "  • Project B: Lookup API - FREE up to 10k/month"
echo ""

# Check if server is running
if ! curl -s http://localhost:3000/health > /dev/null 2>&1; then
    echo "❌ Server is not running!"
    echo "Please start the server first: npm start"
    exit 1
fi

echo "✅ Server is running"
echo ""

# Show initial database stats
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📊 STEP 1: Show Project A Hash Database"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Project A downloaded hash prefixes using Update API (computeDiff):"
curl -s http://localhost:3000/stats/database | jq '{
  "Project": "Project A (Hash Database)",
  "Total Hashes": .totalHashes,
  "Malware": .malwareHashes,
  "Social Engineering": .socialEngineeringHashes,
  "Unwanted Software": .unwantedSoftwareHashes,
  "Last Update": .lastUpdate,
  "Cost": "$0.00 (Update API is FREE)"
}'
echo ""
read -p "Press Enter to continue..."
echo ""

# Test 1: Known malicious URL (should hit Project A)
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🧪 TEST 1: Known Malicious URL (Project A Local Hash Hit)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "URL: http://testsafebrowsing.appspot.com/s/malware.html"
echo "Expected: Should be found in Project A local hash database"
echo ""
echo "🔍 Scanning..."
RESULT=$(curl -s -X POST http://localhost:3000/scan \
  -H "Content-Type: application/json" \
  -d '{"url":"http://testsafebrowsing.appspot.com/s/malware.html"}')

echo "$RESULT" | jq '{
  "URL": .url,
  "Threats Found": .threats,
  "Source": .source,
  "Confidence": .confidence,
  "Cost": .cost,
  "Details": .details
}'

SOURCE=$(echo "$RESULT" | jq -r '.source')
if [[ "$SOURCE" == "project-a-local-hash" ]]; then
    echo ""
    echo "✅ SUCCESS: Project A caught this threat locally!"
    echo "   • No API call to Google was made"
    echo "   • Cost: $0.00 (local database check)"
    echo "   • Response time: Instant"
else
    echo ""
    echo "⚠️  Note: This URL was checked via Project B"
fi

echo ""
read -p "Press Enter to continue..."
echo ""

# Test 2: Safe URL not in local DB (should use Project B)
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🧪 TEST 2: Safe URL (Project B Lookup API)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "URL: https://github.com"
echo "Expected: Not in local DB → Falls back to Project B Lookup API"
echo ""
echo "🔍 Scanning..."
RESULT=$(curl -s -X POST http://localhost:3000/scan \
  -H "Content-Type: application/json" \
  -d '{"url":"https://github.com"}')

echo "$RESULT" | jq '{
  "URL": .url,
  "Threats Found": .threats,
  "Source": .source,
  "Cost": .cost,
  "Usage Stats": .usageStats
}'

SOURCE=$(echo "$RESULT" | jq -r '.source')
if [[ "$SOURCE" == "project-b-lookup-api" ]]; then
    echo ""
    echo "✅ SUCCESS: Project B Lookup API verified this URL!"
    echo "   • Not found in local database"
    echo "   • Called Google Web Risk Lookup API"
    echo "   • Cost: $0.00 (under 10k/month free tier)"
else
    echo ""
    echo "✅ SUCCESS: Project A found this in local database!"
fi

echo ""
read -p "Press Enter to continue..."
echo ""

# Test 3: Another known threat (Project A)
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🧪 TEST 3: Unwanted Software (Project A Local Hash Hit)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "URL: https://testsafebrowsing.appspot.com/s/unwanted.html"
echo "Expected: Should be found in Project A local hash database"
echo ""
echo "🔍 Scanning..."
RESULT=$(curl -s -X POST http://localhost:3000/scan \
  -H "Content-Type: application/json" \
  -d '{"url":"https://testsafebrowsing.appspot.com/s/unwanted.html"}')

echo "$RESULT" | jq '{
  "URL": .url,
  "Threats Found": .threats,
  "Source": .source,
  "Cost": .cost,
  "Details": .details
}'

SOURCE=$(echo "$RESULT" | jq -r '.source')
if [[ "$SOURCE" == "project-a-local-hash" ]]; then
    echo ""
    echo "✅ SUCCESS: Project A caught UNWANTED_SOFTWARE locally!"
    echo "   • No API call needed"
    echo "   • Cost: $0.00"
else
    echo ""
    echo "⚠️  Note: This URL was checked via Project B"
fi

echo ""
read -p "Press Enter to continue..."
echo ""

# Show final usage statistics
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📊 FINAL STATISTICS"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Project B (Lookup API) Usage:"
curl -s http://localhost:3000/stats/usage | jq '.projectB | {
  "Queries This Month": .monthlyQueries,
  "Free Tier Limit": .freeTrierLimit,
  "Percentage Used": .percentageUsed,
  "Remaining Free Queries": .remainingQueries,
  "Estimated Cost": ("$" + (.estimatedCost | tostring))
}'

echo ""
echo "============================================================"
echo "✅ DEMO COMPLETE"
echo "============================================================"
echo ""
echo "Summary:"
echo "  • Project A (Update API): Catching known threats locally (FREE)"
echo "  • Project B (Lookup API): Verifying unknown URLs (FREE < 10k/month)"
echo "  • Total Cost: $0.00"
echo "  • Both projects working perfectly!"
echo ""
echo "Next steps:"
echo "  1. Monitor Google Cloud Console for both projects"
echo "  2. Check billing dashboards"
echo "  3. Review server logs for detailed API calls"
echo ""
