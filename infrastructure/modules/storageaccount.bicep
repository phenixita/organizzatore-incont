// Storage Account module for application data storage

@description('Name of the storage account')
param storageAccountName string

@description('Azure region for the storage account')
param location string

@description('Name of the blob container for app data')
param containerName string

@description('Tags to apply to resources')
param tags object

@description('SAS expiry timestamp in ISO 8601 format (UTC). Defaults to one year from deployment time.')
param sasExpiry string = dateTimeAdd(utcNow(), 'P1Y')

// Storage Account
resource storageAccount 'Microsoft.Storage/storageAccounts@2023-01-01' = {
  name: storageAccountName
  location: location
  tags: tags
  sku: {
    name: 'Standard_LRS' // Locally-redundant storage (cheapest option)
  }
  kind: 'StorageV2'
  properties: {
    accessTier: 'Hot'
    allowBlobPublicAccess: true // Required for SAS token access
    minimumTlsVersion: 'TLS1_2'
    supportsHttpsTrafficOnly: true
    allowSharedKeyAccess: true
    networkAcls: {
      defaultAction: 'Allow'
      bypass: 'AzureServices'
    }
  }
}

// Blob Service
resource blobService 'Microsoft.Storage/storageAccounts/blobServices@2023-01-01' = {
  parent: storageAccount
  name: 'default'
  properties: {
    cors: {
      corsRules: [
        {
          allowedOrigins: [
            '*' // In production, restrict this to your Static Web App domain
          ]
          allowedMethods: [
            'GET'
            'PUT'
            'POST'
            'DELETE'
            'HEAD'
            'OPTIONS'
          ]
          allowedHeaders: [
            '*'
          ]
          exposedHeaders: [
            '*'
          ]
          maxAgeInSeconds: 3600
        }
      ]
    }
  }
}

// Blob Container for app data
resource container 'Microsoft.Storage/storageAccounts/blobServices/containers@2023-01-01' = {
  parent: blobService
  name: containerName
  properties: {
    publicAccess: 'None' // Access via SAS token only
  }
}

// Generate a container-scoped SAS token (valid until the configured expiry)
var containerSas = storageAccount.listServiceSas('2023-01-01', {
  canonicalizedResource: '/blob/${storageAccount.name}/${containerName}'
  signedResource: 'c'
  signedPermission: 'racwdl'
  signedProtocol: 'https'
  signedExpiry: sasExpiry
}).serviceSasToken

// Outputs
output storageAccountName string = storageAccount.name
output storageAccountId string = storageAccount.id
output containerName string = container.name
output primaryEndpoint string = storageAccount.properties.primaryEndpoints.blob
output containerSas string = containerSas
