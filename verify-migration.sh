#!/bin/bash

# Verification script to check migration completion

echo "🔍 Verifying Migration from Spark to Azure..."
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

PASSED=0
FAILED=0

# Function to check
check() {
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✓${NC} $1"
        ((PASSED++))
    else
        echo -e "${RED}✗${NC} $1"
        ((FAILED++))
    fi
}

# 1. Check Spark removal
echo "📦 Checking Spark Dependencies..."
! grep -q "@github/spark" package.json
check "Spark package removed from package.json"

! [ -f "spark.meta.json" ]
check "spark.meta.json removed"

! [ -f "runtime.config.json" ]
check "runtime.config.json removed"

! [ -f ".spark-initial-sha" ]
check ".spark-initial-sha removed"

! grep -q "@github/spark" src/main.tsx
check "Spark imports removed from main.tsx"

! grep -q "sparkPlugin" vite.config.ts
check "Spark plugin removed from vite.config.ts"

echo ""

# 2. Check new files
echo "🆕 Checking New Files..."
[ -f "src/hooks/useAzureStorage.ts" ]
check "useAzureStorage hook created"

[ -f "infrastructure/main.bicep" ]
check "Main Bicep template created"

[ -f "infrastructure/modules/staticwebapp.bicep" ]
check "Static Web App module created"

[ -f "infrastructure/modules/storageaccount.bicep" ]
check "Storage Account module created"

[ -f "infrastructure/deploy.sh" ] && [ -x "infrastructure/deploy.sh" ]
check "Deployment script (bash) created and executable"

[ -f "infrastructure/deploy.ps1" ]
check "Deployment script (pwsh) created"

[ -f ".github/workflows/azure-static-web-apps.yml" ]
check "GitHub Actions workflow created"

[ -f "staticwebapp.config.json" ]
check "Static Web App config created"

[ -f ".env.example" ]
check "Environment example created"

[ -f "eslint.config.js" ]
check "ESLint config created"

echo ""

# 3. Check documentation
echo "📚 Checking Documentation..."
[ -f "README.md" ] && grep -q "Azure" README.md
check "README updated with Azure instructions"

[ -f "DEPLOYMENT.md" ]
check "Deployment guide created"

[ -f "DEVELOPMENT.md" ]
check "Development guide created"

[ -f "MIGRATION_SUMMARY.md" ]
check "Migration summary created"

echo ""

# 4. Check components updated
echo "🔄 Checking Components Updated..."
grep -q "useAzureStorage" src/App.tsx && ! grep -q "useKV" src/App.tsx
check "App.tsx updated to use useAzureStorage"

grep -q "useAzureStorage" src/components/AddMeeting.tsx && ! grep -q "useKV" src/components/AddMeeting.tsx
check "AddMeeting.tsx updated"

grep -q "useAzureStorage" src/components/SummaryByRound.tsx && ! grep -q "useKV" src/components/SummaryByRound.tsx
check "SummaryByRound.tsx updated"

grep -q "useAzureStorage" src/components/SummaryByPerson.tsx && ! grep -q "useKV" src/components/SummaryByPerson.tsx
check "SummaryByPerson.tsx updated"

grep -q "useAzureStorage" src/components/PaymentTracker.tsx && ! grep -q "useKV" src/components/PaymentTracker.tsx
check "PaymentTracker.tsx updated"

echo ""

# 5. Check build
echo "🔨 Checking Build..."
[ -d "node_modules" ]
check "Node modules installed"

if command -v npm &> /dev/null; then
    npm run build &> /dev/null
    check "Application builds successfully"
else
    echo -e "${YELLOW}⚠${NC} npm not found, skipping build test"
fi

echo ""

# 6. Summary
echo "================================"
echo "Migration Verification Summary"
echo "================================"
echo -e "${GREEN}Passed: $PASSED${NC}"
if [ $FAILED -gt 0 ]; then
    echo -e "${RED}Failed: $FAILED${NC}"
    echo ""
    echo "❌ Migration verification failed!"
    exit 1
else
    echo -e "${GREEN}Failed: 0${NC}"
    echo ""
    echo "✅ Migration verification passed!"
    echo ""
    echo "Next steps:"
    echo "1. Review DEPLOYMENT.md for deployment instructions"
    echo "2. Run: cd infrastructure && ./deploy.sh (bash)"
    echo "   or:  cd infrastructure && ./deploy.ps1 (pwsh)"
    echo "3. Configure GitHub secrets and Azure environment variables"
    echo "4. Push to main branch to trigger deployment"
    exit 0
fi
