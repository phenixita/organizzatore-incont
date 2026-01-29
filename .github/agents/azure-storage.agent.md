---
description: 'Work with Azure Blob Storage persistence via useAzureStorage hook'
tools: ['vscode', 'execute', 'read', 'agent', 'edit', 'search', 'web', 'todo']
---

# Azure Storage Integration Instructions

You are in Azure Storage mode. Your primary objective is to implement and troubleshoot data persistence using the Azure Blob Storage key-value pattern. Follow this structured process:

## Phase 1: Understanding the Storage Architecture

1. **Review the Storage Hook**:
   - Core implementation: [src/hooks/useAzureStorage.ts](src/hooks/useAzureStorage.ts)
   - Uses `AzureStorageService` singleton with in-memory cache
   - Each key stored as `<key>.json` blob in Azure container
   - Auto-creates missing blobs with default value on 404

2. **Environment Configuration**:
   - `VITE_AZURE_STORAGE_ACCOUNT` - Storage account name
   - `VITE_AZURE_STORAGE_CONTAINER` - Container name (default: `app-data`)
   - `VITE_AZURE_STORAGE_SAS` - SAS token with `racwdl` permissions
   - Without these, fallback behavior varies (check console for debug logs)

## Phase 2: Implementing Storage

3. **Hook Usage Pattern**:
   ```tsx
   import { useAzureStorage } from "@/hooks/useAzureStorage"
   
   // Generic type T defines the data shape
   const [value, setValue] = useAzureStorage<T>("storage-key", defaultValue)
   
   // Functional updates preserve reactivity
   setValue((current) => [...current, newItem])
   ```

4. **Existing Storage Keys** (do not duplicate):
   - `event-title`: string - Event display title
   - `event-description`: string - Event subtitle
   - `event-date`: string - Event date display
   - `meetings`: Meeting[] - All scheduled meetings array

## Phase 3: Troubleshooting

5. **Debug Storage Issues**:
   - Check browser DevTools > Network for `blob.core.windows.net` requests
   - HTTP 403: SAS token invalid/expired - regenerate with `az storage container generate-sas`
   - HTTP 404: Normal for new keys - hook auto-creates blob
   - CORS errors: Verify storage account CORS allows `*` origins or your domain

6. **Local Development**:
   - Without Azure config, hook still initializes but blob operations will fail
   - Use DevTools Console to inspect: `console.debug("Environment variables:", import.meta.env)`
   - Can mock data via localStorage for offline development

## Phase 4: Best Practices

7. **Data Design Guidelines**:
   - Use stable, descriptive key names (kebab-case)
   - Define TypeScript types in [src/lib/types.ts](src/lib/types.ts)
   - Provide sensible defaults that allow app to function before data loads
   - Keep blob payloads under 1MB for performance

8. **Final Report**:
   - Document new storage keys and their types
   - Explain data flow and update triggers
   - Note any caching considerations

## Azure Storage Guidelines
- **Cache Invalidation**: Hook caches reads; call `setValue` to update both cache and blob
- **Concurrent Access**: No locking - last write wins; suitable for single-user scenario
- **Error Handling**: Hook logs errors to console but doesn't throw; check for undefined/default values
- **SAS Expiry**: Tokens expire; see [DEPLOYMENT.md](DEPLOYMENT.md) for renewal commands
- **Blob Format**: Always JSON; Content-Type set to `application/json`

Remember: The hook returns `defaultValue` while loading - design UI to handle this gracefully.
