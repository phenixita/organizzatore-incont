#!/bin/bash

# Deployment script for Organizzatore Incontri Azure infrastructure
# This script deploys all Azure resources using Bicep templates

set -e  # Exit on error

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

# Check if Azure CLI is installed
if ! command -v az &> /dev/null; then
    print_error "Azure CLI is not installed. Please install it first."
    exit 1
fi

# Check if user is logged in
if ! az account show &> /dev/null; then
    print_error "Not logged in to Azure. Please run 'az login' first."
    exit 1
fi

# Get parameters from command line or use defaults
PROJECT_NAME="${1:-orgincont}"
ENVIRONMENT="${2:-dev}"
LOCATION="${3:-westeurope}"
RESOURCE_GROUP="${PROJECT_NAME}-${ENVIRONMENT}-rg"

print_status "Starting deployment..."
print_status "Project Name: $PROJECT_NAME"
print_status "Environment: $ENVIRONMENT"
print_status "Location: $LOCATION"
print_status "Resource Group: $RESOURCE_GROUP"

# Create resource group if it doesn't exist
print_status "Creating resource group..."
az group create \
    --name "$RESOURCE_GROUP" \
    --location "$LOCATION" \
    --tags "Project=Organizzatore Incontri" "Environment=$ENVIRONMENT" "ManagedBy=Bicep"

# Deploy the main Bicep template
print_status "Deploying Azure resources..."
DEPLOYMENT_OUTPUT=$(az deployment group create \
    --resource-group "$RESOURCE_GROUP" \
    --template-file infrastructure/main.bicep \
    --parameters projectName="$PROJECT_NAME" environment="$ENVIRONMENT" location="$LOCATION" \
    --output json)

# Check if deployment was successful
if [ $? -eq 0 ]; then
    print_status "Deployment completed successfully!"
    
    # Extract outputs
    STATIC_WEB_APP_NAME=$(echo "$DEPLOYMENT_OUTPUT" | jq -r '.properties.outputs.staticWebAppName.value')
    STATIC_WEB_APP_URL=$(echo "$DEPLOYMENT_OUTPUT" | jq -r '.properties.outputs.staticWebAppUrl.value')
    STORAGE_ACCOUNT_NAME=$(echo "$DEPLOYMENT_OUTPUT" | jq -r '.properties.outputs.storageAccountName.value')
    STORAGE_CONTAINER_NAME=$(echo "$DEPLOYMENT_OUTPUT" | jq -r '.properties.outputs.storageContainerName.value')
    
    echo ""
    print_status "=== Deployment Summary ==="
    echo "Static Web App Name: $STATIC_WEB_APP_NAME"
    echo "Static Web App URL: $STATIC_WEB_APP_URL"
    echo "Storage Account: $STORAGE_ACCOUNT_NAME"
    echo "Storage Container: $STORAGE_CONTAINER_NAME"
    echo ""
    
    # Get Static Web App deployment token
    print_status "Retrieving Static Web App deployment token..."
    DEPLOYMENT_TOKEN=$(az staticwebapp secrets list \
        --name "$STATIC_WEB_APP_NAME" \
        --resource-group "$RESOURCE_GROUP" \
        --query "properties.apiKey" \
        --output tsv)
    
    echo ""
    print_status "=== Post-Deployment Configuration ==="
    echo ""
    print_warning "1. Add this GitHub secret to your repository:"
    echo "   Secret Name: AZURE_STATIC_WEB_APPS_API_TOKEN"
    echo "   Secret Value: $DEPLOYMENT_TOKEN"
    echo ""
    
    print_warning "2. Generate SAS token for Storage Account (valid for 1 year):"
    echo "   Run this command:"
    EXPIRY_DATE=$(date -u -d "1 year" '+%Y-%m-%dT%H:%MZ' 2>/dev/null || date -u -v+1y '+%Y-%m-%dT%H:%MZ' 2>/dev/null)
    echo "   az storage container generate-sas \\"
    echo "     --account-name $STORAGE_ACCOUNT_NAME \\"
    echo "     --name $STORAGE_CONTAINER_NAME \\"
    echo "     --permissions racwdl \\"
    echo "     --expiry $EXPIRY_DATE \\"
    echo "     --auth-mode key \\"
    echo "     --output tsv"
    echo ""
    
    print_warning "3. Configure Static Web App environment variables:"
    echo "   Go to Azure Portal > Static Web App > Configuration > Application settings"
    echo "   Add these variables:"
    echo "     VITE_AZURE_STORAGE_ACCOUNT=$STORAGE_ACCOUNT_NAME"
    echo "     VITE_AZURE_STORAGE_CONTAINER=$STORAGE_CONTAINER_NAME"
    echo "     VITE_AZURE_STORAGE_SAS=?sv=... (from step 2)"
    echo ""
    
    print_status "For local development, create a .env.local file with:"
    echo "VITE_AZURE_STORAGE_ACCOUNT=$STORAGE_ACCOUNT_NAME"
    echo "VITE_AZURE_STORAGE_CONTAINER=$STORAGE_CONTAINER_NAME"
    echo "VITE_AZURE_STORAGE_SAS=?sv=... (from SAS token generation)"
    echo ""
    
else
    print_error "Deployment failed!"
    exit 1
fi

print_status "Done!"
