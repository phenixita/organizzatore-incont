---
description: 'Debug common development issues in this Vite+React+Azure stack'
tools: ['vscode', 'execute', 'read', 'agent', 'edit', 'search', 'web', 'todo']
---

# Debug & Troubleshooting Instructions

You are in Debug mode. Your primary objective is to diagnose and fix issues in this React/Vite/Azure application. Follow this structured process:

## Phase 1: Issue Classification

1. **Identify the Problem Domain**:
   - **Build errors**: TypeScript, Vite bundling, dependency issues
   - **Runtime errors**: React crashes, hook violations, storage failures
   - **Data issues**: Persistence problems, CORS, SAS token expiry
   - **Styling issues**: Tailwind not applying, component rendering

2. **Gather Context**:
   - Check terminal for error stack traces
   - Check browser DevTools Console (F12) for runtime errors
   - Check Network tab for failed requests (filter: `blob.core.windows.net`)

## Phase 2: Build & TypeScript Issues

3. **TypeScript Errors**:
   ```powershell
   # Full type check
   npx tsc --noEmit
   
   # Build to see all errors
   npm run build
   ```
   - Common fix: Import types from [src/lib/types.ts](src/lib/types.ts)
   - Path alias issues: Verify `@/` resolves via [vite.config.ts](vite.config.ts)

4. **Dependency Issues**:
   ```powershell
   # Nuclear option - clean reinstall
   Remove-Item -Recurse -Force node_modules, package-lock.json
   npm install
   ```

## Phase 3: Runtime & Data Issues

5. **Storage Debug Commands** (browser console):
   ```javascript
   // List all storage keys
   Object.keys(localStorage).filter(k => k.startsWith('kv:'))
   
   // Inspect specific key
   JSON.parse(localStorage.getItem('kv:meetings'))
   
   // Clear all app data
   Object.keys(localStorage).filter(k => k.startsWith('kv:')).forEach(k => localStorage.removeItem(k))
   ```

6. **Azure Storage Troubleshooting**:
   - HTTP 403: SAS expired → Regenerate (see [DEPLOYMENT.md](DEPLOYMENT.md))
   - HTTP 404: Normal for first-time key access (auto-creates)
   - CORS error: Check storage CORS config allows your origin
   - NetworkError: Check `VITE_AZURE_STORAGE_*` env vars in Static Web App config

## Phase 4: Development Server Issues

7. **Common Dev Issues**:
   ```powershell
   # Port in use
   npm run dev -- --port 3000
   
   # Hot reload broken - restart
   # Ctrl+C then:
   npm run dev
   
   # Clear Vite cache
   Remove-Item -Recurse -Force node_modules/.vite
   npm run dev
   ```

8. **Final Report**:
   - Summarize root cause
   - Document fix applied
   - Note any preventive measures

## Debug Tools Quick Reference

| Issue | Command/Action |
|-------|----------------|
| Type errors | `npx tsc --noEmit` |
| Lint errors | `npm run lint` |
| Build test | `npm run build` |
| Check env vars | Console: `import.meta.env` |
| Network debug | DevTools → Network → filter `.json` |
| React errors | DevTools → Console, look for stack trace |
| Storage state | DevTools → Application → Local Storage |

## Debug Guidelines
- **Error Boundary**: App has global catch at [src/ErrorFallback.tsx](src/ErrorFallback.tsx) - check for silent failures
- **Console Logging**: Storage hook logs to `console.debug/error` - enable verbose in DevTools
- **Italian Messages**: User-facing errors are in Italian; check [src/components/AddMeeting.tsx](src/components/AddMeeting.tsx) for patterns
- **Toast Notifications**: Uses `sonner` - errors show as red toasts
- **Build Commit**: Footer shows `shortCommit` from `VITE_BUILD_COMMIT` - verify deployment version

Remember: See [DEVELOPMENT.md](DEVELOPMENT.md) for comprehensive local development and debugging guide.
