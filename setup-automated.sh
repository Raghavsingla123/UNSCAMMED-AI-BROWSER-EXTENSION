#!/bin/bash
# setup-automated.sh
# Fully automated dual-project setup with fixed IAM permissions

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

clear

cat << "EOF"
╔══════════════════════════════════════════════════════════════╗
║        UNSCAMMED AI - AUTOMATED DUAL-PROJECT SETUP           ║
║                    (Fully Automated)                         ║
╚══════════════════════════════════════════════════════════════╝

EOF

echo -e "${BLUE}This script will:${NC}"
echo "  1. Create two Google Cloud projects"
echo "  2. Enable Web Risk API for both"
echo "  3. Configure service account with proper permissions"
echo "  4. Generate .env configuration"
echo "  5. Run tests automatically"
echo ""
echo -e "${YELLOW}⚠️  You will need to:${NC}"
echo "  • Approve billing account linking (2 browser windows)"
echo "  • Create an API key for Project B (1 browser window)"
echo ""
echo -e "${GREEN}Press Enter to start or Ctrl+C to cancel...${NC}"
read

# Step 1: Check prerequisites
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📋 Step 1/8: Checking prerequisites"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if ! command -v gcloud &> /dev/null; then
    echo -e "${RED}❌ gcloud CLI not found${NC}"
    echo "Install: brew install google-cloud-sdk"
    exit 1
fi

if ! gcloud auth list --filter=status:ACTIVE --format="value(account)" | grep -q "@"; then
    echo -e "${RED}❌ Not authenticated with gcloud${NC}"
    echo "Run: gcloud auth login"
    exit 1
fi

GCLOUD_ACCOUNT=$(gcloud auth list --filter=status:ACTIVE --format="value(account)" | head -1)
echo -e "${GREEN}✅ Authenticated as: ${GCLOUD_ACCOUNT}${NC}"

# Generate unique project IDs
TIMESTAMP=$(date +%s)
PROJECT_A_ID="unscammed-hashdb-${TIMESTAMP}"
PROJECT_B_ID="unscammed-lookup-${TIMESTAMP}"

echo ""
echo "Project IDs:"
echo "  • Project A (Hash DB): ${PROJECT_A_ID}"
echo "  • Project B (Lookup):  ${PROJECT_B_ID}"

# Step 2: Create Project A
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📦 Step 2/8: Creating Project A (Hash Database)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

gcloud projects create ${PROJECT_A_ID} \
    --name="UNSCAMMED Hash Database" \
    --labels=component=hash-database,environment=production

echo -e "${GREEN}✅ Project A created${NC}"

# Step 3: Link billing for Project A
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "💳 Step 3/8: Link Billing for Project A"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

echo -e "${YELLOW}⚠️  Opening browser to link billing account...${NC}"
echo ""
echo "In the browser window:"
echo "  1. Select or create Billing Account #1"
echo "  2. Click 'Set Account'"
echo "  3. Wait for confirmation"
echo "  4. Return here and press Enter"
echo ""

# Open billing link
open "https://console.cloud.google.com/billing/linkedaccount?project=${PROJECT_A_ID}" 2>/dev/null || \
    echo "Open manually: https://console.cloud.google.com/billing/linkedaccount?project=${PROJECT_A_ID}"

read -p "Press Enter after linking billing account..."

echo -e "${GREEN}✅ Billing linked for Project A${NC}"

# Step 4: Enable API and create service account for Project A
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🔌 Step 4/8: Configure Project A"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

echo "Enabling Web Risk API..."
gcloud services enable webrisk.googleapis.com --project=${PROJECT_A_ID}
echo -e "${GREEN}✅ Web Risk API enabled${NC}"

echo ""
echo "Creating service account..."
SERVICE_ACCOUNT_NAME="webrisk-update-api"
SERVICE_ACCOUNT_EMAIL="${SERVICE_ACCOUNT_NAME}@${PROJECT_A_ID}.iam.gserviceaccount.com"

gcloud iam service-accounts create ${SERVICE_ACCOUNT_NAME} \
    --display-name="Web Risk Update API Service Account" \
    --project=${PROJECT_A_ID}

echo -e "${GREEN}✅ Service account created${NC}"

echo ""
echo "Granting permissions (Editor role for full access)..."
gcloud projects add-iam-policy-binding ${PROJECT_A_ID} \
    --member="serviceAccount:${SERVICE_ACCOUNT_EMAIL}" \
    --role="roles/editor" \
    --condition=None

echo -e "${GREEN}✅ Permissions granted${NC}"

echo ""
echo "Creating service account key..."
mkdir -p secrets
KEYFILE_A="secrets/project-a-service-account.json"

gcloud iam service-accounts keys create ${KEYFILE_A} \
    --iam-account=${SERVICE_ACCOUNT_EMAIL} \
    --project=${PROJECT_A_ID}

echo -e "${GREEN}✅ Service account key saved: ${KEYFILE_A}${NC}"

# Step 5: Create Project B
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📦 Step 5/8: Creating Project B (URL Lookup)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

gcloud projects create ${PROJECT_B_ID} \
    --name="UNSCAMMED URL Lookup" \
    --labels=component=url-lookup,environment=production

echo -e "${GREEN}✅ Project B created${NC}"

# Step 6: Link billing for Project B
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "💳 Step 6/8: Link Billing for Project B"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

echo -e "${YELLOW}⚠️  Opening browser to link billing account...${NC}"
echo ""
echo -e "${RED}IMPORTANT: Use a DIFFERENT billing account than Project A!${NC}"
echo ""
echo "In the browser window:"
echo "  1. Select or create Billing Account #2 (different from Project A)"
echo "  2. Click 'Set Account'"
echo "  3. Wait for confirmation"
echo "  4. Return here and press Enter"
echo ""

# Open billing link
open "https://console.cloud.google.com/billing/linkedaccount?project=${PROJECT_B_ID}" 2>/dev/null || \
    echo "Open manually: https://console.cloud.google.com/billing/linkedaccount?project=${PROJECT_B_ID}"

read -p "Press Enter after linking billing account..."

echo -e "${GREEN}✅ Billing linked for Project B${NC}"

# Enable API for Project B
echo ""
echo "Enabling Web Risk API for Project B..."
gcloud services enable webrisk.googleapis.com --project=${PROJECT_B_ID}
echo -e "${GREEN}✅ Web Risk API enabled for Project B${NC}"

# Step 7: Create API key for Project B
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🔑 Step 7/8: Create API Key for Project B"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

echo -e "${YELLOW}⚠️  Opening browser to create API key...${NC}"
echo ""
echo "In the browser window:"
echo "  1. Click 'Create Credentials' → 'API Key'"
echo "  2. Click 'Edit API Key' (optional but recommended)"
echo "  3. Under 'API restrictions', select 'Restrict key'"
echo "  4. Check ONLY 'Web Risk API'"
echo "  5. Click 'Save'"
echo "  6. Copy the API key"
echo "  7. Return here and paste it"
echo ""

# Open credentials page
open "https://console.cloud.google.com/apis/credentials?project=${PROJECT_B_ID}" 2>/dev/null || \
    echo "Open manually: https://console.cloud.google.com/apis/credentials?project=${PROJECT_B_ID}"

echo ""
read -p "Paste your Project B API key here: " PROJECT_B_API_KEY

if [ -z "$PROJECT_B_API_KEY" ]; then
    echo -e "${RED}❌ No API key provided${NC}"
    exit 1
fi

echo -e "${GREEN}✅ API key received${NC}"

# Step 8: Generate .env file
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📝 Step 8/8: Generating Configuration"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

cat > .env << EOF
# UNSCAMMED AI - Dual Project Configuration
# Generated on: $(date)

# ============================================
# PROJECT A: Hash Database (Update API)
# ============================================
PROJECT_A_SERVICE_ACCOUNT_PATH=./secrets/project-a-service-account.json
PROJECT_A_PROJECT_ID=${PROJECT_A_ID}

# ============================================
# PROJECT B: URL Lookup (Lookup API)
# ============================================
PROJECT_B_API_KEY=${PROJECT_B_API_KEY}
PROJECT_B_PROJECT_ID=${PROJECT_B_ID}

# ============================================
# Feature Flags
# ============================================
USE_DUAL_PROJECT_MODE=true
ENABLE_LOCAL_HASH_DB=true
ENABLE_API_GUARD=true

# ============================================
# Monitoring & Alerts
# ============================================
COST_ALERT_THRESHOLD_USD=10
MONTHLY_SCAN_LIMIT=9000
LOG_ALL_API_CALLS=true

# ============================================
# Performance
# ============================================
HASH_DB_UPDATE_INTERVAL_HOURS=1
API_TIMEOUT_MS=10000
PORT=3000
EOF

echo -e "${GREEN}✅ .env file created${NC}"

# Final summary
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🎉 SETUP COMPLETE!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Project Details:"
echo "  📦 Project A: ${PROJECT_A_ID}"
echo "  📦 Project B: ${PROJECT_B_ID}"
echo ""
echo "Credentials:"
echo "  🔐 Service Account: ${KEYFILE_A}"
echo "  🔑 API Key: ${PROJECT_B_API_KEY:0:20}..."
echo ""
echo "Configuration:"
echo "  📝 .env file created"
echo ""
echo "Next Steps:"
echo ""
echo "  1️⃣  Run tests:"
echo "      ${GREEN}npm test${NC}"
echo ""
echo "  2️⃣  Start server:"
echo "      ${GREEN}npm start${NC}"
echo ""
echo "  3️⃣  Monitor billing (CRITICAL!):"
echo "      ${GREEN}./scripts/check-billing.sh${NC}"
echo ""
echo "Monitoring URLs:"
echo "  📊 Project A: https://console.cloud.google.com/home/dashboard?project=${PROJECT_A_ID}"
echo "  📊 Project B: https://console.cloud.google.com/home/dashboard?project=${PROJECT_B_ID}"
echo "  💰 Billing:   https://console.cloud.google.com/billing"
echo ""
echo -e "${YELLOW}⚠️  IMPORTANT: Monitor Project B billing daily for first week!${NC}"
echo -e "${YELLOW}    Project B should show \$0.00 if under 10k queries/month${NC}"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
