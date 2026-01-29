# Concurrent Access Design

This document explains how the application handles concurrent access when multiple users interact with the shared meetings data simultaneously.

## Problem Statement

The original implementation used a simple read-modify-write pattern without any concurrency control. This could lead to:

- **Lost Updates**: When two users edit simultaneously, the second write would overwrite the first without warning
- **Stale Data**: Users wouldn't see changes made by others until they refreshed manually
- **Race Conditions**: No mechanism to detect or prevent conflicting modifications

## Solution: Optimistic Concurrency Control with ETags

### Overview

We've implemented optimistic concurrency control using Azure Storage's built-in ETag (Entity Tag) support. This allows the application to:

1. **Detect conflicts** when multiple users try to update the same data
2. **Automatically retry** with the latest data when conflicts occur
3. **Refresh data periodically** to show updates from other users
4. **Notify users** when external changes are detected

### How It Works

#### 1. ETag-Based Concurrency

Every blob in Azure Storage has an ETag - a unique identifier that changes with each modification:

- **On Read**: We capture the ETag when fetching data
- **On Write**: We send the ETag with `If-Match` header
- **Conflict Detection**: If the ETag doesn't match (412 Precondition Failed), we know someone else modified the data

```typescript
// Simplified example
const response = await fetch(url, {
  method: "PUT",
  headers: {
    "If-Match": cachedEtag,  // Only succeed if ETag matches
    "Content-Type": "application/json"
  },
  body: JSON.stringify(value)
})

if (response.status === 412) {
  // Conflict! Refresh and retry
}
```

#### 2. Automatic Retry with Exponential Backoff

When a conflict is detected, the system:

1. Fetches the latest data from the server
2. Waits a short time (exponential backoff: 100ms, 200ms, 400ms)
3. Retries the operation with fresh data
4. Repeats up to 3 times before failing

This handles most temporary conflicts automatically without user intervention.

#### 3. Periodic Refresh

For shared data like the meetings list, we use `useAzureStorageWithRefresh` hook that:

- Polls the server every 30 seconds (configurable)
- Checks if the server's ETag differs from our cached version
- Automatically refreshes and updates the UI when changes are detected
- Shows a visual notification when external updates occur

```typescript
const [meetings, setMeetings, hasExternalUpdate] = useAzureStorageWithRefresh<Meeting[]>(
  "meetings",
  [],
  30000  // Poll every 30 seconds
)
```

## Infrastructure Changes

### Blob Storage CORS Configuration

Updated CORS rules to expose ETag headers:

```bicep
exposedHeaders: [
  'etag'
  'x-ms-*'
  'ETag'
  '*'
]
```

This allows the browser to access ETag values from API responses.

### Azure Table Storage (Future Enhancement)

Added Azure Table Storage infrastructure for future use:

- Tables provide better support for concurrent operations
- Built-in optimistic concurrency with ETags
- More granular control over individual records

Currently, the app uses Blob Storage with ETags, but can be migrated to Tables for improved scalability.

## Usage Patterns

### Regular Data (Settings, Config)

Use the standard `useAzureStorage` hook:

```typescript
const [eventTitle, setEventTitle] = useAzureStorage<string>("event-title", "Default Title")
```

This provides basic caching and persistence without the overhead of periodic refreshing.

### Shared Data (Meetings List)

Use `useAzureStorageWithRefresh` for data that multiple users modify:

```typescript
const [meetings, setMeetings, hasExternalUpdate] = useAzureStorageWithRefresh<Meeting[]>(
  "meetings",
  [],
  30000  // Refresh every 30 seconds
)

// Show notification when external updates detected
{hasExternalUpdate && (
  <Badge variant="outline" className="animate-pulse">
    <ArrowsClockwise size={14} />
    Dati aggiornati
  </Badge>
)}
```

## Testing Concurrent Access

To test the concurrent access features:

1. **Open Multiple Browser Tabs**
   - Open the app in 2+ browser tabs or windows
   - Make changes in different tabs simultaneously

2. **Test Conflict Detection**
   - Add a meeting in Tab 1
   - Add a different meeting in Tab 2 (same round)
   - Both should succeed (no direct conflict)

3. **Test Automatic Refresh**
   - Add a meeting in Tab 1
   - Wait up to 30 seconds
   - Tab 2 should show the "Dati aggiornati" badge
   - The meeting should appear in Tab 2

4. **Test Conflict Resolution**
   - Disable network in Tab 1
   - Add a meeting in Tab 2
   - Re-enable network in Tab 1
   - Try to add a meeting in Tab 1
   - Tab 1 should refresh and show Tab 2's changes

## Performance Considerations

### Caching Strategy

- **In-Memory Cache**: Reduces redundant network requests
- **ETag-Based Validation**: Only fetches full data when changed
- **HEAD Requests**: For refresh checks (minimal data transfer)

### Polling Interval

The default 30-second polling interval balances:

- **Responsiveness**: Users see changes within 30 seconds
- **Performance**: Minimal impact on server and client
- **Cost**: Reduces API call volume to Azure Storage

Adjust based on your needs:
- **More Real-Time**: Use 10-15 seconds
- **Less Frequent**: Use 60-120 seconds
- **On-Demand**: Call refresh manually instead of polling

### Exponential Backoff

Prevents retry storms when many users conflict:

- First retry: 100ms wait
- Second retry: 200ms wait
- Third retry: 400ms wait

This gives time for other operations to complete while limiting total retry time to ~700ms.

## Future Enhancements

### 1. WebSocket/SignalR Integration

For true real-time updates:
- Push notifications when data changes
- No polling delay
- Lower server load

### 2. Operational Transformation (OT)

For fine-grained merge conflict resolution:
- Merge non-conflicting changes automatically
- Only require user input for true conflicts

### 3. Azure Table Storage Migration

Benefits:
- Better performance for large datasets
- More granular concurrency control
- Query capabilities for filtering/sorting

### 4. Optimistic UI Updates

Show changes immediately while syncing in background:
- Instant feedback for users
- Rollback on conflict
- Better user experience

## Troubleshooting

### "Failed to save after 3 attempts"

**Cause**: Persistent conflicts or network issues

**Solution**:
1. Refresh the page to get latest data
2. Check network connectivity
3. Try again after a few seconds

### Changes Not Appearing

**Cause**: Polling interval not elapsed or CORS misconfiguration

**Solution**:
1. Wait for next refresh cycle (up to 30 seconds)
2. Manually refresh the page
3. Check browser console for CORS errors
4. Verify ETag headers are exposed in Azure Storage CORS settings

### Frequent "Dati aggiornati" Notifications

**Cause**: High activity from multiple users

**Solution**:
- This is normal behavior when many users are active
- Consider increasing polling interval if too distracting
- Implement notification aggregation/debouncing

## Security Considerations

### SAS Token Permissions

The Blob Storage SAS token includes:
- `r` - Read
- `a` - Add
- `c` - Create
- `w` - Write
- `d` - Delete
- `l` - List

These are necessary for full CRUD operations. In production, consider:

- Using Azure AD authentication instead of SAS tokens
- Scoping tokens to specific resources
- Rotating tokens regularly (current: 1 year expiry)

### CORS Configuration

Current CORS allows all origins (`*`). In production:

1. Restrict to your Static Web App domain
2. Limit exposed headers to only what's needed
3. Consider additional security headers

## References

- [Azure Storage ETags](https://docs.microsoft.com/en-us/rest/api/storageservices/specifying-conditional-headers-for-blob-service-operations)
- [Optimistic Concurrency Control](https://en.wikipedia.org/wiki/Optimistic_concurrency_control)
- [HTTP Conditional Requests](https://developer.mozilla.org/en-US/docs/Web/HTTP/Conditional_requests)
