#!/usr/bin/env pwsh

<#+
Deployment script for Organizzatore Incontri Azure infrastructure
This script deploys all Azure resources using Bicep templates
Compatible with PowerShell Core (pwsh) on Windows/macOS/Linux
#>

param(
    [string]$ProjectName = 'orgincont',
    [string]$Environment = 'dev',
    [string]$Location = 'westeurope'
)

$ErrorActionPreference = 'Stop'

# Colorized output helpers
function Write-Info {
    param([string]$Message)
    Write-Host "[INFO] $Message" -ForegroundColor Green
}

function Write-ErrorMessage {
    param([string]$Message)
    Write-Host "[ERROR] $Message" -ForegroundColor Red
}

function Write-WarningMessage {
    param([string]$Message)
    Write-Host "[WARNING] $Message" -ForegroundColor Yellow
}

# Check if Azure CLI is installed
if (-not (Get-Command az -ErrorAction SilentlyContinue)) {
    Write-ErrorMessage "Azure CLI is not installed. Please install it first."
    exit 1
}

# Check if user is logged in
try {
    az account show --only-show-errors | Out-Null
} catch {
    Write-ErrorMessage "Not logged in to Azure. Please run 'az login' first."
    exit 1
}

$ResourceGroup = "$ProjectName-$Environment-rg"

Write-Info "Starting deployment..."
Write-Info "Project Name: $ProjectName"
Write-Info "Environment: $Environment"
Write-Info "Location: $Location"
Write-Info "Resource Group: $ResourceGroup"

# Create resource group if it doesn't exist (idempotent)
Write-Info "Ensuring resource group exists..."
az group create `
    --name $ResourceGroup `
    --location $Location `
    --tags "Project=Organizzatore Incontri" "Environment=$Environment" "ManagedBy=Bicep" `
    --only-show-errors | Out-Null

# Deploy the main Bicep template
Write-Info "Deploying Azure resources..."
$templateFile = "$(Split-Path -Parent $MyInvocation.MyCommand.Path)/main.bicep" 
$deploymentJson = az deployment group create `
    --resource-group $ResourceGroup `
    --template-file $templateFile `
    --parameters projectName=$ProjectName environment=$Environment location=$Location `
    --output json `
    --only-show-errors

if ($LASTEXITCODE -eq 0) {
    Write-Info "Deployment completed successfully!"

    $deploymentOutput = $deploymentJson | ConvertFrom-Json

    $staticWebAppName = $deploymentOutput.properties.outputs.staticWebAppName.value
    $staticWebAppUrl = $deploymentOutput.properties.outputs.staticWebAppUrl.value
    $staticWebAppDeploymentToken = $deploymentOutput.properties.outputs.staticWebAppDeploymentToken.value
    $storageAccountName = $deploymentOutput.properties.outputs.storageAccountName.value
    $storageContainerName = $deploymentOutput.properties.outputs.storageContainerName.value
    $storageContainerSas = $deploymentOutput.properties.outputs.storageContainerSas.value

    Write-Host ""
    Write-Info "=== Deployment Summary ==="
    Write-Host "Static Web App Name: $staticWebAppName"
    Write-Host "Static Web App URL: $staticWebAppUrl"
    Write-Host "Storage Account: $storageAccountName"
    Write-Host "Storage Container: $storageContainerName"
    Write-Host "Storage SAS: ?$storageContainerSas"
    Write-Host ""

    Write-Host ""
    Write-Info "=== Post-Deployment Configuration (Automated) ==="
    Write-Host ""

    Write-WarningMessage "1. Add this GitHub secret to your repository (manual step):"
    Write-Host "   Secret Name: AZURE_STATIC_WEB_APPS_API_TOKEN"
    Write-Host "   Secret Value: $staticWebAppDeploymentToken"
    Write-Host ""

    Write-Info "2. For local development, create/update a .env.local file with:"
    Write-Host "VITE_AZURE_STORAGE_ACCOUNT=$storageAccountName"
    Write-Host "VITE_AZURE_STORAGE_CONTAINER=$storageContainerName"
    Write-Host "VITE_AZURE_STORAGE_SAS=?$storageContainerSas"
    Write-Host ""
} else {
    Write-ErrorMessage "Deployment failed!"
    exit 1
}

Write-Info "Done!"
