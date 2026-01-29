# Copilot instructions

## Big picture
- Vite + React 19 single-page app with tabs for core flows: add meeting, summary by round, summary by person, participants list. Entry is [src/main.tsx](src/main.tsx) and UI composition lives in [src/App.tsx](src/App.tsx).
- All persisted data goes through the Azure Blob Storage key/value hook `useAzureStorage()` in [src/hooks/useAzureStorage.ts](src/hooks/useAzureStorage.ts). Each key is stored as `<key>.json` in a container and cached in-memory.

## Data model & rules
- Meeting domain types live in [src/lib/types.ts](src/lib/types.ts) (`Meeting`, `PARTICIPANTS`). Reuse these rather than creating duplicate types.
- Meeting constraints are centralized in [src/lib/meeting-utils.ts](src/lib/meeting-utils.ts) (no duplicate pairs in a round, no pair across rounds, one meeting per person per round). Use these helpers when adding or editing scheduling logic.
- Current storage keys used by the UI: `event-title`, `event-description`, `event-date`, `meetings` (see [src/App.tsx](src/App.tsx) and [src/components/AddMeeting.tsx](src/components/AddMeeting.tsx)).

## Storage integration
- Azure Storage config is sourced from Vite env vars: `VITE_AZURE_STORAGE_ACCOUNT`, `VITE_AZURE_STORAGE_CONTAINER`, `VITE_AZURE_STORAGE_SAS` (see [src/hooks/useAzureStorage.ts](src/hooks/useAzureStorage.ts)).
- `useAzureStorage()` handles read/write; it auto-creates missing blobs with the provided default and logs errors. Prefer updating via the setter returned by the hook so cache stays in sync.

## UI patterns
- UI primitives are Shadcn-style components under [src/components/ui](src/components/ui). Compose with Tailwind utility classes; use `cn()` from [src/lib/utils.ts](src/lib/utils.ts) for class merging.
- Error handling uses a global `ErrorBoundary` with a custom fallback in [src/ErrorFallback.tsx](src/ErrorFallback.tsx).

## Dev workflows
- Local dev: `npm install` then `npm run dev` (Vite). Other scripts: `npm run build`, `npm run lint`, `npm run preview` (see [package.json](package.json)).
- Azure deployment scripts and infra live in [infrastructure](infrastructure) with Bicep templates and deploy scripts; Static Web Apps config is in [staticwebapp.config.json](staticwebapp.config.json).

## Conventions to follow
- Keep scheduling logic in `lib/meeting-utils` and UI in `src/components`.
- When adding new persisted settings, use `useAzureStorage()` with a stable key and default value, and update any UI to read via the hook rather than direct fetch.
- The build commit shown in the footer reads `VITE_BUILD_COMMIT` / `VITE_GIT_COMMIT` in [src/App.tsx](src/App.tsx); keep this pattern if you extend build metadata.
