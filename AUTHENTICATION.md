# Authentication and Event Attendance System

## Overview

The application now requires authentication for all users and implements a dynamic event attendance system. Users must authenticate via Azure Static Web Apps authentication (using Google OAuth) and then join the event to participate.

## Key Changes

### 1. Authentication Required

All routes now require authentication except for the authentication endpoints themselves:

```json
{
  "routes": [
    {
      "route": "/.auth/**",
      "allowedRoles": ["anonymous"]
    },
    {
      "route": "/login",
      "allowedRoles": ["anonymous"]
    },
    {
      "route": "/*",
      "allowedRoles": ["authenticated"]
    }
  ]
}
```

When unauthenticated users access the app, they are automatically redirected to Google login.

### 2. New Storage Container

A new dedicated storage container `event-attendance` is used for storing:
- **Attendees**: List of users who joined the event
- **Meetings**: Authenticated meetings between attendees

This is separate from the legacy `app-data` container to avoid conflicts.

### 3. Event Attendance Flow

1. **User authenticates** via Google OAuth
2. **User joins event** by providing their display name
3. **User schedules meetings** with other attendees
4. **User can leave event** which removes all their meetings

### 4. New Data Structures

#### EventAttendee
```typescript
interface EventAttendee {
  userId: string           // Azure Static Web Apps user ID
  userDetails: string      // Email or user identifier
  displayName: string      // User's chosen display name
  joinedAt: string        // ISO timestamp
}
```

#### AuthenticatedMeeting
```typescript
interface AuthenticatedMeeting {
  id: string
  userId1: string         // Azure user ID
  userId2: string         // Azure user ID
  displayName1: string    // Display name for user 1
  displayName2: string    // Display name for user 2
  round: 1 | 2
  createdAt: string
}
```

## New Components

### 1. EventAttendance
- Shows authentication status
- Allows users to join the event with a display name
- Displays number of attendees
- Provides "Leave Event" functionality

### 2. AddAuthenticatedMeeting
- Replaces the old AddMeeting component
- Automatically identifies the current user
- Only shows attendees as meeting partners
- Validates that users haven't already scheduled in the selected round

### 3. AuthenticatedSummaryByRound
- Shows all meetings organized by round
- Uses authenticated meeting data

### 4. AuthenticatedSummaryByPerson
- Shows meetings filtered by person
- Only displays attendees in the dropdown

## Hooks

### useAuth()
Fetches user information from Azure Static Web Apps `/.auth/me` endpoint:

```typescript
const { user, isLoading, error, isAuthenticated } = useAuth()
```

Returns:
- `user`: UserInfo object with userId, userDetails, identityProvider, userRoles
- `isLoading`: Boolean indicating if auth check is in progress
- `error`: Any error that occurred
- `isAuthenticated`: Boolean indicating if user is authenticated

### useEventAttendance()
Similar to useAzureStorage but targets the `event-attendance` container:

```typescript
const [attendees, setAttendees, isLoading] = useEventAttendance<EventAttendee[]>("attendees", [])
```

Returns:
- Current value
- Setter function
- Loading state

## Azure Configuration

### Environment Variables

The following environment variables must be configured in Azure Static Web App settings:

- `VITE_AZURE_STORAGE_ACCOUNT`: Your Azure Storage account name
- `VITE_AZURE_STORAGE_SAS`: SAS token with read/write permissions

### Storage Container

Create a new container named `event-attendance` in your Azure Storage account with the following permissions via SAS token:
- Read (r)
- Add (a)
- Create (c)
- Write (w)
- Delete (d)
- List (l)

### Authentication Setup

Azure Static Web Apps provides built-in authentication. No additional configuration is needed beyond the `staticwebapp.config.json` file.

Users can authenticate via:
- Google (configured as default)
- Azure Active Directory
- GitHub
- Twitter/X
- Facebook

Access the different providers at:
- `/.auth/login/google`
- `/.auth/login/aad`
- `/.auth/login/github`
- etc.

## User Flow

1. **User visits app** → Automatically redirected to Google login if not authenticated
2. **User logs in** → Redirected back to app
3. **User sees "Partecipazione" tab** → Must join event first
4. **User joins event** → Provides display name
5. **User can now schedule meetings** → Only with other attendees
6. **User can view summaries** → See all scheduled meetings
7. **User can leave event** → Removes all their meetings and attendance

## Legacy System

The old system with fixed participant list and non-authenticated meetings is still available in the codebase but not used in the UI:
- `AddMeeting.tsx`
- `SummaryByRound.tsx`
- `SummaryByPerson.tsx`
- `PaymentTracker.tsx`

These components use the `app-data` container and the fixed `PARTICIPANTS` array from `types.ts`.

## Migration Notes

**Important**: This is a complete redesign. The old meeting data in `app-data` container is not compatible with the new authenticated system. Both systems can coexist but use separate storage containers.

If you need to migrate existing meetings:
1. Export data from the old system
2. Have users authenticate and join the event
3. Manually recreate meetings in the new system
4. Or write a migration script to map old participant names to authenticated user IDs

## Security Considerations

1. **Authentication is mandatory** - All routes require authentication
2. **User identification** - Users are identified by Azure Static Web Apps user ID
3. **Data isolation** - New container prevents conflicts with legacy data
4. **SAS token security** - Token should have appropriate expiration and permissions
5. **No PII in storage** - Only user IDs and chosen display names are stored

## Troubleshooting

### "Failed to fetch user info"
- Check that `/.auth/me` endpoint is accessible
- Verify user is authenticated
- Check browser console for CORS errors

### "Failed to save/load data"
- Verify SAS token has correct permissions
- Check that `event-attendance` container exists
- Verify storage account name is correct

### "Not attending event" message
- User needs to join event first via "Partecipazione" tab
- Check that attendee was successfully saved

### Users can't see each other
- Verify both users have joined the event
- Check that attendees list is loading correctly
- Verify both users haven't already scheduled in the selected round
