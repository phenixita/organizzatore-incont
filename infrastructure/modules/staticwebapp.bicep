// Static Web App module for hosting the frontend application

@description('Name of the Static Web App')
param staticWebAppName string

@description('Azure region for the Static Web App')
param location string

@description('Tags to apply to resources')
param tags object

@description('SKU for the Static Web App')
@allowed([
  'Free'
  'Standard'
])
param sku string = 'Free'

@description('Application settings for the Static Web App')
param appSettings object = {}

// Static Web App resource
resource staticWebApp 'Microsoft.Web/staticSites@2023-01-01' = {
  name: staticWebAppName
  location: location
  tags: tags
  sku: {
    name: sku
    tier: sku
  }
  properties: {
    buildProperties: {
      appLocation: '/'
      apiLocation: ''
      outputLocation: 'dist'
    }
    stagingEnvironmentPolicy: 'Enabled'
    allowConfigFileUpdates: true
    provider: 'GitHub'
  }
}

// Apply app settings (idempotent)
resource staticWebAppSettings 'Microsoft.Web/staticSites/config@2023-01-01' = {
  parent: staticWebApp
  name: 'appsettings'
  properties: appSettings
}

// Outputs
output staticWebAppName string = staticWebApp.name
output staticWebAppId string = staticWebApp.id
output staticWebAppUrl string = 'https://${staticWebApp.properties.defaultHostname}'
