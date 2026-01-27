# Quick Start Guide - Authenticated Event System

## For End Users

### First Time Setup

1. **Visit the Application**
   - Navigate to your Azure Static Web App URL
   - You'll be automatically redirected to Google login

2. **Authenticate**
   - Sign in with your Google account
   - You'll be redirected back to the application

3. **Join the Event**
   - You'll see the "Partecipazione" (Participation) tab
   - Enter your display name (the name others will see)
   - Click "Iscriviti all'Evento" (Join Event)
   - You're now registered!

### Schedule a Meeting

1. **Go to "Nuovo Incontro" Tab**
   - You'll see your name displayed automatically
   - No need to select "who you are" - the system knows!

2. **Select Round**
   - Choose "Turno 1" (Round 1) or "Turno 2" (Round 2)

3. **Select Meeting Partner**
   - The dropdown will only show other attendees
   - It excludes people already scheduled in that round
   - It excludes yourself

4. **Confirm**
   - Click "Programma Incontro" (Schedule Meeting)
   - You'll see a confirmation message

### View Meetings

**By Round:**
- Go to "Per Turno" tab
- See all meetings organized by round

**By Person:**
- Go to "Per Persona" tab
- Select any attendee from the dropdown
- See all their scheduled meetings

### Leave Event

1. **Go to "Partecipazione" Tab**
2. **Scroll to "Zona Pericolosa" (Danger Zone)**
3. **Click "Rimuovimi dall'Evento" (Remove Me from Event)**
4. **All your meetings will be cancelled automatically**

## For Administrators

### Azure Setup

#### 1. Create Storage Container

In Azure Portal:
1. Navigate to your Storage Account
2. Go to "Containers"
3. Create new container: `event-attendance`
4. Set access level to "Private"

#### 2. Generate SAS Token

```bash
az storage container generate-sas \
  --account-name <your-storage-account> \
  --name event-attendance \
  --permissions racwdl \
  --expiry 2026-12-31 \
  --auth-mode key \
  --output tsv
```

Permissions needed:
- `r` - Read
- `a` - Add
- `c` - Create
- `w` - Write
- `d` - Delete
- `l` - List

#### 3. Configure Static Web App

In Azure Portal:
1. Navigate to your Static Web App
2. Go to "Configuration"
3. Add Application Settings:
   - `VITE_AZURE_STORAGE_ACCOUNT` = your storage account name
   - `VITE_AZURE_STORAGE_SAS` = your SAS token (with `?` prefix)

#### 4. Enable Authentication

Authentication is automatically enabled in Azure Static Web Apps. No additional configuration needed.

Default provider is Google. To change:
1. Update `staticwebapp.config.json`
2. Change redirect URL from `/.auth/login/google` to desired provider
3. Available providers:
   - `/.auth/login/google`
   - `/.auth/login/github`
   - `/.auth/login/aad` (Azure AD)
   - `/.auth/login/twitter`
   - `/.auth/login/facebook`

### Monitoring

#### View Attendees

Storage Explorer or Azure Portal:
- Container: `event-attendance`
- File: `attendees.json`
- Contains array of all users who joined

Example:
```json
[
  {
    "userId": "google-123456789",
    "userDetails": "user@example.com",
    "displayName": "Mario Rossi",
    "joinedAt": "2026-01-27T22:00:00.000Z"
  }
]
```

#### View Meetings

- Container: `event-attendance`
- File: `meetings.json`
- Contains array of all scheduled meetings

Example:
```json
[
  {
    "id": "1737235200000-0.123",
    "userId1": "google-123456789",
    "userId2": "google-987654321",
    "displayName1": "Mario Rossi",
    "displayName2": "Luigi Bianchi",
    "round": 1,
    "createdAt": "2026-01-27T22:00:00.000Z"
  }
]
```

### Troubleshooting

#### Users Can't Login

**Issue:** Redirect loop or authentication error

**Solutions:**
1. Check `staticwebapp.config.json` routes are correct
2. Verify authentication is enabled in Azure Static Web App
3. Check browser console for errors
4. Clear browser cookies and try again

#### Data Not Saving

**Issue:** Changes don't persist after refresh

**Solutions:**
1. Verify SAS token is valid and not expired
2. Check SAS token has correct permissions (racwdl)
3. Verify storage account name is correct
4. Check browser console for CORS errors
5. Verify `event-attendance` container exists

#### Users Don't See Each Other

**Issue:** Partner dropdown is empty

**Solutions:**
1. Verify both users have joined the event
2. Check that users haven't already scheduled in selected round
3. Verify `attendees.json` contains both users
4. Check browser console for loading errors

#### Meetings Not Appearing

**Issue:** Scheduled meetings don't show in summaries

**Solutions:**
1. Check `meetings.json` file exists and is valid JSON
2. Verify meetings were successfully saved (check browser console)
3. Refresh the page to reload data
4. Check that users referenced in meetings are in attendees list

### Data Management

#### Reset Event

To start fresh:
1. In Azure Storage, delete `attendees.json` and `meetings.json`
2. Files will be recreated automatically when first user joins
3. OR manually upload empty arrays: `[]`

#### Backup Data

Regular backups recommended:
1. Download `attendees.json` and `meetings.json` from Azure Storage
2. Store in version control or backup system
3. Can restore by uploading files back to storage

#### Export Meetings

To export to Excel/CSV:
1. Download `meetings.json` from Azure Storage
2. Use online JSON to CSV converter
3. Or write custom export script using the data

### Security Considerations

1. **SAS Token Expiration**
   - Set reasonable expiration dates
   - Rotate tokens periodically
   - Never commit tokens to source control

2. **User Data**
   - Only user IDs and display names are stored
   - Email addresses stored in userDetails field
   - No passwords or sensitive data

3. **Access Control**
   - All users who can authenticate can join
   - No role-based restrictions implemented
   - Consider custom roles for admin features

4. **CORS**
   - Storage CORS configured automatically by SAS token
   - Ensure token scoped to your domain only

## Common Workflows

### Start of Event

1. Administrator announces event
2. Users authenticate and join event
3. Users schedule their meetings
4. Use summaries to verify all meetings scheduled

### During Event

1. Users reference "Per Persona" to see their schedule
2. Administrators check "Per Turno" for overview
3. Late arrivals can still join and schedule

### After Event

1. Download `meetings.json` for records
2. Optionally clear data for next event
3. Keep `event-title`, `event-description`, `event-date` in `app-data` container

### Handle Late Cancellation

If someone can't attend:
1. User logs in
2. Goes to "Partecipazione" tab
3. Clicks "Rimuovimi dall'Evento"
4. Their meetings are automatically freed
5. Partners can reschedule with others

## Support

For technical issues:
1. Check browser console for errors
2. Verify Azure configuration
3. Review AUTHENTICATION.md for detailed documentation
4. Check IMPLEMENTATION_SUMMARY.md for technical details
5. Open GitHub issue with error details
