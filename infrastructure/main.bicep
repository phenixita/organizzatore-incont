// Main Bicep template for Organizzatore Incontri Azure deployment
// This creates all resources needed to host the Static Web App with Azure Storage

@description('Name of the project (used as prefix for resources)')
param projectName string = 'orgincont'

@description('Azure region for resources')
param location string = resourceGroup().location

@description('Environment name (dev, staging, prod)')
@allowed([
  'dev'
  'staging'
  'prod'
])
param environment string = 'dev'

@description('Tags to apply to all resources')
param tags object = {
  Project: 'Organizzatore Incontri'
  Environment: environment
  ManagedBy: 'Bicep'
}

// Generate unique names for resources
var uniqueSuffix = uniqueString(resourceGroup().id)
var staticWebAppName = '${projectName}-${environment}-${uniqueSuffix}'
var storageAccountName = take('${replace(projectName, '-', '')}${environment}${replace(uniqueSuffix, '-', '')}', 24)
var containerName = 'app-data'

// Storage Account for application data
module storage 'modules/storageaccount.bicep' = {
  name: 'storage-deployment'
  params: {
    storageAccountName: storageAccountName
    location: location
    containerName: containerName
    tags: tags
  }
}

// Static Web App for hosting the frontend
module staticWebApp 'modules/staticwebapp.bicep' = {
  name: 'staticwebapp-deployment'
  params: {
    staticWebAppName: staticWebAppName
    location: location
    tags: tags
    appSettings: {
      VITE_AZURE_STORAGE_ACCOUNT: storage.outputs.storageAccountName
      VITE_AZURE_STORAGE_CONTAINER: storage.outputs.containerName
      VITE_AZURE_STORAGE_SAS: '?${storage.outputs.containerSas}'
    }
  }
}

// Outputs for easy access to deployment information
output staticWebAppUrl string = staticWebApp.outputs.staticWebAppUrl
output staticWebAppName string = staticWebApp.outputs.staticWebAppName
output storageAccountName string = storage.outputs.storageAccountName
output storageContainerName string = storage.outputs.containerName
output storageAccountId string = storage.outputs.storageAccountId
output storageContainerSas string = storage.outputs.containerSas

// Instructions for post-deployment configuration
output deploymentInstructions string = '''
Deployment completed successfully!

Next steps:
1. Configure GitHub repository secret for Static Web App deployment token:
  - Add it to GitHub as: AZURE_STATIC_WEB_APPS_API_TOKEN

2. For local development, create/update a .env.local file with:
  - VITE_AZURE_STORAGE_ACCOUNT=${storageAccountName}
  - VITE_AZURE_STORAGE_CONTAINER=${containerName}
  - VITE_AZURE_STORAGE_SAS=?${storage.outputs.containerSas}

Your Static Web App URL: https://${staticWebAppName}.azurestaticapps.net
'''
