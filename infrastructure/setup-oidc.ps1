#!/usr/bin/env pwsh

<#+
Sets up Azure AD app + service principal + federated credential for GitHub OIDC.
Outputs AZURE_CLIENT_ID, AZURE_TENANT_ID, AZURE_SUBSCRIPTION_ID for GitHub secrets.
#>

param(
    [Parameter(Mandatory = $true)]
    [string]$Owner,

    [Parameter(Mandatory = $true)]
    [string]$Repo,

    [Parameter()]
    [string]$Branch = 'main',

    [Parameter()]
    [switch]$AllBranches,

    [Parameter()]
    [switch]$PullRequest,

    [Parameter()]
    [string]$EnvironmentName,

    [Parameter()]
    [string]$ProjectName = 'bni-aperionetoone',

    [Parameter()]
    [string]$Environment = 'prod',

    [Parameter()]
    [string]$Location = 'westeurope',

    [Parameter()]
    [string]$SubscriptionId,

    [Parameter()]
    [string]$ResourceGroup
)

$ErrorActionPreference = 'Stop'

function Write-Info {
    param([string]$Message)
    Write-Host "[INFO] $Message" -ForegroundColor Green
}

function Write-ErrorMessage {
    param([string]$Message)
    Write-Host "[ERROR] $Message" -ForegroundColor Red
}

function Ensure-AzLogin {
    if (-not (Get-Command az -ErrorAction SilentlyContinue)) {
        Write-ErrorMessage "Azure CLI is not installed. Please install it first."
        exit 1
    }

    try {
        az account show --only-show-errors | Out-Null
    } catch {
        Write-ErrorMessage "Not logged in to Azure. Please run 'az login' first."
        exit 1
    }
}

Ensure-AzLogin

if (-not $SubscriptionId) {
    $SubscriptionId = az account show --query id -o tsv
}

if (-not $ResourceGroup) {
    $ResourceGroup = "$ProjectName-$Environment-rg"
}

$tenantId = az account show --query tenantId -o tsv
$appName = "$Repo-oidc-$Environment"

Write-Info "Creating app registration..."
$app = az ad app create --display-name $appName --sign-in-audience AzureADMyOrg --query "{appId:appId,id:id}" -o json | ConvertFrom-Json

Write-Info "Creating service principal..."
az ad sp create --id $app.appId --only-show-errors | Out-Null

$sp = az ad sp show --id $app.appId --query "{id:id,appId:appId}" -o json | ConvertFrom-Json

$subject = if ($EnvironmentName) {
    "repo:$Owner/$Repo:environment:$EnvironmentName"
} elseif ($PullRequest) {
    "repo:$Owner/$Repo:pull_request"
} elseif ($AllBranches) {
    "repo:$Owner/$Repo:ref:refs/heads/*"
} else {
    "repo:$Owner/$Repo:ref:refs/heads/$Branch"
}

$federatedCredential = @{
    name        = "github-oidc"
    issuer      = "https://token.actions.githubusercontent.com"
    subject     = $subject
    description = "GitHub Actions OIDC"
    audiences   = @("api://AzureADTokenExchange")
} | ConvertTo-Json -Depth 5

$tempFile = [System.IO.Path]::GetTempFileName()
$federatedCredential | Set-Content -Path $tempFile -Encoding UTF8

Write-Info "Adding federated credential..."
az ad app federated-credential create --id $app.id --parameters $tempFile | Out-Null
Remove-Item $tempFile -Force

$scope = "/subscriptions/$SubscriptionId/resourceGroups/$ResourceGroup"

Write-Info "Assigning Contributor role at scope: $scope"
az role assignment create --assignee-object-id $sp.id --assignee-principal-type ServicePrincipal --role Contributor --scope $scope --only-show-errors | Out-Null

Write-Host ""
Write-Info "=== GitHub Secrets ==="
Write-Host "AZURE_CLIENT_ID=$($app.appId)"
Write-Host "AZURE_TENANT_ID=$tenantId"
Write-Host "AZURE_SUBSCRIPTION_ID=$SubscriptionId"
Write-Host ""
Write-Info "Federated subject: $subject"
Write-Info "Resource Group: $ResourceGroup"
Write-Info "Location: $Location"
