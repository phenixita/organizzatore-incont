---
description: 'Build React components with Shadcn/ui and Tailwind patterns for this Vite+React 19 SPA'
tools: ['vscode', 'execute', 'read', 'agent', 'edit', 'search', 'web', 'todo']
---

# React UI Development Instructions

You are in React UI mode. Your primary objective is to create and modify React components following this project's established patterns. Follow this structured development process:

## Phase 1: Context Gathering

1. **Understand the Component Landscape**:
   - Review [src/App.tsx](src/App.tsx) for tab-based navigation structure and global state usage
   - Check [src/components/ui/](src/components/ui/) for available Shadcn primitives (card, button, select, badge, tabs, etc.)
   - Reference [src/lib/utils.ts](src/lib/utils.ts) for the `cn()` utility for class merging

2. **Identify Storage Needs**:
   - Use `useAzureStorage()` from [src/hooks/useAzureStorage.ts](src/hooks/useAzureStorage.ts) for any persisted data
   - Existing storage keys: `event-title`, `event-description`, `event-date`, `meetings`
   - Storage returns `[value, setValue]` tuple with automatic Azure Blob persistence

## Phase 2: Component Development

3. **Follow Component Patterns**:
   - Place business components in [src/components/](src/components/)
   - Use Phosphor icons (`@phosphor-icons/react`) with `weight="duotone"`
   - Import types from [src/lib/types.ts](src/lib/types.ts) - reuse `Meeting`, `PARTICIPANTS`
   - Use `sonner` toast for user feedback: `import { toast } from "sonner"`

4. **Apply Styling Conventions**:
   - Compose with Tailwind utilities, use `cn()` for conditional classes
   - Card-based layouts: `<Card>`, `<CardHeader>`, `<CardContent>`, `<CardTitle>`, `<CardDescription>`
   - Form controls: `<Select>`, `<SelectTrigger>`, `<SelectContent>`, `<SelectItem>`
   - Responsive text: `text-xs md:text-base`, spacing: `px-4 py-6 md:py-8`

## Phase 3: Integration

5. **Wire Up Data Flow**:
   ```tsx
   const [data, setData] = useAzureStorage<YourType>("your-key", defaultValue)
   // Update via setter - cache syncs automatically
   setData((prev) => [...prev, newItem])
   ```

6. **Validate Changes**:
   - Run `npm run dev` to test hot reload
   - Run `npm run lint` to check for ESLint errors
   - Run `npm run build` to verify TypeScript compilation

## Phase 4: Quality Checks

7. **Error Handling**:
   - App has global `ErrorBoundary` with [src/ErrorFallback.tsx](src/ErrorFallback.tsx)
   - Use try/catch in async operations, toast errors to user
   - Handle loading states from storage hooks gracefully

8. **Final Report**:
   - Summarize component purpose and API
   - Document any new storage keys introduced
   - List any new dependencies if added

## React UI Guidelines
- **Path Aliases**: Always import with `@/` prefix (e.g., `@/components/ui/button`)
- **Component Files**: PascalCase naming, `.tsx` extension, default export
- **State Management**: Local state + useAzureStorage for persistence, no Redux needed
- **Italian UI**: User-facing text should be in Italian (this is an Italian meeting organizer)
- **Mobile First**: Design for mobile, enhance for desktop with `md:` breakpoints

Remember: Check [src/components/AddMeeting.tsx](src/components/AddMeeting.tsx) as the canonical example of form handling, validation, and storage integration.
